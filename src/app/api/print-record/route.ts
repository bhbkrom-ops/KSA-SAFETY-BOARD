/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

const families:Record<string,{table:string,fields:string}> = {
  ncr:{table:"ncr",fields:"*"},
  sor:{table:"reports",fields:"*"},
  incident:{table:"incidents",fields:"*"},
  risk:{table:"risk_assessments",fields:"*"},
  capa:{table:"actions",fields:"*"},
  "fire-protection":{table:"fire_equipment",fields:"*"},
  "emergency-drill":{table:"emergency_drills",fields:"*"},
  "equipment-authorization":{table:"equipment_authorizations",fields:"*"},
  license:{table:"licenses",fields:"*"},
  training:{table:"trainings",fields:"*"},
  asset:{table:"safety_assets",fields:"*"},
  visitor:{table:"visitors",fields:"*"},
  "safety-sign":{table:"safety_signs",fields:"*"},
  "official-template":{table:"official_templates",fields:"*"},
  "monthly-hse":{table:"safety_monthly_statistics",fields:"*"},
};
const fail=(message:string,status=422)=>Response.json({ok:false,error:message},{status});
export async function GET(request:NextRequest){
  const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;
  const template=request.nextUrl.searchParams.get("template")||"";const id=request.nextUrl.searchParams.get("id")||"";
  const family=families[template];if(!family||!id)return fail("Valid template and record ID are required.",400);
  const db=auth.client as any;
  const [{data:record,error:recordError},{data:brandSetting},{data:printSetting}] = await Promise.all([
    db.from(family.table).select(family.fields).eq("id",id).maybeSingle(),
    db.from("system_settings").select("value").eq("key","branding").maybeSingle(),
    db.from("system_settings").select("value").eq("key","print_templates").maybeSingle(),
  ]);
  if(recordError)return fail(recordError.message,500);if(!record)return fail("Record not found or not accessible.",404);
  let related:any={};
  if(template==="risk"){const {data,error}=await db.from("risk_hazards").select("*").eq("assessment_id",id).order("created_at");if(error)return fail(error.message,500);related.hazards=data||[];}
  if(template==="ncr"){const {data,error}=await db.from("capa").select("*,action:actions(*)").eq("ncr_id",id);if(error)return fail(error.message,500);related.capa=data||[];}
  if(template==="incident"){const {data,error}=await db.from("actions").select("*").eq("source_type","incident").eq("source_id",id).order("created_at");if(error)return fail(error.message,500);related.actions=data||[];}
  if(template==="capa"&&record.source_type==="ncr"){const {data}=await db.from("ncr").select("reference_no,nonconformance,severity,status").eq("id",record.source_id).maybeSingle();related.source=data||null;}
  const branding={board_name:"KSA SAFETY BOARD",company_name:"",logo_url:"",...(brandSetting?.value||{})};
  const print={paper:"A4",dpi:300,print_canvas:"white",...(printSetting?.value||{})};
  return Response.json({ok:true,data:{template,record,related,branding,print,generated_at:new Date().toISOString()}});
}
