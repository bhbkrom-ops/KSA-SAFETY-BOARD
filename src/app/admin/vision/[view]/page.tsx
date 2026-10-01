import SafetyBoard from "@/components/safety-board";
import type { VisionView } from "@/components/vision-command-center";

const allowed = new Set<VisionView>(["dashboard", "live", "cameras", "devices", "map", "rules", "events", "alerts", "analytics", "ppe", "fire-smoke", "equipment", "people-vehicles", "heatmap", "recordings", "restricted-areas", "audit-log", "settings"]);

type Props = { params: Promise<{ view: string }> };

export default async function VisionRoute({ params }: Props) {
  const { view } = await params;
  const visionView = allowed.has(view as VisionView) ? view as VisionView : "dashboard";
  return <SafetyBoard view="vision" visionView={visionView} />;
}
