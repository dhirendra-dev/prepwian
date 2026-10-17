import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/jee360/card";
import { Label } from "@/components/ui/label";
import {
  currentProjection,
  formatPercentile,
  formatRank,
  scoredTests,
  whatIfProjection,
} from "@/lib/jee360/rank";
import { useAppStore } from "@/lib/jee360/store";

export const Route = createFileRoute("/jee360/rank")({
  head: () => ({ meta: [
      { property: "og:title", content: "Rank Estimates — JEE 360 | PREPWIAN" },
      { property: "og:description", content: "Explore rank estimates from the mock tests recorded in JEE 360." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Rank Estimates — JEE 360 | PREPWIAN" },
      { name: "twitter:description", content: "Explore rank estimates from the mock tests recorded in JEE 360." },{ title: "Rank Estimates — JEE 360 | PREPWIAN" }, { name: "description", content: "Explore rank estimates from the mock tests recorded in JEE 360." }] }),
 component: RankPage });

function RankPage() {
  const tests = useAppStore((s) => s.tests);
  const current = currentProjection(tests);
  const scored = scoredTests(tests);
  const [what, setWhat] = useState(() => Math.round(current.score || 180));
  const projected = whatIfProjection(tests, what);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Lab</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Rank sim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimate only — a fitted percentile curve, not NTA. Uses your last three scored papers.
        </p>
      </header>

      {current.n === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <Gauge className="mb-3 size-8 text-muted-foreground" />
          <h3 className="font-display text-xl">No scored mocks</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Log a score on Tests, then the simulator can project percentile and AIR.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/jee360/tests">Open tests</Link>
          </Button>
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">Avg score</p>
                <p className="font-display text-3xl tabular-nums">{current.score}</p>
                <p className="text-xs text-muted-foreground">/{current.maxScore} · {current.n} papers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">Percentile</p>
                <p className="font-display text-3xl tabular-nums">{formatPercentile(current.percentile)}</p>
                <p className="text-xs text-muted-foreground">{current.band}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">AIR est.</p>
                <p className="font-display text-3xl tabular-nums">{formatRank(current.rank)}</p>
                <p className="text-xs text-muted-foreground">~12 lakh field</p>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>What if remaining papers average…</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-3">
                <Label htmlFor="what">{what} / {current.maxScore}</Label>
                <p className="text-sm text-muted-foreground">
                  {projected.band} · AIR {formatRank(projected.rank)}
                  {projected.deltaRank > 0 ? ` · ${formatRank(projected.deltaRank)} up` : projected.deltaRank < 0 ? ` · ${formatRank(-projected.deltaRank)} down` : ""}
                </p>
              </div>
              <input
                id="what"
                type="range"
                min={0}
                max={current.maxScore}
                value={what}
                onChange={(e) => setWhat(Number(e.target.value))}
                className="h-11 w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground">
                Mixes 60% current average with 40% this remaining average.
              </p>
            </CardContent>
          </Card>

          <section>
            <h2 className="mb-3 font-display text-2xl">Scored papers</h2>
            <ul className="flex flex-col gap-2">
              {scored.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                  </div>
                  <p className="font-mono text-sm tabular-nums">
                    {t.score}/{t.maxScore}
                  </p>
                </li>
              ))}
            </ul>
            <Button variant="ghost" className="mt-3" asChild>
              <Link to="/jee360/tests">Log another score</Link>
            </Button>
          </section>
        </>
      )}
    </div>
  );
}
