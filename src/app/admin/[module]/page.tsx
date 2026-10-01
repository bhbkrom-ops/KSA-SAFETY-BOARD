import SafetyBoard from "@/components/safety-board";
import { moduleRouteIds } from "@/lib/route-registry";
import type { OverviewView } from "@/components/overview-command-center";
import type { HSEOperationsView } from "@/components/hse-operations-command-center";
import type { EscalationView } from "@/components/escalation-command-center";

type ModulePageProps = { params: Promise<{ module: string }> };
const allowed = new Set<string>(moduleRouteIds);
const overviewViews = new Set<OverviewView>(["executive-hse", "safety-intelligence", "daily-operations-command", "hse-management-review", "hse-objectives", "environmental-aspects", "intelligence-reporting-center", "hse-assistant"]);
const escalationViews = new Set<EscalationView>(["escalations", "escalations-history", "escalations-matrix"]);
const operationsViews = new Set<HSEOperationsView>(["hse-team", "employees", "import-center", "employee-violations", "safety-reporting", "mobile-field", "action-center", "workflow-center", "management-of-change", "hse-shift-handover", "monthly-hse-report", "monthly-hse-plan", "safety-learning", "chemicals", "risk-register", "critical-controls", "process-safety-barriers", "industrial-hygiene", "risk-assessment", "safety-pyramid"]);

export default async function ModulePage({ params }: ModulePageProps) {
  const { module } = await params;
  if (overviewViews.has(module as OverviewView)) return <SafetyBoard view={module as OverviewView} />;
  if (operationsViews.has(module as HSEOperationsView)) return <SafetyBoard view={module as HSEOperationsView} />;
  if (escalationViews.has(module as EscalationView)) return <SafetyBoard view={module as EscalationView} />;
  const view = allowed.has(module) ? module as "reports" | "actions" | "live-meeting" | "vision" | "risk" | "incidents" | "ncr" : "dashboard";
  return <SafetyBoard view={view} />;
}
