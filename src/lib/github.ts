export const githubConfigured = () => Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

export const appUrl = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const callbackUrl = () => `${appUrl()}/api/auth/github/callback`;

export function authorizeUrl(state: string) {
  const q = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID ?? "",
    redirect_uri: callbackUrl(),
    scope: "read:user user:email",
    state,
    allow_signup: "true",
  });
  return `https://github.com/login/oauth/authorize?${q}`;
}

export async function exchangeCode(code: string) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl(),
    }),
    cache: "no-store",
  });
  const data = (await res.json()) as { access_token?: string; error_description?: string };
  if (!data.access_token) throw new Error(data.error_description || "GitHub did not return an access token");
  return data.access_token;
}

async function gh<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Foundry",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GitHub ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getGithubProfile(token: string) {
  const user = await gh<{ id: number; login: string; name: string | null }>("/user", token);
  const emails = await gh<Array<{ email: string; primary: boolean; verified: boolean }>>("/user/emails", token).catch(() => []);
  const primary = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
  return { id: String(user.id), login: user.login, name: user.name || user.login, email: primary?.email?.toLowerCase() ?? null };
}

export type Repo = { fullName: string; url: string; description: string | null; private: boolean; updatedAt: string };

export async function listRepos(token: string): Promise<Repo[]> {
  const repos = await gh<Array<{ full_name: string; html_url: string; description: string | null; private: boolean; updated_at: string }>>(
    "/user/repos?sort=updated&per_page=100",
    token,
  );
  return repos.map((r) => ({ fullName: r.full_name, url: r.html_url, description: r.description, private: r.private, updatedAt: r.updated_at }));
}
