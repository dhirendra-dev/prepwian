import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/jee360/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/jee360/card";
import { pickSprint, type FormulaCard } from "@/lib/jee360/formulas";
import { SUBJECT_SHORT } from "@/lib/jee360/planner";
import { useAppStore } from "@/lib/jee360/store";
import { useNow } from "@/lib/jee360/use-now";
import type { Subject } from "@/lib/jee360/types";

export const Route = createFileRoute("/jee360/sprint")({
  head: () => ({ meta: [
      { property: "og:title", content: "Study Sprint — JEE 360 | JEE Prep Hub" },
      { property: "og:description", content: "Work through a timed JEE 360 study sprint." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Study Sprint — JEE 360 | JEE Prep Hub" },
      { name: "twitter:description", content: "Work through a timed JEE 360 study sprint." },{ title: "Study Sprint — JEE 360 | JEE Prep Hub" }, { name: "description", content: "Work through a timed JEE 360 study sprint." }] }),
 component: SprintPage });

const LIMIT = 90;

type Phase = "idle" | "run" | "done";

function SprintPage() {
  const logSprint = useAppStore((s) => s.logSprint);
  const runs = useAppStore((s) => s.sprintRuns);
  const [subject, setSubject] = useState<Subject | "mix">("mix");
  const [phase, setPhase] = useState<Phase>("idle");
  const [deck, setDeck] = useState<FormulaCard[]>([]);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const now = useNow(phase === "run" ? 200 : 0);

  const left = phase === "run" && now ? Math.max(0, LIMIT - Math.floor((now.getTime() - startedAt) / 1000)) : LIMIT;
  const card = deck[i];
  const best = useMemo(() => runs.reduce((m, r) => Math.max(m, r.correct), 0), [runs]);

  useEffect(() => {
    if (phase === "run" && left <= 0) finish(correct, deck.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase]);

  function start() {
    setDeck(pickSprint(subject, 8));
    setI(0);
    setCorrect(0);
    setRevealed(false);
    setStartedAt(Date.now());
    setPhase("run");
  }

  function finish(hit: number, total: number) {
    if (phase === "done") return;
    setPhase("done");
    logSprint({ subject, correct: hit, total, seconds: LIMIT - Math.max(0, left) });
    toast.success(`${hit}/${total} locked`);
  }

  function grade(knew: boolean) {
    const nextHit = correct + (knew ? 1 : 0);
    if (i + 1 >= deck.length) {
      finish(nextHit, deck.length);
      return;
    }
    setCorrect(nextHit);
    setI(i + 1);
    setRevealed(false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Lab</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Formula sprint</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ninety seconds. Eight recalls. Reveal only if you blank — honesty is the point.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Best" value={`${best}/8`} />
        <Stat label="Runs" value={String(runs.length)} />
        <Stat label="Clock" value={phase === "run" ? `${left}s` : "90s"} />
      </section>

      {phase === "idle" ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap gap-2">
              {(["mix", "physics", "chemistry", "maths"] as const).map((s) => (
                <Button key={s} size="sm" variant={subject === s ? "default" : "outline"} onClick={() => setSubject(s)}>
                  {s === "mix" ? "Mix" : s[0]!.toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
            <Button onClick={start} className="h-12">
              <Zap className="size-4" /> Arm sprint
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {phase === "run" && card ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline">{SUBJECT_SHORT[card.subject]}</Badge>
              <p className="font-mono text-sm tabular-nums">
                {i + 1}/{deck.length} · {left}s
              </p>
            </div>
            <p className="font-display text-2xl">{card.prompt}</p>
            {revealed ? (
              <p className="rounded-lg border border-border bg-secondary px-3 py-3 font-mono text-sm">{card.answer}</p>
            ) : (
              <Button variant="secondary" onClick={() => setRevealed(true)}>
                Reveal
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => grade(false)}>
                Blank
              </Button>
              <Button onClick={() => grade(true)}>Knew it</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {phase === "done" ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">Locked</p>
            <p className="font-display text-5xl tabular-nums">
              {correct}/{deck.length}
            </p>
            <Button onClick={() => setPhase("idle")}>Run again</Button>
          </CardContent>
        </Card>
      ) : null}

      {runs.length > 0 ? (
        <section>
          <h2 className="mb-3 font-display text-2xl">Log</h2>
          <ul className="flex flex-col gap-2">
            {runs.slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3 text-sm">
                <span className="text-muted-foreground">{r.startedAt.slice(0, 10)} · {r.subject}</span>
                <span className="font-mono tabular-nums">
                  {r.correct}/{r.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
        <p className="font-display text-3xl tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
