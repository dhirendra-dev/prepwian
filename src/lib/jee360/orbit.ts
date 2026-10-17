import type { FocusSession, Lecture, MemoryCard, Mistake, SprintRun } from "@/lib/jee360/types";

const TITLES = ["Spark", "Drift", "Lock", "Burn", "Apex", "Zenith"];

export function orbitStats(input: {
  lectures: Lecture[];
  focusSessions: FocusSession[];
  cards: MemoryCard[];
  mistakes: Mistake[];
  sprintRuns: SprintRun[];
}) {
  const attended = input.lectures.filter((l) => l.status === "attended").length;
  const focusMin = input.focusSessions
    .filter((s) => s.status === "completed")
    .reduce((n, s) => n + s.minutes, 0);
  const reviews = input.cards.filter((c) => c.reps > 0).length;
  const cleared = input.mistakes.filter((m) => m.status === "cleared").length;
  const sprintHits = input.sprintRuns.reduce((n, r) => n + r.correct, 0);

  const xp = attended * 4 + focusMin + reviews * 6 + cleared * 10 + sprintHits * 5;
  const level = Math.min(TITLES.length, 1 + Math.floor(xp / 80));
  const floor = (level - 1) * 80;
  const span = 80;
  const into = xp - floor;
  return {
    xp,
    level,
    title: TITLES[level - 1] ?? "Spark",
    into,
    span,
    next: Math.max(0, span - into),
    parts: { attended, focusMin, reviews, cleared, sprintHits },
  };
}
