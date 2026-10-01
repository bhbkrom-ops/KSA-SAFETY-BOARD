import { Suspense } from "react";
import PublicReportStatus from "@/components/public-report-status";
export default function ReportStatusPage(){return <Suspense fallback={<div className="public-page">Loading secure tracking…</div>}><PublicReportStatus/></Suspense>;}
