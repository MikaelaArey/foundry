import Link from "next/link";
import { KINDS, TOOLS, stageOf, type Kind, type ToolKey } from "@/lib/constants";
import { projectStats } from "@/lib/progress";
import { Icon } from "./icon";
import { Bar, Ring } from "./ui";

type CardProject = {
  id: string;
  name: string;
  pitch: string;
  stage: string;
  parked: boolean;
  sections: { id: string; kind: string; name: string; goals: { done: boolean }[] }[];
  links: { id: string; kind: string; label: string; url: string }[];
};

export function ProjectCard({ project }: { project: CardProject }) {
  const st = projectStats(project.sections);
  const shown = project.sections.slice(0, 4);
  return (
    <article className="card card-hover proj-card">
      <div className="proj-card-top">
        <div className="stack gap-6 grow">
          <div className="row-wrap gap-6">
            <span className="chip chip-brand">{stageOf(project.stage).label}</span>
            {project.parked ? <span className="chip">Parked</span> : null}
          </div>
          <h3>
            <Link href={`/app/projects/${project.id}`} className="stretch">
              {project.name}
            </Link>
          </h3>
        </div>
        <Ring pct={st.pct} label={`${st.pct}% overall`} />
      </div>
      {project.pitch ? <p>{project.pitch}</p> : null}
      {shown.length ? (
        <ul className="bars">
          {shown.map((s, i) => {
            const kind = (s.kind in KINDS ? s.kind : "custom") as Kind;
            return (
              <li key={s.id} className={`k-${kind}`}>
                <span>
                  <span className="dot" /> {s.name}
                </span>
                <Bar pct={st.sections[i].pct} />
                <span className="mono">{st.sections[i].pct}%</span>
              </li>
            );
          })}
          {project.sections.length > 4 ? <li className="tiny muted" style={{ display: "block" }}>+ {project.sections.length - 4} more sections</li> : null}
        </ul>
      ) : (
        <p className="small muted">No sections yet</p>
      )}
      {project.links.length ? (
        <div className="proj-links">
          {project.links.map((l) => {
            const tool = l.kind in TOOLS ? TOOLS[l.kind as ToolKey] : null;
            return (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="mini-tool" title={`Open ${l.label}`} aria-label={`Open ${l.label}`}>
                <Icon name={tool?.icon ?? "link"} />
              </a>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
