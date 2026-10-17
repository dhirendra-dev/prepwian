import { supabase } from "@/integrations/supabase/client";

export type QuizStats = {
  xp: number;
  level: number;
  streak: number;
  lastDay: string | null;
  dailyBest: number;
  battleBest: number;
  battleBestSec: number | null;
  played: number;
  correct: number;
  answered: number;
};

export const EMPTY_STATS: QuizStats = {
  xp: 0,
  level: 1,
  streak: 0,
  lastDay: null,
  dailyBest: 0,
  battleBest: 0,
  battleBestSec: null,
  played: 0,
  correct: 0,
  answered: 0,
};

export function levelFor(xp: number) {
  return Math.max(1, Math.floor(xp / 250) + 1);
}

export function levelProgress(xp: number) {
  return Math.round(((xp % 250) / 250) * 100);
}

/**
 * Load quiz statistics from Supabase.
 *
 * IMPORTANT:
 * Stats are identified by the authenticated Supabase user,
 * never by device/localStorage.
 */
export async function loadStats(): Promise<QuizStats> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return EMPTY_STATS;
  }

  const { data, error } = await supabase
    .from("quiz_stats")
    .select(
      `
        xp,
        level,
        streak,
        last_day,
        daily_best,
        battle_best,
        battle_best_sec,
        played,
        correct,
        answered
      `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return EMPTY_STATS;
  }

  return {
    xp: data.xp ?? 0,
    level: data.level ?? 1,
    streak: data.streak ?? 0,
    lastDay: data.last_day ?? null,
    dailyBest: data.daily_best ?? 0,
    battleBest: data.battle_best ?? 0,
    battleBestSec: data.battle_best_sec ?? null,
    played: data.played ?? 0,
    correct: data.correct ?? 0,
    answered: data.answered ?? 0,
  };
}

export type XpAward = {
  gained: number;
  bonus: number;
  levelUp: boolean;
  stats: QuizStats;
};

/**
 * Record a completed Quiz Arena / Question Battle run.
 *
 * All persistent statistics are stored in Supabase.
 * Nothing is stored in localStorage.
 */
export async function recordRun(opts: {
  mode: "daily" | "battle";
  correct: number;
  total: number;
  seconds: number;
}): Promise<XpAward> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to save quiz progress.");
  }

  const accuracy = opts.total > 0 ? opts.correct / opts.total : 0;

  let gained = opts.correct * 10;
  let bonus = 0;

  if (accuracy === 1 && opts.total > 0) {
    bonus += 50;
  }

  if (
    opts.mode === "battle" &&
    opts.seconds > 0 &&
    opts.seconds < opts.total * 30
  ) {
    bonus += 25;
  }

  if (opts.mode === "daily") {
    bonus += 20;
  }

  gained += bonus;

  const previous = await loadStats();

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const yesterdayDate = new Date(Date.now() - 86400000);

  const yesterday = yesterdayDate.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  let streak = previous.streak;

  if (previous.lastDay !== today) {
    streak =
      previous.lastDay === yesterday
        ? previous.streak + 1
        : 1;
  }

  if (streak > 1) {
    gained += Math.min(50, streak * 5);
  }

  const xp = previous.xp + gained;
  const nextLevel = levelFor(xp);

  const next: QuizStats = {
    xp,
    level: nextLevel,
    streak,
    lastDay: today,

    dailyBest:
      opts.mode === "daily"
        ? Math.max(previous.dailyBest, opts.correct)
        : previous.dailyBest,

    battleBest:
      opts.mode === "battle"
        ? Math.max(previous.battleBest, opts.correct)
        : previous.battleBest,

    battleBestSec:
      opts.mode === "battle" && accuracy === 1
        ? Math.min(
            previous.battleBestSec ?? Number.MAX_SAFE_INTEGER,
            opts.seconds,
          )
        : previous.battleBestSec,

    played: previous.played + 1,
    correct: previous.correct + opts.correct,
    answered: previous.answered + opts.total,
  };

  const { error } = await supabase
    .from("quiz_stats")
    .upsert(
      {
        user_id: user.id,

        xp: next.xp,
        level: next.level,
        streak: next.streak,
        last_day: next.lastDay,

        daily_best: next.dailyBest,
        battle_best: next.battleBest,
        battle_best_sec: next.battleBestSec,

        played: next.played,
        correct: next.correct,
        answered: next.answered,

        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

  if (error) {
    console.error("Failed to save quiz stats:", error);
    throw new Error("Failed to save quiz progress.");
  }

  return {
    gained,
    bonus,
    levelUp: next.level > previous.level,
    stats: next,
  };
}