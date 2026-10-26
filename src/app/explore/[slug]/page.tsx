import Link from "next/link";
import { notFound } from "next/navigation";
import { saveCuratedIdeaAction } from "@/actions/ideas";
import { IDEAS, findIdea, ideaOfTheDay } from "@/lib/idea-db";
import { Badges, ReportView } from "@/components/idea";
import { Icon } from "@/components/icon";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = findIdea(slug);
  return { title: idea?.title ?? "Idea", description: idea?.tagline };
}

export default async function IdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = findIdea(slug);
  if (!idea) notFound();
  const idx = IDEAS.findIndex((i) => i.slug === slug);
  const prev = IDEAS[(idx - 1 + IDEAS.length) % IDEAS.length];
  const next = IDEAS[(idx + 1) % IDEAS.length];
  const isToday = ideaOfTheDay().slug === slug;
  const discuss = `/community?compose=1&kind=idea&title=${encodeURIComponent(`Thoughts on: ${idea.title}`)}&body=${encodeURIComponent(
    `${idea.tagline}\n\nWould you build this? What would you change?\n\nReport: /explore/${idea.slug}`,
  )}`;

  return (
    <>
      <nav className="row between small" aria-label="Idea navigation">
        <Link href={`/explore/${prev.slug}`} className="row gap-6 soft">
          <Icon name="back" /> Previous
        </Link>
        <Link href="/explore" className="soft">
          All ideas
        </Link>
        <Link href={`/explore/${next.slug}`} className="row gap-6 soft">
          Next idea <Icon name="arrow" />
        </Link>
      </nav>

      <header className="stack gap-16">
        <div className="row-wrap gap-6">
          {isToday ? <span className="chip chip-solid-warm">Idea of the day</span> : null}
          <span className="chip">{idea.category}</span>
          <span className="chip chip-outline">{idea.market} market</span>
        </div>
        <h1 className="display-l" style={{ maxWidth: 900 }}>
          {idea.title}
        </h1>
        <p className="lead">{idea.tagline}</p>
        <Badges badges={idea.report.badges} />
        <div className="row-wrap">
          <form action={saveCuratedIdeaAction.bind(null, idea.slug)}>
            <button className="btn btn-primary">
              <Icon name="bolt" /> Save to my notebook
            </button>
          </form>
          <Link href={`/app/projects/new?from=${idea.slug}`} className="btn">
            <Icon name="rocket" /> Start this as a project
          </Link>
          <Link href={discuss} className="btn btn-ghost">
            <Icon name="users" /> Discuss with founders
          </Link>
        </div>
      </header>

      <ReportView
        report={idea.report}
        actions={
          <Link href={`/app/projects/new?from=${idea.slug}`} className="btn btn-sm btn-block">
            Use this plan <Icon name="arrow" />
          </Link>
        }
      />
    </>
  );
}
