import type { BacklogItem, Lecture, MemoryCard, Mistake, Subject } from "@/lib/jee360/types";

export type WeakRow = {
  key: string;
  subject: Subject;
  chapter: string;
  heat: number;
  reasons: string[];
};

export function weaknessMap(input: {
  lectures: Lecture[];
  backlog: BacklogItem[];
  cards: MemoryCard[];
  mistakes: Mistake[];
}): WeakRow[] {
  const map = new Map<string, WeakRow>();

  const bump = (subject: Subject, chapter: string, pts: number, reason: string) => {
    const key = `${subject}:${chapter}`;
    const row = map.get(key) ?? { key, subject, chapter, heat: 0, reasons: [] };
    row.heat += pts;
    if (!row.reasons.includes(reason)) row.reasons.push(reason);
    map.set(key, row);
  };

  for (const b of input.backlog.filter((x) => x.status !== "cleared")) {
    bump(b.subject, b.chapter, b.priority === "high" ? 3 : 2, "backlog");
  }
  for (const c of input.cards) {
    if (c.lapses > 0) bump(c.subject, c.chapter, Math.min(3, c.lapses), "loop lapses");
    if (c.reps === 0) bump(c.subject, c.chapter, 1, "unseen");
  }
  for (const m of input.mistakes.filter((x) => x.status === "open")) {
    bump(m.subject, m.chapter, m.kind === "concept" ? 3 : 2, m.kind);
  }

  return [...map.values()]
    .map((r) => ({ ...r, heat: Math.min(5, r.heat) }))
    .sort((a, b) => b.heat - a.heat || a.chapter.localeCompare(b.chapter));
}
