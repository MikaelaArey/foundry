"use client";

import { useActionState, useState } from "react";
import { createProjectAction, type CreateState } from "@/actions/projects";
import { draftPlanAction } from "@/actions/ai";
import { KINDS, KIND_ORDER, STAGES, type Kind } from "@/lib/constants";
import type { Plan } from "@/lib/schemas";
import { Icon } from "./icon";

export function NewProjectForm({
  prefill,
  ai,
}: {
  prefill: { name: string; pitch: string; plan: Plan | null; ideaId: string; stage: string; fromLabel?: string };
  ai: boolean;
}) {
  const [state, action, pending] = useActionState<CreateState, FormData>(createProjectAction, undefined);
  const [name, setName] = useState(prefill.name);
  const [pitch, setPitch] = useState(prefill.pitch);
  const [stage, setStage] = useState(prefill.stage);
  const [kinds, setKinds] = useState<Set<Kind>>(new Set(["product", "coding", "marketing"]));
  const [plan, setPlan] = useState<Plan | null>(prefill.plan);
  const [drafting, setDrafting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function draft() {
    if (!name.trim() && !pitch.trim()) {
      setAiError("Add a name or a pitch first so Claude knows what to plan.");
      return;
    }
    setDrafting(true);
    setAiError(null);
    const res = await draftPlanAction({ name, pitch, stage }).catch(() => ({ error: "Couldn't reach the server.", plan: undefined }));
    setDrafting(false);
    if (res.plan) setPlan(res.plan);
    else setAiError(res.error ?? "Couldn't draft a plan.");
  }

  const toggleKind = (k: Kind) =>
    setKinds((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <form action={action} className="card card-pad stack gap-24" style={{ padding: 28, maxWidth: 820 }}>
      <input type="hidden" name="ideaId" value={prefill.ideaId} />
      <input type="hidden" name="stage" value={stage} />
      {plan ? <input type="hidden" name="plan" value={JSON.stringify(plan)} /> : null}
      {prefill.fromLabel ? (
        <div className="notice">
          <Icon name="bulb" /> <span>{prefill.fromLabel}</span>
        </div>
      ) : null}

      <label className="field">
        <span className="label">Project name</span>
        <input className="input" name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required placeholder="e.g. Corner Cup coffee subscription" autoFocus />
      </label>
      <label className="field">
        <span className="label">One-line pitch</span>
        <input className="input" name="pitch" value={pitch} onChange={(e) => setPitch(e.target.value)} maxLength={240} placeholder="Who is it for, and what does it do for them?" />
      </label>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label" style={{ marginBottom: 8 }}>
          Stage
        </legend>
        <div className="seg" style={{ flexWrap: "wrap" }}>
          {STAGES.map((s) => (
            <button type="button" key={s.key} aria-pressed={stage === s.key} onClick={() => setStage(s.key)} title={s.hint}>
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      {plan ? (
        <section className="stack gap-12">
          <div className="panel-head">
            <span className="label">Sections and starter goals</span>
            <button type="button" className="link small" style={{ border: 0, background: "none", cursor: "pointer" }} onClick={() => setPlan(null)}>
              Pick sections myself instead
            </button>
          </div>
          <div className="proj-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {plan.map((s) => (
              <div key={s.kind} className={`panel k-${s.kind}`} style={{ padding: 14, gap: 8 }}>
                <b className="row small" style={{ gap: 8 }}>
                  <span className="dot dot-lg" /> {KINDS[s.kind].label}
                </b>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--ink-2)", display: "grid", gap: 4 }}>
                  {s.goals.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 8 }}>
            Sections <span className="muted">(each gets its own progress bar)</span>
          </legend>
          <div className="kind-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
            {KIND_ORDER.map((k) => (
              <label key={k} className={`kind-btn k-${k}`} aria-pressed={kinds.has(k)} style={{ cursor: "pointer" }}>
                <input type="checkbox" name="kinds" value={k} checked={kinds.has(k)} onChange={() => toggleKind(k)} className="sr-only" />
                <span className="dot dot-lg" />
                <b>{KINDS[k].label}</b>
                <small>{KINDS[k].blurb}</small>
              </label>
            ))}
          </div>
          <input className="input input-sm" name="custom" placeholder="Add your own sections, separated by commas (optional)" style={{ marginTop: 10 }} />
          <label className="check" style={{ marginTop: 8 }}>
            <input type="checkbox" name="starter" defaultChecked /> Start each section with 5 suggested goals
          </label>
        </fieldset>
      )}

      {ai && !plan ? (
        <div className="notice" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <Icon name="sparkles" />
          <span className="grow">Let Claude draft the sections and first goals from your name and pitch. You can edit everything after.</span>
          <button type="button" className="btn btn-sm" onClick={draft} disabled={drafting}>
            {drafting ? <span className="spinner" /> : <Icon name="wand" />} {drafting ? "Drafting…" : "Draft a plan"}
          </button>
        </div>
      ) : null}
      {aiError ? <p className="form-error">{aiError}</p> : null}
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-primary btn-lg" disabled={pending}>
          {pending ? <span className="spinner" /> : <Icon name="rocket" />} Create project
        </button>
      </div>
    </form>
  );
}
