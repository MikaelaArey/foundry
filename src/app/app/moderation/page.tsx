import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { REPORT_REASONS, type ReportReason } from "@/lib/constants";
import { isModerator } from "@/lib/moderation";
import { moderateAction } from "@/actions/community";
import { timeAgo } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { Empty } from "@/components/ui";

export const metadata = { title: "Moderation" };

export default async function ModerationPage() {
  const user = await requireUser("/app/moderation");
  if (!isModerator(user)) notFound();

  const reports = await db.report.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "asc" },
    include: {
      reporter: { select: { name: true, handle: true } },
      post: { select: { id: true, title: true, body: true, hidden: true, user: { select: { name: true, handle: true, bannedAt: true } } } },
      comment: {
        select: { id: true, body: true, hidden: true, postId: true, user: { select: { name: true, handle: true, bannedAt: true } } },
      },
    },
  });

  // One card per reported post or reply, oldest first.
  const groups = new Map<string, typeof reports>();
  for (const r of reports) {
    const key = r.postId ? `p:${r.postId}` : `c:${r.commentId}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const resolvedThisWeek = await db.report.count({ where: { status: { not: "open" }, createdAt: { gte: new Date(Date.now() - 7 * 864e5) } } });

  return (
    <>
      <header className="page-head">
        <div className="page-head-copy">
          <span className="eyebrow">Moderation</span>
          <h1 className="display-m">Reports to review</h1>
          <p className="lead">Review each report within 24 hours. Removing hides the content from everyone. Keeping it closes the reports and shows it again.</p>
        </div>
        <span className="chip">{resolvedThisWeek} resolved in the last 7 days</span>
      </header>

      {groups.size === 0 ? (
        <Empty icon="shield" title="Nothing to review">
          <span className="small">New reports show up here. Content reported by 3 different people is hidden automatically until you review it.</span>
        </Empty>
      ) : (
        <div className="stack gap-16">
          {[...groups.values()].map((list) => {
            const first = list[0];
            const target = first.post ?? first.comment;
            if (!target) return null;
            const author = target.user;
            const link = first.post ? `/community/${first.post.id}` : `/community/${first.comment!.postId}`;
            const reasons = list.reduce<Record<string, number>>((m, r) => ((m[r.reason] = (m[r.reason] ?? 0) + 1), m), {});
            return (
              <article key={first.id} className="card card-pad stack gap-12">
                <div className="row-wrap gap-6">
                  <span className="chip">{first.post ? "Post" : "Reply"}</span>
                  {Object.entries(reasons).map(([reason, n]) => (
                    <span key={reason} className="chip chip-bad">
                      {REPORT_REASONS[reason as ReportReason] ?? reason} × {n}
                    </span>
                  ))}
                  {target.hidden ? <span className="chip chip-amber">Hidden until reviewed</span> : null}
                  {author.bannedAt ? <span className="chip">Author banned</span> : null}
                  <span className="tiny muted" style={{ marginLeft: "auto" }}>
                    First reported {timeAgo(first.createdAt)}
                  </span>
                </div>
                <div className="stack gap-6" style={{ padding: "12px 14px", borderRadius: 12, background: "var(--surface-2)" }}>
                  {first.post ? <b>{first.post.title}</b> : null}
                  <p className="post-body post-excerpt">{target.body}</p>
                  <span className="tiny muted">
                    By {author.name} (@{author.handle}) ·{" "}
                    <Link className="link" href={link}>
                      Open in community
                    </Link>
                  </span>
                </div>
                {list.some((r) => r.details) ? (
                  <ul className="stack gap-4 small soft" style={{ margin: 0, paddingLeft: 18 }}>
                    {list
                      .filter((r) => r.details)
                      .map((r) => (
                        <li key={r.id}>
                          &ldquo;{r.details}&rdquo; ({r.reporter.name})
                        </li>
                      ))}
                  </ul>
                ) : null}
                <div className="row-wrap" style={{ justifyContent: "flex-end" }}>
                  <form action={moderateAction.bind(null, first.id, "dismiss")}>
                    <button className="btn btn-sm">
                      <Icon name="check" /> Keep it
                    </button>
                  </form>
                  <form action={moderateAction.bind(null, first.id, "remove")}>
                    <button className="btn btn-sm btn-danger">
                      <Icon name="trash" /> Remove
                    </button>
                  </form>
                  <form action={moderateAction.bind(null, first.id, "ban")}>
                    <button className="btn btn-sm btn-danger">
                      <Icon name="ban" /> Remove and ban author
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
