"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Flame, HardHat, ShieldCheck, Siren } from "lucide-react";

type Branding={board_name:string;company_name:string;logo_url:string;background_url:string};
const fallback:Branding={board_name:"KSA SAFETY BOARD",company_name:"",logo_url:"",background_url:""};

export default function LandingPage(){
  const [branding,setBranding]=useState(fallback);
  const [ar,setAr]=useState(true);
  useEffect(()=>{void fetch("/api/public-branding").then(r=>r.json()).then(b=>{if(b?.data)setBranding(b.data)}).catch(()=>{});},[]);
  return <main className="landing-page" dir={ar?"rtl":"ltr"} style={branding.background_url?{backgroundImage:`linear-gradient(rgba(5,24,31,.72),rgba(5,24,31,.86)),url("${branding.background_url}")`}:undefined}>
    <header className="landing-topbar">
      <div className="landing-brand">{branding.logo_url?<img src={branding.logo_url} alt="" />:<ShieldCheck size={34}/>}<div><strong>{branding.board_name}</strong><span>{branding.company_name||"Enterprise HSE Command Center"}</span></div></div>
      <div className="landing-actions"><button onClick={()=>setAr(v=>!v)}>{ar?"English":"العربية"}</button><Link href="/admin/login">{ar?"دخول الإدارة":"Admin sign in"} <ArrowRight size={15}/></Link></div>
    </header>
    <section className="landing-hero">
      <div className="landing-copy"><span className="landing-kicker">{ar?"منصة إدارة السلامة والصحة المهنية والبيئة":"HEALTH · SAFETY · ENVIRONMENT"}</span><h1>{ar?"قيادة السلامة من موقع واحد.":"Operational safety, governed from one place."}</h1><p>{ar?"إدارة البلاغات والمخاطر والحوادث والتصاريح والتدقيق والاستجابة للطوارئ مع صلاحيات وتتبع كامل.":"Manage reporting, risk, incidents, permits, audits, emergency response and evidence with governed access and traceability."}</p><div className="landing-cta"><Link className="landing-primary" href="/report">{ar?"إرسال بلاغ سلامة":"Submit a safety report"} <ArrowRight size={16}/></Link><Link className="landing-secondary" href="/admin/login">{ar?"فتح لوحة الإدارة":"Open admin workspace"}</Link></div></div>
      <div className="landing-grid">
        <article><ClipboardCheck/><strong>{ar?"عمليات السلامة":"Safety Operations"}</strong><span>{ar?"بلاغات، CAPA، MOC، المناوبات، الخطط الشهرية":"Reporting, CAPA, MOC, handover and monthly planning"}</span></article>
        <article><HardHat/><strong>{ar?"العمل والمعدات":"Work & Equipment"}</strong><span>{ar?"PTW، LOTO، المعدات والتصاريح والكفاءة":"PTW, LOTO, equipment, authorization and competency"}</span></article>
        <article><ShieldCheck/><strong>{ar?"الامتثال والتدقيق":"Compliance & Audits"}</strong><span>{ar?"ISO، الالتزامات، التفتيش، التدقيق والأدلة":"ISO, obligations, inspections, audits and evidence"}</span></article>
        <article><Flame/><strong>{ar?"الطوارئ والحماية":"Emergency & Protection"}</strong><span>{ar?"الحريق، الإخلاء، التجمع والاستجابة":"Fire, evacuation, muster and emergency response"}</span></article>
      </div>
    </section>
    <footer className="landing-footer"><span><Siren size={15}/>{ar?"قناة البلاغ العام متاحة بدون تسجيل دخول":"Public reporting is available without sign-in"}</span><span>© KSA SAFETY BOARD</span></footer>
  </main>;
}
