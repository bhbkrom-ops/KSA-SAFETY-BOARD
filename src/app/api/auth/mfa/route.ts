import { NextRequest } from "next/server";
import { bearer,publicAuthClient,recordAuthEvent } from "@/lib/auth-security";

export async function POST(request:NextRequest){
  const token=bearer(request);
  const action=request.nextUrl.searchParams.get("action")||"verify";
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  const refresh=String(body?.refresh_token||"");
  if(!token||!refresh)return Response.json({ok:false,error:"Authenticated session is required."},{status:401});
  try{
    const auth=publicAuthClient();
    const {data:setData,error:setError}=await auth.auth.setSession({access_token:token,refresh_token:refresh});
    if(setError||!setData.session)return Response.json({ok:false,error:"Session is invalid or expired."},{status:401});
    if(action==="factors"){
      const {data,error}=await auth.auth.mfa.listFactors();
      if(error)return Response.json({ok:false,error:"MFA factors are unavailable."},{status:422});
      return Response.json({ok:true,data});
    }
    if(action==="enroll"){
      const {data:factors,error:factorsError}=await auth.auth.mfa.listFactors();
      if(factorsError)return Response.json({ok:false,error:"MFA factors are unavailable."},{status:422});

      const verified=(factors?.totp||[]).find((item:{status:string})=>item.status==="verified");
      if(verified){
        return Response.json({ok:false,error:"A verified MFA factor already exists.",code:"MFA_ALREADY_VERIFIED",data:{factor_id:verified.id}},{status:409});
      }

      const stale=(factors?.totp||[]).filter((item:{status:string})=>item.status!=="verified");
      for(const item of stale){
        const {error:unenrollError}=await auth.auth.mfa.unenroll({factorId:item.id});
        if(unenrollError){
          return Response.json({ok:false,error:"Previous incomplete MFA enrollment could not be cleared.",code:"MFA_STALE_FACTOR"},{status:422});
        }
      }

      const {data,error}=await auth.auth.mfa.enroll({factorType:"totp",friendlyName:"KSA Safety Board"});
      if(error)return Response.json({ok:false,error:error.message||"MFA enrollment could not start.",code:"MFA_ENROLL_FAILED"},{status:422});
      return Response.json({ok:true,data});
    }
    const factorId=String(body?.factor_id||"");
    if(!factorId)return Response.json({ok:false,error:"MFA factor is required."},{status:422});
    if(action==="challenge"){
      const {data,error}=await auth.auth.mfa.challenge({factorId});
      if(error)return Response.json({ok:false,error:"MFA challenge could not be created."},{status:422});
      return Response.json({ok:true,data});
    }
    if(action==="verify"){
      const challengeId=String(body?.challenge_id||""),code=String(body?.code||"").replace(/\s/g,"");
      if(!challengeId||!/^[0-9]{6,8}$/.test(code))return Response.json({ok:false,error:"Valid MFA code is required."},{status:422});
      const {data,error}=await auth.auth.mfa.verify({factorId,challengeId,code});
      if(error||!data)return Response.json({ok:false,error:"MFA verification failed."},{status:401});
      await recordAuthEvent({request,event_type:"mfa.verified",success:true,user_id:setData.user?.id||null});
      return Response.json({ok:true,data:{session:data,access_token:data.access_token,refresh_token:data.refresh_token}});
    }
    return Response.json({ok:false,error:"Unsupported MFA action."},{status:400});
  }catch{return Response.json({ok:false,error:"MFA service is unavailable."},{status:503});}
}
