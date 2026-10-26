"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/actions/auth";
import type { PublicUser } from "@/lib/auth";
import { Avatar, Brand } from "./ui";
import { Icon } from "./icon";
import { ThemeToggle } from "./theme-toggle";

export type SidebarProject = { id: string; name: string; pct: number; parked: boolean };

export function AppShell({
  user,
  projects,
  ideaCount,
  openReports,
  children,
}: {
  user: PublicUser;
  projects: SidebarProject[];
  ideaCount: number;
  /** Set for moderators: how many reports are waiting. */
  openReports?: number;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [showParked, setShowParked] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const active = projects.filter((p) => !p.parked);
  const parked = projects.filter((p) => p.parked);
  const is = (href: string, exact = false) => (exact ? path === href : path === href || path.startsWith(href + "/"));

  const nav = [
    { href: "/app", label: "Home", icon: "home", exact: true },
    { href: "/app/notebook", label: "Notebook", icon: "book", count: ideaCount },
    { href: "/explore", label: "Idea Database", icon: "compass" },
    { href: "/community", label: "Community", icon: "users" },
    ...(typeof openReports === "number" ? [{ href: "/app/moderation", label: "Moderation", icon: "shield", count: openReports }] : []),
  ];

  const projectLink = (p: SidebarProject) => (
    <Link key={p.id} href={`/app/projects/${p.id}`} className="side-project" aria-current={is(`/app/projects/${p.id}`) ? "page" : undefined}>
      <MiniRing pct={p.pct} />
      <span>{p.name}</span>
      <span className="mono">{p.pct}%</span>
    </Link>
  );

  return (
    <div className={open ? "app-shell nav-open" : "app-shell"}>
      <aside className="sidebar" aria-label="Foundry navigation">
        <div className="row between">
          <Brand href="/app" />
          <ThemeToggle compact />
        </div>
        <div className="stack gap-6">
          <Link href="/app/notebook?new=1" className="btn btn-primary btn-block">
            <Icon name="bolt" /> Capture an idea
          </Link>
          <Link href="/app/projects/new" className="btn btn-block">
            <Icon name="plus" /> New project
          </Link>
        </div>
        <nav className="side-nav" aria-label="Sections">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="side-link" aria-current={is(n.href, n.exact) ? "page" : undefined}>
              <Icon name={n.icon} /> {n.label}
              {typeof n.count === "number" ? <span className="count">{n.count}</span> : null}
            </Link>
          ))}
        </nav>
        <div className="stack gap-6">
          <div className="side-label">
            Projects <span className="mono">{active.length}</span>
          </div>
          <div className="side-projects">
            {active.length ? active.map(projectLink) : <p className="small muted" style={{ padding: "0 10px" }}>No projects yet.</p>}
          </div>
          {parked.length ? (
            <>
              <button className="side-label" style={{ border: 0, background: "none", cursor: "pointer", marginTop: 6 }} onClick={() => setShowParked((s) => !s)} aria-expanded={showParked}>
                Parked ({parked.length}) <Icon name={showParked ? "down" : "chevron"} />
              </button>
              {showParked ? <div className="side-projects">{parked.map(projectLink)}</div> : null}
            </>
          ) : null}
        </div>
        <div className="side-foot">
          <Link href="/app/settings" className="user-chip" aria-current={is("/app/settings") ? "page" : undefined}>
            <Avatar name={user.name} seed={user.id} size={34} />
            <span className="grow">
              <b>{user.name}</b>
              <small>@{user.handle}</small>
            </span>
            <Icon name="settings" />
          </Link>
          <form action={logoutAction}>
            <button className="side-link" style={{ border: 0, background: "none", width: "100%", cursor: "pointer" }}>
              <Icon name="logout" /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="nav-scrim" onClick={() => setOpen(false)} />
      <div className="app-main-wrap" style={{ minWidth: 0 }}>
        <div className="app-topbar">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <Brand href="/app" />
        </div>
        <main className="app-main">
          <div className="app-inner">{children}</div>
        </main>
        <nav className="tabbar" aria-label="Main">
          {[
            { href: "/app", label: "Home", icon: "home", exact: true },
            { href: "/app/notebook", label: "Notebook", icon: "book" },
          ].map((t) => (
            <Link key={t.href} href={t.href} className="tab" aria-current={is(t.href, t.exact) ? "page" : undefined}>
              <Icon name={t.icon} />
              <span>{t.label}</span>
            </Link>
          ))}
          <Link href="/app/notebook?new=1" className="tab tab-capture" aria-label="Capture an idea">
            <span className="tab-capture-dot">
              <Icon name="plus" />
            </span>
          </Link>
          <Link href="/community" className="tab" aria-current={is("/community") ? "page" : undefined}>
            <Icon name="users" />
            <span>Community</span>
          </Link>
          <button className="tab" onClick={() => setOpen(true)} aria-label="More: projects, Idea Database, settings">
            <Icon name="menu" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

function MiniRing({ pct }: { pct: number }) {
  const r = 8;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 22 22" width="18" height="18" aria-hidden="true" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="11" cy="11" r={r} fill="none" stroke="var(--track)" strokeWidth="3" />
      <circle cx="11" cy="11" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
    </svg>
  );
}
