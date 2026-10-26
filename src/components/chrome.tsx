import { db } from "@/lib/db";
import { getCurrentUser, requireUser, toPublicUser } from "@/lib/auth";
import { projectStats } from "@/lib/progress";
import { isModerator } from "@/lib/moderation";
import { AppShell } from "./app-shell";
import { SiteFooter, SiteHeader } from "./site-chrome";

async function sidebarData(userId: string) {
  const [projects, ideaCount] = await Promise.all([
    db.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, parked: true, sections: { select: { goals: { select: { done: true } } } } },
    }),
    db.idea.count({ where: { userId } }),
  ]);
  return {
    projects: projects.map((p) => ({ id: p.id, name: p.name, parked: p.parked, pct: projectStats(p.sections).pct })),
    ideaCount,
  };
}

/**
 * Page chrome. Signed-in people get the app sidebar everywhere; visitors get
 * the marketing header and footer on public pages.
 */
export async function Chrome({
  children,
  requireAuth,
  next,
  current,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
  next?: string;
  current?: "explore" | "community" | "generate";
}) {
  const user = requireAuth ? await requireUser(next) : await getCurrentUser();
  if (!user) {
    return (
      <>
        <SiteHeader current={current} />
        <main className="container" style={{ paddingBlock: "40px 0", display: "grid", gap: 28 }}>
          {children}
        </main>
        <SiteFooter />
      </>
    );
  }
  const data = await sidebarData(user.id);
  const openReports = isModerator(user) ? await db.report.count({ where: { status: "open" } }) : undefined;
  return (
    <AppShell user={toPublicUser(user)} projects={data.projects} ideaCount={data.ideaCount} openReports={openReports}>
      {children}
    </AppShell>
  );
}
