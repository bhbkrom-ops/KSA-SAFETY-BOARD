"use client";
import { FormEvent,useCallback,useEffect,useState } from "react";
import { AlertTriangle,CheckCircle2,Clock3,HardHat,LoaderCircle,Plus,RefreshCw,Search,ShieldAlert,Siren,X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Json=Record<string,unknown>;
type Plan=Json&{id:string;plan_no:string;title:string;area?:string|null;window_start:string;window_end:string;status:string;owner_id?:string|null};
type Activity=Json&{id:string;activity_code:string;title:string;activity_type:string;location:string;start_at:string;end_at:string;status:string};
type Conflict=Json&{id:string;severity:string;status:string;rationale:string;resolution?:string|null;activity_a?:Json;activity_b?:Json;rule?:Json};
type Rule=Json&{id:string;rule_code:string;name:string;severity:string;activity_type_a:string;activity_type_b:string;rationale:string;required_controls?:unknown};
type Payload={plans:Plan[];selected_plan_id:string|null;activities:Activity[];conflicts:Conflict[];rules:Rule[];analytics:{open_conflicts:number;critical_conflicts:number;unresolved_before_start:number;conflict_categories:number}};

const activityTypes=[
 ["hot_work","Hot work"],["flammable_transfer","Flammable transfer"],["lifting","Lifting"],["pedestrian_access","Pedestrian / public access"],
 ["energized_electrical","Energized electrical"],["intrusive_work","Intrusive work"],["confined_space","Confined space"],["chemical_process","Chemical / process operation"],["other","Other"]
] as const;
const fmt=(v:unknown)=>String(v??"—").replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase());
const date=(v:unknown)=>v?new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short"}).format(new Date(String(v))):"—";
const tone=(v:unknown)=>{const x=String(v).toLowerCase();return x.includes("critical")||x.includes("high")||x==="open"?"danger":x.includes("acknow")||x.includes("review")?"warning":x.includes("resolve")||x.includes("control")||x.includes("active")?"success":"info";};

async function call(path:string,init?:RequestInit){
 const session=(await supabase?.auth.getSession())?.data.session;
 const response=await fetch(path,{...init,headers:{"Content-Type":"application/json",...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{}),...(init?.headers||{})}});
 const body=await response.json().catch(()=>({ok:false,error:`HTTP ${response.status}`}));
 if(!response.ok||!body.ok)throw new Error(body.error||"SIMOPS request failed.");
 return body.data;
}

function Status({value}:{value:unknown}){return <span className={`status-pill status-${tone(value)}`}><span className="status-dot"/>{fmt(value)}</span>;}

export default function SimopsCommandCenter(){
 const [data,setData]=useState<Payload|null>(null);
 const [planId,setPlanId]=useState("");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [query,setQuery]=useState("");
 const [modal,setModal]=useState<"plan"|"activity"|null>(null);

 const load=useCallback(async(selected?:string)=>{
   setLoading(true);setError(null);
   try{const result=await call(`/api/simops${selected?`?plan_id=${encodeURIComponent(selected)}`:""}`) as Payload;setData(result);setPlanId(result.selected_plan_id||"");}
   catch(e){setError(e instanceof Error?e.message:"SIMOPS could not be loaded.");}
   finally{setLoading(false);}
 },[]);
 useEffect(()=>{const t=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(t);},[load]);

 const selected=data?.plans.find(p=>p.id===planId)||null;
 const conflicts=(data?.conflicts||[]).filter(c=>JSON.stringify(c).toLowerCase().includes(query.toLowerCase()));
 async function switchPlan(id:string){setPlanId(id);await load(id);}
 async function detect(){if(!planId)return;setBusy(true);setError(null);try{await call("/api/simops",{method:"POST",body:JSON.stringify({action:"detect_conflicts",plan_id:planId})});await load(planId);}catch(e){setError(e instanceof Error?e.message:"Conflict detection failed.");}finally{setBusy(false);}}
 async function updatePlan(status:string){if(!selected)return;setBusy(true);setError(null);try{await call("/api/simops",{method:"PATCH",body:JSON.stringify({action:"update_plan",id:selected.id,status})});await load(selected.id);}catch(e){setError(e instanceof Error?e.message:"Plan update failed.");}finally{setBusy(false);}}
 async function conflictAction(id:string,action:"acknowledge_conflict"|"resolve_conflict"){setBusy(true);setError(null);try{const payload=action==="resolve_conflict"?{action,id,status:"resolved",resolution:"Conflict controls verified and coordination completed."}:{action,id};await call("/api/simops",{method:"PATCH",body:JSON.stringify(payload)});await load(planId);}catch(e){setError(e instanceof Error?e.message:"Conflict update failed.");}finally{setBusy(false);}}

 return <div className="ops-shell">
   <div className="ops-header"><div><div className="eyebrow accent-eyebrow">SIMULTANEOUS OPERATIONS</div><h1>SIMOPS Control Center</h1><p>Coordinate overlapping high-risk work, detect incompatible activities, and prevent uncontrolled simultaneous operations.</p></div><div className="overview-header-actions"><button className="secondary-button" onClick={()=>void load(planId)}><RefreshCw size={15}/> Refresh</button><button className="secondary-button" disabled={!planId||busy} onClick={()=>void detect()}>{busy?<LoaderCircle className="spin" size={15}/>:<ShieldAlert size={15}/>} Detect conflicts</button><button className="primary-button" onClick={()=>setModal("plan")}><Plus size={15}/> New plan</button></div></div>
   {error&&<div className="inline-error"><AlertTriangle size={15}/>{error}</div>}
   <div className="ops-kpi-grid">
    <Kpi label="Open conflicts" value={data?.analytics.open_conflicts??0} icon={<Siren size={16}/>}/>
    <Kpi label="Critical conflicts" value={data?.analytics.critical_conflicts??0} icon={<ShieldAlert size={16}/>}/>
    <Kpi label="Unresolved before start" value={data?.analytics.unresolved_before_start??0} icon={<Clock3 size={16}/>}/>
    <Kpi label="Conflict categories" value={data?.analytics.conflict_categories??0} icon={<HardHat size={16}/>}/>
   </div>
   {loading?<div className="state-card"><LoaderCircle className="spin" size={24}/><strong>Loading SIMOPS controls…</strong></div>:
   <div className="overview-grid-2">
    <section className="panel"><div className="panel-heading"><div><div className="eyebrow">SIMOPS PLANS</div><h2>Coordination windows</h2></div></div>
      <div className="overview-record-list">{(data?.plans||[]).length===0?<div className="state-card"><HardHat size={22}/><strong>No SIMOPS plans yet</strong><span>Create a governed coordination window before adding activities.</span></div>:(data?.plans||[]).map(p=><button className={`overview-record ${p.id===planId?"selected":""}`} key={p.id} onClick={()=>void switchPlan(p.id)}><div><strong>{p.plan_no}</strong><span>{p.title} · {p.area||"Area not set"}</span></div><Status value={p.status}/><small>{date(p.window_start)} → {date(p.window_end)}</small></button>)}</div>
    </section>
    <section className="panel"><div className="panel-heading"><div><div className="eyebrow">PLAN CONTROL</div><h2>{selected?.title||"Select a plan"}</h2></div>{selected&&<Status value={selected.status}/>}</div>
      {selected?<><div className="detail-grid"><div><span>Reference</span><strong>{selected.plan_no}</strong></div><div><span>Area</span><strong>{selected.area||"—"}</strong></div><div><span>Start</span><strong>{date(selected.window_start)}</strong></div><div><span>End</span><strong>{date(selected.window_end)}</strong></div></div><div className="modal-actions"><button className="secondary-button" onClick={()=>setModal("activity")}><Plus size={14}/> Add activity</button>{selected.status!=="active"&&<button className="primary-button" disabled={busy} onClick={()=>void updatePlan("active")}><CheckCircle2 size={14}/> Activate plan</button>}{selected.status==="active"&&<button className="secondary-button" disabled={busy} onClick={()=>void updatePlan("closed")}>Close plan</button>}</div><p className="field-help">Activation is blocked at the database layer while high/critical conflicts remain unresolved.</p></>:<div className="state-card"><HardHat size={22}/><strong>Select a SIMOPS plan</strong><span>Plan controls, activities and conflicts are permission-scoped.</span></div>}
    </section>
   </div>}
   {selected&&<section className="panel"><div className="panel-heading"><div><div className="eyebrow">ACTIVITIES</div><h2>Simultaneous work register</h2></div><button className="secondary-button" onClick={()=>setModal("activity")}><Plus size={14}/> Add activity</button></div><div className="table-scroll"><table><thead><tr><th>Code</th><th>Activity</th><th>Type</th><th>Location</th><th>Window</th><th>Status</th></tr></thead><tbody>{(data?.activities||[]).map(a=><tr key={a.id}><td><span className="code-link">{a.activity_code}</span></td><td><strong>{a.title}</strong></td><td>{fmt(a.activity_type)}</td><td>{a.location}</td><td>{date(a.start_at)}<br/><small>{date(a.end_at)}</small></td><td><Status value={a.status}/></td></tr>)}</tbody></table></div>{(data?.activities||[]).length===0&&<div className="state-card"><HardHat size={22}/><strong>No activities in this plan</strong></div>}</section>}
   {selected&&<section className="panel"><div className="panel-heading"><div><div className="eyebrow">CONFLICT ENGINE</div><h2>Detected incompatibilities</h2></div><div className="search-field"><Search size={15}/><input aria-label="Search SIMOPS conflicts" placeholder="Search conflicts…" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
    {conflicts.length===0?<div className="state-card"><CheckCircle2 size={22}/><strong>No detected conflicts</strong><span>Run conflict detection after activity changes.</span></div>:<div className="table-scroll"><table><thead><tr><th>Severity</th><th>Rule / rationale</th><th>Activities</th><th>Status</th><th>Action</th></tr></thead><tbody>{conflicts.map(c=><tr key={c.id}><td><Status value={c.severity}/></td><td><strong>{String((c.rule as Json)?.name||"SIMOPS rule")}</strong><small>{c.rationale}</small></td><td>{String((c.activity_a as Json)?.title||"A")} ↔ {String((c.activity_b as Json)?.title||"B")}</td><td><Status value={c.status}/></td><td>{c.status==="open"?<button className="secondary-button" disabled={busy} onClick={()=>void conflictAction(c.id,"acknowledge_conflict")}>Acknowledge</button>:!["resolved","accepted"].includes(c.status)?<button className="primary-button" disabled={busy} onClick={()=>void conflictAction(c.id,"resolve_conflict")}>Resolve</button>:"—"}</td></tr>)}</tbody></table></div>}
   </section>}
   <section className="panel"><div className="panel-heading"><div><div className="eyebrow">CONFLICT RULES</div><h2>Governed incompatibility rules</h2></div></div><div className="overview-grid-2">{(data?.rules||[]).map(r=><div className="register-note" key={r.id}><ShieldAlert size={17}/><div><strong>{r.rule_code} · {r.name}</strong><span>{fmt(r.activity_type_a)} + {fmt(r.activity_type_b)} · {fmt(r.severity)}</span><small>{r.rationale}</small></div></div>)}</div></section>
   {modal==="plan"&&<PlanForm onClose={()=>setModal(null)} onSaved={(id)=>{setModal(null);void load(id);}}/>}
   {modal==="activity"&&selected&&<ActivityForm plan={selected} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);void load(selected.id);}}/>}
 </div>;
}

function Kpi({label,value,icon}:{label:string;value:number;icon:React.ReactNode}){return <div className="overview-kpi"><div className="overview-kpi-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>Live SIMOPS records</small></div></div>;}

function PlanForm({onClose,onSaved}:{onClose:()=>void;onSaved:(id:string)=>void}){
 const [form,setForm]=useState({title:"",area:"",window_start:"",window_end:"",scope:"",notes:""});const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);
 const set=(k:string,v:string)=>setForm(x=>({...x,[k]:v}));
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError(null);try{const result=await call("/api/simops",{method:"POST",body:JSON.stringify({action:"create_plan",...form})});onSaved(String(result.id));}catch(err){setError(err instanceof Error?err.message:"Plan could not be saved.");}finally{setBusy(false);}}
 return <div className="modal-backdrop"><div className="modal-card"><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18}/></button><div className="eyebrow accent-eyebrow">NEW SIMOPS PLAN</div><h2>Coordination window</h2>{error&&<div className="form-error">{error}</div>}<form className="modal-form" onSubmit={submit}><label>Title<input required value={form.title} onChange={e=>set("title",e.target.value)}/></label><label>Area / location<input value={form.area} onChange={e=>set("area",e.target.value)}/></label><div className="form-grid"><label>Start<input required type="datetime-local" value={form.window_start} onChange={e=>set("window_start",e.target.value)}/></label><label>End<input required type="datetime-local" value={form.window_end} onChange={e=>set("window_end",e.target.value)}/></label></div><label>Scope<textarea rows={3} value={form.scope} onChange={e=>set("scope",e.target.value)}/></label><label>Notes<textarea rows={2} value={form.notes} onChange={e=>set("notes",e.target.value)}/></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy}>{busy?<LoaderCircle className="spin" size={15}/>:<Plus size={15}/>} Save plan</button></div></form></div></div>;
}

function ActivityForm({plan,onClose,onSaved}:{plan:Plan;onClose:()=>void;onSaved:()=>void}){
 const [form,setForm]=useState({title:"",activity_type:"hot_work",location:plan.area||"",start_at:plan.window_start.slice(0,16),end_at:plan.window_end.slice(0,16)});const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);
 const set=(k:string,v:string)=>setForm(x=>({...x,[k]:v}));
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError(null);try{await call("/api/simops",{method:"POST",body:JSON.stringify({action:"create_activity",plan_id:plan.id,...form})});onSaved();}catch(err){setError(err instanceof Error?err.message:"Activity could not be saved.");}finally{setBusy(false);}}
 return <div className="modal-backdrop"><div className="modal-card"><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18}/></button><div className="eyebrow accent-eyebrow">SIMOPS ACTIVITY</div><h2>{plan.plan_no}</h2>{error&&<div className="form-error">{error}</div>}<form className="modal-form" onSubmit={submit}><label>Activity title<input required value={form.title} onChange={e=>set("title",e.target.value)}/></label><label>Activity type<select value={form.activity_type} onChange={e=>set("activity_type",e.target.value)}>{activityTypes.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Location<input required value={form.location} onChange={e=>set("location",e.target.value)}/></label><div className="form-grid"><label>Start<input required type="datetime-local" value={form.start_at} onChange={e=>set("start_at",e.target.value)}/></label><label>End<input required type="datetime-local" value={form.end_at} onChange={e=>set("end_at",e.target.value)}/></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy}>{busy?<LoaderCircle className="spin" size={15}/>:<Plus size={15}/>} Save activity</button></div></form></div></div>;
}
