import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { blockedIdsFor } from "@/lib/blocks";
import { isModerator } from "@/lib/moderation";
import { deleteCommentAction, deletePostAction } from "@/actions/community";
import { POST_KINDS, type PostKind } from "@/lib/constants";
import { splitTags, timeAgo } from "@/lib/utils";
import { CommentForm, ContentMenu, VoteButton } from "@/components/community";
import { Icon } from "@/components/icon";
import { Avatar } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id }, select: { title: true } });
  return { title: post?.title ?? "Post" };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const blocked = await blockedIdsFor(user?.id);
  const post = await db.post.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, handle: true, bio: true } },
      comments: {
        where: { hidden: false, ...(blocked.length ? { userId: { notIn: blocked } } : {}) },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, handle: true } } },
      },
      _count: { select: { votes: true } },
      votes: user ? { where: { userId: user.id }, select: { userId: true } } : false,
    },
  });
  if (!post) notFound();
  const unavailable = post.hidden && !isModerator(user)
    ? "This post was removed because it broke the community rules."
    : blocked.includes(post.user.id)
      ? `You blocked ${post.user.name}, so their posts are hidden. You can unblock them in Settings.`
      : null;
  if (unavailable) {
    return (
      <div className="empty" style={{ marginTop: 24 }}>
        <Icon name="shield" />
        <b>{unavailable}</b>
        <Link href="/community" className="btn btn-sm">
          <Icon name="back" /> Back to the community
        </Link>
      </div>
    );
  }
  const k = POST_KINDS[(post.kind as PostKind) in POST_KINDS ? (post.kind as PostKind) : "question"];

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/community">Community</Link>
        <span aria-hidden="true">/</span>
        <span>{k.label}</span>
      </nav>
      <div className="feed-grid">
        <div className="stack gap-20">
          <article className="card post" style={{ padding: 24 }}>
            <VoteButton postId={post.id} count={post._count.votes} voted={Boolean(post.votes?.length)} signedIn={Boolean(user)} />
            <div className="stack gap-16" style={{ minWidth: 0 }}>
              <div className="row-wrap gap-6">
                <span className={`chip ${k.chip}`}>
                  <Icon name={k.icon} /> {k.label}
                </span>
                {splitTags(post.tags).map((t) => (
                  <span key={t} className="chip chip-outline">
                    #{t}
                  </span>
                ))}
              </div>
              <h1 className="title">{post.title}</h1>
              <div className="post-meta">
                <Avatar name={post.user.name} seed={post.user.id} size={26} />
                <span style={{ color: "var(--ink-2)", fontWeight: 550 }}>{post.user.name}</span>
                <span>@{post.user.handle}</span>
                <span>· {timeAgo(post.createdAt)}</span>
                {post.hidden ? <span className="chip chip-bad">Hidden from the community</span> : null}
                {user?.id !== post.user.id ? (
                  <span style={{ marginLeft: "auto" }}>
                    <ContentMenu target={{ postId: post.id }} authorId={post.user.id} authorName={post.user.name} signedIn={Boolean(user)} />
                  </span>
                ) : null}
              </div>
              <p className="post-body" style={{ fontSize: 16, lineHeight: 1.7 }}>
                {post.body}
              </p>
              {user?.id === post.user.id ? (
                <form action={deletePostAction.bind(null, post.id)}>
                  <button className="btn btn-ghost btn-sm">
                    <Icon name="trash" /> Delete post
                  </button>
                </form>
              ) : null}
            </div>
          </article>

          <section className="card card-pad stack" aria-labelledby="h-replies">
            <h2 id="h-replies" className="panel-title" style={{ marginBottom: 8 }}>
              {post.comments.length} {post.comments.length === 1 ? "reply" : "replies"}
            </h2>
            {post.comments.map((c) => (
              <div key={c.id} className="comment">
                <Avatar name={c.user.name} seed={c.user.id} size={32} />
                <div className="stack gap-6" style={{ minWidth: 0 }}>
                  <div className="post-meta">
                    <span style={{ color: "var(--ink)", fontWeight: 550 }}>{c.user.name}</span>
                    <span>@{c.user.handle}</span>
                    <span>· {timeAgo(c.createdAt)}</span>
                    {user?.id === c.user.id ? (
                      <form action={deleteCommentAction.bind(null, c.id)} style={{ marginLeft: "auto" }}>
                        <button className="icon-btn" aria-label="Delete reply" title="Delete reply">
                          <Icon name="trash" />
                        </button>
                      </form>
                    ) : (
                      <span style={{ marginLeft: "auto" }}>
                        <ContentMenu target={{ commentId: c.id }} authorId={c.user.id} authorName={c.user.name} signedIn={Boolean(user)} />
                      </span>
                    )}
                  </div>
                  <p className="post-body">{c.body}</p>
                </div>
              </div>
            ))}
            <div style={{ paddingTop: 16, borderTop: post.comments.length ? "1px solid var(--line)" : 0 }}>
              <CommentForm postId={post.id} signedIn={Boolean(user)} />
            </div>
          </section>
        </div>

        <aside className="rail">
          <section className="panel">
            <span className="eyebrow">Posted by</span>
            <div className="row">
              <Avatar name={post.user.name} seed={post.user.id} size={40} />
              <span className="stack">
                <b>{post.user.name}</b>
                <span className="small muted">@{post.user.handle}</span>
              </span>
            </div>
            {post.user.bio ? <p className="small soft">{post.user.bio}</p> : null}
          </section>
          <Link href="/community" className="btn">
            <Icon name="back" /> Back to the community
          </Link>
        </aside>
      </div>
    </>
  );
}
