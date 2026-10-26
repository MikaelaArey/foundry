"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { POST_KIND_KEYS } from "@/lib/constants";
import { REPORT_REASON_KEYS } from "@/lib/constants";
import { AUTO_HIDE_AFTER, checkContent, isModerator } from "@/lib/moderation";
import { allow } from "@/lib/ratelimit";
import { parseTags, tagsToString } from "@/lib/utils";

export type PostState = { error?: string; ok?: boolean } | undefined;

const BANNED = "Your account can't post in the community right now. Contact support if you think this is a mistake.";

const PostInput = z.object({
  kind: z.enum(POST_KIND_KEYS as [string, ...string[]]),
  title: z.string().trim().min(4, "Give your post a title of at least 4 characters.").max(160),
  body: z.string().trim().min(1, "Add a few sentences so people can help.").max(8000),
});

export async function createPostAction(_prev: PostState, form: FormData): Promise<PostState> {
  const user = await requireUser("/community");
  if (user.bannedAt) return { error: BANNED };
  const parsed = PostInput.safeParse({ kind: form.get("kind"), title: form.get("title"), body: form.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const tags = String(form.get("tags") ?? "");
  const blocked = checkContent(parsed.data.title, parsed.data.body, tags);
  if (blocked) return { error: blocked };
  if (!allow(`post:${user.id}`, 10, 60 * 60 * 1000)) return { error: "You've posted a lot this hour. Take a breather and try again later." };
  const post = await db.post.create({
    data: { userId: user.id, ...parsed.data, tags: tagsToString(parseTags(tags)) },
  });
  revalidatePath("/community");
  redirect(`/community/${post.id}`);
}

export async function toggleVoteAction(postId: string): Promise<{ voted: boolean; count: number }> {
  const user = await requireUser("/community");
  const key = { userId_postId: { userId: user.id, postId } };
  const existing = await db.vote.findUnique({ where: key });
  if (existing) await db.vote.delete({ where: key });
  else {
    const post = await db.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (post) await db.vote.create({ data: { userId: user.id, postId } });
  }
  const count = await db.vote.count({ where: { postId } });
  revalidatePath("/community");
  return { voted: !existing, count };
}

export async function addCommentAction(_prev: PostState, form: FormData): Promise<PostState> {
  const postId = String(form.get("postId") ?? "");
  const user = await requireUser(`/community/${postId}`);
  if (user.bannedAt) return { error: BANNED };
  const body = String(form.get("body") ?? "").trim().slice(0, 4000);
  if (!body) return { error: "Write a comment first." };
  const blocked = checkContent(body);
  if (blocked) return { error: blocked };
  if (!allow(`comment:${user.id}`, 40, 60 * 60 * 1000)) return { error: "You've commented a lot this hour. Try again later." };
  const post = await db.post.findFirst({ where: { id: postId, hidden: false }, select: { id: true } });
  if (!post) return { error: "That post no longer exists." };
  await db.comment.create({ data: { postId, userId: user.id, body } });
  revalidatePath(`/community/${postId}`);
  return { ok: true };
}

export async function deletePostAction(postId: string) {
  const user = await requireUser("/community");
  await db.post.deleteMany({ where: { id: postId, userId: user.id } });
  revalidatePath("/community");
  redirect("/community");
}

export async function deleteCommentAction(commentId: string) {
  const user = await requireUser("/community");
  const c = await db.comment.findFirst({ where: { id: commentId, userId: user.id }, select: { postId: true } });
  if (!c) return;
  await db.comment.delete({ where: { id: commentId } });
  revalidatePath(`/community/${c.postId}`);
}

/* ------------------------------------------------------------ safety */

const ReportInput = z.object({
  postId: z.string().optional(),
  commentId: z.string().optional(),
  reason: z.enum(REPORT_REASON_KEYS as [string, ...string[]]),
  details: z.string().max(1000).optional(),
});

/** Files a report. Content reported by several different people is hidden until a moderator reviews it. */
export async function reportContentAction(input: z.infer<typeof ReportInput>): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser("/community");
  const parsed = ReportInput.safeParse(input);
  if (!parsed.success || (!parsed.data.postId && !parsed.data.commentId)) return { error: "Pick a reason for the report." };
  if (!allow(`report:${user.id}`, 30, 60 * 60 * 1000)) return { error: "You've sent a lot of reports this hour. Try again later." };
  const { postId, commentId, reason, details } = parsed.data;

  const target = postId
    ? await db.post.findUnique({ where: { id: postId }, select: { id: true, userId: true } })
    : await db.comment.findUnique({ where: { id: commentId! }, select: { id: true, userId: true, postId: true } });
  if (!target) return { error: "That content no longer exists." };
  if (target.userId === user.id) return { error: "You can't report your own content. Delete it instead." };

  const where = postId ? { postId, reporterId: user.id } : { commentId, reporterId: user.id };
  const already = await db.report.findFirst({ where: { ...where, status: "open" }, select: { id: true } });
  if (!already) {
    await db.report.create({ data: { reporterId: user.id, postId: postId ?? null, commentId: commentId ?? null, reason, details: (details ?? "").trim() } });
  }
  const reporters = await db.report.groupBy({ by: ["reporterId"], where: postId ? { postId, status: "open" } : { commentId, status: "open" } });
  if (reporters.length >= AUTO_HIDE_AFTER) {
    if (postId) await db.post.update({ where: { id: postId }, data: { hidden: true } });
    else await db.comment.update({ where: { id: commentId! }, data: { hidden: true } });
  }
  revalidatePath("/community", "layout");
  return { ok: true };
}

export async function blockUserAction(userId: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser("/community");
  if (userId === user.id) return { error: "You can't block yourself." };
  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return { error: "That person no longer exists." };
  await db.block.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: userId } },
    create: { blockerId: user.id, blockedId: userId },
    update: {},
  });
  revalidatePath("/community", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function unblockUserAction(userId: string) {
  const user = await requireUser("/app/settings");
  await db.block.deleteMany({ where: { blockerId: user.id, blockedId: userId } });
  revalidatePath("/community", "layout");
  revalidatePath("/app", "layout");
}

/* ------------------------------------------------------------ moderators */

/**
 * Moderator decision on a report:
 * - remove: hide the content and close every open report about it
 * - dismiss: keep the content (un-hiding it if reports hid it) and close the reports
 * - ban: remove the content and stop the author from posting
 */
export async function moderateAction(reportId: string, decision: "remove" | "dismiss" | "ban") {
  const user = await requireUser("/app/moderation");
  if (!isModerator(user)) throw new Error("Not allowed");
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { post: { select: { id: true, userId: true } }, comment: { select: { id: true, userId: true } } },
  });
  if (!report) return;
  const target = report.post ? { postId: report.post.id } : report.comment ? { commentId: report.comment.id } : null;
  if (!target) {
    await db.report.update({ where: { id: reportId }, data: { status: "dismissed" } });
  } else {
    const hidden = decision !== "dismiss";
    if (report.post) await db.post.update({ where: { id: report.post.id }, data: { hidden } });
    if (report.comment) await db.comment.update({ where: { id: report.comment.id }, data: { hidden } });
    await db.report.updateMany({ where: { ...target, status: "open" }, data: { status: hidden ? "removed" : "dismissed" } });
    const authorId = report.post?.userId ?? report.comment?.userId;
    if (decision === "ban" && authorId && authorId !== user.id) {
      await db.user.update({ where: { id: authorId }, data: { bannedAt: new Date() } });
    }
  }
  revalidatePath("/app/moderation");
  revalidatePath("/community", "layout");
}
