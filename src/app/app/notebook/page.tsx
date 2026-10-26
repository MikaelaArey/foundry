import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import { toIdeaDTO } from "@/actions/ideas";
import { NotebookView } from "@/components/notebook-view";

export const metadata = { title: "Notebook" };

export default async function NotebookPage({ searchParams }: { searchParams: Promise<{ id?: string; new?: string; project?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/app/notebook");
  const [ideas, projects] = await Promise.all([
    db.idea.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    db.project.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, name: true } }),
  ]);
  const dtos = await Promise.all(ideas.map(toIdeaDTO));
  const selected = sp.id && dtos.some((i) => i.id === sp.id) ? sp.id : null;
  return (
    <NotebookView
      initialIdeas={dtos}
      projects={projects}
      selectedId={selected}
      startNew={sp.new === "1"}
      newProjectId={sp.project && projects.some((p) => p.id === sp.project) ? sp.project : null}
      ai={aiConfigured()}
    />
  );
}
