"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { addSectionAction, deleteProjectAction, updateProjectAction, type LinkDTO, type SectionDTO } from "@/actions/projects";
import { KINDS, KIND_ORDER, STAGES, stageOf } from "@/lib/constants";
import { projectStats } from "@/lib/progress";
import { timeAgo } from "@/lib/utils";
import { Icon } from "../icon";
import { Ring } from "../ui";
import { toast } from "../toaster";
import { Launchpad } from "./launchpad";
import { SectionCard } from "./section-card";

export type ProjectInitial = {
  id: string;
  name: string;
  pitch: string;
  stage: string;
  parked: boolean;
  sections: SectionDTO[];
  links: LinkDTO[];
};

export function ProjectView({
  initial,
  ideas,
  github,
  ai,
  isNew,
}: {
  initial: ProjectInitial;
  ideas: { id: string; title: string; color: string; updatedAt: string }[];
  github: { available: boolean; connected: boolean };
  ai: boolean;
  isNew: boolean;
}) {
  const [info, setInfo] = useState({ name: initial.name, pitch: initial.pitch, stage: initial.stage, parked: initial.parked });
  const [sections, setSections] = useState(initial.sections);
  const [links, setLinks] = useState(initial.links);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: initial.name, pitch: initial.pitch });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [adding, setAdding] = useState(false);
  const [starters, setStarters] = useState(true);
  const [customName, setCustomName] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (isNew) toast("Project created. Connect your tools in the Launchpad.");
  }, [isNew]);

  const st = projectStats(sections);
  const stageIdx = Math.max(0, STAGES.findIndex((s) => s.key === info.stage));

  async function save(patch: Partial<typeof info>) {
    const before = info;
    setInfo((i) => ({ ...i, ...patch }));
    try {
      await updateProjectAction(initial.id, patch);
    } catch {
      setInfo(before);
      toast("Couldn't save that change.");
    }
  }

  async function addSection(kind: string, name = "") {
    try {
      const s = await addSectionAction(initial.id, kind, name, starters && kind !== "custom");
      setSections((ss) => [...ss, s]);
      setAdding(false);
      setCustomName("");
      toast(`${s.name} added`);
    } catch {
      toast("Couldn't add the section.");
    }
  }

  function onCompleted(sectionId: string, sectionName: string) {
    // `sections` is from before this check landed, so treat the finished section as done.
    const allDone = sections.every((s) => s.id === sectionId || s.goals.length === 0 || s.goals.every((g) => g.done));
    toast(allDone ? "Every section is done. Ready for the next stage?" : `${sectionName} is at 100%. Nice work.`);
  }

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/app">Home</Link>
        <span aria-hidden="true">/</span>
        <span>Projects</span>
      </nav>

      <header className="page-head">
        {editing ? (
          <form
            className="stack gap-12"
            style={{ width: "100%", maxWidth: 640 }}
            onSubmit={(e) => {
              e.preventDefault();
              save({ name: draft.name.trim() || info.name, pitch: draft.pitch.trim() });
              setEditing(false);
            }}
          >
            <label className="field">
              <span className="label">Project name</span>
              <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={80} autoFocus />
            </label>
            <label className="field">
              <span className="label">One-line pitch</span>
              <input className="input" value={draft.pitch} onChange={(e) => setDraft({ ...draft, pitch: e.target.value })} maxLength={240} placeholder="Who is it for and what does it do?" />
            </label>
            <div className="row">
              <button className="btn btn-primary btn-sm">Save</button>
              <button type="button" className="btn btn-sm" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="page-head-copy" style={{ maxWidth: 720 }}>
              <div className="row-wrap gap-6">
                <span className="chip chip-brand">{stageOf(info.stage).label} stage</span>
                {info.parked ? <span className="chip">Parked</span> : null}
              </div>
              <h1 className="display-l">{info.name}</h1>
              {info.pitch ? <p className="lead">{info.pitch}</p> : null}
            </div>
            <div className="row-wrap">
              <button
                className="btn btn-sm"
                onClick={() => {
                  setDraft({ name: info.name, pitch: info.pitch });
                  setEditing(true);
                }}
              >
                <Icon name="pencil" /> Edit
              </button>
              <button
                className="btn btn-sm"
                onClick={() => {
                  save({ parked: !info.parked });
                  toast(info.parked ? "Back in your active projects" : "Parked. Find it in the sidebar under Parked.");
                }}
              >
                <Icon name={info.parked ? "play" : "pause"} /> {info.parked ? "Unpark" : "Park"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(true)}>
                <Icon name="trash" /> Delete
              </button>
            </div>
          </>
        )}
      </header>

      {confirmDelete ? (
        <div className="confirm">
          <span>
            Delete &ldquo;{info.name}&rdquo; and all {st.total} goals? Linked ideas stay in your notebook.
          </span>
          <span className="row gap-6">
            <button className="btn btn-danger btn-sm" disabled={pending} onClick={() => startTransition(() => deleteProjectAction(initial.id))}>
              Delete project
            </button>
            <button className="btn btn-sm" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </span>
        </div>
      ) : null}

      <ol className="stepper" aria-label="Project stage">
        {STAGES.map((s, i) => (
          <li key={s.key}>
            <button
              className={`step${i < stageIdx ? " past" : ""}${i === stageIdx ? " now" : ""}`}
              aria-current={i === stageIdx ? "step" : undefined}
              onClick={() => {
                if (s.key !== info.stage) {
                  save({ stage: s.key });
                  toast(`Moved to ${s.label}`);
                }
              }}
            >
              <span className="step-n">{i < stageIdx ? <Icon name="check" /> : i + 1}</span>
              <span>
                <b>{s.label}</b>
                <small>{s.hint}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="p-top">
        <section className="card card-pad stack gap-16" aria-labelledby="h-overall">
          <div className="panel-head">
            <h2 id="h-overall" className="panel-title">
              Overall progress
            </h2>
            <span className="tiny muted" title="The average of your sections. Sections without goals don't count yet.">
              Each section counts equally
            </span>
          </div>
          <div className="overview">
            <Ring pct={st.pct} large label={`${st.pct}% overall`} />
            <div className="stack gap-6">
              <b style={{ fontSize: 15 }}>
                {st.done} of {st.total} goals done
              </b>
              <span className="small soft">
                {st.counted
                  ? `Average of ${st.counted} section${st.counted === 1 ? "" : "s"}.${st.counted < sections.length ? " Empty sections count once they have goals." : ""}`
                  : "Add goals to a section to start tracking."}
              </span>
            </div>
          </div>
          {sections.length ? (
            <ul className="bars">
              {sections.map((s, i) => (
                <li key={s.id} className={`k-${s.kind}`}>
                  <span>
                    <span className="dot" /> {s.name}
                  </span>
                  <span className="bar">
                    <i style={{ width: `${st.sections[i].pct}%` }} />
                  </span>
                  <span className="mono">{st.sections[i].total ? `${st.sections[i].pct}%` : "–"}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="card card-pad stack gap-16" aria-labelledby="h-launch">
          <div className="panel-head">
            <h2 id="h-launch" className="panel-title">
              Launchpad
            </h2>
            <span className="tiny muted">One click to where the work lives</span>
          </div>
          <Launchpad projectId={initial.id} links={links} setLinks={setLinks} github={github} />
        </section>
      </div>

      <section className="stack gap-16" aria-labelledby="h-sections">
        <div className="panel-head">
          <h2 id="h-sections" className="title">
            Sections
          </h2>
          <span className="small muted">Each part of the business gets its own goals and progress bar</span>
        </div>
        <div className="sections-grid">
          {sections.map((s) => (
            <SectionCard
              key={s.id}
              section={s}
              ai={ai}
              update={(fn) => setSections((ss) => ss.map((x) => (x.id === s.id ? fn(x) : x)))}
              onRemoved={() => setSections((ss) => ss.filter((x) => x.id !== s.id))}
              onCompleted={onCompleted}
            />
          ))}
          {adding ? (
            <div className="add-sec">
              <div className="row between">
                <b>Add a section</b>
                <button className="icon-btn" onClick={() => setAdding(false)} aria-label="Close">
                  <Icon name="x" />
                </button>
              </div>
              <div className="kind-grid">
                {KIND_ORDER.map((k) => (
                  <button key={k} className={`kind-btn k-${k}`} onClick={() => addSection(k)}>
                    <span className="dot dot-lg" />
                    <b>{KINDS[k].label}</b>
                    <small>{KINDS[k].blurb}</small>
                  </button>
                ))}
              </div>
              <label className="check">
                <input type="checkbox" checked={starters} onChange={(e) => setStarters(e.target.checked)} /> Include 5 starter goals
              </label>
              <form
                className="row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customName.trim()) addSection("custom", customName.trim());
                }}
              >
                <input className="input input-sm grow" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Or name your own, like Fundraising" maxLength={40} aria-label="Custom section name" />
                <button className="btn btn-sm" disabled={!customName.trim()}>
                  Add
                </button>
              </form>
            </div>
          ) : (
            <button className="new-card" onClick={() => setAdding(true)} style={{ minHeight: 160 }}>
              <Icon name="plus" />
              <b>Add a section</b>
              <span>Coding, Marketing, Finance, or name your own</span>
            </button>
          )}
        </div>
      </section>

      <section className="stack gap-16" aria-labelledby="h-ideas">
        <div className="panel-head">
          <h2 id="h-ideas" className="title">
            Ideas for this project
          </h2>
          <Link href={`/app/notebook?new=1&project=${initial.id}`} className="btn btn-sm">
            <Icon name="bolt" /> Capture an idea for this project
          </Link>
        </div>
        {ideas.length ? (
          <div className="proj-grid">
            {ideas.map((i) => (
              <Link key={i.id} href={`/app/notebook?id=${i.id}`} className="nb-item card-hover" style={{ ["--paper" as string]: `var(--n-${i.color})`, border: "1px solid var(--line)" }}>
                <b>{i.title}</b>
                <span className="nb-item-meta" suppressHydrationWarning>
                  Edited {timeAgo(i.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="small muted">No notebook ideas linked yet.</p>
        )}
      </section>
    </>
  );
}
