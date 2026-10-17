import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { GlassSurface } from "@/components/GlassSurface";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { ArrowLeft, Search, Star, CheckCircle2, Check } from "lucide-react";
import { SUBJECTS, fetchChapterList, chapterPct, pad2, type ClassLevel, type Subject } from "@/lib/notes";

export const Route = createFileRoute("/_authenticated/notes/$classId/$subject")({
  head: ({ params }) => ({
    meta: [
      { property: "og:title", content: `Class ${params.classId} ${params.subject} Notes — PREPWIAN` },
      { property: "og:description", content: `Chapter-wise Class ${params.classId} ${params.subject} notes, NCERT, summaries, formulas, questions and solutions.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: `Class ${params.classId} ${params.subject} Notes — PREPWIAN` },
      { name: "twitter:description", content: `Chapter-wise Class ${params.classId} ${params.subject} notes, NCERT, summaries, formulas, questions and solutions.` },

      { title: `Class ${params.classId} ${params.subject} Notes — PREPWIAN` },
      { name: "description", content: `Chapter-wise Class ${params.classId} ${params.subject} notes, NCERT, summaries, formulas, questions and solutions.` },
    ],
  }),
  component: ChapterListPage,
  errorComponent: ({ error }: { error: unknown }) => <div className="p-6 text-sm text-destructive">{error instanceof Error ? error.message : String(error)}</div>,
});

const FILTERS = ["all", "favourites", "pending", "completed"] as const;

function ChapterListPage() {
  const { classId, subject } = Route.useParams();
  const cls = Number(classId) as ClassLevel;
  const meta = SUBJECTS.find((s) => s.id === subject);
  const valid = (cls === 11 || cls === 12) && !!meta;

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["notes-chapters", cls, subject],
    queryFn: () => fetchChapterList(cls, subject as Subject),
    enabled: valid,
    staleTime: 60_000,
  });

  const progress = useMemo(() => new Map((data?.progress ?? []).map((p) => [p.chapter_id, p])), [data]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.chapters ?? []).filter((c) => {
      const p = progress.get(c.id);
      if (term && !c.name.toLowerCase().includes(term) && !String(c.chapter_number).includes(term)) return false;
      if (filter === "favourites") return !!p?.favourite;
      if (filter === "completed") return !!p?.completed;
      if (filter === "pending") return !p?.completed;
      return true;
    });
  }, [data, progress, q, filter]);

  if (!valid) {
    return (
      <AppShell>
        <p className="p-6 text-sm text-muted-foreground">Unknown class or subject.</p>
      </AppShell>
    );
  }

  const total = data?.chapters.length ?? 0;
  const done = (data?.chapters ?? []).filter((c) => progress.get(c.id)?.completed).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center gap-3">
          <Button asChild size="icon" variant="outline" className="h-9 w-9 rounded-full">
            <Link to="/notes" aria-label="Back to Notes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold sm:text-2xl">
              {meta!.emoji} {meta!.label} · Class {cls}
            </h1>
            <p className="text-xs text-muted-foreground">
              {meta!.label} — {done}/{total} chapters completed
            </p>
          </div>
        </div>

        <GlassSurface className="space-y-3 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a chapter…" className="pl-9" aria-label="Find a chapter" />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button key={f} type="button" size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="h-7 rounded-full px-3 text-xs capitalize">
                {f}
              </Button>
            ))}
          </div>
        </GlassSurface>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <GlassSurface className="p-10 text-center text-sm text-muted-foreground">No chapters to show.</GlassSurface>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((c) => {
              const avail = data!.types[c.id] ?? [];
              const p = progress.get(c.id);
              const pct = chapterPct(avail, p);
              const flags: [string, boolean][] = [
                ["Notes", avail.includes("notes")],
                ["NCERT", avail.includes("ncert_notes")],
                ["Summary", avail.includes("summary")],
                ["Questions", avail.includes("questions")],
                ["Solutions", avail.includes("solutions")],
              ];
              return (
                <GlassSurface
                  key={c.id}
                  as={Link}
                  interactive
                  to="/notes/chapter/$chapterId"
                  params={{ chapterId: c.id }}
                  className="flex flex-col gap-3 rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-display text-lg font-bold text-muted-foreground">{pad2(c.chapter_number)}</span>
                    <p className="flex-1 text-sm font-semibold leading-snug">{c.name}</p>
                    {p?.favourite && <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />}
                    {p?.completed && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                  </div>
                  {avail.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">Coming soon</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {flags
                        .filter(([, on]) => on)
                        .map(([label]) => (
                          <span key={label} className="inline-flex items-center gap-0.5 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium">
                            {label} <Check className="h-3 w-3 text-emerald-500" />
                          </span>
                        ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <ProgressBar value={pct} className="h-1.5 flex-1" />
                    <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
                  </div>
                </GlassSurface>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}