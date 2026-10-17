import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSystemSecret } from "@/lib/system-secrets.server";

const PROVIDER_ENDPOINTS: Record<string, string> = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
};

const SYSTEM_PROMPT = [
  "You are the PREPWIAN AI study tutor for Indian Class 11-12 students preparing for JEE Main, JEE Advanced and NEET.",
  "Explain concepts step by step, in simple language, and keep answers focused and exam-oriented.",
  "Write mathematics with LaTeX between $...$ (inline) or $$...$$ (display).",
  "When asked for a problem, give the question first, then a clearly separated solution.",
  "Keep answers under roughly 500 words unless the student asks for more depth.",
].join(" ");

const Input = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
  provider: z.enum(["groq", "gemini", "openai", "custom"]).default("gemini"),
  model: z.string().max(120).optional(),
  baseUrl: z.string().max(300).optional(),
});

/**
 * Only public https AI endpoints are allowed, so the proxy cannot be pointed at
 * internal or loopback addresses.
 */
function isAllowedEndpoint(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return false;
  }
  if (host === "metadata.google.internal" || host === "[::1]" || host.startsWith("[")) return false;
  // Reject bare IP literals (private ranges and link-local metadata endpoints).
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  if (!host.includes(".")) return false;
  return true;
}

/**
 * Server-side proxy for the AI Study Chat.
 * Every request uses the student's own provider key — there is no platform key.
 */
export const aiChatCompletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const provider = data.provider;
    const keyProvider = provider === "gemini" ? "google_gemini" : provider;
    let key: string | null = null;
    try {
      key = await getSystemSecret(keyProvider as "groq" | "google_gemini" | "openai" | "anthropic" | "custom", "Primary key");
    } catch (error) {
      console.error("Central AI credential lookup failed", error instanceof Error ? error.message : "unknown error");
    }
    if (!key) {
      return {
        ok: false as const,
        code: "config",
        error: "No platform API key is configured for this provider. Ask a PREPWIAN administrator to configure it in System Control Center.",
      };
    }

    const endpoint =
      data.provider === "custom"
        ? (data.baseUrl || "").replace(/\/+$/, "") + "/chat/completions"
        : PROVIDER_ENDPOINTS[data.provider]!;
    const model = data.model?.trim() || (data.provider === "gemini" ? "gemini-flash-latest" : data.provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini");
    if (!isAllowedEndpoint(endpoint)) {
      return {
        ok: false as const,
        code: "config",
        error: "That custom endpoint URL is not valid. It must be a public https address like https://host/v1",
      };
    }

    // The conversation must end with the student's own message; roles are limited
    // to user/assistant by validation and the system prompt is server-owned.
    const history = data.messages.slice(-40);
    if (history[history.length - 1]?.role !== "user") {
      return { ok: false as const, code: "config", error: "Type a question to send to the tutor." };
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
            })),
          ],
        }),
      });
    } catch {
      return {
        ok: false as const,
        code: "network",
        error: "Could not reach the AI provider. Check your internet connection and try again.",
      };
    }

    if (!response.ok) {
      const body = (await response.text().catch(() => "")).slice(0, 300);
      const map: Record<number, { code: string; error: string }> = {
        401: { code: "auth", error: "The API key was rejected (401). Ask an administrator to update the centrally configured API key." },
        403: { code: "auth", error: "This key is not allowed to use that model (403). Ask an administrator to check the configured model/key." },
        404: { code: "not_found", error: `Model or endpoint not found (404): "${model}". Check the model name in your preferences.` },
        429: { code: "rate_limit", error: "Rate limit reached (429). Wait a minute and send again." },
        402: { code: "credits", error: "Your provider reports no remaining credits (402). Ask an administrator to check the provider account." },
      };
      const hit = map[response.status];
      return {
        ok: false as const,
        code: hit?.code ?? "generic",
        error: hit?.error ?? `The AI request failed (${response.status}). ${body}`,
      };
    }

    const json = (await response.json().catch(() => null)) as any;
    const content = String(json?.choices?.[0]?.message?.content ?? "").trim();
    if (!content) {
      return { ok: false as const, code: "generic", error: "The AI returned an empty reply. Try rephrasing your question." };
    }
    return { ok: true as const, content, model };
  });
