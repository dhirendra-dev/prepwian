import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/jee360/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildCoachContext, runCoach } from "@/lib/jee360/coach";
import { todayISO } from "@/lib/jee360/dates";
import { computeReadiness, weeklyFocusMinutes } from "@/lib/jee360/intel";
import { dueCards } from "@/lib/jee360/srs";
import { useAppStore } from "@/lib/jee360/store";
import type { CoachMode } from "@/lib/jee360/types";

export const Route = createFileRoute("/jee360/coach")({
  head: () => ({ meta: [
      { property: "og:title", content: "Study Coach — JEE 360 | PREPWIAN" },
      { property: "og:description", content: "Work on doubts and revision plans with the JEE 360 study coach." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Study Coach — JEE 360 | PREPWIAN" },
      { name: "twitter:description", content: "Work on doubts and revision plans with the JEE 360 study coach." },{ title: "Study Coach — JEE 360 | PREPWIAN" }, { name: "description", content: "Work on doubts and revision plans with the JEE 360 study coach." }] }),
 component: CoachPage });

function CoachPage() {
  const lectures = useAppStore((s) => s.lectures);
  const tests = useAppStore((s) => s.tests);
  const backlog = useAppStore((s) => s.backlog);
  const cards = useAppStore((s) => s.cards);
  const sessions = useAppStore((s) => s.focusSessions);
  const plans = useAppStore((s) => s.plans);
  const settings = useAppStore((s) => s.settings);
  const meta = useAppStore((s) => s.meta);
  const lastBriefing = useAppStore((s) => s.lastBriefing);
  const saveBriefing = useAppStore((s) => s.saveBriefing);

  const [pending, setPending] = useState<CoachMode | null>(null);
  const [text, setText] = useState(lastBriefing?.text ?? "");
  const [question, setQuestion] = useState("");

  const context = buildCoachContext({
    examDate: settings.examDate,
    batch: meta?.batch,
    lectures: lectures.map((l) => ({
      title: l.title,
      subject: l.subject,
      chapter: l.chapter,
      date: l.date,
      status: l.status,
    })),
    tests: tests.map((t) => ({
      title: t.title,
      date: t.date,
      status: t.status,
      score: t.score,
      maxScore: t.maxScore,
    })),
    backlog: backlog
      .filter((b) => b.status !== "cleared")
      .map((b) => ({ title: b.title, chapter: b.chapter, subject: b.subject, priority: b.priority })),
    dueCards: dueCards(cards, todayISO()).length,
    readiness: computeReadiness({ lectures, tests, backlog, cards, focusSessions: sessions, plans }).score,
    weeklyFocusMin: weeklyFocusMinutes(sessions),
  });

  async function run(mode: CoachMode) {
    if (pending) return;
    setPending(mode);
    try {
      const result = await runCoach({
        data: { mode, context, question: mode === "drill" ? question : undefined },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setText(result.text);
      if (mode === "briefing") {
        saveBriefing({
          date: todayISO(),
          mode,
          text: result.text,
          generatedAt: new Date().toISOString(),
        });
      }
    } catch {
      toast.error("Coach is unreachable right now.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Lab</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">AI coach</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grok reads your live planner. Briefings are saved for the day. Nothing runs until you press a button.
        </p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button disabled={!!pending} onClick={() => void run("briefing")}>
          {pending === "briefing" ? "Writing…" : "Daily briefing"}
        </Button>
        <Button variant="secondary" disabled={!!pending} onClick={() => void run("now")}>
          {pending === "now" ? "Writing…" : "Next 90 minutes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chapter drill</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Label htmlFor="doubt">Doubt</Label>
          <Textarea
            id="doubt"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Why is MOT bond order of O2 2, and how does that show in JEE numericals?"
            className="min-h-24"
          />
          <Button
            variant="outline"
            disabled={!!pending || !question.trim()}
            onClick={() => void run("drill")}
          >
            {pending === "drill" ? "Writing…" : "Ask coach"}
          </Button>
        </CardContent>
      </Card>

      {text ? (
        <Card>
          <CardHeader>
            <CardTitle>{lastBriefing && text === lastBriefing.text ? "Saved briefing" : "Coach"}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{text}</pre>
          </CardContent>
        </Card>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Run a briefing to see a plan for today, or ask a chapter doubt.
        </p>
      )}
    </div>
  );
}
