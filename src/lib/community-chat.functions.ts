import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSystemSecret } from "@/lib/system-secrets.server";

const DOUBT_SYSTEM_PROMPT =
  "You are the PREPWIAN doubt-solving assistant for Indian Class 11-12 JEE/NEET aspirants. " +
  "Answer the student's doubt clearly and concisely (under 220 words). " +
  "Use short numbered steps for derivations. Wrap ALL mathematics in $...$ (inline) or $$...$$ (display) LaTeX. " +
  "Finish with a one-line takeaway. Never invent syllabus that is not in JEE/NEET. Plain text + LaTeX only, no markdown headings.";

const GEMINI_MODEL_CANDIDATES = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];

async function callGeminiAnswer(apiKey: string, prompt: string) {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: DOUBT_SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3 },
  });
  let lastError = "";
  for (const model of GEMINI_MODEL_CANDIDATES) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body },
    );
    if (response.ok) {
      const result = await response.json();
      const text = (result?.candidates?.[0]?.content?.parts ?? [])
        .map((p: { text?: string }) => p?.text ?? "")
        .join("")
        .trim();
      if (!text) throw new Error("The AI returned an empty answer. Try again.");
      return text;
    }
    const errorBody = await response.text();
    lastError = `${response.status}: ${errorBody.slice(0, 200)}`;
    if (response.status === 404) continue;
    if (response.status === 400 && /API key/i.test(errorBody))
      throw new Error("Your Gemini API key was rejected. Create a new key at aistudio.google.com/app/apikey");
    if (response.status === 403) throw new Error("Your Gemini API key does not have access to this model.");
    if (response.status === 429) throw new Error("Your Gemini key hit its rate limit. Wait a minute and retry.");
    throw new Error(`Ask AI failed (${lastError})`);
  }
  throw new Error(`Ask AI failed — no supported model for your key (${lastError})`);
}

async function callPlatformAnswer(prompt: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Site AI is not configured. Paste your own Gemini API key instead.");
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: DOUBT_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 429) throw new Error("Site AI is rate-limited right now. Try again in a moment.");
    if (response.status === 402) throw new Error("Site AI credits are exhausted. Use your own Gemini key.");
    throw new Error(`Site AI failed (${response.status}): ${errorBody.slice(0, 200)}`);
  }
  const json = await response.json();
  const text = String(json?.choices?.[0]?.message?.content ?? "").trim();
  if (!text) throw new Error("The AI returned an empty answer. Try again.");
  return text;
}

/** Reads the singleton admin switch for automatic AI doubt answers. */
export const getCommunityAiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    // The table itself is admin-only; this server function exposes just the
    // single boolean flag the chat UI needs, nothing else.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("community_ai_settings")
      .select("auto_answer_doubts, updated_at")
      .eq("id", 1)
      .maybeSingle();
    return { autoAnswerDoubts: Boolean(data?.auto_answer_doubts), updatedAt: data?.updated_at ?? null };
  });


export const setCommunityAiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ autoAnswerDoubts: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only admins can change the AI auto-answer setting.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("community_ai_settings")
      .upsert(
        { id: 1, auto_answer_doubts: data.autoAnswerDoubts, updated_at: new Date().toISOString(), updated_by: userId },
        { onConflict: "id" },
      );
    if (error) throw new Error(error.message);
    return { autoAnswerDoubts: data.autoAnswerDoubts };
  });

/** How many other members have read the community chat at or after `after`. */
export const getCommunitySeenCount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ after: z.string().min(4) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("chat_reads")
      .select("user_id", { count: "exact", head: true })
      .neq("user_id", userId)
      .gte("last_read_at", data.after);
    return { seen: count ?? 0 };
  });

const AskInput = z.object({
  doubtId: z.string().uuid(),
  auto: z.boolean().optional(),
});

/** Answers a doubt with AI and posts the answer as an AI reply in the thread. */
export const askAiOnDoubt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AskInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context as { userId: string; claims: Record<string, unknown> };
    if (claims?.["is_anonymous"]) throw new Error("Create a full account to use Ask AI.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Rate-limit this expensive action per user, and read the doubt through the
    // caller's own client so the database's row rules decide what they may see.
    const { enforceRateLimit, RATE_LIMITS } = await import("@/lib/security-guard.server");
    await enforceRateLimit(RATE_LIMITS.expensive_user, userId, { userId });

    const callerClient = (context as { supabase: typeof supabaseAdmin }).supabase;
    const { data: doubt, error: doubtError } = await callerClient
      .from("chat_messages")
      .select("id, user_id, body, subject, topic, kind, is_ai, deleted_at, deleted_for_everyone")
      .eq("id", data.doubtId)
      .maybeSingle();
    if (doubtError) throw new Error(doubtError.message);
    if (!doubt || doubt.kind !== "doubt" || doubt.is_ai || doubt.deleted_at || doubt.deleted_for_everyone)
      throw new Error("That doubt no longer exists.");

    const { data: existingAi } = await supabaseAdmin
      .from("chat_messages")
      .select("id")
      .eq("parent_id", data.doubtId)
      .eq("is_ai", true)
      .limit(1);
    if (existingAi && existingAi.length) return { skipped: true as const, reason: "already_answered" };

    if (data.auto) {
      const { data: settings } = await supabaseAdmin
        .from("community_ai_settings")
        .select("auto_answer_doubts")
        .eq("id", 1)
        .maybeSingle();
      if (!settings?.auto_answer_doubts) return { skipped: true as const, reason: "auto_disabled" };
    }

    const key = await getSystemSecret("google_gemini", "Primary key");
    let useSiteAi = false;
    if (!key) {
      if (data.auto) {
        useSiteAi = true;
      } else {
        const { data: exemption } = await supabaseAdmin
          .from("ai_key_exemptions")
          .select("status")
          .eq("user_id", userId)
          .maybeSingle();
        if (exemption?.status !== "approved")
          throw new Error("Ask an administrator to configure the shared Gemini key in System Control Center.");
        useSiteAi = true;
      }
    }

    const prompt = [
      doubt.subject ? `Subject: ${doubt.subject}` : "",
      doubt.topic ? `Topic: ${doubt.topic}` : "",
      `Student's doubt:\n${String(doubt.body ?? "").slice(0, 4000)}`,
    ]
      .filter(Boolean)
      .join("\n");

    const answer = useSiteAi ? await callPlatformAnswer(prompt) : await callGeminiAnswer(key!, prompt);

    const { data: inserted, error } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        user_id: userId,
        body: answer.slice(0, 9000),
        kind: "doubt_reply",
        parent_id: data.doubtId,
        is_ai: true,
        subject: doubt.subject,
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { skipped: false as const, id: inserted?.id ?? null, answer };
  });
