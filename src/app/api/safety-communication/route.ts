/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { isAuthContext, requireAuth } from "@/lib/server-auth";
const config: Record<string,{table:string;select:string}> = {
 departments:{table:"departments",select:"id,name,code,reporting_department_id,archived_at,created_at"}, posts:{table:"hse_posts",select:"id,title,body,status,audience,department_id,published_at,archived_at,created_by,created_at,updated_at"}, rules:{table:"notification_rules",select:"id,name,event_type,severity,channel,recipient,is_active,created_by,updated_by,created_at,updated_at"}, channels:{table:"safety_radio_channels",select:"id,name,channel_type,is_active,created_by,created_at"}, inbox:{table:"notifications",select:"id,recipient_id,title,body,severity,is_read,entity_type,entity_id,created_at"}, points:{table:"gamification_points_ledger",select:"id,user_id,points,reason,source_type,source_id,period,created_at"}, badges:{table:"gamification_badges",select:"id,code,name,description,criteria,is_active,created_at"}, awards:{table:"gamification_awards",select:"id,user_id,badge_id,awarded_at,source_type,source_id"},
};
const clean=(v:unknown,n=500)=>typeof v === "string" ? v.trim().slice(0,n) : "";
const fail=(message:string,status=422)=>Response.json({ok:false,error:message},{status});
export async function GET(request:NextRequest){const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;const resource=clean(request.nextUrl.searchParams.get("resource"),40);if(resource==="email-settings")return Response.json({ok:true,data:{status:process.env.EMAIL_PROVIDER_API_KEY?"configured":"not_configured",ready:Boolean(process.env.EMAIL_PROVIDER_API_KEY),required_variables:["EMAIL_PROVIDER_API_KEY","EMAIL_FROM_ADDRESS"],secrets_storage:"Vercel",browser_passwords:"Disabled",configuration_source:"Server environment"}});if(resource==="champions"){const {data,error}=await (auth.client as any).from("gamification_points_ledger").select("user_id,points,period,profiles:profiles(display_name,department_id)").order("points",{ascending:false}).limit(100);if(error)return fail(error.message,500);const rows=(data??[]).reduce((acc:any[],row:any)=>{const found=acc.find(x=>x.user_id===row.user_id);if(found)found.points+=row.points;else acc.push({user_id:row.user_id,display_name:row.profiles?.display_name??"Safety champion",points:row.points,period:row.period});return acc;},[]);return Response.json({ok:true,data:rows});}if(!config[resource])return fail("A valid communication resource is required.",400);let query=(auth.client as any).from(config[resource].table).select(config[resource].select).order(resource==="inbox"?"created_at":"updated_at",{ascending:false}).limit(250);if(resource==="inbox"&&request.nextUrl.searchParams.get("filter")==="unread")query=query.eq("is_read",false);const {data,error}=await query;if(error)return fail(error.message,500);return Response.json({ok:true,data:data??[]});}
export async function POST(request:NextRequest){const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("Communication changes require HSE staff access.",403);const resource=clean(request.nextUrl.searchParams.get("resource"),40);const body=await request.json().catch(()=>null) as Record<string,unknown>|null;if(!body)return fail("A JSON body is required.",400);if(resource==="radio")return radioAction(auth,body,"create-channel");if(!config[resource]||resource==="inbox"||resource==="awards")return fail("This resource cannot be created here.",400);const payload:any={...body};delete payload.id;payload.created_by=auth.user.id;if(resource==="departments"&&!clean(payload.name))return fail("Department name is required.");if(resource==="posts"&&(!clean(payload.title)||!clean(payload.body)))return fail("Post title and body are required.");if(resource==="rules"&&(!clean(payload.name)||!clean(payload.event_type)||!clean(payload.recipient)))return fail("Rule name, event type, and recipient are required.");const {data,error}=await (auth.client as any).from(config[resource].table).insert(payload).select(config[resource].select).single();if(error)return fail(error.message,422);return Response.json({ok:true,data},{status:201});}
export async function PATCH(request:NextRequest){const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;const resource=clean(request.nextUrl.searchParams.get("resource"),40);const body=await request.json().catch(()=>null) as Record<string,unknown>|null;const id=clean(body?.id,80);if(resource==="radio")return radioAction(auth,body??{},"heartbeat-floor");if(!auth.isStaff)return fail("Communication changes require HSE staff access.",403);if(!config[resource]||!id)return fail("Resource and record ID are required.",422);const patch:any={...body,updated_by:auth.user.id,updated_at:new Date().toISOString()};delete patch.id;const {data,error}=await (auth.client as any).from(config[resource].table).update(patch).eq("id",id).select(config[resource].select).single();if(error)return fail(error.message,422);return Response.json({ok:true,data});}
export async function DELETE(request:NextRequest){const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("Communication changes require HSE staff access.",403);const resource=clean(request.nextUrl.searchParams.get("resource"),40);const id=clean(request.nextUrl.searchParams.get("id"),80);if(resource==="radio")return radioAction(auth,{channel_id:id},"release-floor");if(resource==="inbox"){const {error}=await (auth.client as any).from("notifications").delete().eq("id",id);if(error)return fail(error.message,422);return Response.json({ok:true,data:{id,deleted:true}});}if(!config[resource]||!id)return fail("Resource and record ID are required.",422);const {error}=await (auth.client as any).from(config[resource].table).delete().eq("id",id);if(error)return fail(error.message,422);return Response.json({ok:true,data:{id,deleted:true}});}
async function radioAction(auth:any,body:Record<string,unknown>,fallback:string){
  const action=clean(body.action,40)||fallback;
  const channel=clean(body.channel_id,80);
  const privileged=["super_admin","hse_manager"].includes(auth.profile.role_code);
  if(action==="create-channel"){
    const name=clean(body.name,120),type=clean(body.channel_type,30)||"general";
    if(!name||!["general","private","emergency_public"].includes(type))return fail("Channel name and a supported channel type are required.",422);
    const {data,error}=await auth.client.from("safety_radio_channels").insert({name,channel_type:type,is_active:true,created_by:auth.user.id}).select("id,name,channel_type,is_active,created_by,created_at").single();
    if(error||!data)return fail(error?.message||"Radio channel could not be created.",422);
    const member=await auth.client.from("safety_radio_members").insert({channel_id:data.id,user_id:auth.user.id,added_by:auth.user.id});
    if(member.error)return fail(member.error.message,422);
    return Response.json({ok:true,data},{status:201});
  }
  if(action==="add-member"||action==="remove-member"){
    if(!channel)return fail("Channel ID is required.",422);
    const userId=clean(body.user_id,80);if(!userId)return fail("User ID is required.",422);
    const {data:ch,error:chErr}=await auth.client.from("safety_radio_channels").select("id,created_by").eq("id",channel).maybeSingle();
    if(chErr)return fail(chErr.message,500);if(!ch)return fail("Radio channel not found.",404);
    if(ch.created_by!==auth.user.id&&!privileged)return fail("Only the channel owner or HSE management can manage members.",403);
    if(action==="add-member"){
      const {data,error}=await auth.client.from("safety_radio_members").upsert({channel_id:channel,user_id:userId,added_by:auth.user.id}).select("*").single();
      if(error)return fail(error.message,422);return Response.json({ok:true,data});
    }
    const {error}=await auth.client.from("safety_radio_members").delete().eq("channel_id",channel).eq("user_id",userId);
    if(error)return fail(error.message,422);return Response.json({ok:true,data:{channel_id:channel,user_id:userId,removed:true}});
  }
  if(!channel)return fail("Channel ID is required.",422);
  const fn=action==="acquire-floor"?"radio_acquire_floor":action==="heartbeat-floor"?"radio_heartbeat_floor":action==="release-floor"?"radio_release_floor":null;
  if(!fn)return fail("Unsupported radio action.",400);
  const args=fn==="radio_release_floor"?{p_channel_id:channel}:{p_channel_id:channel,p_ttl_seconds:30};
  const {data,error}=await auth.client.rpc(fn,args);
  if(error)return fail(error.message,error.code==="42501"?403:409);
  return Response.json({ok:true,data});
}
