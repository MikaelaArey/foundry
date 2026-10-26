"use client";

import { useEffect, useState } from "react";
import { deleteLinkAction, saveLinkAction, type LinkDTO } from "@/actions/projects";
import { TOOLS, TOOL_KEYS, type ToolKey } from "@/lib/constants";
import { ghParse, hostOf } from "@/lib/utils";
import { isNative } from "@/lib/native";
import { Icon } from "../icon";
import { toast } from "../toaster";

type Repo = { fullName: string; url: string; description: string | null; private: boolean };

export function Launchpad({
  projectId,
  links,
  setLinks,
  github,
}: {
  projectId: string;
  links: LinkDTO[];
  setLinks: (fn: (l: LinkDTO[]) => LinkDTO[]) => void;
  github: { available: boolean; connected: boolean };
}) {
  const [editing, setEditing] = useState<string | null>(null); // tool key, link id, or "new"
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [inApp, setInApp] = useState(false);
  useEffect(() => setInApp(isNative()), []);

  const byKind = (k: string) => links.find((l) => l.kind === k);
  const custom = links.filter((l) => l.kind === "custom");
  const gh = ghParse(byKind("github")?.url);

  function open(key: string) {
    const existing = TOOL_KEYS.includes(key as ToolKey) ? byKind(key) : links.find((l) => l.id === key);
    setEditing(key);
    setUrl(existing?.url ?? "");
    setLabel(existing?.kind === "custom" ? existing.label : "");
    setError(null);
    setRepos(null);
    setRepoError(null);
  }

  async function save(nextUrl = url) {
    if (!editing) return;
    setBusy(true);
    setError(null);
    const isTool = TOOL_KEYS.includes(editing as ToolKey);
    const existing = isTool ? byKind(editing) : links.find((l) => l.id === editing);
    try {
      const res = await saveLinkAction(projectId, { id: existing?.id, kind: isTool ? editing : "custom", label, url: nextUrl });
      if (res.error || !res.link) {
        setError(res.error ?? "Couldn't save the link.");
        return;
      }
      const link = res.link;
      setLinks((ls) => (ls.some((l) => l.id === link.id) ? ls.map((l) => (l.id === link.id ? link : l)) : [...ls, link]));
      setEditing(null);
      toast(`${link.label} linked. Click the tile to open it.`);
    } catch {
      setError("Couldn't save the link. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const isTool = editing && TOOL_KEYS.includes(editing as ToolKey);
    const existing = isTool ? byKind(editing!) : links.find((l) => l.id === editing);
    if (!existing) return setEditing(null);
    setLinks((ls) => ls.filter((l) => l.id !== existing.id));
    setEditing(null);
    try {
      await deleteLinkAction(existing.id);
      toast("Link removed");
    } catch {
      toast("Couldn't remove that link. Refresh and try again.");
    }
  }

  async function loadRepos() {
    setRepoError(null);
    setRepos([]);
    try {
      const res = await fetch("/api/github/repos");
      const data = (await res.json()) as { repos?: Repo[]; error?: string };
      if (!res.ok || !data.repos) throw new Error(data.error ?? "Couldn't load repositories.");
      setRepos(data.repos);
    } catch (e) {
      setRepos(null);
      setRepoError(e instanceof Error ? e.message : "Couldn't load repositories.");
    }
  }

  async function linkVsCode() {
    if (!gh) return;
    const vscodeUrl = `https://vscode.dev/github/${gh.owner}/${gh.repo}`;
    try {
      const res = await saveLinkAction(projectId, { kind: "vscode", url: vscodeUrl });
      if (res.link) {
        const link = res.link;
        setLinks((ls) => [...ls.filter((l) => l.kind !== "vscode"), link]);
        toast("VS Code now opens this repo");
      }
    } catch {
      toast("Couldn't link VS Code. Try again.");
    }
  }

  const tile = (key: string, name: string, icon: string, link?: LinkDTO) =>
    link ? (
      <div key={key} className="tool tool-on">
        <a className="tool-main" href={link.url} target="_blank" rel="noopener noreferrer">
          <span className="tool-ic">
            <Icon name={icon} />
          </span>
          <span className="tool-txt">
            <b>{name}</b>
            <small>{hostOf(link.url)}</small>
          </span>
        </a>
        <button className="icon-btn" onClick={() => open(key)} aria-label={`Edit ${name} link`} title="Edit link">
          <Icon name="pencil" />
        </button>
      </div>
    ) : (
      <button key={key} className="tool tool-off" onClick={() => open(key)}>
        <span className="tool-ic">
          <Icon name={icon} />
        </span>
        <span className="tool-txt">
          <b>{name}</b>
          <small>Connect</small>
        </span>
        <Icon name="plus" className="muted" />
      </button>
    );

  const editingTool = editing && TOOL_KEYS.includes(editing as ToolKey) ? TOOLS[editing as ToolKey] : null;
  const editingExisting = editing ? (editingTool ? byKind(editing) : links.find((l) => l.id === editing)) : undefined;

  return (
    <div className="stack gap-12">
      <div className="launch-grid">
        {TOOL_KEYS.map((k) => tile(k, TOOLS[k].name, TOOLS[k].icon, byKind(k)))}
        {custom.map((l) => tile(l.id, l.label, "link", l))}
        <button className="tool tool-off" onClick={() => open("new")}>
          <span className="tool-ic">
            <Icon name="link" />
          </span>
          <span className="tool-txt">
            <b>Other link</b>
            <small>Figma, Notion, Stripe…</small>
          </span>
          <Icon name="plus" className="muted" />
        </button>
      </div>

      {gh ? (
        <div className="row-wrap small" style={{ gap: 14 }}>
          <span className="muted mono">
            {gh.owner}/{gh.repo}
          </span>
          {[
            ["Issues", `https://github.com/${gh.owner}/${gh.repo}/issues`],
            ["Pull requests", `https://github.com/${gh.owner}/${gh.repo}/pulls`],
            ["Actions", `https://github.com/${gh.owner}/${gh.repo}/actions`],
            ["github.dev", `https://github.dev/${gh.owner}/${gh.repo}`],
          ].map(([t, href]) => (
            <a key={t} className="link" href={href} target="_blank" rel="noopener noreferrer">
              {t}
            </a>
          ))}
          {!byKind("vscode") ? (
            <button className="btn btn-sm" onClick={linkVsCode}>
              <Icon name="code" /> Open this repo in VS Code
            </button>
          ) : null}
        </div>
      ) : null}

      {editing ? (
        <form
          className="link-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <b className="small">{editingTool ? `${editingTool.name} link` : editingExisting ? `Edit ${editingExisting.label}` : "Add a link"}</b>
          {!editingTool ? (
            <input className="input input-sm" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name it, like Figma or Stripe" maxLength={40} aria-label="Link name" />
          ) : null}
          <div className="row">
            <input
              className="input input-sm grow"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={editingTool?.placeholder ?? "https://…"}
              aria-label="Link address"
              autoFocus
            />
            <button className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? <span className="spinner" /> : null} Save
            </button>
          </div>
          {editing === "github" ? (
            github.connected ? (
              <div className="stack gap-6">
                {repos === null ? (
                  <button type="button" className="btn btn-sm" style={{ justifySelf: "start" }} onClick={loadRepos}>
                    <Icon name="branch" /> Choose from my repositories
                  </button>
                ) : repos.length === 0 && !repoError ? (
                  <span className="small muted row gap-6">
                    <span className="spinner" /> Loading repositories…
                  </span>
                ) : (
                  <div className="repo-list" role="listbox" aria-label="Your repositories">
                    {repos.map((r) => (
                      <button type="button" key={r.fullName} onClick={() => save(r.url)}>
                        <b className="small">
                          {r.fullName} {r.private ? <span className="chip">Private</span> : null}
                        </b>
                        {r.description ? <small>{r.description}</small> : null}
                      </button>
                    ))}
                  </div>
                )}
                {repoError ? <span className="small" style={{ color: "var(--bad)" }}>{repoError}</span> : null}
              </div>
            ) : github.available && !inApp ? (
              <a className="btn btn-sm" style={{ justifySelf: "start" }} href={`/api/auth/github?next=${encodeURIComponent(`/app/projects/${projectId}`)}`}>
                <Icon name="branch" /> Connect GitHub to pick a repo
              </a>
            ) : github.available ? (
              <span className="hint">To pick from your repositories, connect GitHub once in Settings on the Foundry website.</span>
            ) : null
          ) : null}
          <span className="hint">{editingTool?.tip ?? "Any tool this project lives in: Figma, Notion, Stripe, Google Drive, Canva, Vercel."}</span>
          {error ? <span className="form-error">{error}</span> : null}
          <div className="row-wrap">
            {editingExisting ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={remove}>
                <Icon name="trash" /> Remove link
              </button>
            ) : null}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
