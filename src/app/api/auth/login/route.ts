import { NextRequest } from "next/server";
import { bearer,passwordPolicy,PRIVILEGED_ROLES,publicAuthClient,recordAuthEvent,safeNext,serviceClient } from "@/lib/auth-security";

const json=(body:unknown,status=200)=>Response.json(body,{status});
const genericLoginError="The email, password, or account state could not be verified.";

export async function POST(request:NextRequest){
  const action=request.nextUrl.searchParams.get("action")||"login";
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  if(!body)return json({ok:false,error:"JSON body required."},400);

  if(action==="password-check"){
    const result=passwordPolicy(String(body.password||""),String(body.email||""));
    return json({ok:true,data:result});
  }

  if(action==="login"){
    const email=String(body.email||"").trim().toLowerCase(),password=String(body.password||"");
    if(!email||!password)return json({ok:false,error:genericLoginError},401);
    try{
      const admin=serviceClient();
      const {data:profile}=await admin.from("profiles").select("id,email,role_code,is_active").eq("email",email).maybeSingle();
      const {data:security}=profile?.id?await admin.from("auth_security_state").select("*").eq("user_id",profile.id).maybeSingle():{data:null};
      if(security?.locked_until&&new Date(security.locked_until).getTime()>Date.now()){
        await recordAuthEvent({request,event_type:"login.locked",success:false,user_id:profile?.id,email});
        return json({ok:false,error:"Sign-in is temporarily locked. Try again later."},423);
      }
      const auth=publicAuthClient();
      const {data,error}=await auth.auth.signInWithPassword({email,password});
      if(error||!data.session||!data.user){
        if(profile?.id){
          const failures=Number(security?.failed_login_count||0)+1;
          const locked=failures>=5?new Date(Date.now()+15*60*1000).toISOString():null;
          await admin.from("auth_security_state").upsert({user_id:profile.id,failed_login_count:failures,locked_until:locked,last_failed_at:new Date().toISOString(),updated_at:new Date().toISOString()});
        }
        await recordAuthEvent({request,event_type:"login.failed",success:false,user_id:profile?.id,email});
        return json({ok:false,error:genericLoginError},401);
      }
      const {data:actualProfile}=await admin.from("profiles").select("id,display_name,email,role_code,is_active").eq("id",data.user.id).maybeSingle();
      if(!actualProfile?.is_active){
        await auth.auth.signOut();
        await recordAuthEvent({request,event_type:"login.inactive",success:false,user_id:data.user.id,email});
        return json({ok:false,error:genericLoginError},403);
      }
      await admin.from("auth_security_state").upsert({user_id:data.user.id,failed_login_count:0,locked_until:null,last_success_at:new Date().toISOString(),updated_at:new Date().toISOString()});
      const {data:aal}=await auth.auth.mfa.getAuthenticatorAssuranceLevel();
      const {data:factors}=await auth.auth.mfa.listFactors();
      const verifiedTotp=(factors?.totp||[]).filter(f=>f.status==="verified");
      const mfaRequired=PRIVILEGED_ROLES.has(actualProfile.role_code);
      await recordAuthEvent({request,event_type:"login.succeeded",success:true,user_id:data.user.id,email,metadata:{role:actualProfile.role_code,aal:aal?.currentLevel||"aal1"}});
      return json({ok:true,data:{
        session:{access_token:data.session.access_token,refresh_token:data.session.refresh_token,expires_at:data.session.expires_at},
        profile:actualProfile,mfa_required:mfaRequired,mfa_verified:aal?.currentLevel==="aal2",
        mfa_enrollment_required:mfaRequired&&verifiedTotp.length===0,verified_factor_ids:verifiedTotp.map(f=>f.id),
        next:safeNext(body.next)
      }});
    }catch{return json({ok:false,error:"Authentication service is unavailable."},503);}
  }

  if(action==="signup"){
    if(process.env.AUTH_SIGNUP_ENABLED!=="true")return json({ok:false,error:"Self-service signup is disabled."},403);
    const email=String(body.email||"").trim().toLowerCase(),password=String(body.password||""),display=String(body.display_name||"").trim();
    const policy=passwordPolicy(password,email);
    if(!email||!display||!policy.ok)return json({ok:false,error:"Account details do not meet the access policy.",details:policy.failures},422);
    try{
      const auth=publicAuthClient();
      const {data,error}=await auth.auth.signUp({email,password,options:{data:{full_name:display},emailRedirectTo:new URL("/admin/login",request.nextUrl.origin).toString()}});
      await recordAuthEvent({request,event_type:"signup.requested",success:!error,email});
      if(error)return json({ok:false,error:"Account request could not be completed."},422);
      return json({ok:true,data:{session_created:Boolean(data.session)},message:"Account request accepted. Confirm your email if required."});
    }catch{return json({ok:false,error:"Signup service is unavailable."},503);}
  }

  if(action==="reset"){
    const email=String(body.email||"").trim().toLowerCase();
    if(email){
      try{
        const auth=publicAuthClient();
        await auth.auth.resetPasswordForEmail(email,{redirectTo:new URL("/admin/login?recovery=1",request.nextUrl.origin).toString()});
        await recordAuthEvent({request,event_type:"password.reset_requested",success:true,email});
      }catch{}
    }
    return json({ok:true,message:"If the account is eligible, password recovery instructions will be sent."});
  }

  if(action==="change-password"){
    const token=bearer(request),password=String(body.password||""),email=String(body.email||"");
    if(!token)return json({ok:false,error:"Authentication is required."},401);
    const policy=passwordPolicy(password,email);
    if(!policy.ok)return json({ok:false,error:"Password does not meet policy.",details:policy.failures},422);
    try{
      const auth=publicAuthClient();
      const {data:userData,error:userError}=await auth.auth.getUser(token);
      if(userError||!userData.user)return json({ok:false,error:"Recovery session is invalid or expired."},401);
      const admin=serviceClient();
      const {error:updateError}=await admin.auth.admin.updateUserById(userData.user.id,{password});
      if(updateError)return json({ok:false,error:"Password could not be changed."},422);
      await admin.from("auth_security_state").upsert({user_id:userData.user.id,session_cutoff_at:new Date().toISOString(),password_changed_at:new Date().toISOString(),failed_login_count:0,locked_until:null,updated_at:new Date().toISOString()});
      await recordAuthEvent({request,event_type:"password.changed",success:true,user_id:userData.user.id,email:userData.user.email||email});
      return json({ok:true,message:"Password changed. Sign in again with the new password.",reauthenticate:true});
    }catch{return json({ok:false,error:"Password change service is unavailable."},503);}
  }

  return json({ok:false,error:"Unsupported authentication action."},400);
}
