import { createFileRoute } from "@tanstack/react-router";
import { Timer } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/jee360/empty-state";
import { Badge } from "@/components/jee360/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/jee360/card";
import { todayISO } from "@/lib/jee360/dates";
import { weeklyFocusMinutes } from "@/lib/jee360/intel";
import { openBacklog } from "@/lib/jee360/planner";
import { useAppStore } from "@/lib/jee360/store";
import { useNow } from "@/lib/jee360/use-now";
import type { Subject } from "@/lib/jee360/types";

export const Route = createFileRoute("/jee360/focus")({
  head: () => ({ meta: [
      { property: "og:title", content: "Focus Sessions — JEE 360 | JEE Prep Hub" },
      { property: "og:description", content: "Run focused study sessions within your JEE 360 planner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Focus Sessions — JEE 360 | JEE Prep Hub" },
      { name: "twitter:description", content: "Run focused study sessions within your JEE 360 planner." },{ title: "Focus Sessions — JEE 360 | JEE Prep Hub" }, { name: "description", content: "Run focused study sessions within your JEE 360 planner." }] }),
 component: FocusPage });

const PRESETS = [25, 50, 90];

function remainLabel(startedAt: number, durationMin: number, now: number) {
  const s = Math.max(0, Math.ceil((startedAt + durationMin * 60_000 - now) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function FocusPage() {
  const now = useNow(500);
  const active = useAppStore((s) => s.activeFocus);
  const sessions = useAppStore((s) => s.focusSessions);
  const backlog = useAppStore((s) => s.backlog);
  const lectures = useAppStore((s) => s.lectures);
  const startFocus = useAppStore((s) => s.startFocus);
  const stopFocus = useAppStore((s) => s.stopFocus);
  const open = openBacklog(backlog);
  const weekMin = weeklyFocusMinutes(sessions);
  const streak = countStreak(sessions);

  const start = (minutes: number, title: string, subject?: Subject) => {
    startFocus({ durationMin: minutes, title, subject });
    toast("Focus armed", { description: `${minutes} min · ${title}` });
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Lab</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Focus</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deep-work blocks stay live across pages. Complete one, then hit the memory loop.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">This week</p>
            <p className="font-display text-3xl tabular-nums">{weekMin}m</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Streak</p>
            <p className="font-display text-3xl tabular-nums">{streak}d</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Sessions</p>
            <p className="font-display text-3xl tabular-nums">{sessions.filter((s) => s.status === "completed").length}</p>
          </CardContent>
        </Card>
      </section>

      {active ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">In orbit</p>
            <p className="font-display text-6xl tabular-nums tracking-tight">
              {now ? remainLabel(active.startedAt, active.durationMin, now.getTime()) : `${active.durationMin}:00`}
            </p>
            <p className="text-sm">{active.title}</p>
            <div className="flex gap-2">
              <Button onClick={() => { stopFocus("completed"); toast.success("Block logged"); }}>
                Complete
              </Button>
              <Button variant="outline" onClick={() => stopFocus("abandoned")}>
                Abandon
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Arm a block</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((m) => (
                <Button key={m} variant="outline" onClick={() => start(m, "Deep work")}>
                  {m} min
                </Button>
              ))}
            </div>
            {open[0] ? (
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => start(50, `Recover ${open[0].chapter}`, open[0].subject)}
              >
                Recover {open[0].chapter} · 50 min
              </Button>
            ) : null}
            {lectures.find((l) => l.status === "attended") ? (
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => {
                  const l = lectures.filter((x) => x.status === "attended").at(-1)!;
                  start(25, `Revise ${l.chapter}`, l.subject);
                }}
              >
                Revise last attended chapter · 25 min
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="mb-3 font-display text-2xl">Log</h2>
        {sessions.length === 0 ? (
          <EmptyState icon={Timer} title="No sessions yet" body="Arm a 25, 50, or 90 minute block to start the week." />
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.slice(0, 12).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.startedAt.slice(0, 10)} · {s.minutes} min</p>
                </div>
                <Badge variant={s.status === "completed" ? "success" : "outline"}>{s.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function countStreak(sessions: { startedAt: string; status: string }[]) {
  const days = new Set(
    sessions.filter((s) => s.status === "completed").map((s) => s.startedAt.slice(0, 10)),
  );
  let n = 0;
  const cur = new Date();
  for (;;) {
    const iso = todayISO(cur);
    if (!days.has(iso)) break;
    n += 1;
    cur.setDate(cur.getDate() - 1);
  }
  return n;
}
