/* eslint-disable @typescript-eslint/no-explicit-any */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET,POST,PATCH,OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),authorization=req.headers.get("Authorization");
  if(!url||!anon||!service)return json({ok:false,error:"Function environment is incomplete."},500);
  if(!authorization?.startsWith("Bearer "))return json({ok:false,error:"Authentication is required."},401);
  const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const {data:userData}=await caller.auth.getUser();const user=userData.user;if(!user)return json({ok:false,error:"Invalid session."},401);
  const {data:profile}=await caller.from("profiles").select("role_code,is_active").eq("id",user.id).maybeSingle();
  if(!profile?.is_active||!["super_admin","hse_manager"].includes(profile.role_code))return json({ok:false,error:"User administration requires Super Admin or HSE Manager."},403);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  if(req.method==="GET"){
    const {data:profiles,error}=await admin.from("profiles").select("id,display_name,email,role_code,is_active,department_id,site_id,created_at,updated_at").order("created_at",{ascending:false});if(error)return json({ok:false,error:error.message},500);
    const {data:authUsers,error:authError}=await admin.auth.admin.listUsers({page:1,perPage:1000});if(authError)return json({ok:false,error:authError.message},500);
    const map=new Map(authUsers.users.map(u=>[u.id,u]));
    return json({ok:true,data:(profiles||[]).map(p=>({...p,last_sign_in_at:map.get(p.id)?.last_sign_in_at||null,mfa_enrolled:Boolean((map.get(p.id) as any)?.factors?.length)}))});
  }
  const body=await req.json().catch(()=>null) as any;if(!body)return json({ok:false,error:"JSON body required."},400);
  if(req.method==="POST"){
    const email=String(body.email||"").trim().toLowerCase(),password=String(body.password||""),display=String(body.display_name||"").trim(),role=String(body.role_code||"viewer");
    if(!email||password.length<12)return json({ok:false,error:"Email and a temporary password of at least 12 characters are required."},422);
    const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:display||email.split("@")[0]}});if(error||!data.user)return json({ok:false,error:error?.message||"User could not be created."},422);
    const {error:pError}=await admin.from("profiles").update({display_name:display||email.split("@")[0],email,role_code:role,is_active:true,updated_at:new Date().toISOString()}).eq("id",data.user.id);if(pError)return json({ok:false,error:pError.message},422);
    await admin.from("audit_logs").insert({actor_id:user.id,event_type:"user.created",entity_type:"profile",entity_id:data.user.id,new_data:{email,role_code:role}});
    return json({ok:true,data:{id:data.user.id,email,role_code:role}},201);
  }
  if(req.method==="PATCH"){
    const id=String(body.id||"");if(!id)return json({ok:false,error:"User ID is required."},422);
    const patch:any={updated_at:new Date().toISOString()};if(body.display_name!==undefined)patch.display_name=String(body.display_name).trim();if(body.role_code!==undefined)patch.role_code=String(body.role_code);if(body.is_active!==undefined)patch.is_active=Boolean(body.is_active);
    const {data,error}=await admin.from("profiles").update(patch).eq("id",id).select("id,display_name,email,role_code,is_active,updated_at").single();if(error)return json({ok:false,error:error.message},422);
    await admin.from("audit_logs").insert({actor_id:user.id,event_type:"user.updated",entity_type:"profile",entity_id:id,new_data:patch});
    return json({ok:true,data});
  }
  return json({ok:false,error:"Method not allowed."},405);
});
