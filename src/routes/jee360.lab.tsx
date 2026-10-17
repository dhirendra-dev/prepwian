import { createFileRoute, Link } from "@tanstack/react-router";
import { Atom, Brain, Gauge, MessageSquare, Timer } from "lucide-react";
import { Heatmap } from "@/components/jee360/heatmap";
import { OrbitHud } from "@/components/jee360/orbit-hud";
import { ProtocolList } from "@/components/jee360/protocol-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/jee360/card";
import { heatmap, weeklyFocusMinutes } from "@/lib/jee360/intel";
import { currentProjection, formatPercentile, formatRank } from "@/lib/jee360/rank";
import { dueCards } from "@/lib/jee360/srs";
import { useAppStore } from "@/lib/jee360/store";
import { todayISO } from "@/lib/jee360/dates";

export const Route = createFileRoute("/jee360/lab")({
  head: () => ({ meta: [
      { property: "og:title", content: "Study Lab — JEE 360 | PREPWIAN" },
      { property: "og:description", content: "Explore JEE 360 preparation tools and study experiments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Study Lab — JEE 360 | PREPWIAN" },
      { name: "twitter:description", content: "Explore JEE 360 preparation tools and study experiments." },{ title: "Study Lab — JEE 360 | PREPWIAN" }, { name: "description", content: "Explore JEE 360 preparation tools and study experiments." }] }),
 component: LabPage });

const LINKS = [
  {
    to: "/jee360/focus" as const,
    title: "Focus lab",
    body: "Timed deep-work blocks that keep running while you move around the app.",
    icon: Timer,
  },
  {
    to: "/jee360/memory" as const,
    title: "Memory loop",
    body: "Spaced recall for every chapter on the planner. Due cards surface here.",
    icon: Brain,
  },
  {
    to: "/jee360/rank" as const,
    title: "Rank sim",
    body: "Percentile and rank estimate from scored mocks, plus a what-if slider.",
    icon: Gauge,
  },
  {
    to: "/jee360/coach" as const,
    title: "AI coach",
    body: "Ask Grok for a daily briefing, a 90-minute protocol, or a chapter drill.",
    icon: MessageSquare,
  },
];

function LabPage() {
  const lectures = useAppStore((s) => s.lectures);
  const tests = useAppStore((s) => s.tests);
  const cards = useAppStore((s) => s.cards);
  const sessions = useAppStore((s) => s.focusSessions);
  const cells = heatmap({ lectures, focusSessions: sessions });
  const focusMin = weeklyFocusMinutes(sessions);
  const due = dueCards(cards, todayISO()).length;
  const proj = currentProjection(tests);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Command</p>
        <h1 className="mt-1 flex items-center gap-2 font-display text-3xl sm:text-4xl">
          <Atom className="size-7" /> Lab
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live telemetry from your planner — focus, memory, rank, and a coach on demand.
        </p>
      </header>

      <OrbitHud />
      <ProtocolList />

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Focus · 7d</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{Math.round(focusMin / 60)}h</p>
            <p className="text-xs text-muted-foreground">{focusMin} minutes logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Loop due</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{due}</p>
            <p className="text-xs text-muted-foreground">{cards.length} chapters in orbit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Sim percentile</p>
            <p className="mt-1 font-display text-3xl tabular-nums">
              {proj.n ? formatPercentile(proj.percentile) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {proj.n ? `~ AIR ${formatRank(proj.rank)}` : "Score a mock to unlock"}
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((item) => (
          <Link key={item.to} to={item.to} className="rounded-xl border border-border bg-card p-4 hover:bg-secondary/60">
            <item.icon className="size-5 text-muted-foreground" />
            <p className="mt-3 font-display text-xl">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity mesh</CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap cells={cells} />
        </CardContent>
      </Card>
    </div>
  );
}
