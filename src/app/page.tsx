import Link from "next/link";
import { db } from "@/lib/db";
import { IDEAS, ideaOfTheDay } from "@/lib/idea-db";
import { POST_KINDS, type PostKind } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { Avatar, Ring } from "@/components/ui";
import { Badges, IdeaCard, ScoreTiles } from "@/components/idea";
import { AppStoreBadge, SiteFooter, SiteHeader } from "@/components/site-chrome";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: "book", tone: "", title: "A notebook for every spark", text: "Capture ideas in seconds, color and tag them, rate how excited you are, and find them again instantly." },
  { icon: "target", tone: "good", title: "Validation reports", text: "Browse ideas scored on opportunity, problem, feasibility and timing, with an offer ladder and the cheapest tests to run first." },
  { icon: "flame", tone: "warm", title: "Momentum you can see", text: "“Next up” shows the next small goal in every project, and your streak keeps you making progress every day." },
  { icon: "layers", tone: "info", title: "Projects with sections", text: "Split each project into Coding, Marketing, Finance and more. Every section gets its own goals and progress bar." },
  { icon: "rocket", tone: "amber", title: "One-click Launchpad", text: "Connect GitHub, VS Code, Claude, ChatGPT and Gemini to a project and jump straight to where the work lives." },
  { icon: "users", tone: "bad", title: "A room full of founders", text: "Ask questions, share ideas, post wins and get feedback from people building alongside you." },
];

export default async function Home() {
  const iotd = ideaOfTheDay();
  const posts = await db.post.findMany({
    where: { hidden: false },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { user: { select: { id: true, name: true, handle: true } }, _count: { select: { comments: { where: { hidden: false } }, votes: true } } },
  });
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

  return (
    <>
      <SiteHeader />
      <main>
        {/* ------------------------------------------------------------ hero */}
        <section className="hero container">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="pill">
                <b>New</b> The Idea Database, with full validation reports
              </span>
              <h1 className="display-xl">
                Where ideas become <span className="grad italic">companies</span>.
              </h1>
              <p className="lead">
                Foundry is a think tank for entrepreneurs. Capture ideas the moment they hit, check them against a real validation framework, and run
                every project with a progress bar for each part of the business.
              </p>
              <div className="hero-cta">
                <Link href="/signup" className="btn btn-primary btn-lg">
                  Start free <Icon name="arrow" />
                </Link>
                <Link href="/explore" className="btn btn-lg">
                  Browse the Idea Database
                </Link>
              </div>
              <div className="hero-foot">
                <AppStoreBadge />
                <p className="small muted">Free for founders. No credit card.</p>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="mock mock-project float">
                <div className="row between">
                  <div className="stack gap-6">
                    <span className="chip chip-brand" style={{ alignSelf: "flex-start" }}>
                      Validate stage
                    </span>
                    <span className="serif" style={{ fontSize: 28, lineHeight: 1.05 }}>
                      Corner Cup coffee
                    </span>
                    <span className="small soft">Fresh local beans, delivered every two weeks.</span>
                  </div>
                  <Ring pct={45} large />
                </div>
                <ul className="bars" style={{ marginTop: 16 }}>
                  {[
                    ["marketing", "Marketing", 60],
                    ["operations", "Operations", 50],
                    ["finance", "Finance", 25],
                  ].map(([k, label, pct]) => (
                    <li key={k as string} className={`k-${k}`}>
                      <span>
                        <span className="dot" /> {label}
                      </span>
                      <span className="bar">
                        <i style={{ width: `${pct}%` }} />
                      </span>
                      <span className="mono">{pct}%</span>
                    </li>
                  ))}
                </ul>
                <div className="row" style={{ marginTop: 16, gap: 6 }}>
                  {["branch", "code", "spark", "chat", "star"].map((i) => (
                    <span key={i} className="mini-tool">
                      <Icon name={i} />
                    </span>
                  ))}
                  <span className="tiny muted" style={{ marginLeft: 6 }}>
                    Launchpad
                  </span>
                </div>
              </div>
              <div className="mock mock-note float float-2">
                <div className="row between">
                  <span className="row gap-4" style={{ color: "var(--warm)" }}>
                    <Icon name="bolt" filled />
                    <Icon name="bolt" filled />
                    <Icon name="bolt" filled />
                  </span>
                  <span className="tiny muted">2m ago</span>
                </div>
                <p className="serif" style={{ fontSize: 23, lineHeight: 1.1, marginTop: 8 }}>
                  Meal kits for night-shift nurses
                </p>
                <p className="small soft" style={{ marginTop: 6 }}>
                  Meals timed for a 7pm to 7am body clock.
                </p>
                <div className="row-wrap gap-4" style={{ marginTop: 10 }}>
                  <span className="chip">#food</span>
                  <span className="chip">#health</span>
                </div>
              </div>
              <div className="mock mock-scores float">
                <ScoreTiles report={iotd.report} />
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- idea of the day */}
        <section className="section container">
          <div className="section-head">
            <span className="eyebrow">Idea of the day · {today}</span>
            <h2 className="display-l grad">Today&rsquo;s free idea</h2>
            <p className="lead">A fresh business idea with a full validation report, every day.</p>
          </div>
          <div className="card card-pad" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28, padding: 28 }}>
            <div className="stack gap-16">
              <div className="row-wrap gap-6">
                <span className="chip">{iotd.category}</span>
                <span className="chip chip-outline">{iotd.market} market</span>
              </div>
              <h3 className="display-m">{iotd.title}</h3>
              <Badges badges={iotd.report.badges} />
              <p className="soft" style={{ fontSize: 16, lineHeight: 1.7 }}>
                {iotd.report.summary.split(/\n\s*\n/)[0]}
              </p>
              <div className="row-wrap">
                <Link href={`/explore/${iotd.slug}`} className="btn btn-primary">
                  Read the full report <Icon name="arrow" />
                </Link>
                <Link href="/explore" className="btn btn-ghost">
                  See all ideas
                </Link>
              </div>
            </div>
            <div className="stack gap-12" style={{ alignSelf: "center" }}>
              <ScoreTiles report={iotd.report} />
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- features */}
        <section className="section container">
          <div className="section-head">
            <span className="eyebrow">Everything in one place</span>
            <h2 className="display-l">From scribble to shipped.</h2>
          </div>
          <div className="features">
            {FEATURES.map((f) => (
              <div key={f.title} className="card feature">
                <span className={`feature-ic ${f.tone}`}>
                  <Icon name={f.icon} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------- idea database */}
        <section className="section container">
          <div className="section-head">
            <h2 className="display-l grad">The Idea Database</h2>
            <p className="lead">Deep reports on ideas worth building. Save one to your notebook or turn it into a project in one click.</p>
          </div>
          <div className="idea-grid">
            {IDEAS.slice(0, 3).map((i) => (
              <IdeaCard key={i.slug} idea={i} />
            ))}
          </div>
          <div className="row" style={{ justifyContent: "center", marginTop: 28 }}>
            <Link href="/explore" className="btn btn-primary">
              Browse all ideas <Icon name="arrow" />
            </Link>
          </div>
        </section>

        {/* -------------------------------------------------------- community */}
        {posts.length ? (
          <section className="section container">
            <div className="section-head">
              <span className="eyebrow">Community</span>
              <h2 className="display-l">You don&rsquo;t have to build alone.</h2>
              <p className="lead">Ask questions, share ideas and celebrate wins with other founders.</p>
            </div>
            <div className="idea-grid">
              {posts.map((p) => {
                const k = POST_KINDS[(p.kind as PostKind) in POST_KINDS ? (p.kind as PostKind) : "question"];
                return (
                  <Link key={p.id} href={`/community/${p.id}`} className="card card-hover card-pad stack gap-12">
                    <span className={`chip ${k.chip}`} style={{ alignSelf: "flex-start" }}>
                      <Icon name={k.icon} /> {k.label}
                    </span>
                    <b style={{ fontSize: 16, lineHeight: 1.35 }}>{p.title}</b>
                    <div className="post-meta" style={{ marginTop: "auto" }}>
                      <Avatar name={p.user.name} seed={p.user.id} size={24} />
                      <span>{p.user.name}</span>
                      <span>· {timeAgo(p.createdAt)}</span>
                      <span style={{ marginLeft: "auto" }} className="row gap-4">
                        <Icon name="up" /> {p._count.votes}
                      </span>
                      <span className="row gap-4">
                        <Icon name="message" /> {p._count.comments}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* ------------------------------------------------------------- CTA */}
        <section className="section container">
          <div className="cta-band">
            <h2 className="display-l">
              Your next company starts as a <span className="grad italic">note</span>.
            </h2>
            <p className="lead" style={{ textAlign: "center" }}>
              Unlimited projects, ideas and validation. Free while Foundry is in beta.
            </p>
            <Link href="/signup" className="btn btn-primary btn-lg">
              Create your free account <Icon name="arrow" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
