import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { randomToken } from "@/lib/crypto";
import { authorizeUrl, githubConfigured } from "@/lib/github";

const tmpCookie = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 };

export async function GET(req: NextRequest) {
  if (!githubConfigured()) return NextResponse.redirect(new URL("/login?error=github_off", req.url));
  const state = randomToken(16);
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set("gh_state", state, tmpCookie);
  res.cookies.set("gh_next", safeNext(req.nextUrl.searchParams.get("next"), ""), tmpCookie);
  return res;
}
