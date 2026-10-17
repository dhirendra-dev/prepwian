import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type StudyAnalytics = {
  totalSeconds: number;
  sessionCount: number;
  bySubject: Record<string, number>;
  byType: Record<string, number>;
  // 30 days of daily totals for charts / heatmap (oldest -> newest)
  daily: { date: string; seconds: number }[];
  // 12-week heatmap grid: 84 daily totals
  heatmap: { date: string; seconds: number }[];
  currentStreak: number;
  longestStreak: number;
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const getStudyAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { range: "today" | "week" | "month" | "all" }) =>
    z.object({ range: z.enum(["today", "week", "month", "all"]) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<StudyAnalytics> => {
    const now = new Date();
    let since: Date | null = null;
    if (data.range === "today") {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (data.range === "week") {
      since = new Date(now.getTime() - 7 * 86400000);
    } else if (data.range === "month") {
      since = new Date(now.getTime() - 30 * 86400000);
    }

    let query = context.supabase
      .from("study_sessions")
      .select("duration_seconds, subject, session_type, ended_at")
      .eq("user_id", context.userId);
    if (since) query = query.gte("ended_at", since.toISOString());
    const { data: rangeRows, error } = await query;
    if (error) throw error;

    let totalSeconds = 0;
    const bySubject: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const r of rangeRows ?? []) {
      totalSeconds += r.duration_seconds;
      const s = r.subject ?? "general";
      bySubject[s] = (bySubject[s] ?? 0) + r.duration_seconds;
      byType[r.session_type] = (byType[r.session_type] ?? 0) + r.duration_seconds;
    }

    // Fetch 84 days for heatmap (independent of range)
    const heatmapSince = new Date(now.getTime() - 84 * 86400000);
    const { data: allRows } = await context.supabase
      .from("study_sessions")
      .select("duration_seconds, ended_at")
      .eq("user_id", context.userId)
      .gte("ended_at", heatmapSince.toISOString());

    const dailyMap = new Map<string, number>();
    for (const r of allRows ?? []) {
      const k = dayKey(new Date(r.ended_at));
      dailyMap.set(k, (dailyMap.get(k) ?? 0) + r.duration_seconds);
    }

    const heatmap: { date: string; seconds: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const k = dayKey(d);
      heatmap.push({ date: k, seconds: dailyMap.get(k) ?? 0 });
    }
    const daily = heatmap.slice(-30);

    // Streak: consecutive days with any session ending today or yesterday
    let currentStreak = 0;
    for (let i = 0; i < 400; i++) {
      const d = new Date(now.getTime() - i * 86400000);
      const k = dayKey(d);
      if ((dailyMap.get(k) ?? 0) > 0) {
        currentStreak += 1;
      } else if (i === 0) {
        // allow starting from yesterday
        continue;
      } else {
        break;
      }
    }

    let longestStreak = 0;
    let run = 0;
    const sortedKeys = Array.from(dailyMap.keys()).sort();
    let prev: Date | null = null;
    for (const k of sortedKeys) {
      const [y, m, dd] = k.split("-").map(Number);
      const d = new Date(y, m - 1, dd);
      if (prev && d.getTime() - prev.getTime() === 86400000) {
        run += 1;
      } else {
        run = 1;
      }
      if (run > longestStreak) longestStreak = run;
      prev = d;
    }

    return {
      totalSeconds,
      sessionCount: rangeRows?.length ?? 0,
      bySubject,
      byType,
      daily,
      heatmap,
      currentStreak,
      longestStreak,
    };
  });
