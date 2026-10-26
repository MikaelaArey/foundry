"use client";

import { useState } from "react";
import {
  addGoalsAction,
  deleteGoalAction,
  deleteSectionAction,
  editGoalAction,
  renameSectionAction,
  toggleGoalAction,
  type GoalDTO,
  type SectionDTO,
} from "@/actions/projects";
import { suggestGoalsAction } from "@/actions/ai";
import { burst } from "@/lib/confetti";
import { successFeedback, tapFeedback } from "@/lib/native";
import { sectionStats } from "@/lib/progress";
import { Icon } from "../icon";
import { toast } from "../toaster";

type Update = (fn: (s: SectionDTO) => SectionDTO) => void;

export function SectionCard({
  section,
  update,
  onRemoved,
  onCompleted,
  ai,
}: {
  section: SectionDTO;
  update: Update;
  onRemoved: () => void;
  onCompleted: (sectionId: string, sectionName: string) => void;
  ai: boolean;
}) {
  const st = sectionStats(section);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(section.name);
  const [confirm, setConfirm] = useState(false);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [suggest, setSuggest] = useState<{ busy: boolean; items: string[]; error?: string } | null>(null);

  const setGoal = (id: string, fn: (g: GoalDTO) => GoalDTO) => update((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? fn(g) : g)) }));

  async function toggle(g: GoalDTO, checked: boolean, el: HTMLElement) {
    const wasFull = st.total > 0 && st.done === st.total;
    const willBeFull = st.total > 0 && section.goals.every((x) => (x.id === g.id ? checked : x.done));
    setGoal(g.id, (x) => ({ ...x, done: checked, doneAt: checked ? new Date().toISOString() : null }));
    if (checked) void (!wasFull && willBeFull ? successFeedback() : tapFeedback());
    if (!wasFull && willBeFull) {
      const r = el.getBoundingClientRect();
      burst(r.left + 10, r.top + 10, getComputedStyle(el).getPropertyValue("--c").trim() || "#5a45f2");
      onCompleted(section.id, section.name);
    }
    try {
      await toggleGoalAction(g.id, checked);
    } catch {
      setGoal(g.id, (x) => ({ ...x, done: !checked }));
      toast("Couldn't save that. Check your connection.");
    }
  }

  async function addGoals(texts: string[]) {
    const clean = texts.map((t) => t.trim()).filter(Boolean);
    if (!clean.length) return;
    setAdding(true);
    try {
      const goals = await addGoalsAction(section.id, clean);
      update((s) => ({ ...s, goals: [...s.goals, ...goals] }));
      return true;
    } catch {
      toast("Couldn't add that goal. Try again.");
      return false;
    } finally {
      setAdding(false);
    }
  }

  async function saveEdit(id: string) {
    const t = editText.trim();
    setEditId(null);
    if (!t) return;
    setGoal(id, (g) => ({ ...g, text: t }));
    try {
      await editGoalAction(id, t);
    } catch {
      toast("Couldn't save the change.");
    }
  }

  async function removeGoal(id: string) {
    const before = section.goals;
    update((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
    try {
      await deleteGoalAction(id);
    } catch {
      update((s) => ({ ...s, goals: before }));
      toast("Couldn't delete that goal.");
    }
  }

  async function rename() {
    const n = name.trim();
    setRenaming(false);
    if (!n || n === section.name) return setName(section.name);
    update((s) => ({ ...s, name: n }));
    try {
      await renameSectionAction(section.id, n);
    } catch {
      toast("Couldn't rename the section.");
    }
  }

  async function removeSection() {
    try {
      await deleteSectionAction(section.id);
      onRemoved();
      toast(`${section.name} deleted`);
    } catch {
      toast("Couldn't delete the section.");
    }
  }

  async function askClaude() {
    setSuggest({ busy: true, items: [] });
    const res = await suggestGoalsAction(section.id).catch(() => ({ error: "Couldn't reach the server.", goals: undefined }));
    setSuggest({ busy: false, items: res.goals ?? [], error: res.error });
  }

  const complete = st.total > 0 && st.done === st.total;

  return (
    <section className={`card sec k-${section.kind}`} aria-label={`${section.name} section`}>
      <div className="sec-top">
        <div className="sec-head">
          {renaming ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                rename();
              }}
            >
              <input className="input input-sm grow" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus aria-label="Section name" />
              <button className="btn btn-primary btn-sm">Save</button>
            </form>
          ) : (
            <>
              <h3>
                <span className="dot dot-lg" />
                <span>{section.name}</span>
              </h3>
              <span className="mono small muted" style={{ marginRight: 4 }}>
                {st.done}/{st.total}
              </span>
              <button className="icon-btn" onClick={() => setRenaming(true)} aria-label={`Rename ${section.name}`} title="Rename">
                <Icon name="pencil" />
              </button>
              <button className="icon-btn" onClick={() => setConfirm(true)} aria-label={`Delete ${section.name}`} title="Delete section">
                <Icon name="trash" />
              </button>
            </>
          )}
        </div>
        <div className="sec-prog">
          <span className="bar bar-lg">
            <i style={{ width: `${st.pct}%` }} />
          </span>
          <span className="sec-pct">
            {complete ? (
              <>
                <Icon name="check" /> Done
              </>
            ) : (
              `${st.pct}%`
            )}
          </span>
        </div>
      </div>

      {confirm ? (
        <div className="confirm">
          <span>
            Delete {section.name} and its {st.total} goals?
          </span>
          <span className="row gap-6">
            <button className="btn btn-danger btn-sm" onClick={removeSection}>
              Delete
            </button>
            <button className="btn btn-sm" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </span>
        </div>
      ) : null}

      {section.goals.length ? (
        <ul className="goals">
          {section.goals.map((g) =>
            editId === g.id ? (
              <li key={g.id} className="goal">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit(g.id);
                  }}
                >
                  <input className="input input-sm grow" value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus maxLength={200} aria-label="Goal text" />
                  <button className="btn btn-primary btn-sm">Save</button>
                  <button type="button" className="btn btn-sm" onClick={() => setEditId(null)}>
                    Cancel
                  </button>
                </form>
              </li>
            ) : (
              <li key={g.id} className={g.done ? "goal done" : "goal"}>
                <input
                  type="checkbox"
                  className="cb"
                  id={`g-${g.id}`}
                  checked={g.done}
                  onChange={(e) => toggle(g, e.target.checked, e.target.parentElement as HTMLElement)}
                />
                <label className="goal-label" htmlFor={`g-${g.id}`}>
                  <span className="box">
                    <Icon name="check" />
                  </span>
                  <span className="gt">{g.text}</span>
                </label>
                <span className="goal-actions">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setEditId(g.id);
                      setEditText(g.text);
                    }}
                    aria-label="Edit goal"
                    title="Edit"
                  >
                    <Icon name="pencil" />
                  </button>
                  <button className="icon-btn" onClick={() => removeGoal(g.id)} aria-label="Delete goal" title="Delete">
                    <Icon name="x" />
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="small muted" style={{ padding: "12px 16px 0" }}>
          No goals yet. Break the work into steps you can finish in a day.
        </p>
      )}

      <form
        className="add-goal"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await addGoals([draft])) setDraft("");
        }}
      >
        <input className="input input-sm" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a small goal" maxLength={200} aria-label={`Add a goal to ${section.name}`} />
        <button className="btn btn-sm" disabled={adding || !draft.trim()}>
          Add
        </button>
      </form>

      {suggest ? (
        <div className="suggest-box">
          <div className="row between">
            <b className="small row gap-6">
              <Icon name="sparkles" /> Claude&rsquo;s suggestions
            </b>
            <button className="icon-btn" onClick={() => setSuggest(null)} aria-label="Close suggestions">
              <Icon name="x" />
            </button>
          </div>
          {suggest.busy ? (
            <span className="small muted row gap-6">
              <span className="spinner" /> Thinking about your next steps…
            </span>
          ) : null}
          {suggest.error ? <span className="form-error">{suggest.error}</span> : null}
          {suggest.items.length ? (
            <>
              <ul>
                {suggest.items.map((t, i) => (
                  <li key={t + i}>
                    <span>{t}</span>
                    <button
                      className="btn btn-sm"
                      onClick={async () => {
                        if (await addGoals([t])) setSuggest((s) => (s ? { ...s, items: s.items.filter((_, j) => j !== i) } : s));
                      }}
                    >
                      <Icon name="plus" /> Add
                    </button>
                  </li>
                ))}
              </ul>
              <div className="row-wrap">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    if (await addGoals(suggest.items)) setSuggest(null);
                  }}
                >
                  Add all
                </button>
                <button className="btn btn-ghost btn-sm" onClick={askClaude}>
                  Try different ones
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : ai ? (
        <div className="sec-foot">
          <button className="btn btn-ghost btn-sm" onClick={askClaude}>
            <Icon name="wand" /> Suggest goals with Claude
          </button>
        </div>
      ) : null}
    </section>
  );
}
