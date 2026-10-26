"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, safeNext, signIn, signOut, uniqueHandle, verifyPassword } from "@/lib/auth";
import { allow } from "@/lib/ratelimit";

export type FormState = { error?: string; ok?: string } | undefined;

const SignupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  password: z.string().min(8, "Use at least 8 characters for your password.").max(200),
});

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function signupAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = SignupSchema.safeParse({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  if (form.get("agree") !== "on") return { error: "Please agree to the Terms of Use and Privacy Policy to create an account." };
  if (!allow(`signup:${await clientKey()}`, 10, 60 * 60 * 1000)) return { error: "Too many sign-ups from this network. Try again later." };

  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { error: "An account with that email already exists. Log in instead." };

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      handle: await uniqueHandle(name || email.split("@")[0]),
      termsAcceptedAt: new Date(),
    },
  });
  await signIn(user.id);
  redirect(safeNext(form.get("next"), "/app?welcome=1"));
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  if (!allow(`login:${email}`, 8, 15 * 60 * 1000) || !allow(`login-ip:${await clientKey()}`, 30, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Wait 15 minutes and try again." };
  }
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: user && !user.passwordHash ? "This account signs in with GitHub. Use the GitHub button." : "That email and password don't match." };
  }
  await signIn(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logoutAction() {
  await signOut();
  redirect("/");
}
