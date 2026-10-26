"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AiError, aiConfigured, draftPlan, generateIdeas, suggestGoals } from "@/lib/ai";
import { KIND_KEYS, type Kind } from "@/lib/constants";
import { matchIdeas, overallScore } from "@/lib/idea-db";
import { allow } from "@/lib/ratelimit";
import type { GeneratedIdea, Plan } from "@/lib/schemas";

export type GeneratedCard = GeneratedIdea & { slug?: string };

const aiQuota = (userId: string) => allow(`ai:${userId}`, 20, 60 * 60 * 1000);
const errorText = (e: unknown) => (e instanceof AiError ? e.message : "Something went wrong. Try again.");

export async function generateIdeasAction(params: {
  industry: string;
  edge: string;
  risk: string;
  model: string;
  budget: string;
}): Promise<{ ideas: GeneratedCard[]; source: "ai" | "database"; notice?: string; error?: string }> {
  const user = await requireUser();
  const p = {
    industry: String(params.industry ?? "").slice(0, 120),
    edge: String(params.edge ?? "").slice(0, 200),
    risk: ["Safe", "Bold", "Wild"].includes(params.risk) ? params.risk : "Bold",
    model: String(params.model ?? "Any").slice(0, 40),
    budget: String(params.budget ?? "Any").slice(0, 40),
  };

  if (aiConfigured()) {
    if (!aiQuota(user.id)) return { ideas: [], source: "ai", error: "You've generated a lot this hour. Try again in a little while." };
    try {
      return { ideas: await generateIdeas(p), source: "ai" };
    } catch (e) {
      if (!(e instanceof AiError) || e.code !== "not_configured") return { ideas: [], source: "ai", error: errorText(e) };
    }
  }

  // No AI key on this server: suggest the closest ideas from the Idea Database.
  const ideas = matchIdeas(`${p.industry} ${p.edge}`).map<GeneratedCard>((i) => ({
    slug: i.slug,
    title: i.title,
    pitch: i.tagline,
    audience: i.report.audience,
    category: i.category,
    potential: overallScore(i.report),
    difficulty: i.report.difficulty.score <= 4 ? "Easy" : i.report.difficulty.score <= 6 ? "Medium" : "Hard",
    market: i.market,
    whyItWorks: i.report.whyNow,
    firstStep: i.report.experiments[0] ?? "",
  }));
  return {
    ideas,
    source: "database",
    notice:
      process.env.NODE_ENV === "production"
        ? "These ideas come from the Foundry Idea Database. Open one to read its full report."
        : "Showing the closest matches from the Idea Database. Add ANTHROPIC_API_KEY to .env to generate fresh ideas with Claude.",
  };
}

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
