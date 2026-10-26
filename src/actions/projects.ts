"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { KINDS, KIND_KEYS, KIND_ORDER, STAGES, TOOL_KEYS, TOOLS, type Kind } from "@/lib/constants";
import { findIdea } from "@/lib/idea-db";
import { PlanSchema, parseReport } from "@/lib/schemas";
import { hostOf, normalizeUrl } from "@/lib/utils";

export type GoalDTO = { id: string; text: string; done: boolean; doneAt: string | null };
export type SectionDTO = { id: string; kind: Kind; name: string; goals: GoalDTO[] };
export type LinkDTO = { id: string; kind: string; label: string; url: string };

const asKind = (k: string): Kind => ((KIND_KEYS as readonly string[]).includes(k) ? (k as Kind) : "custom");
const goalDTO = (g: { id: string; text: string; done: boolean; doneAt: Date | null }): GoalDTO => ({
  id: g.id,
  text: g.text,
  done: g.done,
  doneAt: g.doneAt ? g.doneAt.toISOString() : null,
});
const clean = (s: unknown, max: number) => String(s ?? "").trim().slice(0, max);
const refresh = () => revalidatePath("/app", "layout");

async function ownProject(projectId: string) {
  const user = await requireUser();
  const p = await db.project.findFirst({ where: { id: projectId, userId: user.id }, select: { id: true } });
  if (!p) throw new Error("Project not found");
  return p;
}
async function ownSection(sectionId: string) {
  const user = await requireUser();
  const s = await db.section.findFirst({ where: { id: sectionId, project: { userId: user.id } }, select: { id: true, projectId: true } });
  if (!s) throw new Error("Section not found");
  return s;
}
async function ownGoal(goalId: string) {
  const user = await requireUser();
  const g = await db.goal.findFirst({
    where: { id: goalId, section: { project: { userId: user.id } } },
    select: { id: true, sectionId: true, section: { select: { projectId: true } } },
  });
  if (!g) throw new Error("Goal not found");
  return g;
}
const touch = (projectId: string) => db.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } });

/* ------------------------------------------------------------- create */

export type CreateState = { error?: string } | undefined;

export async function createProjectAction(_prev: CreateState, form: FormData): Promise<CreateState> {
  const user = await requireUser();
  const name = clean(form.get("name"), 80);
  if (!name) return { error: "Give the project a name." };
  const pitch = clean(form.get("pitch"), 240);
  const stageRaw = String(form.get("stage") ?? "spark");
  const stage = STAGES.some((s) => s.key === stageRaw) ? stageRaw : "spark";

  let sections: { kind: Kind; name: string; goals: string[] }[] = [];
  const planRaw = form.get("plan");
  if (typeof planRaw === "string" && planRaw) {
    const parsed = PlanSchema.safeParse({ sections: JSON.parse(planRaw) });
    if (parsed.success) sections = parsed.data.sections.map((s) => ({ kind: s.kind, name: KINDS[s.kind].label, goals: s.goals }));
  }
  if (!sections.length) {
    const kinds = form.getAll("kinds").map(String).filter((k): k is Kind => (KIND_ORDER as string[]).includes(k));
    const starter = form.get("starter") === "on";
    sections = KIND_ORDER.filter((k) => kinds.includes(k)).map((k) => ({ kind: k, name: KINDS[k].label, goals: starter ? KINDS[k].starters : [] }));
    for (const c of clean(form.get("custom"), 300).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6)) {
      sections.push({ kind: "custom", name: c.slice(0, 40), goals: [] });
    }
  }

  const project = await db.project.create({
    data: {
      userId: user.id,
      name,
      pitch,
      stage,
      sections: {
        create: sections.map((s, i) => ({
          kind: s.kind,
          name: s.name,
          position: i,
          goals: { create: s.goals.slice(0, 12).map((t, j) => ({ text: t.slice(0, 200), position: j })) },
        })),
      },
    },
  });

  const ideaId = String(form.get("ideaId") ?? "");
  if (ideaId) await db.idea.updateMany({ where: { id: ideaId, userId: user.id }, data: { projectId: project.id } });

  refresh();
  redirect(`/app/projects/${project.id}?new=1`);
}

/** Starter plan for the new-project form, from a notebook idea's report or an Idea Database entry. */
export async function planFromSource(ideaId?: string, slug?: string) {
  const user = await requireUser();
  if (slug) {
    const idea = findIdea(slug);
    if (idea) return { name: idea.title, pitch: idea.tagline, plan: idea.report.plan, ideaId: "" };
  }
  if (ideaId) {
    const idea = await db.idea.findFirst({ where: { id: ideaId, userId: user.id } });
    if (idea) {
      const report = parseReport(idea.report);
      return { name: idea.title.slice(0, 80), pitch: idea.body.replace(/\s+/g, " ").trim().slice(0, 240), plan: report?.plan ?? null, ideaId: idea.id };
    }
  }
  return null;
}

/* ------------------------------------------------------------- project */

export async function updateProjectAction(projectId: string, patch: { name?: string; pitch?: string; stage?: string; parked?: boolean }) {
  await ownProject(projectId);
  const data: { name?: string; pitch?: string; stage?: string; parked?: boolean } = {};
  if (patch.name !== undefined && clean(patch.name, 80)) data.name = clean(patch.name, 80);
  if (patch.pitch !== undefined) data.pitch = clean(patch.pitch, 240);
  if (patch.stage !== undefined && STAGES.some((s) => s.key === patch.stage)) data.stage = patch.stage;
  if (patch.parked !== undefined) data.parked = Boolean(patch.parked);
  await db.project.update({ where: { id: projectId }, data });
  refresh();
}

export async function deleteProjectAction(projectId: string) {
  await ownProject(projectId);
  await db.project.delete({ where: { id: projectId } });
  refresh();
  redirect("/app");
}

/* ------------------------------------------------------------ sections */

export async function addSectionAction(projectId: string, kind: string, name: string, withStarters: boolean): Promise<SectionDTO> {
  await ownProject(projectId);
  const k = asKind(kind);
  const count = await db.section.count({ where: { projectId } });
  const s = await db.section.create({
    data: {
      projectId,
      kind: k,
      name: clean(name, 40) || KINDS[k].label,
      position: count,
      goals: { create: (withStarters ? KINDS[k].starters : []).map((t, i) => ({ text: t, position: i })) },
    },
    include: { goals: { orderBy: { position: "asc" } } },
  });
  await touch(projectId);
  refresh();
  return { id: s.id, kind: k, name: s.name, goals: s.goals.map(goalDTO) };
}

export async function renameSectionAction(sectionId: string, name: string) {
  const s = await ownSection(sectionId);
  const n = clean(name, 40);
  if (n) await db.section.update({ where: { id: sectionId }, data: { name: n } });
  await touch(s.projectId);
  refresh();
}

export async function deleteSectionAction(sectionId: string) {
  const s = await ownSection(sectionId);
  await db.section.delete({ where: { id: sectionId } });
  await touch(s.projectId);
  refresh();
}

/* --------------------------------------------------------------- goals */

export async function addGoalsAction(sectionId: string, texts: string[]): Promise<GoalDTO[]> {
  const s = await ownSection(sectionId);
  const items = texts.map((t) => clean(t, 200)).filter(Boolean).slice(0, 12);
  const base = await db.goal.count({ where: { sectionId } });
  const created = [];
  for (const [i, text] of items.entries()) {
    created.push(await db.goal.create({ data: { sectionId, text, position: base + i } }));
  }
  await touch(s.projectId);
  refresh();
  return created.map(goalDTO);
}

export async function toggleGoalAction(goalId: string, done: boolean) {
  const g = await ownGoal(goalId);
  const updated = await db.goal.update({ where: { id: goalId }, data: { done, doneAt: done ? new Date() : null } });
  await touch(g.section.projectId);
  refresh();
  return goalDTO(updated);
}

export async function editGoalAction(goalId: string, text: string) {
  await ownGoal(goalId);
  const t = clean(text, 200);
  if (t) await db.goal.update({ where: { id: goalId }, data: { text: t } });
  refresh();
}

export async function deleteGoalAction(goalId: string) {
  const g = await ownGoal(goalId);
  await db.goal.delete({ where: { id: goalId } });
  await touch(g.section.projectId);
  refresh();
}

/* --------------------------------------------------------------- links */

const LinkInput = z.object({
  id: z.string().optional(),
  kind: z.string(),
  label: z.string().max(60).optional(),
  url: z.string().max(800),
});

export async function saveLinkAction(projectId: string, input: z.infer<typeof LinkInput>): Promise<{ link?: LinkDTO; error?: string }> {
  await ownProject(projectId);
  const parsed = LinkInput.safeParse(input);
  if (!parsed.success) return { error: "That link couldn't be saved." };
  const url = normalizeUrl(parsed.data.url);
  if (!url) return { error: url === "" ? "Paste a link first." : "That link doesn't look right. Links start with https://" };
  const kind = (TOOL_KEYS as readonly string[]).includes(parsed.data.kind) ? parsed.data.kind : "custom";
  const label =
    kind === "custom" ? clean(parsed.data.label, 40) || hostOf(url).split("/")[0] : TOOLS[kind as keyof typeof TOOLS].name;

  let link;
  if (parsed.data.id) {
    const existing = await db.projectLink.findFirst({ where: { id: parsed.data.id, projectId } });
    if (!existing) return { error: "That link no longer exists." };
    link = await db.projectLink.update({ where: { id: existing.id }, data: { url, label } });
  } else if (kind !== "custom") {
    const existing = await db.projectLink.findFirst({ where: { projectId, kind } });
    link = existing
      ? await db.projectLink.update({ where: { id: existing.id }, data: { url, label } })
      : await db.projectLink.create({ data: { projectId, kind, label, url } });
  } else {
    const count = await db.projectLink.count({ where: { projectId } });
    link = await db.projectLink.create({ data: { projectId, kind, label, url, position: count } });
  }
  await touch(projectId);
  refresh();
  return { link: { id: link.id, kind: link.kind, label: link.label, url: link.url } };
}

export async function deleteLinkAction(linkId: string) {
  const user = await requireUser();
  const link = await db.projectLink.findFirst({ where: { id: linkId, project: { userId: user.id } } });
  if (!link) return;
  await db.projectLink.delete({ where: { id: linkId } });
  refresh();
}
