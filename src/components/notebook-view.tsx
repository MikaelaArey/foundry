"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createIdeaAction, deleteIdeaAction, updateIdeaAction, validateIdeaAction, type IdeaDTO } from "@/actions/ideas";
import { NOTE_COLORS, SPARK_LABELS } from "@/lib/constants";
import { cx, parseTags, timeAgo } from "@/lib/utils";
import { Icon } from "./icon";
import { ReportView } from "./idea";
import { toast } from "./toaster";

type Patch = Partial<Pick<IdeaDTO, "title" | "body" | "tags" | "spark" | "color" | "pinned" | "projectId">>;
type Filter = "all" | "pinned" | "hot" | "validated" | "linked" | `tag:${string}`;

export function NotebookView({
  initialIdeas,
  projects,
  selectedId,
  startNew,
  newProjectId,
  ai,
}: {
  initialIdeas: IdeaDTO[];
  projects: { id: string; name: string }[];
  selectedId: string | null;
  startNew: boolean;
  newProjectId: string | null;
  ai: boolean;
}) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [sel, setSel] = useState<string | null>(selectedId ?? (startNew ? null : initialIdeas[0]?.id ?? null));
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [tagText, setTagText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [validating, setValidating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const pending = useRef(new Map<string, Patch>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const created = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const current = ideas.find((i) => i.id === sel) ?? null;

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    const entries = [...pending.current.entries()];
    pending.current.clear();
    if (!entries.length) return;
    setSaving("saving");
    try {
      await Promise.all(entries.map(([id, patch]) => updateIdeaAction(id, patch)));
      setSaving("saved");
    } catch {
      setSaving("idle");
      toast("Couldn't save your changes. Check your connection.");
    }
  }, []);

  function patch(id: string, p: Patch, immediate = false) {
    setIdeas((list) => list.map((i) => (i.id === id ? { ...i, ...p, updatedAt: new Date().toISOString() } : i)));
    pending.current.set(id, { ...(pending.current.get(id) ?? {}), ...p });
    setSaving("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, immediate ? 0 : 600);
  }

  useEffect(() => {
    const onLeave = () => void flush();
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      void flush();
    };
  }, [flush]);

  const select = useCallback(
    (id: string | null) => {
      void flush();
      setSel(id);
      setConfirmDelete(false);
      setAiError(null);
      window.history.replaceState(null, "", id ? `/app/notebook?id=${id}` : "/app/notebook");
    },
    [flush],
  );

  const newIdea = useCallback(
    async (projectId?: string | null) => {
      try {
        const idea = await createIdeaAction({ title: "", projectId: projectId ?? null });
        setIdeas((list) => [idea, ...list]);
        setFilter("all");
        setQ("");
        select(idea.id);
        setTimeout(() => {
          titleRef.current?.focus();
          titleRef.current?.select();
        }, 30);
      } catch {
        toast("Couldn't create an idea. Try again.");
      }
    },
    [select],
  );

  useEffect(() => {
    if (startNew && !created.current) {
      created.current = true;
      void newIdea(newProjectId);
    }
  }, [startNew, newProjectId, newIdea]);

  useEffect(() => {
    setTagText(current ? current.tags.join(", ") : "");
    // Resize the body box to fit its text when switching ideas.
    requestAnimationFrame(() => {
      const el = bodyRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of ideas) for (const t of i.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [ideas]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ideas
      .filter((i) => {
        if (filter === "pinned" && !i.pinned) return false;
        if (filter === "hot" && i.spark < 3) return false;
        if (filter === "validated" && !i.report) return false;
        if (filter === "linked" && !i.projectId) return false;
        if (filter.startsWith("tag:") && !i.tags.includes(filter.slice(4))) return false;
        if (needle && !`${i.title} ${i.body} ${i.tags.join(" ")}`.toLowerCase().includes(needle)) return false;
        return true;
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [ideas, filter, q]);

  async function remove() {
    if (!current) return;
    const id = current.id;
    pending.current.delete(id);
    const idx = shown.findIndex((i) => i.id === id);
    const next = shown[idx + 1]?.id ?? shown[idx - 1]?.id ?? null;
    setIdeas((list) => list.filter((i) => i.id !== id));
    select(next);
    try {
      await deleteIdeaAction(id);
      toast("Idea deleted");
    } catch {
      toast("Couldn't delete that idea. Refresh and try again.");
    }
  }

  async function validate() {
    if (!current) return;
    await flush();
    setValidating(true);
    setAiError(null);
    const id = current.id;
    const res = await validateIdeaAction(id).catch(() => ({ error: "Couldn't reach the server.", report: undefined }));
    setValidating(false);
    if (res.report) {
      const report = res.report;
      setIdeas((list) => list.map((i) => (i.id === id ? { ...i, report } : i)));
      toast("Report ready");
    } else setAiError(res.error ?? "Couldn't write the report.");
  }

  const count = (f: (i: IdeaDTO) => boolean) => ideas.filter(f).length;
  const filters: [Filter, string, string, number][] = [
    ["all", "All ideas", "book", ideas.length],
    ["pinned", "Pinned", "pin", count((i) => i.pinned)],
    ["hot", "Hot", "flame", count((i) => i.spark >= 3)],
    ["validated", "Validated", "target", count((i) => !!i.report)],
    ["linked", "In a project", "layers", count((i) => !!i.projectId)],
  ];
  const shareHref = current
    ? `/community?compose=1&kind=idea&title=${encodeURIComponent(current.title.slice(0, 150))}&body=${encodeURIComponent(current.body.slice(0, 1500))}`
    : "#";

  return (
    <>
      <header className="page-head">
        <div className="page-head-copy">
          <span className="eyebrow">Notebook</span>
          <h1 className="display-m">
            Every business starts as a <span className="grad italic">scribble</span>.
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => newIdea(null)}>
          <Icon name="plus" /> New idea
        </button>
      </header>

      <div className={cx("nb", sel && "has-selection")}>
        <aside className="nb-side" aria-label="Filters">
          <div className="stack gap-4">
            {filters.map(([key, label, icon, n]) => (
              <button key={key} className="nb-filter" aria-pressed={filter === key} onClick={() => setFilter(key)}>
                <Icon name={icon} /> {label} <span className="count">{n}</span>
              </button>
            ))}
          </div>
          {tagCounts.length ? (
            <div className="stack gap-4">
              <span className="side-label">Tags</span>
              {tagCounts.map(([t, n]) => (
                <button key={t} className="nb-filter" aria-pressed={filter === `tag:${t}`} onClick={() => setFilter(`tag:${t}`)}>
                  <span className="muted">#</span>
                  {t} <span className="count">{n}</span>
                </button>
              ))}
            </div>
          ) : null}
        </aside>

        <section className="nb-list" aria-label="Ideas">
          <div className="nb-list-head">
            <label className="row" style={{ position: "relative" }}>
              <Icon name="search" className="muted" />
              <span className="sr-only">Search ideas</span>
              <input className="input input-sm grow" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ideas" type="search" />
            </label>
          </div>
          <div className="nb-items">
            {shown.length ? (
              shown.map((i) => (
                <button
                  key={i.id}
                  className="nb-item"
                  aria-current={i.id === sel}
                  onClick={() => select(i.id)}
                  style={{ ["--paper" as string]: `var(--n-${i.color})` }}
                >
                  <b>{i.title || "Untitled idea"}</b>
                  {i.body ? <p>{i.body}</p> : null}
                  <span className="nb-item-meta">
                    {i.pinned ? <Icon name="pin" /> : null}
                    <span style={{ color: "var(--warm)" }} aria-label={SPARK_LABELS[i.spark]}>
                      {"●".repeat(i.spark)}
                    </span>
                    {i.report ? <span className="chip chip-good" style={{ height: 18, fontSize: 10.5 }}>Validated</span> : null}
                    <span style={{ marginLeft: "auto" }}>{timeAgo(i.updatedAt)}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="small muted" style={{ padding: 16 }}>
                {ideas.length ? "No ideas match. Try another filter." : "No ideas yet. Press New idea to write your first one."}
              </p>
            )}
          </div>
        </section>

        <section className="nb-editor" style={current ? { ["--paper" as string]: `var(--n-${current.color})` } : undefined} aria-label="Editor">
          {current ? (
            <>
              <div className="nb-toolbar">
                <button className="icon-btn nb-back" style={{ display: "none" }} onClick={() => select(null)} aria-label="Back to list">
                  <Icon name="back" />
                </button>
                <div className="color-dots" role="group" aria-label="Paper color">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c}
                      className="color-dot"
                      style={{ background: `var(--n-${c})` }}
                      aria-pressed={current.color === c}
                      aria-label={`${c} paper`}
                      title={c === "none" ? "Plain" : c}
                      onClick={() => patch(current.id, { color: c }, true)}
                    />
                  ))}
                </div>
                <div className="spark-pick" role="radiogroup" aria-label="Spark">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      className={n <= current.spark ? "spk on" : "spk"}
                      role="radio"
                      aria-checked={current.spark === n}
                      aria-label={SPARK_LABELS[n]}
                      title={SPARK_LABELS[n]}
                      onClick={() => patch(current.id, { spark: n }, true)}
                    >
                      <Icon name="bolt" filled />
                    </button>
                  ))}
                </div>
                <button
                  className="icon-btn"
                  aria-pressed={current.pinned}
                  onClick={() => patch(current.id, { pinned: !current.pinned }, true)}
                  aria-label={current.pinned ? "Unpin" : "Pin to top"}
                  title={current.pinned ? "Unpin" : "Pin to top"}
                >
                  <Icon name="pin" />
                </button>
                <select
                  className="input input-sm"
                  style={{ width: "auto", maxWidth: 200, minHeight: 32 }}
                  value={current.projectId ?? ""}
                  onChange={(e) => patch(current.id, { projectId: e.target.value || null }, true)}
                  aria-label="Link to a project"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <span className="saved" style={{ marginLeft: "auto" }}>
                  {saving === "saving" ? (
                    "Saving…"
                  ) : saving === "saved" ? (
                    <>
                      <Icon name="check" /> Saved
                    </>
                  ) : null}
                </span>
                <button className="icon-btn" onClick={() => setConfirmDelete(true)} aria-label="Delete idea" title="Delete">
                  <Icon name="trash" />
                </button>
              </div>

              <div className="nb-body">
                {confirmDelete ? (
                  <div className="confirm">
                    <span>Delete this idea? This can&rsquo;t be undone.</span>
                    <span className="row gap-6">
                      <button className="btn btn-danger btn-sm" onClick={remove}>
                        Delete
                      </button>
                      <button className="btn btn-sm" onClick={() => setConfirmDelete(false)}>
                        Cancel
                      </button>
                    </span>
                  </div>
                ) : null}
                <input
                  ref={titleRef}
                  className="nb-title"
                  value={current.title}
                  onChange={(e) => patch(current.id, { title: e.target.value })}
                  placeholder="Name your idea"
                  maxLength={140}
                  aria-label="Idea title"
                />
                <label className="tag-input">
                  <span aria-hidden="true">#</span>
                  <span className="sr-only">Tags</span>
                  <input
                    value={tagText}
                    onChange={(e) => setTagText(e.target.value)}
                    onBlur={() => {
                      const tags = parseTags(tagText);
                      setTagText(tags.join(", "));
                      if (tags.join(",") !== current.tags.join(",")) patch(current.id, { tags }, true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    placeholder="Add tags, separated by commas"
                  />
                </label>
                <textarea
                  ref={bodyRef}
                  className="nb-text"
                  value={current.body}
                  onChange={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                    patch(current.id, { body: e.target.value });
                  }}
                  placeholder="Who is it for? What problem does it solve? How would it make money? Write whatever comes to mind."
                  aria-label="Idea notes"
                />

                <div className="row-wrap" style={{ paddingTop: 8, borderTop: "1px solid color-mix(in srgb, var(--ink) 8%, transparent)" }}>
                  {ai ? (
                    <button className="btn btn-primary btn-sm" onClick={validate} disabled={validating}>
                      {validating ? <span className="spinner" /> : <Icon name="target" />} {current.report ? "Run the report again" : "Validate with Claude"}
                    </button>
                  ) : null}
                  <Link href={`/app/projects/new?idea=${current.id}`} className="btn btn-sm" onClick={() => void flush()}>
                    <Icon name="rocket" /> Make it a project
                  </Link>
                  <Link href={shareHref} className="btn btn-sm" onClick={() => void flush()}>
                    <Icon name="users" /> Share with the community
                  </Link>
                </div>
                {validating ? (
                  <div className="notice">
                    <span className="spinner" style={{ color: "var(--info)" }} /> Claude is scoring your idea and writing the report. This takes about a minute.
                  </div>
                ) : null}
                {aiError ? <p className="form-error">{aiError}</p> : null}
                {!ai && !current.report && process.env.NODE_ENV !== "production" ? (
                  <p className="small muted">
                    Validation reports need an Anthropic API key on the server. Meanwhile, browse the{" "}
                    <Link className="link" href="/explore">
                      Idea Database
                    </Link>{" "}
                    to see what a report looks like.
                  </p>
                ) : null}
                {current.report ? (
                  <section className="stack gap-16" style={{ marginTop: 8 }}>
                    <h2 className="title">Validation report</h2>
                    <ReportView report={current.report} narrow />
                  </section>
                ) : null}
              </div>
            </>
          ) : (
            <div style={{ display: "grid", placeItems: "center", flex: 1, padding: 40 }}>
              <div className="empty" style={{ border: 0 }}>
                <Icon name="bulb" />
                <b>Pick an idea, or start a new one</b>
                <span className="small">Half-baked is fine. The best companies started as a line in a notebook.</span>
                <button className="btn btn-primary btn-sm" onClick={() => newIdea(null)}>
                  <Icon name="plus" /> New idea
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
