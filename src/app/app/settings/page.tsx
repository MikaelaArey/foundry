import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import { githubConfigured } from "@/lib/github";
import { isNativeApp } from "@/lib/config";
import { disconnectGithubAction } from "@/actions/settings";
import { unblockUserAction } from "@/actions/community";
import { DeleteAccountForm, ReminderToggle } from "@/components/account-controls";
import { Avatar } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Icon } from "@/components/icon";

export const metadata = { title: "Settings" };

const GITHUB_MESSAGES: Record<string, string> = {
  connected: "GitHub is connected. You can now pick repositories in each project's Launchpad.",
  taken: "That GitHub account is already connected to a different Foundry account.",
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ github?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/app/settings");
  const ghMessage = sp.github ? GITHUB_MESSAGES[sp.github] : null;
  const inApp = await isNativeApp();
  const blocked = await db.block.findMany({
    where: { blockerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { blocked: { select: { id: true, name: true, handle: true } } },
  });

  return (
    <>
      <header className="page-head">
        <div className="page-head-copy">
          <span className="eyebrow">Settings</span>
          <h1 className="display-m">Your account</h1>
        </div>
      </header>

      <div className="dash-grid">
        <section className="card card-pad stack gap-20" style={{ padding: 24 }}>
          <div className="stack gap-4">
            <h2 className="panel-title">Profile</h2>
            <span className="small muted">Signed in as {user.email}</span>
          </div>
          <ProfileForm name={user.name} handle={user.handle} bio={user.bio} />
          <hr className="divider" />
          <div className="stack gap-12">
            <h2 className="panel-title">Blocked people</h2>
            {blocked.length ? (
              blocked.map((b) => (
                <div key={b.blocked.id} className="row">
                  <Avatar name={b.blocked.name} seed={b.blocked.id} size={30} />
                  <span className="grow">
                    <b className="small">{b.blocked.name}</b> <span className="small muted">@{b.blocked.handle}</span>
                  </span>
                  <form action={unblockUserAction.bind(null, b.blocked.id)}>
                    <button className="btn btn-sm">Unblock</button>
                  </form>
                </div>
              ))
            ) : (
              <p className="small muted">You haven&rsquo;t blocked anyone. Use the ⋯ menu on a community post or reply to block someone.</p>
            )}
          </div>
          <hr className="divider" />
          <div className="stack gap-12">
            <h2 className="panel-title">Delete account</h2>
            <p className="small soft">Permanently delete your account and everything in it.</p>
            <DeleteAccountForm />
          </div>
        </section>

        <aside className="rail">
          <section className="panel">
            <h2 className="panel-title">Connections</h2>
            {ghMessage ? <p className="notice small">{ghMessage}</p> : null}
            <div className="row" style={{ alignItems: "flex-start" }}>
              <span className="tool-ic" style={{ background: "var(--ink)", color: "var(--bg)" }}>
                <Icon name="branch" />
              </span>
              <div className="stack gap-6 grow">
                <b>GitHub</b>
                {user.githubLogin ? (
                  <>
                    <span className="small soft">Connected as @{user.githubLogin}</span>
                    <form action={disconnectGithubAction}>
                      <button className="btn btn-sm">Disconnect</button>
                    </form>
                  </>
                ) : githubConfigured() && inApp ? (
                  <span className="small soft">Connect GitHub on the Foundry website, in Settings. It then works here in the app too.</span>
                ) : githubConfigured() ? (
                  <>
                    <span className="small soft">Pick repositories for your projects instead of pasting links.</span>
                    <a href="/api/auth/github?next=/app/settings?github=connected" className="btn btn-sm" style={{ justifySelf: "start" }}>
                      Connect GitHub
                    </a>
                  </>
                ) : (
                  <span className="small muted">GitHub sign-in isn&rsquo;t set up on this server yet. You can still paste repository links in any project.</span>
                )}
              </div>
            </div>
            {aiConfigured() || process.env.NODE_ENV !== "production" ? (
              <div className="row" style={{ alignItems: "flex-start" }}>
                <span className="tool-ic">
                  <Icon name="sparkles" />
                </span>
                <div className="stack gap-6 grow">
                  <b>Claude</b>
                  <span className="small soft">
                    {aiConfigured()
                      ? "AI features are on: the idea generator, validation reports and goal suggestions."
                      : "AI features are off. Add ANTHROPIC_API_KEY to .env to turn them on."}
                  </span>
                </div>
              </div>
            ) : null}
          </section>
          <ReminderToggle />
          <section className="panel">
            <h2 className="panel-title">Appearance</h2>
            <ThemeToggle />
          </section>
          <section className="panel">
            <h2 className="panel-title">Help and legal</h2>
            <div className="stack gap-6 small">
              <Link className="link" href="/support">
                Support
              </Link>
              <Link className="link" href="/terms">
                Terms of Use
              </Link>
              <Link className="link" href="/privacy">
                Privacy Policy
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
