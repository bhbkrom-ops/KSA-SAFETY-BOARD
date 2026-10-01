import { NextRequest } from "next/server";
import { bearer,publicAuthClient,recordAuthEvent } from "@/lib/auth-security";

export async function POST(request:NextRequest){
  const token=bearer(request);
  const body=await request.json().catch(()=>null) as {refresh_token?:string}|null;
  if(!token)return Response.json({ok:true});
  try{
    const auth=publicAuthClient();
    const {data:userData}=await auth.auth.getUser(token);
    const refresh=String(body?.refresh_token||"");
    if(refresh){
      const {error:setError}=await auth.auth.setSession({access_token:token,refresh_token:refresh});
      if(!setError)await auth.auth.signOut({scope:"local"});
    }
    await recordAuthEvent({request,event_type:"logout",success:true,user_id:userData.user?.id||null,email:userData.user?.email||null});
  }catch{}
  return Response.json({ok:true});
}
