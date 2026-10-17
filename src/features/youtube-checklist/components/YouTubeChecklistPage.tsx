import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownUp,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CirclePlay,
  Clock3,
  Flame,
  ListChecks,
  ListVideo,
  Link2,
  LoaderCircle,
  Play,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Youtube,
  Zap,
  BarChart3,
  CircleHelp,
  Pin,
  RotateCcw,
} from "lucide-react";

import {
  AddYouTubeChecklistDialog,
  FloatingYouTubePlayer,
  YouTubeChecklistEmptyState,
  YouTubeChecklistPanel,
} from "../components";
import { useYouTubeChecklist, useYouTubeChecklists } from "../hooks";
import type { YouTubeChecklistItem } from "../types";

type ListFilter = "all" | "progress" | "completed" | "pinned";

const channelShortcuts = [
  {
    name: "Physics Wallah",
    note: "JEE Main & Adv.",
    initials: "PW",
    color: "from-amber-400 to-orange-600",
    href: "https://www.youtube.com/@PhysicsWallah",
  },
  {
    name: "Competishun",
    note: "JEE Advanced",
    initials: "C",
    color: "from-orange-400 to-red-500",
    href: "https://www.youtube.com/@Competishun",
  },
  {
    name: "Unacademy",
    note: "JEE Preparation",
    initials: "U",
    color: "from-sky-400 to-blue-600",
    href: "https://www.youtube.com/@UnacademyJEE",
  },
  {
    name: "Motion",
    note: "JEE + Boards",
    initials: "M",
    color: "from-rose-400 to-red-600",
    href: "https://www.youtube.com/@MotionEducation",
  },
];

export function YouTubeChecklistPage() {
  const {
    checklists,
    isLoading: isLoadingChecklists,
    error: checklistsError,
    reload: reloadChecklists,
  } = useYouTubeChecklists();

  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const {
    checklist,
    items,
    isLoading,
    error,
    selectedItemId,
    progress,
    selectItem,
    toggleItem,
    setCurrentItem,
    nextIncompleteItem,
    reload,
  } = useYouTubeChecklist(selectedChecklistId ?? undefined);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [filter, setFilter] = useState<ListFilter>("all");
  const [sortNewest, setSortNewest] = useState(true);
  const [showPlaylistSettings, setShowPlaylistSettings] = useState(false);
  const [query, setQuery] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [pinsLoaded, setPinsLoaded] = useState(false);

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;
  const totalVideos = checklists.reduce((sum, c) => sum + (c.total_items ?? 0), 0);
  const completedVideos = checklists.reduce((sum, c) => sum + (c.completed_items ?? 0), 0);
  const overallProgress = totalVideos ? Math.round((completedVideos / totalVideos) * 100) : 0;

  useEffect(() => {
    try {
      const storedPins = window.localStorage.getItem("youtube-checklist:pinned");
      const parsedPins: unknown = storedPins ? JSON.parse(storedPins) : [];
      setPinnedIds(
        Array.isArray(parsedPins)
          ? parsedPins.filter((id): id is string => typeof id === "string")
          : [],
      );
    } catch {
      setPinnedIds([]);
    } finally {
      setPinsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!pinsLoaded) return;
    try {
      window.localStorage.setItem("youtube-checklist:pinned", JSON.stringify(pinnedIds));
    } catch {
      // Pinning remains usable for this session if browser storage is unavailable.
    }
  }, [pinnedIds, pinsLoaded]);

  useEffect(() => {
    if (!selectedChecklistId && checklists.length > 0) {
      const firstChecklistId = checklists[0].id;
      setSelectedChecklistId(firstChecklistId);
      void reload(firstChecklistId);
    }
  }, [selectedChecklistId, checklists, reload]);

  useEffect(() => {
    if (!selectedItem) setIsPlayerOpen(false);
  }, [selectedItem]);

  const visibleChecklists = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = checklists.filter((c) => {
      const matchesQuery = !q || `${c.title} ${c.description ?? ""}`.toLowerCase().includes(q);
      const done = (c.total_items ?? 0) > 0 && (c.completed_items ?? 0) >= (c.total_items ?? 0);
      const started = (c.completed_items ?? 0) > 0 && !done;
      const matchesFilter =
        filter === "all" ||
        (filter === "completed" && done) ||
        (filter === "progress" && started) ||
        (filter === "pinned" && pinnedIds.includes(c.id));
      return matchesQuery && matchesFilter;
    });
    list = [...list].sort((a, b) => {
      if (filter === "pinned") return pinnedIds.indexOf(a.id) - pinnedIds.indexOf(b.id);
      return sortNewest
        ? new Date(b.updated_at ?? b.created_at).getTime() -
            new Date(a.updated_at ?? a.created_at).getTime()
        : (a.title ?? "").localeCompare(b.title ?? "");
    });
    return list;
  }, [checklists, query, filter, pinnedIds, sortNewest]);

  const handleSelectItem = (item: YouTubeChecklistItem) => {
    selectItem(item.id);
    void setCurrentItem(item.id);
    setIsPlayerOpen(true);
  };

  const handleToggleItem = async (item: YouTubeChecklistItem, completed: boolean) => {
    try {
      await toggleItem(item.id, completed);
      void reloadChecklists();
    } catch {
      // The hook exposes the failure in its error state; keep the page interactive.
    }
  };

  const findNextIncomplete = (afterItemId: string) => {
    const currentIndex = items.findIndex((item) => item.id === afterItemId);
    if (currentIndex < 0) return nextIncompleteItem();
    const orderedItems = [...items.slice(currentIndex + 1), ...items.slice(0, currentIndex)];
    return orderedItems.find((item) => !item.is_completed) ?? null;
  };

  const handleMarkComplete = async () => {
    if (!selectedItem) return;
    try {
      await toggleItem(selectedItem.id, !selectedItem.is_completed);
      void reloadChecklists();
    } catch {
      return;
    }
    if (!selectedItem.is_completed) {
      const next = findNextIncomplete(selectedItem.id);
      if (next) {
        selectItem(next.id);
        void setCurrentItem(next.id);
      }
    }
  };

  const handleVideoEnded = async () => {
    if (!selectedItem) return;
    if (!selectedItem.is_completed) {
      try {
        await toggleItem(selectedItem.id, true);
        void reloadChecklists();
      } catch {
        return;
      }
    }
    const next = findNextIncomplete(selectedItem.id);
    if (next) {
      selectItem(next.id);
      void setCurrentItem(next.id);
      setIsPlayerOpen(true);
    }
  };

  const handleCreated = async (checklistId: string) => {
    await reloadChecklists();
    setUrlDraft("");
    setSelectedChecklistId(checklistId);
    await reload(checklistId);
  };

  const handleOpenChecklist = (checklistId: string) => {
    setSelectedChecklistId(checklistId);
    setIsPlayerOpen(false);
    void reload(checklistId);
  };

  const openAdd = (prefill?: string) => {
    if (prefill) setUrlDraft(prefill);
    setIsAddDialogOpen(true);
  };

  const pageError = checklistsError ?? error;

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl space-y-7 px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] sm:space-y-9 sm:px-5 sm:py-7 lg:px-8">
        {/* Hero */}
        <section className="relative isolate overflow-hidden rounded-[1.6rem] border border-sky-200 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-5 text-slate-900 shadow-[0_20px_70px_-35px_rgba(0,190,255,.24)] dark:border-sky-500/20 dark:from-slate-950 dark:via-slate-950 dark:to-cyan-950/70 dark:text-white dark:shadow-[0_20px_70px_-35px_rgba(0,190,255,.45)] sm:rounded-[2rem] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/20" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 -z-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative grid min-w-0 gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(220px,.9fr)] md:items-center">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold tracking-[.12em] text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                <Youtube className="h-4 w-4" /> YOUTUBE CHECKLIST
              </span>
              <h1 className="mt-4 max-w-2xl break-words text-3xl font-extrabold leading-[1.08] tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
                Turn YouTube into{" "}
                <span className="bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-cyan-300">
                  Trackable
                </span>{" "}
                Study Sessions
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base sm:leading-7">
                Add a video or playlist, organize lectures into a checklist, and track your learning
                progress—one session at a time.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-4">
                <HeroFeature
                  icon={Link2}
                  title="Add link"
                  subtitle="Video or playlist"
                  color="sky"
                />
                <HeroFeature
                  icon={ListChecks}
                  title="Auto fetch"
                  subtitle="Titles & order"
                  color="blue"
                />
                <HeroFeature
                  icon={CheckCircle2}
                  title="Track progress"
                  subtitle="Mark watched"
                  color="emerald"
                />
                <HeroFeature
                  icon={BarChart3}
                  title="Stay consistent"
                  subtitle="Follow your plan"
                  color="violet"
                />
              </div>
            </div>
            <div className="relative mx-auto flex min-h-44 w-full max-w-sm items-center justify-center md:min-h-64">
              <div className="absolute h-44 w-44 rounded-full bg-sky-500/15 blur-3xl dark:bg-sky-500/20 sm:h-56 sm:w-56" />
              <div className="relative w-full max-w-[330px] rotate-1 rounded-[1.7rem] border border-sky-200 bg-white p-4 shadow-2xl shadow-sky-900/15 sm:p-5 dark:border-sky-300/30 dark:bg-slate-900 dark:shadow-sky-950/50">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-950/40">
                    <Play className="h-6 w-6 fill-white text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="h-2.5 w-3/4 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <div className="mt-2 h-2 w-1/2 rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                {["Physics", "Chemistry", "Mathematics"].map((s, i) => (
                  <div
                    key={s}
                    className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${i === 0 ? "bg-sky-500/20 text-sky-300" : i === 1 ? "bg-orange-500/20 text-orange-300" : "bg-emerald-500/20 text-emerald-300"}`}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {s}
                    </span>
                    <span className="ml-auto h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                ))}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Overall progress</span>
                  <strong className="text-sky-600 dark:text-sky-300">{overallProgress}%</strong>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
              <div className="absolute -right-1 top-0 rounded-2xl border border-emerald-200 bg-white px-3 py-2 shadow-xl shadow-emerald-900/10 dark:border-emerald-400/20 dark:bg-slate-950 sm:right-0">
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Your progress</p>
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-300">
                  {overallProgress}%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Import form */}
        <section
          id="add-youtube"
          className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-card via-card to-sky-950/10 p-4 shadow-lg shadow-sky-950/5 sm:rounded-3xl sm:p-6"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-500">
                <Link2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="break-words text-lg font-bold sm:text-xl">
                  Add YouTube Video or Playlist
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Paste a link to build your study checklist
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPlaylistSettings((v) => !v)}
              aria-expanded={showPlaylistSettings}
              aria-controls="youtube-import-help"
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold transition hover:border-primary/40 sm:self-auto"
            >
              <CircleHelp className="h-4 w-4 text-primary" /> How it works?{" "}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showPlaylistSettings ? "rotate-180" : ""}`}
              />
            </button>
          </div>
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              openAdd(urlDraft.trim() || undefined);
            }}
          >
            <label className="flex min-h-14 min-w-0 items-center gap-3 rounded-2xl border border-border bg-background px-3.5 transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/15 sm:px-4">
              <Youtube className="h-5 w-5 shrink-0 text-red-500" />
              <input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                type="url"
                inputMode="url"
                placeholder="Paste YouTube video or playlist link…"
                className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
                aria-label="YouTube video or playlist URL"
              />
              {urlDraft && (
                <button
                  type="button"
                  onClick={() => setUrlDraft("")}
                  aria-label="Clear URL"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </label>
            <div
              id="youtube-import-help"
              hidden={!showPlaylistSettings}
              className="rounded-xl border border-border bg-background/60 p-4 text-sm leading-6 text-muted-foreground"
            >
              <p>
                <strong className="text-foreground">Playlist link:</strong> videos are imported in
                playlist order using the existing YouTube playlist backend.
              </p>
              <p className="mt-1">
                <strong className="text-foreground">Single video:</strong> creates a checklist with
                that video.
              </p>
              <p className="mt-1">
                You can then mark lectures complete and resume your current video using the floating
                player.
              </p>
            </div>
            <button
              type="submit"
              className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-900/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:text-base"
            >
              <Sparkles className="h-5 w-5" /> Import & Create Checklist{" "}
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </section>

        {/* Checklist management */}
        <section className="space-y-4">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <ListChecks className="h-6 w-6 text-cyan-500" />
              <div>
                <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">My Checklists</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your videos, your pace, your progress.
                </p>
              </div>
            </div>
            <label className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm">
              <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
              <select
                aria-label="Sort checklists"
                value={sortNewest ? "latest" : "title"}
                onChange={(e) => setSortNewest(e.target.value === "latest")}
                className="min-w-0 bg-transparent py-2 outline-none"
              >
                <option value="latest">Sort: Latest</option>
                <option value="title">Sort: Title</option>
              </select>
            </label>
          </div>

          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3.5 focus-within:border-primary sm:max-w-md">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search your YouTube checklists"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your checklists…"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
            />
            <span className="shrink-0 text-xs text-muted-foreground">
              {visibleChecklists.length}
            </span>
          </label>

          <div
            role="group"
            aria-label="Filter checklists"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
              icon={ListVideo}
              label="All"
              count={checklists.length}
            />
            <FilterButton
              active={filter === "progress"}
              onClick={() => setFilter("progress")}
              icon={LoaderCircle}
              label="In Progress"
              count={
                checklists.filter((c) => c.completed_items > 0 && c.completed_items < c.total_items)
                  .length
              }
            />
            <FilterButton
              active={filter === "completed"}
              onClick={() => setFilter("completed")}
              icon={CheckCircle2}
              label="Completed"
              count={
                checklists.filter((c) => c.total_items > 0 && c.completed_items >= c.total_items)
                  .length
              }
            />
            <FilterButton
              active={filter === "pinned"}
              onClick={() => setFilter("pinned")}
              icon={Pin}
              label="Pinned"
              count={pinnedIds.length}
            />
          </div>

          {pageError && (
            <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-red-500">Couldn’t load YouTube checklists</p>
                  <p className="mt-1 break-words text-sm text-muted-foreground">{pageError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void reloadChecklists();
                    if (selectedChecklistId) void reload(selectedChecklistId);
                  }}
                  className="shrink-0 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {isLoadingChecklists ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-36 animate-pulse rounded-2xl bg-muted" />
              <div className="h-36 animate-pulse rounded-2xl bg-muted" />
            </div>
          ) : visibleChecklists.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/70 px-4 py-9 text-center sm:px-8 sm:py-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-500">
                <ListChecks className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold">
                {query || filter !== "all" ? "No matching checklists" : "No checklists yet"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {query || filter !== "all"
                  ? "Try a different search or filter."
                  : "Add a YouTube video or playlist to create your first checklist and start tracking your study progress."}
              </p>
              {query || filter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                  className="mt-4 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAdd()}
                  className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white"
                >
                  <Youtube className="h-4 w-4" /> Add Your First YouTube
                </button>
              )}
            </div>
          ) : (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {visibleChecklists.map((c) => {
                const pct =
                  c.total_items > 0 ? Math.round((c.completed_items / c.total_items) * 100) : 0;
                const active = selectedChecklistId === c.id;
                const pinned = pinnedIds.includes(c.id);
                return (
                  <article
                    key={c.id}
                    className={`min-w-0 overflow-hidden rounded-2xl border bg-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${active ? "border-sky-500/50 shadow-md shadow-sky-950/10" : "border-border hover:border-primary/30"}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenChecklist(c.id)}
                      className="block w-full min-w-0 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                          <Youtube className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words font-bold">{c.title}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {c.source_type === "playlist" ? "YouTube playlist" : "Single video"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-bold">
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {c.completed_items}/{c.total_items} videos complete
                        </span>
                        <span>
                          {pct === 100
                            ? "Completed"
                            : c.completed_items > 0
                              ? "In progress"
                              : "Not started"}
                        </span>
                      </div>
                    </button>
                    <div className="flex items-center justify-between border-t border-border/70 px-4 py-2.5 sm:px-5">
                      <button
                        type="button"
                        onClick={() => handleOpenChecklist(c.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        Open checklist <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-pressed={pinned}
                        onClick={() =>
                          setPinnedIds((ids) =>
                            pinned ? ids.filter((id) => id !== c.id) : [...ids, c.id],
                          )
                        }
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${pinned ? "bg-amber-500/10 text-amber-500" : "text-muted-foreground hover:bg-muted"}`}
                      >
                        <Star className={`h-3.5 w-3.5 ${pinned ? "fill-current" : ""}`} />
                        {pinned ? "Pinned" : "Pin"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Selected checklist player and videos */}
        {selectedChecklistId && checklist && !isLoading && (
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-cyan-600">
                  Continue learning
                </p>
                <h2 className="mt-1 break-words text-xl font-extrabold sm:text-2xl">
                  {checklist.title}
                </h2>
              </div>
              <span className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">
                {progress.completedItems}/{progress.totalItems} complete
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <YouTubeChecklistPanel
                checklist={checklist}
                items={items}
                selectedItemId={selectedItemId}
                onSelectItem={handleSelectItem}
                onToggleComplete={handleToggleItem}
              />
              {items.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-border p-3 sm:flex-row">
                  {nextIncompleteItem() && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = nextIncompleteItem();
                        if (next) handleSelectItem(next);
                      }}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white"
                    >
                      <Play className="h-4 w-4 fill-current" /> Continue next video
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedItem) handleSelectItem(selectedItem);
                      else {
                        const next = nextIncompleteItem();
                        if (next) handleSelectItem(next);
                      }
                    }}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    <CirclePlay className="h-4 w-4" /> Open floating player
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Channels */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <h2 className="text-lg font-extrabold sm:text-xl">Popular Channels for JEE</h2>
            </div>
            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-cyan-600 hover:underline"
            >
              Explore <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {channelShortcuts.map((ch) => (
              <article
                key={ch.name}
                className="min-w-0 rounded-2xl border border-border bg-card p-3 sm:p-4"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${ch.color} text-sm font-extrabold text-white`}
                  >
                    {ch.initials}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold">{ch.name}</h3>
                    <p className="truncate text-[11px] text-muted-foreground">{ch.note}</p>
                  </div>
                </div>
                <a
                  className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-border text-xs font-semibold transition hover:border-primary/40 hover:bg-primary/5"
                  href={ch.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ArrowRight className="h-3.5 w-3.5" /> Open channel
                </a>
              </article>
            ))}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Tip: for a full course, paste a specific playlist URL. Channel links are shortcuts and
            may need to be changed to a playlist before import.
          </p>
        </section>

        {/* Tips */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-extrabold sm:text-xl">Tips for Better Experience</h2>
            </div>
            <span className="text-xs font-semibold text-cyan-600">STUDY SMART</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <Tip
              icon={Link2}
              title="Use playlist links"
              description="Import full courses"
              color="cyan"
            />
            <Tip
              icon={Settings2}
              title="Organize by subject"
              description="Keep it structured"
              color="violet"
            />
            <Tip
              icon={Clock3}
              title="Mark after watching"
              description="Track real progress"
              color="blue"
            />
            <Tip
              icon={Star}
              title="Pin important ones"
              description="Quick access later"
              color="amber"
            />
          </div>
        </section>

        {/* Closing banner */}
        <section className="flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-blue-50 p-4 text-slate-900 sm:rounded-3xl sm:p-6 dark:border-sky-500/20 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 dark:text-white">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Trophy className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="break-words font-bold text-slate-900 dark:text-white">
              Small steps every day lead to big results.
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Keep watching. Keep checking off. Keep improving.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-300" />
        </section>
      </div>

      {isPlayerOpen && selectedItem && (
        <FloatingYouTubePlayer
          videoId={selectedItem.youtube_video_id}
          title={selectedItem.title}
          onClose={() => setIsPlayerOpen(false)}
          onVideoEnded={handleVideoEnded}
          onReady={() => undefined}
          isCompleted={selectedItem.is_completed}
          onMarkComplete={handleMarkComplete}
        />
      )}
      <AddYouTubeChecklistDialog
        open={isAddDialogOpen}
        initialUrl={urlDraft}
        onClose={() => setIsAddDialogOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

type HeroFeatureColor = "sky" | "blue" | "emerald" | "violet";
type TipColor = "cyan" | "violet" | "blue" | "amber";

function HeroFeature({
  icon: Icon,
  title,
  subtitle,
  color,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: HeroFeatureColor;
}) {
  const colors: Record<HeroFeatureColor, string> = {
    sky: "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300",
    blue: "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300",
    emerald:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300",
    violet:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300",
  };
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-sky-100 bg-white/75 p-2.5 sm:gap-3 sm:p-3 dark:border-white/10 dark:bg-white/[.04] sm:p-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${colors[color]}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-800 dark:text-white sm:text-sm">
          {title}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition sm:gap-2 sm:px-3 sm:text-sm ${active ? "border-sky-500/40 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-sky-950/20" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}
      >
        {count}
      </span>
    </button>
  );
}

function Tip({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  color: TipColor;
}) {
  const colors: Record<TipColor, string> = {
    cyan: "bg-cyan-500/10 text-cyan-500",
    violet: "bg-violet-500/10 text-violet-500",
    blue: "bg-blue-500/10 text-blue-500",
    amber: "bg-amber-500/10 text-amber-500",
  };
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-3 sm:p-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors[color]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="mt-3 break-words text-xs font-bold sm:text-sm">{title}</h3>
      <p className="mt-1 break-words text-[11px] leading-4 text-muted-foreground sm:text-xs">
        {description}
      </p>
    </div>
  );
}
