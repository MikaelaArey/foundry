import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { KINDS, stageOf, type Kind } from "./constants";
import {
  GoalsSchema,
  PlanSchema,
  ReportSchema,
  cleanReport,
  type Plan,
  type Report,
} from "./schemas";

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const model = () => process.env.FOUNDRY_AI_MODEL || "claude-opus-5";
// Server-side refusal fallbacks are available on these models.
const supportsFallbacks = (m: string) => m === "claude-opus-5" || m === "claude-fable-5-1";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export type AiErrorCode = "not_configured" | "refused" | "rate_limited" | "failed";
export class AiError extends Error {
  constructor(public code: AiErrorCode, message: string) {
    super(message);
  }
}

const SYSTEM = `You are the startup analyst inside Foundry, a workspace where founders capture ideas and turn them into projects.
Be concrete and practical. Prefer small, cheap steps a solo founder can take this week. Write in plain language that a first-time founder understands, with short sentences and no jargon.
Scores are honest judgment calls, not flattery: a weak idea gets low scores. Never invent statistics, market sizes or quotes; describe things qualitatively instead.`;

async function ask<T extends z.ZodType>(schema: T, prompt: string, effort: "low" | "medium" | "high"): Promise<z.infer<T>> {
  if (!aiConfigured()) {
    throw new AiError("not_configured", "AI features are off. Add ANTHROPIC_API_KEY to the server's .env file to turn them on.");
  }
  const m = model();
  try {
    const res = await getClient().beta.messages.parse({
      model: m,
      max_tokens: 16000,
      ...(supportsFallbacks(m) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      system: SYSTEM,
      output_config: { effort, format: betaZodOutputFormat(schema) },
      messages: [{ role: "user", content: prompt }],
    });
    if (res.stop_reason === "refusal") throw new AiError("refused", "Claude couldn't help with that request. Try rewording it.");
    if (res.stop_reason === "max_tokens" || !res.parsed_output) {
      throw new AiError("failed", "The answer came back incomplete. Please try again.");
    }
    return res.parsed_output as z.infer<T>;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.AuthenticationError) {
      throw new AiError("not_configured", "The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in .env.");
    }
    if (e instanceof Anthropic.RateLimitError) throw new AiError("rate_limited", "Claude is busy right now. Try again in a minute.");
    if (e instanceof Anthropic.BadRequestError) throw new AiError("failed", `Claude rejected the request: ${e.message}`);
    if (e instanceof Anthropic.APIError) throw new AiError("failed", `Claude returned an error (${e.status ?? "network"}). Try again shortly.`);
    throw new AiError("failed", "Couldn't reach Claude. Check the server's internet connection.");
  }
}

export async function validateIdea(i: { title: string; body: string; tags: string[] }): Promise<Report> {
  const prompt = `Write a validation report for this idea from a founder's notebook.

Title: ${i.title}
Notes:
${i.body.slice(0, 6000) || "(no extra notes)"}
${i.tags.length ? `Tags: ${i.tags.join(", ")}` : ""}

Fill every field. The value ladder should have three offers: a free lead magnet, a low-priced frontend offer, and the core offer. The plan should have three or four sections with three or four small goals each, in the order to do them.`;
  return cleanReport(await ask(ReportSchema, prompt, "high"));
}

export async function suggestGoals(ctx: { name: string; pitch: string; stage: string; section: string; kind: Kind; existing: string[] }) {
  const stage = stageOf(ctx.stage);
  const prompt = `Suggest 5 new goals for the "${ctx.section}" section (${KINDS[ctx.kind].blurb.toLowerCase()}) of this project.

Project: ${ctx.name}
Pitch: ${ctx.pitch || "(none)"}
Stage: ${stage.label} (${stage.hint})
Goals already in this section, don't repeat them:
${ctx.existing.map((g) => `- ${g}`).join("\n").slice(0, 3000) || "(none yet)"}

Each goal starts with a verb, is under 60 characters, and can be finished in a day or less.`;
  const out = await ask(GoalsSchema, prompt, "low");
  return out.goals.map((g) => g.trim().slice(0, 200)).filter(Boolean).slice(0, 6);
}

export async function draftPlan(ctx: { name: string; pitch: string; stage: string }): Promise<Plan> {
  const stage = stageOf(ctx.stage);
  const prompt = `Plan the work for a new project so the founder can start today.

Project: ${ctx.name || "(unnamed)"}
Pitch: ${ctx.pitch || "(none)"}
Stage: ${stage.label} (${stage.hint})

Choose the 3 to 5 sections that matter most right now, each with 4 small goals in the order to do them. Each goal starts with a verb, is under 60 characters, and takes a day or less.`;
  const out = await ask(PlanSchema, prompt, "medium");
  const seen = new Set<string>();
  return out.sections
    .filter((s) => !seen.has(s.kind) && seen.add(s.kind))
    .slice(0, 5)
    .map((s) => ({ kind: s.kind, goals: s.goals.map((g) => g.trim().slice(0, 200)).filter(Boolean).slice(0, 6) }));
}
