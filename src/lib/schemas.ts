import { z } from "zod";

const PLAN_KINDS = ["coding", "marketing", "product", "finance", "design", "operations", "sales", "legal"] as const;

/** The validation report shape shared by the Idea Database and AI reports. */
export const ReportSchema = z.object({
  summary: z.string().describe("Two short paragraphs separated by a blank line: the problem, then the solution and business model."),
  audience: z.string().describe("Who this is for, in one line."),
  badges: z.array(z.string()).describe("Two to four short strengths, 1-3 words each."),
  scores: z.object({
    opportunity: z.number().describe("1-10: size and value of the opportunity"),
    problem: z.number().describe("1-10: how painful the problem is"),
    feasibility: z.number().describe("1-10: how feasible for a small team"),
    whyNow: z.number().describe("1-10: how good the timing is"),
  }),
  scoreLabels: z.object({
    opportunity: z.string(),
    problem: z.string(),
    feasibility: z.string(),
    whyNow: z.string(),
  }),
  revenue: z.object({ level: z.number().describe("1 = $, 2 = $$, 3 = $$$"), note: z.string() }),
  difficulty: z.object({ score: z.number().describe("1-10, higher is harder to build and run"), note: z.string() }),
  goToMarket: z.object({ score: z.number().describe("1-10, higher is easier to reach customers"), note: z.string() }),
  offers: z
    .array(z.object({ stage: z.string(), name: z.string(), price: z.string(), description: z.string() }))
    .describe("Value ladder: lead magnet, frontend offer, core offer."),
  whyNow: z.string(),
  risks: z.array(z.string()).describe("Three main risks."),
  experiments: z.array(z.string()).describe("Three cheap tests to run this week or month."),
  plan: z
    .array(z.object({ kind: z.enum(PLAN_KINDS), goals: z.array(z.string()) }))
    .describe("Three or four project sections with three or four small goals each."),
});
export type Report = z.infer<typeof ReportSchema>;

export const GeneratedIdeaSchema = z.object({
  title: z.string(),
  pitch: z.string().describe("One sentence."),
  audience: z.string(),
  category: z.string().describe("One or two words, like SaaS, Marketplace, Service."),
  potential: z.number().describe("0-100 overall potential score"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  market: z.enum(["Niche", "Medium", "Large"]),
  whyItWorks: z.string().describe("One sentence."),
  firstStep: z.string().describe("One concrete first step."),
});
export type GeneratedIdea = z.infer<typeof GeneratedIdeaSchema>;
export const GeneratedIdeasSchema = z.object({ ideas: z.array(GeneratedIdeaSchema) });

export const PlanSchema = z.object({
  sections: z.array(z.object({ kind: z.enum(PLAN_KINDS), goals: z.array(z.string()) })),
});
export type Plan = z.infer<typeof PlanSchema>["sections"];

export const GoalsSchema = z.object({ goals: z.array(z.string()) });

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number.isFinite(n) ? n : lo)));
const trimList = (a: string[], n: number, len = 200) => a.map((s) => s.trim().slice(0, len)).filter(Boolean).slice(0, n);

export function cleanReport(r: Report): Report {
  return {
    ...r,
    badges: trimList(r.badges, 4, 30),
    scores: {
      opportunity: clamp(r.scores.opportunity, 1, 10),
      problem: clamp(r.scores.problem, 1, 10),
      feasibility: clamp(r.scores.feasibility, 1, 10),
      whyNow: clamp(r.scores.whyNow, 1, 10),
    },
    revenue: { ...r.revenue, level: clamp(r.revenue.level, 1, 3) },
    difficulty: { ...r.difficulty, score: clamp(r.difficulty.score, 1, 10) },
    goToMarket: { ...r.goToMarket, score: clamp(r.goToMarket.score, 1, 10) },
    offers: r.offers.slice(0, 3),
    risks: trimList(r.risks, 4, 240),
    experiments: trimList(r.experiments, 4, 240),
    plan: r.plan.slice(0, 5).map((p) => ({ kind: p.kind, goals: trimList(p.goals, 6) })),
  };
}

export function cleanGeneratedIdea(i: GeneratedIdea): GeneratedIdea {
  return { ...i, potential: clamp(i.potential, 0, 100), title: i.title.slice(0, 90), pitch: i.pitch.slice(0, 280) };
}

export function parseReport(json: string | null | undefined): Report | null {
  if (!json) return null;
  try {
    const r = ReportSchema.safeParse(JSON.parse(json));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}
