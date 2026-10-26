"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { SESSION_COOKIE, requireUser } from "@/lib/auth";

export type ProfileState = { error?: string; ok?: string } | undefined;

const ProfileInput = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(60),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{3,24}$/, "Handles use 3 to 24 lowercase letters, numbers or dashes."),
  bio: z.string().trim().max(280, "Keep your bio under 280 characters."),
});

export async function updateProfileAction(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await requireUser("/app/settings");
  const parsed = ProfileInput.safeParse({ name: form.get("name"), handle: form.get("handle"), bio: form.get("bio") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const taken = await db.user.findFirst({ where: { handle: parsed.data.handle, NOT: { id: user.id } }, select: { id: true } });
  if (taken) return { error: "That handle is taken. Try another." };
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/app", "layout");
  return { ok: "Profile saved." };
}

export async function disconnectGithubAction() {
  const user = await requireUser("/app/settings");
  await db.user.update({ where: { id: user.id }, data: { githubId: null, githubLogin: null, githubToken: null } });
  revalidatePath("/app", "layout");
}

/**
 * Permanently deletes the signed-in account and everything it owns: projects,
 * goals, ideas, posts, comments, votes, reports, blocks and sessions.
 */
export async function deleteAccountAction(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await requireUser("/app/settings");
  if (String(form.get("confirm") ?? "").trim() !== "DELETE") return { error: "Type DELETE in capital letters to confirm." };
  await db.user.delete({ where: { id: user.id } });
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login?notice=deleted");
}
