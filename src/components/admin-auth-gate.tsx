"use client";
import { useEffect,useState } from "react";
import { usePathname,useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminAuthGate({children}:{children:React.ReactNode}){
  const pathname=usePathname(); const router=useRouter();
  const [state,setState]=useState<"checking"|"allowed">("checking");
  useEffect(()=>{
    if(pathname==="/admin/login"){setState("allowed");return;}
    let alive=true;
    void (async()=>{
      if(!supabase){router.replace("/admin/login?reason=config");return;}
      const {data}=await supabase.auth.getSession();
      const session=data.session;
      if(!session){router.replace(`/admin/login?next=${encodeURIComponent(pathname||"/admin/dashboard")}`);return;}
      const res=await fetch("/api/auth/me",{headers:{Authorization:`Bearer ${session.access_token}`},cache:"no-store"});
      const body=await res.json().catch(()=>null);
      if(!alive)return;
      if(!res.ok){
        if(body?.code==="MFA_REQUIRED") router.replace(`/admin/login?mfa=1&next=${encodeURIComponent(pathname||"/admin/dashboard")}`);
        else {await supabase.auth.signOut({scope:"local"});router.replace("/admin/login?reason=session");}
        return;
      }
      setState("allowed");
    })();
    return()=>{alive=false};
  },[pathname,router]);
  if(state!=="allowed")return <div className="auth-page"><div className="auth-card compact-auth"><ShieldCheck size={30}/><h1>Validating secure session</h1><p className="auth-copy">Checking role, session cutoff and MFA assurance.</p><LoaderCircle className="spin" size={22}/></div></div>;
  return <>{children}</>;
}
