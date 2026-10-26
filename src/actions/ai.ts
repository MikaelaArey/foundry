"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AiError, draftPlan, suggestGoals } from "@/lib/ai";
import { KIND_KEYS, type Kind } from "@/lib/constants";
import { allow } from "@/lib/ratelimit";
import type { Plan } from "@/lib/schemas";

const aiQuota = (userId: string) => allow(`ai:${userId}`, 20, 60 * 60 * 1000);
const errorText = (e: unknown) => (e instanceof AiError ? e.message : "Something went wrong. Try again.");

export async function suggestGoalsAction(sectionId: string): Promise<{ goals?: string[]; error?: string }> {
  const user = await requireUser();
  const s = await db.section.findFirst({
    where: { id: sectionId, project: { userId: user.id } },
    include: { project: true, goals: { select: { text: true } } },
  });
  if (!s) return { error: "Section not found." };
  if (!aiQuota(user.id)) return { error: "You've used Claude a lot this hour. Try again in a little while." };
  try {
    const kind: Kind = (KIND_KEYS as readonly string[]).includes(s.kind) ? (s.kind as Kind) : "custom";
    const goals = await suggestGoals({
      name: s.project.name,
      pitch: s.project.pitch,
      stage: s.project.stage,
      section: s.name,
      kind,
      existing: s.goals.map((g) => g.text),
    });
    return goals.length ? { goals } : { error: "Claude didn't suggest any goals. Try again." };
  } catch (e) {
    return { error: errorText(e) };
  }
}

export async function draftPlanAction(input: { name: string; pitch: string; stage: string }): Promise<{ plan?: Plan; error?: string }> {
  const user = await requireUser();
  if (!aiQuota(user.id)) return { error: "You've used Claude a lot this hour. Try again in a little while." };
  try {
    const plan = await draftPlan({ name: String(input.name).slice(0, 80), pitch: String(input.pitch).slice(0, 240), stage: input.stage });
    return plan.length ? { plan } : { error: "The plan came back empty. Try again, or pick sections yourself." };
  } catch (e) {
    return { error: errorText(e) };
  }
}
