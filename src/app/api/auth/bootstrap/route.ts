import { NextRequest } from "next/server";
import { passwordPolicy,recordAuthEvent,serviceClient,tokenMatches } from "@/lib/auth-security";

const json=(body:unknown,status=200)=>Response.json(body,{status});
export async function GET(){
  try{
    const admin=serviceClient();
    const {data,error}=await admin.auth.admin.listUsers({page:1,perPage:1});
    if(error)return json({ok:false,error:"Bootstrap status is unavailable."},500);
    return json({ok:true,data:{bootstrap_required:data.users.length===0,bootstrap_configured:Boolean(process.env.BOOTSTRAP_ADMIN_TOKEN)}});
  }catch{return json({ok:false,error:"Bootstrap status is unavailable."},500);}
}
export async function POST(request:NextRequest){
  const body=await request.json().catch(()=>null) as {token?:string;email?:string;password?:string;display_name?:string}|null;
  const email=String(body?.email||"").trim().toLowerCase(),password=String(body?.password||""),display=String(body?.display_name||"").trim();
  try{
    const admin=serviceClient();
    const {data:list,error:listError}=await admin.auth.admin.listUsers({page:1,perPage:1});
    if(listError)return json({ok:false,error:"Bootstrap check failed."},500);
    if(list.users.length>0)return json({ok:false,error:"Initial administrator bootstrap is already closed."},409);
    const expected=process.env.BOOTSTRAP_ADMIN_TOKEN||"";
    if(expected.length<32||!tokenMatches(String(body?.token||""),expected)){
      await recordAuthEvent({request,event_type:"bootstrap.denied",success:false,email});
      return json({ok:false,error:"Bootstrap authorization failed."},403);
    }
    const policy=passwordPolicy(password,email);
    if(!email||!display||!policy.ok)return json({ok:false,error:"Valid name, email, and compliant password are required.",details:policy.failures},422);
    const {data:create,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:display}});
    if(createError||!create.user)return json({ok:false,error:createError?.message||"Administrator could not be created."},422);
    const {error:profileError}=await admin.from("profiles").upsert({id:create.user.id,display_name:display,email,role_code:"super_admin",is_active:true,updated_at:new Date().toISOString()});
    if(profileError){await admin.auth.admin.deleteUser(create.user.id);return json({ok:false,error:"Administrator profile could not be initialized."},500);}
    await admin.from("auth_security_state").upsert({user_id:create.user.id,failed_login_count:0,updated_at:new Date().toISOString()});
    await recordAuthEvent({request,event_type:"bootstrap.completed",success:true,user_id:create.user.id,email});
    return json({ok:true,data:{id:create.user.id,email,role_code:"super_admin"}},201);
  }catch{return json({ok:false,error:"Administrator bootstrap failed."},500);}
}
