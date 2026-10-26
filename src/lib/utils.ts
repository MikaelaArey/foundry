export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function timeAgo(date: Date | string | number) {
  const t = new Date(date).getTime();
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d ago`;
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function parseTags(input: string | string[] | null | undefined): string[] {
  const raw = Array.isArray(input) ? input.join(",") : String(input ?? "");
  const out: string[] = [];
  for (const piece of raw.split(",")) {
    const t = piece.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-").slice(0, 24);
    if (t && !out.includes(t)) out.push(t);
  }
  return out.slice(0, 8);
}
export const tagsToString = (tags: string[]) => parseTags(tags).join(",");
export const splitTags = (s: string) => (s ? s.split(",").filter(Boolean) : []);

/** Returns a safe http(s) or vscode:// URL, "" for empty input, or null when invalid. */
export function normalizeUrl(raw: string): string | null {
  let u = String(raw ?? "").trim();
  if (!u) return "";
  if (/^vscode(-insiders)?:\/\//i.test(u)) return u.slice(0, 600);
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = "https://" + u;
  try {
    const x = new URL(u);
    if (x.protocol !== "https:" && x.protocol !== "http:") return null;
    if (!x.hostname.includes(".")) return null;
    return x.href.slice(0, 600);
  } catch {
    return null;
  }
}

export function hostOf(u: string) {
  try {
    const x = new URL(u);
    if (x.protocol.startsWith("vscode")) return "Local folder";
    return (x.host.replace(/^www\./, "") + x.pathname.replace(/\/$/, "")).slice(0, 60);
  } catch {
    return u;
  }
}

export function ghParse(u?: string | null) {
  const m = /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/.exec(u ?? "");
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, "") } : null;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const s = (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
  return (s || "?").toUpperCase();
}

export function hueOf(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
