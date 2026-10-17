import { addDays, format, parseISO } from "date-fns";
import { uid } from "@/lib/jee360/ids";
import { todayISO } from "@/lib/jee360/dates";
import type { Lecture, MemoryCard, Subject } from "@/lib/jee360/types";

export type ReviewGrade = 1 | 2 | 3 | 4;

export function cardsFromLectures(lectures: Lecture[], now = new Date()): MemoryCard[] {
  const seen = new Map<string, MemoryCard>();
  const today = todayISO(now);
  let i = 0;
  for (const lecture of lectures) {
    const key = `${lecture.subject}:${lecture.chapter}`;
    if (seen.has(key)) continue;
    const offset = i % 5 === 0 ? 0 : i % 4 === 0 ? -1 : i % 3;
    seen.set(key, {
      id: uid("mem"),
      subject: lecture.subject,
      chapter: lecture.chapter,
      prompt: `Recall the core of ${lecture.chapter} — ${lecture.title.replace(/^.*? — /, "")}.`,
      ease: 2.5,
      interval: offset === 0 ? 0 : Math.max(0, offset),
      reps: offset === 0 ? 0 : 1,
      lapses: 0,
      due: format(addDays(parseISO(today), offset === 0 || offset < 0 ? 0 : offset), "yyyy-MM-dd"),
    });
    i += 1;
  }
  return [...seen.values()];
}

export function mergeCards(existing: MemoryCard[], lectures: Lecture[], now = new Date()): MemoryCard[] {
  const have = new Set(existing.map((c) => `${c.subject}:${c.chapter}`));
  const extra = cardsFromLectures(lectures, now).filter((c) => !have.has(`${c.subject}:${c.chapter}`));
  return extra.length ? [...existing, ...extra] : existing;
}

export function reviewCard(card: MemoryCard, grade: ReviewGrade, today: string): MemoryCard {
  let { ease, interval, reps, lapses } = card;
  if (grade === 1) {
    lapses += 1;
    reps = 0;
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    ease = Math.max(1.3, ease + (grade === 2 ? -0.15 : grade === 3 ? 0.05 : 0.15));
    if (reps === 0) interval = grade === 4 ? 3 : 1;
    else if (reps === 1) interval = grade === 4 ? 8 : grade === 3 ? 6 : 3;
    else {
      const factor = grade === 2 ? 0.85 : grade === 4 ? 1.3 : 1;
      interval = Math.max(1, Math.round(interval * ease * factor));
    }
    reps += 1;
  }
  return {
    ...card,
    ease,
    interval,
    reps,
    lapses,
    due: format(addDays(parseISO(today), Math.max(0, interval)), "yyyy-MM-dd"),
    lastReviewed: today,
  };
}

export function dueCards(cards: MemoryCard[], today: string): MemoryCard[] {
  return cards.filter((c) => c.due <= today).sort((a, b) => a.due.localeCompare(b.due) || a.chapter.localeCompare(b.chapter));
}

export function memoryStats(cards: MemoryCard[], today: string) {
  const due = dueCards(cards, today).length;
  const mastered = cards.filter((c) => c.interval >= 21).length;
  const newCount = cards.filter((c) => c.reps === 0).length;
  return { total: cards.length, due, mastered, newCount };
}

export const GRADE_LABEL: Record<ReviewGrade, string> = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

export function subjectOf(card: MemoryCard): Subject {
  return card.subject;
}
