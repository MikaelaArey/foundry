import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import { githubConfigured } from "@/lib/github";
import { KIND_KEYS, type Kind } from "@/lib/constants";
import { ProjectView } from "@/components/project/project-view";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const p = await db.project.findFirst({ where: { id, userId: user.id }, select: { name: true } });
  return { title: p?.name ?? "Project" };
}

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/app/projects/${id}`);
  const p = await db.project.findFirst({
    where: { id, userId: user.id },
    include: {
      sections: { orderBy: { position: "asc" }, include: { goals: { orderBy: { position: "asc" } } } },
      links: { orderBy: { position: "asc" } },
      ideas: { orderBy: { updatedAt: "desc" }, select: { id: true, title: true, color: true, updatedAt: true } },
    },
  });
  if (!p) notFound();

  return (
    <ProjectView
      key={p.id}
      initial={{
        id: p.id,
        name: p.name,
        pitch: p.pitch,
        stage: p.stage,
        parked: p.parked,
        sections: p.sections.map((s) => ({
          id: s.id,
          kind: ((KIND_KEYS as readonly string[]).includes(s.kind) ? s.kind : "custom") as Kind,
          name: s.name,
          goals: s.goals.map((g) => ({ id: g.id, text: g.text, done: g.done, doneAt: g.doneAt?.toISOString() ?? null })),
        })),
        links: p.links.map((l) => ({ id: l.id, kind: l.kind, label: l.label, url: l.url })),
      }}
      ideas={p.ideas.map((i) => ({ ...i, updatedAt: i.updatedAt.toISOString() }))}
      github={{ available: githubConfigured(), connected: Boolean(user.githubToken) }}
      ai={aiConfigured()}
      isNew={sp.new === "1"}
    />
  );
}
