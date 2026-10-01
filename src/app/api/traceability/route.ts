/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { isAuthContext, requireAuth } from "@/lib/server-auth";
import { cleanText } from "@/lib/live-meeting";

const configs = {
  record_links:{table:"hse_record_links",fields:["source_type","source_id","target_type","target_id","relationship_type","metadata"],filters:["source_type","source_id","target_type","target_id","relationship_type"]},
  action_comments:{table:"action_comments",fields:["action_id","body"],filters:["action_id","created_by"]},
  action_evidence:{table:"action_evidence",fields:["action_id","attachment_id","evidence_url","evidence_type","description"],filters:["action_id","evidence_type"]},
  action_escalations:{table:"action_escalations",fields:["action_id","escalation_id"],filters:["action_id","escalation_id"]},
  action_history:{table:"action_history",fields:["action_id","event_type","previous_data","new_data","reason","actor_id"],filters:["action_id","event_type","actor_id"]},
  jsa_steps:{table:"jsa_steps",fields:["jsa_id","step_no","task_step","hazards","controls","responsible_person","residual_risk","ppe"],filters:["jsa_id"]},
  jsa_acknowledgements:{table:"jsa_acknowledgements",fields:["jsa_id","user_id","acknowledgement"],filters:["jsa_id","user_id"]},
  moc_reviews:{table:"moc_reviews",fields:["moc_record_id","review_type","reviewer_id","decision","comments","reviewed_at"],filters:["moc_record_id","reviewer_id","decision"]},
  moc_pssr:{table:"moc_pssr_items",fields:["moc_record_id","item_no","requirement","status","evidence","verified_by","verified_at"],filters:["moc_record_id","status"]},
  critical_control_verifications:{table:"critical_control_verifications",fields:["critical_control_record_id","verification_date","verifier_id","method","result","evidence","notes","linked_action_id"],filters:["critical_control_record_id","result","linked_action_id"]},
  safety_learning_recipients:{table:"safety_learning_recipients",fields:["alert_record_id","recipient_id","acknowledgement_required","acknowledged_at","acknowledgement_comment","effectiveness_status","effectiveness_reviewed_at"],filters:["alert_record_id","recipient_id","effectiveness_status"]},
  handover_items:{table:"hse_shift_handover_items",fields:["handover_record_id","item_type","details","priority","owner_id","due_date","source_type","source_id","status","carried_to_handover_id"],filters:["handover_record_id","owner_id","status","priority"]},
  workflow_links:{table:"hse_workflow_links",fields:["workflow_record_id","source_type","source_id","relationship_type"],filters:["workflow_record_id","source_type","source_id"]},
  workflow_events:{table:"hse_workflow_events",fields:["workflow_record_id","event_type","previous_status","new_status","details"],filters:["workflow_record_id","event_type"]},
  safety_learning_notice_log:{table:"safety_learning_notice_log",fields:["alert_record_id","recipient_id","channel","delivery_status","delivered_at","error_message","metadata"],filters:["alert_record_id","recipient_id","delivery_status","channel"]},
  safety_learning_decisions:{table:"safety_learning_decisions",fields:["alert_record_id","decision","rationale"],filters:["alert_record_id","decision","decided_by"]},
  occupational_surveillance:{table:"occupational_health_surveillance",fields:["employee_id","requirement_record_id","surveillance_type","performed_on","next_due_date","outcome","restrictions","provider","evidence_attachment_id","confidential_summary"],filters:["employee_id","requirement_record_id","next_due_date"]},
  bowtie_threats:{table:"bowtie_threats",fields:["scenario_record_id","threat","description","likelihood","linked_risk_type","linked_risk_id"],filters:["scenario_record_id","linked_risk_type","linked_risk_id"]},
  bowtie_consequences:{table:"bowtie_consequences",fields:["scenario_record_id","consequence","description","severity"],filters:["scenario_record_id","severity"]},
  barrier_links:{table:"process_safety_barrier_links",fields:["scenario_record_id","barrier_record_id","side","linked_threat_id","linked_consequence_id"],filters:["scenario_record_id","barrier_record_id","side"]},
  barrier_impairments:{table:"process_safety_barrier_impairments",fields:["barrier_record_id","status","impairment_description","started_at","expected_restore_at","restored_at","compensating_measures","linked_action_id"],filters:["barrier_record_id","status","linked_action_id"]},
  equipment_service_records:{table:"equipment_service_records",fields:["equipment_passport_id","safety_asset_id","service_type","service_date","provider","findings","actions_taken","next_due_date","evidence_attachment_id"],filters:["equipment_passport_id","safety_asset_id","service_type"]},
  equipment_operator_authorizations:{table:"equipment_operator_authorizations",fields:["equipment_passport_id","safety_asset_id","employee_id","authorization_id","valid_from","valid_until","status"],filters:["equipment_passport_id","safety_asset_id","employee_id","status"]},
  contractor_scorecards:{table:"contractor_scorecards",fields:["contractor_id","period_start","period_end","safety_score","compliance_score","training_score","incident_score","overall_score","decision","notes"],filters:["contractor_id","decision"]},
  fire_inspection_records:{table:"fire_inspection_records",fields:["fire_equipment_id","fire_device_id","inspection_date","result","findings","action_required"],filters:["fire_equipment_id","fire_device_id","result"]},
  fire_pump_records:{table:"fire_pump_records",fields:["site_id","pump_ref","recorded_at","pressure","status","notes"],filters:["site_id","pump_ref","status"]},
  fire_alarm_records:{table:"fire_alarm_records",fields:["panel_id","event_type","occurred_at","details","acknowledged_by","acknowledged_at"],filters:["panel_id","event_type"]},
  fire_maintenance_records:{table:"fire_maintenance_records",fields:["fire_equipment_id","fire_device_id","maintenance_type","performed_at","provider","findings","work_performed","next_due_date"],filters:["fire_equipment_id","fire_device_id","maintenance_type"]},
  radio_transmissions:{table:"safety_radio_transmissions",fields:["channel_id","user_id","started_at","ended_at","duration_ms","metadata"],filters:["channel_id","user_id"]},
} as const;

type Key = keyof typeof configs;
const fail=(error:string,status=422)=>Response.json({ok:false,error},{status});
const keyOf=(v:string|null):Key|null=>v&&v in configs?v as Key:null;
function sanitize(value:unknown){
  if(value===null||typeof value==="boolean"||typeof value==="number") return value;
  if(Array.isArray(value)) return value.slice(0,100);
  if(value&&typeof value==="object") return value;
  return cleanText(value,4000)||null;
}
function payloadFor(key:Key,body:Record<string,unknown>,userId:string){
  const out:Record<string,unknown>={};
  for(const field of configs[key].fields) if(field in body) out[field]=sanitize(body[field]);
  if(["record_links","action_comments","action_evidence","action_escalations","workflow_links","workflow_events","bowtie_threats","bowtie_consequences","barrier_links","barrier_impairments","equipment_service_records","equipment_operator_authorizations"].includes(key)) out.created_by=userId;
  if(key==="safety_learning_decisions") out.decided_by=userId;
  if(["contractor_scorecards"].includes(key)) out.reviewed_by=userId;
  if(key==="fire_inspection_records") out.inspected_by=userId;
  if(key==="fire_pump_records") out.recorded_by=userId;
  if(key==="fire_maintenance_records") out.performed_by=userId;
  return out;
}
export async function GET(request:NextRequest){
  const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("HSE staff access is required.",403);
  const key=keyOf(request.nextUrl.searchParams.get("resource"));if(!key)return fail("A valid traceability resource is required.",400);
  const c=configs[key];const db=auth.client as any;const limit=Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")||100),1),250);
  let q=db.from(c.table).select("*").order("created_at",{ascending:false}).limit(limit);
  for(const f of c.filters){const v=cleanText(request.nextUrl.searchParams.get(f),160);if(v)q=q.eq(f,v);}
  const {data,error}=await q;if(error)return fail(error.message,500);
  if(key==="occupational_surveillance"&&!["super_admin","hse_manager"].includes(auth.profile.role_code)) {
    return Response.json({ok:true,data:(data||[]).map(({confidential_summary,...rest}:any)=>rest)});
  }
  return Response.json({ok:true,data:data||[]});
}
export async function POST(request:NextRequest){
  const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("HSE staff access is required.",403);
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;const key=keyOf(cleanText(body?.resource,80));if(!key)return fail("A valid traceability resource is required.",400);
  if(["action_history","workflow_events","safety_learning_notice_log","safety_learning_decisions","radio_transmissions"].includes(key as string))return fail("This traceability resource is append-only or system-generated.",409);
  if(key==="occupational_surveillance"&&!["super_admin","hse_manager"].includes(auth.profile.role_code))return fail("Occupational health surveillance requires HSE Manager or Super Admin.",403);
  const db=auth.client as any;const payload=payloadFor(key,body||{},auth.user.id);
  const {data,error}=await db.from(configs[key].table).insert(payload).select("*").single();if(error||!data)return fail(error?.message||"Traceability record could not be created.",422);
  await db.from("audit_logs").insert({actor_id:auth.user.id,event_type:"traceability.created",entity_type:key,entity_id:data.id,new_data:{resource:key,record_id:data.id}});
  return Response.json({ok:true,data},{status:201});
}
export async function PATCH(request:NextRequest){
  const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("HSE staff access is required.",403);
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;const key=keyOf(cleanText(body?.resource,80));const id=cleanText(body?.id,80);if(!key||!id)return fail("Resource and record ID are required.",400);
  if(["action_history","workflow_events","safety_learning_notice_log","safety_learning_decisions","radio_transmissions"].includes(key as string))return fail("This traceability record is append-only.",409);
  if(key==="occupational_surveillance"&&!["super_admin","hse_manager"].includes(auth.profile.role_code))return fail("Occupational health surveillance requires HSE Manager or Super Admin.",403);
  const db=auth.client as any;const payload=payloadFor(key,body||{},auth.user.id);delete payload.created_by;delete payload.decided_by;delete payload.reviewed_by;delete payload.inspected_by;delete payload.recorded_by;delete payload.performed_by;
  const {data,error}=await db.from(configs[key].table).update(payload).eq("id",id).select("*").single();if(error||!data)return fail(error?.message||"Traceability record could not be updated.",422);
  await db.from("audit_logs").insert({actor_id:auth.user.id,event_type:"traceability.updated",entity_type:key,entity_id:id,new_data:{resource:key,record_id:id}});
  return Response.json({ok:true,data});
}
export async function DELETE(request:NextRequest){
  const auth=await requireAuth(request);if(!isAuthContext(auth))return auth;if(!auth.isStaff)return fail("HSE staff access is required.",403);
  const key=keyOf(request.nextUrl.searchParams.get("resource"));const id=cleanText(request.nextUrl.searchParams.get("id"),80);if(!key||!id)return fail("Resource and record ID are required.",400);
  if(["action_history","workflow_events","safety_learning_notice_log","safety_learning_decisions","radio_transmissions"].includes(key as string))return fail("Append-only traceability records cannot be deleted.",409);
  if(key==="occupational_surveillance"&&!["super_admin","hse_manager"].includes(auth.profile.role_code))return fail("Occupational health surveillance requires HSE Manager or Super Admin.",403);
  const db=auth.client as any;const {error}=await db.from(configs[key].table).delete().eq("id",id);if(error)return fail(error.message,422);
  await db.from("audit_logs").insert({actor_id:auth.user.id,event_type:"traceability.deleted",entity_type:key,entity_id:id,new_data:{resource:key,record_id:id}});
  return Response.json({ok:true,data:{id}});
}
