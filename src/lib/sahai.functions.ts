import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSystemSecret } from "@/lib/system-secrets.server";

const SAHAI_SYSTEM_PROMPT = [
  "You are SahAI, a friendly AI study buddy built into the PREPWIAN app, used by JEE and NEET aspirants across India. You are shared by every community and every squad on the platform — any student, in any group, can talk to you.",
  "",
  "Tone: talk like a supportive senior or close study buddy, not a formal assistant. Casual, warm, encouraging. Light Hinglish is welcome (\"yaar\", \"chalo\", \"bas thoda aur\") but keep it readable. Use emojis sparingly, only when it fits naturally.",
  "",
  "Behavior:",
  "- Help with academic doubts (Physics, Chemistry, Maths, Biology) with clear, step-by-step explanations when asked.",
  "- Help with study planning, revision strategy, and motivation during burnout or low phases.",
  "- Keep replies concise by default (3-6 sentences) unless the student explicitly asks for a full detailed solution.",
  "- Never sound like a generic corporate chatbot. No \"As an AI language model\" type phrasing. You're a buddy first, a tutor second.",
].join("\n");

const GEMINI_MODEL_CANDIDATES = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];

/** Loads this student's stored SahAI conversation. */
export const getSahaiHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data } = await supabase
      .from("sahai_messages")
      .select("id, role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(300);
    return (data ?? []) as { id: string; role: "user" | "assistant"; content: string; created_at: string }[];
  });

export const clearSahaiHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    await supabase.from("sahai_messages").delete().eq("user_id", userId);
    return { ok: true as const };
  });

const AskInput = z.object({
  message: z.string().trim().min(1).max(4000),
});

/**
 * Sends one turn to SahAI using the centrally managed Gemini key and persists both sides.
 */
export const askSahai = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AskInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const apiKey = await getSystemSecret("google_gemini", "Primary key");
    if (!apiKey) return { ok: false as const, error: "SahAI is not configured yet. Ask an administrator to add the Gemini key in System Control Center." };

    const { data: history } = await supabase
      .from("sahai_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    const prior = (history ?? []).slice().reverse();

    await supabase.from("sahai_messages").insert({ user_id: userId, role: "user", content: data.message });

    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: SAHAI_SYSTEM_PROMPT }] },
      contents: [
        ...prior.map((m: any) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        { role: "user", parts: [{ text: data.message }] },
      ],
      generationConfig: { temperature: 0.7 },
    });

    let reply = "";
    let lastStatus = 0;
    for (const model of GEMINI_MODEL_CANDIDATES) {
      let response: Response;
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body },
        );
      } catch {
        return { ok: false as const, error: "I couldn't reach the AI just now. Check your connection and try again 🙏" };
      }
      if (response.ok) {
        const json = (await response.json().catch(() => null)) as any;
        reply = ((json?.candidates?.[0]?.content?.parts ?? []) as any[]).map((p) => p?.text ?? "").join("").trim();
        break;
      }
      lastStatus = response.status;
      if (response.status === 404) continue;
      break;
    }

    if (!reply) {
      const message =
        lastStatus === 400 || lastStatus === 403
          ? "The centrally configured Gemini key was rejected. Ask an administrator to update it."
          : lastStatus === 429
            ? "The Gemini provider rate limit was reached — wait a minute and try again 🙂"
            : "Something went wrong on my side. Try sending that again in a moment 🙏";
      return { ok: false as const, error: message };
    }

    await supabase.from("sahai_messages").insert({ user_id: userId, role: "assistant", content: reply });
    return { ok: true as const, reply };
  });
