import { NextRequest } from "next/server";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

const clean=(v:unknown,max=1000)=>typeof v==="string"?v.trim().slice(0,max):"";
const fail=(error:string,status=422)=>Response.json({ok:false,error},{status});
async function audit(client:any,actor:string,event_type:string,entity_type:string,entity_id?:string|null,new_data?:unknown){await client.from("audit_logs").insert({actor_id:actor,event_type,entity_type,entity_id:entity_id||null,new_data:new_data||null});}
async function proxyAdminUsers(request:NextRequest,method:string,body?:unknown){
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL; if(!base)return fail("Supabase URL is not configured.",500);
  const auth=request.headers.get("authorization"); if(!auth)return fail("Authentication is required.",401);
  const response=await fetch(`${base}/functions/v1/admin-users`,{method,headers:{Authorization:auth,"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
  const raw=await response.text(); let parsed:any={}; try{parsed=raw?JSON.parse(raw):{}}catch{return fail(`admin-users returned a non-JSON response (${response.status}).`,502)}
  if(!response.ok||parsed.ok===false)return fail(parsed.error||"User administration failed.",response.status||502);return Response.json({ok:true,data:parsed.data});
}
export async function GET(request:NextRequest){
  const auth=await requireAuth(request); if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("Administration access requires HSE staff.",403);
  const resource=request.nextUrl.searchParams.get("resource");
  if(resource==="users"){
    const proxied=await proxyAdminUsers(request,"GET"); if(!proxied.ok)return proxied; const users=await proxied.json();
    const [{data:roles,error:rErr},{data:permissions,error:pErr}]=await Promise.all([auth.client.from("roles").select("id,code,name,description").order("name"),auth.client.from("permissions").select("id,code,description").order("code")]);
    if(rErr||pErr)return fail(rErr?.message||pErr?.message||"Role catalog unavailable.",500);
    return Response.json({ok:true,data:{profiles:users.data||[],roles:roles||[],permissions:permissions||[]}});
  }
  if(resource==="activity"){const {data,error}=await auth.client.from("audit_logs").select("id,actor_id,event_type,entity_type,entity_id,new_data,previous_data,created_at,actor:profiles!audit_logs_actor_id_fkey(display_name,email)").order("created_at",{ascending:false}).limit(500);if(error)return fail(error.message,500);return Response.json({ok:true,data:data||[]});}
  if(resource==="plants"){const {data,error}=await auth.client.from("sites").select("id,name,name_ar,code,manager_name,location,industry,status,timezone,archived_at,created_at").order("name");if(error)return fail(error.message,500);return Response.json({ok:true,data:data||[]});}
  if(resource==="settings"){const {data,error}=await auth.client.from("system_settings").select("key,value,updated_at,updated_by").order("key");if(error)return fail(error.message,500);return Response.json({ok:true,data:data||[]});}
  if(resource==="integrations"){
    const {data,error}=await auth.client.from("notification_outbox").select("status").limit(1000);if(error)return fail(error.message,500);
    const out=(data||[]).reduce((a:any,r:any)=>(a[r.status]=(a[r.status]||0)+1,a),{});
    return Response.json({ok:true,data:{providers:{email:{ready:Boolean(process.env.EMAIL_PROVIDER_API_KEY&&process.env.EMAIL_FROM_ADDRESS),source:"Vercel environment"},whatsapp:{ready:Boolean(process.env.WHATSAPP_ACCESS_TOKEN),source:"Vercel environment"},teams:{ready:Boolean(process.env.TEAMS_WEBHOOK_URL),source:"Vercel environment"},in_app:{ready:true,source:"Supabase notification outbox"}},outbox:out}});
  }
  if(resource==="system-readiness"){
    const counts:any={}; for(const table of ["profiles","audit_logs","sites","notification_outbox","live_meetings","vision_cameras"]){const {count,error}=await auth.client.from(table).select("*",{count:"exact",head:true});counts[table]={ok:!error,detail:error?.message||`${count||0} records`};}
    return Response.json({ok:true,data:{checks:{database:{ok:true,detail:"Authenticated Supabase data access"},authentication:{ok:true,detail:`Authenticated as ${auth.profile.role_code}`},mfa:{ok:true,detail:"Supabase Auth supports MFA; privileged enforcement remains policy-governed"},live_meeting:counts.live_meetings,vision:counts.vision_cameras,notifications:counts.notification_outbox,email:{ok:Boolean(process.env.EMAIL_PROVIDER_API_KEY&&process.env.EMAIL_FROM_ADDRESS),detail:"Server-side provider readiness"},monthly_report_cron:{ok:Boolean(process.env.CRON_SECRET),detail:process.env.CRON_SECRET?"Cron secret configured":"Cron secret not configured"}},counts}});
  }
  return fail("A valid administration resource is required.",400);
}
export async function POST(request:NextRequest){
  const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("Administration changes require HSE staff.",403);
  const resource=request.nextUrl.searchParams.get("resource");const body=await request.json().catch(()=>({})) as Record<string,unknown>;
  if(resource==="users")return proxyAdminUsers(request,"POST",body);
  if(resource==="plants"){const name=clean(body.name,160),code=clean(body.code,40);if(!name||!code)return fail("Site name and code are required.");const payload={name,code,name_ar:clean(body.name_ar,160)||null,manager_name:clean(body.manager_name,160)||null,location:clean(body.location,240)||null,industry:clean(body.industry,120)||null,status:clean(body.status,20)||"active",timezone:clean(body.timezone,80)||"Asia/Riyadh"};const {data,error}=await auth.client.from("sites").insert(payload).select("*").single();if(error||!data)return fail(error?.message||"Site could not be created.",422);await audit(auth.client,auth.user.id,"site.created","site",data.id,data);return Response.json({ok:true,data},{status:201});}
  if(resource==="integrations"&&request.nextUrl.searchParams.get("action")==="retry-failed"){const {data,error}=await auth.client.from("notification_outbox").update({status:"pending",next_attempt_at:new Date().toISOString(),last_error:null}).in("status",["failed","dead_letter"]).select("id");if(error)return fail(error.message,500);await audit(auth.client,auth.user.id,"notification.retry_requested","notification_outbox",null,{count:data?.length||0});return Response.json({ok:true,data:{retried:data?.length||0}});}
  return fail("This administration operation is not supported.",400);
}
export async function PATCH(request:NextRequest){
  const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("Administration changes require HSE staff.",403);
  const resource=request.nextUrl.searchParams.get("resource");const body=await request.json().catch(()=>null) as Record<string,unknown>|null;if(!body)return fail("A JSON body is required.",400);
  if(resource==="users")return proxyAdminUsers(request,"PATCH",body);
  if(resource==="settings"){const key=clean(body.key,100);const value=body.value;if(!key||!value||typeof value!=="object")return fail("Setting key and JSON object value are required.");const json=JSON.stringify(value);if(json.includes("data:image")||json.includes(";base64,"))return fail("Base64 assets are not permitted in settings.");const logo=(value as any).logo_url;if(logo&&typeof logo==="string"&&!(logo.startsWith("/")||logo.startsWith("https://")))return fail("Logo must use an internal path or HTTPS URL.");const {data,error}=await auth.client.from("system_settings").upsert({key,value,updated_by:auth.user.id,updated_at:new Date().toISOString()}).select("*").single();if(error||!data)return fail(error?.message||"Setting could not be saved.",422);await audit(auth.client,auth.user.id,"setting.updated","system_setting",null,{key});return Response.json({ok:true,data});}
  return fail("This administration operation is not supported.",400);
}
