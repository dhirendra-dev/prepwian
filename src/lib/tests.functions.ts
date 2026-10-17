import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSystemSecret } from "@/lib/system-secrets.server";
import { z } from "zod";

const ExamType = z.enum(["jee_main", "jee_advanced", "neet", "chapter_test", "unit_test", "full_syllabus", "mock_test", "pyq"]);
const Difficulty = z.enum(["easy", "moderate", "hard"]);
const SubjectKind = z.enum(["physics", "chemistry", "mathematics", "biology", "mixed"]);
const TestStatus = z.enum(["draft", "published", "scheduled", "archived"]);
const TestMode = z.enum(["practice", "live", "challenge", "daily", "weekly", "monthly"]);
const Visibility = z.enum(["public", "private"]);
const QuestionType = z.enum(["single", "multiple", "integer", "numerical", "range"]);
const PdfKind = z.enum(["questions", "answer_key"]);

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden: admin only");
}

export const listPublicTests = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Backend is not configured");
  const supa = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await supa.from("tests").select("id,name,description,exam_type,subject,difficulty,duration_min,total_marks,mode,status,starts_at,ends_at,is_premium,created_at").in("status", ["published", "scheduled"]).eq("visibility", "public").order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (!rows.length) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ids = rows.map((row: any) => row.id);
  // PostgREST caps rows per request (default 1000), which silently truncated
  // per-test counts once the question bank grew. Page through everything.
  const questions: Array<{ test_id: string; marks: number | null }> = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data: page, error: pe } = await supabaseAdmin
      .from("test_questions")
      .select("test_id,marks")
      .in("test_id", ids)
      .range(from, from + PAGE - 1);
    if (pe) throw new Error(pe.message);
    const rowsPage = page ?? [];
    questions.push(...(rowsPage as any));
    if (rowsPage.length < PAGE) break;
  }
  const counts = new Map<string, { count: number; marks: number }>();
  for (const q of questions ?? []) {
    const cur = counts.get(q.test_id) ?? { count: 0, marks: 0 };
    cur.count += 1;
    cur.marks += Number(q.marks ?? 0);
    counts.set(q.test_id, cur);
  }
  return rows.map((row: any) => ({ ...row, question_count: counts.get(row.id)?.count ?? 0, total_marks: counts.get(row.id)?.marks ?? Number(row.total_marks ?? 0) }));
});

export const getPublicTest = createServerFn({ method: "GET" }).inputValidator((d) => z.object({ testId: z.string().uuid() }).parse(d)).handler(async ({ data }) => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Backend is not configured");
  const supa = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data: test, error } = await supa.from("tests").select("id,name,description,exam_type,subject,chapters,difficulty,duration_min,total_marks,default_marks_per_question,default_negative_per_question,instructions,language,max_attempts,is_premium,mode,starts_at,ends_at,created_at,status,visibility").eq("id", data.testId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!test || !["published", "scheduled"].includes(test.status) || test.visibility !== "public") throw new Error("Test not found");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: marks, count } = await supabaseAdmin.from("test_questions").select("marks", { count: "exact" }).eq("test_id", data.testId);
  const totalMarks = (marks ?? []).reduce((sum: number, row: any) => sum + Number(row.marks ?? 0), 0);
  return { ...test, question_count: count ?? 0, total_marks: totalMarks || Number(test.total_marks ?? 0) };
});

export const startAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: test, error: te } = await supabase
      .from("tests").select("id,duration_min,max_attempts,status,visibility,starts_at,ends_at,mode")
      .eq("id", data.testId).maybeSingle();
    if (te || !test) throw new Error("Test not available");
    if (test.visibility !== "public" || !["published", "scheduled"].includes(test.status)) throw new Error("Test is not open");
    const now = Date.now();
    if (test.starts_at && now < new Date(test.starts_at).getTime()) throw new Error("Test has not started yet");
    if (test.ends_at && now > new Date(test.ends_at).getTime()) throw new Error("Test has ended");
    const { data: active } = await supabase
      .from("test_attempts").select("id,status").eq("test_id", data.testId).eq("user_id", userId).eq("status", "in_progress")
      .order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (active) return { attemptId: active.id, resumed: true };
    const { count: attemptsCount } = await supabase
      .from("test_attempts").select("id", { count: "exact", head: true })
      .eq("test_id", data.testId).eq("user_id", userId).in("status", ["submitted", "auto_submitted"]);
    if ((attemptsCount ?? 0) >= (test.max_attempts ?? 3)) throw new Error("You have reached the maximum attempts");
    const { data: qs } = await supabaseAdmin.from("test_questions").select("marks").eq("test_id", data.testId);
    if (!qs?.length) throw new Error("This test has no questions yet");
    const maxScore = (qs ?? []).reduce((a: number, r: any) => a + Number(r.marks || 0), 0);
    const { data: fullTest } = await supabase.from("tests").select("shuffle_questions,shuffle_options").eq("id", data.testId).maybeSingle();
    let question_order: string[] | null = null;
    let option_order: Record<string, string[]> | null = null;
    if (fullTest?.shuffle_questions || fullTest?.shuffle_options) {
      const { data: qrows } = await supabaseAdmin.from("test_questions").select("id").eq("test_id", data.testId).order("order_no");
      const qIds = (qrows ?? []).map((r: any) => r.id);
      if (fullTest?.shuffle_questions) {
        for (let i = qIds.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [qIds[i], qIds[j]] = [qIds[j], qIds[i]]; }
        question_order = qIds;
      }
      if (fullTest?.shuffle_options && qIds.length) {
        const { data: orows } = await supabaseAdmin.from("test_options").select("id,question_id").in("question_id", qIds).order("order_no");
        const byQ: Record<string, string[]> = {};
        for (const o of orows ?? []) { (byQ[o.question_id] ??= []).push(o.id); }
        for (const k of Object.keys(byQ)) {
          const arr = byQ[k];
          for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
        }
        option_order = byQ;
      }
    }
    const { data: created, error: ce } = await supabase
      .from("test_attempts")
      .insert({ test_id: data.testId, user_id: userId, max_score: maxScore, question_order, option_order })
      .select("id").single();
    if (ce || !created) throw new Error(ce?.message ?? "Could not start attempt");
    return { attemptId: created.id, resumed: false };
  });

export const getAttemptForPlayer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ attemptId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: attempt, error } = await supabase
      .from("test_attempts").select("id,test_id,user_id,started_at,submitted_at,duration_sec,status,question_order,option_order,tab_switch_count,fullscreen_exit_count")
      .eq("id", data.attemptId).maybeSingle();
    if (error || !attempt) throw new Error("Attempt not found");
    if (attempt.user_id !== userId) throw new Error("Forbidden");
    const { data: test } = await supabase.from("tests")
      .select("id,name,duration_min,total_marks,instructions,mode,starts_at,ends_at,subject,exam_type,sections,navigation_mode")
      .eq("id", attempt.test_id).maybeSingle();
    if (!test) throw new Error("Test missing");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rawQuestions } = await supabaseAdmin
      .from("test_questions")
      .select("id,order_no,question_type,question_text,image_url,images,subject,chapter,topic,section,marks,negative_marks,unanswered_marks,partial_marking")
      .eq("test_id", attempt.test_id).is("archived_at", null).eq("archived", false).order("order_no");
    let questions = rawQuestions ?? [];
    if (attempt.question_order && Array.isArray(attempt.question_order) && attempt.question_order.length) {
      const byId = new Map(questions.map((q: any) => [q.id, q]));
      questions = attempt.question_order.map((id: string) => byId.get(id)).filter(Boolean);
    }
    const qIds = questions.map((q: any) => q.id);
    const { data: rawOptions } = qIds.length
      ? await supabaseAdmin.from("test_options").select("id,question_id,label,text,image_path,order_no").in("question_id", qIds).order("order_no")
      : { data: [] as any[] };
    let options = rawOptions ?? [];
    if (attempt.option_order && typeof attempt.option_order === "object") {
      const byId = new Map(options.map((o: any) => [o.id, o]));
      const reordered: any[] = [];
      for (const [qid, ids] of Object.entries(attempt.option_order)) {
        for (const oid of (ids as string[])) { const o = byId.get(oid); if (o) reordered.push(o); }
      }
      for (const o of options) if (!reordered.find(r => r.id === o.id)) reordered.push(o);
      options = reordered;
    }
    const { data: responses } = await supabase.from("test_responses").select("question_id,selected_option_ids,numerical_answer,marked_for_review,visited,time_spent_sec,updated_at").eq("attempt_id", data.attemptId);
    const eng = await import("./test-engine.server");
    const imageUrls = await eng.signPaths(supabaseAdmin, eng.collectPaths(questions, options, false));
    return { attempt, test, questions, options, responses: responses ?? [], imageUrls };
  });

const SaveResponseInput = z.object({
  attemptId: z.string().uuid(), questionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).default([]),
  numericalAnswer: z.number().nullable().optional(),
  markedForReview: z.boolean().default(false), visited: z.boolean().default(true),
  timeSpentSec: z.number().int().nonnegative().default(0),
});

export const saveResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveResponseInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: att, error: attErr } = await supabase.from("test_attempts").select("id,user_id,status,test_id").eq("id", data.attemptId).maybeSingle();
    if (attErr) throw new Error(attErr.message);
    if (!att || att.user_id !== userId) throw new Error("Forbidden");
    if (att.status !== "in_progress") throw new Error("Attempt already submitted");

    // Question rows may be hidden from students by RLS during a live test; verify with the admin client.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: question, error: qErr } = await supabaseAdmin
      .from("test_questions")
      .select("id")
      .eq("id", data.questionId)
      .eq("test_id", att.test_id)
      .maybeSingle();
    if (qErr) throw new Error(qErr.message);
    if (!question) throw new Error("Question does not belong to this test");
    const { error } = await supabase.from("test_responses").upsert({
      attempt_id: data.attemptId, question_id: data.questionId,
      selected_option_ids: data.selectedOptionIds, numerical_answer: data.numericalAnswer ?? null,
      marked_for_review: data.markedForReview, visited: data.visited, time_spent_sec: data.timeSpentSec,
    }, { onConflict: "attempt_id,question_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ attemptId: z.string().uuid(), auto: z.boolean().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: att } = await supabase.from("test_attempts").select("*").eq("id", data.attemptId).maybeSingle();
    if (!att || att.user_id !== userId) throw new Error("Forbidden");
    if (att.status !== "in_progress") return { ok: true, alreadySubmitted: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: qs } = await supabaseAdmin
      .from("test_questions")
      .select("id,question_type,marks,negative_marks,unanswered_marks,partial_marking,correct_numerical,numerical_tolerance,range_min,range_max,test_options(id,is_correct)")
      .eq("test_id", att.test_id).is("archived_at", null).eq("archived", false);
    const { data: responses } = await supabase.from("test_responses").select("*").eq("attempt_id", att.id);
    const rmap = new Map((responses ?? []).map((r: any) => [r.question_id, r]));
    const eng = await import("./test-engine.server");
    let score = 0, correct = 0, wrong = 0, skipped = 0, neg = 0, maxScore = 0;
    const updates: any[] = [];
    for (const q of qs ?? []) {
      maxScore += Number(q.marks || 0);
      const r: any = rmap.get(q.id);
      const g = eng.gradeQuestion(q, r);
      score += g.awarded;
      if (!g.answered) { skipped++; if (r) updates.push({ id: r.id, is_correct: null, marks_awarded: g.awarded }); continue; }
      if (g.awarded > 0) correct++; else { wrong++; if (g.awarded < 0) neg += -g.awarded; }
      updates.push({ id: r.id, is_correct: g.isCorrect, marks_awarded: g.awarded });
    }
    // Batch the response grading in parallel so submitting feels instant.
    await Promise.all(
      updates.map((u) =>
        supabaseAdmin.from("test_responses").update({ is_correct: u.is_correct, marks_awarded: u.marks_awarded }).eq("id", u.id),
      ),
    );
    const total = correct + wrong + skipped;
    const accuracy = correct + wrong > 0 ? (correct / (correct + wrong)) * 100 : 0;
    const duration_sec = Math.max(1, Math.floor((Date.now() - new Date(att.started_at).getTime()) / 1000));
    const { error } = await supabase.from("test_attempts").update({
      submitted_at: new Date().toISOString(),
      results_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      duration_sec, score, max_score: maxScore,
      correct_count: correct, wrong_count: wrong, skipped_count: skipped, accuracy, negative_total: neg,
      status: data.auto ? "auto_submitted" : "submitted",
    }).eq("id", att.id);
    if (error) throw new Error(error.message);
    try {
      await (supabase as any).rpc("award_action_xp", {
        p_source_type: "test_series",
        p_source_id: att.id,
        p_reason: "Completed a test series",
      });
    } catch {
      // XP rewards are additive and must not block result generation.
    }
    try {
      const { data: pct } = await supabase.rpc("compute_test_percentile", { _attempt_id: att.id });
      if (pct != null) await supabase.from("test_attempts").update({ percentile: pct }).eq("id", att.id);
    } catch { /* non-fatal */ }
    return { ok: true, attemptId: att.id, score, maxScore, correct, wrong, skipped, total, accuracy, resultsInSec: 120 };
  });

export const getAttemptResult = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ attemptId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: att } = await supabase.from("test_attempts").select("*").eq("id", data.attemptId).maybeSingle();
    if (!att || (att.user_id !== userId)) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: test } = await supabaseAdmin.from("tests").select("id,name,exam_type,subject,duration_min,total_marks,sections,solution_visibility,ends_at").eq("id", att.test_id).maybeSingle();
    // Results are published 2 minutes after submission.
    const readyAt = att.results_at ? new Date(att.results_at).getTime() : null;
    if (att.status === "in_progress" || (readyAt !== null && readyAt > Date.now())) {
      return { locked: true as const, grading: att.status === "in_progress", resultsAt: att.results_at, test, attempt: null, questions: [], options: [], responses: [] };
    }
    const { data: questions } = await supabaseAdmin.from("test_questions").select("*").eq("test_id", att.test_id).order("order_no");
    const qIds = (questions ?? []).map((q: any) => q.id);
    const { data: options } = qIds.length ? await supabaseAdmin.from("test_options").select("*").in("question_id", qIds).order("order_no") : { data: [] as any[] };
    const { data: responses } = await supabase.from("test_responses").select("*").eq("attempt_id", att.id);
    const vis = (test as any)?.solution_visibility ?? "after_submit";
    const showSolutions = vis === "after_submit" || (vis === "after_end" && (!(test as any)?.ends_at || new Date((test as any).ends_at).getTime() <= Date.now()));
    const answeredIds = new Set((responses ?? []).map((r: any) => r.question_id));
    const qs = (questions ?? []).filter((q: any) => !q.archived_at || answeredIds.has(q.id)).map((q: any) => showSolutions ? q : { ...q, explanation: null, solution_images: [] });
    const eng = await import("./test-engine.server");
    const imageUrls = await eng.signPaths(supabaseAdmin, eng.collectPaths(qs, options ?? [], showSolutions));
    return { locked: false as const, grading: false, resultsAt: att.results_at, attempt: att, test, questions: qs, options: options ?? [], responses: responses ?? [], imageUrls, showSolutions };
  });


export const listMyAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data } = await supabase.from("test_attempts").select("id,test_id,started_at,submitted_at,score,max_score,accuracy,status,tests(name,exam_type)").eq("user_id", userId).order("started_at", { ascending: false }).limit(100);
    return data ?? [];
  });

export const getTestLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    // RLS on test_attempts only exposes your own rows, so use the definer RPC
    // that returns every submitted attempt for this test (safe columns only).
    const { data: rows, error } = await supabase.rpc("test_leaderboard", { _test_id: data.testId });
    if (error) throw error;
    const list = ((rows ?? []) as any[]).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      score: r.score,
      accuracy: r.accuracy,
      duration_sec: r.duration_sec,
      submitted_at: r.submitted_at,
      profiles: { full_name: r.full_name, username: r.username, avatar_url: r.avatar_url },
    }));
    const meIndex = list.findIndex((a) => a.user_id === userId);
    return { top: list, myRank: meIndex >= 0 ? meIndex + 1 : null, attemptCount: list.length };
  });


export const toggleBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: existing } = await supabase.from("test_bookmarks").select("test_id").eq("user_id", userId).eq("test_id", data.testId).maybeSingle();
    if (existing) { await supabase.from("test_bookmarks").delete().eq("user_id", userId).eq("test_id", data.testId); return { bookmarked: false }; }
    await supabase.from("test_bookmarks").insert({ user_id: userId, test_id: data.testId });
    return { bookmarked: true };
  });

export const listMyBookmarks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data } = await supabase.from("test_bookmarks").select("test_id,tests(id,name,exam_type,subject,difficulty,duration_min,total_marks,status,visibility)").eq("user_id", userId);
    return (data ?? []).map((r: any) => r.tests).filter((t: any) => t && t.status === "published" && t.visibility === "public");
  });

export const reportQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ questionId: z.string().uuid(), reason: z.string().min(3).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await supabase.from("test_reports").insert({ question_id: data.questionId, user_id: userId, reason: data.reason });
    return { ok: true };
  });

const SectionInput = z.object({ name: z.string().min(1).max(80), subject: SubjectKind.optional().nullable(), question_count: z.number().int().min(0).optional() });
const TestInput = z.object({
  name: z.string().min(2).max(160), description: z.string().max(4000).optional().nullable(),
  exam_type: ExamType, subject: SubjectKind, chapters: z.array(z.string()).default([]), difficulty: Difficulty,
  duration_min: z.number().int().min(1).max(720), default_marks_per_question: z.number().min(0).max(20).default(4),
  default_negative_per_question: z.number().min(0).max(20).default(1), instructions: z.string().max(4000).optional().nullable(),
  language: z.string().max(40).default("english"), max_attempts: z.number().int().min(1).max(50).default(3),
  is_premium: z.boolean().default(false), visibility: Visibility.default("public"), status: TestStatus.default("draft"),
  mode: TestMode.default("practice"), starts_at: z.string().nullable().optional(), ends_at: z.string().nullable().optional(),
  // Test Series 2.0 settings
  sections: z.array(SectionInput).optional().nullable(),
  navigation_mode: z.enum(["free", "section_lock"]).optional().nullable(),
  solution_visibility: z.enum(["after_submit", "after_end", "never"]).optional().nullable(),
  default_marking_scheme: z.record(z.string(), z.any()).optional().nullable(),
});
const CreatorTestInput = TestInput.omit({ status: true, visibility: true, is_premium: true }).extend({ name: z.string().trim().min(2).max(160) });

async function requireOwnedEditableTest(supabase: any, testId: string, userId: string) {
  const { data: test } = await supabase.from("tests").select("id,created_by,status,approval_status").eq("id", testId).maybeSingle();
  if (!test || test.created_by !== userId) throw new Error("Test not found");
  if (test.status !== "draft" || !["draft", "rejected"].includes(test.approval_status)) throw new Error("This test is locked while it is being reviewed or published");
  return test;
}

export const createMyTestDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreatorTestInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: created, error } = await supabase.from("tests").insert({ ...data, created_by: userId, status: "draft", visibility: "private", is_premium: false, approval_status: "draft" }).select("id").single();
    if (error || !created) throw new Error(error?.message ?? "Could not create test");
    return { id: created.id };
  });

export const listMyCreatedTests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data, error } = await supabase.from("tests").select("id,name,exam_type,subject,duration_min,total_marks,status,approval_status,review_notes,created_at").eq("created_by", userId).order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyCreatedTest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: test } = await supabase.from("tests").select("*").eq("id", data.testId).eq("created_by", userId).maybeSingle();
    if (!test) throw new Error("Test not found");
    const { data: uploads } = await supabase.from("test_pdf_uploads").select("id,file_name,kind,status,question_count,error,created_at").eq("test_id", data.testId).order("created_at", { ascending: false });
    const { count } = await supabase.from("test_questions").select("id", { count: "exact", head: true }).eq("test_id", data.testId);
    return { test, uploads: uploads ?? [], questionCount: count ?? 0 };
  });

export const updateMyTestDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid(), patch: CreatorTestInput.partial() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await requireOwnedEditableTest(supabase, data.testId, userId);
    const { error } = await supabase.from("tests").update({ ...data.patch, approval_status: "draft", review_notes: null }).eq("id", data.testId).eq("created_by", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadMyTestPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid(), fileName: z.string().min(1).max(300), contentBase64: z.string().min(20), kind: PdfKind }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await requireOwnedEditableTest(supabase, data.testId, userId);
    const bytes = Buffer.from(data.contentBase64, "base64");
    if (bytes.length > 20 * 1024 * 1024) throw new Error("PDF is too large (max 20 MB)");
    if (bytes.subarray(0, 4).toString() !== "%PDF") throw new Error("The selected file is not a valid PDF");
    const safeName = data.fileName.replace(/[^a-z0-9._-]/gi, "_").slice(0, 120);
    const path = `${userId}/${data.testId}/${data.kind}-${Date.now()}-${safeName}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: uploadError } = await supabaseAdmin.storage.from("test-pdfs").upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const { data: row, error } = await supabase.from("test_pdf_uploads").insert({ test_id: data.testId, uploaded_by: userId, file_path: path, file_name: data.fileName, kind: data.kind, status: "uploaded" }).select("id").single();
    if (error || !row) throw new Error(error?.message ?? "Could not save upload");
    return { id: row.id };
  });

const CBT_SYSTEM_PROMPT = "You convert JEE coaching papers and their answer keys into accurate CBT data. Match every answer-key entry to its question. Return JSON only as {questions:[...]}. Each question requires order_no, question_type (single|multiple|integer|numerical), question_text with LaTeX in $...$, subject, chapter, marks, negative_marks, explanation, options [{label,text,is_correct}], correct_numerical, numerical_tolerance. Include every question and never invent missing text.";

function parseAiJson(text: string) {
  try {
    return JSON.parse(text || "{}");
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The AI returned an unreadable response. Try again.");
    return JSON.parse(match[0]);
  }
}

// Google retires model ids over time (gemini-2.5-flash 404s for new keys), so try current ids in order.
const GEMINI_MODEL_CANDIDATES = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];

async function callGeminiWithPdfs(apiKey: string, instruction: string, pdfs: { base64: string }[]) {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: CBT_SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [
      { text: instruction },
      ...pdfs.map((p) => ({ inlineData: { mimeType: "application/pdf", data: p.base64 } })),
    ] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
  });
  let lastError = "";
  for (const model of GEMINI_MODEL_CANDIDATES) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body },
    );
    if (response.ok) {
      const result = await response.json();
      const text = (result?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p?.text ?? "").join("");
      return parseAiJson(text);
    }
    const errorBody = await response.text();
    lastError = `${response.status}: ${errorBody.slice(0, 300)}`;
    if (response.status === 404) continue; // model retired for this key — try the next one
    if (response.status === 400 && /API key/i.test(errorBody)) throw new Error("Your Gemini API key was rejected. Create a new key at aistudio.google.com/app/apikey");
    if (response.status === 403) throw new Error("Your Gemini API key does not have access. Check the key at aistudio.google.com/app/apikey");
    if (response.status === 429) throw new Error("Your Gemini key hit its rate limit. Wait a minute and retry.");
    throw new Error(`Gemini conversion failed (${lastError})`);
  }
  throw new Error(`Gemini conversion failed — no supported model for your key (${lastError})`);
}


// Site AI without a personal key is NEVER automatic: it requires an explicit, per-user
// admin-approved exemption in ai_key_exemptions.
async function resolveAiAccess(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("ai_key_exemptions")
    .select("status,reason,admin_note,requested_at,reviewed_at")
    .eq("user_id", userId)
    .maybeSingle();
  const status = (row?.status ?? null) as "pending" | "approved" | "rejected" | null;
  return {
    // Site AI has been removed platform-wide: everyone brings their own Gemini key.
    allowed: false,
    status,
    requested_at: row?.requested_at ?? null,
    reviewed_at: row?.reviewed_at ?? null,
    admin_note: row?.admin_note ?? null,
  };
}

export const getMyAiAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => resolveAiAccess((context as any).userId));

export const requestAiKeyExemption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ reason: z.string().trim().max(500).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context as any;
    if (claims?.is_anonymous) throw new Error("Create a full account to request AI access.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("ai_key_exemptions").select("status").eq("user_id", userId).maybeSingle();
    if (existing?.status === "approved") return { status: "approved" as const };
    if (existing?.status === "pending") return { status: "pending" as const };
    const payload = { user_id: userId, status: "pending", reason: data.reason ?? null, requested_at: new Date().toISOString(), reviewed_by: null, reviewed_at: null, admin_note: null };
    const { error } = await supabaseAdmin.from("ai_key_exemptions").upsert(payload, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    const { data: admins } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    if (admins?.length) {
      await supabaseAdmin.from("notifications").insert(
        admins.map((a: any) => ({
          title: "🔑 New request: AI access without a personal key",
          body: (data.reason ?? "").slice(0, 140) || "Review this request in CBT approvals.",
          link: "/admin/tests/approvals", audience: "user", target_user_id: a.user_id, created_by: userId,
        })),
      );
    }
    return { status: "pending" as const };
  });

export const adminListAiAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("ai_key_exemptions")
      .select("user_id,status,reason,admin_note,requested_at,reviewed_at")
      .order("requested_at", { ascending: false })
      .limit(300);
    const ids = (rows ?? []).map((r: any) => r.user_id);
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id,full_name,username,avatar_url").in("id", ids)
      : { data: [] as any[] };
    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return (rows ?? []).map((r: any) => ({ ...r, profile: byId.get(r.user_id) ?? null }));
  });

export const adminSetAiAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    user_id: z.string().uuid(),
    decision: z.enum(["approved", "rejected", "revoked"]),
    note: z.string().trim().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    if (data.decision === "revoked") {
      const { error } = await supabaseAdmin.from("ai_key_exemptions").delete().eq("user_id", data.user_id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("ai_key_exemptions").upsert(
        { user_id: data.user_id, status: data.decision, admin_note: data.note ?? null, reviewed_by: userId, reviewed_at: now },
        { onConflict: "user_id" },
      );
      if (error) throw new Error(error.message);
      await supabaseAdmin.from("notifications").insert({
        title: data.decision === "approved" ? "✨ Site AI unlocked for your CBT tests" : "🔑 AI access request declined",
        body: data.decision === "approved"
          ? "You no longer need your own Gemini API key — just upload your PDFs and tap Convert."
          : (data.note ?? "").slice(0, 180) || "You can keep using your own Gemini API key.",
        link: "/tests/create", audience: "user", target_user_id: data.user_id, created_by: userId,
      });
    }
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: `tests.ai_access_${data.decision}`,
      target_user_id: data.user_id, metadata: { note: data.note ?? null },
    });
    return { ok: true };
  });


export const convertMyPdfsToCbt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await requireOwnedEditableTest(supabase, data.testId, userId);
    const { data: uploads } = await supabase.from("test_pdf_uploads").select("*").eq("test_id", data.testId).eq("uploaded_by", userId).order("created_at", { ascending: false });
    const questionPdf = uploads?.find((u: any) => u.kind === "questions");
    const answerPdf = uploads?.find((u: any) => u.kind === "answer_key");
    if (!questionPdf || !answerPdf) throw new Error("Upload both the question paper and answer key PDF first");
    await supabase.from("test_pdf_uploads").update({ status: "parsing", error: null }).in("id", [questionPdf.id, answerPdf.id]);
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const downloadBase64 = async (path: string) => {
        const { data: file, error } = await supabaseAdmin.storage.from("test-pdfs").download(path);
        if (error || !file) throw new Error("Could not read an uploaded PDF");
        return Buffer.from(await file.arrayBuffer()).toString("base64");
      };
      const [questionBase64, answerBase64] = await Promise.all([downloadBase64(questionPdf.file_path), downloadBase64(answerPdf.file_path)]);
      const instruction = "The first PDF is the question paper and the second PDF is its answer key. Combine them into a complete CBT test.";
      const { data: exemption } = await supabaseAdmin.from("ai_key_exemptions").select("status").eq("user_id", userId).maybeSingle();
      const key = await getSystemSecret("google_gemini", "Primary key");
      if (!key) throw new Error("Gemini is not configured in System Control Center yet.");
      if (exemption?.status !== "approved") throw new Error("Request site AI access before converting PDFs.");
      const parsed = await callGeminiWithPdfs(key, instruction, [{ base64: questionBase64 }, { base64: answerBase64 }]);

      const questions = z.array(z.any()).min(1).parse(parsed.questions);
      const { data: oldQuestions } = await supabase.from("test_questions").select("id").eq("test_id", data.testId);
      if (oldQuestions?.length) await supabase.from("test_questions").delete().eq("test_id", data.testId);
      let imported = 0;
      for (const raw of questions.slice(0, 300)) {
        const type = QuestionType.catch("single").parse(raw.question_type);
        const numeric = type === "integer" || type === "numerical";
        const { data: created, error } = await supabase.from("test_questions").insert({
          test_id: data.testId, order_no: imported + 1, question_type: type,
          question_text: String(raw.question_text ?? "").trim().slice(0, 8000), subject: SubjectKind.nullable().catch(null).parse(raw.subject ?? null),
          chapter: raw.chapter ? String(raw.chapter).slice(0, 160) : null, marks: Number(raw.marks ?? 4), negative_marks: Number(raw.negative_marks ?? (numeric ? 0 : 1)),
          explanation: raw.explanation ? String(raw.explanation).slice(0, 8000) : null,
          correct_numerical: numeric && raw.correct_numerical != null ? Number(raw.correct_numerical) : null,
          numerical_tolerance: numeric ? Number(raw.numerical_tolerance ?? 0) : 0,
        }).select("id").single();
        if (error || !created) continue;
        if (!numeric && Array.isArray(raw.options)) {
          const options = raw.options.slice(0, 10).filter((o: any) => String(o.text ?? "").trim()).map((o: any, index: number) => ({
            question_id: created.id, label: String(o.label ?? String.fromCharCode(65 + index)).slice(0, 4), text: String(o.text).slice(0, 4000), is_correct: !!o.is_correct, order_no: index,
          }));
          if (options.length) await supabase.from("test_options").insert(options);
        }
        imported++;
      }
      if (!imported) throw new Error("No valid questions could be converted");
      const { data: markRows } = await supabase.from("test_questions").select("marks").eq("test_id", data.testId);
      const totalMarks = (markRows ?? []).reduce((sum: number, row: any) => sum + Number(row.marks ?? 0), 0);
      await supabase.from("tests").update({ total_marks: totalMarks }).eq("id", data.testId).eq("created_by", userId);
      await supabase.from("test_pdf_uploads").update({ status: "imported", question_count: imported }).in("id", [questionPdf.id, answerPdf.id]);
      return { imported };
    } catch (error: any) {
      await supabase.from("test_pdf_uploads").update({ status: "failed", error: error?.message ?? "Conversion failed" }).in("id", [questionPdf.id, answerPdf.id]);
      throw error;
    }
  });

export const submitMyTestForApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await requireOwnedEditableTest(supabase, data.testId, userId);
    const { count } = await supabase.from("test_questions").select("id", { count: "exact", head: true }).eq("test_id", data.testId);
    if (!count) throw new Error("Convert the PDFs into CBT questions before submitting");
    const { error } = await supabase.from("tests").update({ approval_status: "pending", review_notes: null }).eq("id", data.testId).eq("created_by", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReviewCreatedTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid(), decision: z.enum(["approved", "rejected"]), notes: z.string().trim().max(2000).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    if (data.decision === "rejected" && !data.notes) throw new Error("Add a reason so the creator can correct the test");
    const patch = data.decision === "approved"
      ? { approval_status: "approved", status: "published", visibility: "public", reviewed_by: userId, reviewed_at: new Date().toISOString(), review_notes: data.notes || null }
      : { approval_status: "rejected", status: "draft", visibility: "private", reviewed_by: userId, reviewed_at: new Date().toISOString(), review_notes: data.notes };
    const { error } = await supabase.from("tests").update(patch).eq("id", data.testId).eq("approval_status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListTests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { data } = await supabase.from("tests").select("*").order("created_at", { ascending: false }).limit(500);
    return data ?? [];
  });

export const adminGetTest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { data: test } = await supabase.from("tests").select("*").eq("id", data.testId).maybeSingle();
    if (!test) throw new Error("Test not found");
    // Answer-key columns are not exposed to the Data API — read them with the trusted client after the admin check.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: questions } = await supabaseAdmin.from("test_questions").select("*").eq("test_id", data.testId).order("order_no");
    const qIds = (questions ?? []).map((q: any) => q.id);
    const { data: options } = qIds.length ? await supabaseAdmin.from("test_options").select("*").in("question_id", qIds).order("order_no") : { data: [] as any[] };
    return { test, questions: questions ?? [], options: options ?? [] };
  });

export const adminCreateTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TestInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    // An admin-authored test needs no separate review step — the admin IS the reviewer.
    const { data: created, error } = await supabase
      .from("tests")
      .insert({ ...data, created_by: userId, approval_status: "approved", reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const adminUpdateTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid(), patch: TestInput.partial() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const patch: Record<string, any> = { ...data.patch };
    const goingLive = patch.status === "published" || patch.status === "scheduled";
    if (goingLive) {
      const { data: test } = await supabase.from("tests").select("approval_status,visibility").eq("id", data.testId).maybeSingle();
      // Publishing by an admin approves the test in the same action instead of dead-ending.
      if (test?.approval_status !== "approved") {
        patch.approval_status = "approved";
        patch.reviewed_by = userId;
        patch.reviewed_at = new Date().toISOString();
      }
      // A published test that is still private is invisible to learners — make it public unless
      // the admin explicitly asked for private in this same patch.
      if (patch.visibility === undefined && test?.visibility !== "public") patch.visibility = "public";
      // Never publish a test whose questions are invalid (missing answers, broken ranges, etc.).
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const eng = await import("./test-engine.server");
      const { data: qrows } = await supabaseAdmin
        .from("test_questions")
        .select("id,order_no,question_type,question_text,images,marks,correct_numerical,numerical_tolerance,range_min,range_max,test_options(id,text,image_path,is_correct)")
        .eq("test_id", data.testId).eq("archived", false).is("archived_at", null).order("order_no");
      if (!qrows?.length) throw new Error("Add at least one question before publishing");
      const invalid = (qrows as any[])
        .map((q) => ({ q, errs: eng.validateQuestion(q, q.test_options ?? []) }))
        .filter((x) => x.errs.length);
      if (invalid.length) {
        const first = invalid[0];
        throw new Error(`Cannot publish: Q${first.q.order_no} ${first.errs.join("; ")}${invalid.length > 1 ? ` (and ${invalid.length - 1} more invalid)` : ""}`);
      }
    }
    const { error, count } = await supabase.from("tests").update(patch, { count: "exact" }).eq("id", data.testId);
    if (error) throw new Error(error.message);
    if (count === 0) throw new Error("Could not update this test (no matching row or permission denied)");
    return { ok: true, status: patch.status ?? null, visibility: patch.visibility ?? null };
  });


export const adminDeleteTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("tests").delete().eq("id", data.testId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ImageRefInput = z.object({
  path: z.string().min(1).max(500),
  size: z.enum(["sm", "md", "lg", "full"]).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  caption: z.string().max(300).optional(),
});
const OptionInput = z.object({ id: z.string().uuid().optional(), label: z.string().min(1).max(4), text: z.string().max(4000).default(""), is_correct: z.boolean().default(false), order_no: z.number().int().default(0), image_path: z.string().max(500).optional().nullable() });
const QuestionInput = z.object({
  id: z.string().uuid().optional(), test_id: z.string().uuid(), order_no: z.number().int(), question_type: QuestionType,
  question_text: z.string().max(8000).default(""), image_url: z.string().url().optional().nullable(), subject: SubjectKind.optional().nullable(),
  chapter: z.string().max(160).optional().nullable(), marks: z.number().min(0).max(50), negative_marks: z.number().min(0).max(50),
  explanation: z.string().max(8000).optional().nullable(), correct_numerical: z.number().optional().nullable(),
  numerical_tolerance: z.number().min(0).max(1e9).default(0), options: z.array(OptionInput).default([]),
  // Test Series 2.0 fields
  images: z.array(ImageRefInput).default([]),
  topic: z.string().max(160).optional().nullable(),
  difficulty: Difficulty.optional().nullable(),
  exam_category: z.string().max(60).optional().nullable(),
  section: z.string().max(120).optional().nullable(),
  range_min: z.number().optional().nullable(),
  range_max: z.number().optional().nullable(),
  partial_marking: z.enum(["none", "jee_advanced", "proportional"]).default("none"),
  unanswered_marks: z.number().min(-10).max(10).default(0),
  solution_content: z.string().max(12000).optional().nullable(),
  solution_images: z.array(ImageRefInput).default([]),
  archived: z.boolean().default(false),
});

export const adminUpsertQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => QuestionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { options, id, ...q } = data;
    let questionId = id;
    if (id) { const { error } = await supabase.from("test_questions").update(q).eq("id", id); if (error) throw new Error(error.message); }
    else { const { data: created, error } = await supabase.from("test_questions").insert(q).select("id").single(); if (error) throw new Error(error.message); questionId = created.id; }
    if (options && options.length) {
      await supabase.from("test_options").delete().eq("question_id", questionId);
      const rows = options.map((o, i) => ({ ...o, order_no: o.order_no ?? i, question_id: questionId }));
      const { error } = await supabase.from("test_options").insert(rows);
      if (error) throw new Error(error.message);
    } else if (id) { await supabase.from("test_options").delete().eq("question_id", questionId); }
    return { id: questionId };
  });

export const adminUploadTestImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    fileName: z.string().min(1).max(300),
    contentBase64: z.string().min(20),
    contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]).default("image/png"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Buffer.from(data.contentBase64, "base64");
    if (bytes.length > 5 * 1024 * 1024) throw new Error("Image is too large (max 5 MB).");
    const safeName = data.fileName.replace(/[^a-z0-9._-]/gi, "_").slice(0, 120);
    const path = `${userId}/${Date.now()}-${safeName}`;
    const { error } = await supabaseAdmin.storage.from("test-images").upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { path };
  });

export const adminDeleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ questionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("test_questions").delete().eq("id", data.questionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReorderQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid(), order: z.array(z.string().uuid()) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    for (let i = 0; i < data.order.length; i++) { await supabase.from("test_questions").update({ order_no: i }).eq("id", data.order[i]).eq("test_id", data.testId); }
    return { ok: true };
  });

export const adminUploadTestPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid().optional().nullable(), fileName: z.string().min(1).max(300), contentBase64: z.string().min(20), kind: PdfKind.default("questions") }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Buffer.from(data.contentBase64, "base64");
    if (bytes.length > 25 * 1024 * 1024) throw new Error("PDF is too large (max 25 MB).");
    const safeName = data.fileName.replace(/[^a-z0-9._-]/gi, "_").slice(0, 120);
    const path = `${userId}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabaseAdmin.storage.from("test-pdfs").upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { data: row, error } = await supabase.from("test_pdf_uploads").insert({ test_id: data.testId ?? null, uploaded_by: userId, file_path: path, file_name: data.fileName, kind: data.kind, status: "uploaded" }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const adminParseTestPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ uploadId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: upload } = await supabase.from("test_pdf_uploads").select("*").eq("id", data.uploadId).maybeSingle();
    if (!upload) throw new Error("Upload not found");
    await supabase.from("test_pdf_uploads").update({ status: "parsing", error: null }).eq("id", data.uploadId);
    try {
      const { data: dl, error: dlErr } = await supabaseAdmin.storage.from("test-pdfs").download(upload.file_path);
      if (dlErr || !dl) throw new Error(dlErr?.message ?? "Could not read PDF");
      const buf = Buffer.from(await dl.arrayBuffer());
      const b64 = buf.toString("base64");
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) throw new Error("AI key is not configured");
      const systemPrompt = [
        "You are an expert JEE / NEET test paper parser.",
        "Convert the provided PDF into a structured JSON object of the shape { questions: Question[] }.",
        "Each Question has: order_no (int, sequential from 1), question_type (\"single\" | \"multiple\" | \"integer\" | \"numerical\"),",
        "question_text (verbatim from PDF; wrap math in $...$ using LaTeX), subject (\"physics\"|\"chemistry\"|\"mathematics\"|\"biology\" or null),",
        "chapter (string or null), marks (default 4), negative_marks (default 1 for MCQ, 0 for numerical/integer),",
        "options (array of { label: \"A\"|\"B\"|\"C\"|\"D\", text, is_correct }) — empty for numerical/integer,",
        "correct_numerical (number, only for integer/numerical, else null), numerical_tolerance (0 for integer, 0.01 for decimals unless specified).",
        "If the correct option or numerical answer is NOT explicit in the PDF, set is_correct=false on all options and correct_numerical=null; the admin will fix it in review.",
        "Include EVERY question. Return ONLY compact valid JSON — no prose, no markdown fences.",
      ].join(" ");
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: [
              { type: "text", text: "Parse every question in this PDF into the specified JSON format." },
              { type: "file", file: { filename: upload.file_name, file_data: `data:application/pdf;base64,${b64}` } },
            ] },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        if (resp.status === 429) throw new Error("AI is rate-limited. Try again in a moment.");
        if (resp.status === 402) throw new Error("AI credits exhausted — add credits from workspace billing.");
        throw new Error(`AI error ${resp.status}: ${txt.slice(0, 400)}`);
      }
      const json = await resp.json();
      const content = json?.choices?.[0]?.message?.content ?? "{}";
      let parsed: any;
      try { parsed = JSON.parse(content); } catch { throw new Error("AI returned invalid JSON — try re-running parse."); }
      const questions = Array.isArray(parsed) ? parsed : (parsed.questions ?? parsed.items ?? parsed.data ?? []);
      await supabase.from("test_pdf_uploads").update({ status: "parsed", parsed_json: { questions }, question_count: Array.isArray(questions) ? questions.length : 0 }).eq("id", data.uploadId);
      return { ok: true, count: Array.isArray(questions) ? questions.length : 0 };
    } catch (e: any) {
      await supabase.from("test_pdf_uploads").update({ status: "failed", error: e?.message ?? "Unknown error" }).eq("id", data.uploadId);
      throw e;
    }
  });

export const adminGetPdfUpload = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ uploadId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { data: row } = await supabase.from("test_pdf_uploads").select("*").eq("id", data.uploadId).maybeSingle();
    if (!row) throw new Error("Not found");
    return row;
  });

export const adminListPdfUploads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    let q = supabase.from("test_pdf_uploads").select("*").order("created_at", { ascending: false }).limit(50);
    if (data.testId) q = q.eq("test_id", data.testId);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const adminImportParsedQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ uploadId: z.string().uuid(), testId: z.string().uuid(), questions: z.array(z.any()) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { data: existing } = await supabase.from("test_questions").select("order_no").eq("test_id", data.testId).order("order_no", { ascending: false }).limit(1);
    let orderStart = (existing?.[0]?.order_no ?? 0);
    let imported = 0;
    for (const q of data.questions) {
      orderStart += 1;
      const type = ["single","multiple","integer","numerical"].includes(q.question_type) ? q.question_type : "single";
      const isNumeric = type === "numerical" || type === "integer";
      const { data: created, error } = await supabase.from("test_questions").insert({
        test_id: data.testId, order_no: orderStart, question_type: type, question_text: String(q.question_text ?? "").slice(0, 8000),
        subject: q.subject ?? null, chapter: q.chapter ?? null, marks: Number(q.marks ?? 4), negative_marks: Number(q.negative_marks ?? (isNumeric ? 0 : 1)),
        explanation: q.explanation ?? null, correct_numerical: isNumeric && q.correct_numerical != null ? Number(q.correct_numerical) : null,
        numerical_tolerance: isNumeric ? Number(q.numerical_tolerance ?? 0) : 0,
      }).select("id").single();
      if (error || !created) continue;
      if (!isNumeric && Array.isArray(q.options) && q.options.length) {
        const rows = q.options.slice(0, 10).map((o: any, i: number) => ({ question_id: created.id, label: String(o.label ?? String.fromCharCode(65 + i)).slice(0, 4), text: String(o.text ?? "").slice(0, 4000), is_correct: !!o.is_correct, order_no: i }));
        await supabase.from("test_options").insert(rows);
      }
      imported++;
    }
    await supabase.from("test_pdf_uploads").update({ status: "imported", test_id: data.testId }).eq("id", data.uploadId);
    return { imported };
  });

export const adminGenerateExplanation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ questionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: q } = await supabaseAdmin.from("test_questions").select("question_text,question_type,correct_numerical,test_options(label,text,is_correct)").eq("id", data.questionId).maybeSingle();
    if (!q) throw new Error("Question not found");
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI key is not configured");
    let correctInfo = "";
    if (Array.isArray(q.test_options) && q.test_options.length) {
      const c = q.test_options.filter((o: any) => o.is_correct).map((o: any) => `${o.label}. ${o.text}`).join("; ");
      correctInfo = `Correct option(s): ${c || "not explicitly marked — infer the correct one and justify"}.`;
    } else if (q.correct_numerical != null) { correctInfo = `Correct numerical answer: ${q.correct_numerical}.`; }
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a senior JEE/NEET faculty. Write a clean, step-by-step solution in 4-8 concise lines suitable for a solution PDF. Use $...$ for inline math. No preamble, no closing, no markdown headers." },
          { role: "user", content: `Question: ${q.question_text}\n${correctInfo}\nWrite the solution.` },
        ],
      }),
    });
    if (!resp.ok) {
      if (resp.status === 429) throw new Error("AI rate-limited. Try again shortly.");
      if (resp.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI error ${resp.status}`);
    }
    const json = await resp.json();
    const explanation = String(json?.choices?.[0]?.message?.content ?? "").trim();
    if (explanation) { await supabase.from("test_questions").update({ explanation }).eq("id", data.questionId); }
    return { explanation };
  });

export const recordAntiCheat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ attemptId: z.string().uuid(), kind: z.enum(["tab_switch", "fullscreen_exit"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: att } = await supabase.from("test_attempts").select("id,user_id,status,tab_switch_count,fullscreen_exit_count").eq("id", data.attemptId).maybeSingle();
    if (!att || att.user_id !== userId) throw new Error("Forbidden");
    if (att.status !== "in_progress") return { ok: true };
    if (data.kind === "tab_switch") { await supabase.from("test_attempts").update({ tab_switch_count: (att.tab_switch_count ?? 0) + 1 }).eq("id", att.id); }
    else { await supabase.from("test_attempts").update({ fullscreen_exit_count: (att.fullscreen_exit_count ?? 0) + 1 }).eq("id", att.id); }
    return { ok: true };
  });

// ─────────────────────────────── AI test generation (admin only) ───────────────────────────────

const AI_GEN_SYSTEM_PROMPT = "You are a senior JEE/NEET question setter. Produce exam-accurate MCQs strictly on the requested chapter/topics. Return JSON only as {questions:[{question_text, options:[{label,text,is_correct}], explanation, difficulty}]}. Exactly one option must be correct unless asked otherwise. Use LaTeX inside $...$ for all math. Never repeat a question already listed as used. No markdown fences.";

async function callGeminiText(apiKey: string, prompt: string) {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: AI_GEN_SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.6 },
  });
  let lastError = "";
  for (const model of GEMINI_MODEL_CANDIDATES) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body },
    );
    if (response.ok) {
      const result = await response.json();
      return parseAiJson((result?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p?.text ?? "").join(""));
    }
    const errorBody = await response.text();
    lastError = `${response.status}: ${errorBody.slice(0, 200)}`;
    if (response.status === 404) continue;
    if (response.status === 400 && /API key/i.test(errorBody)) throw new Error("Your Gemini API key was rejected.");
    if (response.status === 403) throw new Error("Your Gemini API key does not have access.");
    if (response.status === 429) throw new Error("Your Gemini key hit its rate limit. Wait a minute and retry.");
    throw new Error(`AI generation failed (${lastError})`);
  }
  throw new Error(`AI generation failed — no supported model for your key (${lastError})`);
}


const AiGenInput = z.object({
  subject: SubjectKind,
  chapter: z.string().trim().min(2).max(160),
  topics: z.string().trim().max(600).optional(),
  difficulty: z.enum(["easy", "moderate", "hard", "mixed"]),
  count: z.number().int().min(1).max(20),
  batchIndex: z.number().int().min(0).max(50).default(0),
  usedQuestions: z.array(z.string().max(300)).max(60).default([]),
});

/** Generates ONE batch of questions so the UI can show progress across batches. */
export const adminGenerateAiQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AiGenInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const prompt = [
      `Subject: ${data.subject}`,
      `Chapter: ${data.chapter}`,
      data.topics ? `Topics to focus on: ${data.topics}` : "",
      `Difficulty: ${data.difficulty === "mixed" ? "a balanced mix of easy, moderate and hard" : data.difficulty}`,
      `Generate exactly ${data.count} single-correct MCQs with 4 options each (labels A, B, C, D) and a concise step-by-step explanation for each.`,
      data.usedQuestions.length ? `Do NOT repeat or paraphrase these already-generated questions:\n- ${data.usedQuestions.join("\n- ")}` : "",
      `This is batch number ${data.batchIndex + 1}; keep the questions fresh and non-overlapping.`,
    ].filter(Boolean).join("\n");

    const key = await getSystemSecret("google_gemini", "Primary key");
    if (!key) throw new Error("Gemini is not configured in System Control Center yet.");
    const parsed = await callGeminiText(key, prompt);
    const raw = Array.isArray(parsed?.questions) ? parsed.questions : [];
    const questions = raw.slice(0, data.count).map((q: any) => {
      const options = (Array.isArray(q.options) ? q.options : []).slice(0, 4).map((o: any, i: number) => ({
        label: String(o?.label ?? String.fromCharCode(65 + i)).slice(0, 4),
        text: String(o?.text ?? "").slice(0, 2000),
        is_correct: !!o?.is_correct,
      })).filter((o: any) => o.text.trim());
      return {
        question_text: String(q?.question_text ?? "").trim().slice(0, 4000),
        explanation: q?.explanation ? String(q.explanation).slice(0, 4000) : null,
        options,
      };
    }).filter((q: any) => q.question_text && q.options.length >= 2 && q.options.some((o: any) => o.is_correct));
    if (!questions.length) throw new Error("The AI returned no usable questions for this batch. Try again.");
    return { questions };
  });

export const adminSaveAiTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    name: z.string().trim().min(3).max(180),
    subject: SubjectKind,
    chapter: z.string().trim().min(2).max(160),
    difficulty: Difficulty,
    duration_min: z.number().int().min(1).max(720),
    marks: z.number().min(0).max(100),
    negative: z.number().min(0).max(100),
    publish: z.boolean().default(false),
    questions: z.array(z.object({
      question_text: z.string().min(3),
      explanation: z.string().nullable().optional(),
      options: z.array(z.object({ label: z.string(), text: z.string(), is_correct: z.boolean() })).min(2),
    })).min(1).max(300),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const totalMarks = data.questions.length * data.marks;
    const { data: test, error } = await supabase.from("tests").insert({
      name: data.name,
      description: `AI-generated practice test — ${data.chapter} (${data.subject}).`,
      exam_type: "chapter_test", subject: data.subject, chapters: [data.chapter], difficulty: data.difficulty,
      duration_min: data.duration_min, total_marks: totalMarks,
      default_marks_per_question: data.marks, default_negative_per_question: data.negative,
      language: "english", max_attempts: 3, mode: "practice",
      status: data.publish ? "published" : "draft", visibility: data.publish ? "public" : "private",
      approval_status: "approved", reviewed_by: userId, reviewed_at: new Date().toISOString(),
      created_by: userId,
    }).select("id").single();
    if (error || !test) throw new Error(error?.message ?? "Could not create the test");

    let imported = 0;
    for (const q of data.questions) {
      const { data: created } = await supabase.from("test_questions").insert({
        test_id: test.id, order_no: imported + 1, question_type: "single",
        question_text: q.question_text.slice(0, 8000), subject: data.subject === "mixed" ? null : data.subject,
        chapter: data.chapter, marks: data.marks, negative_marks: data.negative,
        explanation: q.explanation ?? null, numerical_tolerance: 0,
      }).select("id").single();
      if (!created) continue;
      await supabase.from("test_options").insert(q.options.map((o, i) => ({
        question_id: created.id, label: o.label.slice(0, 4), text: o.text.slice(0, 4000), is_correct: o.is_correct, order_no: i,
      })));
      imported++;
    }
    if (!imported) throw new Error("No questions could be saved");
    await supabase.from("tests").update({ total_marks: imported * data.marks }).eq("id", test.id);
    return { id: test.id as string, imported };
  });
