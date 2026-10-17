import { LinkifiedText } from "@/components/LinkifiedText";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Megaphone,
  Pin,
  ExternalLink,
  CalendarDays,
  AlertTriangle,
  GraduationCap,
  Trophy,
  PartyPopper,
  Info,
  Search,
  Clock3,
  BellRing,
} from "lucide-react";
import { Polls } from "@/components/Polls";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { format, formatDistanceToNow } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

type Notice = {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  link_url: string | null;
  link_label: string | null;
  expires_at: string | null;
  created_at: string;
  created_by: string | null;
};

const noticesQueryOptions = (noticeId?: string) =>
  queryOptions({
    queryKey: ["notices", "public", noticeId],
    queryFn: async () => {
      const [recent, target] = await Promise.all([
        supabase
          .from("notices")
          .select(
            "id, title, body, category, pinned, link_url, link_label, expires_at, created_at, created_by",
          )
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(100),
        noticeId
          ? supabase
              .from("notices")
              .select(
                "id, title, body, category, pinned, link_url, link_label, expires_at, created_at, created_by",
              )
              .eq("id", noticeId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (recent.error) throw recent.error;
      if (target.error) throw target.error;

      const notices = [...((recent.data ?? []) as Notice[])];
      const targetNotice = target.data as Notice | null;
      if (targetNotice && !notices.some((notice) => notice.id === targetNotice.id)) {
        notices.push(targetNotice);
      }
      return notices;
    },
  });

export const Route = createFileRoute("/notices")({
  validateSearch: z.object({ notice: z.string().optional() }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Notice Board — PREPWIAN" },
      { name: "twitter:description", content: "Official announcements and updates for PREPWIAN students." },

      { title: "Notice Board — PREPWIAN" },
      {
        name: "description",
        content:
          "Official announcements, exam updates, results, events and important updates from PREPWIAN.",
      },
      {
        property: "og:title",
        content: "Notice Board — PREPWIAN",
      },
      {
        property: "og:description",
        content: "Official announcements and updates for PREPWIAN students.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://jeeprephub.co.in/notices",
      },
    ],
  }),

  loader: ({ context, location }) =>
    context.queryClient.ensureQueryData(
      noticesQueryOptions(new URLSearchParams(location.searchStr).get("notice") ?? undefined),
    ),

  errorComponent: ({ error, reset }) => (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="mt-5 text-xl font-bold">Couldn’t load notices</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong while loading the notice board.
        </p>

        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  ),

  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Link
        to="/"
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Go home
      </Link>
    </div>
  ),

  component: NoticesPage,
});

const CATEGORY_META: Record<
  string,
  {
    label: string;
    icon: typeof Info;
    bg: string;
    text: string;
    border: string;
  }
> = {
  general: {
    label: "General",
    icon: Info,
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/20",
  },

  exam: {
    label: "Exam",
    icon: GraduationCap,
    bg: "bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-500/20",
  },

  result: {
    label: "Result",
    icon: Trophy,
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/20",
  },

  event: {
    label: "Event",
    icon: PartyPopper,
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    border: "border-fuchsia-500/20",
  },

  urgent: {
    label: "Urgent",
    icon: AlertTriangle,
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-500/20",
  },
};

function catMeta(category: string) {
  return CATEGORY_META[category] ?? CATEGORY_META.general;
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "exam", label: "Exams" },
  { value: "result", label: "Results" },
  { value: "event", label: "Events" },
  { value: "urgent", label: "Urgent" },
];

function NoticesPage() {
  const { notice: highlightId } = Route.useSearch();
  const { data: notices } = useSuspenseQuery(noticesQueryOptions(highlightId));

  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!highlightId || !notices.some((notice) => notice.id === highlightId)) return;
    const frame = requestAnimationFrame(() => {
      document
        .getElementById(`notice-${highlightId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [highlightId, notices]);

  const filteredNotices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notices.filter((notice) => {
      const categoryMatch = filter === "all" || notice.category === filter;

      const searchMatch =
        !query ||
        notice.title.toLowerCase().includes(query) ||
        notice.body.toLowerCase().includes(query);

      return categoryMatch && searchMatch;
    });
  }, [notices, search, filter]);

  const pinned = filteredNotices.filter((n) => n.pinned);
  const recent = filteredNotices.filter((n) => !n.pinned);

  return (
    <div className="min-h-screen bg-hero-glow">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-0 top-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-8 pt-8 sm:px-5 sm:pb-11 sm:pt-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-primary">
              <BellRing className="h-3.5 w-3.5" />
              Official Announcements
            </div>

            <h1 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-5xl">
              <span className="text-gradient-hero">Notice</span> Board
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-5 text-muted-foreground sm:text-base">
              Important updates, exam announcements, results, events and everything you need to know
              from PREPWIAN.
            </p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-[10px] text-muted-foreground">
                ✨ Official updates
              </span>

              <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-[10px] text-muted-foreground">
                ◷ Latest first
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="mx-auto max-w-4xl px-3 pb-16 pt-5 sm:px-5 sm:pt-8">
        {/* SEARCH + FILTERS */}
        {notices.length > 0 && (
          <div className="mb-7 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search announcements..."
                className="h-11 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto px-0.5 pb-1 scrollbar-none">
              {FILTERS.map((item) => {
                const active = filter === item.value;

                return (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* EMPTY */}
        {notices.length === 0 ? (
          <EmptyState />
        ) : filteredNotices.length === 0 ? (
          <NoResults
            onClear={() => {
              setSearch("");
              setFilter("all");
            }}
          />
        ) : (
          <>
            {/* PINNED */}
            {pinned.length > 0 && (
              <section className="mb-7">
                <SectionHeading
                  icon={<Pin className="h-3.5 w-3.5" />}
                  title="Pinned announcements"
                  description="Important updates you shouldn't miss"
                  amber
                />

                <div className="space-y-3">
                  {pinned.map((notice) => (
                    <NoticeCard
                      key={notice.id}
                      notice={notice}
                      pinnedStyle
                      highlight={notice.id === highlightId}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* RECENT */}
            {recent.length > 0 && (
              <section>
                <SectionHeading
                  icon={<Megaphone className="h-3.5 w-3.5" />}
                  title={pinned.length > 0 ? "Latest updates" : "Announcements"}
                  description="The newest updates from PREPWIAN"
                />

                <div className="space-y-3">
                  {recent.map((notice) => (
                    <NoticeCard
                      key={notice.id}
                      notice={notice}
                      highlight={notice.id === highlightId}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* POLLS */}
        <section className="mt-10 border-t border-border/70 pt-7">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Community
            </p>

            <h2 className="mt-1 text-xl font-bold tracking-tight">Your opinion matters</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Participate in community polls and help shape PREPWIAN.
            </p>
          </div>

          <Polls location="notice" adminOnly isAdmin={isAdmin} />
        </section>
      </main>
    </div>
  );
}

/* ---------------------------------------------------------
   SECTION HEADING
--------------------------------------------------------- */

function SectionHeading({
  icon,
  title,
  description,
  amber = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  amber?: boolean;
}) {
  return (
    <div className="mb-3 px-1">
      <div
        className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] ${
          amber ? "text-amber-700 dark:text-amber-400" : "text-primary"
        }`}
      >
        {icon}
        {title}
      </div>

      <p className="mt-0.5 text-[10px] text-muted-foreground">{description}</p>
    </div>
  );
}

/* ---------------------------------------------------------
   NOTICE CARD
--------------------------------------------------------- */

function NoticeCard({
  notice,
  pinnedStyle = false,
  highlight = false,
}: {
  notice: Notice;
  pinnedStyle?: boolean;
  highlight?: boolean;
}) {
  const meta = catMeta(notice.category);
  const Icon = meta.icon;

  const [expanded, setExpanded] = useState(false);

  const createdDate = new Date(notice.created_at);

  const expiryDate = notice.expires_at ? new Date(notice.expires_at) : null;

  const isActive = expiryDate !== null && expiryDate.getTime() > Date.now();

  /*
   * Short notices don't need a Read More button.
   * Long notices are collapsed automatically.
   */
  const isLongNotice = notice.body.length > 180;

  return (
    <article
      id={`notice-${notice.id}`}
      className={`group relative scroll-mt-6 overflow-hidden rounded-2xl border bg-card transition-all duration-300 ${highlight ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""} ${
        pinnedStyle
          ? "border-amber-400/40 shadow-[0_8px_30px_-18px_rgba(245,158,11,0.35)]"
          : "border-border shadow-soft hover:shadow-glow"
      }`}
    >
      {/* LEFT ACCENT */}
      <div className={`absolute inset-y-0 left-0 w-1 ${pinnedStyle ? "bg-amber-400" : meta.bg}`} />

      <div className="p-4 sm:p-5">
        <div className="flex gap-3">
          {/* ICON */}
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg} ${meta.text}`}
          >
            <Icon className="h-4 w-4" />
          </div>

          {/* CONTENT */}
          <div className="min-w-0 flex-1">
            {/* BADGES */}
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${meta.bg} ${meta.text} ${meta.border}`}
              >
                {meta.label}
              </span>

              {notice.pinned && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  <Pin className="h-2.5 w-2.5" />
                  Pinned
                </span>
              )}

              {isActive && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Active
                </span>
              )}
            </div>

            {/* TITLE */}
            <h3 className="text-[15px] font-bold leading-snug tracking-tight sm:text-base">
              {notice.title}
            </h3>

            {/* BODY */}
            <div
              className={`mt-1.5 text-sm leading-5 text-muted-foreground ${
                !expanded && isLongNotice ? "line-clamp-3" : ""
              }`}
            >
              <p className="whitespace-pre-wrap">
                <LinkifiedText text={notice.body} />
              </p>
            </div>

            {/* READ MORE */}
            {isLongNotice && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="mt-2 text-xs font-semibold text-primary hover:underline"
              >
                {expanded ? "Show less ↑" : "Read full announcement →"}
              </button>
            )}

            {/* LINK */}
            {notice.link_url && (
              <div>
                {expanded || !isLongNotice ? (
                  <a
                    href={notice.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
                  >
                    {notice.link_label || "Open announcement"}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            )}

            {/* META */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {format(createdDate, "dd MMM yyyy")}
              </span>

              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                {formatDistanceToNow(createdDate, {
                  addSuffix: true,
                })}
              </span>

              {expiryDate && isActive && (
                <span>Valid till {format(expiryDate, "dd MMM yyyy")}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SUBTLE HOVER GLOW */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/5 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </article>
  );
}

/* ---------------------------------------------------------
   EMPTY STATE
--------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/70 px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Megaphone className="h-6 w-6" />
      </div>

      <h2 className="mt-4 text-lg font-bold">No announcements yet</h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        There are no public notices right now. Check back soon for important updates from JEE Prep
        Hub.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------
   NO SEARCH RESULTS
--------------------------------------------------------- */

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/70 px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Search className="h-5 w-5" />
      </div>

      <h2 className="mt-4 text-base font-bold">No matching announcements</h2>

      <p className="mt-1.5 text-sm text-muted-foreground">Try a different search or category.</p>

      <button
        onClick={onClear}
        className="mt-4 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold transition hover:bg-muted"
      >
        Clear filters
      </button>
    </div>
  );
}
