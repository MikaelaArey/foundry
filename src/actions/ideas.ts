"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { NOTE_COLORS } from "@/lib/constants";
import { findIdea } from "@/lib/idea-db";
import { AiError, validateIdea } from "@/lib/ai";
import { allow } from "@/lib/ratelimit";
import { parseReport, type GeneratedIdea, type Report } from "@/lib/schemas";
import { parseTags, splitTags, tagsToString } from "@/lib/utils";

export type IdeaDTO = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  spark: number;
  color: string;
  pinned: boolean;
  source: string;
  projectId: string | null;
  report: Report | null;
  createdAt: string;
  updatedAt: string;
};

type IdeaRow = {
  id: string;
  title: string;
  body: string;
  tags: string;
  spark: number;
  color: string;
  pinned: boolean;
  source: string;
  projectId: string | null;
  report: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function toIdeaDTO(i: IdeaRow): Promise<IdeaDTO> {
  return {
    id: i.id,
    title: i.title,
    body: i.body,
    tags: splitTags(i.tags),
    spark: i.spark,
    color: i.color,
    pinned: i.pinned,
    source: i.source,
    projectId: i.projectId,
    report: parseReport(i.report),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

const clampSpark = (n: unknown) => Math.min(3, Math.max(1, Math.round(Number(n) || 1)));
const cleanColor = (c: unknown) => ((NOTE_COLORS as readonly string[]).includes(String(c)) ? String(c) : "none");
const refresh = () => revalidatePath("/app", "layout");

async function ownIdea(id: string) {
  const user = await requireUser();
  const idea = await db.idea.findFirst({ where: { id, userId: user.id } });
  if (!idea) throw new Error("Idea not found");
  return { user, idea };
}
async function validProjectId(userId: string, projectId: string | null | undefined) {
  if (!projectId) return null;
  const p = await db.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  return p?.id ?? null;
}

export async function createIdeaAction(input: {
  title?: string;
  body?: string;
  tags?: string[] | string;
  spark?: number;
  color?: string;
  projectId?: string | null;
}): Promise<IdeaDTO> {
  const user = await requireUser();
  const idea = await db.idea.create({
    data: {
      userId: user.id,
      title: String(input.title ?? "").trim().slice(0, 140) || "Untitled idea",
      body: String(input.body ?? "").slice(0, 20000),
      tags: tagsToString(parseTags(input.tags)),
      spark: clampSpark(input.spark),
      color: cleanColor(input.color),
      projectId: await validProjectId(user.id, input.projectId),
    },
  });
  refresh();
  return toIdeaDTO(idea);
}

export async function updateIdeaAction(
  id: string,
  patch: Partial<{ title: string; body: string; tags: string[]; spark: number; color: string; pinned: boolean; projectId: string | null }>,
): Promise<IdeaDTO> {
  const { user } = await ownIdea(id);
  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = String(patch.title).slice(0, 140);
  if (patch.body !== undefined) data.body = String(patch.body).slice(0, 20000);
  if (patch.tags !== undefined) data.tags = tagsToString(parseTags(patch.tags));
  if (patch.spark !== undefined) data.spark = clampSpark(patch.spark);
  if (patch.color !== undefined) data.color = cleanColor(patch.color);
  if (patch.pinned !== undefined) data.pinned = Boolean(patch.pinned);
  if (patch.projectId !== undefined) data.projectId = await validProjectId(user.id, patch.projectId);
  const idea = await db.idea.update({ where: { id }, data });
  if (patch.projectId !== undefined) refresh();
  return toIdeaDTO(idea);
}

export async function deleteIdeaAction(id: string) {
  await ownIdea(id);
  await db.idea.delete({ where: { id } });
  refresh();
}

/** Saves an Idea Database entry, with its report, into the notebook. */
export async function saveCuratedIdeaAction(slug: string) {
  const user = await requireUser(`/explore/${slug}`);
  const curated = findIdea(slug);
  if (!curated) redirect("/explore");
  const existing = await db.idea.findFirst({ where: { userId: user.id, source: "database", title: curated.title }, select: { id: true } });
  const id =
    existing?.id ??
    (
      await db.idea.create({
        data: {
          userId: user.id,
          title: curated.title,
          body: curated.tagline,
          tags: tagsToString([curated.category]),
          spark: 2,
          color: "blue",
          source: "database",
          report: JSON.stringify(curated.report),
        },
      })
    ).id;
  refresh();
  redirect(`/app/notebook?id=${id}`);
}

export async function saveGeneratedIdeaAction(g: GeneratedIdea & { slug?: string }): Promise<{ id: string }> {
  const user = await requireUser();
  const curated = g.slug ? findIdea(g.slug) : null;
  const body = [g.pitch, "", `Who it's for: ${g.audience}`, `Why it works: ${g.whyItWorks}`, `First step: ${g.firstStep}`].join("\n");
  const idea = await db.idea.create({
    data: {
      userId: user.id,
      title: String(g.title).slice(0, 140),
      body: body.slice(0, 20000),
      tags: tagsToString([g.category]),
      spark: g.potential >= 80 ? 3 : g.potential >= 60 ? 2 : 1,
      color: "purple",
      source: curated ? "database" : "generated",
      report: curated ? JSON.stringify(curated.report) : null,
    },
  });
  refresh();
  return { id: idea.id };
}

export async function validateIdeaAction(id: string): Promise<{ report?: Report; error?: string }> {
  const { user, idea } = await ownIdea(id);
  if (!allow(`ai:${user.id}`, 20, 60 * 60 * 1000)) return { error: "You've used Claude a lot this hour. Try again in a little while." };
  try {
    const report = await validateIdea({ title: idea.title, body: idea.body, tags: splitTags(idea.tags) });
    await db.idea.update({ where: { id }, data: { report: JSON.stringify(report) } });
    return { report };
  } catch (e) {
    return { error: e instanceof AiError ? e.message : "Something went wrong while writing the report. Try again." };
  }
}
