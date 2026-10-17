import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Admin controls for the automated scheduled-test generator.
 * The generator itself runs from pg_cron every 10 minutes and uses the
 * platform AI key (LOVABLE_API_KEY) — admins never need to paste a key.
 */

export type ScheduledRun = {
  id: string;
  test_number: number;
  scheduled_date: string;
  test_name: string;
  subjects: Record<string, string[]>;
  total_questions: number;
  status: string;
  generated_test_id: string | null;
  error: string | null;
  updated_at: string;
  created_at: string;
  question_count?: number;
};

async function assertAdmin(sb: any, userId: string) {
  const { data } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Admins only");
}

export const listScheduledRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ScheduledRun[]> => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { data, error } = await sb
      .from("scheduled_tests")
      .select("id, test_number, scheduled_date, test_name, subjects, total_questions, status, generated_test_id, error, created_at, updated_at")
      .order("scheduled_date", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as ScheduledRun[];

    const testIds = rows.map((r) => r.generated_test_id).filter(Boolean) as string[];
    if (testIds.length) {
      const { data: qs } = await sb.from("test_questions").select("test_id").in("test_id", testIds);
      const counts = new Map<string, number>();
      for (const q of (qs ?? []) as { test_id: string }[]) {
        counts.set(q.test_id, (counts.get(q.test_id) ?? 0) + 1);
      }
      for (const r of rows) {
        if (r.generated_test_id) r.question_count = counts.get(r.generated_test_id) ?? 0;
      }
    }
    return rows;
  });

/** Puts a failed / stuck run back in the queue. Optionally moves it to today. */
export const retryScheduledRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; runToday?: boolean }) =>
    z.object({ id: z.string().uuid(), runToday: z.boolean().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const patch: Record<string, unknown> = { status: "pending", error: null, updated_at: new Date().toISOString() };
    if (data.runToday) patch['scheduled_date'] = new Date().toISOString().slice(0, 10);
    const { error } = await sb.from("scheduled_tests").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const rescheduleRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; date: string; totalQuestions?: number; testName?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        totalQuestions: z.number().int().min(5).max(180).optional(),
        testName: z.string().trim().min(3).max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const patch: Record<string, unknown> = { scheduled_date: data.date, updated_at: new Date().toISOString() };
    if (data.totalQuestions) patch['total_questions'] = data.totalQuestions;
    if (data.testName) patch['test_name'] = data.testName;
    const { error } = await sb.from("scheduled_tests").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Pauses an upcoming run so the cron skips it. */
export const setRunStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "pending" | "paused" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "paused"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { error } = await sb
      .from("scheduled_tests")
      .update({ status: data.status, error: null, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteScheduledRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { error } = await sb.from("scheduled_tests").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const createScheduledRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { testName: string; date: string; totalQuestions: number; subjects: Record<string, string[]> }) =>
    z
      .object({
        testName: z.string().trim().min(3).max(120),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        totalQuestions: z.number().int().min(5).max(180),
        subjects: z.record(z.string(), z.array(z.string().min(1).max(120)).min(1)),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { data: last } = await sb
      .from("scheduled_tests")
      .select("test_number")
      .order("test_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await sb.from("scheduled_tests").insert({
      test_number: (last?.test_number ?? 0) + 1,
      scheduled_date: data.date,
      test_name: data.testName,
      subjects: data.subjects,
      total_questions: data.totalQuestions,
      status: "pending",
    });
    if (error) throw error;
    return { ok: true };
  });

/* ── Overall Test Series ranking (points across all tests) ───────────────── */

export type TestRankRow = {
  user_id: string;
  total_points: number;
  tests_attempted: number;
  avg_accuracy: number;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export const getTestPointsLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const { data, error } = await sb.rpc("test_points_leaderboard");
    if (error) throw error;
    const rows = (data ?? []) as TestRankRow[];
    const meIndex = rows.findIndex((r) => r.user_id === context.userId);
    return { rows, myRank: meIndex >= 0 ? meIndex + 1 : null, me: meIndex >= 0 ? rows[meIndex] : null };
  });

/* ── AI key used by the automated generator ───────────────────────────────── */

export type AiGenSettings = {
  use_own_key: boolean;
  provider: string;
  has_key: boolean;
  updated_at: string | null;
};

/** Admin-only. Never returns the key itself, only whether one is stored. */
export const getAiGenSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AiGenSettings> => {
    await assertAdmin(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("ai_generation_settings")
      .select("use_own_key, provider, api_key, updated_at")
      .eq("id", 1)
      .maybeSingle();
    return {
      use_own_key: !!data?.use_own_key,
      provider: (data?.provider as string) ?? "gemini",
      has_key: !!data?.api_key,
      updated_at: (data?.updated_at as string) ?? null,
    };
  });

export const saveAiGenSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { useOwnKey: boolean; provider: string; apiKey?: string | null }) =>
    z
      .object({
        useOwnKey: z.boolean(),
        provider: z.enum(["gemini", "openai", "groq"]),
        apiKey: z.string().trim().min(10).max(400).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {
      id: 1,
      use_own_key: data.useOwnKey,
      provider: data.provider,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    };
    if (data.apiKey !== undefined) patch['api_key'] = data.apiKey;
    const { error } = await (supabaseAdmin as any).from("ai_generation_settings").upsert(patch, { onConflict: "id" });
    if (error) throw error;
    return { ok: true };
  });
