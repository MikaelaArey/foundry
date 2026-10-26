import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { blockedIdsFor } from "@/lib/blocks";
import { POST_KINDS, POST_KIND_KEYS, type PostKind } from "@/lib/constants";
import { splitTags, timeAgo } from "@/lib/utils";
import { Composer, ContentMenu, VoteButton } from "@/components/community";
import { Icon } from "@/components/icon";
import { Avatar } from "@/components/ui";

export const metadata = { title: "Community" };

type SP = { sort?: string; kind?: string; compose?: string; title?: string; body?: string };

export default async function CommunityPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const sort = sp.sort === "new" ? "new" : "top";
  const kind = POST_KIND_KEYS.includes(sp.kind as PostKind) ? (sp.kind as PostKind) : null;

  const blocked = await blockedIdsFor(user?.id);
  const posts = await db.post.findMany({
    where: { hidden: false, ...(kind ? { kind } : {}), ...(blocked.length ? { userId: { notIn: blocked } } : {}) },
    orderBy: sort === "top" ? [{ votes: { _count: "desc" } }, { createdAt: "desc" }] : { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true, handle: true } },
      _count: { select: { comments: { where: { hidden: false } }, votes: true } },
      votes: user ? { where: { userId: user.id }, select: { userId: true } } : false,
    },
  });
  const [memberCount, postCount] = await Promise.all([db.user.count(), db.post.count({ where: { hidden: false } })]);

  const qs = (patch: Partial<SP>) => {
    const p = new URLSearchParams();
    const merged = { sort, kind: kind ?? undefined, ...patch };
    if (merged.sort && merged.sort !== "top") p.set("sort", merged.sort);
    if (merged.kind) p.set("kind", merged.kind);
    const s = p.toString();
    return s ? `/community?${s}` : "/community";
  };
  const prefillKind = POST_KIND_KEYS.includes(sp.kind as PostKind) ? (sp.kind as PostKind) : "question";

  return (
    <>
      <header className="page-head">
        <div className="page-head-copy">
          <span className="eyebrow">Community</span>
          <h1 className="display-l">
            The founders&rsquo; <span className="grad italic">room</span>
          </h1>
          <p className="lead">Ask questions, share ideas, post wins and get honest feedback from people building alongside you.</p>
        </div>
      </header>

      <div className="feed-grid">
        <section className="feed" aria-label="Posts">
          {user ? (
            <Composer open={sp.compose === "1"} prefill={{ kind: prefillKind, title: (sp.title ?? "").slice(0, 160), body: (sp.body ?? "").slice(0, 8000) }} />
          ) : (
            <div className="card composer row between" style={{ flexWrap: "wrap" }}>
              <span className="soft">Join free to post, vote and reply.</span>
              <span className="row gap-6">
                <Link href="/login?next=/community" className="btn btn-sm">
                  Log in
                </Link>
                <Link href="/signup?next=/community" className="btn btn-primary btn-sm">
                  Join the community
                </Link>
              </span>
            </div>
          )}

          <div className="row-wrap between">
            <div className="seg" role="group" aria-label="Sort">
              <Link href={qs({ sort: "top" })} className="btn btn-ghost btn-sm" aria-current={sort === "top" ? "page" : undefined} style={sort === "top" ? { background: "var(--surface)", color: "var(--brand-text)", boxShadow: "var(--shadow-sm)" } : undefined}>
                <Icon name="flame" /> Top
              </Link>
              <Link href={qs({ sort: "new" })} className="btn btn-ghost btn-sm" aria-current={sort === "new" ? "page" : undefined} style={sort === "new" ? { background: "var(--surface)", color: "var(--brand-text)", boxShadow: "var(--shadow-sm)" } : undefined}>
                <Icon name="clock" /> New
              </Link>
            </div>
            <nav className="row-wrap gap-6" aria-label="Post types">
              <Link href={qs({ kind: undefined })} className="fchip" aria-current={!kind ? "page" : undefined}>
                All
              </Link>
              {POST_KIND_KEYS.map((k) => (
                <Link key={k} href={qs({ kind: k })} className="fchip" aria-current={kind === k ? "page" : undefined}>
                  {POST_KINDS[k].plural}
                </Link>
              ))}
            </nav>
          </div>

          {posts.length ? (
            posts.map((p) => {
              const k = POST_KINDS[(p.kind as PostKind) in POST_KINDS ? (p.kind as PostKind) : "question"];
              const tags = splitTags(p.tags);
              return (
                <article key={p.id} className="card post">
                  <VoteButton postId={p.id} count={p._count.votes} voted={Boolean(p.votes?.length)} signedIn={Boolean(user)} />
                  <div className="stack gap-8" style={{ gap: 8, minWidth: 0 }}>
                    <div className="row-wrap gap-6">
                      <span className={`chip ${k.chip}`}>
                        <Icon name={k.icon} /> {k.label}
                      </span>
                      {tags.slice(0, 3).map((t) => (
                        <span key={t} className="chip chip-outline">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <h3>
                      <Link href={`/community/${p.id}`}>{p.title}</Link>
                    </h3>
                    <p className="post-body post-excerpt">{p.body}</p>
                    <div className="post-meta">
                      <Avatar name={p.user.name} seed={p.user.id} size={22} />
                      <span style={{ color: "var(--ink-2)", fontWeight: 550 }}>{p.user.name}</span>
                      <span>@{p.user.handle}</span>
                      <span>· {timeAgo(p.createdAt)}</span>
                      <Link href={`/community/${p.id}`} className="row gap-4" style={{ marginLeft: "auto" }}>
                        <Icon name="message" /> {p._count.comments} {p._count.comments === 1 ? "reply" : "replies"}
                      </Link>
                      {p.user.id !== user?.id ? <ContentMenu target={{ postId: p.id }} authorId={p.user.id} authorName={p.user.name} signedIn={Boolean(user)} /> : null}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty">
              <Icon name="message" />
              <b>No posts here yet</b>
              <span className="small">Be the first to start a conversation.</span>
            </div>
          )}
        </section>

        <aside className="rail">
          <section className="panel iotd">
            <span className="eyebrow">About</span>
            <p className="soft small">
              A room for entrepreneurs of every kind: solo founders, students, side-projecters and teams. Be generous with what you know and honest with feedback.
            </p>
            <div className="row-wrap" style={{ gap: 20 }}>
              <span className="stack">
                <b className="mono" style={{ fontSize: 22 }}>
                  {memberCount}
                </b>
                <span className="tiny muted">members</span>
              </span>
              <span className="stack">
                <b className="mono" style={{ fontSize: 22 }}>
                  {postCount}
                </b>
                <span className="tiny muted">posts</span>
              </span>
            </div>
          </section>
          <section className="panel">
            <h2 className="panel-title">Post types</h2>
            <div className="stack gap-12">
              {POST_KIND_KEYS.map((key) => {
                const k = POST_KINDS[key];
                const text = {
                  question: "Stuck on something? Ask the room.",
                  idea: "Share an idea and see if it resonates.",
                  win: "Celebrate progress, big or small.",
                  feedback: "Get honest eyes on your work.",
                }[key];
                return (
                  <div key={key} className="row" style={{ alignItems: "flex-start" }}>
                    <span className={`chip ${k.chip}`}>
                      <Icon name={k.icon} /> {k.label}
                    </span>
                    <span className="small soft">{text}</span>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="panel">
            <h2 className="panel-title">House rules</h2>
            <ul className="check-list small">
              {["Be kind and specific.", "Share what worked, not just opinions.", "No spam or cold pitches.", "Credit other people's ideas."].map((r) => (
                <li key={r} style={{ fontSize: 14 }}>
                  <Icon name="check" /> {r}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
