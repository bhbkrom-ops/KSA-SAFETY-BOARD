"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ClipboardCheck,
  Database,
  Eye,
  FileWarning,
  Flame,
  Globe2,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import type { Tables, TablesInsert } from "@/lib/database.types";
import LiveMeetingView from "@/components/live-meeting";
import VisionCommandCenter, { type VisionView } from "@/components/vision-command-center";
import OverviewCommandCenter, { type OverviewView } from "@/components/overview-command-center";
import HSEOperationsCommandCenter, { type HSEOperationsView } from "@/components/hse-operations-command-center";
import EscalationCommandCenter, { type EscalationView } from "@/components/escalation-command-center";
import { navigationGroups, pathForRoute } from "@/lib/route-registry";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type ModuleView = "reports" | "actions" | "risk" | "incidents" | "ncr";
type View = OverviewView | ModuleView | HSEOperationsView | EscalationView | "live-meeting" | "vision" | "report";
type Profile = Pick<Tables<"profiles">, "display_name" | "email" | "role_code" | "is_active">;
type BoardRow = {
  id: string;
  reference: string;
  title: string;
  location: string;
  status: string;
  priority: string;
  updated: string;
};
type SafetyBoardProps = { view?: View; visionView?: VisionView };

type RowStatusTone = "blue" | "green" | "amber" | "red" | "neutral";

const STAFF_ROLES = new Set<Tables<"profiles">["role_code"]>([
  "super_admin",
  "hse_manager",
  "hse_leader",
  "hse_supervisor",
  "senior_safety_officer",
  "safety_officer",
  "auditor",
]);

const moduleConfig: Record<ModuleView, { eyebrow: string; title: string; description: string; icon: typeof FileWarning; button: string }> = {
  reports: { eyebrow: "SAFETY REPORTING", title: "Safety reports", description: "Review observations, hazards, near misses, and positive interventions from the live register.", icon: FileWarning, button: "New report" },
  actions: { eyebrow: "CENTRAL ACTION TRACKER", title: "Action tracker", description: "Keep ownership, due dates, evidence, and verification visible across every source module.", icon: ListChecks, button: "Action rules" },
  risk: { eyebrow: "RISK ASSURANCE", title: "Risk & JSA", description: "Review hazards with a configurable 5×5 matrix and documented residual controls.", icon: ShieldAlert, button: "New assessment" },
  incidents: { eyebrow: "INCIDENT MANAGEMENT", title: "Incident register", description: "Investigate neutrally, capture evidence, and move learning into controlled actions.", icon: Siren, button: "New incident" },
  ncr: { eyebrow: "QUALITY & COMPLIANCE", title: "NCR / CAPA", description: "Track nonconformance from containment through effectiveness verification and closure.", icon: ClipboardCheck, button: "New NCR" },
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toneFor(value: string): RowStatusTone {
  const normalized = value.toLowerCase();
  if (normalized.includes("critical") || normalized.includes("high") || normalized.includes("overdue")) return "red";
  if (normalized.includes("closed") || normalized.includes("approved") || normalized.includes("active")) return "green";
  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("progress")) return "amber";
  if (normalized.includes("low") || normalized.includes("submitted") || normalized.includes("open")) return "blue";
  return "neutral";
}

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: RowStatusTone }) {
  return <span className={`status-pill status-${tone}`}><span className="status-dot" />{children}</span>;
}

function BrandMark() {
  return <div className="brand-mark" aria-label="KSA Safety Board"><div className="brand-symbol"><ShieldCheck size={22} strokeWidth={2.2} /></div><div><div className="brand-name">KSA</div><div className="brand-subtitle">SAFETY BOARD</div></div></div>;
}

function LoadingState({ label = "Loading safety workspace…" }: { label?: string }) {
  return <div className="state-card"><LoaderCircle className="spin" size={24} /><strong>{label}</strong><span>Connecting to the operational data service.</span></div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="state-card state-error"><AlertTriangle size={24} /><strong>We could not load this view</strong><span>{message}</span>{onRetry && <button className="secondary-button" onClick={onRetry}><RefreshCw size={15} /> Try again</button>}</div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="state-card"><Database size={24} /><strong>No {label.toLowerCase()} yet</strong><span>Records created through the safety workflow will appear here.</span></div>;
}

function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() || email.split("@")[0] } } });
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) setMessage("Account created. Check your email if confirmation is enabled, then sign in.");
  }

  return <div className="auth-page"><div className="auth-card"><BrandMark /><div className="eyebrow accent-eyebrow">SECURE HSE WORKSPACE</div><h1>{mode === "signin" ? "Welcome back." : "Create your operator account."}</h1><p className="auth-copy">Access is protected by Supabase Auth and the safety board role policy.</p><div className="auth-tabs"><button className={mode === "signin" ? "selected" : ""} onClick={() => setMode("signin")}>Sign in</button><button className={mode === "signup" ? "selected" : ""} onClick={() => setMode("signup")}>Request access</button></div>{error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status"><CheckCircle2 size={15} /> {message}</div>}<form className="auth-form" onSubmit={submit}>{mode === "signup" && <label>Full name<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>}<label>Work email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label>Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label><button className="primary-button wide" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={16} /> Connecting…</> : mode === "signin" ? "Sign in to safety board" : "Create access request"}</button></form><div className="auth-note"><LockKeyhole size={15} /> Your role and site scope are enforced in the database, not only in the interface.</div></div></div>;
}

function Sidebar({ active, onNavigate, profile, onSignOut }: { active: View; onNavigate: (view: View) => void; profile: Profile; onSignOut: () => void }) {
  const displayName = profile.display_name || profile.email || "Operator";
  return <aside className="sidebar"><div className="sidebar-top"><BrandMark /><div className="sidebar-mobile-close"><X size={18} /></div></div><div className="site-context"><div className="site-icon"><Building2 size={17} /></div><div><span className="eyebrow">CURRENT SITE</span><strong>West Industrial Campus</strong></div><ChevronDown size={15} className="muted-icon" /></div><nav className="sidebar-nav" aria-label="Primary navigation">{navigationGroups.map((group) => <div className="nav-group" key={group.label}><div className="eyebrow nav-label">{group.label}</div>{group.items.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => onNavigate(id as View)} aria-current={active === id ? "page" : undefined}><Icon size={17} /><span>{label}</span>{id === "actions" && <span className="nav-count">Live</span>}</button>)}</div>)}<div className="nav-group"><div className="eyebrow nav-label">OPERATIONS</div><div className="nav-item nav-item-disabled"><Eye size={17} /><span>Inspections</span><small>Planned</small></div><div className="nav-item nav-item-disabled"><LockKeyhole size={17} /><span>PTW / LOTO</span><small>Planned</small></div><div className="nav-item nav-item-disabled"><Flame size={17} /><span>Fire & emergency</span><small>Planned</small></div><div className="nav-item nav-item-disabled"><BookOpenCheck size={17} /><span>Training</span><small>Planned</small></div></div></nav><div className="sidebar-footer"><div className="sidebar-status"><span className="live-indicator" /> Data service connected</div><div className="sidebar-user"><div className="avatar"><UserRound size={16} /></div><div><strong>{displayName}</strong><span>{formatStatus(profile.role_code)}</span></div></div><button className="nav-item" onClick={onSignOut}><LogOut size={17} /><span>Sign out</span></button><button className="nav-item nav-item-disabled"><Settings2 size={17} /><span>System settings</span><small>Planned</small></button></div></aside>;
}

function Topbar({ onSignOut, onOpenReport }: { onSignOut: () => void; onOpenReport: () => void }) {
  return <header className="topbar"><div className="mobile-menu"><Menu size={20} /></div><div className="breadcrumbs"><span>Safety board</span><ArrowRight size={14} /><strong>Command center</strong></div><div className="topbar-actions"><button className="search-trigger" onClick={onOpenReport}><Search size={16} /><span>Search register</span><kbd>⌘ K</kbd></button><button className="icon-button" aria-label="Language"><Globe2 size={18} /></button><button className="icon-button" aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button><button className="icon-button" aria-label="Sign out" onClick={onSignOut}><LogOut size={18} /></button></div></header>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><div className="eyebrow accent-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <div className="header-action">{action}</div>}</div>;
}

async function fetchRows(kind: ModuleView): Promise<BoardRow[]> {
  if (!supabase) return [];
  if (kind === "reports") {
    const { data, error } = await supabase.from("reports").select("id,reference_no,description,exact_area,status,priority,updated_at").order("updated_at", { ascending: false }).limit(100);
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.id, reference: row.reference_no, title: row.description, location: row.exact_area || "Unspecified area", status: row.status, priority: row.priority, updated: row.updated_at }));
  }
  if (kind === "actions") {
    const { data, error } = await supabase.from("actions").select("id,reference_no,title,description,status,priority,due_date,updated_at").order("updated_at", { ascending: false }).limit(100);
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.id, reference: row.reference_no, title: row.title, location: row.due_date ? `Due ${formatDate(row.due_date)}` : "No due date", status: row.status, priority: row.priority, updated: row.updated_at }));
  }
  if (kind === "risk") {
    const { data, error } = await supabase.from("risk_assessments").select("id,reference_no,title,activity,status,updated_at").order("updated_at", { ascending: false }).limit(100);
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.id, reference: row.reference_no, title: row.title, location: row.activity, status: row.status, priority: row.status === "review" ? "high" : "medium", updated: row.updated_at }));
  }
  if (kind === "incidents") {
    const { data, error } = await supabase.from("incidents").select("id,reference_no,title,incident_type,status,severity,occurred_at,updated_at").order("updated_at", { ascending: false }).limit(100);
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.id, reference: row.reference_no, title: row.title, location: row.incident_type, status: row.status, priority: row.severity, updated: row.updated_at }));
  }
  const { data, error } = await supabase.from("ncr").select("id,reference_no,nonconformance,source,status,severity,updated_at").order("updated_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, reference: row.reference_no, title: row.nonconformance, location: row.source, status: row.status, priority: row.severity, updated: row.updated_at }));
}

function CreateRecordDialog({ kind, user, onClose, onCreated }: { kind: ModuleView; user: User; onClose: () => void; onCreated: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({ category: "unsafe_condition", priority: "medium", severity: "medium", incident_type: "Injury / illness" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setValue = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const year = new Date().getFullYear();
    const suffix = Date.now().toString().slice(-6);
    let result;
    if (kind === "reports") {
      const payload: TablesInsert<"reports"> = { reference_no: `OBS-${year}-${suffix}`, category: (values.category || "unsafe_condition") as TablesInsert<"reports">["category"], priority: (values.priority || "medium") as TablesInsert<"reports">["priority"], description: values.description.trim(), exact_area: values.exact_area.trim(), reporter_id: user.id, reporter_name: user.email || "Staff operator", is_public_submission: false };
      result = await supabase.from("reports").insert(payload);
    } else if (kind === "risk") {
      const payload: TablesInsert<"risk_assessments"> = { reference_no: `RA-${year}-${suffix}`, title: values.title.trim(), activity: values.activity.trim(), owner_id: user.id, status: "draft" };
      result = await supabase.from("risk_assessments").insert(payload);
    } else if (kind === "incidents") {
      const payload: TablesInsert<"incidents"> = { reference_no: `INC-${year}-${suffix}`, title: values.title.trim(), incident_type: values.incident_type.trim(), occurred_at: values.occurred_at || new Date().toISOString(), description: values.description.trim(), severity: (values.severity || "medium") as TablesInsert<"incidents">["severity"], created_by: user.id };
      result = await supabase.from("incidents").insert(payload);
    } else {
      const payload: TablesInsert<"ncr"> = { reference_no: `NCR-${year}-${suffix}`, source: values.source.trim(), nonconformance: values.nonconformance.trim(), severity: (values.severity || "medium") as TablesInsert<"ncr">["severity"], created_by: user.id };
      result = await supabase.from("ncr").insert(payload);
    }
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    onCreated();
  }

  if (kind === "actions") return <div className="modal-backdrop" role="presentation"><div className="modal-card"><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><div className="section-icon"><ListChecks size={19} /></div><h2>Actions are source-linked</h2><p className="modal-copy">Create an action from a report, incident, risk assessment, inspection, or NCR so the corrective work always has a traceable source record.</p><button className="primary-button" onClick={() => { onClose(); onCreated(); }}>Understood</button></div></div>;

  return <div className="modal-backdrop" role="presentation"><div className="modal-card"><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><div className="eyebrow accent-eyebrow">NEW {kind === "reports" ? "SAFETY REPORT" : kind === "risk" ? "RISK ASSESSMENT" : kind === "incidents" ? "INCIDENT" : "NCR"}</div><h2>Create operational record</h2><p className="modal-copy">This record is written to Supabase and protected by the active role policy.</p>{error && <div className="form-error" role="alert">{error}</div>}<form className="modal-form" onSubmit={submit}>{kind === "reports" && <><label>Report type<select value={values.category} onChange={(event) => setValue("category", event.target.value)}><option value="unsafe_condition">Unsafe condition</option><option value="unsafe_act">Unsafe act</option><option value="near_miss">Near miss</option><option value="positive_observation">Positive observation</option><option value="environmental_observation">Environmental observation</option></select></label><div className="form-grid"><label>Priority<select value={values.priority} onChange={(event) => setValue("priority", event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label><label>Exact area<input required value={values.exact_area || ""} onChange={(event) => setValue("exact_area", event.target.value)} /></label></div><label>Description<textarea required minLength={10} rows={4} value={values.description || ""} onChange={(event) => setValue("description", event.target.value)} /></label></>}{kind === "risk" && <><label>Assessment title<input required value={values.title || ""} onChange={(event) => setValue("title", event.target.value)} /></label><label>Activity / task<textarea required rows={3} value={values.activity || ""} onChange={(event) => setValue("activity", event.target.value)} /></label></>}{kind === "incidents" && <><label>Incident title<input required value={values.title || ""} onChange={(event) => setValue("title", event.target.value)} /></label><div className="form-grid"><label>Incident type<input required value={values.incident_type} onChange={(event) => setValue("incident_type", event.target.value)} /></label><label>Severity<select value={values.severity} onChange={(event) => setValue("severity", event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label></div><label>What happened?<textarea required rows={4} value={values.description || ""} onChange={(event) => setValue("description", event.target.value)} /></label></>}{kind === "ncr" && <><div className="form-grid"><label>Source<input required value={values.source || ""} onChange={(event) => setValue("source", event.target.value)} /></label><label>Severity<select value={values.severity} onChange={(event) => setValue("severity", event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label></div><label>Nonconformance<textarea required rows={4} value={values.nonconformance || ""} onChange={(event) => setValue("nonconformance", event.target.value)} /></label></>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? <><LoaderCircle className="spin" size={16} /> Saving…</> : <><CheckCircle2 size={16} /> Save record</>}</button></div></form></div></div>;
}

function RegisterView({ kind, user }: { kind: ModuleView; user: User }) {
  const config = moduleConfig[kind];
  const Icon = config.icon;
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setRows(await fetchRows(kind)); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "The register could not be loaded."); }
    setLoading(false);
  }, [kind]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const haystack = `${row.reference} ${row.title} ${row.location} ${row.status} ${row.priority}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesFilter = filter === "all" || row.status === filter || (filter === "overdue" && row.status !== "closed" && row.location.toLowerCase().includes("due"));
    return matchesQuery && matchesFilter;
  }), [filter, query, rows]);

  return <><PageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} action={<button className="primary-button" onClick={() => setDialogOpen(true)}><Plus size={17} /> {config.button}</button>} /><div className="register-summary"><div className="summary-title"><div className="section-icon"><Icon size={19} /></div><div><strong>Operational register</strong><span>{rows.length} records · live Supabase query</span></div></div><div className="summary-controls"><button className="filter-button" onClick={() => setFilter(filter === "all" ? "open" : "all")}><SlidersHorizontal size={15} /> {filter === "all" ? "All records" : formatStatus(filter)}</button><button className="filter-button" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button></div></div><div className="register-toolbar"><div className="search-field"><Search size={16} /><input aria-label="Search register" placeholder={`Search ${config.title.toLowerCase()}…`} value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="filter-tabs"><button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>All <span>{rows.length}</span></button><button className={filter === "open" ? "selected" : ""} onClick={() => setFilter("open")}>Open</button><button className={filter === "overdue" ? "selected" : ""} onClick={() => setFilter("overdue")}>Overdue</button><button className={filter === "closed" ? "selected" : ""} onClick={() => setFilter("closed")}>Closed</button></div></div>{loading ? <LoadingState label={`Loading ${config.title.toLowerCase()}…`} /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : filteredRows.length === 0 ? <EmptyState label={config.title} /> : <section className="data-table-panel"><div className="table-scroll"><table><thead><tr><th>Reference</th><th>Subject</th><th>Location / source</th><th>Status</th><th>Priority</th><th>Updated</th><th /></tr></thead><tbody>{filteredRows.map((row) => <tr key={row.id}><td><span className="code-link">{row.reference}</span></td><td><strong>{row.title}</strong></td><td>{row.location}</td><td><StatusPill tone={toneFor(row.status)}>{formatStatus(row.status)}</StatusPill></td><td><span className={`priority priority-${toneFor(row.priority)}`}>{formatStatus(row.priority)}</span></td><td>{formatDate(row.updated)}</td><td><button className="row-action" aria-label={`Open ${row.reference}`}><ArrowUpRight size={16} /></button></td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing <strong>{filteredRows.length}</strong> of {rows.length} records</span><button className="secondary-button" onClick={() => void load()}><RefreshCw size={14} /> Refresh data</button></div></section>}{kind === "actions" && <div className="register-note"><CheckCircle2 size={17} /><div><strong>Source traceability is enforced.</strong><span>New actions must be linked to a report, incident, risk assessment, inspection, audit, drill, or permit.</span></div></div>}{dialogOpen && <CreateRecordDialog kind={kind} user={user} onClose={() => setDialogOpen(false)} onCreated={() => { setDialogOpen(false); void load(); }} />}</>;
}

function PublicReport() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [form, setForm] = useState({ category: "unsafe_condition", location: "", description: "", risk: "medium" });
  const ar = language === "ar";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!supabase) { setError("The secure reporting backend is not configured in this environment yet."); return; }
    setSaving(true);
    const categoryMap: Record<string, TablesInsert<"reports">["category"]> = { unsafe_condition: "unsafe_condition", unsafe_act: "unsafe_act", near_miss: "near_miss", positive_observation: "positive_observation", environmental_observation: "environmental_observation" };
    const { error: insertError } = await supabase.from("reports").insert({ reference_no: `PUB-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, category: categoryMap[form.category], priority: form.risk as TablesInsert<"reports">["priority"], reporter_name: "Public reporter", exact_area: form.location.trim(), description: form.description.trim(), is_public_submission: true });
    setSaving(false);
    if (insertError) { setError("We could not submit the report. Please try again or contact the HSE team."); return; }
    setSubmitted(true);
  }

  if (submitted) return <div className="public-page"><div className="public-card success-card"><div className="success-icon"><CheckCircle2 size={30} /></div><div className="eyebrow accent-eyebrow">REPORT RECEIVED</div><h1>Thank you for speaking up.</h1><p>Your report has been securely captured in the HSE register. The team can now triage it from the protected workspace.</p><button className="primary-button" onClick={() => setSubmitted(false)}>Submit another report <ArrowRight size={16} /></button></div></div>;
  return <div className="public-page" dir={ar ? "rtl" : "ltr"}><div className="public-top"><BrandMark /><button className="language-button" onClick={() => setLanguage(ar ? "en" : "ar")}><Globe2 size={16} /> {ar ? "English" : "العربية"}</button></div><main className="public-content"><div className="public-intro"><div className="eyebrow accent-eyebrow">SAFE REPORTING CHANNEL</div><h1>{ar ? "ساهم في جعل موقعنا أكثر أمانًا" : "Make our workplace safer."}</h1><p>{ar ? "أبلغ عن خطر أو ملاحظة سلامة بطريقة آمنة وواضحة. لا تحتاج إلى تسجيل الدخول." : "Report a hazard, observation, or near miss safely and clearly. No sign-in required."}</p><div className="public-assurances"><span><LockKeyhole size={16} /> Private by design</span><span><ShieldCheck size={16} /> Reviewed by HSE</span></div></div><form className="public-form" onSubmit={submit}><div className="form-heading"><div><h2>{ar ? "نموذج البلاغ" : "Report details"}</h2><p>{ar ? "الحقول المعلّمة مطلوبة" : "Fields marked with * are required."}</p></div><span className="form-step">01 / 01</span></div>{error && <div className="form-error" role="alert">{error}</div>}<label>{ar ? "نوع البلاغ" : "Report type"} *<select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="unsafe_condition">Unsafe condition</option><option value="unsafe_act">Unsafe act</option><option value="near_miss">Near miss</option><option value="positive_observation">Positive observation</option><option value="environmental_observation">Environmental observation</option></select></label><div className="form-grid"><label>{ar ? "الموقع" : "Location"} *<input required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder={ar ? "مثال: المستودع الشمالي" : "e.g. North warehouse"} /></label><label>{ar ? "مستوى الخطورة" : "Risk level"}<select value={form.risk} onChange={(event) => setForm({ ...form, risk: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label></div><label>{ar ? "ماذا حدث؟" : "What did you observe?"} *<textarea required minLength={10} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={ar ? "اكتب وصفًا واضحًا للظرف أو السلوك..." : "Describe the condition or behaviour clearly..."} rows={5} /></label><div className="upload-box"><Plus size={18} /><div><strong>{ar ? "إضافة صور أو مرفقات" : "Add photos or attachments"}</strong><span>Storage upload is being finalized · max 10 MB each</span></div><span className="adapter-tag">NEXT</span></div><div className="form-foot"><span><ShieldCheck size={15} /> Your report is handled confidentially.</span><button type="submit" className="primary-button" disabled={saving}><Send size={16} /> {saving ? "Submitting…" : ar ? "إرسال البلاغ" : "Submit report"}</button></div></form></main><footer className="public-footer"><span>KSA SAFETY BOARD</span><span>Safety is a shared responsibility.</span></footer></div>;
}

function BoardShell({ view, visionView, user, profile }: { view: Exclude<View, "report">; visionView?: VisionView; user: User; profile: Profile }) {
  const router = useRouter();
  const [active, setActive] = useState<Exclude<View, "report">>(view);
  const navigate = (next: View) => { router.push(pathForRoute(next)); if (next !== "report") setActive(next); };
  const signOut = () => { void supabase?.auth.signOut(); };
  const overviewViews: OverviewView[] = ["dashboard", "executive-hse", "safety-intelligence", "daily-operations-command", "hse-management-review", "hse-objectives", "environmental-aspects", "intelligence-reporting-center", "hse-assistant"];
  const escalationViews: EscalationView[] = ["escalations", "escalations-history", "escalations-matrix"];
  const operationsViews: HSEOperationsView[] = ["hse-team", "employees", "import-center", "employee-violations", "safety-reporting", "mobile-field", "action-center", "workflow-center", "management-of-change", "hse-shift-handover", "monthly-hse-report", "monthly-hse-plan", "safety-learning", "chemicals", "risk-register", "critical-controls", "process-safety-barriers", "industrial-hygiene", "risk-assessment", "safety-pyramid"];
  return <div className="app-shell"><Sidebar active={active} onNavigate={navigate} profile={profile} onSignOut={signOut} /><div className="main-area"><Topbar onSignOut={signOut} onOpenReport={() => navigate("reports")} /><main className="main-content">{overviewViews.includes(active as OverviewView) ? <OverviewCommandCenter userId={user.id} view={active as OverviewView} /> : operationsViews.includes(active as HSEOperationsView) ? <HSEOperationsCommandCenter view={active as HSEOperationsView} /> : escalationViews.includes(active as EscalationView) ? <EscalationCommandCenter view={active as EscalationView} /> : active === "live-meeting" ? <LiveMeetingView user={user} /> : active === "vision" ? <VisionCommandCenter user={user} view={visionView ?? "dashboard"} /> : <RegisterView kind={active as ModuleView} user={user} />}</main><footer className="app-footer"><span>KSA SAFETY BOARD <b>·</b> Live operational workspace</span><span>Supabase <strong>connected</strong> <CircleDot size={10} /></span></footer></div></div>;
}

function AuthGate({ view, visionView }: { view: View; visionView?: VisionView }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => { if (mounted) { setUser(data.session?.user ?? null); setAuthReady(true); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (mounted) { setUser(session?.user ?? null); setProfileLoaded(false); if (!session) setProfile(null); setAuthReady(true); } });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    let mounted = true;
    void supabase.from("profiles").select("display_name,email,role_code,is_active").eq("id", user.id).maybeSingle().then(({ data, error: profileError }) => {
      if (!mounted) return;
      if (profileError) setError(profileError.message);
      setProfile(data);
      setProfileLoaded(true);
    });
    return () => { mounted = false; };
  }, [user]);

  if (!isSupabaseConfigured || !supabase) return <div className="auth-page"><div className="auth-card"><BrandMark /><div className="eyebrow accent-eyebrow">CONFIGURATION REQUIRED</div><h1>Connect the safety workspace.</h1><p className="auth-copy">Supabase runtime credentials are not available to this preview. Add the protected project values, then refresh.</p></div></div>;
  if (!authReady || (user && !profileLoaded)) return <LoadingState label="Checking your safety role…" />;
  if (!user) return <AuthPanel />;
  if (error) return <ErrorState message={error} />;
  if (!profile || !profile.is_active || !STAFF_ROLES.has(profile.role_code)) return <div className="auth-page"><div className="auth-card"><BrandMark /><div className="eyebrow accent-eyebrow">ACCESS REVIEW</div><h1>Account awaiting HSE access.</h1><p className="auth-copy">Your identity is authenticated, but the database role policy has not granted staff access yet. Ask a Super Admin to activate your profile.</p><div className="auth-note"><UserRound size={15} /> Current role: {profile ? formatStatus(profile.role_code) : "pending profile"}</div><button className="secondary-button wide" onClick={() => { void supabase?.auth.signOut(); }}><LogOut size={15} /> Sign out</button></div></div>;
  return <BoardShell view={view as Exclude<View, "report">} visionView={visionView} user={user} profile={profile} />;
}

export default function SafetyBoard({ view = "dashboard", visionView }: SafetyBoardProps) {
  if (view === "report") return <PublicReport />;
  return <AuthGate view={view} visionView={visionView} />;
}
