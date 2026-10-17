import { useState } from "react";
import {
  Bot,
  Brain,
  Loader2,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { generateAIResponse, getAIConfig } from "@/lib/ai";

type Props = {
  userName: string;
  recommendation?: string;
  weakTopic?: {
    subject?: string;
    topic?: string;
    accuracy?: number;
  };
  revisionTopic?: {
    subject?: string;
    topic?: string;
  };
};

const actions = [
  { id: "coach", label: "Focus coach", icon: Brain },
  { id: "plan", label: "Plan today", icon: WandSparkles },
  { id: "weakness", label: "Analyze weakness", icon: RefreshCw },
  { id: "revision", label: "Build revision", icon: Sparkles },
] as const;

type Action = (typeof actions)[number]["id"];

export function AIStudyPanel({
  userName,
  recommendation,
  weakTopic,
  revisionTopic,
}: Props) {
  const [loading, setLoading] = useState<Action | null>(null);
  const [answer, setAnswer] = useState("");

  const configured = Boolean(getAIConfig());

  const run = async (action: Action) => {
    setLoading(action);
    setAnswer("");

    try {
      const context = JSON.stringify({
        student: userName,
        dashboardRecommendation: recommendation || null,
        weakTopic: weakTopic || null,
        revisionTopic: revisionTopic || null,
      });

      const prompts: Record<Action, string> = {
        coach: `You are a concise JEE study coach.

Based on this dashboard context:
${context}

Give the student:
1. One practical next action
2. A suggested focus duration
3. One common distraction to avoid

Keep it under 120 words.`,

        plan: `Create a realistic JEE study plan for the rest of today.

Dashboard context:
${context}

Prioritize weak areas and revision.

Give 3-5 study blocks with approximate durations.

Keep it under 180 words.`,

        weakness: `Analyze the student's likely weakness from this dashboard context:

${context}

Explain:
1. What to fix first
2. Why it matters
3. Three concrete practice actions

Keep it under 180 words.`,

        revision: `Create a compact JEE revision session from this dashboard context:

${context}

Include:
1. Concepts to recall
2. 5-10 practice questions
3. A short self-check

Keep it under 180 words.`,
      };

      const result = await generateAIResponse(prompts[action]);

      setAnswer(result);
    } catch (error) {
      setAnswer(
        error instanceof Error
          ? error.message
          : "AI request failed."
      );
    } finally {
      setLoading(null);
    }
  };

  if (!configured) {
    return (
      <section className="rounded-[28px] border border-white/60 bg-white/55 p-5 shadow-[0_24px_80px_-40px_rgba(28,48,35,0.28)] backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-900/90">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-foreground/10">
            <Bot className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="font-semibold">
              AI Study Intelligence
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Configure your own AI API key to use the coach,
              planner and revision tools.
            </p>

            <Link
              to="/settings"
              className="mt-3 inline-flex rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background"
            >
              Configure AI
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/60 bg-white/55 p-5 shadow-[0_24px_80px_-40px_rgba(28,48,35,0.28)] backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-900/90">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-foreground/10">
          <Bot className="h-5 w-5" />
        </div>

        <div>
          <p className="font-semibold">
            AI Study Intelligence
          </p>

          <p className="text-xs text-muted-foreground">
            Uses your dashboard context. Your API key stays in
            your browser.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {actions.map(
          ({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => run(id)}
              disabled={Boolean(loading)}
              className="rounded-2xl border border-white/60 bg-white/45 px-3 py-3 text-left text-xs font-semibold transition hover:-translate-y-0.5 hover:bg-white/70 disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-800/90 dark:hover:bg-slate-700/90"
            >
              {loading === id ? (
                <Loader2 className="mb-2 h-4 w-4 animate-spin" />
              ) : (
                <Icon className="mb-2 h-4 w-4" />
              )}

              {label}
            </button>
          )
        )}
      </div>

      {answer && (
        <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/60 bg-white/45 p-4 text-sm leading-6 dark:border-slate-700/80 dark:bg-slate-800/90">
          {answer}
        </div>
      )}
    </section>
  );
}
