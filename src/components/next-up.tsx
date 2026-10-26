"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleGoalAction } from "@/actions/projects";
import { tapFeedback } from "@/lib/native";
import { Icon } from "./icon";
import { toast } from "./toaster";

export type NextUpItem = { goalId: string; text: string; projectId: string; projectName: string; section: string; kind: string };

export function NextUp({ items }: { items: NextUpItem[] }) {
  const router = useRouter();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [, start] = useTransition();

  function check(id: string) {
    setDone((d) => new Set(d).add(id));
    void tapFeedback();
    start(async () => {
      try {
        await toggleGoalAction(id, true);
        toast("Nice. Goal done.");
        router.refresh();
      } catch {
        setDone((d) => {
          const n = new Set(d);
          n.delete(id);
          return n;
        });
        toast("Couldn't save that. Try again.");
      }
    });
  }

  if (!items.length) {
    return <p className="small muted">Nothing open. Add goals to a project and the next one from each section shows up here.</p>;
  }
  return (
    <ul className="next-list">
      {items.map((it) => {
        const isDone = done.has(it.goalId);
        return (
          <li key={it.goalId} className={`goal k-${it.kind}${isDone ? " done" : ""}`}>
            <input type="checkbox" className="cb" id={`nu-${it.goalId}`} checked={isDone} onChange={() => !isDone && check(it.goalId)} />
            <label className="goal-label" htmlFor={`nu-${it.goalId}`}>
              <span className="box">
                <Icon name="check" />
              </span>
              <span className="grow">
                <span className="gt">{it.text}</span>
                <span className="goal-meta">
                  <span className="dot" /> {it.projectName} · {it.section}
                </span>
              </span>
            </label>
            <Link href={`/app/projects/${it.projectId}`} className="icon-btn" aria-label={`Open ${it.projectName}`} style={{ marginTop: 4 }}>
              <Icon name="chevron" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
