"use client";
import { FormEvent,useEffect,useState } from "react";
import { useRouter,useSearchParams } from "next/navigation";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type SessionPair={access_token:string;refresh_token:string};
export default function AdminLogin(){
  const router=useRouter(), params=useSearchParams();
  const next=(params.get("next")||"/admin/dashboard").startsWith("/")?(params.get("next")||"/admin/dashboard"):"/admin/dashboard";
  const [mode,setMode]=useState<"signin"|"reset"|"mfa">("signin");
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[code,setCode]=useState("");
  const [pair,setPair]=useState<SessionPair|null>(null),[factor,setFactor]=useState(""),[challenge,setChallenge]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[message,setMessage]=useState<string|null>(null);
  const [bootstrapRequired,setBootstrapRequired]=useState(false);

  useEffect(()=>{void fetch("/api/auth/bootstrap",{cache:"no-store"}).then(r=>r.json()).then(b=>setBootstrapRequired(Boolean(b?.data?.bootstrap_required))).catch(()=>{});},[]);

  async function api(url:string,body:Record<string,unknown>,access?:string){
    const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",...(access?{Authorization:`Bearer ${access}`}:{})},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({ok:false,error:`HTTP ${r.status}`}));
    if(!r.ok||!j.ok)throw new Error(j.error||"Request failed."); return j.data??j;
  }

  async function beginMfa(s:SessionPair,known?:string){
    let factorId=known||"";
    if(!factorId){
      const list=await api("/api/auth/mfa?action=factors",{refresh_token:s.refresh_token},s.access_token);
      factorId=(list?.totp||[]).find((x:{status:string})=>x.status==="verified")?.id||"";
    }
    if(!factorId)throw new Error("Privileged MFA enrollment is required. Use the account security setup flow.");
    const c=await api("/api/auth/mfa?action=challenge",{refresh_token:s.refresh_token,factor_id:factorId},s.access_token);
    setPair(s);setFactor(factorId);setChallenge(c.id);setMode("mfa");
  }

  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError(null);setMessage(null);
    try{
      if(mode==="reset"){
        const r=await fetch("/api/auth/login?action=reset",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
        const j=await r.json();setMessage(j.message||"If eligible, recovery instructions will be sent.");return;
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

  return <main className="login-screen">
    <section className="login-side"><div className="login-brand"><ShieldCheck size={34}/><div><strong>KSA SAFETY BOARD</strong><span>Secure HSE Workspace</span></div></div><div><span className="landing-kicker">CONTROLLED ACCESS</span><h1>Verified identity before operational authority.</h1><p>Role scope, session cutoff, MFA and Supabase RLS are enforced independently of the interface.</p></div></section>
    <section className="login-panel"><div className="login-card"><div className="eyebrow accent-eyebrow">{mode==="mfa"?"MULTI-FACTOR AUTHENTICATION":mode==="reset"?"PASSWORD RECOVERY":"ADMIN ACCESS"}</div><h2>{mode==="mfa"?"Verify your second factor":mode==="reset"?"Recover access":"Sign in to the safety board"}</h2>
      {bootstrapRequired&&<div className="form-error">Initial Super Admin setup is still required before sign-in can succeed.</div>}
      {error&&<div className="form-error" role="alert">{error}</div>}{message&&<div className="form-success"><CheckCircle2 size={15}/>{message}</div>}
      <form className="auth-form" onSubmit={submit}>
        {mode!=="mfa"&&<label>Work email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>}
        {mode==="signin"&&<label>Password<input required minLength={12} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label>}
        {mode==="mfa"&&<label>Authenticator code<input required inputMode="numeric" pattern="[0-9]{6,8}" value={code} onChange={e=>setCode(e.target.value)} autoComplete="one-time-code"/></label>}
        <button className="primary-button wide" disabled={busy}>{busy?<><LoaderCircle className="spin" size={16}/>Verifying…</>:mode==="mfa"?"Verify MFA":mode==="reset"?"Send recovery instructions":"Sign in"}</button>
      </form>
      <div className="login-links">{mode==="signin"?<button onClick={()=>setMode("reset")}>Forgot password?</button>:mode==="reset"?<button onClick={()=>setMode("signin")}>Back to sign in</button>:null}</div>
      <a className="login-public-link" href="/report">Open public safety reporting</a>
    </div></section>
  </main>;
}