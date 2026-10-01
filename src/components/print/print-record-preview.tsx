"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback,useEffect,useMemo,useState } from "react";
import { ArrowLeft, Download, LoaderCircle, Printer, Share2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { copyLink,exportJson,exportWord } from "@/lib/document-export";

const labels:Record<string,string>={
 reference_no:"Reference",status:"Status",source:"Source",requirement:"Requirement",nonconformance:"Nonconformance",severity:"Severity",immediate_correction:"Immediate correction",root_cause:"Root cause",due_date:"Due date",verification:"Verification",effectiveness:"Effectiveness",
 title:"Title",description:"Description",category:"Category",priority:"Priority",occurred_at:"Occurred at",exact_area:"Exact area",immediate_action:"Immediate action",recommended_action:"Recommended action",reporter_name:"Reporter",incident_type:"Incident type",direct_cause:"Direct cause",underlying_cause:"Underlying cause",contributing_factors:"Contributing factors",lessons_learned:"Lessons learned",
 activity:"Activity",hazard:"Hazard",persons_at_risk:"Persons at risk",consequence:"Consequence",existing_controls:"Existing controls",additional_controls:"Additional controls",likelihood:"Likelihood",residual_likelihood:"Residual likelihood",residual_severity:"Residual severity",
 asset_no:"Asset No.",equipment_type:"Equipment type",building:"Building",zone:"Zone",last_inspection:"Last inspection",next_inspection:"Next inspection",drill_ref:"Drill reference",drill_type:"Drill type",scenario:"Scenario",factory:"Factory",location:"Location",drill_date:"Drill date",evacuation_minutes:"Evacuation (min)",participants:"Participants",assembly_point:"Assembly point",coordinator:"Coordinator",safety_officer:"Safety officer",assessment:"Assessment",observations:"Observations",
 employee_name:"Employee name",employee_id:"Employee ID",authorization_no:"Authorization No.",qualification_name:"Qualification",license_type:"License type",issuer:"Issuer",certificate_number:"Certificate No.",issue_date:"Issue date",expiry_date:"Expiry date",trainer:"Trainer",starts_at:"Date / time",duration_minutes:"Duration (min)",objectives:"Objectives",asset_tag:"Asset tag",name:"Name",badge_no:"Badge No.",visitor_name:"Visitor",company:"Company",host:"Host",induction_status:"Induction",check_in:"Check in",check_out:"Check out"
};
const important:Record<string,string[]>={
 ncr:["reference_no","status","severity","source","requirement","nonconformance","immediate_correction","root_cause","due_date","verification","effectiveness"],
 sor:["reference_no","status","category","priority","occurred_at","reporter_name","exact_area","description","immediate_action","recommended_action","due_date"],
 incident:["reference_no","title","incident_type","status","severity","occurred_at","description","direct_cause","underlying_cause","root_cause","contributing_factors","lessons_learned"],
 risk:["reference_no","title","status","activity","created_at","updated_at"],
 capa:["reference_no","title","status","priority","source_type","description","due_date","verified_at","closed_at"],
 "fire-protection":["asset_no","equipment_type","category","manufacturer","model","capacity","building","zone","department","status","last_inspection","next_inspection","qr_code","notes"],
 "emergency-drill":["drill_ref","drill_type","scenario","factory","location","drill_date","evacuation_minutes","participants","assembly_point","coordinator","safety_officer","assessment","observations","status"],
 "equipment-authorization":["authorization_no","employee_name","employee_id","category","equipment_name","issuing_authority","issue_date","expiry_date","status","restrictions"],
 license:["reference_no","employee_name","employee_id","license_type","qualification_name","issuer","certificate_number","issue_date","expiry_date","status"],
 training:["reference_no","title","title_ar","category","trainer","factory","location","starts_at","duration_minutes","objectives","status"],
 asset:["asset_tag","name","category","location","factory","department","last_inspection","next_due","status","qr_code","notes"],
 "equipment-passport":["equipment_no","name","equipment_type","serial_no","manufacturer","model","department","factory","area","risk_rating","certificate_no","certificate_expiry","next_inspection","next_maintenance","operator_authorization_required","loto_required","status","notes"],
 visitor:["badge_no","visitor_name","company","host","induction_status","check_in","check_out","status","qr_code","notes"],
 "official-template":["document_no","template_type","holder_name","holder_name_ar","employee_id","participant_name","participant_name_ar","title","title_ar","issue_date","expiry_date","status"],
 "monthly-hse":["month_start","reports_total","reports_open","near_misses","unsafe_conditions","positive_observations","incidents_total","recordable_incidents","lost_time_incidents","incidents_open","actions_created","actions_closed","actions_overdue","actions_open","risks_for_review","active_risks","ncr_open","ncr_closed"]
};
const titleMap:Record<string,string>={ncr:"Non-Conformance Report",sor:"Safety Observation Report",incident:"Incident / RCA Report",risk:"Risk Assessment",capa:"CAPA Action","fire-protection":"Fire Protection Record","emergency-drill":"Emergency Drill Report","equipment-authorization":"Equipment Authorization",license:"Professional License",training:"Safety Training Record",asset:"Safety Asset / QR Passport","equipment-passport":"Equipment Safety Passport",visitor:"Visitor / Contractor Badge","official-template":"Official Certificate / Card","monthly-hse":"Monthly HSE Report"};
function text(v:unknown){if(v===null||v===undefined||v==="")return "—";if(typeof v==="object")return JSON.stringify(v);return String(v).replaceAll("_"," ");}
function dateish(v:unknown){const s=String(v??"");if(!s||(!s.includes("-")&&!s.includes("T")))return text(v);const d=new Date(s);return Number.isNaN(d.valueOf())?text(v):new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:s.includes("T")?"short":undefined}).format(d);}
function isDateKey(k:string){return /(date|_at|expiry|inspection|month_start|due)/.test(k);}
export default function PrintRecordPreview({template,id}:{template:string;id:string}){
 const [data,setData]=useState<any>(),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
 const load=useCallback(async()=>{setLoading(true);setError(null);try{if(!supabase)throw Error("Supabase is not configured.");const {data:s}=await supabase.auth.getSession();const token=s.session?.access_token;if(!token)throw Error("Authentication is required.");const r=await fetch(`/api/print-record?template=${encodeURIComponent(template)}&id=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${token}`}});const raw=await r.text();let body:any;try{body=JSON.parse(raw)}catch{throw Error(`Print API returned a non-JSON response (${r.status}).`)}if(!r.ok||!body.ok)throw Error(body.error||"Print record unavailable.");setData(body.data)}catch(e){setError(e instanceof Error?e.message:"Print record unavailable.")}finally{setLoading(false)}},[template,id]);useEffect(()=>{void load()},[load]);
 const fields=useMemo(()=>important[template]||[],[template]);
 if(loading)return <div className="standalone-print-state"><LoaderCircle className="spin"/><strong>Preparing controlled document…</strong></div>;
 if(error)return <div className="standalone-print-state error"><strong>Document unavailable</strong><span>{error}</span><button onClick={()=>history.back()}>Back</button></div>;
 const record=data.record||{},branding=data.branding||{},related=data.related||{};
 const fileBase=`KSA-${template}-${record.reference_no||record.document_no||record.asset_no||record.id||"record"}`;
 return <div className="standalone-print-shell">
   <div className="standalone-print-actions" data-no-print><button onClick={()=>history.back()}><ArrowLeft size={15}/> Back</button><button onClick={()=>window.print()}><Printer size={15}/> Print / PDF</button><button onClick={()=>exportWord([record],titleMap[template]||"HSE Document",fileBase)}><Download size={15}/> Word</button><button onClick={()=>exportJson({record,related,branding},fileBase)}><Download size={15}/> JSON</button><button onClick={()=>void copyLink(location.href)}><Share2 size={15}/> Copy link</button></div>
   <article className="controlled-document" dir="auto">
     <header className="controlled-document-header"><div className="controlled-logo">{branding.logo_url?<img src={branding.logo_url} alt="" />:<span>KSA</span>}</div><div><div className="controlled-company">{branding.company_name||branding.board_name||"KSA SAFETY BOARD"}</div><h1>{titleMap[template]||"HSE Controlled Document"}</h1></div><div className="controlled-meta"><b>{text(record.reference_no||record.document_no||record.authorization_no||record.asset_no||record.badge_no||record.id)}</b><span>Generated {dateish(data.generated_at)}</span></div></header>
     <section className="controlled-fields">{fields.map(k=><div className={["description","nonconformance","root_cause","assessment","observations","lessons_learned","existing_controls","additional_controls"].includes(k)?"wide":""} key={k}><span>{labels[k]||k.replaceAll("_"," ")}</span><strong>{isDateKey(k)?dateish(record[k]):text(record[k])}</strong></div>)}</section>
     {template==="risk"&&related.hazards?.length>0&&<section className="controlled-section"><h2>Risk Hazards / Controls</h2><table><thead><tr><th>Hazard</th><th>Persons at risk</th><th>Initial</th><th>Existing controls</th><th>Additional controls</th><th>Residual</th></tr></thead><tbody>{related.hazards.map((h:any)=><tr key={h.id}><td>{text(h.hazard)}</td><td>{text(h.persons_at_risk)}</td><td>{text(h.likelihood)} × {text(h.severity)}</td><td>{text(h.existing_controls)}</td><td>{text(h.additional_controls)}</td><td>{text(h.residual_likelihood)} × {text(h.residual_severity)}</td></tr>)}</tbody></table></section>}
     {template==="ncr"&&related.capa?.length>0&&<section className="controlled-section"><h2>CAPA / Effectiveness</h2>{related.capa.map((c:any)=><div className="controlled-note" key={c.id}><b>{text(c.action?.reference_no||"CAPA")}</b><span>{text(c.preventive_action||c.action?.title)}</span><small>{text(c.effectiveness_review||c.action?.status)}</small></div>)}</section>}
     {template==="incident"&&related.actions?.length>0&&<section className="controlled-section"><h2>Corrective Actions</h2>{related.actions.map((a:any)=><div className="controlled-note" key={a.id}><b>{text(a.reference_no)}</b><span>{text(a.title)}</span><small>{text(a.status)} · due {dateish(a.due_date)}</small></div>)}</section>}
     <footer className="controlled-document-footer"><span>{branding.board_name||"KSA SAFETY BOARD"}</span><span>Controlled record · {data.print?.dpi||300} DPI target</span></footer>
   </article>
 </div>
}
