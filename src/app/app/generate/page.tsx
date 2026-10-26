import { aiConfigured } from "@/lib/ai";
import { GeneratorView } from "@/components/generator-view";

export const metadata = { title: "Idea generator" };

export default async function GeneratePage({ searchParams }: { searchParams: Promise<{ industry?: string; edge?: string }> }) {
  const sp = await searchParams;
  return <GeneratorView initialIndustry={(sp.industry ?? "").slice(0, 120)} initialEdge={(sp.edge ?? "").slice(0, 200)} ai={aiConfigured()} />;
}
