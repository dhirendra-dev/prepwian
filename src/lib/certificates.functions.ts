// @ts-nocheck -- references certificate/forum columns not yet in the database schema
import { createServerFn } from "@tanstack/react-start";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ELIGIBILITY_METRICS,
  type CertificateDetailField,
  type CertificateKind,
  type CertificateTemplateKey,
  type EligibilityConfig,
  type EligibilityMetric,
  isCertificateDetailField,
} from "@/lib/certificate-catalog";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export type CertificateType = {
  id: string;
  code: string;
  name: string;
  description: string;
  subtitle: string;
  category: string;
  threshold: number | null;
  icon: string | null;
  sort_order: number;
  template_key: CertificateTemplateKey;
  certificate_kind: CertificateKind;
  issuer_name: string;
  detail_fields: CertificateDetailField[];
  eligibility_config: EligibilityConfig;
  is_enabled: boolean;
};
export type CertificateDetailValue = { key: string; label: string; value: string };
export type EarnedCertificate = {
  id: string;
  user_id: string;
  certificate_type_id: string | null;
  custom_title: string | null;
  custom_description: string | null;
  verification_code: string;
  awarded_at: string;
  awarded_by: string | null;
  type: CertificateType | null;
  recipient_name: string | null;
  certificate_kind?: CertificateKind;
  exam_category?: string | null;
  test_name?: string | null;
  rank_text?: string | null;
  score?: number | null;
  maximum_marks?: number | null;
  issuer_name?: string | null;
  revoked_at?: string | null;
  revoke_reason?: string | null;
  title_snapshot?: string | null;
  description_snapshot?: string | null;
  subtitle_snapshot?: string | null;
  template_key_snapshot?: CertificateTemplateKey | null;
  category_snapshot?: string | null;
  details_snapshot?: { fields?: CertificateDetailValue[] } | Json;
  award_reason?: string | null;
};

function asCertificateType(value: unknown): CertificateType {
  const row = value as Record<string, unknown>;
  return {
    ...row,
    subtitle: typeof row.subtitle === "string" ? row.subtitle : "",
    template_key: (row.template_key as CertificateTemplateKey) || "ornate",
    certificate_kind: (row.certificate_kind as CertificateKind) || "achievement",
    issuer_name: typeof row.issuer_name === "string" ? row.issuer_name : "JEE Prep Hub Team",
    detail_fields: Array.isArray(row.detail_fields)
      ? row.detail_fields.filter(isCertificateDetailField).sort((a, b) => a.order - b.order)
      : [],
    eligibility_config:
      row.eligibility_config && typeof row.eligibility_config === "object"
        ? (row.eligibility_config as EligibilityConfig)
        : { mode: "manual" },
    is_enabled: row.is_enabled !== false,
  } as CertificateType;
}

function visibleFields(type: CertificateType): CertificateDetailField[] {
  return type.detail_fields.filter((field) => field.visible).sort((a, b) => a.order - b.order);
}

function detailSnapshot(fields: CertificateDetailValue[]): Json {
  return { fields: fields as unknown as Json[] } as Json;
}

function snapshotFields(snapshot: unknown): CertificateDetailValue[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const fields = (snapshot as { fields?: unknown }).fields;
  if (!Array.isArray(fields)) return [];
  return fields.filter(
    (field): field is CertificateDetailValue =>
      !!field &&
      typeof field === "object" &&
      typeof (field as CertificateDetailValue).key === "string" &&
      typeof (field as CertificateDetailValue).label === "string" &&
      typeof (field as CertificateDetailValue).value === "string" &&
      !!(field as CertificateDetailValue).value.trim(),
  );
}

function shortCode() {
  // Cryptographically secure, URL-safe, uppercase 12-char code (~72 bits entropy)
  return randomBytes(9)
    .toString("base64")
    .replace(/\+/g, "")
    .replace(/\//g, "")
    .replace(/=/g, "")
    .toUpperCase()
    .slice(0, 12)
    .padEnd(12, "X");
}

// ---------- Streak computation ----------
function computeStreak(
  rows: { task_date: string }[],
  recoveredDates: string[] = [],
): { current: number; longest: number } {
  const dates = new Set<string>(rows.map((r) => r.task_date));
  for (const d of recoveredDates) dates.add(d);
  if (dates.size === 0) return { current: 0, longest: 0 };
  const sorted = [...dates].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of sorted) {
    const cur = new Date(d + "T00:00:00Z");
    if (prev && (cur.getTime() - prev.getTime()) / 86_400_000 === 1) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = cur;
  }
  // current streak from today (or yesterday) backwards
  const todayStr = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  let cursor = dates.has(todayStr) ? todayStr : dates.has(yest) ? yest : null;
  let current = 0;
  while (cursor && dates.has(cursor)) {
    current++;
    const d = new Date(cursor + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }
  return { current, longest };
}
// Streak of consecutive days with at least one Pomodoro session, in the user's local time.
function computePomodoroStreak(sessions: { ended_at: string }[]): {
  current: number;
  longest: number;
  totalDays: number;
} {
  if (sessions.length === 0) return { current: 0, longest: 0, totalDays: 0 };
  const dayKey = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const days = new Set(sessions.map((s) => dayKey(s.ended_at)));
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of sorted) {
    const cur = new Date(d + "T00:00:00");
    if (prev && (cur.getTime() - prev.getTime()) / 86_400_000 === 1) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = cur;
  }
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const yesterday = new Date(today.getTime() - 86_400_000);
  const yestKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  let cursor = days.has(todayKey) ? todayKey : days.has(yestKey) ? yestKey : null;
  let current = 0;
  while (cursor && days.has(cursor)) {
    current++;
    const d = new Date(cursor + "T00:00:00");
    d.setDate(d.getDate() - 1);
    cursor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return { current, longest, totalDays: days.size };
}

// ---------- Evaluator (server-side, runs as the user) ----------
async function evaluateForUser(sb: ReturnType<typeof publicClient>, userId: string) {
  const [typesRes, earnedRes, profileRes, sessionsRes, pomoRes, tasksRes, topicsRes] =
    await Promise.all([
      sb.from("certificate_types").select("*").order("sort_order"),
      sb.from("user_certificates").select("certificate_type_id").eq("user_id", userId),
      sb.from("profiles").select("created_at,full_name,verified").eq("id", userId).maybeSingle(),
      sb.from("study_sessions").select("duration_seconds").eq("user_id", userId),
      sb
        .from("study_sessions")
        .select("ended_at")
        .eq("user_id", userId)
        .eq("session_type", "pomodoro"),
      sb
        .from("daily_tasks")
        .select("task_date")
        .eq("user_id", userId)
        .eq("studied", true)
        .eq("practiced", true)
        .eq("revised", true),
      sb.from("topic_progress").select("subject, status").eq("user_id", userId),
    ]);
  for (const res of [typesRes, earnedRes, profileRes, sessionsRes, pomoRes, tasksRes, topicsRes]) {
    if (res.error) throw new Error(`Certificate eligibility query failed: ${res.error.message}`);
  }
  const types = (typesRes.data ?? []).map(asCertificateType).filter((type) => type.is_enabled);
  const earnedTypeIds = new Set(
    (earnedRes.data ?? []).map((row) => row.certificate_type_id).filter(Boolean) as string[],
  );
  const profile = profileRes.data;
  const memberDays = profile?.created_at
    ? Math.max(0, Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86_400_000))
    : 0;
  const totalSeconds = (sessionsRes.data ?? []).reduce(
    (sum, row) => sum + (row.duration_seconds ?? 0),
    0,
  );
  const totalHours = totalSeconds / 3600;
  const { longest: longestStreak } = computeStreak(tasksRes.data ?? []);
  const pomoSessions = (pomoRes.data ?? []) as { ended_at: string }[];
  const pomoCount = pomoSessions.length;
  const pomoStreak = computePomodoroStreak(pomoSessions);
  const masteryBySubject = new Map<string, { total: number; mastered: number }>();
  for (const topic of topicsRes.data ?? []) {
    const subject = (topic as { subject: string }).subject;
    const current = masteryBySubject.get(subject) ?? { total: 0, mastered: 0 };
    current.total++;
    if (["mastered", "completed"].includes((topic as { status: string }).status))
      current.mastered++;
    masteryBySubject.set(subject, current);
  }
  const normalizeSubject = (subject: string) => subject.toLowerCase().replace(/[^a-z]/g, "");
  const currentDetails: Record<string, string> = {
    membership_type: "JEE Prep Hub member",
    member_since: profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString("en-IN")
      : "",
    join_date: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN") : "",
    membership_duration: memberDays ? `${memberDays} days` : "",
    community_name: "JEE Prep Hub",
    consecutive_days: String(longestStreak || ""),
    completed_pomodoro_sessions: String(pomoCount || ""),
    total_study_hours: totalHours ? totalHours.toFixed(1) : "",
    sessions_completed: String((sessionsRes.data ?? []).length || ""),
    achievement_period: `As of ${new Date().toLocaleDateString("en-IN")}`,
  };
  const newlyEarned: Record<string, unknown>[] = [];
  const progress = {
    memberDays,
    totalHours,
    longestStreak,
    pomoCount,
    pomoStreakCurrent: pomoStreak.current,
    pomoStreakLongest: pomoStreak.longest,
    pomoActiveDays: pomoStreak.totalDays,
    mastery: Object.fromEntries(masteryBySubject),
  };
  if (!profile?.verified || !profile.full_name?.trim()) return { awarded: 0, progress };
  const metricValue = (
    metric: EligibilityMetric,
    config: Extract<EligibilityConfig, { mode: "automatic" }>,
  ) => {
    switch (metric) {
      case "membership_days":
        return memberDays;
      case "verified_member":
        return profile?.verified === true ? 1 : 0;
      case "daily_streak_days":
        return longestStreak;
      case "study_hours":
        return totalHours;
      case "pomodoro_sessions":
        return pomoCount;
      case "pomodoro_streak_days":
        return pomoStreak.longest;
      case "subject_mastery": {
        const requested = normalizeSubject(config.subject ?? "");
        const entry = [...masteryBySubject.entries()].find(
          ([subject]) => normalizeSubject(subject) === requested,
        )?.[1];
        return entry && entry.total > 0 && entry.total === entry.mastered ? 1 : 0;
      }
    }
  };
  for (const type of types) {
    if (earnedTypeIds.has(type.id) || type.eligibility_config.mode !== "automatic") continue;
    const config = type.eligibility_config;
    const observed = metricValue(config.metric, config);
    const required =
      config.metric === "verified_member" || config.metric === "subject_mastery"
        ? 1
        : config.threshold;
    if (!Number.isFinite(observed) || observed < required) continue;
    const dynamic: Record<string, string> = { ...currentDetails };
    if (config.metric === "verified_member") dynamic.membership_type = "Verified Member";
    if (config.metric === "subject_mastery") {
      dynamic.subject = config.subject ?? "";
      const matched = [...masteryBySubject.entries()].find(
        ([subject]) => normalizeSubject(subject) === normalizeSubject(config.subject ?? ""),
      )?.[1];
      if (matched) {
        dynamic.topics_completed = String(matched.total);
        dynamic.topics_mastered = String(matched.mastered);
        dynamic.mastery_percentage = "100%";
      }
      dynamic.achievement = "All tracked topics mastered";
    }
    const fields = visibleFields(type)
      .map((field) => ({
        key: field.key,
        label: field.label,
        value: dynamic[field.key] ?? "",
      }))
      .filter((field) => field.value.trim());
    if (
      visibleFields(type).some(
        (field) => field.required && !fields.some((value) => value.key === field.key),
      )
    )
      continue;
    const now = new Date().toISOString();
    newlyEarned.push({
      user_id: userId,
      certificate_type_id: type.id,
      verification_code: shortCode(),
      awarded_at: now,
      certificate_kind: type.certificate_kind,
      issuer_name: type.issuer_name,
      title_snapshot: type.name,
      description_snapshot: type.description,
      subtitle_snapshot: type.subtitle,
      template_key_snapshot: type.template_key,
      category_snapshot: type.category,
      details_snapshot: detailSnapshot(fields),
    });
  }
  if (newlyEarned.length) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const award of newlyEarned) {
      const { error } = await supabaseAdmin.from("user_certificates").insert(award as never);
      if (error && error.code !== "23505") {
        console.error("[certificates] automatic award insertion failed", { error: error.message });
        throw new Error("Could not issue an eligible certificate.");
      }
    }
  }
  return { awarded: newlyEarned.length, progress };
}

export const getPomodoroStreak = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    const ev = await evaluateForUser(sb, context.userId);
    // Fetch earned pomodoro badges for display
    const { data: earned } = await sb
      .from("user_certificates")
      .select(
        "certificate_type_id, awarded_at, certificate_types!inner(code, name, description, threshold, category)",
      )
      .eq("user_id", context.userId)
      .eq("certificate_types.category", "pomodoro")
      .order("awarded_at", { ascending: false });
    const { data: allPomoTypes } = await sb
      .from("certificate_types")
      .select("id, code, name, description, threshold")
      .eq("category", "pomodoro")
      .order("sort_order");
    return {
      current: ev.progress.pomoStreakCurrent ?? 0,
      longest: ev.progress.pomoStreakLongest ?? 0,
      totalPomodoros: ev.progress.pomoCount ?? 0,
      activeDays: ev.progress.pomoActiveDays ?? 0,
      newlyAwarded: ev.awarded,
      earnedBadges: (earned ?? []) as Array<{
        certificate_type_id: string | null;
        awarded_at: string;
        certificate_types: {
          code: string;
          name: string;
          description: string;
          threshold: number | null;
          category: string;
        };
      }>,
      allBadges: (allPomoTypes ?? []) as Array<{
        id: string;
        code: string;
        name: string;
        description: string;
        threshold: number | null;
      }>,
    };
  });

// ---------- Server functions ----------
export const getMyCertificateData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    const evalResult = await evaluateForUser(sb, context.userId);
    const [typesRes, earnedRes, profileRes] = await Promise.all([
      sb.from("certificate_types").select("*").order("sort_order"),
      sb
        .from("user_certificates")
        .select("*, certificate_types(*)")
        .eq("user_id", context.userId)
        .order("awarded_at", { ascending: false }),
      sb.from("profiles").select("full_name").eq("id", context.userId).maybeSingle(),
    ]);
    return {
      types: (typesRes.data ?? []).map(asCertificateType),
      earned: (earnedRes.data ?? []).map((row) => ({
        ...row,
        type: row.certificate_types ? asCertificateType(row.certificate_types) : null,
        recipient_name: profileRes.data?.full_name ?? "JEE Aspirant",
        details_snapshot: row.details_snapshot as EarnedCertificate["details_snapshot"],
      })) as unknown as EarnedCertificate[],
      progress: evalResult.progress,
      newlyAwarded: evalResult.awarded,
      recipientName: profileRes.data?.full_name ?? "JEE Aspirant",
    };
  });

export const getTodayTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const sb = context.supabase;
    const { data } = await sb
      .from("daily_tasks")
      .select("*")
      .eq("user_id", context.userId)
      .eq("task_date", today)
      .maybeSingle();
    const rows = await sb
      .from("daily_tasks")
      .select("task_date")
      .eq("user_id", context.userId)
      .or("studied.eq.true,practiced.eq.true,revised.eq.true");

    // Recoveries within last 30 days
    const sinceIso = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const recoveriesRes = await sb
      .from("streak_recoveries")
      .select("recovered_date, created_at")
      .eq("user_id", context.userId)
      .gte("recovered_date", sinceIso);
    const recoveries = (recoveriesRes.data ?? []) as {
      recovered_date: string;
      created_at: string;
    }[];
    const recoveredDates = recoveries.map((r) => r.recovered_date);

    const streak = computeStreak(rows.data ?? [], recoveredDates);
    // Signed-in users are active by definition — show at least day 1 from sign-in.
    if (streak.current < 1) streak.current = 1;
    if (streak.longest < 1) streak.longest = 1;

    // Eligibility: find most recent missed day in last 7 days that broke the streak
    const activeSet = new Set<string>((rows.data ?? []).map((r) => r.task_date));
    for (const d of recoveredDates) activeSet.add(d);
    const missedDates: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      if (!activeSet.has(d)) missedDates.push(d);
    }
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const recoveriesThisWeek = recoveries.filter((r) => r.created_at >= weekAgo).length;
    const todayHabitCount = data
      ? [data.studied, data.practiced, data.revised].filter(Boolean).length
      : 0;
    const remainingThisWeek = Math.max(0, 1 - recoveriesThisWeek);
    const eligibleDate =
      remainingThisWeek > 0 && todayHabitCount > 0 && missedDates.length > 0
        ? missedDates[0]
        : null;

    return {
      today: data ?? { studied: false, practiced: false, revised: false, task_date: today },
      streak,
      recovery: {
        eligibleDate,
        missedDates,
        remainingThisWeek,
        todayHabitCount,
        recoveredDates,
      },
    };
  });

const recoverSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export const recoverStreakDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => recoverSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const today = new Date().toISOString().slice(0, 10);
    if (data.date >= today) {
      throw new Error("You can only recover a past day.");
    }
    const earliest = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
    if (data.date < earliest) {
      throw new Error("Only the last 7 days can be recovered.");
    }

    // Today must have at least one habit done
    const todayRow = await sb
      .from("daily_tasks")
      .select("studied,practiced,revised")
      .eq("user_id", context.userId)
      .eq("task_date", today)
      .maybeSingle();
    const todayDone = todayRow.data
      ? [todayRow.data.studied, todayRow.data.practiced, todayRow.data.revised].filter(Boolean)
          .length
      : 0;
    if (todayDone === 0) {
      throw new Error("Complete at least one habit today to recover a missed day.");
    }

    // Limit: 1 recovery per rolling 7 days
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const recentRes = await sb
      .from("streak_recoveries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .gte("created_at", weekAgo);
    if ((recentRes.count ?? 0) >= 1) {
      throw new Error("You've already used your weekly streak recovery. Try again next week.");
    }

    const { error } = await sb
      .from("streak_recoveries")
      .insert({ user_id: context.userId, recovered_date: data.date });
    if (error) {
      if (error.code === "23505") throw new Error("That day is already recovered.");
      throw new Error(error.message || "Could not recover streak");
    }
    return { ok: true, recovered: data.date };
  });

const toggleSchema = z.object({
  kind: z.enum(["studied", "practiced", "revised"]),
  value: z.boolean(),
});

export const toggleDailyTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => toggleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    const existing = await sb
      .from("daily_tasks")
      .select("*")
      .eq("user_id", context.userId)
      .eq("task_date", today)
      .maybeSingle();
    const base = existing.data ?? { studied: false, practiced: false, revised: false };
    const next = { ...base, [data.kind]: data.value };
    const allDone = next.studied && next.practiced && next.revised;
    const completed_at = allDone ? new Date().toISOString() : null;

    if (existing.data) {
      const patch: {
        studied?: boolean;
        practiced?: boolean;
        revised?: boolean;
        completed_at: string | null;
      } = { completed_at };
      patch[data.kind] = data.value;
      await sb
        .from("daily_tasks")
        .update(patch)
        .eq("user_id", context.userId)
        .eq("task_date", today);
    } else {
      await sb.from("daily_tasks").insert({
        user_id: context.userId,
        task_date: today,
        studied: next.studied,
        practiced: next.practiced,
        revised: next.revised,
        completed_at,
      });
    }

    let awarded = 0;
    if (allDone) {
      const ev = await evaluateForUser(sb, context.userId);
      awarded = ev.awarded;
    }
    return { ok: true, awarded };
  });

export const verifyCertificate = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ code: z.string().min(4).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cert, error } = await supabaseAdmin
      .from("user_certificates")
      .select("*")
      .eq("verification_code", data.code)
      .maybeSingle();
    if (error) throw new Error("Certificate verification lookup failed.");
    if (!cert) return { found: false as const };
    const [typeRes, profileRes] = await Promise.all([
      cert.certificate_type_id
        ? supabaseAdmin
            .from("certificate_types")
            .select("*")
            .eq("id", cert.certificate_type_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabaseAdmin.from("profiles").select("full_name").eq("id", cert.user_id).maybeSingle(),
    ]);
    const safeType = typeRes.data ? asCertificateType(typeRes.data) : null;
    const certificate = {
      verification_code: cert.verification_code,
      awarded_at: cert.awarded_at,
      certificate_type_id: cert.certificate_type_id,
      custom_title: cert.custom_title,
      custom_description: cert.custom_description,
      certificate_kind: cert.certificate_kind as CertificateKind,
      exam_category: cert.exam_category,
      test_name: cert.test_name,
      rank_text: cert.rank_text,
      score: cert.score,
      maximum_marks: cert.maximum_marks,
      issuer_name: cert.issuer_name,
      revoked_at: cert.revoked_at,
      title_snapshot: cert.title_snapshot,
      description_snapshot: cert.description_snapshot,
      subtitle_snapshot: cert.subtitle_snapshot,
      template_key_snapshot: cert.template_key_snapshot as CertificateTemplateKey | null,
      category_snapshot: cert.category_snapshot,
      details_snapshot: cert.details_snapshot as EarnedCertificate["details_snapshot"],
    } as EarnedCertificate;
    return {
      found: true as const,
      certificate,
      type: safeType,
      recipientName: profileRes.data?.full_name ?? "JEE Aspirant",
      status: cert.revoked_at ? ("revoked" as const) : ("valid" as const),
    };
  });

// Public-facing certificate count for a given user (used on public profile pages).
// Uses service-role because RLS now restricts user_certificates reads to owner/admin,
// and only the count (no codes or metadata) is returned.
export const publicCertificateCount = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_certificates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", data.userId);
    return { count: count ?? 0 };
  });

// ---------- Admin ----------
async function assertAdmin(sb: ReturnType<typeof publicClient>, userId: string) {
  const { data } = await (
    sb as unknown as {
      rpc: (f: string, a: Record<string, unknown>) => PromiseLike<{ data: unknown }>;
    }
  ).rpc("has_permission", { _user_id: userId, _permission: "certificates" });
  if (!data) throw new Error("Forbidden");
}

const typeCategorySchema = z.enum([
  "membership",
  "streak",
  "hours",
  "mastery",
  "custom",
  "pomodoro",
  "social",
  "account_membership",
  "consistency",
  "academic",
  "test_series",
  "jee_neet",
  "community",
  "courses_events",
  "recognition",
]);
const typeTemplateSchema = z.enum([
  "ornate",
  "membership",
  "streak",
  "academic",
  "test-series",
  "course",
  "community",
  "recognition",
]);
const typeKindSchema = z.enum(["achievement", "participation", "completion", "appreciation"]);
const metricSchema = z.enum(
  ELIGIBILITY_METRICS.map((metric) => metric.value) as [EligibilityMetric, ...EligibilityMetric[]],
);
const detailFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{1,63}$/),
  label: z.string().trim().min(1).max(60),
  order: z.number().int().min(0).max(100),
  visible: z.boolean(),
  required: z.boolean(),
});
const eligibilitySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("manual") }),
  z.object({
    mode: z.literal("automatic"),
    metric: metricSchema,
    threshold: z.number().min(1).max(1_000_000),
    subject: z.string().trim().max(60).optional(),
  }),
]);
const manageTypeSchema = z
  .object({
    id: z.string().uuid().optional(),
    code: z.string().regex(/^[a-z0-9][a-z0-9_]{1,79}$/),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().min(1).max(500),
    subtitle: z.string().trim().max(180).default(""),
    category: typeCategorySchema,
    threshold: z.number().int().positive().nullable().optional(),
    icon: z.string().trim().max(40).nullable().optional(),
    sort_order: z.number().int().min(0).max(10000).default(0),
    template_key: typeTemplateSchema,
    certificate_kind: typeKindSchema,
    issuer_name: z.string().trim().min(1).max(120),
    detail_fields: z.array(detailFieldSchema).max(12),
    eligibility_config: eligibilitySchema,
    is_enabled: z.boolean(),
  })
  .superRefine((value, context) => {
    if (
      value.eligibility_config.mode === "automatic" &&
      value.eligibility_config.metric === "subject_mastery" &&
      !value.eligibility_config.subject?.trim()
    ) {
      context.addIssue({
        code: "custom",
        path: ["eligibility_config", "subject"],
        message: "Select the subject used for automatic mastery.",
      });
    }
  });

export const adminListCertificateTypes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    await assertAdmin(sb, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("certificate_types")
      .select("*")
      .order("sort_order")
      .order("name");
    if (error) throw new Error("Could not load certificate configurations.");
    return (data ?? []).map(asCertificateType);
  });

export const adminSaveCertificateType = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => manageTypeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    await assertAdmin(sb, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const fields = data.detail_fields.sort((a, b) => a.order - b.order);
    const payload = {
      name: data.name,
      description: data.description,
      subtitle: data.subtitle,
      category: data.category,
      threshold:
        data.eligibility_config.mode === "automatic"
          ? Math.round(data.eligibility_config.threshold)
          : null,
      icon: data.icon || null,
      sort_order: data.sort_order,
      template_key: data.template_key,
      certificate_kind: data.certificate_kind,
      issuer_name: data.issuer_name,
      detail_fields: fields as unknown as Json,
      eligibility_config: data.eligibility_config as unknown as Json,
      is_enabled: data.is_enabled,
    };
    let savedRow;
    if (data.id) {
      const awards = await supabaseAdmin
        .from("user_certificates")
        .select("id", { count: "exact", head: true })
        .eq("certificate_type_id", data.id);
      if (awards.error)
        throw new Error("Could not verify whether this definition has existing awards.");
      if ((awards.count ?? 0) > 0) {
        let version = 2;
        let versionCode = "";
        while (version < 1000) {
          versionCode = `${data.code.replace(/_v\d+$/, "").slice(0, 74)}_v${version}`;
          const { data: duplicate, error: lookupError } = await supabaseAdmin
            .from("certificate_types")
            .select("id")
            .eq("code", versionCode)
            .maybeSingle();
          if (lookupError) throw new Error("Could not select a safe version code.");
          if (!duplicate) break;
          version++;
        }
        if (!versionCode || version >= 1000)
          throw new Error("Could not generate a unique certificate type version.");
        // Insert disabled first; then stop the prior version, and only then enable
        // the new version. Any intermediate failure leaves no two active rules.
        const created = await supabaseAdmin
          .from("certificate_types")
          .insert({ ...payload, code: versionCode, is_enabled: false })
          .select("*")
          .single();
        if (created.error)
          throw new Error("Could not create a safe version of this certificate type.");
        const disabled = await supabaseAdmin
          .from("certificate_types")
          .update({ is_enabled: false })
          .eq("id", data.id);
        if (disabled.error)
          throw new Error(
            "New version was saved disabled, but the previous version could not be deactivated.",
          );
        const activated = await supabaseAdmin
          .from("certificate_types")
          .update({ is_enabled: data.is_enabled })
          .eq("id", created.data.id)
          .select("*")
          .single();
        if (activated.error)
          throw new Error(
            "The previous version is inactive; please reopen and activate the newly saved version.",
          );
        savedRow = activated.data;
      } else {
        const updated = await supabaseAdmin
          .from("certificate_types")
          .update(payload)
          .eq("id", data.id)
          .select("*")
          .single();
        if (updated.error) throw new Error("Could not save certificate type.");
        savedRow = updated.data;
      }
    } else {
      const created = await supabaseAdmin
        .from("certificate_types")
        .insert({ ...payload, code: data.code })
        .select("*")
        .single();
      if (created.error) {
        throw new Error(
          created.error.code === "23505"
            ? "A certificate type already uses this code."
            : "Could not save certificate type.",
        );
      }
      savedRow = created.data;
    }
    if (!savedRow) throw new Error("Could not save certificate type.");
    return asCertificateType(savedRow);
  });

export const adminListAwardRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    await assertAdmin(sb, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("certificate_award_requests")
      .select("*, certificate_types(*)")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error("Could not load certificate review requests.");
    const userIds = [...new Set((data ?? []).map((row) => row.user_id))];
    const profileRes = userIds.length
      ? await supabaseAdmin.from("profiles").select("id,full_name").in("id", userIds)
      : { data: [] };
    const profileMap = new Map(
      (profileRes.data ?? []).map((profile) => [profile.id, profile.full_name]),
    );
    return (data ?? []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      certificate_type_id: row.certificate_type_id,
      status: row.status,
      created_at: row.created_at,
      recipient_name: profileMap.get(row.user_id) ?? "JEE Aspirant",
      type: row.certificate_types ? asCertificateType(row.certificate_types) : null,
    }));
  });

const recordSchema = z.record(z.string().max(64), z.string().max(300));
const adminResolveRequestSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().min(5).max(300),
  details: recordSchema.optional().default({}),
});
export const adminResolveAwardRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => adminResolveRequestSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    await assertAdmin(sb, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const reqRes = await supabaseAdmin
      .from("certificate_award_requests")
      .select("*")
      .eq("id", data.id)
      .eq("status", "pending")
      .maybeSingle();
    if (reqRes.error || !reqRes.data) throw new Error("This review request is no longer pending.");
    if (data.decision === "approve") {
      const [typeRes, profileRes] = await Promise.all([
        supabaseAdmin
          .from("certificate_types")
          .select("*")
          .eq("id", reqRes.data.certificate_type_id)
          .eq("is_enabled", true)
          .maybeSingle(),
        supabaseAdmin
          .from("profiles")
          .select("full_name,verified")
          .eq("id", reqRes.data.user_id)
          .maybeSingle(),
      ]);
      if (!typeRes.data) throw new Error("The requested certificate type is disabled or missing.");
      if (!profileRes.data?.verified || !profileRes.data.full_name?.trim())
        throw new Error("Recipient must have a verified profile name before award.");
      const type = asCertificateType(typeRes.data);
      const fields = visibleFields(type)
        .map((field) => ({
          key: field.key,
          label: field.label,
          value: data.details[field.key]?.trim() ?? "",
        }))
        .filter((field) => field.value);
      const missing = visibleFields(type).find(
        (field) => field.required && !fields.some((value) => value.key === field.key),
      );
      if (missing) throw new Error(`Required certificate detail missing: ${missing.label}`);
      const priorAward = await supabaseAdmin
        .from("user_certificates")
        .select("id")
        .eq("award_request_id", reqRes.data.id)
        .maybeSingle();
      if (priorAward.error)
        throw new Error("Could not check whether this request was already issued.");
      if (!priorAward.data) {
        const certInsert = await supabaseAdmin.from("user_certificates").insert({
          award_request_id: reqRes.data.id,
          user_id: reqRes.data.user_id,
          certificate_type_id: type.id,
          verification_code: shortCode(),
          awarded_by: context.userId,
          certificate_kind: type.certificate_kind,
          issuer_name: type.issuer_name,
          title_snapshot: type.name,
          description_snapshot: type.description,
          subtitle_snapshot: type.subtitle,
          template_key_snapshot: type.template_key,
          category_snapshot: type.category,
          details_snapshot: detailSnapshot(fields),
          award_reason: data.reason,
        });
        if (certInsert.error && certInsert.error.code !== "23505")
          throw new Error("Could not issue certificate for the approved request.");
        if (certInsert.error?.code === "23505") {
          const raceCheck = await supabaseAdmin
            .from("user_certificates")
            .select("id")
            .eq("award_request_id", reqRes.data.id)
            .maybeSingle();
          if (!raceCheck.data)
            throw new Error("Could not issue certificate for the approved request.");
        }
      }
    }
    const { error } = await supabaseAdmin
      .from("certificate_award_requests")
      .update({
        status: data.decision === "approve" ? "approved" : "rejected",
        decided_at: new Date().toISOString(),
        decided_by: context.userId,
        review_reason: data.reason,
      })
      .eq("id", data.id)
      .eq("status", "pending");
    if (error) throw new Error("Could not record the certificate review decision.");
    return { ok: true, decision: data.decision };
  });

const adminAwardSchema = z
  .object({
    user_email: z.string().email(),
    certificate_type_id: z.string().uuid().nullable().optional(),
    title: z.string().trim().max(120).optional().default(""),
    description: z.string().trim().max(500).optional().default(""),
    subtitle: z.string().trim().max(180).optional().default(""),
    certificate_kind: typeKindSchema.default("achievement"),
    template_key: typeTemplateSchema.default("ornate"),
    category: z.string().trim().max(80).default("recognition"),
    details: recordSchema.optional().default({}),
    award_reason: z.string().trim().min(5, "Enter a reason for the award.").max(300),
    exam_category: z.string().trim().max(80).optional().default(""),
    test_name: z.string().trim().max(120).optional().default(""),
    rank_text: z.string().trim().max(80).optional().default(""),
    score: z.number().min(0).nullable().optional(),
    maximum_marks: z.number().positive().nullable().optional(),
    issuer_name: z.string().trim().max(120).optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.score != null && value.maximum_marks != null && value.score > value.maximum_marks)
      ctx.addIssue({
        code: "custom",
        path: ["score"],
        message: "Score cannot exceed maximum marks",
      });
  });

export const adminAwardCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => adminAwardSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    await assertAdmin(sb, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const target = list.data.users.find(
      (user) => user.email?.toLowerCase() === data.user_email.toLowerCase(),
    );
    if (!target) throw new Error("User not found with that email");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name,verified")
      .eq("id", target.id)
      .maybeSingle();
    if (!profile?.verified || !profile.full_name?.trim())
      throw new Error(
        "Student must have a verified profile name before a certificate can be issued.",
      );
    let title = data.title;
    let description = data.description;
    let subtitle = data.subtitle;
    let templateKey: CertificateTemplateKey = data.template_key;
    let kind: CertificateKind = data.certificate_kind;
    let category = data.category;
    let issuerName = data.issuer_name || "JEE Prep Hub Team";
    let savedFields: CertificateDetailValue[] = [];
    const certificateTypeId: string | null = data.certificate_type_id ?? null;
    if (certificateTypeId) {
      const typeRes = await supabaseAdmin
        .from("certificate_types")
        .select("*")
        .eq("id", certificateTypeId)
        .eq("is_enabled", true)
        .maybeSingle();
      if (!typeRes.data) throw new Error("Select an enabled certificate type.");
      const type = asCertificateType(typeRes.data);
      title = type.name;
      description = type.description;
      subtitle = type.subtitle;
      templateKey = type.template_key;
      kind = type.certificate_kind;
      category = type.category;
      issuerName = data.issuer_name || type.issuer_name;
      savedFields = visibleFields(type)
        .map((field) => ({
          key: field.key,
          label: field.label,
          value: data.details[field.key]?.trim() ?? "",
        }))
        .filter((field) => field.value);
      const missing = visibleFields(type).find(
        (field) => field.required && !savedFields.some((entry) => entry.key === field.key),
      );
      if (missing) throw new Error(`Required certificate detail missing: ${missing.label}`);
    } else {
      title = title || "Certificate of Recognition";
      description = description || data.award_reason;
      savedFields = Object.entries(data.details)
        .map(([key, value]) => ({ key, label: key.replaceAll("_", " "), value: value.trim() }))
        .filter((entry) => entry.value);
    }
    const legacyScore = data.score ?? (data.details.score ? Number(data.details.score) : null);
    const legacyMaximum =
      data.maximum_marks ??
      (data.details.maximum_marks ? Number(data.details.maximum_marks) : null);
    if (
      (legacyScore != null && !Number.isFinite(legacyScore)) ||
      (legacyMaximum != null && !Number.isFinite(legacyMaximum))
    )
      throw new Error("Score and maximum marks must be numeric.");
    if (legacyScore != null && legacyMaximum != null && legacyScore > legacyMaximum)
      throw new Error("Score cannot exceed maximum marks.");
    const { error } = await supabaseAdmin.from("user_certificates").insert({
      user_id: target.id,
      certificate_type_id: certificateTypeId,
      custom_title: title,
      custom_description: description,
      verification_code: shortCode(),
      awarded_by: context.userId,
      certificate_kind: kind,
      exam_category: data.exam_category || data.details.exam_category || null,
      test_name: data.test_name || data.details.test_name || null,
      rank_text: data.rank_text || data.details.rank || null,
      score: legacyScore,
      maximum_marks: legacyMaximum,
      issuer_name: issuerName,
      title_snapshot: title,
      description_snapshot: description,
      subtitle_snapshot: subtitle,
      template_key_snapshot: templateKey,
      category_snapshot: category,
      details_snapshot: detailSnapshot(savedFields),
      award_reason: data.award_reason,
    });
    if (error)
      throw new Error(
        error.code === "23505"
          ? "This certificate has already been automatically awarded."
          : "Could not issue certificate.",
      );
    return { ok: true };
  });

export const adminListCustomCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    await assertAdmin(sb, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_certificates")
      .select("*")
      .not("custom_title", "is", null)
      .order("awarded_at", { ascending: false })
      .limit(200);
    const userIds = Array.from(new Set((data ?? []).map((row) => row.user_id)));
    const profiles = userIds.length
      ? await supabaseAdmin.from("profiles").select("id,full_name").in("id", userIds)
      : { data: [] };
    const names = new Map((profiles.data ?? []).map((profile) => [profile.id, profile.full_name]));
    return (data ?? []).map((row) => ({
      ...row,
      type: null,
      recipient_name: names.get(row.user_id) ?? null,
    })) as unknown as EarnedCertificate[];
  });

export const adminRevokeCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        reason: z.string().trim().min(5).max(300).default("Revoked by certificate administrator"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    await assertAdmin(sb, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_certificates")
      .update({ revoked_at: new Date().toISOString(), revoke_reason: data.reason })
      .eq("id", data.id)
      .is("revoked_at", null);
    if (error) throw new Error("Could not revoke certificate.");
    return { ok: true };
  });
// ---------- WhatsApp channel follower ----------
export const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb7hM7223n3fQHZPlz0o";

export const getWhatsappChannelStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const typeRes = await sb
      .from("certificate_types")
      .select("id,is_enabled")
      .eq("code", "whatsapp_channel_follower")
      .maybeSingle();
    if (!typeRes.data)
      return { claimed: false, certificate: null, request: null, channelUrl: WHATSAPP_CHANNEL_URL };
    const [earnedRes, requestRes] = await Promise.all([
      sb
        .from("user_certificates")
        .select("id,verification_code,awarded_at")
        .eq("user_id", context.userId)
        .eq("certificate_type_id", typeRes.data.id)
        .maybeSingle(),
      sb
        .from("certificate_award_requests")
        .select("id,status,created_at")
        .eq("user_id", context.userId)
        .eq("certificate_type_id", typeRes.data.id)
        .maybeSingle(),
    ]);
    return {
      claimed: !!earnedRes.data,
      certificate: earnedRes.data ?? null,
      request: requestRes.data ?? null,
      channelUrl: WHATSAPP_CHANNEL_URL,
    };
  });

export const claimWhatsappChannelCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ confirmed: z.literal(true) }).parse(d))
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const typeRes = await sb
      .from("certificate_types")
      .select("id,is_enabled")
      .eq("code", "whatsapp_channel_follower")
      .maybeSingle();
    if (!typeRes.data?.is_enabled) throw new Error("This certificate is not currently available.");
    const existing = await sb
      .from("user_certificates")
      .select("id,verification_code")
      .eq("user_id", context.userId)
      .eq("certificate_type_id", typeRes.data.id)
      .maybeSingle();
    if (existing.data)
      return {
        ok: true,
        alreadyClaimed: true,
        alreadyRequested: false,
        verification_code: existing.data.verification_code,
      };
    const current = await sb
      .from("certificate_award_requests")
      .select("id,status")
      .eq("user_id", context.userId)
      .eq("certificate_type_id", typeRes.data.id)
      .maybeSingle();
    if (current.data)
      return {
        ok: true,
        alreadyClaimed: false,
        alreadyRequested: true,
        status: current.data.status,
      };
    const result = await sb
      .from("certificate_award_requests")
      .insert({ user_id: context.userId, certificate_type_id: typeRes.data.id })
      .select("id")
      .single();
    if (result.error && result.error.code !== "23505")
      throw new Error("Could not submit the award request.");
    return { ok: true, alreadyClaimed: false, alreadyRequested: !!result.error, status: "pending" };
  });
