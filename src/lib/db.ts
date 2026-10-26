import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Connection poolers (like Neon's "-pooler" address) can't keep prepared
 * statements between requests, so Prisma needs pgbouncer=true there.
 * Adding it here means the address can be pasted in exactly as Neon gives it.
 */
function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || !/-pooler\./.test(url) || /[?&]pgbouncer=/.test(url)) return undefined;
  return url + (url.includes("?") ? "&" : "?") + "pgbouncer=true";
}

const url = databaseUrl();
export const db = globalForPrisma.prisma ?? new PrismaClient(url ? { datasourceUrl: url } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
