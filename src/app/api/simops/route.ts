import { NextRequest } from "next/server";
import { isAuthContext, requireAuth } from "@/lib/server-auth";
import { cleanText } from "@/lib/live-meeting";

type Json = Record<string, unknown>;
type SimopsPlanRow = {
  id: string;
  window_start: string;
  window_end: string;
};
type SimopsActivityScanRow = {
  id: string;
  activity_type: string;
  location: string;
  start_at: string;
  end_at: string;
};
type SimopsRuleRow = {
  id: string;
  activity_type_a: string;
  activity_type_b: string;
  severity: "low" | "medium" | "high" | "critical";
  rationale: string;
  required_controls: unknown;
};
type SimopsConflictAnalyticsRow = {
  id: string;
  severity: string;
  status: string;
  rule_id: string;
  plan_id: string;
  activity_a_id: string;
  activity_b_id: string;
};
const fail=(error:string,status=422)=>Response.json({ok:false,error},{status});
const bodyOf=async(request:NextRequest)=>await request.json().catch(()=>null) as Json|null;
const text=(v:unknown,max=500)=>cleanText(v,max);
const iso=(v:unknown)=>{const s=text(v,80);if(!s)return null;const d=new Date(s);return Number.isNaN(d.getTime())?null:d.toISOString();};
const sameLocation=(a:string,b:string)=>{const x=a.trim().toLowerCase(),y=b.trim().toLowerCase();return x===y||(x.length>=3&&y.length>=3&&(x.includes(y)||y.includes(x)));};
const overlaps=(a:{start_at:string;end_at:string},b:{start_at:string;end_at:string})=>new Date(a.start_at)<new Date(b.end_at)&&new Date(b.start_at)<new Date(a.end_at);

export async function GET(request:NextRequest){
  const auth=await requireAuth(request); if(!isAuthContext(auth))return auth;
  const planId=text(request.nextUrl.searchParams.get("plan_id"),80);
  try{
    const [plansRes,rulesRes]=await Promise.all([
      auth.client.from("simops_plans").select("*").order("window_start",{ascending:false}).limit(100),
      auth.client.from("simops_conflict_rules").select("*").order("severity",{ascending:false})
    ]);
    if(plansRes.error)return fail(plansRes.error.message,500);
    if(rulesRes.error)return fail(rulesRes.error.message,500);
    const plans=(plansRes.data??[]) as unknown as SimopsPlanRow[];
    const rules=(rulesRes.data??[]) as unknown as SimopsRuleRow[];
    const selected=planId||plans[0]?.id||null;
    let activities:Json[]=[];let conflicts:Json[]=[];
    if(selected){
      const [a,c]=await Promise.all([
        auth.client.from("simops_activities").select("*").eq("plan_id",selected).order("start_at"),
        auth.client.from("simops_conflicts").select("*,rule:simops_conflict_rules(rule_code,name),activity_a:simops_activities!simops_conflicts_activity_a_id_fkey(activity_code,title,activity_type,location,start_at,end_at),activity_b:simops_activities!simops_conflicts_activity_b_id_fkey(activity_code,title,activity_type,location,start_at,end_at)").eq("plan_id",selected).order("detected_at",{ascending:false})
      ]);
      if(a.error)return fail(a.error.message,500);if(c.error)return fail(c.error.message,500);
      activities=(a.data||[]) as Json[];conflicts=(c.data||[]) as Json[];
    }
    const allConflicts=(((await auth.client.from("simops_conflicts").select("id,severity,status,rule_id,plan_id,activity_a_id,activity_b_id")).data)??[]) as unknown as SimopsConflictAnalyticsRow[];
    const planStarts=new Map(plans.map(p=>[p.id,new Date(p.window_start).getTime()]));
    const unresolved=allConflicts.filter(x=>!["controlled","resolved","accepted"].includes(x.status));
    const activityConflictCounts=new Map<string,number>();
    for(const c of unresolved){for(const id of [c.activity_a_id,c.activity_b_id])activityConflictCounts.set(id,(activityConflictCounts.get(id)||0)+1);}
    const analytics={
      open_conflicts:allConflicts.filter(x=>!["resolved","accepted"].includes(x.status)).length,
      critical_conflicts:allConflicts.filter(x=>x.severity==="critical"&&!["resolved","accepted"].includes(x.status)).length,
      unresolved_before_start:unresolved.filter(x=>(planStarts.get(x.plan_id)||0)>Date.now()).length,
      conflict_categories:new Set(allConflicts.map(x=>x.rule_id)).size,
      repeat_conflicting_activities:[...activityConflictCounts.values()].filter(count=>count>1).length
    };
    return Response.json({ok:true,data:{plans,selected_plan_id:selected,activities,conflicts,rules,analytics}});
  }catch(e){return fail(e instanceof Error?e.message:"SIMOPS data could not be loaded.",500);}
}

export async function POST(request:NextRequest){
  const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("SIMOPS changes require HSE staff access.",403);
  const body=await bodyOf(request);if(!body)return fail("JSON body required.",400);
  const action=text(body.action,60);
  if(action==="create_plan"){
    const title=text(body.title,240),start=iso(body.window_start),end=iso(body.window_end);
    if(!title||!start||!end)return fail("Title and valid SIMOPS time window are required.");
    const {data,error}=await auth.client.from("simops_plans").insert({
      plan_no:text(body.plan_no,80)||`SIMOPS-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
      title,site_id:text(body.site_id,80)||null,area:text(body.area,180)||null,window_start:start,window_end:end,
      owner_id:text(body.owner_id,80)||auth.user.id,status:"draft",scope:text(body.scope,3000)||null,notes:text(body.notes,3000)||null,
      linked_ptw_id:text(body.linked_ptw_id,80)||null,linked_jsa_id:text(body.linked_jsa_id,80)||null,
      linked_lmra_id:text(body.linked_lmra_id,80)||null,linked_loto_id:text(body.linked_loto_id,80)||null,
      linked_moc_record_id:text(body.linked_moc_record_id,80)||null,created_by:auth.user.id,updated_by:auth.user.id
    }).select("*").single();
    if(error||!data)return fail(error?.message||"SIMOPS plan could not be created.");
    return Response.json({ok:true,data},{status:201});
  }
  if(action==="create_activity"){
    const planId=text(body.plan_id,80),title=text(body.title,240),location=text(body.location,240),start=iso(body.start_at),end=iso(body.end_at);
    const allowed=["hot_work","flammable_transfer","lifting","pedestrian_access","energized_electrical","intrusive_work","confined_space","chemical_process","other"];
    const activityType=text(body.activity_type,60);
    if(!planId||!title||!location||!start||!end||!allowed.includes(activityType))return fail("Plan, title, type, location and valid time window are required.");
    const {data,error}=await auth.client.from("simops_activities").insert({
      plan_id:planId,activity_code:text(body.activity_code,80)||`ACT-${Date.now().toString().slice(-6)}`,title,activity_type:activityType,
      contractor_id:text(body.contractor_id,80)||null,department_id:text(body.department_id,80)||null,location,start_at:start,end_at:end,
      permit_id:text(body.permit_id,80)||null,jsa_id:text(body.jsa_id,80)||null,lmra_id:text(body.lmra_id,80)||null,loto_id:text(body.loto_id,80)||null,
      energy_sources:Array.isArray(body.energy_sources)?body.energy_sources:[],equipment:Array.isArray(body.equipment)?body.equipment:[],
      critical_controls:Array.isArray(body.critical_controls)?body.critical_controls:[],status:"planned",created_by:auth.user.id,updated_by:auth.user.id
    }).select("*").single();
    if(error||!data)return fail(error?.message||"SIMOPS activity could not be created.");
    return Response.json({ok:true,data},{status:201});
  }
  if(action==="detect_conflicts"){
    const planId=text(body.plan_id,80);if(!planId)return fail("Plan ID is required.");
    const [aRes,rRes]=await Promise.all([
      auth.client.from("simops_activities").select("id,activity_type,location,start_at,end_at").eq("plan_id",planId).neq("status","cancelled"),
      auth.client.from("simops_conflict_rules").select("*").eq("is_active",true)
    ]);
    if(aRes.error||rRes.error)return fail(aRes.error?.message||rRes.error?.message||"Conflict inputs could not be loaded.",500);
    const rows:Json[]=[];
    const acts=(aRes.data??[]) as unknown as SimopsActivityScanRow[];
    const rules=(rRes.data??[]) as unknown as SimopsRuleRow[];
    for(let i=0;i<acts.length;i++)for(let j=i+1;j<acts.length;j++){
      const aa=acts[i],bb=acts[j];if(!overlaps(aa,bb)||!sameLocation(aa.location,bb.location))continue;
      for(const rule of rules){
        const match=(aa.activity_type===rule.activity_type_a&&bb.activity_type===rule.activity_type_b)||(aa.activity_type===rule.activity_type_b&&bb.activity_type===rule.activity_type_a);
        if(!match)continue;
        const [activityA,activityB]=[aa.id,bb.id].sort();
        rows.push({plan_id:planId,activity_a_id:activityA,activity_b_id:activityB,rule_id:rule.id,severity:rule.severity,rationale:rule.rationale,required_controls:rule.required_controls,status:"open"});
      }
    }
    if(rows.length){
      const {error}=await auth.client.from("simops_conflicts").upsert(rows,{onConflict:"plan_id,activity_a_id,activity_b_id,rule_id",ignoreDuplicates:true});
      if(error)return fail(error.message,500);
    }
    const {error:scanError}=await auth.client.from("simops_plans").update({last_conflict_scan_at:new Date().toISOString(),last_conflict_scan_by:auth.user.id,updated_by:auth.user.id}).eq("id",planId);
    if(scanError)return fail(scanError.message,500);
    return Response.json({ok:true,data:{detected:rows.length,scan_completed:true}});
  }
  if(action==="create_rule"){
    if(!["super_admin","hse_manager"].includes(auth.profile.role_code))return fail("Conflict rule governance requires Admin/Manager access.",403);
    const {data,error}=await auth.client.from("simops_conflict_rules").insert({
      rule_code:text(body.rule_code,80),name:text(body.name,180),activity_type_a:text(body.activity_type_a,60),activity_type_b:text(body.activity_type_b,60),
      severity:text(body.severity,20)||"high",rationale:text(body.rationale,2000),required_controls:Array.isArray(body.required_controls)?body.required_controls:[],
      is_active:true,system_seeded:false,created_by:auth.user.id,updated_by:auth.user.id
    }).select("*").single();
    if(error||!data)return fail(error?.message||"Conflict rule could not be created.");
    return Response.json({ok:true,data},{status:201});
  }
  return fail("Unsupported SIMOPS action.",400);
}

export async function PATCH(request:NextRequest){
  const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("SIMOPS changes require HSE staff access.",403);
  const body=await bodyOf(request);if(!body)return fail("JSON body required.",400);
  const action=text(body.action,60),id=text(body.id,80);if(!id)return fail("Record ID is required.");
  if(action==="update_plan"){
    const patch:Json={updated_by:auth.user.id,updated_at:new Date().toISOString()};
    if(body.status!==undefined)patch.status=text(body.status,30);
    if(body.title!==undefined)patch.title=text(body.title,240);
    if(body.owner_id!==undefined)patch.owner_id=text(body.owner_id,80)||null;
    if(body.notes!==undefined)patch.notes=text(body.notes,3000)||null;
    const {data,error}=await auth.client.from("simops_plans").update(patch).eq("id",id).select("*").single();
    if(error||!data)return fail(error?.message||"SIMOPS plan could not be updated.",409);
    return Response.json({ok:true,data});
  }
  if(action==="acknowledge_conflict"){
    const {data,error}=await auth.client.from("simops_conflicts").update({status:"acknowledged",acknowledged_by:auth.user.id,acknowledged_at:new Date().toISOString(),owner_id:text(body.owner_id,80)||auth.user.id,updated_at:new Date().toISOString()}).eq("id",id).select("*").single();
    if(error||!data)return fail(error?.message||"Conflict could not be acknowledged.");
    return Response.json({ok:true,data});
  }
  if(action==="resolve_conflict"){
    const resolution=text(body.resolution,3000);if(!resolution)return fail("Resolution is required.");
    const status=["controlled","resolved","accepted"].includes(String(body.status))?String(body.status):"resolved";
    const {data,error}=await auth.client.from("simops_conflicts").update({status,resolution,evidence_url:text(body.evidence_url,500)||null,linked_action_id:text(body.linked_action_id,80)||null,resolved_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id).select("*").single();
    if(error||!data)return fail(error?.message||"Conflict could not be resolved.");
    return Response.json({ok:true,data});
  }
  return fail("Unsupported SIMOPS update.",400);
}
