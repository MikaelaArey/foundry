import Link from "next/link";
import { KINDS } from "@/lib/constants";
import type { CuratedIdea } from "@/lib/idea-db";
import type { Report } from "@/lib/schemas";
import { Icon } from "./icon";

const SCORE_KEYS = [
  ["opportunity", "Opportunity", "var(--good)"],
  ["problem", "Problem", "var(--bad)"],
  ["feasibility", "Feasibility", "var(--info)"],
  ["whyNow", "Why now", "var(--amber)"],
] as const;

export const overall = (r: Report) => Math.round(((r.scores.opportunity + r.scores.problem + r.scores.feasibility + r.scores.whyNow) / 40) * 100);

export function ScoreTiles({ report }: { report: Report }) {
  return (
    <div className="scores">
      {SCORE_KEYS.map(([k, label]) => (
        <div key={k} className={`score ${k}`}>
          <span className="score-top">{label}</span>
          <div className="score-val">
            <b>{report.scores[k]}</b>
            <span>{report.scoreLabels[k]}</span>
          </div>
          <span className="score-bar" aria-hidden="true">
            <i style={{ width: `${report.scores[k] * 10}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function IdeaThumb({ report }: { report: Report }) {
  return (
    <div className="idea-thumb" aria-hidden="true">
      {SCORE_KEYS.map(([k, label, color]) => (
        <div key={k} className="thumb-row">
          <span>{label}</span>
          <span className="bar">
            <i style={{ width: `${report.scores[k] * 10}%`, background: color }} />
          </span>
          <b>{report.scores[k]}</b>
        </div>
      ))}
    </div>
  );
}

const BADGE_STYLE = [
  ["flame", "chip-warm"],
  ["trend", "chip-brand"],
  ["target", "chip-info"],
  ["sparkles", "chip-good"],
] as const;

export function Badges({ badges }: { badges: string[] }) {
  return (
    <div className="row-wrap gap-6">
      {badges.map((b, i) => {
        const [icon, cls] = BADGE_STYLE[i % BADGE_STYLE.length];
        return (
          <span key={b} className={`chip ${cls}`}>
            <Icon name={icon} /> {b}
          </span>
        );
      })}
    </div>
  );
}

export function IdeaCard({ idea }: { idea: CuratedIdea }) {
  return (
    <Link href={`/explore/${idea.slug}`} className="card card-hover idea-card">
      <IdeaThumb report={idea.report} />
      <div className="idea-card-body">
        <div className="row-wrap gap-6">
          <span className="chip">{idea.category}</span>
          <span className="chip chip-outline">{idea.market} market</span>
          <span className="trend" style={{ marginLeft: "auto" }}>
            <Icon name="trend" /> {overall(idea.report)}
          </span>
        </div>
        <h3>{idea.title}</h3>
        <p>{idea.tagline}</p>
      </div>
    </Link>
  );
}

const money = (n: number) => "$".repeat(Math.max(1, Math.min(3, n)));

/** The full validation report. `narrow` stacks the side column under the main one. */
export function ReportView({ report, narrow, actions }: { report: Report; narrow?: boolean; actions?: React.ReactNode }) {
  return (
    <div className="report" style={narrow ? { gridTemplateColumns: "minmax(0,1fr)" } : undefined}>
      <div className="report-main">
        <div className="prose">
          {report.summary.split(/\n\s*\n/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="meta-line">
          <Icon name="users" /> {report.audience}
        </p>
        <section className="panel">
          <h3 className="panel-title">Offer ladder</h3>
          <div className="ladder">
            {report.offers.map((o, i) => (
              <div key={i} className="ladder-item">
                <span className="ladder-n">{i + 1}</span>
                <div className="stack gap-4">
                  <span className="eyebrow" style={{ fontSize: 11 }}>
                    {o.stage}
                  </span>
                  <b>
                    {o.name} <span className="muted small">({o.price})</span>
                  </b>
                  <span className="soft small">{o.description}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="stack gap-12">
          <h3 className="title">Why now?</h3>
          <p className="prose soft" style={{ fontSize: 16, lineHeight: 1.7 }}>
            {report.whyNow}
          </p>
        </section>
        <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <section className="panel">
            <h3 className="panel-title">Cheapest tests to run first</h3>
            <ul className="check-list">
              {report.experiments.map((e) => (
                <li key={e}>
                  <Icon name="check" /> {e}
                </li>
              ))}
            </ul>
          </section>
          <section className="panel">
            <h3 className="panel-title">Risks to watch</h3>
            <ul className="check-list risk-list">
              {report.risks.map((r) => (
                <li key={r}>
                  <Icon name="alert" /> {r}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <aside className="report-aside">
        <ScoreTiles report={report} />
        <section className="panel">
          <h3 className="panel-title">Business fit</h3>
          <div className="fit-list">
            <div className="fit-row">
              <span className="fit-ic">
                <Icon name="cash" />
              </span>
              <span>
                <b>Revenue potential</b>
                <small>{report.revenue.note}</small>
              </span>
              <span className="fit-val">{money(report.revenue.level)}</span>
            </div>
            <div className="fit-row">
              <span className="fit-ic">
                <Icon name="wrench" />
              </span>
              <span>
                <b>Execution difficulty</b>
                <small>{report.difficulty.note}</small>
              </span>
              <span className="fit-val">{report.difficulty.score}/10</span>
            </div>
            <div className="fit-row">
              <span className="fit-ic">
                <Icon name="megaphone" />
              </span>
              <span>
                <b>Go-to-market</b>
                <small>{report.goToMarket.note}</small>
              </span>
              <span className="fit-val">{report.goToMarket.score}/10</span>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3 className="panel-title">Starter plan</h3>
            <span className="tiny muted">Becomes your project sections</span>
          </div>
          <div className="stack gap-12">
            {report.plan.map((s) => (
              <div key={s.kind} className={`k-${s.kind} stack gap-4`}>
                <b className="row small" style={{ gap: 8 }}>
                  <span className="dot" /> {KINDS[s.kind].label}
                </b>
                <span className="tiny muted">{s.goals.slice(0, 3).join(" · ")}</span>
              </div>
            ))}
          </div>
          {actions}
        </section>
        <p className="disclaimer">Scores are judgment calls to help you think, not market data. Test before you invest.</p>
      </aside>
    </div>
  );
}
