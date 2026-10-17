import { createFileRoute, Link, useNavigate as useRouterNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { listPublicTests, listMyAttempts, listMyBookmarks } from "@/lib/tests.functions";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import {
  Atom, FlaskConical, Sigma, Dna, Layers, Search, ChevronLeft, ChevronRight,
  CheckCircle2, PlayCircle, Circle, Clock, Radio, Bookmark, History, LayoutGrid, X,
  Sparkles, Shuffle, Flame, Target, TrendingUp, Zap,
} from "lucide-react";

export const Route = createFileRoute("/tests/")({
  validateSearch: (s: Record<string, unknown>): { series?: string } => ({
    series: typeof s.series === "string" && s.series ? s.series : undefined,
  }),
  head: () => ({
    meta: [
      { name: "twitter:title", content: "JEE Test Series — CBT Mock Tests" },
      { name: "twitter:description", content: "Real-exam CBT interface with timer, palette, negative marking, and post-attempt analysis." },

      { title: "JEE Test Series — Practice CBT Mock Tests | PREPWIAN" },
      { name: "description", content: "Attempt JEE Main, Advanced and NEET style CBT mock tests with real exam interface, timer, and detailed analytics." },
      { property: "og:title", content: "JEE Test Series — CBT Mock Tests" },
      { property: "og:description", content: "Real-exam CBT interface with timer, palette, negative marking, and post-attempt analysis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TestsIndex,
});

/* ───────────────────────── types & helpers ───────────────────────── */

type T = {
  id: string;
  name: string;
  exam_type?: string;
  subject?: string;
  difficulty?: string;
  duration_min?: number;
  total_marks?: number;
  question_count?: number;
  mode?: string;
  status?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_premium?: boolean;
};

type Prog = {
  done: boolean;
  bestPct: number | null;
  resumeId: string | null;
  viewId: string | null;
};

type Folder = {
  key: string;
  title: string;
  tests: T[];
  subject: string;
  subjects: Set<string>;
  done: number;
  live: number;
  premium: number;
};

type Tab = "series" | "live" | "saved" | "history";

const OTHER = "__other__";
const OTHER_TITLE = "Practice & Other Tests";
const PAGE = 30;

const SUBJECT_CHIPS: Array<[string, string]> = [
  ["all", "All"],
  ["physics", "Physics"],
  ["chemistry", "Chemistry"],
  ["mathematics", "Maths"],
  ["biology", "Biology"],
  ["mixed", "Mixed"],
];

/** "BIO FORGE — NCERT LINE-BY-LINE — 01 | The Living World" -> "BIO FORGE — NCERT LINE-BY-LINE" */
function seriesOf(name: string): string {
  const head = name.split(" | ")[0].trim();
  const cleaned = head
    .replace(/\s*[—–-]+\s*(?:PART\s*)?\d+\s*$/i, "")
    .replace(/\s+\d+\s*$/, "")
    .trim();
  return cleaned || name.trim();
}

/** Remove the series prefix so rows inside a folder stay short. */
function shortTitle(name: string, series: string): string {
  let rest = name.trim();
  if (series && rest.toLowerCase().startsWith(series.toLowerCase())) rest = rest.slice(series.length);
  rest = rest.replace(/^[\s—–|:-]+/, "").replace(/\s*\|\s*/g, " · ").trim();
  return rest || name.trim();
}

const SUBJECT_LABEL: Record<string, string> = {
  physics: "Physics", chemistry: "Chemistry", mathematics: "Maths", biology: "Biology", mixed: "Mixed",
};

function subjectMeta(s: string) {
  switch (s) {
    case "physics":
      return { Icon: Atom, tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400", grad: "from-blue-500/15", bar: "bg-blue-500" };
    case "chemistry":
      return { Icon: FlaskConical, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", grad: "from-emerald-500/15", bar: "bg-emerald-500" };
    case "mathematics":
      return { Icon: Sigma, tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400", grad: "from-violet-500/15", bar: "bg-violet-500" };
    case "biology":
      return { Icon: Dna, tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400", grad: "from-rose-500/15", bar: "bg-rose-500" };
    default:
      return { Icon: Layers, tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400", grad: "from-amber-500/15", bar: "bg-amber-500" };
  }
}

const dayKey = (d: string | Date) => new Date(d).toLocaleDateString("en-CA");

function timing(t: T, now: number) {
  const s = t.starts_at ? new Date(t.starts_at).getTime() : null;
  const e = t.ends_at ? new Date(t.ends_at).getTime() : null;
  const upcoming = s !== null && s > now;
  const ended = e !== null && e < now;
  const windowed = s !== null || e !== null;
  // "Live" only means a real timed window — open practice tests are not "live".
  const live = windowed && !upcoming && !ended && t.mode !== "practice";
  return { s, upcoming, ended, live };
}

const natural = (a: T, b: T) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });

/* ───────────────────────── page ───────────────────────── */

function TestsIndex() {
  const { user } = useAuth();
  const { series } = Route.useSearch();
  const navigate = Route.useNavigate();

  const fetchList = useServerFn(listPublicTests);
  const fetchAttempts = useServerFn(listMyAttempts);
  const fetchBookmarks = useServerFn(listMyBookmarks);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["tests", "public"], queryFn: () => fetchList() });
  const { data: attempts } = useQuery({ queryKey: ["tests", "my-attempts"], queryFn: () => fetchAttempts(), enabled: !!user });
  const { data: bookmarks } = useQuery({ queryKey: ["tests", "my-bookmarks"], queryFn: () => fetchBookmarks(), enabled: !!user });

  const [tab, setTab] = useState<Tab>("series");
  const [subject, setSubject] = useState("all");
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<"all" | "todo" | "done">("all");
  const [limit, setLimit] = useState(PAGE);
  const [freeOnly, setFreeOnly] = useState(false);
  const [lastSeries, setLastSeries] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const goTo = useRouterNavigate();

  useEffect(() => {
    try { setLastSeries(localStorage.getItem("jph_last_series")); } catch { /* ignore */ }
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const all = useMemo(() => ((data ?? []) as T[]).filter((t) => t?.id), [data]);
  const attemptRows = useMemo(() => ((attempts as any[] | undefined) ?? []), [attempts]);
  const bookmarkTests = useMemo(() => ((bookmarks as T[] | undefined) ?? []).filter((t) => t?.id), [bookmarks]);
  const qn = q.trim().toLowerCase();

  // per-test progress from the user's attempts
  const progress = useMemo(() => {
    const m = new Map<string, Prog>();
    for (const a of attemptRows) {
      if (!a?.test_id) continue;
      const p: Prog = m.get(a.test_id) ?? { done: false, bestPct: null, resumeId: null, viewId: null };
      if (a.status === "in_progress") {
        if (!p.resumeId) p.resumeId = a.id;
      } else if (a.status === "submitted" || a.status === "auto_submitted") {
        p.done = true;
        if (!p.viewId) p.viewId = a.id;
        const pct = Number(a.max_score) ? (Number(a.score) / Number(a.max_score)) * 100 : 0;
        if (p.bestPct === null || pct > p.bestPct) p.bestPct = pct;
      }
      m.set(a.test_id, p);
    }
    return m;
  }, [attemptRows]);

  // group tests into series folders by name
  const folders = useMemo(() => {
    const now = Date.now();
    const groups = new Map<string, T[]>();
    for (const t of all) {
      const s = seriesOf(t.name);
      const arr = groups.get(s);
      if (arr) arr.push(t);
      else groups.set(s, [t]);
    }
    const real: Array<[string, string, T[]]> = [];
    const singles: T[] = [];
    for (const [s, list] of groups) {
      if (list.length > 1) real.push([s, s, list]);
      else singles.push(list[0]);
    }
    if (singles.length) real.push([OTHER, OTHER_TITLE, singles]);

    const out: Folder[] = real.map(([key, title, list]) => {
      const sorted = [...list].sort(natural);
      const counts = new Map<string, number>();
      for (const t of sorted) counts.set(t.subject ?? "mixed", (counts.get(t.subject ?? "mixed") ?? 0) + 1);
      let top = "mixed";
      let topN = 0;
      for (const [k, n] of counts) if (n > topN) { top = k; topN = n; }
      const dominant = counts.size > 1 && topN / sorted.length < 0.7 ? "mixed" : top;
      return {
        key,
        title,
        tests: sorted,
        subject: dominant,
        subjects: new Set(counts.keys()),
        done: sorted.filter((t) => progress.get(t.id)?.done).length,
        live: sorted.filter((t) => timing(t, now).live).length,
        premium: sorted.filter((t) => t.is_premium).length,
      };
    });
    out.sort((a, b) => {
      if (a.key === OTHER) return 1;
      if (b.key === OTHER) return -1;
      return b.tests.length - a.tests.length;
    });
    return out;
  }, [all, progress]);

  const byId = useMemo(() => new Map(all.map((t) => [t.id, t])), [all]);

  // personal analytics from attempts
  const stats = useMemo(() => {
    const done = attemptRows.filter((a) => a.status === "submitted" || a.status === "auto_submitted");
    const pcts = done.map((a) => (Number(a.max_score) ? (Number(a.score) / Number(a.max_score)) * 100 : 0));
    const avg = pcts.length ? pcts.reduce((x, y) => x + y, 0) / pcts.length : 0;
    const best = pcts.length ? Math.max(...pcts) : 0;
    const acc = done.length ? done.reduce((sum, a) => sum + Number(a.accuracy || 0), 0) / done.length : 0;
    const distinct = new Set(done.map((a) => a.test_id)).size;

    const days = new Set(attemptRows.map((a) => dayKey(a.started_at)));
    let streak = 0;
    const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }

    const sub = new Map<string, { sum: number; n: number }>();
    done.forEach((a, i) => {
      const subj = byId.get(a.test_id)?.subject;
      if (!subj) return;
      const cur = sub.get(subj) ?? { sum: 0, n: 0 };
      cur.sum += pcts[i];
      cur.n += 1;
      sub.set(subj, cur);
    });
    const subjects = [...sub.entries()]
      .map(([key, v]) => ({ key, avg: v.sum / v.n, n: v.n }))
      .sort((a, b) => b.avg - a.avg);
    return { attempts: done.length, distinct, avg, best, acc, streak, subjects };
  }, [attemptRows, byId]);

  // "Smart pick": target the weakest subject, else a good starting point
  const smartPick = useMemo(() => {
    const nowTs = Date.now();
    const open = (t: T) => {
      const tm = timing(t, nowTs);
      return !progress.get(t.id)?.done && !tm.ended && !tm.upcoming;
    };
    const weak = [...stats.subjects].filter((x) => x.key !== "mixed").sort((a, b) => a.avg - b.avg)[0];
    if (weak) {
      const t = all.filter((x) => x.subject === weak.key).sort(natural).find(open);
      if (t) return { t, reason: `${SUBJECT_LABEL[weak.key] ?? weak.key} is your weakest area (${Math.round(weak.avg)}% avg). Level it up.` };
    }
    const start = folders.find((f) => f.key !== OTHER)?.tests.find(open) ?? all.slice().sort(natural).find(open);
    if (start) return { t: start, reason: stats.attempts ? "Keep your momentum going." : "A great place to begin." };
    return null;
  }, [stats, all, folders, progress]);

  const surprise = () => {
    const nowTs = Date.now();
    const pool = all.filter((t) => {
      const tm = timing(t, nowTs);
      return !progress.get(t.id)?.done && !tm.ended && !tm.upcoming;
    });
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    goTo({ to: "/tests/$testId", params: { testId: pick.id } });
  };

  const folder = series ? folders.find((f) => f.key === series) : undefined;

  const visibleFolders = useMemo(
    () => (subject === "all" ? folders : folders.filter((f) => f.subjects.has(subject))),
    [folders, subject],
  );

  const folderTests = useMemo(() => {
    if (!folder) return [] as T[];
    let list = folder.tests;
    if (qn) list = list.filter((t) => t.name.toLowerCase().includes(qn));
    if (statusF === "done") list = list.filter((t) => progress.get(t.id)?.done);
    if (statusF === "todo") list = list.filter((t) => !progress.get(t.id)?.done);
    if (freeOnly) list = list.filter((t) => !t.is_premium);
    return list;
  }, [folder, qn, statusF, freeOnly, progress]);

  const nextUp = useMemo(() => {
    if (!folder) return undefined;
    const now = Date.now();
    return folder.tests.find((t) => {
      const tm = timing(t, now);
      return !progress.get(t.id)?.done && !tm.ended && !tm.upcoming;
    });
  }, [folder, progress]);

  const searchResults = useMemo(() => {
    if (!qn || series) return [] as T[];
    return all.filter((t) => t.name.toLowerCase().includes(qn)).slice(0, 60);
  }, [all, qn, series]);

  const liveList = useMemo(() => {
    const now = Date.now();
    return all
      .map((t) => ({ t, tm: timing(t, now) }))
      .filter((x) => x.tm.live || x.tm.upcoming)
      .sort((a, b) => Number(b.tm.live) - Number(a.tm.live) || (a.tm.s ?? 0) - (b.tm.s ?? 0))
      .map((x) => x.t);
  }, [all]);

  const resumeList = useMemo(
    () => attemptRows.filter((a) => a.status === "in_progress").slice(0, 3),
    [attemptRows],
  );

  const now = Date.now();

  const openFolder = (key: string) => {
    setQ("");
    setStatusF("all");
    setLimit(PAGE);
    try { localStorage.setItem("jph_last_series", key); setLastSeries(key); } catch { /* ignore */ }
    navigate({ search: { series: key } });
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };
  const closeFolder = () => {
    setQ("");
    setStatusF("all");
    setLimit(PAGE);
    navigate({ search: {} });
  };
  const switchTab = (t: Tab) => {
    setTab(t);
    setQ("");
    if (series) navigate({ search: {} });
  };

  const tabs: Array<[Tab, string, typeof LayoutGrid]> = [
    ["series", "Series", LayoutGrid],
    ["live", "Live", Radio],
    ["saved", "Saved", Bookmark],
    ["history", "History", History],
  ];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex flex-col gap-4 overflow-hidden rounded-2xl border border-violet-300/30 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-5 text-white shadow-lg shadow-indigo-950/10 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-violet-200/20 bg-violet-400/15 text-violet-200">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">NEW · PREP LAB</div>
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">A smarter way to practise.</h2>
              <p className="mt-1 max-w-xl text-xs leading-6 text-slate-300">Build targeted JEE/NEET sessions from 2,000 original generated practice variants, with explanations, bookmarks and mistake-led revision.</p>
            </div>
          </div>
          <Link to="/prep-lab" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-300 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-violet-200">
            Open Prep Lab <PlayCircle className="size-4" />
          </Link>
        </div>
        {/* header */}
        <div className="mb-3">
          <h1 className="text-2xl font-bold sm:text-3xl">Test Series</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading tests…" : `${all.length} tests in ${folders.length} series`}
          </p>
        </div>

        <Link to="/tests/jee-hub" className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-4 transition-colors hover:border-primary/50">
          <span className="min-w-0">
            <span className="block text-sm font-semibold">JEEHub repository papers</span>
            <span className="mt-1 block text-xs text-muted-foreground">15 source subsets across JEE, NEET, BITSAT, COMEDK, and MHT-CET.</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-primary" />
        </Link>

        {/* tabs */}
        <div className="mb-3 grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
          {tabs.map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => switchTab(k)}
              className={`relative flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
                tab === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {k === "live" && liveList.length > 0 && (
                <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-red-600" />
              )}
            </button>
          ))}
        </div>

        {isError && (
          <div className="rounded-xl border bg-card p-6 text-center text-sm">
            <p className="mb-3 text-muted-foreground">Could not load tests right now.</p>
            <Button size="sm" onClick={() => refetch()}>Try again</Button>
          </div>
        )}

        {/* ───────── SERIES TAB ───────── */}
        {!isError && tab === "series" && (
          <>
            {/* search */}
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }}
                placeholder={folder ? `Search in ${folder.title}` : "Search all tests…  (press / )"}
                className="h-10 pl-9 pr-9"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* inside a folder */}
            {series ? (
              isLoading ? (
                <ListSkeleton />
              ) : !folder ? (
                <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                  <p className="mb-3">This series was not found.</p>
                  <Button size="sm" variant="outline" onClick={closeFolder}>Back to all series</Button>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={closeFolder} aria-label="Back">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-bold leading-tight">{folder.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        {folder.tests.length} tests · {folder.done} done
                      </p>
                    </div>
                  </div>
                  <Progress value={folder.tests.length ? (folder.done / folder.tests.length) * 100 : 0} className="mb-3 h-1.5" />

                  {nextUp && folder.done > 0 && !qn && (
                    <Link
                      to="/tests/$testId"
                      params={{ testId: nextUp.id }}
                      className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block text-[11px] font-medium uppercase tracking-wide text-primary">Next up</span>
                        <span className="block truncate font-medium">
                          {folder.key === OTHER ? nextUp.name : shortTitle(nextUp.name, folder.key)}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                    </Link>
                  )}

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant={freeOnly ? "default" : "outline"}
                      className="h-8 rounded-full px-3 text-xs"
                      onClick={() => { setFreeOnly((v) => !v); setLimit(PAGE); }}
                    >
                      <Zap className="mr-1 h-3 w-3" />Free
                    </Button>
                    {([["all", "All"], ["todo", "To do"], ["done", "Done"]] as const).map(([k, label]) => (
                      <Button
                        key={k}
                        size="sm"
                        variant={statusF === k ? "default" : "outline"}
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={() => { setStatusF(k); setLimit(PAGE); }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>

                  {folderTests.length === 0 ? (
                    <Empty text="No tests match." />
                  ) : (
                    <div className="space-y-2">
                      {folderTests.slice(0, limit).map((t) => (
                        <TestRow
                          key={t.id}
                          t={t}
                          prog={progress.get(t.id)}
                          title={folder.key === OTHER ? t.name : shortTitle(t.name, folder.key)}
                          now={now}
                        />
                      ))}
                      {folderTests.length > limit && (
                        <Button variant="outline" className="w-full" onClick={() => setLimit((n) => n + PAGE)}>
                          Show more ({folderTests.length - limit} left)
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )
            ) : qn ? (
              /* global search */
              searchResults.length === 0 ? (
                <Empty text="No tests match your search." />
              ) : (
                <div className="space-y-2">
                  {searchResults.map((t) => (
                    <TestRow
                      key={t.id}
                      t={t}
                      prog={progress.get(t.id)}
                      title={t.name}
                      subtitle={(() => {
                        const s = seriesOf(t.name);
                        return folders.find((f) => f.key === s) ? s : OTHER_TITLE;
                      })()}
                      now={now}
                    />
                  ))}
                </div>
              )
            ) : (
              /* folder home */
              <>
                <Hero
                  signedIn={!!user}
                  loading={isLoading}
                  total={all.length}
                  stats={stats}
                  pick={smartPick}
                  onSurprise={surprise}
                  lastSeries={lastSeries && folders.find((f) => f.key === lastSeries) ? folders.find((f) => f.key === lastSeries)! : null}
                  onOpenSeries={openFolder}
                />

                {resumeList.length > 0 && (
                  <div className="mb-4">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Continue where you left off</h2>
                    <div className="space-y-2">
                      {resumeList.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
                          <PlayCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                          <p className="min-w-0 flex-1 truncate text-sm font-medium">{a.tests?.name ?? "Test in progress"}</p>
                          <Button asChild size="sm" className="h-8">
                            <Link to="/tests/attempt/$attemptId" params={{ attemptId: a.id }}>Resume</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
                  {SUBJECT_CHIPS.map(([k, label]) => (
                    <Button
                      key={k}
                      size="sm"
                      variant={subject === k ? "default" : "outline"}
                      className="h-8 shrink-0 rounded-full px-3 text-xs"
                      onClick={() => setSubject(k)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />)}
                  </div>
                ) : visibleFolders.length === 0 ? (
                  <Empty text="No series for this subject yet." />
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {visibleFolders.map((f) => (
                      <FolderCard key={f.key} f={f} onOpen={() => openFolder(f.key)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ───────── LIVE TAB ───────── */}
        {!isError && tab === "live" && (
          isLoading ? <ListSkeleton /> : liveList.length === 0 ? (
            <Empty text="No live or scheduled tests right now." />
          ) : (
            <div className="space-y-2">
              {liveList.map((t) => (
                <TestRow key={t.id} t={t} prog={progress.get(t.id)} title={t.name} now={now} />
              ))}
            </div>
          )
        )}

        {/* ───────── SAVED TAB ───────── */}
        {!isError && tab === "saved" && (
          bookmarkTests.length === 0 ? (
            <Empty text="No saved tests yet. Open a test and tap the bookmark to save it." />
          ) : (
            <div className="space-y-2">
              {bookmarkTests.map((t) => (
                <TestRow key={t.id} t={t} prog={progress.get(t.id)} title={t.name} now={now} />
              ))}
            </div>
          )
        )}

        {/* ───────── HISTORY TAB ───────── */}
        {!isError && tab === "history" && <AttemptList rows={attemptRows} signedIn={!!user} stats={stats} />}
      </div>
    </AppShell>
  );
}

/* ───────────────────────── pieces ───────────────────────── */

function Ring({ value, size = 44, stroke = 4, label, className = "" }: { value: number; size?: number; stroke?: number; label?: string; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{label ?? `${Math.round(v)}%`}</span>
    </div>
  );
}

function FolderCard({ f, onOpen }: { f: Folder; onOpen: () => void }) {
  const { Icon, tint, grad } = subjectMeta(f.subject);
  const pct = f.tests.length ? Math.round((f.done / f.tests.length) * 100) : 0;
  const complete = f.tests.length > 0 && f.done === f.tests.length;
  return (
    <button
      onClick={onOpen}
      className={`group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-gradient-to-br ${grad} to-transparent bg-card p-3.5 text-left transition duration-200 animate-in fade-in hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md active:scale-[0.98]`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
          <Icon className="h-5 w-5" />
        </span>
        <Ring value={pct} size={40} stroke={3.5} label={complete ? "✓" : `${pct}%`} className={complete ? "text-green-600" : "text-primary"} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{f.title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{f.done}/{f.tests.length} done</p>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="secondary" className="px-1.5 text-[10px]">{f.tests.length} tests</Badge>
        {f.live > 0 && <Badge className="bg-red-600 px-1.5 text-[10px] text-white">● {f.live} live</Badge>}
        {f.live === 0 && f.premium > 0 && <Badge className="bg-amber-500 px-1.5 text-[10px] text-white">PRO</Badge>}
      </div>
    </button>
  );
}

type Stats = {
  attempts: number; distinct: number; avg: number; best: number; acc: number; streak: number;
  subjects: Array<{ key: string; avg: number; n: number }>;
};

function Hero({
  signedIn, loading, total, stats, pick, onSurprise, lastSeries, onOpenSeries,
}: {
  signedIn: boolean; loading: boolean; total: number; stats: Stats;
  pick: { t: T; reason: string } | null; onSurprise: () => void;
  lastSeries: Folder | null; onOpenSeries: (key: string) => void;
}) {
  const completion = total ? (stats.distinct / total) * 100 : 0;
  if (loading) return <div className="mb-4 h-44 animate-pulse rounded-2xl bg-muted" />;
  return (
    <div className="mb-4 space-y-3 animate-in fade-in">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-background to-violet-500/10 p-4">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        {signedIn && stats.attempts > 0 ? (
          <>
            <div className="relative flex items-center gap-4">
              <Ring value={completion} size={72} stroke={6} className="text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Your progress</p>
                <p className="text-lg font-bold leading-tight">{stats.distinct} of {total} tests</p>
                {stats.streak > 0 && (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                    <Flame className="h-3.5 w-3.5" />{stats.streak}-day streak
                  </p>
                )}
              </div>
            </div>
            <div className="relative mt-3 grid grid-cols-3 gap-2">
              {[
                { Icon: TrendingUp, label: "Avg score", value: `${Math.round(stats.avg)}%` },
                { Icon: Target, label: "Accuracy", value: `${Math.round(stats.acc)}%` },
                { Icon: Sparkles, label: "Best", value: `${Math.round(stats.best)}%` },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="rounded-xl bg-background/60 p-2 text-center backdrop-blur">
                  <Icon className="mx-auto mb-0.5 h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-bold">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="relative">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Real exam interface</p>
            <p className="text-lg font-bold leading-tight">
              {signedIn ? "Take your first test to unlock your stats" : "Sign in to track your progress"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Score, accuracy, streak and a smart pick tuned to your weak subject.</p>
          </div>
        )}
      </div>

      {pick && (
        <div className="flex items-center gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
            <Sparkles className="h-4 w-4" />
          </span>
          <Link to="/tests/$testId" params={{ testId: pick.t.id }} className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">Smart pick</span>
            <span className="block truncate text-sm font-medium">{pick.t.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{pick.reason}</span>
          </Link>
          <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={onSurprise} aria-label="Surprise me">
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {lastSeries && (
        <button
          onClick={() => onOpenSeries(lastSeries.key)}
          className="flex w-full items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2 text-left text-xs"
        >
          <span className="min-w-0 truncate"><span className="text-muted-foreground">Jump back in: </span><span className="font-medium">{lastSeries.title}</span></span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

function TestRow({ t, prog, title, subtitle, now }: { t: T; prog?: Prog; title: string; subtitle?: string; now: number }) {
  const tm = timing(t, now);
  const done = !!prog?.done;
  const resuming = !!prog?.resumeId;
  return (
    <div className="relative flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/60 hover:bg-muted/30">
      <Link
        to="/tests/$testId"
        params={{ testId: t.id }}
        aria-label={`Open ${t.name}`}
        className="absolute inset-0 z-10 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {resuming ? (
        <PlayCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
      ) : done ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
      ) : (
        <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
      )}

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{title}</p>
        {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {!!t.duration_min && (
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{t.duration_min}m</span>
          )}
          {t.question_count != null && <span>{t.question_count} Q</span>}
          {!!Number(t.total_marks) && <span>{Number(t.total_marks)} marks</span>}
          {tm.upcoming && tm.s && (
            <span className="text-blue-600 dark:text-blue-400">Starts {new Date(tm.s).toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className="pointer-events-none relative z-20 flex shrink-0 flex-col items-end gap-1">
        {t.is_premium && <Badge className="bg-amber-500 px-1.5 text-[10px] text-white">PRO</Badge>}
        {tm.live && <Badge className="animate-pulse bg-red-600 px-1.5 text-[10px] text-white">● LIVE</Badge>}
        {tm.upcoming && <Badge variant="outline" className="border-blue-500 px-1.5 text-[10px] text-blue-600">Soon</Badge>}
        {tm.ended && !done && <Badge variant="outline" className="px-1.5 text-[10px]">Ended</Badge>}
        {resuming ? (
          <Button asChild size="sm" className="pointer-events-auto h-7 px-2.5 text-xs">
            <Link to="/tests/attempt/$attemptId" params={{ attemptId: prog!.resumeId! }}>Resume</Link>
          </Button>
        ) : done && prog?.bestPct != null ? (
          <span className="text-xs font-semibold text-green-600">{Math.round(prog.bestPct)}%</span>
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

function AttemptList({ rows, signedIn, stats }: { rows: any[]; signedIn: boolean; stats: Stats }) {
  if (!signedIn) return <Empty text="Sign in to see your attempts." />;
  if (rows.length === 0) return <Empty text="You haven't attempted any tests yet." />;
  return (
    <div className="space-y-2">
      {stats.subjects.length > 0 && (
        <div className="mb-3 rounded-2xl border bg-card p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Performance by subject</p>
          <div className="space-y-2">
            {stats.subjects.map((x) => {
              const { bar } = subjectMeta(x.key);
              return (
                <div key={x.key}>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span className="font-medium">{SUBJECT_LABEL[x.key] ?? x.key} <span className="text-muted-foreground">· {x.n} test{x.n > 1 ? "s" : ""}</span></span>
                    <span className="font-semibold">{Math.round(x.avg)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${Math.max(2, Math.min(100, x.avg))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {rows.map((a: any) => {
        const pct = Number(a.max_score) ? (Number(a.score) / Number(a.max_score)) * 100 : 0;
        const inProgress = a.status === "in_progress";
        return (
          <div key={a.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug">{a.tests?.name ?? "Test"}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <Badge
                  className={`px-1.5 text-[10px] text-white ${
                    a.status === "submitted" ? "bg-green-600" : a.status === "auto_submitted" ? "bg-orange-500" : inProgress ? "bg-blue-600" : "bg-slate-500"
                  }`}
                >
                  {String(a.status).replace("_", " ")}
                </Badge>
                <span>{new Date(a.started_at).toLocaleDateString()}</span>
                {!inProgress && <span>{Number(a.score).toFixed(1)}/{Number(a.max_score)} · {pct.toFixed(0)}%</span>}
              </div>
            </div>
            {inProgress ? (
              <Button asChild size="sm" className="h-8">
                <Link to="/tests/attempt/$attemptId" params={{ attemptId: a.id }}>Resume</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="h-8">
                <Link to="/tests/result/$attemptId" params={{ attemptId: a.id }}>View</Link>
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
    </div>
  );
}
