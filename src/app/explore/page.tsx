import Link from "next/link";
import { CATEGORIES, IDEAS, ideaOfTheDay } from "@/lib/idea-db";
import { IdeaCard } from "@/components/idea";
import { Icon } from "@/components/icon";

export const metadata = { title: "Idea Database" };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const category = c && CATEGORIES.includes(c) ? c : null;
  const ideas = category ? IDEAS.filter((i) => i.category === category) : IDEAS;
  const iotd = ideaOfTheDay();

  return (
    <>
      <section className="section-head" style={{ marginBottom: 8, paddingTop: 12 }}>
        <span className="eyebrow">Explore</span>
        <h1 className="display-l grad">The Idea Database</h1>
        <p className="lead">Business ideas with full reports: scores, an offer ladder, risks and the cheapest tests to run first.</p>
        <Link href={`/explore/${iotd.slug}`} className="pill" style={{ marginTop: 6 }}>
          <b>Today</b> {iotd.title} <Icon name="arrow" />
        </Link>
      </section>
      <nav className="filter-bar" aria-label="Categories">
        <Link href="/explore" className="fchip" aria-current={!category ? "page" : undefined}>
          All ideas
        </Link>
        {CATEGORIES.map((cat) => (
          <Link key={cat} href={`/explore?c=${encodeURIComponent(cat)}`} className="fchip" aria-current={category === cat ? "page" : undefined}>
            {cat}
          </Link>
        ))}
      </nav>
      <div className="idea-grid">
        {ideas.map((i) => (
          <IdeaCard key={i.slug} idea={i} />
        ))}
      </div>
    </>
  );
}
