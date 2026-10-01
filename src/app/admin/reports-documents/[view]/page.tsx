import SafetyBoard from "@/components/safety-board";
import type { ReportsDocumentsView } from "@/components/hse-reports-documents-command-center";

type Props = { params: Promise<{ view: string }> };
const allowed = new Set<ReportsDocumentsView>(["safety-signs"]);
export default async function SafetySignsPage({ params }: Props) {
  const { view } = await params;
  return <SafetyBoard view={allowed.has(view as ReportsDocumentsView) ? view as ReportsDocumentsView : "safety-signs"} />;
}
