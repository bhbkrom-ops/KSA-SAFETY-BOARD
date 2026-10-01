import { NextRequest } from "next/server";
import { bearer,PRIVILEGED_ROLES,publicAuthClient,serviceClient,verifiedJwtClaims } from "@/lib/auth-security";

export async function GET(request:NextRequest){
  const token=bearer(request);
  if(!token)return Response.json({ok:false,error:"Authentication is required."},{status:401});
  try{
    const auth=publicAuthClient();
    const {data,error}=await auth.auth.getUser(token);
    if(error||!data.user)return Response.json({ok:false,error:"Session is invalid or expired."},{status:401});
    const admin=serviceClient();
    const [{data:profile},{data:security}]=await Promise.all([
      admin.from("profiles").select("id,display_name,email,role_code,is_active").eq("id",data.user.id).maybeSingle(),
      admin.from("auth_security_state").select("locked_until,session_cutoff_at,last_success_at").eq("user_id",data.user.id).maybeSingle()
    ]);
    if(!profile?.is_active)return Response.json({ok:false,error:"HSE profile is not active."},{status:403});
    const claims=verifiedJwtClaims(token);
    if(security?.session_cutoff_at&&claims?.iat&&claims.iat*1000<=new Date(security.session_cutoff_at).getTime())
      return Response.json({ok:false,error:"Session was revoked. Sign in again.",code:"SESSION_CUTOFF"},{status:401});
    const mfaRequired=PRIVILEGED_ROLES.has(profile.role_code);
    if(mfaRequired&&claims?.aal!=="aal2")
      return Response.json({ok:false,error:"Multi-factor authentication is required.",code:"MFA_REQUIRED",data:{profile,aal:claims?.aal||"aal1"}},{status:403});
    return Response.json({ok:true,data:{user:{id:data.user.id,email:data.user.email},profile,aal:claims?.aal||"aal1",mfa_required:mfaRequired}});
  }catch{return Response.json({ok:false,error:"Session validation is unavailable."},{status:503});}
}
