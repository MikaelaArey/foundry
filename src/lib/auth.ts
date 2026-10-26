import crypto from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { randomToken, sha256 } from "./crypto";
import { slugify } from "./utils";

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "foundry_session";
const SESSION_DAYS = 30;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false;
  const [algo, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64url"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

/** Creates a session row and returns the raw token for the cookie. */
export async function createSession(userId: string) {
  const token = randomToken();
  await db.session.create({
    data: { id: sha256(token), userId, expiresAt: new Date(Date.now() + SESSION_DAYS * 864e5) },
  });
  return token;
}

/** For server actions: creates a session and sets the cookie. */
export async function signIn(userId: string) {
  const token = await createSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { id: sha256(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

/** The fields that are safe to send to the browser. */
export type PublicUser = { id: string; name: string; handle: string; email: string; bio: string; githubLogin: string | null };
export const toPublicUser = (u: { id: string; name: string; handle: string; email: string; bio: string; githubLogin: string | null }): PublicUser => ({
  id: u.id,
  name: u.name,
  handle: u.handle,
  email: u.email,
  bio: u.bio,
  githubLogin: u.githubLogin,
});

export async function uniqueHandle(base: string) {
  const root = slugify(base) || "founder";
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? root : `${root}-${crypto.randomInt(10, 9999)}`;
    const taken = await db.user.findUnique({ where: { handle: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${root}-${randomToken(4).toLowerCase()}`;
}

/** Only allow same-site relative redirects after sign-in. */
export function safeNext(next: unknown, fallback = "/app") {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : fallback;
}
