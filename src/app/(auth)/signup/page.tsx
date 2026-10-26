import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { githubConfigured } from "@/lib/github";
import { isNativeApp } from "@/lib/config";

export const metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "");
  if (await getCurrentUser()) redirect(next || "/app");
  const github = githubConfigured() && !(await isNativeApp());
  return <AuthForm mode="signup" next={next} github={github} demo={false} />;
}
