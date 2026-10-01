import SafetyBoard from "@/components/safety-board";
import type { EscalationView } from "@/components/escalation-command-center";

type Props = { params: Promise<{ view: string }> };
const views = new Set(["history", "matrix"]);

export default async function EscalationChildPage({ params }: Props) {
  const { view } = await params;
  if (!views.has(view)) return <SafetyBoard view="escalations" />;
  return <SafetyBoard view={view === "history" ? "escalations-history" as EscalationView : "escalations-matrix" as EscalationView} />;
}
