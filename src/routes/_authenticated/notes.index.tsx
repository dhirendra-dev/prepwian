import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { GlassSurface } from "@/components/GlassSurface";
import { Input } from "@/components/ui/input";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Search, Star, Loader2, ChevronRight } from "lucide-react";
import { SUBJECTS, fetchOverview, searchNotes, pad2, typeMeta, subjectMeta, type ClassLevel } from "@/lib/notes";

const SEARCH_DEBOUNCE_MS = 200;

export const Route = createFileRoute("/_authenticated/notes/")({
  head: () => ({
    meta: [
      { property: "og:description", content: "Chapter-wise notes, summaries, formula sheets, questions and solutions for Class 11 and 12 Physics, Chemistry, Mathematics and Biology." },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Notes & NCERT — PREPWIAN" },
      { name: "twitter:description", content: "Chapter-wise notes, summaries, formula sheets, questions and solutions for Class 11 and 12 Physics, Chemistry, Mathematics and Biology." },

      { title: "Notes & NCERT — PREPWIAN" },
      { name: "description", content: "Chapter-wise notes, summaries, formula sheets, questions and solutions for Class 11 and 12 Physics, Chemistry, Mathematics and Biology." },
      { property: "og:title", content: "Notes & NCERT — PREPWIAN" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://jeeprephub.co.in/notes" }],
  }),
  component: NotesHome,
  errorComponent: ({ error }: { error: unknown }) => <div className="p-6 text-sm text-destructive">{error instanceof Error ? error.message : String(error)}</div>,
});

function NotesHome() {
  const [cls, setCls] = useState<ClassLevel>(11);
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const normalizedQuery = q.trim().replace(/\s+/g, " ");

  useEffect(() => {
    const t = window.setTimeout(() => setTerm(normalizedQuery), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [normalizedQuery]);

  const overview = useQuery({ queryKey: ["notes-overview"], queryFn: fetchOverview, staleTime: 60_000 });
  const search = useQuery({
    queryKey: ["notes-search", term],
    queryFn: () => searchNotes(term),
    enabled: term.length >= 2,
    staleTime: 30_000,
  });

  const stats = useMemo(() => {
    const done = new Set((overview.data?.progress ?? []).filter((p) => p.completed).map((p) => p.chapter_id));
    const out: Record<string, { total: number; done: number }> = {};
    for (const c of overview.data?.chapters ?? []) {
      const k = `${c.class_level}-${c.subject}`;
      out[k] ??= { total: 0, done: 0 };
      out[k].total++;
      if (done.has(c.id)) out[k].done++;
    }
    return out;
  }, [overview.data]);

  const byId = useMemo(() => new Map((overview.data?.chapters ?? []).map((c) => [c.id, c])), [overview.data]);
  const favourites = (overview.data?.progress ?? []).filter((p) => p.favourite && byId.has(p.chapter_id));
  const recent = [...(overview.data?.progress ?? [])]
    .filter((p) => !p.completed && p.viewed_types.length > 0 && byId.has(p.chapter_id))
    .sort((a, b) => b.last_opened_at.localeCompare(a.last_opened_at))
    .slice(0, 3);

  const searching = term.length >= 2;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Notes &amp; NCERT</h1>
          <p className="mt-1 text-sm text-muted-foreground">Class → Subject → Chapter. Everything for a chapter in one place.</p>
        </div>

        <GlassSurface className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search chapter, topic, formula… e.g. Thermodynamics"
              className="pl-9"
              aria-label="Search notes"
              aria-busy={normalizedQuery !== term || search.isFetching}
              autoComplete="off"
              enterKeyHint="search"
            />
            {(normalizedQuery !== term || search.isFetching) && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-label="Updating results" />}
          </div>
        </GlassSurface>

        {searching ? (
          <SearchResults data={search.data} loading={search.isLoading} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {([11, 12] as ClassLevel[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCls(c)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-bold transition-colors ${
                    cls === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 hover:bg-muted/60"
                  }`}
                >
                  Class {c}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SUBJECTS.map((s) => {
                const st = stats[`${cls}-${s.id}`] ?? { total: 0, done: 0 };
                const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
                return (
                  <GlassSurface
                    key={s.id}
                    as={Link}
                    interactive
                    to="/notes/$classId/$subject"
                    params={{ classId: String(cls), subject: s.id }}
                    className={`flex flex-col gap-3 rounded-2xl bg-gradient-to-br p-4 ${s.tint}`}
                  >
                    <span className="text-3xl">{s.emoji}</span>
                    <div>
                      <p className="font-display text-base font-bold text-foreground">{s.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {overview.isLoading ? "…" : `${st.done}/${st.total} chapters completed`}
                      </p>
                    </div>
                    <ProgressBar value={pct} className="h-1.5" />
                  </GlassSurface>
                );
              })}
            </div>

            {recent.length > 0 && (
              <Section title="Continue where you left off">
                {recent.map((p) => (
                  <ChapterRow key={p.chapter_id} c={byId.get(p.chapter_id)!} />
                ))}
              </Section>
            )}

            {favourites.length > 0 && (
              <Section title="Favourites" icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />}>
                {favourites.map((p) => (
                  <ChapterRow key={p.chapter_id} c={byId.get(p.chapter_id)!} />
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ChapterRow({ c }: { c: { id: string; class_level: number; subject: string; chapter_number: number; name: string } }) {
  const s = subjectMeta(c.subject);
  return (
    <GlassSurface as={Link} interactive to="/notes/chapter/$chapterId" params={{ chapterId: c.id }} className="flex items-center gap-3 rounded-2xl px-4 py-3">
      <span className="text-xl">{s?.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {pad2(c.chapter_number)} — {c.name}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {s?.label} · Class {c.class_level}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </GlassSurface>
  );
}

function SearchResults({ data, loading }: { data?: { chapters: any[]; resources: any[] }; loading: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Searching…</p>;
  const chapters = data?.chapters ?? [];
  // Resources whose chapter isn't already listed above.
  const seen = new Set(chapters.map((c) => c.id));
  const extra = (data?.resources ?? []).filter((r) => r.chapter && !seen.has(r.chapter.id));
  if (chapters.length === 0 && extra.length === 0) {
    return <GlassSurface className="p-8 text-center text-sm text-muted-foreground">No notes match that search yet.</GlassSurface>;
  }
  return (
    <div className="space-y-4">
      {chapters.length > 0 && (
        <Section title={`Chapters (${chapters.length})`}>
          {chapters.map((c) => (
            <ChapterRow key={c.id} c={c} />
          ))}
        </Section>
      )}
      {extra.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inside resources</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {extra.map((r) => (
              <GlassSurface
                key={r.id}
                as={Link}
                interactive
                to="/notes/chapter/$chapterId"
                params={{ chapterId: r.chapter.id }}
                className="rounded-2xl px-4 py-3"
              >
                <p className="truncate text-sm font-semibold">{r.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {typeMeta(r.resource_type)?.label} · {r.chapter.name} · Class {r.chapter.class_level} {subjectMeta(r.chapter.subject)?.label}
                </p>
              </GlassSurface>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
