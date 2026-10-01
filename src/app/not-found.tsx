import Link from "next/link";
import { ShieldAlert } from "lucide-react";
export default function NotFound(){return <main className="auth-page"><section className="auth-card compact-auth"><ShieldAlert size={34}/><div className="eyebrow accent-eyebrow">404 · NOT FOUND</div><h1>Page not found</h1><p className="auth-copy">The requested KSA SAFETY BOARD route does not exist or is no longer available.</p><div className="landing-cta"><Link className="primary-button" href="/">Home</Link><Link className="secondary-button" href="/report">Safety reporting</Link></div></section></main>;}
