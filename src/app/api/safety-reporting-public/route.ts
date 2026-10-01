import { NextRequest } from "next/server";
import { createCipheriv,createHash,randomBytes } from "node:crypto";
import { clientFingerprint,serviceClient } from "@/lib/auth-security";

const categories=new Set(["unsafe_act","unsafe_condition","hazard","near_miss","safety_observation","positive_observation","fire_observation","environmental_observation"]);
const priorities=new Set(["low","medium","high","critical"]);
const identityModes=new Set(["anonymous","confidential","identified"]);
const clean=(v:unknown,max=4000)=>String(v??"").trim().slice(0,max);
const hash=(v:string)=>createHash("sha256").update(v).digest("hex");
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});

function encryptIdentity(value:Record<string,string>){
  const secret=process.env.REPORTER_IDENTITY_KEY||"";
  if(secret.length<32)throw new Error("IDENTITY_KEY_MISSING");
  const key=createHash("sha256").update(secret).digest();
  const iv=randomBytes(12);
  const cipher=createCipheriv("aes-256-gcm",key,iv);
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);
  return {ciphertext:ciphertext.toString("base64url"),iv:iv.toString("base64url"),tag:cipher.getAuthTag().toString("base64url")};
}
async function rateLimit(request:NextRequest){
  const db=serviceClient(); const fp=clientFingerprint(request);
  const windowMs=15*60*1000, start=new Date(Math.floor(Date.now()/windowMs)*windowMs).toISOString();
  const {data}=await db.from("public_report_rate_limits").select("request_count").eq("key_hash",fp.ip_hash).eq("window_start",start).maybeSingle();
  const count=Number(data?.request_count||0);
  if(count>=10)return false;
  await db.from("public_report_rate_limits").upsert({key_hash:fp.ip_hash,window_start:start,request_count:count+1,updated_at:new Date().toISOString()});
  return true;
}
async function verifyTracking(reference:string,trackingCode:string){
  const db=serviceClient();
  const {data:report}=await db.from("reports").select("id,reference_no,category,status,priority,exact_area,description,created_at,updated_at,closed_at").eq("reference_no",reference).maybeSingle();
  if(!report)return null;
  const {data:access}=await db.from("public_report_access").select("report_id").eq("report_id",report.id).eq("tracking_code_hash",hash(trackingCode)).maybeSingle();
  return access?{db,report}:null;
}
export async function GET(request:NextRequest){
  const action=request.nextUrl.searchParams.get("action")||"channels";
  if(action==="channels")return json({ok:true,data:{channels:["WEB"],identity_modes:["anonymous","confidential","identified"],languages:["ar","en","ur"]}});
  return json({ok:false,error:"Unsupported public reporting action."},400);
}
export async function POST(request:NextRequest){
  const action=request.nextUrl.searchParams.get("action")||"intake";
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  if(!body)return json({ok:false,error:"JSON body required."},400);

  if(action==="intake"){
    if(!(await rateLimit(request)))return json({ok:false,error:"Too many reporting requests. Try again later."},429);
    const category=clean(body.category,60),priority=clean(body.priority,20),exactArea=clean(body.exact_area,300),description=clean(body.description,5000),identityMode=clean(body.identity_mode,30)||"anonymous";
    if(!categories.has(category)||!priorities.has(priority)||!identityModes.has(identityMode)||exactArea.length<2||description.length<10)return json({ok:false,error:"Report details are incomplete or invalid."},422);
    const identity={name:clean(body.reporter_name,200),email:clean(body.reporter_email,320),phone:clean(body.reporter_phone,80)};
    if(identityMode!=="anonymous"&&!identity.email&&!identity.phone&&!identity.name)return json({ok:false,error:"Reporter contact details are required for this identity mode."},422);
    let encrypted:{ciphertext:string;iv:string;tag:string}|null=null;
    if(identityMode!=="anonymous"){
      try{encrypted=encryptIdentity(identity);}catch{return json({ok:false,error:"Confidential identity protection is not configured. Use anonymous reporting or contact HSE."},503);}
    }
    const db=serviceClient();
    const {data:created,error:createError}=await db.rpc("submit_public_report",{p_category:category,p_priority:priority,p_exact_area:exactArea,p_description:description});
    const row=Array.isArray(created)?created[0]:created;
    if(createError||!row?.id||!row?.reference_no)return json({ok:false,error:"Report could not be submitted."},422);
    const trackingCode=randomBytes(18).toString("base64url");
    const {error:accessError}=await db.from("public_report_access").insert({
      report_id:row.id,tracking_code_hash:hash(trackingCode),identity_mode:identityMode,
      identity_ciphertext:encrypted?.ciphertext||null,identity_iv:encrypted?.iv||null,identity_tag:encrypted?.tag||null
    });
    if(accessError){await db.from("reports").delete().eq("id",row.id);return json({ok:false,error:"Secure tracking could not be initialized."},500);}
    return json({ok:true,data:{reference_no:row.reference_no,tracking_code:trackingCode,identity_mode:identityMode}},201);
  }

  if(action==="status"){
    if(!(await rateLimit(request)))return json({ok:false,error:"Too many tracking requests. Try again later."},429);
    const reference=clean(body.reference_no,80).toUpperCase(),tracking=clean(body.tracking_code,120);
    if(!reference||tracking.length<10)return json({ok:false,error:"Reference and private tracking code are required."},422);
    const verified=await verifyTracking(reference,tracking);
    if(!verified)return json({ok:false,error:"Tracking details could not be verified."},404);
    const {data:messages}=await verified.db.from("public_report_messages").select("id,sender_type,body,created_at").eq("report_id",verified.report.id).eq("is_internal",false).order("created_at",{ascending:true}).limit(100);
    return json({ok:true,data:{report:verified.report,messages:messages||[]}});
  }

  if(action==="message"){
    if(!(await rateLimit(request)))return json({ok:false,error:"Too many messaging requests. Try again later."},429);
    const reference=clean(body.reference_no,80).toUpperCase(),tracking=clean(body.tracking_code,120),message=clean(body.message,4000);
    if(message.length<2)return json({ok:false,error:"Message is required."},422);
    const verified=await verifyTracking(reference,tracking);
    if(!verified)return json({ok:false,error:"Tracking details could not be verified."},404);
    const {data,error}=await verified.db.from("public_report_messages").insert({report_id:verified.report.id,sender_type:"reporter",body:message,is_internal:false}).select("id,sender_type,body,created_at").single();
    if(error)return json({ok:false,error:"Message could not be sent."},422);
    return json({ok:true,data},{status:201});
  }

  return json({ok:false,error:"Unsupported public reporting action."},400);
}
