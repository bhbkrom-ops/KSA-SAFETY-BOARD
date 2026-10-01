import SafetyBoard from "@/components/safety-board";
import { moduleRouteIds } from "@/lib/route-registry";
import type { OverviewView } from "@/components/overview-command-center";

type ModulePageProps = { params: Promise<{ module: string }> };
const allowed = new Set<string>(moduleRouteIds);
const overviewViews = new Set<OverviewView>(["executive-hse", "safety-intelligence", "daily-operations-command", "hse-management-review", "hse-objectives", "environmental-aspects", "intelligence-reporting-center", "hse-assistant"]);

export default async function ModulePage({ params }: ModulePageProps) {
  const { module } = await params;
  if (overviewViews.has(module as OverviewView)) return <SafetyBoard view={module as OverviewView} />;
  const view = allowed.has(module) ? module as "reports" | "actions" | "live-meeting" | "vision" | "risk" | "incidents" | "ncr" : "dashboard";
  return <SafetyBoard view={view} />;
}
