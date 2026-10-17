import { createFileRoute } from "@tanstack/react-router";

/**
 * Shared-secret + rate-limit gate for this public hook. Callers must send
 * `x-hook-secret: <CRON_HOOK_SECRET>`. Returns a Response to short-circuit.
 */
async function guardHook(request: Request): Promise<Response | null> {
  const g = await import("@/lib/security-guard.server");
  try {
    await g.enforceRateLimit(g.RATE_LIMITS.public_hook_ip, g.clientIp());
  } catch (error) {
    const retryAfter = (error as { retryAfter?: number }).retryAfter ?? 60;
    return new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }
  const expected = process.env["CRON_HOOK_SECRET"];
  if (!expected) return null; // not configured yet — keep existing jobs working
  const provided = request.headers.get("x-hook-secret") ?? "";
  if (provided.length !== expected.length || provided !== expected) {
    await g.logServerSecurityEvent({ kind: "hook_denied", action: new URL(request.url).pathname });
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}

/**
 * Automated scheduled test generation.
 * Invoked every 10 minutes by pg_cron. Picks the oldest due row in
 * public.scheduled_tests (status = 'pending', scheduled_date <= today),
 * asks Lovable AI for the questions, publishes a real CBT test, and notifies
 * every learner. Idempotent: a row is claimed by flipping it to 'generating'.
 */

type GenQuestion = {
  question_text: string;
  subject: string;
  chapter: string;
  explanation?: string | null;
  options: { label: string; text: string; is_correct: boolean }[];
};

const SUBJECT_MAP: Record<string, "physics" | "chemistry" | "mathematics" | "biology"> = {
  physics: "physics",
  chemistry: "chemistry",
  mathematics: "mathematics",
  biology: "biology",
};

type AiConfig = { provider: "lovable" | "gemini" | "openai" | "groq"; apiKey: string };

const PROVIDER_ENDPOINT: Record<AiConfig["provider"], { url: string; model: string }> = {
  lovable: { url: "https://ai.gateway.lovable.dev/v1/chat/completions", model: "google/gemini-3-flash-preview" },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    model: "gemini-flash-latest",
  },
  openai: { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" },
  groq: { url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile" },
};

async function generateQuestions(
  ai: AiConfig,
  subjects: Record<string, string[]>,
  perSubject: number,
): Promise<GenQuestion[]> {
  const out: GenQuestion[] = [];
  const endpoint = PROVIDER_ENDPOINT[ai.provider] ?? PROVIDER_ENDPOINT.lovable;
  for (const [subject, chapters] of Object.entries(subjects)) {
    if (!SUBJECT_MAP[subject] || !chapters?.length) continue;
    const prompt = [
      `Create ${perSubject} original JEE/NEET-level multiple-choice questions in ${subject}.`,
      `Only use these chapters: ${chapters.join(", ")}.`,
      "Each question has exactly 4 options labelled A, B, C, D with exactly one correct option.",
      "Use plain text or LaTeX between $...$ for maths. Keep every question self-contained.",
      'Reply with JSON only: {"questions":[{"question_text":"...","chapter":"...","explanation":"...","options":[{"label":"A","text":"...","is_correct":false}]}]}',
    ].join(" ");

    const resp = await fetch(endpoint.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ai.apiKey}` },
      body: JSON.stringify({
        model: endpoint.model,
        messages: [
          { role: "system", content: "You are an expert JEE/NEET question setter. Reply with JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) throw new Error(`AI request failed [${resp.status}]: ${await resp.text()}`);
    const json = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { questions?: GenQuestion[] } = {};
    try {
      parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
    } catch {
      parsed = {};
    }
    for (const q of parsed.questions ?? []) {
      const options = (q.options ?? []).filter((o) => o?.text?.trim());
      if (!q.question_text?.trim() || options.length < 2 || !options.some((o) => o.is_correct)) continue;
      out.push({
        question_text: q.question_text.slice(0, 8000),
        subject,
        chapter: (q.chapter || chapters[0]!).slice(0, 120),
        explanation: q.explanation ?? null,
        options: options.slice(0, 4).map((o, i) => ({
          label: (o.label || ["A", "B", "C", "D"][i]!).slice(0, 4),
          text: o.text.slice(0, 4000),
          is_correct: !!o.is_correct,
        })),
      });
    }
  }
  return out;
}

async function runOnce() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = new Date().toISOString().slice(0, 10);

  const { data: due } = await supabaseAdmin
    .from("scheduled_tests")
    .select("id, test_number, test_name, subjects, total_questions, scheduled_date")
    .eq("status", "pending")
    .lte("scheduled_date", today)
    .order("scheduled_date", { ascending: true })
    .limit(1);
  const row = due?.[0];
  if (!row) return { ok: true, message: "nothing due" };

  // Claim it so overlapping cron ticks can't double-generate.
  const { data: claimed } = await supabaseAdmin
    .from("scheduled_tests")
    .update({ status: "generating" })
    .eq("id", row.id)
    .eq("status", "pending")
    .select("id");
  if (!claimed?.length) return { ok: true, message: "already claimed" };

  try {
    // Admins can point generation at their own AI key (Gemini/OpenAI/Groq);
    // otherwise the platform key is used.
    const { data: aiSettings } = await supabaseAdmin
      .from("ai_generation_settings")
      .select("use_own_key, provider, api_key")
      .eq("id", 1)
      .maybeSingle();

    let ai: AiConfig;
    if (aiSettings?.use_own_key && aiSettings.api_key) {
      const provider = (aiSettings.provider ?? "gemini") as AiConfig["provider"];
      ai = { provider: provider in PROVIDER_ENDPOINT ? provider : "gemini", apiKey: aiSettings.api_key };
    } else {
      const platformKey = process.env["LOVABLE_API_KEY"];
      if (!platformKey) throw new Error("No AI key configured (platform key missing and no admin key saved)");
      ai = { provider: "lovable", apiKey: platformKey };
    }

    const subjects = (row.subjects ?? {}) as Record<string, string[]>;
    const subjectCount = Object.keys(subjects).filter((s) => SUBJECT_MAP[s]).length || 1;
    const perSubject = Math.max(1, Math.round(row.total_questions / subjectCount));
    const questions = await generateQuestions(ai, subjects, perSubject);
    if (!questions.length) throw new Error("AI returned no usable questions");

    const marks = 4;
    const negative = 1;
    const allChapters = Object.values(subjects).flat().slice(0, 24);
    const { data: adminRow } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!adminRow) throw new Error("No admin account found to own the test");

    const { data: created, error: createErr } = await supabaseAdmin
      .from("tests")
      .insert({
        name: row.test_name,
        description: `Auto-generated scheduled test #${row.test_number} — released ${row.scheduled_date}.`,
        exam_type: "mock_test",
        subject: "mixed",
        chapters: allChapters,
        difficulty: "moderate",
        duration_min: Math.max(20, questions.length * 2),
        total_marks: questions.length * marks,
        default_marks_per_question: marks,
        default_negative_per_question: negative,
        instructions: null,
        language: "english",
        max_attempts: 3,
        mode: "practice",
        status: "published",
        visibility: "public",
        approval_status: "approved",
        created_by: adminRow.user_id,
      })
      .select("id")
      .single();
    if (createErr || !created) throw new Error(createErr?.message ?? "Could not create the test");

    let order = 0;
    for (const q of questions) {
      const { data: qRow } = await supabaseAdmin
        .from("test_questions")
        .insert({
          test_id: created.id,
          order_no: order + 1,
          question_type: "single",
          question_text: q.question_text,
          subject: SUBJECT_MAP[q.subject] ?? null,
          chapter: q.chapter,
          marks,
          negative_marks: negative,
          explanation: q.explanation ?? null,
          numerical_tolerance: 0,
        })
        .select("id")
        .single();
      if (!qRow) continue;
      await supabaseAdmin.from("test_options").insert(
        q.options.map((o, i) => ({
          question_id: qRow.id,
          label: o.label,
          text: o.text,
          is_correct: o.is_correct,
          order_no: i,
        })),
      );
      order++;
    }
    if (!order) throw new Error("No questions could be saved");

    await supabaseAdmin
      .from("tests")
      .update({ total_marks: order * marks })
      .eq("id", created.id);
    await supabaseAdmin
      .from("scheduled_tests")
      .update({ status: "published", generated_test_id: created.id, error: null })
      .eq("id", row.id);
    await supabaseAdmin.from("notifications").insert({
      title: `🆕 New test live: ${row.test_name}`,
      body: `${order} questions · ${marks} marks each. Attempt it now on Test Series.`,
      link: `/tests/${created.id}`,
      audience: "all",
      target_user_id: null,
      created_by: adminRow.user_id,
    });

    return { ok: true, testId: created.id, questions: order };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed";
    await supabaseAdmin.from("scheduled_tests").update({ status: "failed", error: message }).eq("id", row.id);
    return { ok: false, error: message };
  }
}

export const Route = createFileRoute("/api/public/hooks/generate-scheduled-tests")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await guardHook(request);
        if (denied) return denied;
        const result = await runOnce();
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      },
      GET: async () => new Response("ok"),
    },
  },
});
