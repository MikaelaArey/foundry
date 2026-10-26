import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSession, getCurrentUser, safeNext, sessionCookieOptions, uniqueHandle } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { exchangeCode, getGithubProfile } from "@/lib/github";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get("gh_state")?.value;
  const next = safeNext(req.cookies.get("gh_next")?.value, "");

  const go = (path: string) => {
    const res = NextResponse.redirect(new URL(path, req.url));
    res.cookies.delete("gh_state");
    res.cookies.delete("gh_next");
    return res;
  };

  if (!code || !state || !expected || state !== expected) return go("/login?error=github");

  try {
    const token = await exchangeCode(code);
    const profile = await getGithubProfile(token);
    const githubData = { githubId: profile.id, githubLogin: profile.login, githubToken: encrypt(token) };

    // Already signed in: connect GitHub to this account.
    const current = await getCurrentUser();
    if (current) {
      const other = await db.user.findUnique({ where: { githubId: profile.id }, select: { id: true } });
      if (other && other.id !== current.id) return go("/app/settings?github=taken");
      await db.user.update({ where: { id: current.id }, data: githubData });
      return go(next || "/app/settings?github=connected");
    }

    // Signing in: find by GitHub account, then by verified email, else create.
    let user = await db.user.findUnique({ where: { githubId: profile.id } });
    if (user) {
      await db.user.update({ where: { id: user.id }, data: githubData });
    } else {
      if (!profile.email) return go("/login?error=github_email");
      const byEmail = await db.user.findUnique({ where: { email: profile.email } });
      user = byEmail
        ? await db.user.update({ where: { id: byEmail.id }, data: githubData })
        : await db.user.create({
            data: { email: profile.email, name: profile.name, handle: await uniqueHandle(profile.login), termsAcceptedAt: new Date(), ...githubData },
          });
    }

    const sessionToken = await createSession(user.id);
    const res = go(next || "/app");
    res.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions);
    return res;
  } catch (e) {
    console.error("GitHub sign-in failed", e);
    return go("/login?error=github");
  }
}
