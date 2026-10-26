type GoalLike = { done: boolean };
type SectionLike = { goals: GoalLike[] };

export function sectionStats(s: SectionLike) {
  const total = s.goals.length;
  const done = s.goals.filter((g) => g.done).length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

/**
 * Overall progress gives every section the same weight: it is the average of
 * each section's completion. Sections without goals are left out until they
 * get their first goal, so an empty section doesn't drag the number down.
 */
export function projectStats(sections: SectionLike[]) {
  const per = sections.map(sectionStats);
  const counted = per.filter((x) => x.total > 0);
  const avg = counted.length ? counted.reduce((a, x) => a + x.done / x.total, 0) / counted.length : 0;
  return {
    pct: Math.round(avg * 100),
    done: per.reduce((a, x) => a + x.done, 0),
    total: per.reduce((a, x) => a + x.total, 0),
    sections: per,
    counted: counted.length,
  };
}
