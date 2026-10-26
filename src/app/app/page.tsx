import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { blockedIdsFor } from "@/lib/blocks";
import { ideaOfTheDay } from "@/lib/idea-db";
import { POST_KINDS, type PostKind } from "@/lib/constants";
import { greeting, timeAgo } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { Avatar } from "@/components/ui";
import { Badges } from "@/components/idea";
import { ProjectCard } from "@/components/project-card";
import { NextUp, type NextUpItem } from "@/components/next-up";

export const metadata = { title: "Home" };

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default async function Dashboard() {
  const user = await requireUser("/app");
  const since = new Date(Date.now() - 60 * 864e5);
  const blocked = await blockedIdsFor(user.id);
  const [projects, ideaCount, recentIdeas, doneGoals, posts] = await Promise.all([
    db.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        sections: { orderBy: { position: "asc" }, include: { goals: { orderBy: { position: "asc" }, select: { id: true, text: true, done: true } } } },
        links: { orderBy: { position: "asc" } },
      },
    }),
    db.idea.count({ where: { userId: user.id } }),
    db.idea.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.goal.findMany({
      where: { done: true, doneAt: { gte: since }, section: { project: { userId: user.id } } },
      select: { doneAt: true },
    }),
    db.post.findMany({
      where: { hidden: false, ...(blocked.length ? { userId: { notIn: blocked } } : {}) },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { user: { select: { id: true, name: true } }, _count: { select: { comments: { where: { hidden: false } }, votes: true } } },
    }),
  ]);

  const active = projects.filter((p) => !p.parked);
  const parked = projects.filter((p) => p.parked);

  // Momentum: goals checked per day for the last 14 days, and the current streak.
  const perDay = new Map<string, number>();
  for (const g of doneGoals) if (g.doneAt) perDay.set(dayKey(g.doneAt), (perDay.get(dayKey(g.doneAt)) ?? 0) + 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return { d, n: perDay.get(dayKey(d)) ?? 0 };
  });
  const week = days.slice(-7).reduce((a, x) => a + x.n, 0);
  let streak = 0;
  const cursor = new Date(today);
  if (!perDay.get(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (perDay.get(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const max = Math.max(1, ...days.map((x) => x.n));
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Next up: the first open goal in each section, taking turns across projects.
  const perProject = active.map((p) =>
    p.sections
      .map((s) => ({ s, g: s.goals.find((g) => !g.done) }))
      .filter((x) => x.g)
      .map<NextUpItem>(({ s, g }) => ({ goalId: g!.id, text: g!.text, projectId: p.id, projectName: p.name, section: s.name, kind: s.kind })),
  );
  const nextUp: NextUpItem[] = [];
  for (let i = 0; nextUp.length < 6; i++) {
    let added = false;
    for (const list of perProject) {
      if (list[i] && nextUp.length < 6) {
        nextUp.push(list[i]);
        added = true;
      }
    }
    if (!added) break;
  }

  const iotd = ideaOfTheDay();
  const fresh = projects.length === 0 && ideaCount === 0;

  return (
    <>
      <header className="page-head">
        <div className="page-head-copy">
          <span className="eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          <h1 className="display-m">
            {greeting()}, <span className="grad italic">{user.name.split(" ")[0]}</span>.
          </h1>
        </div>
        <div className="row-wrap">
          <Link href="/app/notebook?new=1" className="btn">
            <Icon name="bolt" /> Capture an idea
          </Link>
          <Link href="/app/projects/new" className="btn btn-primary">
            <Icon name="plus" /> New project
          </Link>
        </div>
      </header>

      {fresh ? (
        <section className="cta-band" style={{ padding: "40px 28px", justifyItems: "stretch", textAlign: "left" }}>
          <div className="stack gap-6">
            <span className="eyebrow">Welcome to Foundry</span>
            <h2 className="display-m">Three steps to your first project</h2>
          </div>
          <div className="features">
            {[
              ["bolt", "", "Capture an idea", "Write down anything on your mind. Half-baked is fine.", "/app/notebook?new=1"],
              ["target", "good", "Study a validated idea", "See how the Idea Database scores ideas, with risks and the cheapest tests to run.", "/explore"],
              ["layers", "info", "Make it a project", "Pick sections like Coding and Marketing and check off small goals.", "/app/projects/new"],
            ].map(([icon, tone, title, text, href], i) => (
              <Link key={title} href={href} className="card card-hover feature">
                <span className={`feature-ic ${tone}`}>
                  <Icon name={icon} />
                </span>
                <h3>
                  {i + 1}. {title}
                </h3>
                <p>{text}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="kpis">
          {[
            ["layers", "Active projects", active.length, ""],
            ["check", "Goals done this week", week, ""],
            ["book", "Ideas in your notebook", ideaCount, ""],
            ["flame", "Day streak", streak, streak === 1 ? "day" : "days"],
          ].map(([icon, label, val, unit]) => (
            <div key={label as string} className="card kpi">
              <span className="kpi-label">
                <Icon name={icon as string} /> {label}
              </span>
              <span className="kpi-val">
                {val}
                {unit ? <small>{unit}</small> : null}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="dash-grid">
        <section className="stack gap-16" aria-labelledby="h-projects">
          <div className="panel-head">
            <h2 id="h-projects" className="title">
              Projects
            </h2>
            <span className="small muted">Overall progress gives every section equal weight</span>
          </div>
          <div className="proj-grid">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
            <Link href="/app/projects/new" className="new-card">
              <Icon name="plus" />
              <b>Start a project</b>
              <span>Unlimited projects. Park the ones you pause.</span>
            </Link>
          </div>
          {parked.length ? (
            <details>
              <summary className="small soft" style={{ cursor: "pointer", fontWeight: 550 }}>
                Parked projects ({parked.length})
              </summary>
              <div className="proj-grid" style={{ marginTop: 14 }}>
                {parked.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </details>
          ) : null}
        </section>

        <aside className="rail">
          <section className="panel iotd">
            <div className="panel-head">
              <span className="eyebrow">Idea of the day</span>
              <span className="chip">{iotd.category}</span>
            </div>
            <h3>{iotd.title}</h3>
            <Badges badges={iotd.report.badges.slice(0, 2)} />
            <Link href={`/explore/${iotd.slug}`} className="link small row gap-4">
              Read the report <Icon name="arrow" />
            </Link>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Next up</h2>
              <span className="tiny muted">First open goal per section</span>
            </div>
            <NextUp items={nextUp} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Momentum</h2>
              <span className="tiny muted">Goals checked per day</span>
            </div>
            <div className="momentum">
              <div className="mom-y" aria-hidden="true">
                <span>{max}</span>
                <span>0</span>
              </div>
              <div className="mom-plot">
                <div className="mom-bars">
                  {days.map((x, i) => {
                    const label = `${i === 13 ? "Today" : fmt(x.d)}: ${x.n} goal${x.n === 1 ? "" : "s"}`;
                    return (
                      <div key={i} className={i === 13 ? "mom-col today" : "mom-col"} tabIndex={0} role="img" aria-label={label}>
                        <i style={{ height: x.n ? `${Math.max(6, (x.n / max) * 100)}%` : 0 }} />
                        <span className="tip">{label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mom-x" aria-hidden="true">
                  <span>{fmt(days[0].d)}</span>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </section>

          {recentIdeas.length ? (
            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Fresh sparks</h2>
                <Link href="/app/notebook" className="link small">
                  Notebook
                </Link>
              </div>
              <div className="stack gap-6">
                {recentIdeas.map((i) => (
                  <Link key={i.id} href={`/app/notebook?id=${i.id}`} className="nb-item" style={{ ["--paper" as string]: `var(--n-${i.color})`, border: "1px solid var(--line)" }}>
                    <b>{i.title}</b>
                    <span className="nb-item-meta">{timeAgo(i.createdAt)}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {posts.length ? (
            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">From the community</h2>
                <Link href="/community" className="link small">
                  See all
                </Link>
              </div>
              <div className="stack gap-12">
                {posts.map((p) => {
                  const k = POST_KINDS[(p.kind as PostKind) in POST_KINDS ? (p.kind as PostKind) : "question"];
                  return (
                    <Link key={p.id} href={`/community/${p.id}`} className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                      <Avatar name={p.user.name} seed={p.user.id} size={28} />
                      <span className="stack gap-4 grow">
                        <b className="small" style={{ lineHeight: 1.35 }}>
                          {p.title}
                        </b>
                        <span className="tiny muted">
                          {k.label} · {p._count.votes} votes · {p._count.comments} replies
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
