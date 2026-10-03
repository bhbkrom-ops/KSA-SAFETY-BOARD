import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "node:crypto";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qazqzejfucknpmnkorqa.supabase.co";
const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_1fSSTfoko8rb3qn_0JdvQg_y4ifylRF";
const service=process.env.SUPABASE_SERVICE_ROLE_KEY;

export const PRIVILEGED_ROLES=new Set(["super_admin","hse_manager"]);

export function publicAuthClient(){
  return createClient(url,publishable,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
export function userAuthClient(accessToken:string){
  return createClient(url,publishable,{
    global:{headers:{Authorization:`Bearer ${accessToken}`}},
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  });
}
export function serviceClient(){
  if(!service) throw new Error("Supabase service authentication is not configured.");
  return createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
export function optionalServiceClient(){
  if(!service)return null;
  return createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
export function passwordPolicy(password:string,email=""){
  const failures:string[]=[];
  if(password.length<12) failures.push("Use at least 12 characters.");
  if(!/[a-z]/.test(password)) failures.push("Add a lowercase letter.");
  if(!/[A-Z]/.test(password)) failures.push("Add an uppercase letter.");
  if(!/[0-9]/.test(password)) failures.push("Add a number.");
  if(!/[^A-Za-z0-9]/.test(password)) failures.push("Add a special character.");
  const local=email.split("@")[0]?.toLowerCase();
  if(local&&local.length>=4&&password.toLowerCase().includes(local)) failures.push("Do not include your email name in the password.");
  return {ok:failures.length===0,failures};
}
export function hashValue(value:string){return createHash("sha256").update(value).digest("hex");}
export function tokenMatches(provided:string,expected:string){
  if(!provided||!expected)return false;
  const a=createHash("sha256").update(provided).digest();
  const b=createHash("sha256").update(expected).digest();
  return a.length===b.length&&timingSafeEqual(a,b);
}
export function bearer(request:Request){
  const raw=request.headers.get("authorization")||"";
  return raw.startsWith("Bearer ")?raw.slice(7):null;
}
export function safeNext(value:unknown,fallback="/admin/dashboard"){
  if(typeof value!=="string"||!value.startsWith("/")||value.startsWith("//")||value.includes("\\"))return fallback;
  return value;
}
export function clientFingerprint(request:Request){
  const ip=(request.headers.get("x-forwarded-for")||request.headers.get("x-real-ip")||"unknown").split(",")[0].trim();
  const ua=(request.headers.get("user-agent")||"unknown").slice(0,300);
  return {ip_hash:hashValue(ip),user_agent:ua};
}
export function verifiedJwtClaims(token:string){
  try{
    const part=token.split(".")[1];
    if(!part)return null;
    return JSON.parse(Buffer.from(part,"base64url").toString("utf8")) as {iat?:number;aal?:string;sub?:string;exp?:number};
  }catch{return null;}
}
export async function recordAuthEvent(args:{request:Request;event_type:string;success:boolean;user_id?:string|null;email?:string|null;metadata?:Record<string,unknown>}){
  try{
    const db=optionalServiceClient();
    if(!db)return;
    const fp=clientFingerprint(args.request);
    await db.from("auth_security_events").insert({
      user_id:args.user_id||null,event_type:args.event_type,success:args.success,
      email_hash:args.email?hashValue(args.email.trim().toLowerCase()):null,
      ip_hash:fp.ip_hash,user_agent:fp.user_agent,metadata:args.metadata||{}
    });
  }catch{}
}
