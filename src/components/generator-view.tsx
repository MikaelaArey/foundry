"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { generateIdeasAction, type GeneratedCard } from "@/actions/ai";
import { saveGeneratedIdeaAction } from "@/actions/ideas";
import { Icon } from "./icon";
import { toast } from "./toaster";

const SURPRISES = [
  "pet care",
  "local restaurants",
  "senior living",
  "creator economy",
  "home services",
  "education for kids",
  "fitness",
  "small nonprofits",
  "real estate agents",
  "travel",
  "personal finance",
  "gaming communities",
];
const MODELS = ["Any", "Software", "Marketplace", "Service", "Physical product", "Content"];
const BUDGETS = ["Any budget", "Under $1k", "Under $10k", "Funded"];

const difficultyChip = { Easy: "chip-good", Medium: "chip-amber", Hard: "chip-bad" } as const;
const marketChip = { Niche: "chip-info", Medium: "chip-brand", Large: "chip-good" } as const;

export function GeneratorView({ initialIndustry, initialEdge, ai }: { initialIndustry: string; initialEdge: string; ai: boolean }) {
  const router = useRouter();
  const [industry, setIndustry] = useState(initialIndustry);
  const [edge, setEdge] = useState(initialEdge);
  const [risk, setRisk] = useState("Bold");
  const [model, setModel] = useState("Any");
  const [budget, setBudget] = useState("Any budget");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ideas: GeneratedCard[]; notice?: string; error?: string } | null>(null);
  const [saved, setSaved] = useState<Record<number, string>>({});
  const auto = useRef(false);

  async function run(ind = industry) {
    setBusy(true);
    setSaved({});
    const res = await generateIdeasAction({ industry: ind, edge, risk, model, budget }).catch(() => ({
      ideas: [] as GeneratedCard[],
      error: "Couldn't reach the server. Try again.",
      notice: undefined,
    }));
    setResult(res);
    setBusy(false);
  }

  useEffect(() => {
    if (!auto.current && (initialIndustry || initialEdge)) {
      auto.current = true;
      void run(initialIndustry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(i: number, idea: GeneratedCard, thenValidate = false) {
    try {
      const { id } = saved[i] ? { id: saved[i] } : await saveGeneratedIdeaAction(idea);
      setSaved((s) => ({ ...s, [i]: id }));
      if (thenValidate) router.push(`/app/notebook?id=${id}`);
      else toast("Saved to your notebook");
    } catch {
      toast("Couldn't save that idea. Try again.");
    }
  }

  return (
    <>
      <section className="gen-hero">
        <span className="pill">
          <b>{ai ? "AI" : "New"}</b> {ai ? "Powered by Claude" : "Ideas from the Foundry Idea Database"}
        </span>
        <h1 className="display-l">
          Ideas that scale.
          <br />
          <span className="grad">Generated instantly.</span>
        </h1>
        <p className="lead" style={{ textAlign: "center" }}>
          Get five business ideas with scores. Pick your industry, add your unfair advantage, and save the ones you like to your notebook.
        </p>
      </section>

      <form
        className="gen-box"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <div className="gen-inputs">
          <div className="gen-line">
            <Icon name="compass" />
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Pick an industry or niche…" aria-label="Industry or niche" maxLength={120} />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const pick = SURPRISES[Math.floor(Math.random() * SURPRISES.length)];
                setIndustry(pick);
                void run(pick);
              }}
            >
              <Icon name="dice" /> Surprise me
            </button>
          </div>
          <div className="gen-line">
            <Icon name="bulb" />
            <input value={edge} onChange={(e) => setEdge(e.target.value)} placeholder="Your edge, e.g. physiotherapist with 5k Instagram followers" aria-label="Your unfair advantage" maxLength={200} />
          </div>
        </div>
        <button className="gen-submit" disabled={busy}>
          <span className="row gap-6">{busy ? <span className="spinner" /> : null} {busy ? "Generating…" : "Generate ideas"}</span>
          <small>Free · 5 ideas</small>
        </button>
      </form>

      <div className="gen-opts">
        <div className="seg" role="group" aria-label="Risk appetite">
          {["Safe", "Bold", "Wild"].map((r) => (
            <button type="button" key={r} aria-pressed={risk === r} onClick={() => setRisk(r)}>
              {r}
            </button>
          ))}
        </div>
        <label className="seg" style={{ padding: "0 4px" }}>
          <span className="sr-only">Business model</span>
          <select value={model} onChange={(e) => setModel(e.target.value)} style={{ border: 0, background: "transparent", height: 36, padding: "0 8px", fontSize: 13 }}>
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m === "Any" ? "Any model" : m}
              </option>
            ))}
          </select>
        </label>
        <label className="seg" style={{ padding: "0 4px" }}>
          <span className="sr-only">Budget</span>
          <select value={budget} onChange={(e) => setBudget(e.target.value)} style={{ border: 0, background: "transparent", height: 36, padding: "0 8px", fontSize: 13 }}>
            {BUDGETS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
      </div>

      {result?.notice ? (
        <div className="notice" style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
          <Icon name="compass" /> <span>{result.notice}</span>
        </div>
      ) : null}
      {result?.error ? (
        <p className="form-error" style={{ maxWidth: 860, margin: "0 auto" }}>
          {result.error}
        </p>
      ) : null}

      {busy ? (
        <div className="gen-grid">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="skeleton" style={{ height: 260 }} />
          ))}
        </div>
      ) : result?.ideas.length ? (
        <div className="gen-grid">
          {result.ideas.map((idea, i) => (
            <article key={idea.title + i} className="card gen-card">
              <div className="row between" style={{ alignItems: "flex-start" }}>
                <h3>{idea.title}</h3>
                <span className="chip">{idea.category}</span>
              </div>
              <div className="row-wrap gap-6">
                <span className="trend">
                  <Icon name="trend" /> {idea.potential}%
                </span>
                <span className={`chip ${difficultyChip[idea.difficulty]}`}>{idea.difficulty}</span>
                <span className={`chip ${marketChip[idea.market]}`}>{idea.market} market</span>
              </div>
              <p className="soft" style={{ fontSize: 14.5 }}>
                {idea.pitch}
              </p>
              <p className="meta-line">
                <Icon name="users" /> {idea.audience}
              </p>
              <p className="small soft">
                <b style={{ color: "var(--ink)" }}>Why it works:</b> {idea.whyItWorks}
              </p>
              <p className="small soft">
                <b style={{ color: "var(--ink)" }}>First step:</b> {idea.firstStep}
              </p>
              {idea.slug ? (
                <Link href={`/explore/${idea.slug}`} className="link small">
                  Read the full report
                </Link>
              ) : null}
              <div className="card-actions">
                <button className="btn btn-sm" onClick={() => save(i, idea)} disabled={!!saved[i]}>
                  <Icon name={saved[i] ? "check" : "bolt"} /> {saved[i] ? "Saved" : "Save"}
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => save(i, idea, true)}>
                  <Icon name="target" /> {ai && !idea.slug ? "Validate" : "Open"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="features" style={{ maxWidth: 860, margin: "8px auto 0" }}>
          {[
            ["sparkles", "", "Real ideas", "Specific customers and what they'd pay for, not vague buzzwords."],
            ["target", "good", "Honest scores", "Potential, difficulty and market size for every idea."],
            ["bolt", "warm", "Save and validate", "Keep the good ones in your notebook and run a full report."],
          ].map(([icon, tone, title, text]) => (
            <div key={title} className="card feature">
              <span className={`feature-ic ${tone}`}>
                <Icon name={icon} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
