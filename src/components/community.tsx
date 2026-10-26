"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { addCommentAction, blockUserAction, createPostAction, reportContentAction, toggleVoteAction, type PostState } from "@/actions/community";
import { POST_KINDS, POST_KIND_KEYS, REPORT_REASONS, REPORT_REASON_KEYS, type PostKind, type ReportReason } from "@/lib/constants";
import { Icon } from "./icon";
import { toast } from "./toaster";

export function VoteButton({ postId, count, voted, signedIn }: { postId: string; count: number; voted: boolean; signedIn: boolean }) {
  const router = useRouter();
  const [state, setState] = useState({ count, voted });
  const [busy, setBusy] = useState(false);

  async function click() {
    if (!signedIn) return router.push(`/login?next=${encodeURIComponent("/community")}`);
    if (busy) return;
    const before = state;
    setState({ voted: !state.voted, count: state.count + (state.voted ? -1 : 1) });
    setBusy(true);
    try {
      setState(await toggleVoteAction(postId));
    } catch {
      setState(before);
      toast("Couldn't save your vote.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="vote">
      <button onClick={click} aria-pressed={state.voted} aria-label={state.voted ? "Remove upvote" : "Upvote"} title={state.voted ? "Remove upvote" : "Upvote"}>
        <Icon name="up" />
      </button>
      <b>{state.count}</b>
    </div>
  );
}

export function Composer({ open: startOpen, prefill }: { open: boolean; prefill: { kind: PostKind; title: string; body: string } }) {
  const [open, setOpen] = useState(startOpen);
  const [kind, setKind] = useState<PostKind>(prefill.kind);
  const [state, action, pending] = useActionState<PostState, FormData>(createPostAction, undefined);

  if (!open) {
    return (
      <button className="card composer row" style={{ cursor: "pointer", textAlign: "left", color: "var(--ink-3)", border: "1px solid var(--line)" }} onClick={() => setOpen(true)}>
        <Icon name="pencil" /> Ask a question, share an idea or post a win…
      </button>
    );
  }

  const placeholders: Record<PostKind, string> = {
    question: "What do you want to know? e.g. How did you get your first 10 customers?",
    idea: "What's the idea? e.g. Meal kits for night-shift nurses",
    win: "What happened? e.g. First paying customer today!",
    feedback: "What should people look at? e.g. Roast my landing page",
  };

  return (
    <form action={action} className="card composer">
      <input type="hidden" name="kind" value={kind} />
      <div className="seg" role="group" aria-label="Post type" style={{ justifySelf: "start", flexWrap: "wrap" }}>
        {POST_KIND_KEYS.map((k) => (
          <button type="button" key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>
            {POST_KINDS[k].label}
          </button>
        ))}
      </div>
      <input className="input" name="title" defaultValue={prefill.title} placeholder={placeholders[kind]} maxLength={160} required aria-label="Title" autoFocus />
      <textarea className="textarea" name="body" defaultValue={prefill.body} rows={5} placeholder="Add details so people can help. Links, numbers and context all help." maxLength={8000} required aria-label="Details" />
      <input className="input input-sm" name="tags" placeholder="Tags, separated by commas (optional)" aria-label="Tags" />
      {state?.error ? <p className="form-error">{state.error}</p> : null}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? <span className="spinner" /> : <Icon name="send" />} Post
        </button>
      </div>
    </form>
  );
}

export function CommentForm({ postId, signedIn }: { postId: string; signedIn: boolean }) {
  const [state, action, pending] = useActionState<PostState, FormData>(addCommentAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  if (!signedIn) {
    return (
      <div className="notice">
        <Icon name="message" />
        <span>
          <Link className="link" href={`/login?next=/community/${postId}`}>
            Log in
          </Link>{" "}
          or{" "}
          <Link className="link" href="/signup">
            create a free account
          </Link>{" "}
          to reply.
        </span>
      </div>
    );
  }
  return (
    <form ref={ref} action={action} className="stack gap-12">
      <input type="hidden" name="postId" value={postId} />
      <textarea className="textarea" name="body" rows={3} placeholder="Share what worked for you, or ask a follow-up question" maxLength={4000} required aria-label="Your reply" />
      {state?.error ? <p className="form-error">{state.error}</p> : null}
      <button className="btn btn-primary btn-sm" style={{ justifySelf: "end" }} disabled={pending}>
        {pending ? <span className="spinner" /> : <Icon name="send" />} Reply
      </button>
    </form>
  );
}

/**
 * The ⋯ menu on someone else's post or reply: report it, or block its author.
 * Apple requires both for apps with user-generated content.
 */
export function ContentMenu({
  target,
  authorId,
  authorName,
  signedIn,
}: {
  target: { postId: string } | { commentId: string };
  authorId: string;
  authorName: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<null | "menu" | "report" | "block" | "reported">(null);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kind = "postId" in target ? "post" : "reply";

  function open() {
    if (!signedIn) return router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
    setError(null);
    setMode(mode ? null : "menu");
  }

  async function report() {
    if (!reason) return setError("Pick a reason.");
    setBusy(true);
    const res = await reportContentAction({ ...target, reason, details }).catch(() => ({ error: "Couldn't send the report. Try again." }));
    setBusy(false);
    if ("error" in res && res.error) return setError(res.error);
    setMode("reported");
  }

  async function block() {
    setBusy(true);
    const res = await blockUserAction(authorId).catch(() => ({ error: "Couldn't block. Try again." }));
    setBusy(false);
    if ("error" in res && res.error) return setError(res.error);
    toast(`${authorName} is blocked. You won't see their posts or replies.`);
    setMode(null);
    router.refresh();
  }

  return (
    <div className="content-menu">
      <button className="icon-btn" onClick={open} aria-label={`More options for this ${kind}`} aria-expanded={mode === "menu"} title="More">
        <Icon name="more" />
      </button>
      {mode === "menu" ? (
        <div className="menu-pop" role="menu">
          <button role="menuitem" onClick={() => setMode("report")}>
            <Icon name="flag" /> Report this {kind}
          </button>
          <button role="menuitem" onClick={() => setMode("block")}>
            <Icon name="ban" /> Block {authorName}
          </button>
        </div>
      ) : null}
      {mode === "report" ? (
        <div className="safety-panel" role="dialog" aria-label={`Report this ${kind}`}>
          <b>Why are you reporting this {kind}?</b>
          <div className="stack gap-4">
            {REPORT_REASON_KEYS.map((k) => (
              <label key={k} className="check">
                <input type="radio" name={`reason-${"postId" in target ? target.postId : target.commentId}`} checked={reason === k} onChange={() => setReason(k)} />
                {REPORT_REASONS[k]}
              </label>
            ))}
          </div>
          <textarea className="textarea" rows={2} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder="Anything else we should know? (optional)" aria-label="Details" />
          {error ? <p className="form-error">{error}</p> : null}
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={report} disabled={busy}>
              {busy ? <span className="spinner" /> : <Icon name="flag" />} Send report
            </button>
          </div>
        </div>
      ) : null}
      {mode === "reported" ? (
        <div className="safety-panel" role="status">
          <b className="row gap-6">
            <Icon name="shield" /> Thanks. We&rsquo;ll review this within 24 hours.
          </b>
          <span className="small soft">Don&rsquo;t want to see {authorName}&rsquo;s posts at all?</span>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>
              Done
            </button>
            <button className="btn btn-sm" onClick={block} disabled={busy}>
              <Icon name="ban" /> Block {authorName}
            </button>
          </div>
        </div>
      ) : null}
      {mode === "block" ? (
        <div className="safety-panel" role="dialog" aria-label={`Block ${authorName}`}>
          <b>Block {authorName}?</b>
          <span className="small soft">You won&rsquo;t see their posts or replies anymore. You can unblock them in Settings.</span>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>
              Cancel
            </button>
            <button className="btn btn-danger btn-sm" onClick={block} disabled={busy}>
              {busy ? <span className="spinner" /> : <Icon name="ban" />} Block
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
