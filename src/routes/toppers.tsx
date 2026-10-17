import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Award,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  Filter,
  MapPin,
  Medal,
  Search,
  Share2,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Exam = "class_10" | "class_11" | "class_12" | "jee_main" | "jee_advanced" | "neet";
type Topper = {
  id: string;
  year: number;
  exam: Exam;
  rank: number;
  name: string;
  city: string | null;
  state: string | null;
  marks: string | null;
  percentile: string | null;
  photo_url: string | null;
  source_url: string | null;
  notes: string | null;
};
type ExamFilter = Exam | "all";

const EXAMS: { id: Exam; name: string; short: string; accent: string }[] = [
  { id: "class_10", name: "Class 10", short: "Class 10", accent: "violet" },
  { id: "class_11", name: "Class 11", short: "Class 11", accent: "blue" },
  { id: "class_12", name: "Class 12", short: "Class 12", accent: "emerald" },
  { id: "jee_advanced", name: "JEE Advanced", short: "Advanced", accent: "amber" },
  { id: "jee_main", name: "JEE Main", short: "JEE Main", accent: "blue" },
  { id: "neet", name: "NEET", short: "NEET", accent: "teal" },
];
const EXAM_NAME: Record<Exam, string> = {
  class_10: "Class 10",
  class_11: "Class 11",
  class_12: "Class 12",
  jee_advanced: "JEE Advanced",
  jee_main: "JEE Main",
  neet: "NEET",
};
const TOPPER_COLUMNS =
  "id, year, exam, rank, name, city, state, marks, percentile, photo_url, source_url, notes";

const toppersQuery = queryOptions({
  queryKey: ["toppers", "public"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("toppers")
      .select(TOPPER_COLUMNS)
      .order("year", { ascending: false })
      .order("exam")
      .order("rank");
    if (error) throw error;
    return (data ?? []) as Topper[];
  },
});

export const Route = createFileRoute("/toppers")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Toppers Hall of Fame | JEE Prep Hub" },
      { name: "twitter:description", content: "Meet inspiring school, JEE and NEET achievers from across India." },

      { title: "Toppers Hall of Fame | JEE Prep Hub" },
      {
        name: "description",
        content:
          "Celebrate Class 10, Class 11, Class 12, JEE Advanced, JEE Main and NEET toppers. Explore ranks, scores and stories from outstanding students.",
      },
      { property: "og:title", content: "Toppers Hall of Fame | JEE Prep Hub" },
      {
        property: "og:description",
        content: "Meet inspiring school, JEE and NEET achievers from across India.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(toppersQuery),
  errorComponent: ({ error, reset }: { error: unknown; reset?: () => void }) => (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <Trophy className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-xl font-bold">The Hall of Fame could not load</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Please try again in a moment."}
      </p>
      {reset && (
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
      )}
    </main>
  ),
  component: TopperPage,
});

function TopperPage() {
  const { data } = useSuspenseQuery(toppersQuery);
  const [exam, setExam] = useState<ExamFilter>("all");
  const [year, setYear] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"rank" | "newest">("rank");
  const [selected, setSelected] = useState<Topper | null>(null);

  const years = useMemo(
    () => [...new Set(data.map((topper) => topper.year))].sort((a, b) => b - a),
    [data],
  );
  const counts = useMemo(() => {
    const grouped = new Map<Exam, number>();
    data.forEach((topper) => grouped.set(topper.exam, (grouped.get(topper.exam) ?? 0) + 1));
    return grouped;
  }, [data]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return data
      .filter((topper) => {
        if (exam !== "all" && topper.exam !== exam) return false;
        if (year !== "all" && topper.year !== Number(year)) return false;
        if (!needle) return true;
        return [topper.name, topper.city, topper.state, topper.notes, EXAM_NAME[topper.exam]]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
          .includes(needle);
      })
      .sort((a, b) =>
        sort === "newest" ? b.year - a.year || a.rank - b.rank : a.rank - b.rank || b.year - a.year,
      );
  }, [data, exam, year, search, sort]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("t");
    if (id) setSelected(data.find((topper) => topper.id === id) ?? null);
  }, [data]);

  function openTopper(topper: Topper) {
    setSelected(topper);
    const url = new URL(window.location.href);
    url.searchParams.set("t", topper.id);
    window.history.replaceState(window.history.state, "", url);
  }
  function closeTopper() {
    setSelected(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("t");
    window.history.replaceState(window.history.state, "", url);
  }
  function resetFilters() {
    setExam("all");
    setYear("all");
    setSearch("");
  }

  const leaders = filtered.filter((topper) => topper.rank <= 3).slice(0, 3);
  const totalYears = new Set(data.map((topper) => topper.year)).size;

  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950 dark:bg-[#090f1d] dark:text-slate-50">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-500/10" />
        <div className="absolute -right-40 top-0 h-[30rem] w-[30rem] rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-500/10" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-9 text-white shadow-2xl shadow-slate-950/10 dark:border-white/10 sm:px-10 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(245,158,11,0.26),transparent_35%),radial-gradient(ellipse_at_0%_100%,rgba(59,130,246,0.18),transparent_40%)]" />
          <div
            className="absolute -right-8 -top-16 hidden rotate-12 text-white/[0.035] sm:block"
            aria-hidden="true"
          >
            <Trophy className="h-80 w-80" strokeWidth={1} />
          </div>
          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-100/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">
                <Sparkles className="h-3.5 w-3.5" /> JEE Prep Hub · Hall of Fame
              </div>
              <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.03] tracking-tight sm:text-5xl lg:text-6xl">
                Big dreams.
                <span className="block bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-300 bg-clip-text text-transparent">
                  Brilliant results.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Meet the students who turned years of focus into extraordinary ranks. Their journeys
                start here—and yours can too.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <HeroStat value={data.length} label="achievers" />
              <HeroStat value={EXAMS.length} label="categories" />
              <HeroStat value={totalYears} label="years" />
            </div>
          </div>
          <div className="relative mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <Medal className="h-4 w-4 text-violet-300" /> Class 10 · 11 · 12
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpenCheck className="h-4 w-4 text-amber-300" /> JEE Advanced · JEE Main
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-4 w-4 text-emerald-300" /> NEET
            </span>
          </div>
        </section>

        {leaders.length > 0 && !search && sort === "rank" && (
          <section className="mt-9" aria-labelledby="leaders-heading">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-amber-600 dark:text-amber-300">
                  The front-runners
                </p>
                <h2
                  id="leaders-heading"
                  className="mt-1 text-xl font-black tracking-tight sm:text-2xl"
                >
                  Top ranks, remarkable stories
                </h2>
              </div>
              <span className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground sm:inline-flex">
                {exam === "all" ? "All exams" : EXAM_NAME[exam]}
                {year !== "all" ? ` · ${year}` : ""}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {leaders.map((topper) => (
                <LeaderCard key={topper.id} topper={topper} onOpen={() => openTopper(topper)} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-10" aria-labelledby="directory-heading">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-primary">
                Explore the achievers
              </p>
              <h2
                id="directory-heading"
                className="mt-1 text-xl font-black tracking-tight sm:text-2xl"
              >
                Every rank has a story
              </h2>
            </div>
            <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "achiever" : "achievers"}
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/90 p-3 shadow-sm backdrop-blur sm:p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search a name, city, exam…"
                  aria-label="Search toppers"
                  className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm outline-none transition placeholder:text-muted-foreground/75 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>
              <label className="relative">
                <Filter className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={exam}
                  onChange={(event) => setExam(event.target.value as ExamFilter)}
                  aria-label="Filter by exam"
                  className="h-11 w-full appearance-none rounded-xl border border-border bg-background pl-10 pr-10 text-sm font-semibold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 sm:min-w-44"
                >
                  <option value="all">All exams</option>
                  {EXAMS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </label>
              <div className="flex gap-2">
                <label className="relative min-w-0 flex-1">
                  <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                    aria-label="Filter by year"
                    className="h-11 w-full appearance-none rounded-xl border border-border bg-background pl-10 pr-10 text-sm font-semibold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 sm:min-w-32"
                  >
                    <option value="all">All years</option>
                    {years.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </label>
                <button
                  type="button"
                  onClick={() => setSort((current) => (current === "rank" ? "newest" : "rank"))}
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Sort by ${sort === "rank" ? "newest year" : "rank"}`}
                >
                  <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                  <span className="hidden sm:inline">{sort === "rank" ? "Rank" : "Newest"}</span>
                </button>
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setExam("all")}
                className={filterClass(exam === "all")}
              >
                All <span className="opacity-70">{data.length}</span>
              </button>
              {EXAMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setExam(item.id)}
                  className={filterClass(exam === item.id)}
                >
                  {item.short} <span className="opacity-70">{counts.get(item.id)}</span>
                </button>
              ))}
              {(exam !== "all" || year !== "all" || search) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="ml-auto shrink-0 px-3 py-2 text-xs font-semibold text-primary hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {filtered.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {filtered.map((topper) => (
                <TopperRow key={topper.id} topper={topper} onOpen={() => openTopper(topper)} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-border bg-card/60 px-5 py-14 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold">No matching toppers</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Try another name, exam or year. The right result may be just one filter away.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <footer className="mt-12 rounded-2xl border border-border/70 bg-card/65 px-5 py-5 text-center sm:px-8">
          <p className="text-sm font-bold">Your journey belongs here, too.</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Stay consistent, trust your preparation, and keep moving toward your own moment.
          </p>
        </footer>
      </main>

      {selected && <TopperDialog key={selected.id} topper={selected} onClose={closeTopper} />}
    </div>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-[5.1rem] rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-center backdrop-blur sm:min-w-[6rem] sm:px-4">
      <p className="text-2xl font-black tabular-nums sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]">
        {label}
      </p>
    </div>
  );
}

function filterClass(active: boolean) {
  return cn(
    "shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
      : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

function rankStyle(rank: number) {
  if (rank === 1) return "from-amber-300 to-orange-500 text-slate-950";
  if (rank === 2) return "from-slate-300 to-slate-500 text-slate-950";
  if (rank === 3) return "from-orange-300 to-amber-700 text-white";
  return "from-primary to-primary/70 text-primary-foreground";
}

function getPlace(topper: Topper) {
  return [topper.city, topper.state].filter(Boolean).join(", ");
}

function TopperAvatar({ topper, className }: { topper: Topper; className?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  return topper.photo_url && !imageFailed ? (
    <img
      src={topper.photo_url}
      alt={`${topper.name}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={cn("object-cover", className)}
      onError={(event) => {
        setImageFailed(true);
      }}
    />
  ) : (
    <div
      className={cn(
        "grid place-items-center bg-gradient-to-br font-black text-white",
        rankStyle(topper.rank),
        className,
      )}
      aria-hidden="true"
    >
      {topper.name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}

function RankBadge({ rank, exam, large = false }: { rank: number; exam: Exam; large?: boolean }) {
  const schoolClass = isSchoolClass(exam);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r font-black shadow-sm",
        rankStyle(rank),
        large ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]",
      )}
    >
      {rank <= 3 ? (
        <Medal className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />
      ) : (
        <span className="text-[9px] font-bold uppercase">{schoolClass ? "RANK" : "AIR"}</span>
      )}
      {schoolClass ? `Rank ${rank}` : `AIR ${rank}`}
    </span>
  );
}

function LeaderCard({ topper, onOpen }: { topper: Topper; onOpen: () => void }) {
  const place = getPlace(topper);
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/10">
      <div
        className={cn(
          "h-1.5 bg-gradient-to-r",
          topper.rank === 1
            ? "from-amber-300 via-yellow-400 to-orange-500"
            : topper.rank === 2
              ? "from-slate-300 to-slate-500"
              : "from-orange-300 to-amber-700",
        )}
      />
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-amber-500" /> Spotlight
          </span>
          <RankBadge rank={topper.rank} exam={topper.exam} />
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="mt-4 flex w-full items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <TopperAvatar
            topper={topper}
            className="h-[4.25rem] w-[4.25rem] rounded-2xl ring-1 ring-border"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-lg font-black tracking-tight">{topper.name}</span>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">
              {EXAM_NAME[topper.exam]} · {topper.year}
            </span>
            {place && (
              <span className="mt-1.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {place}
              </span>
            )}
          </span>
        </button>
        <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
          <span className="text-sm font-bold">
            {topper.marks || topper.percentile || rankDescription(topper.exam)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary transition group-hover:gap-2">
            Meet the achiever <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

function TopperRow({ topper, onOpen }: { topper: Topper; onOpen: () => void }) {
  const place = getPlace(topper);
  return (
    <article className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-sm transition hover:border-primary/25 hover:shadow-md sm:gap-4 sm:p-4">
      <TopperAvatar topper={topper} className="h-14 w-14 shrink-0 rounded-2xl sm:h-16 sm:w-16" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="max-w-full truncate text-sm font-black sm:text-base">{topper.name}</h3>
          <RankBadge rank={topper.rank} exam={topper.exam} />
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
          {EXAM_NAME[topper.exam]} <span className="px-1 text-border">/</span> {topper.year}
        </p>
        {place && (
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {place}
          </p>
        )}
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-sm font-bold">{topper.marks || topper.percentile || "—"}</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Score
        </p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${topper.name}'s topper details`}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </button>
    </article>
  );
}

function TopperDialog({ topper, onClose }: { topper: Topper; onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  async function share() {
    const url = new URL(window.location.href);
    url.searchParams.set("t", topper.id);
    const shareData = {
      title: `${topper.name} · ${EXAM_NAME[topper.exam]} ${topper.year}`,
      text: `Meet ${topper.name}, ${rankDescription(topper.exam)} ${topper.rank} in ${EXAM_NAME[topper.exam]} ${topper.year}.`,
      url: url.toString(),
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Topper link copied");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError")
        toast.error("Could not share this topper");
    }
  }

  const place = getPlace(topper);
  const safeSource = safeExternalUrl(topper.source_url);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="topper-dialog-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[2rem] border border-border bg-card shadow-2xl sm:rounded-[2rem]"
      >
        <div className="relative overflow-hidden bg-slate-950 px-5 pb-6 pt-7 text-white sm:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(245,158,11,0.3),transparent_45%)]" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close topper details"
            className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative flex items-center gap-4 pr-8">
            <TopperAvatar
              topper={topper}
              className="h-20 w-20 shrink-0 rounded-3xl border-2 border-white/20 shadow-xl sm:h-24 sm:w-24"
            />
            <div className="min-w-0">
              <RankBadge rank={topper.rank} exam={topper.exam} large />
              <h2
                id="topper-dialog-title"
                className="mt-2 break-words text-2xl font-black leading-tight sm:text-3xl"
              >
                {topper.name}
              </h2>
              <p className="mt-1 text-sm font-semibold text-white/75">
                {EXAM_NAME[topper.exam]} · {topper.year}
              </p>
              {place && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/70">
                  <MapPin className="h-3.5 w-3.5" />
                  {place}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid grid-cols-2 gap-3">
            <DetailStat
              label={rankDescription(topper.exam)}
              value={`#${topper.rank}`}
              icon={<Trophy className="h-4 w-4" />}
            />
            <DetailStat
              label="Exam year"
              value={String(topper.year)}
              icon={<CalendarDays className="h-4 w-4" />}
            />
            {topper.marks && (
              <DetailStat
                label="Marks"
                value={topper.marks}
                icon={<BookOpenCheck className="h-4 w-4" />}
              />
            )}
            {topper.percentile && (
              <DetailStat
                label="Percentile"
                value={topper.percentile}
                icon={<Award className="h-4 w-4" />}
              />
            )}
          </div>
          {topper.notes && (
            <section className="mt-5 rounded-2xl border border-border bg-muted/45 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                About this result
              </p>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-6">{topper.notes}</p>
            </section>
          )}
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-primary/[0.06] p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Check className="h-4 w-4" />
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              A remarkable result built one focused study session at a time. Let this achievement
              remind you what steady effort can do.
            </p>
          </div>
          {safeSource && (
            <a
              href={safeSource}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-bold text-primary hover:underline"
            >
              View result source <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="flex gap-2 border-t border-border bg-card px-5 py-3.5 sm:px-7">
          <button
            type="button"
            onClick={share}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-bold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Share2 className="h-4 w-4" /> Share profile
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Done
          </button>
        </div>
      </section>
    </div>
  );
}

function DetailStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/80 bg-background p-3.5">
      <div className="flex items-center gap-2 text-primary">
        <span>{icon}</span>
        <span className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-2 truncate text-xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function safeExternalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function isSchoolClass(exam: Exam) {
  return exam === "class_10" || exam === "class_11" || exam === "class_12";
}

function rankDescription(exam: Exam) {
  return isSchoolClass(exam) ? "Rank" : "All India rank";
}
