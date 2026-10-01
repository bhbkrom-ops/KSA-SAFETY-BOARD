/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

const clean=(v:unknown,max=1000)=>typeof v==="string"?v.trim().slice(0,max):"";
const fail=(error:string,status=422)=>Response.json({ok:false,error},{status});
const adminRoles=new Set(["super_admin","hse_manager"]);
const canAdmin=(role:string)=>adminRoles.has(role);
async function audit(client:any,actor:string,event_type:string,entity_type:string,entity_id?:string|null,new_data?:unknown){await client.from("audit_logs").insert({actor_id:actor,event_type,entity_type,entity_id:entity_id||null,new_data:new_data||null});}
async function proxyAdminUsers(request:NextRequest,method:string,body?:unknown){
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL; if(!base)return fail("Supabase URL is not configured.",500);
  const auth=request.headers.get("authorization"); if(!auth)return fail("Authentication is required.",401);
  const response=await fetch(`${base}/functions/v1/admin-users`,{method,headers:{Authorization:auth,"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
  const raw=await response.text(); let parsed:any={}; try{parsed=raw?JSON.parse(raw):{}}catch{return fail(`admin-users returned a non-JSON response (${response.status}).`,502)}
  if(!response.ok||parsed.ok===false)return fail(parsed.error||"User administration failed.",response.status||502);return Response.json({ok:true,data:parsed.data});
}
export async function GET(request:NextRequest){
  const auth=await requireAuth(request); if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("Administration access requires HSE staff.",403);const db=auth.client as any;
  const resource=request.nextUrl.searchParams.get("resource");
  if(resource==="users"){
    const proxied=await proxyAdminUsers(request,"GET"); if(!proxied.ok)return proxied; const users=await proxied.json();
    const [{data:roles,error:rErr},{data:permissions,error:pErr},{data:rolePermissions,error:rpErr}]=await Promise.all([db.from("roles").select("id,code,name,description").order("name"),db.from("permissions").select("id,code,description").order("code"),db.from("role_permissions").select("role_id,permission_id")]);
    if(rErr||pErr||rpErr)return fail(rErr?.message||pErr?.message||rpErr?.message||"Role catalog unavailable.",500);
    return Response.json({ok:true,data:{profiles:users.data||[],roles:roles||[],permissions:permissions||[],role_permissions:rolePermissions||[],can_admin_users:canAdmin(auth.profile.role_code)}});
  }
  if(resource==="activity"){const {data,error}=await db.from("audit_logs").select("id,actor_id,event_type,entity_type,entity_id,new_data,previous_data,created_at,actor:profiles!audit_logs_actor_id_fkey(display_name,email)").order("created_at",{ascending:false}).limit(500);if(error)return fail(error.message,500);return Response.json({ok:true,data:data||[]});}
  if(resource==="plants"){const {data,error}=await db.from("sites").select("id,name,name_ar,code,manager_name,location,industry,status,timezone,archived_at,created_at").order("name");if(error)return fail(error.message,500);return Response.json({ok:true,data:data||[]});}
  if(resource==="settings"){const {data,error}=await db.from("system_settings").select("key,value,updated_at,updated_by").order("key");if(error)return fail(error.message,500);return Response.json({ok:true,data:data||[]});}
  if(resource==="integrations"){
    const {data,error}=await db.from("notification_outbox").select("status").limit(1000);if(error)return fail(error.message,500);
    const out=(data||[]).reduce((a:any,r:any)=>(a[r.status]=(a[r.status]||0)+1,a),{});
    const {data:settings}=await db.from("system_settings").select("value").eq("key","integrations").maybeSingle();
    return Response.json({ok:true,data:{providers:{email:{ready:Boolean(process.env.EMAIL_PROVIDER_API_KEY&&process.env.EMAIL_FROM_ADDRESS),source:"Vercel environment"},whatsapp:{ready:Boolean(process.env.WHATSAPP_ACCESS_TOKEN),source:"Vercel environment"},teams:{ready:Boolean(process.env.TEAMS_WEBHOOK_URL),source:"Vercel environment"},in_app:{ready:true,source:"Supabase notification outbox"}},outbox:out,settings:settings?.value||{}}});
  }
  if(resource==="system-readiness"){
    const counts:any={}; for(const table of ["profiles","audit_logs","sites","notification_outbox","live_meetings","vision_cameras"]){const {count,error}=await db.from(table).select("*",{count:"exact",head:true});counts[table]={ok:!error,detail:error?.message||`${count||0} records`};}
    return Response.json({ok:true,data:{checks:{database:{ok:true,detail:"Authenticated Supabase data access"},authentication:{ok:true,detail:`Authenticated as ${auth.profile.role_code}`},mfa:{ok:true,detail:"Supabase Auth supports MFA; privileged enforcement remains policy-governed"},live_meeting:counts.live_meetings,vision:counts.vision_cameras,notifications:counts.notification_outbox,email:{ok:Boolean(process.env.EMAIL_PROVIDER_API_KEY&&process.env.EMAIL_FROM_ADDRESS),detail:"Server-side provider readiness"},monthly_report_cron:{ok:Boolean(process.env.CRON_SECRET),detail:process.env.CRON_SECRET?"Cron secret configured":"Cron secret not configured"}},counts}});
  }
  return fail("A valid administration resource is required.",400);
}
export async function POST(request:NextRequest){
  const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("Administration changes require HSE staff.",403);const db=auth.client as any;
  const resource=request.nextUrl.searchParams.get("resource");const body=await request.json().catch(()=>({})) as Record<string,unknown>;
  if(resource==="users"){if(!canAdmin(auth.profile.role_code))return fail("User administration requires Super Admin or HSE Manager.",403);return proxyAdminUsers(request,"POST",body);}
  if(resource==="plants"){if(!canAdmin(auth.profile.role_code))return fail("Facility changes require Super Admin or HSE Manager.",403);const name=clean(body.name,160),code=clean(body.code,40);if(!name||!code)return fail("Site name and code are required.");const payload={name,code,name_ar:clean(body.name_ar,160)||null,manager_name:clean(body.manager_name,160)||null,location:clean(body.location,240)||null,industry:clean(body.industry,120)||null,status:clean(body.status,20)||"active",timezone:clean(body.timezone,80)||"Asia/Riyadh"};const {data,error}=await db.from("sites").insert(payload).select("*").single();if(error||!data)return fail(error?.message||"Site could not be created.",422);await audit(db,auth.user.id,"site.created","site",data.id,data);return Response.json({ok:true,data},{status:201});}
  if(resource==="settings"){
    if(!canAdmin(auth.profile.role_code))return fail("Settings changes require Super Admin or HSE Manager.",403);
    const action=request.nextUrl.searchParams.get("action");
    if(action==="branding-upload"){
      const fileName=clean(body.file_name,180),mime=clean(body.mime_type,100);
      const allowed=["image/png","image/jpeg","image/webp","image/svg+xml"];
      if(!fileName||!allowed.includes(mime))return fail("A supported PNG, JPEG, WEBP, or SVG logo is required.",422);
      const safeName=fileName.replace(/[^a-zA-Z0-9._-]+/g,"-").slice(-120);
      const path=`logos/${Date.now()}-${crypto.randomUUID().slice(0,8)}-${safeName}`;
      const signed=await auth.client.storage.from("branding-assets").createSignedUploadUrl(path);
      if(signed.error||!signed.data)return fail(signed.error?.message||"Signed upload URL could not be created.",422);
      const publicUrl=auth.client.storage.from("branding-assets").getPublicUrl(path).data.publicUrl;
      await audit(db,auth.user.id,"branding.upload_authorized","storage_object",null,{bucket:"branding-assets",path,mime});
      return Response.json({ok:true,data:{bucket:"branding-assets",path,token:signed.data.token,public_url:publicUrl}});
    }
    if(action==="restore-config"){
      const snapshot=body.snapshot;
      if(!snapshot||typeof snapshot!=="object"||Array.isArray(snapshot))return fail("A valid configuration snapshot is required.",422);
      const allowedKeys=new Set(["branding","backgrounds","integrations","document_numbering","qr","print_templates"]);
      const entries=Object.entries(snapshot as Record<string,unknown>).filter(([key])=>allowedKeys.has(key));
      if(!entries.length)return fail("Snapshot contains no supported configuration keys.",422);
      for(const [key,value] of entries){
        if(!value||typeof value!=="object"||Array.isArray(value))return fail(`Invalid value for ${key}.`,422);
        const raw=JSON.stringify(value);
        if(raw.includes("data:image")||raw.includes(";base64,")||/password|secret|api[_-]?key|token/i.test(raw))return fail("Snapshots may not contain secrets or Base64 assets.",422);
      }
      const payload=entries.map(([key,value])=>({key,value,updated_by:auth.user.id,updated_at:new Date().toISOString()}));
      const {data,error}=await db.from("system_settings").upsert(payload).select("key,value,updated_at");
      if(error)return fail(error.message,422);
      await audit(db,auth.user.id,"settings.configuration_restored","system_setting",null,{keys:entries.map(([key])=>key)});
      return Response.json({ok:true,data:data||[]});
    }
  }
  if(resource==="integrations"){
    if(!canAdmin(auth.profile.role_code))return fail("Integration controls require Super Admin or HSE Manager.",403);
    const action=request.nextUrl.searchParams.get("action");
    if(action==="retry-failed"){const {data,error}=await db.from("notification_outbox").update({status:"pending",next_attempt_at:new Date().toISOString(),last_error:null}).in("status",["failed","dead_letter"]).select("id");if(error)return fail(error.message,500);await audit(db,auth.user.id,"notification.retry_requested","notification_outbox",null,{count:data?.length||0});return Response.json({ok:true,data:{retried:data?.length||0}});}
    if(action==="test"){const provider=clean(body.provider,30);const ready=provider==="email"?Boolean(process.env.EMAIL_PROVIDER_API_KEY&&process.env.EMAIL_FROM_ADDRESS):provider==="whatsapp"?Boolean(process.env.WHATSAPP_ACCESS_TOKEN):provider==="teams"?Boolean(process.env.TEAMS_WEBHOOK_URL):provider==="in_app";if(!["email","whatsapp","teams","in_app"].includes(provider))return fail("Unknown provider.",422);await audit(db,auth.user.id,"integration.tested","integration",null,{provider,ready});return Response.json({ok:true,data:{provider,ready,message:ready?"Provider configuration is present.":"Provider configuration is incomplete."}});}
    if(action==="process-outbox"){const {data:pending,error:pErr}=await db.from("notification_outbox").select("id,recipient_id,channel,payload").eq("status","pending").order("created_at",{ascending:true}).limit(100);if(pErr)return fail(pErr.message,500);let sent=0,external_pending=0;for(const item of pending||[]){if(item.channel!=="in_app"){external_pending++;continue;}if(!item.recipient_id){await db.from("notification_outbox").update({status:"failed",last_error:"In-app notification requires recipient_id",attempt_count:1,updated_at:new Date().toISOString()}).eq("id",item.id);continue;}const payload=(item.payload||{}) as any;const {error:nErr}=await db.from("notifications").insert({recipient_id:item.recipient_id,title:String(payload.title||"HSE notification").slice(0,240),body:payload.body?String(payload.body).slice(0,2000):null,severity:["low","medium","high","critical"].includes(payload.severity)?payload.severity:"medium",entity_type:payload.entity_type?String(payload.entity_type).slice(0,80):null,entity_id:payload.entity_id||null});if(nErr){await db.from("notification_outbox").update({status:"failed",last_error:nErr.message,attempt_count:1,updated_at:new Date().toISOString()}).eq("id",item.id);continue;}await db.from("notification_outbox").update({status:"sent",sent_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()}).eq("id",item.id);sent++;}await audit(db,auth.user.id,"notification.outbox_processed","notification_outbox",null,{sent,external_pending});return Response.json({ok:true,data:{sent,external_pending}});}
    if(action==="save"){const config=body.config;if(!config||typeof config!=="object")return fail("Integration configuration is required.",422);const safe=JSON.stringify(config);if(/token|secret|password|api[_-]?key/i.test(safe))return fail("Secrets must be configured in Vercel environment variables, not application settings.",422);const {data,error}=await db.from("system_settings").upsert({key:"integrations",value:config,updated_by:auth.user.id,updated_at:new Date().toISOString()}).select("*").single();if(error)return fail(error.message,422);await audit(db,auth.user.id,"integrations.updated","system_setting",null,{key:"integrations"});return Response.json({ok:true,data});}
  }
  return fail("This administration operation is not supported.",400);
}
export async function PATCH(request:NextRequest){
  const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("Administration changes require HSE staff.",403);const db=auth.client as any;
  const resource=request.nextUrl.searchParams.get("resource");const body=await request.json().catch(()=>null) as Record<string,unknown>|null;if(!body)return fail("A JSON body is required.",400);
  if(resource==="users"){if(!canAdmin(auth.profile.role_code))return fail("User administration requires Super Admin or HSE Manager.",403);return proxyAdminUsers(request,"PATCH",body);}
  if(resource==="plants"){if(!canAdmin(auth.profile.role_code))return fail("Facility changes require Super Admin or HSE Manager.",403);const id=clean(body.id,80),name=clean(body.name,160),code=clean(body.code,40);if(!id||!name||!code)return fail("Site ID, name, and code are required.",422);const patch={name,code,name_ar:clean(body.name_ar,160)||null,manager_name:clean(body.manager_name,160)||null,location:clean(body.location,240)||null,industry:clean(body.industry,120)||null,status:clean(body.status,20)||"active",timezone:clean(body.timezone,80)||"Asia/Riyadh"};const {data,error}=await db.from("sites").update(patch).eq("id",id).select("*").single();if(error||!data)return fail(error?.message||"Site could not be updated.",422);await audit(db,auth.user.id,"site.updated","site",id,patch);return Response.json({ok:true,data});}
  if(resource==="permissions"){if(!canAdmin(auth.profile.role_code))return fail("Permission matrix changes require Super Admin or HSE Manager.",403);const roleId=clean(body.role_id,80),permissionId=clean(body.permission_id,80),enabled=Boolean(body.enabled);if(!roleId||!permissionId)return fail("Role and permission are required.",422);let dbError:any=null;if(enabled){const result=await db.from("role_permissions").upsert({role_id:roleId,permission_id:permissionId});dbError=result.error;}else{const result=await db.from("role_permissions").delete().eq("role_id",roleId).eq("permission_id",permissionId);dbError=result.error;}if(dbError)return fail(dbError.message,422);await audit(db,auth.user.id,"permission_matrix.updated","role_permission",null,{role_id:roleId,permission_id:permissionId,enabled});return Response.json({ok:true,data:{role_id:roleId,permission_id:permissionId,enabled}});}
  if(resource==="settings"){if(!canAdmin(auth.profile.role_code))return fail("Settings changes require Super Admin or HSE Manager.",403);const key=clean(body.key,100);const value=body.value;if(!key||!value||typeof value!=="object")return fail("Setting key and JSON object value are required.");const json=JSON.stringify(value);if(json.includes("data:image")||json.includes(";base64,"))return fail("Base64 assets are not permitted in settings.");const logo=(value as any).logo_url;if(logo&&typeof logo==="string"&&!(logo.startsWith("/")||logo.startsWith("https://")))return fail("Logo must use an internal path or HTTPS URL.");const {data,error}=await db.from("system_settings").upsert({key,value,updated_by:auth.user.id,updated_at:new Date().toISOString()}).select("*").single();if(error||!data)return fail(error?.message||"Setting could not be saved.",422);await audit(db,auth.user.id,"setting.updated","system_setting",null,{key});return Response.json({ok:true,data});}
  return fail("This administration operation is not supported.",400);
}
