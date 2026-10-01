import { Suspense } from "react";
import AdminLogin from "@/components/admin-login";
export default function LoginPage(){return <Suspense fallback={<div className="auth-page">Loading secure access…</div>}><AdminLogin/></Suspense>;}
