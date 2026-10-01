import SafetyBoard from "@/components/safety-board";
import { moduleRouteIds } from "@/lib/route-registry";

type ModulePageProps = { params: Promise<{ module: string }> };

const allowed = new Set<string>(moduleRouteIds);

export default async function ModulePage({ params }: ModulePageProps) {
  const { module } = await params;
  const view = allowed.has(module) ? module as "reports" | "actions" | "live-meeting" | "risk" | "incidents" | "ncr" : "dashboard";
  return <SafetyBoard view={view} />;
}
