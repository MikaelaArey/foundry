import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSession, safeNext, sessionCookieOptions } from "@/lib/auth";

// Local development only: signs in as the seeded demo account.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.DEV_DEMO_LOGIN !== "1") {
    return new NextResponse("Not found", { status: 404 });
  }
  const user = await db.user.findUnique({ where: { email: "demo@foundry.local" }, select: { id: true } });
  if (!user) return new NextResponse("No demo account yet. Run `npm run setup` to create it.", { status: 404 });
  const token = await createSession(user.id);
  const res = NextResponse.redirect(new URL(safeNext(req.nextUrl.searchParams.get("next")), req.url));
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
