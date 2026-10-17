import { aiChatCompletion } from "@/lib/ai-chat.functions";
import type { CoachMode } from "@/lib/jee360/types";

export type CoachInput = {
  mode: CoachMode;
  context: string;
  question?: string;
};

export type CoachResult = { ok: true; text: string } | { ok: false; error: string };

type Provider = "groq" | "gemini" | "openai" | "custom";
type KeyConfig = { provider: Provider; model: string; apiKey: string; baseUrl: string };

const CONFIG_KEY = "aichat:config:v1";

const SYSTEM: Record<CoachMode, string> = {
  briefing:
    "You are JEE 360, a terse JEE Main coach. Using only the supplied planner JSON, write a daily briefing: 1 status line, then 4 numbered actions for the next 24 hours, then 1 risk. No emoji. No invented lectures or scores.",
  now: "You are JEE 360. Using only the planner JSON, prescribe the next 90 minutes as a timed sequence. Each line: minutes — task — why. No emoji. Stay inside the data.",
  drill:
    "You are JEE 360. The student asked a JEE doubt. Answer in short marks-oriented notes: idea, one worked sketch, one common trap. No emoji. If the planner JSON is relevant, mention which chapter to sit first.",
};

function readKeyConfig(): KeyConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? (JSON.parse(raw) as KeyConfig) : null;
  } catch {
    return null;
  }
}

/**
 * Coach runs through the shared AI proxy with the student's own provider key
 * (same key as AI Study Chat) — the platform never ships an AI key.
 */
export async function runCoach({ data }: { data: CoachInput }): Promise<CoachResult> {
  const config = readKeyConfig();
  if (!config?.apiKey) {
    return {
      ok: false,
      error: "Add your own AI key in AI Study Chat settings to use the coach.",
    };
  }

  const context = String(data.context ?? "").slice(0, 3600);
  const question = data.question ? String(data.question).slice(0, 400) : undefined;
  const prompt =
    data.mode === "drill"
      ? `Doubt: ${question ?? "(none)"}\n\nPlanner:\n${context}`
      : context;

  try {
    const res = await aiChatCompletion({
      data: {
        messages: [{ role: "user" as const, content: `${SYSTEM[data.mode]}\n\n${prompt}` }],
        provider: config.provider ?? "gemini",
        model: config.model || undefined,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || undefined,
      },
    });
    if (!res.ok) return { ok: false, error: res.error ?? "Coach failed. Try again in a minute." };
    const text = (res.content ?? "").trim();
    if (!text) return { ok: false, error: "Coach returned an empty reply." };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "Coach is unreachable right now." };
  }
}

export function buildCoachContext(input: {
  examDate: string;
  batch?: string;
  lectures: { title: string; subject: string; chapter: string; date: string; status: string }[];
  tests: { title: string; date: string; status: string; score?: number; maxScore: number }[];
  backlog: { title: string; chapter: string; subject: string; priority: string }[];
  dueCards: number;
  readiness: number;
  weeklyFocusMin: number;
}): string {
  const today = input.lectures.filter((l) => l.status !== "attended").slice(0, 8);
  return JSON.stringify({
    exam: input.examDate,
    batch: input.batch,
    readiness: input.readiness,
    weeklyFocusMin: input.weeklyFocusMin,
    dueCards: input.dueCards,
    upcomingLectures: today,
    tests: input.tests.slice(0, 6),
    backlog: input.backlog.slice(0, 6),
  });
}
