// Community safety: report reasons, the auto-hide threshold, moderator
// access, and a filter that stops clearly abusive words before they're posted.

export { REPORT_REASONS, REPORT_REASON_KEYS, type ReportReason } from "./constants";

/** Content is hidden automatically once this many different people report it. */
export const AUTO_HIDE_AFTER = 3;

/** Moderators are listed by email in ADMIN_EMAILS, separated by commas. */
export function isModerator(user: { email: string } | null | undefined) {
  if (!user) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(user.email.toLowerCase());
}

// Terms that are never acceptable in the community: slurs, explicit sexual
// terms and threats. Extend this list as moderators see new abuse.
const BLOCKED_TERMS = [
  "nigger", "nigga", "faggot", "fag", "retard", "tranny", "kike", "spic", "chink", "wetback", "gook", "dyke",
  "cunt", "whore", "slut", "porn", "porno", "blowjob", "handjob", "cumshot", "dildo", "rape", "rapist", "molest",
  "kys", "kill yourself", "kill urself", "go die",
];
const BLOCKED_STEMS = ["fuck"];

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ");
}

/** Returns a reason the text can't be posted, or null when it's fine. */
export function checkContent(...parts: string[]): string | null {
  const text = ` ${normalize(parts.join(" "))} `;
  const hit =
    BLOCKED_TERMS.some((t) => text.includes(` ${t} `) || text.includes(` ${t}s `)) || BLOCKED_STEMS.some((s) => text.includes(s));
  return hit ? "Your post includes language that isn't allowed in the community. Please reword it and try again." : null;
}
