"use client";
import { FormEvent,useState } from "react";
import Link from "next/link";
import { CheckCircle2, Globe2, LockKeyhole, Send, ShieldCheck } from "lucide-react";

type Lang="ar"|"en"|"ur";
const copy={
  ar:{dir:"rtl",title:"ساهم في جعل موقعنا أكثر أمانًا",sub:"أبلغ عن خطر أو ملاحظة سلامة أو شبه حادث بدون تسجيل دخول.",details:"تفاصيل البلاغ",type:"نوع البلاغ",location:"الموقع",risk:"مستوى الخطورة",desc:"ماذا حدث؟",identity:"طريقة الإفصاح عن الهوية",anonymous:"مجهول",confidential:"سري",identified:"معلن",name:"الاسم",email:"البريد الإلكتروني",phone:"الجوال",submit:"إرسال البلاغ",tracking:"تتبع بلاغ سابق"},
  en:{dir:"ltr",title:"Make our workplace safer.",sub:"Report a hazard, observation or near miss without signing in.",details:"Report details",type:"Report type",location:"Location",risk:"Risk level",desc:"What did you observe?",identity:"Identity mode",anonymous:"Anonymous",confidential:"Confidential",identified:"Identified",name:"Name",email:"Email",phone:"Phone",submit:"Submit report",tracking:"Track an existing report"},
  ur:{dir:"rtl",title:"اپنی کام کی جگہ کو محفوظ بنائیں۔",sub:"بغیر سائن اِن کے خطرہ، مشاہدہ یا قریب الوقوع حادثہ رپورٹ کریں۔",details:"رپورٹ کی تفصیل",type:"رپورٹ کی قسم",location:"مقام",risk:"خطرے کی سطح",desc:"آپ نے کیا دیکھا؟",identity:"شناخت کا طریقہ",anonymous:"گمنام",confidential:"خفیہ",identified:"شناخت ظاہر",name:"نام",email:"ای میل",phone:"فون",submit:"رپورٹ جمع کریں",tracking:"پچھلی رپورٹ ٹریک کریں"}
} as const;

export default function PublicReporting(){
  const [lang,setLang]=useState<Lang>("ar"),t=copy[lang];
  const [form,setForm]=useState({category:"unsafe_condition",priority:"medium",exact_area:"",description:"",identity_mode:"anonymous",reporter_name:"",reporter_email:"",reporter_phone:""});
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[result,setResult]=useState<{reference_no:string;tracking_code:string}|null>(null);
  const set=(k:string,v:string)=>setForm(x=>({...x,[k]:v}));
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError(null);
    try{
      const r=await fetch("/api/safety-reporting-public?action=intake",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const j=await r.json().catch(()=>({ok:false,error:`HTTP ${r.status}`}));
      if(!r.ok||!j.ok)throw new Error(j.error||"Report could not be submitted.");
      setResult(j.data);
    }catch(err){setError(err instanceof Error?err.message:"Report could not be submitted.");}
    finally{setBusy(false);}
  }
  if(result)return <main className="public-page" dir={t.dir}><section className="public-card success-card"><CheckCircle2 className="success-icon" size={34}/><div className="eyebrow accent-eyebrow">REPORT RECEIVED</div><h1>{result.reference_no}</h1><p>Keep the private tracking code below. It is required to view status or send a follow-up message.</p><div className="tracking-code-box"><span>Private tracking code</span><strong>{result.tracking_code}</strong></div><div className="landing-cta"><Link className="landing-primary" href={`/report/status?reference=${encodeURIComponent(result.reference_no)}`}>Track report</Link><button className="landing-secondary" onClick={()=>setResult(null)}>Submit another</button></div></section></main>;
  return <main className="public-page" dir={t.dir}><div className="public-top"><div className="landing-brand"><ShieldCheck size={30}/><strong>KSA SAFETY BOARD</strong></div><div className="language-switcher"><button onClick={()=>setLang("ar")}>العربية</button><button onClick={()=>setLang("en")}>English</button><button onClick={()=>setLang("ur")}>اردو</button></div></div>
    <section className="public-content"><div className="public-intro"><div className="eyebrow accent-eyebrow">SAFE REPORTING CHANNEL</div><h1>{t.title}</h1><p>{t.sub}</p><div className="public-assurances"><span><LockKeyhole size={16}/>Private by design</span><span><ShieldCheck size={16}/>Reviewed by HSE</span></div><Link className="login-public-link" href="/report/status"><Globe2 size={14}/>{t.tracking}</Link></div>
    <form className="public-form" onSubmit={submit}><div className="form-heading"><h2>{t.details}</h2><span className="form-step">01 / 01</span></div>{error&&<div className="form-error" role="alert">{error}</div>}
      <label>{t.type}<select value={form.category} onChange={e=>set("category",e.target.value)}><option value="unsafe_condition">Unsafe condition</option><option value="unsafe_act">Unsafe act</option><option value="hazard">Hazard</option><option value="near_miss">Near miss</option><option value="safety_observation">Safety observation</option><option value="positive_observation">Positive observation</option><option value="fire_observation">Fire observation</option><option value="environmental_observation">Environmental observation</option></select></label>
      <div className="form-grid"><label>{t.location}<input required minLength={2} value={form.exact_area} onChange={e=>set("exact_area",e.target.value)}/></label><label>{t.risk}<select value={form.priority} onChange={e=>set("priority",e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label></div>
      <label>{t.desc}<textarea required minLength={10} rows={6} value={form.description} onChange={e=>set("description",e.target.value)}/></label>
      <fieldset className="identity-fieldset"><legend>{t.identity}</legend><div className="identity-options">{(["anonymous","confidential","identified"] as const).map(mode=><label key={mode}><input type="radio" name="identity" checked={form.identity_mode===mode} onChange={()=>set("identity_mode",mode)}/><span>{t[mode]}</span></label>)}</div></fieldset>
      {form.identity_mode!=="anonymous"&&<div className="form-grid identity-details"><label>{t.name}<input value={form.reporter_name} onChange={e=>set("reporter_name",e.target.value)}/></label><label>{t.email}<input type="email" value={form.reporter_email} onChange={e=>set("reporter_email",e.target.value)}/></label><label>{t.phone}<input value={form.reporter_phone} onChange={e=>set("reporter_phone",e.target.value)}/></label></div>}
      <div className="form-foot"><span><ShieldCheck size={15}/>Anonymous reports contain no identity. Confidential identity is encrypted server-side.</span><button className="primary-button" disabled={busy}><Send size={15}/>{busy?"Submitting…":t.submit}</button></div>
    </form></section><footer className="public-footer"><span>KSA SAFETY BOARD</span><span>Safety is a shared responsibility.</span></footer></main>;
}
