import { db } from "./db";

/** Ids of the people this viewer has blocked, for filtering feeds. Server-only. */
export async function blockedIdsFor(userId: string | null | undefined): Promise<string[]> {
  if (!userId) return [];
  const rows = await db.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } });
  return rows.map((r) => r.blockedId);
}
