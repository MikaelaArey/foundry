import { planFromSource } from "@/actions/projects";
import { aiConfigured } from "@/lib/ai";
import { NewProjectForm } from "@/components/new-project-form";

export const metadata = { title: "New project" };

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ idea?: string; from?: string }> }) {
  const sp = await searchParams;
  const source = sp.idea || sp.from ? await planFromSource(sp.idea, sp.from) : null;
  return (
    <>
      <header className="page-head">
        <div className="page-head-copy">
          <span className="eyebrow">New project</span>
          <h1 className="display-m">
            Let&rsquo;s build <span className="grad italic">something</span>.
          </h1>
          <p className="lead">Name it, pick the parts of the business you&rsquo;ll work on, and start checking off small goals.</p>
        </div>
      </header>
      <NewProjectForm
        ai={aiConfigured()}
        prefill={{
          name: source?.name ?? "",
          pitch: source?.pitch ?? "",
          plan: source?.plan ?? null,
          ideaId: source?.ideaId ?? "",
          stage: source ? "validate" : "spark",
          fromLabel: source ? (source.plan ? "Sections and goals come from this idea's validation report. You can change them after." : "Started from your notebook idea.") : undefined,
        }}
      />
    </>
  );
}
