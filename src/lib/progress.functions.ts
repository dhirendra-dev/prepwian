import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Real-data progress overview: rating, tiers, solved windows, subject and
 * test-wise breakdowns, achievements and XP. Everything is derived from
 * existing tables (test_attempts / tests / study_sessions / topic_progress /
 * user_xp) — no new schema.
 */

export type Tier = {
  name: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
  min: number;
  max: number;
};

export const TIERS: Tier[] = [
  { name: "Bronze", min: 800, max: 1200 },
  { name: "Silver", min: 1200, max: 1450 },
  { name: "Gold", min: 1450, max: 1700 },
  { name: "Platinum", min: 1700, max: 2000 },
  { name: "Diamond", min: 2000, max: 2400 },
];

export function tierFor(rating: number): Tier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const t = TIERS[i]!;
    if (rating >= t.min) return t;
  }
  return TIERS[0]!;
}

export type SubjectRow = {
  subject: string;
  attempts: number;
  correct: number;
  wrong: number;
  skipped: number;
  scored: number;
  total: number;
  accuracy: number;
};

export type TestRow = {
  attemptId: string;
  testId: string;
  name: string;
  examType: string | null;
  subject: string | null;
  score: number;
  maxScore: number;
  accuracy: number;
  correct: number;
  wrong: number;
  skipped: number;
  percentile: number | null;
  submittedAt: string | null;
};

export type Achievement = {
  id: string;
  name: string;
  hint: string;
  rarity: "legendary" | "epic" | "rare" | "common";
  unlocked: boolean;
  progress: number; // 0..1
  unlockedAt: string | null;
};

export type ProgressOverview = {
  rating: number;
  ratingDelta7d: number;
  tier: Tier["name"];
  tierMin: number;
  tierMax: number;
  solved: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  activeDays: number;
  currentStreak: number;
  solvedWindows: { week: number; month: number; quarter: number; all: number };
  subjects: SubjectRow[];
  tests: TestRow[];
  topicProgress: { subject: string; done: number; inProgress: number; total: number }[];
  xp: number;
  level: number;
  levelXp: number;
  nextLevelXp: number;
  achievements: Achievement[];
};

function levelForXp(xp: number) {
  return Math.max(1, Math.floor(xp / 400) + 1);
}

const LEVEL_TITLES = ["Rookie", "Learner", "Solver", "Scholar", "Strategist", "Maestro"];
export function levelTitle(level: number) {
  return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 5))]!;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const getProgressOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProgressOverview> => {
    const sb = context.supabase as any;
    const uid = context.userId as string;

    const [attemptsRes, sessionsRes, xpRes, topicsRes] = await Promise.all([
      sb
        .from("test_attempts")
        .select(
          "id, test_id, score, max_score, accuracy, correct_count, wrong_count, skipped_count, percentile, submitted_at, status, tests(name, exam_type, subject)",
        )
        .eq("user_id", uid)
        .in("status", ["submitted", "auto_submitted"])
        .order("submitted_at", { ascending: false })
        .limit(200),
      sb.from("study_sessions").select("started_at, duration_seconds").eq("user_id", uid).limit(2000),
      sb.from("user_xp").select("total_xp").eq("user_id", uid).maybeSingle(),
      sb.from("topic_progress").select("subject, status").eq("user_id", uid).limit(2000),
    ]);

    const attempts: any[] = attemptsRes.data ?? [];

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    const subjects = new Map<string, SubjectRow>();
    const tests: TestRow[] = [];

    const now = Date.now();
    const windows = { week: 0, month: 0, quarter: 0, all: 0 };

    for (const a of attempts) {
      const c = Number(a.correct_count ?? 0);
      const w = Number(a.wrong_count ?? 0);
      const s = Number(a.skipped_count ?? 0);
      correct += c;
      wrong += w;
      skipped += s;

      const attemptedQ = c + w;
      const at = a.submitted_at ? new Date(a.submitted_at).getTime() : null;
      windows.all += attemptedQ;
      if (at) {
        const age = now - at;
        if (age <= 7 * 86400000) windows.week += attemptedQ;
        if (age <= 30 * 86400000) windows.month += attemptedQ;
        if (age <= 90 * 86400000) windows.quarter += attemptedQ;
      }

      const subj = (a.tests?.subject as string | null) ?? "mixed";
      const cur =
        subjects.get(subj) ??
        ({ subject: subj, attempts: 0, correct: 0, wrong: 0, skipped: 0, scored: 0, total: 0, accuracy: 0 } as SubjectRow);
      cur.attempts += 1;
      cur.correct += c;
      cur.wrong += w;
      cur.skipped += s;
      cur.scored += Number(a.score ?? 0);
      cur.total += Number(a.max_score ?? 0);
      subjects.set(subj, cur);

      tests.push({
        attemptId: a.id,
        testId: a.test_id,
        name: a.tests?.name ?? "Test",
        examType: a.tests?.exam_type ?? null,
        subject: a.tests?.subject ?? null,
        score: Number(a.score ?? 0),
        maxScore: Number(a.max_score ?? 0),
        accuracy: Number(a.accuracy ?? 0),
        correct: c,
        wrong: w,
        skipped: s,
        percentile: a.percentile != null ? Number(a.percentile) : null,
        submittedAt: a.submitted_at ?? null,
      });
    }

    for (const row of subjects.values()) {
      const att = row.correct + row.wrong;
      row.accuracy = att ? (row.correct / att) * 100 : 0;
    }

    const solved = correct + wrong;
    const accuracy = solved ? (correct / solved) * 100 : 0;

    // Rating: every correct answer earns, every mistake costs a little.
    const rating = Math.max(800, Math.min(2400, Math.round(1000 + correct * 2 - wrong * 1)));
    const recentCorrect = attempts
      .filter((a) => a.submitted_at && now - new Date(a.submitted_at).getTime() <= 7 * 86400000)
      .reduce((acc, a) => acc + Number(a.correct_count ?? 0) * 2 - Number(a.wrong_count ?? 0), 0);
    const tier = tierFor(rating);

    // Active days + current streak from study sessions and test submissions.
    const days = new Set<string>();
    for (const s of sessionsRes.data ?? []) days.add(dayKey(new Date(s.started_at)));
    for (const a of attempts) if (a.submitted_at) days.add(dayKey(new Date(a.submitted_at)));

    let currentStreak = 0;
    const cursor = new Date();
    while (days.has(dayKey(cursor))) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const topics = new Map<string, { subject: string; done: number; inProgress: number; total: number }>();
    for (const t of topicsRes.data ?? []) {
      const key = t.subject as string;
      const cur = topics.get(key) ?? { subject: key, done: 0, inProgress: 0, total: 0 };
      cur.total += 1;
      if (t.status === "completed") cur.done += 1;
      else if (t.status === "in_progress") cur.inProgress += 1;
      topics.set(key, cur);
    }

    const xp = Number(xpRes.data?.total_xp ?? 0);
    const level = levelForXp(xp);

    const mk = (
      id: string,
      name: string,
      hint: string,
      rarity: Achievement["rarity"],
      value: number,
      target: number,
    ): Achievement => ({
      id,
      name,
      hint,
      rarity,
      unlocked: value >= target,
      progress: Math.max(0, Math.min(1, target ? value / target : 0)),
      unlockedAt: null,
    });

    const bestPercentile = attempts.reduce((m, a) => Math.max(m, Number(a.percentile ?? 0)), 0);
    const achievements: Achievement[] = [
      mk("first-test", "First Steps", "Submit your first test", "common", attempts.length, 1),
      mk("five-tests", "Warming Up", "Submit 5 tests", "common", attempts.length, 5),
      mk("solve-100", "Century", "Attempt 100 questions", "common", solved, 100),
      mk("solve-500", "Grinder", "Attempt 500 questions", "rare", solved, 500),
      mk("solve-2000", "Machine", "Attempt 2,000 questions", "epic", solved, 2000),
      mk("acc-70", "Sharp Shooter", "Reach 70% accuracy", "rare", accuracy, 70),
      mk("acc-85", "Precision", "Reach 85% accuracy", "epic", accuracy, 85),
      mk("streak-7", "Week Warrior", "7-day active streak", "rare", currentStreak, 7),
      mk("streak-30", "Unbreakable", "30-day active streak", "legendary", currentStreak, 30),
      mk("rating-1450", "Gold Tier", "Cross 1450 rating", "rare", rating, 1450),
      mk("rating-2000", "Diamond Tier", "Cross 2000 rating", "legendary", rating, 2000),
      mk("percentile-99", "Top 1%", "Score 99+ percentile in a test", "legendary", bestPercentile, 99),
      mk("xp-2000", "XP Collector", "Earn 2,000 XP", "rare", xp, 2000),
      mk("level-10", "Scholar", "Reach level 10", "epic", level, 10),
      mk("topics-25", "Syllabus Crusher", "Complete 25 topics", "epic",
        Array.from(topics.values()).reduce((a, t) => a + t.done, 0), 25),
    ];

    return {
      rating,
      ratingDelta7d: recentCorrect,
      tier: tier.name,
      tierMin: tier.min,
      tierMax: tier.max,
      solved,
      correct,
      wrong,
      skipped,
      accuracy,
      activeDays: days.size,
      currentStreak,
      solvedWindows: windows,
      subjects: Array.from(subjects.values()).sort((a, b) => b.attempts - a.attempts),
      tests: tests.slice(0, 20),
      topicProgress: Array.from(topics.values()),
      xp,
      level,
      levelXp: xp % 400,
      nextLevelXp: 400,
      achievements,
    };
  });
