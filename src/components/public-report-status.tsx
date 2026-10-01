"use client";
import { FormEvent,useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, LoaderCircle, MessageSquareText, RefreshCw, Send, ShieldCheck } from "lucide-react";

type ReportData={id:string;reference_no:string;category:string;status:string;priority:string;exact_area:string|null;description:string;created_at:string;updated_at:string;closed_at:string|null};
type Message={id:string;sender_type:"reporter"|"hse";body:string;created_at:string};

export default function PublicReportStatus(){
  const params=useSearchParams();
  const [reference,setReference]=useState(params.get("reference")||""),[tracking,setTracking]=useState("");
  const [report,setReport]=useState<ReportData|null>(null),[messages,setMessages]=useState<Message[]>([]),[message,setMessage]=useState("");
  const [busy,setBusy]=useState(false),[sending,setSending]=useState(false),[error,setError]=useState<string|null>(null);

  async function request(action:"status"|"message",extra:Record<string,unknown>={}){
    const r=await fetch(`/api/safety-reporting-public?action=${action}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference_no:reference,tracking_code:tracking,...extra})});
    const j=await r.json().catch(()=>({ok:false,error:`HTTP ${r.status}`}));
    if(!r.ok||!j.ok)throw new Error(j.error||"Tracking request failed.");
    return j.data;
  }
  async function load(e?:FormEvent){e?.preventDefault();setBusy(true);setError(null);
    try{const d=await request("status");setReport(d.report);setMessages(d.messages||[]);}
    catch(err){setReport(null);setMessages([]);setError(err instanceof Error?err.message:"Tracking request failed.");}
    finally{setBusy(false);}
  }
  async function send(e:FormEvent){e.preventDefault();if(!message.trim())return;setSending(true);setError(null);
    try{const d=await request("message",{message});setMessages(x=>[...x,d]);setMessage("");}
    catch(err){setError(err instanceof Error?err.message:"Message could not be sent.");}
    finally{setSending(false);}
  }
  return <main className="public-page"><div className="public-top"><div className="landing-brand"><ShieldCheck size={30}/><strong>KSA SAFETY BOARD</strong></div><Link className="login-public-link" href="/report"><ArrowLeft size={14}/>New safety report</Link></div>
    <section className="tracking-shell"><div className="public-card tracking-card"><div className="eyebrow accent-eyebrow">PRIVATE REPORT TRACKING</div><h1>Check report status</h1><p>Enter the report reference and the private tracking code issued when the report was submitted.</p>
      <form className="auth-form" onSubmit={load}><label>Report reference<input required value={reference} onChange={e=>setReference(e.target.value.toUpperCase())} placeholder="OBS-2026-XXXX"/></label><label>Private tracking code<input required type="password" value={tracking} onChange={e=>setTracking(e.target.value)} autoComplete="off"/></label><button className="primary-button wide" disabled={busy}>{busy?<><LoaderCircle className="spin" size={16}/>Checking…</>:<><RefreshCw size={15}/>Check status</>}</button></form>{error&&<div className="form-error" role="alert">{error}</div>}
    </div>
    {report&&<div className="tracking-results"><section className="public-card"><div className="tracking-status-head"><div><span className="eyebrow">REPORT</span><h2>{report.reference_no}</h2></div><span className="status-pill status-info"><span className="status-dot"/>{report.status.replaceAll("_"," ")}</span></div><div className="detail-grid"><div><span>Category</span><strong>{report.category.replaceAll("_"," ")}</strong></div><div><span>Priority</span><strong>{report.priority}</strong></div><div><span>Location</span><strong>{report.exact_area||"—"}</strong></div><div><span>Last update</span><strong>{new Date(report.updated_at).toLocaleString()}</strong></div></div><div className="tracking-description"><span>Report description</span><p>{report.description}</p></div>{report.closed_at&&<div className="form-success"><CheckCircle2 size={15}/>Closed {new Date(report.closed_at).toLocaleString()}</div>}</section>
      <section className="public-card"><div className="tracking-status-head"><div><span className="eyebrow">FOLLOW-UP THREAD</span><h2>Messages</h2></div><MessageSquareText size={20}/></div><div className="public-message-thread">{messages.length===0?<div className="state-card">No follow-up messages yet.</div>:messages.map(m=><article key={m.id} className={`public-message ${m.sender_type}`}><strong>{m.sender_type==="hse"?"HSE Team":"Reporter"}</strong><p>{m.body}</p><small>{new Date(m.created_at).toLocaleString()}</small></article>)}</div><form className="message-compose" onSubmit={send}><textarea required minLength={2} maxLength={4000} rows={3} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Send a follow-up message to the HSE team…"/><button className="primary-button" disabled={sending}>{sending?<LoaderCircle className="spin" size={15}/>:<Send size={15}/>}Send message</button></form></section>
    </div>}</section><footer className="public-footer"><span>KSA SAFETY BOARD</span><span>Tracking access requires the private code.</span></footer></main>;
}
