import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Quiz engine for the Daily Challenge and Question Battle.
 *
 * Questions are drawn from the existing published test bank. Answer keys never
 * leave the server: `getQuizSet` strips `is_correct`, and `gradeQuiz` does the
 * checking server-side.
 */

export type QuizOption = { id: string; label: string; text: string };
export type QuizQuestion = {
  id: string;
  question_text: string;
  image_url: string | null;
  subject: string | null;
  chapter: string | null;
  question_type: string;
  options: QuizOption[];
};

const setInput = z.object({
  mode: z.enum(["daily", "battle"]).default("daily"),
  subject: z.enum(["physics", "chemistry", "mathematics", "any"]).default("any"),
  topics: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  count: z.number().int().min(3).max(30).default(10),
  challengeSeed: z.string().min(8).max(80).optional(),
});

const topicListInput = z.object({
  subject: z.enum(["physics", "chemistry", "mathematics", "any"]).default("any"),
});

export const getQuizTopics = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => topicListInput.parse(raw))
  .handler(async ({ data }): Promise<string[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tests = await supabaseAdmin.from("tests").select("id")
      .eq("status", "published").eq("visibility", "public")
      .order("id", { ascending: true }).limit(200);
    const testIds = (tests.data ?? []).map((test) => test.id);
    if (testIds.length === 0) return [];

    let query = supabaseAdmin.from("test_questions").select("chapter, subject")
      .in("test_id", testIds).eq("question_type", "single")
      .not("chapter", "is", null).order("chapter", { ascending: true }).limit(400);
    if (data.subject !== "any") query = query.eq("subject", data.subject);
    const { data: rows } = await query;
    return [...new Set((rows ?? []).map((row) => row.chapter?.trim()).filter((value): value is string => Boolean(value)))];
  });

/** Deterministic per-day shuffle so everyone gets the same Daily Challenge. */
function seededShuffle<T>(items: T[], seed: number) {
  const arr = [...items];
  let s = seed || 1;
  for (let i = arr.length - 1 > 0 ? arr.length - 1 : 0; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    const a = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = a;
  }
  return arr;
}

function daySeed() {
  const d = new Date();
  return Number(`${d.getUTCFullYear()}${d.getUTCMonth() + 1}${d.getUTCDate()}`);
}

function seedFromString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const getQuizSet = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => setInput.parse(raw))
  .handler(async ({ data }): Promise<QuizQuestion[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const tests = await supabaseAdmin
      .from("tests")
      .select("id")
      .eq("status", "published")
      .eq("visibility", "public")
      .order("id", { ascending: true })
      .limit(200);
    const testIds = (tests.data ?? []).map((t) => t.id);
    if (testIds.length === 0) return [];

    let q = supabaseAdmin
      .from("test_questions")
      .select("id, question_text, image_url, subject, chapter, question_type")
      .in("test_id", testIds)
      .eq("question_type", "single")
      .order("id", { ascending: true })
      .limit(400);
    if (data.subject !== "any") q = q.eq("subject", data.subject);
    if (data.topics.length > 0) q = q.in("chapter", data.topics);
    const { data: rows } = await q;
    const pool = rows ?? [];
    if (pool.length === 0) return [];

    const seed = data.mode === "daily" ? daySeed() : data.challengeSeed ? seedFromString(data.challengeSeed) : Math.floor(Math.random() * 2 ** 30);
    const picked = seededShuffle(pool, seed).slice(0, data.count);

    const { data: opts } = await supabaseAdmin
      .from("test_options")
      .select("id, question_id, label, text, order_no")
      .in(
        "question_id",
        picked.map((p) => p.id),
      );

    return picked.map((p) => ({
      id: p.id,
      question_text: p.question_text,
      image_url: p.image_url ?? null,
      subject: (p.subject as string | null) ?? null,
      chapter: p.chapter ?? null,
      question_type: String(p.question_type),
      options: (opts ?? [])
        .filter((o) => o.question_id === p.id)
        .sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0))
        .map((o) => ({ id: o.id, label: o.label, text: o.text })),
    }));
  });

const gradeInput = z.object({
  answers: z
    .array(z.object({ questionId: z.string().uuid(), optionId: z.string().uuid().nullable() }))
    .max(30),
});

export type QuizResult = {
  correct: number;
  total: number;
  details: { questionId: string; correctOptionId: string | null; explanation: string | null; ok: boolean }[];
};

export const gradeQuiz = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => gradeInput.parse(raw))
  .handler(async ({ data }): Promise<QuizResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = data.answers.map((a) => a.questionId);
    if (ids.length === 0) return { correct: 0, total: 0, details: [] };

    const [{ data: opts }, { data: qs }] = await Promise.all([
      supabaseAdmin.from("test_options").select("id, question_id, is_correct").in("question_id", ids),
      supabaseAdmin.from("test_questions").select("id, explanation").in("id", ids),
    ]);

    const details = data.answers.map((a) => {
      const correctOpt = (opts ?? []).find((o) => o.question_id === a.questionId && o.is_correct);
      const ok = !!a.optionId && correctOpt?.id === a.optionId;
      return {
        questionId: a.questionId,
        correctOptionId: correctOpt?.id ?? null,
        explanation: (qs ?? []).find((q) => q.id === a.questionId)?.explanation ?? null,
        ok,
      };
    });

    return { correct: details.filter((d) => d.ok).length, total: details.length, details };
  });
