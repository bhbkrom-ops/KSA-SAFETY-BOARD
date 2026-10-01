import SafetyBoard from "@/components/safety-board";
import { moduleRouteIds } from "@/lib/route-registry";
import type { OverviewView } from "@/components/overview-command-center";
import type { HSEOperationsView } from "@/components/hse-operations-command-center";
import type { EscalationView } from "@/components/escalation-command-center";
import type { WorkControlView } from "@/components/work-control-command-center";
import type { EnvironmentalComplianceView } from "@/components/environmental-compliance-command-center";
import type { Section07View } from "@/components/licenses-competency-command-center";
import type { SafetySystemsView } from "@/components/safety-systems-command-center";
import type { ReportsDocumentsView } from "@/components/hse-reports-documents-command-center";
import type { SafetyCommunicationView } from "@/components/safety-communication-command-center";
import type { AdminSystemView } from "@/components/admin-system-command-center";

type ModulePageProps = { params: Promise<{ module: string }> };
const allowed = new Set<string>(moduleRouteIds);
const overviewViews = new Set<OverviewView>(["executive-hse", "safety-intelligence", "daily-operations-command", "hse-management-review", "hse-objectives", "environmental-aspects", "intelligence-reporting-center", "hse-assistant"]);
const escalationViews = new Set<EscalationView>(["escalations", "escalations-history", "escalations-matrix"]);
const workControlViews = new Set<WorkControlView>(["permit-compliance-center", "inspections", "audits", "compliance", "loto", "permits"]);
const environmentalViews = new Set<EnvironmentalComplianceView>(["environmental-measurements", "facility-regulatory-licenses"]);
const section07Views = new Set<Section07View>(["licenses", "trainings", "training-attendance", "equipment-auth", "training-matrix", "competency", "official-templates", "enterprise-reports"]);
const section08Views = new Set<SafetySystemsView>(["life-safety-operations", "equipment-safety", "assets", "contractor-safety", "visitors", "safety-map", "fire-emergency-command", "emergency-response", "emergency", "fire-protection"]);
const safetyCommunicationViews = new Set<SafetyCommunicationView>(["gamification", "sections", "posts", "safety-radio", "inbound-inbox", "email-settings", "notification-rules"]);
const reportsDocumentsViews = new Set<ReportsDocumentsView>(["files", "reports-documents", "safety-signs", "contracts", "forms", "invoices"]);
const adminSystemViews = new Set<AdminSystemView>(["users", "activity", "plants", "integrations", "system-readiness", "settings"]);
const operationsViews = new Set<HSEOperationsView>(["hse-team", "employees", "import-center", "employee-violations", "safety-reporting", "mobile-field", "action-center", "workflow-center", "management-of-change", "hse-shift-handover", "monthly-hse-report", "monthly-hse-plan", "safety-learning", "chemicals", "risk-register", "critical-controls", "process-safety-barriers", "industrial-hygiene", "risk-assessment", "safety-pyramid"]);

export default async function ModulePage({ params }: ModulePageProps) {
  const { module } = await params;
  if (overviewViews.has(module as OverviewView)) return <SafetyBoard view={module as OverviewView} />;
  if (safetyCommunicationViews.has(module as SafetyCommunicationView)) return <SafetyBoard view={module as SafetyCommunicationView} />;
  if (reportsDocumentsViews.has(module as ReportsDocumentsView)) return <SafetyBoard view={module as ReportsDocumentsView} />;
  if (adminSystemViews.has(module as AdminSystemView)) return <SafetyBoard view={module as AdminSystemView} />;
  if (operationsViews.has(module as HSEOperationsView)) return <SafetyBoard view={module as HSEOperationsView} />;
  if (escalationViews.has(module as EscalationView)) return <SafetyBoard view={module as EscalationView} />;
  if (workControlViews.has(module as WorkControlView)) return <SafetyBoard view={module as WorkControlView} />;
  if (environmentalViews.has(module as EnvironmentalComplianceView)) return <SafetyBoard view={module as EnvironmentalComplianceView} />;
  if (section07Views.has(module as Section07View)) return <SafetyBoard view={module as Section07View} />;
  if (section08Views.has(module as SafetySystemsView)) return <SafetyBoard view={module as SafetySystemsView} />;
  const view = allowed.has(module) ? module as "reports" | "actions" | "live-meeting" | "vision" | "risk" | "incidents" | "ncr" | "gamification" | "sections" | "posts" | "safety-radio" | "inbound-inbox" | "email-settings" | "notification-rules" | "files" | "reports-documents" | "safety-signs" | "contracts" | "forms" | "invoices" : "dashboard";
  return <SafetyBoard view={view} />;
}
