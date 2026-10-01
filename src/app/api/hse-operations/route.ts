import { NextRequest } from "next/server";
import { isAuthContext, requireAuth } from "@/lib/server-auth";
import { cleanText } from "@/lib/live-meeting";

const resources = new Set(["violation_template","employee_violation","safety_case","workflow","management_of_change","shift_handover","shift_handover_item","monthly_report","safety_learning","chemical","chemical_transaction","risk_register","risk_control","critical_control","critical_control_verification","process_safety_scenario","process_safety_barrier","barrier_impairment","ih_agent","ih_seg","ih_campaign","ih_measurement","occupational_health_requirement","inspection_template","inspection_schedule","inspection_task","equipment_asset","equipment_defect","fire_event","emergency_event","safety_pyramid"]);
const recordFields = "id,reference_no,resource_type,title,status,priority,owner_id,site_id,department_id,due_date,payload,created_by,updated_by,created_at,updated_at";
const employeeFields = "id,employee_id,full_name,job_title,department_id,site_id,section_name,supervisor_id,email,phone,employment_status,medical_fitness,employee_type,ppe_summary,completed_training,linked_profile_id,created_at,updated_at";
const taskFields = "id,plan_id,title,title_ar,description,category,priority,status,assignee_id,backup_id,site_id,department_id,starts_on,due_date,linked_module,linked_record_id,notes,recurrence,evidence_required,verified_by,verified_at,created_at,updated_at";
function jsonError(message: string, status = 422) { return Response.json({ ok: false, error: message }, { status }); }
function parsePayload(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function ref(resource: string) { return `HSE-${resource.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`; }
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth;
  const resource = cleanText(request.nextUrl.searchParams.get("resource"), 60) || "records";
  const search = cleanText(request.nextUrl.searchParams.get("search"), 120);
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 100), 1), 250);
  if (resource === "employees" || resource === "hse-team") {
    let query = auth.client.from("employee_directory").select(employeeFields).order("full_name", { ascending: true }).limit(limit);
    if (search) query = query.or(`full_name.ilike.%${search}%,employee_id.ilike.%${search}%,job_title.ilike.%${search}%`);
    if (resource === "hse-team") query = query.eq("employee_type", "employee");
    const { data, error } = await query; if (error) return jsonError(error.message, 500); return Response.json({ ok: true, data: data ?? [] });
  }
  if (resource === "monthly-plan-tasks") { const { data, error } = await auth.client.from("hse_monthly_plan_tasks").select(taskFields).order("due_date", { ascending: true }).limit(limit); if (error) return jsonError(error.message, 500); return Response.json({ ok: true, data: data ?? [] }); }
  if (resource === "operation-events") { const recordId = cleanText(request.nextUrl.searchParams.get("record_id"), 80); let query = auth.client.from("hse_operation_events").select("id,record_id,event_type,actor_id,previous_data,new_data,reason,created_at").order("created_at", { ascending: false }).limit(limit); if (recordId) query = query.eq("record_id", recordId); const { data, error } = await query; if (error) return jsonError(error.message, 500); return Response.json({ ok: true, data: data ?? [] }); }
  let query = auth.client.from("hse_operation_records").select(recordFields).order("updated_at", { ascending: false }).limit(limit);
  if (resources.has(resource)) query = query.eq("resource_type", resource);
  else if (resource !== "records") return jsonError("Unknown HSE Operations resource.", 404);
  if (search) query = query.or(`title.ilike.%${search}%,reference_no.ilike.%${search}%`);
  const { data, error } = await query; if (error) return jsonError(error.message, 500); return Response.json({ ok: true, data: data ?? [] });
}
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; if (!auth.isStaff) return jsonError("HSE Operations changes require staff access.", 403);
  const body = parsePayload(await request.json().catch(() => null)); const resource = cleanText(body.resource, 60);
  if (resource === "employee" || resource === "employees") { const fullName = cleanText(body.full_name, 160); const employeeId = cleanText(body.employee_id, 60); if (!fullName || !employeeId) return jsonError("Employee name and employee ID are required."); const { data, error } = await auth.client.from("employee_directory").insert({ employee_id: employeeId, full_name: fullName, job_title: cleanText(body.job_title, 160) || null, department_id: cleanText(body.department_id, 80) || null, site_id: cleanText(body.site_id, 80) || null, section_name: cleanText(body.section_name, 120) || null, email: cleanText(body.email, 200) || null, phone: cleanText(body.phone, 50) || null, employment_status: ["active","on_leave","terminated"].includes(String(body.employment_status)) ? body.employment_status : "active", medical_fitness: ["fit","fit_with_limitations","medical_review_due"].includes(String(body.medical_fitness)) ? body.medical_fitness : "fit", employee_type: ["employee","contractor","visitor","intern"].includes(String(body.employee_type)) ? body.employee_type : "employee", ppe_summary: parsePayload(body.ppe_summary), completed_training: Array.isArray(body.completed_training) ? body.completed_training : [] }).select(employeeFields).single(); if (error || !data) return jsonError(error?.message ?? "Employee could not be created."); return Response.json({ ok: true, data }, { status: 201 }); }
  if (resource === "monthly-plan-task") { const title = cleanText(body.title, 200); const planId = cleanText(body.plan_id, 80); if (!title || !planId) return jsonError("Plan ID and task title are required."); const { data, error } = await auth.client.from("hse_monthly_plan_tasks").insert({ plan_id: planId, title, title_ar: cleanText(body.title_ar, 200) || null, description: cleanText(body.description, 2000) || null, category: cleanText(body.category, 40) || "general", priority: cleanText(body.priority, 20) || "medium", assignee_id: cleanText(body.assignee_id, 80) || null, due_date: cleanText(body.due_date, 20) || null, linked_module: cleanText(body.linked_module, 80) || null, evidence_required: body.evidence_required === true }).select(taskFields).single(); if (error || !data) return jsonError(error?.message ?? "Task could not be created."); return Response.json({ ok: true, data }, { status: 201 }); }
  if (!resources.has(resource)) return jsonError("A valid HSE Operations resource is required."); const title = cleanText(body.title, 240); if (!title) return jsonError("Record title is required."); const payload=parsePayload(body.payload); const clientSubmissionId=resource==="safety_case"?cleanText(payload.client_submission_id,120):"";
  if(clientSubmissionId){
    const {data:existing,error:existingError}=await auth.client.from("hse_operation_records").select(recordFields).eq("resource_type","safety_case").eq("payload->>client_submission_id",clientSubmissionId).maybeSingle();
    if(existingError)return jsonError(existingError.message,500);
    if(existing)return Response.json({ok:true,data:existing,duplicate_reconciled:true});
  }
  const { data, error } = await auth.client.from("hse_operation_records").insert({ reference_no: cleanText(body.reference_no, 80) || ref(resource), resource_type: resource, title, status: cleanText(body.status, 40) || "draft", priority: cleanText(body.priority, 20) || "medium", owner_id: cleanText(body.owner_id, 80) || null, site_id: cleanText(body.site_id, 80) || null, department_id: cleanText(body.department_id, 80) || null, due_date: cleanText(body.due_date, 20) || null, payload, created_by: auth.user.id, updated_by: auth.user.id }).select(recordFields).single();
  if (error || !data) {
    if(clientSubmissionId&&error?.code==="23505"){
      const {data:existing}=await auth.client.from("hse_operation_records").select(recordFields).eq("resource_type","safety_case").eq("payload->>client_submission_id",clientSubmissionId).maybeSingle();
      if(existing)return Response.json({ok:true,data:existing,duplicate_reconciled:true});
    }
    return jsonError(error?.message ?? "HSE record could not be created.");
  }
  await auth.client.from("hse_operation_events").insert({ record_id: data.id, event_type: "created", actor_id: auth.user.id, new_data: data }); return Response.json({ ok: true, data }, { status: 201 });
}
export async function PATCH(request: NextRequest) { const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; if (!auth.isStaff) return jsonError("HSE Operations changes require staff access.", 403); const body = parsePayload(await request.json().catch(() => null)); const id = cleanText(body.id, 80); const resource = cleanText(body.resource, 60); if (!id) return jsonError("Record ID is required.");
  const requestedStatus=cleanText(body.status,40);
  if(resource==="management_of_change"&&requestedStatus==="closed"){
    const [{count:reviewCount},{count:badReviews},{count:pssrCount},{count:badPssr}]=await Promise.all([
      auth.client.from("moc_reviews").select("id",{count:"exact",head:true}).eq("moc_record_id",id),
      auth.client.from("moc_reviews").select("id",{count:"exact",head:true}).eq("moc_record_id",id).not("decision","in",'("approved","approved_with_conditions")'),
      auth.client.from("moc_pssr_items").select("id",{count:"exact",head:true}).eq("moc_record_id",id),
      auth.client.from("moc_pssr_items").select("id",{count:"exact",head:true}).eq("moc_record_id",id).not("status","in",'("pass","not_applicable")')
    ]);
    if(!reviewCount)return jsonError("MOC cannot close without required reviews.",409);
    if(badReviews)return jsonError("MOC cannot close while reviews are pending or rejected.",409);
    if(!pssrCount)return jsonError("MOC cannot close without PSSR verification items.",409);
    if(badPssr)return jsonError("MOC cannot close until all PSSR items pass or are not applicable.",409);
  }
  if(resource==="safety_learning"&&["closed","completed"].includes(requestedStatus)){
    const [{count:pendingAck},{count:pendingEffectiveness}]=await Promise.all([
      auth.client.from("safety_learning_recipients").select("id",{count:"exact",head:true}).eq("alert_record_id",id).eq("acknowledgement_required",true).is("acknowledged_at",null),
      auth.client.from("safety_learning_recipients").select("id",{count:"exact",head:true}).eq("alert_record_id",id).eq("acknowledgement_required",true).in("effectiveness_status",["pending","ineffective"])
    ]);
    if(pendingAck)return jsonError("Safety learning cannot close while required acknowledgements are pending.",409);
    if(pendingEffectiveness)return jsonError("Safety learning cannot close before effectiveness review is complete.",409);
  } if (resource === "employee" || resource === "employees") { const { data, error } = await auth.client.from("employee_directory").update({ full_name: cleanText(body.full_name, 160), job_title: cleanText(body.job_title, 160) || null, employment_status: body.employment_status, medical_fitness: body.medical_fitness, phone: cleanText(body.phone, 50) || null, updated_at: new Date().toISOString() }).eq("id", id).select(employeeFields).single(); if (error || !data) return jsonError(error?.message ?? "Employee could not be updated."); return Response.json({ ok: true, data }); } if (resource === "monthly-plan-task") { const { data, error } = await auth.client.from("hse_monthly_plan_tasks").update({ status: cleanText(body.status, 30), notes: cleanText(body.notes, 2000) || null, due_date: cleanText(body.due_date, 20) || null, updated_at: new Date().toISOString() }).eq("id", id).select(taskFields).single(); if (error || !data) return jsonError(error?.message ?? "Task could not be updated."); return Response.json({ ok: true, data }); } const { data: previous } = await auth.client.from("hse_operation_records").select(recordFields).eq("id", id).single(); const { data, error } = await auth.client.from("hse_operation_records").update({ title: cleanText(body.title, 240), status: cleanText(body.status, 40), priority: cleanText(body.priority, 20), due_date: cleanText(body.due_date, 20) || null, payload: parsePayload(body.payload), updated_by: auth.user.id, updated_at: new Date().toISOString() }).eq("id", id).select(recordFields).single(); if (error || !data) return jsonError(error?.message ?? "HSE record could not be updated."); await auth.client.from("hse_operation_events").insert({ record_id: id, event_type: "updated", actor_id: auth.user.id, previous_data: previous, new_data: data, reason: cleanText(body.reason, 500) || null }); return Response.json({ ok: true, data }); }
export async function DELETE(request: NextRequest) { const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; if (!auth.isStaff) return jsonError("HSE Operations deletion requires staff access.", 403); const id = cleanText(request.nextUrl.searchParams.get("id"), 80); const resource = cleanText(request.nextUrl.searchParams.get("resource"), 60); if (!id || !resource) return jsonError("Record ID and resource are required."); const table = resource === "employee" || resource === "employees" ? "employee_directory" : resource === "monthly-plan-task" ? "hse_monthly_plan_tasks" : "hse_operation_records"; const { error } = await auth.client.from(table).delete().eq("id", id); if (error) return jsonError(error.message, 422); return Response.json({ ok: true, data: { id, deleted: true } }); }
