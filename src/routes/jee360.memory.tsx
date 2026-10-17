import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Brain } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/jee360/empty-state";
import { Badge } from "@/components/jee360/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/jee360/card";
import { todayISO } from "@/lib/jee360/dates";
import { SUBJECT_SHORT } from "@/lib/jee360/planner";
import { dueCards, GRADE_LABEL, memoryStats, type ReviewGrade } from "@/lib/jee360/srs";
import { useAppStore } from "@/lib/jee360/store";

export const Route = createFileRoute("/jee360/memory")({
  head: () => ({ meta: [
      { property: "og:title", content: "Revision Cards — JEE 360 | JEE Prep Hub" },
      { property: "og:description", content: "Review study cards using spaced repetition in JEE 360." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Revision Cards — JEE 360 | JEE Prep Hub" },
      { name: "twitter:description", content: "Review study cards using spaced repetition in JEE 360." },{ title: "Revision Cards — JEE 360 | JEE Prep Hub" }, { name: "description", content: "Review study cards using spaced repetition in JEE 360." }] }),
 component: MemoryPage });

function MemoryPage() {
  const cards = useAppStore((s) => s.cards);
  const lectures = useAppStore((s) => s.lectures);
  const reviewMemory = useAppStore((s) => s.reviewMemory);
  const ensureCards = useAppStore((s) => s.ensureCards);
  const today = todayISO();

  useEffect(() => {
    ensureCards();
  }, [ensureCards]);

  const due = dueCards(cards, today);
  const stats = memoryStats(cards, today);
  const current = due[0];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Lab</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Memory loop</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chapters from your planner enter a spaced orbit. Grade honestly — the interval stretches only when you do.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Due" value={stats.due} />
        <Stat label="New" value={stats.newCount} />
        <Stat label="Mastered" value={stats.mastered} />
        <Stat label="In orbit" value={stats.total} />
      </section>

      {current ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">{SUBJECT_SHORT[current.subject]}</Badge>
              <Badge variant="outline">{current.reps === 0 ? "new" : `int ${current.interval}d`}</Badge>
            </div>
            <p className="font-display text-2xl">{current.chapter}</p>
            <p className="text-sm text-muted-foreground">{current.prompt}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([1, 2, 3, 4] as ReviewGrade[]).map((g) => (
                <Button
                  key={g}
                  variant={g === 1 ? "outline" : g === 3 ? "default" : "secondary"}
                  onClick={() => {
                    reviewMemory(current.id, g);
                    toast(GRADE_LABEL[g], { description: current.chapter });
                  }}
                >
                  {GRADE_LABEL[g]}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{due.length} remaining in this pass</p>
          </CardContent>
        </Card>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="Loop is empty"
          body={lectures.length ? "Cards will appear from your lectures." : "Import a planner first, then the loop fills itself."}
        />
      ) : (
        <EmptyState icon={Brain} title="Orbit clear" body="Nothing is due today. Come back tomorrow or sit a focus block." />
      )}

      {cards.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {cards.slice(0, 16).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm">{c.chapter}</p>
                <p className="text-xs text-muted-foreground">
                  {SUBJECT_SHORT[c.subject]} · due {c.due}
                </p>
              </div>
              <Badge variant={c.due <= today ? "warning" : "outline"}>{c.interval}d</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
        <p className="font-display text-3xl tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
