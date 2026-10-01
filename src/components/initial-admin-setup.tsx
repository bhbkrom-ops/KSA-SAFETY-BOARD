"use client";
import { FormEvent,useState } from "react";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";

export default function InitialAdminSetup({configured,onComplete}:{configured:boolean;onComplete:()=>void}){
  const [setupCode,setSetupCode]=useState(""),[name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[message,setMessage]=useState<string|null>(null);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError(null);setMessage(null);
    try{
      const r=await fetch("/api/auth/bootstrap",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:setupCode,email,password,display_name:name})});
      const j=await r.json().catch(()=>({ok:false,error:`HTTP ${r.status}`}));
      if(!r.ok||!j.ok)throw new Error(j.error||"Initial administrator setup failed.");
      setMessage("Super Admin created. Bootstrap is now closed.");
      setTimeout(onComplete,700);
    }catch(err){setError(err instanceof Error?err.message:"Initial administrator setup failed.");}
    finally{setBusy(false);}
  }
  return <main className="login-screen"><section className="login-side"><div className="login-brand"><ShieldCheck size={34}/><div><strong>KSA SAFETY BOARD</strong><span>First-run security setup</span></div></div><div><span className="landing-kicker">ONE-TIME BOOTSTRAP</span><h1>Create the first controlled administrator.</h1><p>This flow closes automatically after the first Supabase Auth user is created.</p></div></section><section className="login-panel"><div className="login-card"><div className="eyebrow accent-eyebrow">INITIAL SUPER ADMIN</div><h2>Secure first-run setup</h2><p className="auth-copy">The setup code is verified only by the server and is never stored in browser code.</p>
    {!configured&&<div className="form-error">Server bootstrap authorization is not configured yet.</div>}
    {error&&<div className="form-error" role="alert">{error}</div>}{message&&<div className="form-success"><CheckCircle2 size={15}/>{message}</div>}
    <form className="auth-form" onSubmit={submit}><label>One-time setup code<input required type="password" value={setupCode} onChange={e=>setSetupCode(e.target.value)} autoComplete="off"/></label><label>Administrator name<input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label><label>Work email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label><label>Initial password<input required minLength={12} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/></label><button className="primary-button wide" disabled={busy||!configured}>{busy?<><LoaderCircle className="spin" size={16}/>Creating administrator…</>:"Create Super Admin"}</button></form>
  </div></section></main>;
}
