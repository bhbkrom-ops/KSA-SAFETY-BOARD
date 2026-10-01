import { NextRequest } from "next/server";
import { createDecipheriv,createHash } from "node:crypto";
import { isAuthContext,requireAuth } from "@/lib/server-auth";
import { serviceClient } from "@/lib/auth-security";

function decrypt(ciphertext:string,iv:string,tag:string){
  const secret=process.env.REPORTER_IDENTITY_KEY||"";
  if(secret.length<32)throw new Error("Identity key is not configured.");
  const key=createHash("sha256").update(secret).digest();
  const decipher=createDecipheriv("aes-256-gcm",key,Buffer.from(iv,"base64url"));
  decipher.setAuthTag(Buffer.from(tag,"base64url"));
  const clear=Buffer.concat([decipher.update(Buffer.from(ciphertext,"base64url")),decipher.final()]).toString("utf8");
  return JSON.parse(clear) as {name?:string;email?:string;phone?:string};
}
export async function POST(request:NextRequest){
  const auth=await requireAuth(request);
  if(!isAuthContext(auth))return auth;
  if(!["super_admin","hse_manager"].includes(auth.profile.role_code))
    return Response.json({ok:false,error:"Reporter identity requires HSE Manager or Super Admin."},{status:403});
  const body=await request.json().catch(()=>null) as {report_id?:string;reason?:string}|null;
  const reportId=String(body?.report_id||""),reason=String(body?.reason||"").trim().slice(0,500);
  if(!reportId||reason.length<5)return Response.json({ok:false,error:"Report ID and access reason are required."},{status:422});
  try{
    const db=serviceClient();
    const {data,error}=await db.from("public_report_access").select("report_id,identity_mode,identity_ciphertext,identity_iv,identity_tag").eq("report_id",reportId).maybeSingle();
    if(error||!data)return Response.json({ok:false,error:"Reporter identity record was not found."},{status:404});
    if(data.identity_mode==="anonymous")return Response.json({ok:true,data:{identity_mode:"anonymous",identity:null}});
    if(!data.identity_ciphertext||!data.identity_iv||!data.identity_tag)return Response.json({ok:false,error:"Encrypted reporter identity is unavailable."},{status:409});
    const identity=decrypt(data.identity_ciphertext,data.identity_iv,data.identity_tag);
    const now=new Date().toISOString();
    await db.from("public_report_access").update({identity_revealed_at:now,identity_revealed_by:auth.user.id}).eq("report_id",reportId);
    await db.from("audit_logs").insert({actor_id:auth.user.id,event_type:"public_report.identity_revealed",entity_type:"report",entity_id:reportId,new_data:{reason,identity_mode:data.identity_mode,revealed_at:now}});
    return Response.json({ok:true,data:{identity_mode:data.identity_mode,identity}});
  }catch{
    return Response.json({ok:false,error:"Reporter identity could not be decrypted."},{status:503});
  }
}
