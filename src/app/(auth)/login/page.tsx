import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { githubConfigured } from "@/lib/github";
import { isNativeApp } from "@/lib/config";

export const metadata = { title: "Log in" };

const ERRORS: Record<string, string> = {
  github: "GitHub sign-in didn't finish. Please try again.",
  github_email: "Your GitHub account has no verified email. Add one on GitHub, or sign up with email.",
  github_off: "GitHub sign-in isn't set up on this server yet.",
};

const NOTICES: Record<string, string> = {
  deleted: "Your account and everything in it were deleted.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; notice?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "");
  if (await getCurrentUser()) redirect(next || "/app");
  const demo = process.env.NODE_ENV !== "production" && process.env.DEV_DEMO_LOGIN === "1";
  // Inside the iPhone app, only email sign-in is offered (Apple requires Sign in with Apple alongside other sign-in services).
  const github = githubConfigured() && !(await isNativeApp());
  return (
    <AuthForm
      mode="login"
      next={next}
      github={github}
      demo={demo}
      error={sp.error ? ERRORS[sp.error] : undefined}
      notice={sp.notice ? NOTICES[sp.notice] : undefined}
    />
  );
}
