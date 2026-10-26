import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { listRepos } from "@/lib/github";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!user.githubToken) return NextResponse.json({ error: "Connect GitHub in Settings first." }, { status: 400 });
  try {
    const repos = await listRepos(decrypt(user.githubToken));
    return NextResponse.json({ repos });
  } catch (e) {
    console.error("Listing GitHub repos failed", e);
    return NextResponse.json({ error: "GitHub didn't answer. Reconnect GitHub in Settings and try again." }, { status: 502 });
  }
}
