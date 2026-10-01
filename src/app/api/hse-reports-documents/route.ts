/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

const resources = {
  documents: { table: "hse_documents", fields: "id,document_no,title,category,document_type,status,file_name,mime_type,file_size_bytes,storage_bucket,storage_path,external_url,source_type,source_id,revision,issued_at,expiry_at,created_by,approved_by,approved_at,created_at,updated_at", order: "updated_at" },
  signs: { table: "safety_signs", fields: "id,document_no,title_en,title_ar,instructions_en,instructions_ar,category,status,size,custom_width,custom_height,background_color,qr_target,print_count,logo_url,created_by,created_at,updated_at", order: "updated_at" },
  contracts: { table: "hse_contracts", fields: "id,reference_no,title,vendor,department,start_date,end_date,contract_value,currency,status,metadata,notes,created_by,created_at,updated_at", order: "updated_at" },
  forms: { table: "hse_forms", fields: "id,form_no,title,description,status,version,document_id,attachment_url,created_by,created_at,updated_at", order: "updated_at" },
  invoices: { table: "hse_invoices", fields: "id,invoice_no,vendor,department,invoice_date,due_date,amount,currency,status,document_id,notes,created_by,created_at,updated_at", order: "updated_at" },
  exports: { table: "hse_report_exports", fields: "id,report_type,source_type,source_id,title,format,parameters,generated_by,generated_at,status,storage_bucket,storage_path", order: "generated_at" },
} as const;
type Resource = keyof typeof resources;
const clean = (value: unknown, max = 2000) => typeof value === "string" ? value.trim().slice(0, max) : "";
const error = (message: string, status = 422) => Response.json({ ok: false, error: message }, { status });
function getResource(request: NextRequest): Resource | null { const value = request.nextUrl.searchParams.get("resource") as Resource | null; return value && value in resources ? value : null; }

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth;
  const resource = getResource(request); if (!resource) return error("A valid reports-documents resource is required.", 400);
  if (request.nextUrl.searchParams.get("action") === "signed-url") {
    const id = clean(request.nextUrl.searchParams.get("id"), 80); if (!id) return error("Document ID is required.", 422);
    if (resource !== "documents") return error("Signed URLs are available for documents only.", 422);
    const { data, error: dbError } = await (auth.client as any).from("hse_documents").select("id,storage_bucket,storage_path,external_url").eq("id", id).maybeSingle();
    if (dbError) return error(dbError.message, 500); if (!data) return error("Document not found.", 404);
    if (data.external_url) return Response.json({ ok: true, data: { url: data.external_url, signed: false, source: "external" } });
    if (!data.storage_bucket || !data.storage_path) return error("This document has no configured storage object.", 409);
    const signed = await auth.client.storage.from(data.storage_bucket).createSignedUrl(data.storage_path, 300);
    if (signed.error || !signed.data?.signedUrl) return error(signed.error?.message ?? "Signed URL could not be created.", 502);
    return Response.json({ ok: true, data: { url: signed.data.signedUrl, signed: true, expires_in: 300 } });
  }
  const config = resources[resource]; const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 250), 250);
  const { data, error: dbError } = await (auth.client as any).from(config.table).select(config.fields).order(config.order, { ascending: false }).limit(limit);
  if (dbError) return error(dbError.message, 500); return Response.json({ ok: true, data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; if (!auth.isStaff) return error("Reports and document changes require HSE staff access.", 403);
  const resource = getResource(request); if (!resource) return error("A valid reports-documents resource is required.", 400);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null; if (!body) return error("A JSON body is required.", 400);
  const now = new Date().toISOString(); let payload: Record<string, unknown>;
  if (resource === "documents") { const title = clean(body.title, 240); if (!title || !clean(body.category, 40)) return error("Document title and category are required."); payload = { document_no: clean(body.document_no, 80) || `DOC-${Date.now()}`, title, category: clean(body.category, 40), document_type: clean(body.document_type, 100) || null, status: clean(body.status, 30) || "draft", file_name: clean(body.file_name, 240) || null, mime_type: clean(body.mime_type, 120) || null, file_size_bytes: typeof body.file_size_bytes === "number" ? body.file_size_bytes : null, storage_bucket: clean(body.storage_bucket, 120) || null, storage_path: clean(body.storage_path, 500) || null, external_url: clean(body.external_url, 1000) || null, source_type: clean(body.source_type, 80) || null, source_id: clean(body.source_id, 80) || null, revision: clean(body.revision, 30) || "1.0", issued_at: clean(body.issued_at, 20) || null, expiry_at: clean(body.expiry_at, 20) || null, created_by: auth.user.id, updated_at: now }; }
  else if (resource === "signs") { const title = clean(body.title_en, 240); if (!title || !clean(body.category, 40)) return error("English sign title and category are required."); payload = { document_no: clean(body.document_no, 80) || `SIGN-${Date.now()}`, title_en: title, title_ar: clean(body.title_ar, 240) || null, instructions_en: clean(body.instructions_en, 2000) || null, instructions_ar: clean(body.instructions_ar, 2000) || null, category: clean(body.category, 40), status: clean(body.status, 30) || "draft", size: clean(body.size, 30) || "a4_portrait", custom_width: body.custom_width ?? null, custom_height: body.custom_height ?? null, background_color: clean(body.background_color, 20) || "#ffffff", qr_target: clean(body.qr_target, 1000) || null, created_by: auth.user.id, updated_at: now }; }
  else if (resource === "contracts") { const title = clean(body.title, 240); if (!title) return error("Contract title is required."); payload = { reference_no: clean(body.reference_no, 80) || `CON-${Date.now()}`, title, vendor: clean(body.vendor, 240) || null, department: clean(body.department, 160) || null, start_date: clean(body.start_date, 20) || null, end_date: clean(body.end_date, 20) || null, contract_value: typeof body.contract_value === "number" ? body.contract_value : null, currency: clean(body.currency, 10) || "SAR", status: clean(body.status, 20) || "pending", metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {}, notes: clean(body.notes, 2000) || null, created_by: auth.user.id, updated_at: now }; }
  else if (resource === "forms") { const title = clean(body.title, 240); if (!title) return error("Form title is required."); payload = { form_no: clean(body.form_no, 80) || `FORM-${Date.now()}`, title, description: clean(body.description, 2000) || null, status: clean(body.status, 20) || "draft", version: clean(body.version, 30) || "1.0", document_id: clean(body.document_id, 80) || null, attachment_url: clean(body.attachment_url, 1000) || null, created_by: auth.user.id, updated_at: now }; }
  else if (resource === "invoices") { const invoiceNo = clean(body.invoice_no, 80); if (!invoiceNo) return error("Invoice number is required."); payload = { invoice_no: invoiceNo, vendor: clean(body.vendor, 240) || null, department: clean(body.department, 160) || null, invoice_date: clean(body.invoice_date, 20) || null, due_date: clean(body.due_date, 20) || null, amount: typeof body.amount === "number" ? body.amount : null, currency: clean(body.currency, 10) || "SAR", status: clean(body.status, 20) || "unpaid", document_id: clean(body.document_id, 80) || null, notes: clean(body.notes, 2000) || null, created_by: auth.user.id, updated_at: now }; }
  else { const title = clean(body.title, 240); if (!title) return error("Export title is required."); payload = { report_type: clean(body.report_type, 80) || "enterprise", source_type: clean(body.source_type, 80) || null, source_id: clean(body.source_id, 80) || null, title, format: clean(body.format, 20) || "print", parameters: body.parameters && typeof body.parameters === "object" ? body.parameters : {}, generated_by: auth.user.id }; }
  const { data, error: dbError } = await (auth.client as any).from(resources[resource].table).insert(payload).select(resources[resource].fields).single();
  if (dbError || !data) return error(dbError?.message ?? "Record could not be created.", 422); return Response.json({ ok: true, data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; if (!auth.isStaff) return error("Reports and document changes require HSE staff access.", 403);
  const resource = getResource(request); if (!resource || resource === "exports") return error("A mutable resource is required.", 400); const body = await request.json().catch(() => null) as Record<string, unknown> | null; const id = clean(body?.id, 80); if (!id) return error("Record ID is required.", 422);
  const allowed = ["title","title_en","title_ar","instructions_en","instructions_ar","description","category","status","size","version","vendor","department","start_date","end_date","contract_value","currency","notes","invoice_date","due_date","amount","document_type","external_url","storage_bucket","storage_path","expiry_at","issued_at","revision","attachment_url","qr_target","metadata"];
  const patch: Record<string, unknown> = {}; for (const key of allowed) if (body?.[key] !== undefined) patch[key] = body[key]; patch.updated_at = new Date().toISOString();
  const { data, error: dbError } = await (auth.client as any).from(resources[resource].table).update(patch).eq("id", id).select(resources[resource].fields).single(); if (dbError || !data) return error(dbError?.message ?? "Record could not be updated.", 422); return Response.json({ ok: true, data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; if (!auth.isStaff) return error("Reports and document changes require HSE staff access.", 403); const resource = getResource(request); const id = clean(request.nextUrl.searchParams.get("id"), 80); if (!resource || resource === "exports" || !id) return error("Resource and record ID are required.", 422); const { error: dbError } = await (auth.client as any).from(resources[resource].table).delete().eq("id", id); if (dbError) return error(dbError.message, 500); return Response.json({ ok: true, data: { id, deleted: true } });
}
