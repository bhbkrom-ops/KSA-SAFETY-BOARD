"use client";
/* eslint-disable @next/next/no-img-element */
import { FormEvent,useEffect,useState } from "react";
import Link from "next/link";
import { useRouter,useSearchParams } from "next/navigation";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type SessionPair={access_token:string;refresh_token:string};
type Mode="signin"|"signup"|"reset"|"recovery"|"mfa";

export default function AdminLogin(){
  const router=useRouter(), params=useSearchParams();
  const rawNext=params.get("next")||"/admin/dashboard";
  const next=rawNext.startsWith("/")&&!rawNext.startsWith("//")?rawNext:"/admin/dashboard";
  const [mode,setMode]=useState<Mode>(params.get("recovery")==="1"?"recovery":"signin");
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[displayName,setDisplayName]=useState(""),[code,setCode]=useState("");
  const [pair,setPair]=useState<SessionPair|null>(null),[factor,setFactor]=useState(""),[challenge,setChallenge]=useState("");
  const [qr,setQr]=useState<string|null>(null),[signupEnabled,setSignupEnabled]=useState(false),[bootstrapRequired,setBootstrapRequired]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[message,setMessage]=useState<string|null>(null);

  useEffect(()=>{
    void fetch("/api/auth/bootstrap",{cache:"no-store"}).then(r=>r.json()).then(b=>{
      setBootstrapRequired(Boolean(b?.data?.bootstrap_required));
      setSignupEnabled(Boolean(b?.data?.signup_enabled));
    }).catch(()=>{});
  },[]);

  async function api(url:string,body:Record<string,unknown>,access?:string){
    const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",...(access?{Authorization:`Bearer ${access}`}:{})},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({ok:false,error:`HTTP ${r.status}`}));
    if(!r.ok||!j.ok)throw new Error(j.error||"Request failed.");
    return j.data??j;
  }

  async function beginMfa(s:SessionPair,known?:string){
    let factorId=known||"";
    if(!factorId){
      const list=await api("/api/auth/mfa?action=factors",{refresh_token:s.refresh_token},s.access_token);
      factorId=(list?.totp||[]).find((x:{status:string})=>x.status==="verified")?.id||"";
    }
    if(!factorId){
      const enrolled=await api("/api/auth/mfa?action=enroll",{refresh_token:s.refresh_token},s.access_token);
      factorId=enrolled.id;
      setQr(enrolled.totp?.qr_code||null);
    }
    const c=await api("/api/auth/mfa?action=challenge",{refresh_token:s.refresh_token,factor_id:factorId},s.access_token);
    setPair(s);setFactor(factorId);setChallenge(c.id);setMode("mfa");
  }

  async function submit(e:FormEvent){
    e.preventDefault();setBusy(true);setError(null);setMessage(null);
    try{
      if(mode==="reset"){
        const r=await fetch("/api/auth/login?action=reset",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
        const j=await r.json();setMessage(j.message||"If eligible, recovery instructions will be sent.");return;
      }
      if(mode==="signup"){
        const d=await api("/api/auth/login?action=signup",{email,password,display_name:displayName});
        setMessage(d.message||"Account request accepted.");setMode("signin");return;
      }
      if(mode==="recovery"){
        if(!supabase)throw new Error("Authentication client is unavailable.");
        const {data}=await supabase.auth.getSession();
        if(!data.session)throw new Error("Open this page from the recovery email.");
        await api("/api/auth/login?action=change-password",{password,email:data.session.user.email||""},data.session.access_token);
        await supabase.auth.signOut({scope:"local"});
        setMessage("Password changed. Sign in again with the new password.");setMode("signin");return;
      }
      if(mode==="mfa"){
        if(!pair)throw new Error("MFA session is unavailable.");
        const v=await api("/api/auth/mfa?action=verify",{refresh_token:pair.refresh_token,factor_id:factor,challenge_id:challenge,code},pair.access_token);
        await supabase?.auth.setSession({access_token:v.access_token,refresh_token:v.refresh_token});router.replace(next);return;
      }
      const d=await api("/api/auth/login?action=login",{email,password,next});
      const s:SessionPair={access_token:d.session.access_token,refresh_token:d.session.refresh_token};
      await supabase?.auth.setSession(s);
      if(d.mfa_required&&!d.mfa_verified){await beginMfa(s,d.verified_factor_ids?.[0]);return;}
      router.replace(d.next||next);
    }catch(err){setError(err instanceof Error?err.message:"Authentication failed.");}
    finally{setBusy(false);}
  }

  const heading=mode==="mfa"?"Verify your second factor":mode==="reset"?"Recover access":mode==="recovery"?"Set a new password":mode==="signup"?"Request HSE access":"Sign in to the safety board";
  return <main className="login-screen">
    <section className="login-side"><div className="login-brand"><ShieldCheck size={34}/><div><strong>KSA SAFETY BOARD</strong><span>Secure HSE Workspace</span></div></div><div><span className="landing-kicker">CONTROLLED ACCESS</span><h1>Verified identity before operational authority.</h1><p>Role scope, session cutoff, MFA and Supabase RLS are enforced independently of the interface.</p></div></section>
    <section className="login-panel"><div className="login-card"><div className="eyebrow accent-eyebrow">{mode==="mfa"?"MULTI-FACTOR AUTHENTICATION":mode==="reset"?"PASSWORD RECOVERY":mode==="recovery"?"CHANGE PASSWORD":mode==="signup"?"ACCESS REQUEST":"ADMIN ACCESS"}</div><h2>{heading}</h2>
      {bootstrapRequired&&<div className="form-error">Initial Super Admin setup is required before normal sign-in can succeed.</div>}
      {error&&<div className="form-error" role="alert">{error}</div>}{message&&<div className="form-success"><CheckCircle2 size={15}/>{message}</div>}
      {mode==="mfa"&&qr&&<div className="mfa-qr"><img src={qr} alt="Authenticator enrollment QR code"/><small>Scan this code in your authenticator app, then enter the generated verification code.</small></div>}
      <form className="auth-form" onSubmit={submit}>
        {mode==="signup"&&<label>Full name<input required value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="name"/></label>}
        {["signin","signup","reset"].includes(mode)&&<label>Work email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>}
        {["signin","signup","recovery"].includes(mode)&&<label>{mode==="recovery"?"New password":"Password"}<input required minLength={12} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="signin"?"current-password":"new-password"}/></label>}
        {mode==="mfa"&&<label>Authenticator code<input required inputMode="numeric" pattern="[0-9]{6,8}" value={code} onChange={e=>setCode(e.target.value)} autoComplete="one-time-code"/></label>}
        <button className="primary-button wide" disabled={busy}>{busy?<><LoaderCircle className="spin" size={16}/>Verifying…</>:mode==="mfa"?"Verify MFA":mode==="reset"?"Send recovery instructions":mode==="recovery"?"Change password":mode==="signup"?"Request access":"Sign in"}</button>
      </form>
      <div className="login-links">
        {mode==="signin"&&<><button onClick={()=>setMode("reset")}>Forgot password?</button>{signupEnabled&&<button onClick={()=>setMode("signup")}>Request access</button>}</>}
        {["reset","signup"].includes(mode)&&<button onClick={()=>setMode("signin")}>Back to sign in</button>}
      </div>
      <Link className="login-public-link" href="/report">Open public safety reporting</Link>
    </div></section>
  </main>;
}