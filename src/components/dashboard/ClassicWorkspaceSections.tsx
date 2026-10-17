import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Atom,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Inbox,
  Play,
  Radio,
  Target,
  Users,
} from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { useAppStore } from "@/lib/jee360/store";
import { formatCountdown, todayISO } from "@/lib/jee360/dates";
import { fmtClock, liveElapsed, useFocusZone } from "@/lib/focus-zone";
import { supabase } from "@/integrations/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;

type LobbyRoom = {
  id: string;
  title: string;
  category: string;
  watching: number;
  host_name: string | null;
};

type PreviewRoom = LobbyRoom & { watching: number };

export function ClassicWorkspaceSections() {
  return (
    <div className="space-y-4">
      <Jee360Preview />
      <FocusZonePreview />
      <WatchPartyPreview />
    </div>
  );
}

function Jee360Preview() {
  const examDate = useAppStore((state) => state.settings.examDate);
  const meta = useAppStore((state) => state.meta);
  const lectures = useAppStore((state) => state.lectures);
  const tests = useAppStore((state) => state.tests);
  const backlog = useAppStore((state) => state.backlog);
  const today = todayISO();
  const openBacklog = backlog.filter((item) => item.status !== "cleared");
  const upcoming = lectures
    .filter((lecture) => lecture.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2);
  const nextTest = tests
    .filter((test) => test.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <WorkspaceSection
      icon={<Atom className="h-6 w-6" />}
      eyebrow="JEE 360 command centre"
      title="Plan the next move, not the whole year."
      description="Your lecture planner, backlog, tests and revision system in one workspace."
      tone="violet"
      action={{ to: "/jee360", label: "Open JEE 360" }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <PreviewMetric
          icon={<Inbox className="h-4 w-4" />}
          label="Open backlog"
          value={String(openBacklog.length)}
        />
        <PreviewMetric
          icon={<CalendarDays className="h-4 w-4" />}
          label="Next lecture"
          value={upcoming[0] ? formatShortDate(upcoming[0].date) : "None planned"}
        />
        <PreviewMetric
          icon={<Clock3 className="h-4 w-4" />}
          label="JEE Main"
          value={formatCountdown(examDate)}
        />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <PreviewList
          title="Upcoming in your planner"
          empty="No upcoming lectures yet."
          items={upcoming.map((lecture) => `${lecture.subject} · ${lecture.title}`)}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <PreviewList
          title="Next test"
          empty="No test scheduled yet."
          items={
            nextTest
              ? [
                  `${nextTest.title} · ${formatShortDate(nextTest.date)}`,
                  `${nextTest.subject} · ${nextTest.durationMinutes} min`,
                ]
              : []
          }
          icon={<Target className="h-4 w-4" />}
        />
      </div>
      {meta?.batch ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Active plan: <span className="font-semibold text-foreground">{meta.batch}</span>
        </p>
      ) : null}
    </WorkspaceSection>
  );
}

function FocusZonePreview() {
  const { state } = useFocusZone();
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const timer = state?.timer;
  const active = state?.todos.find((todo) => todo.id === timer?.todoId) ?? null;
  const open =
    state?.todos.filter((todo) => todo.status !== "done" && todo.status !== "failed") ?? [];
  const elapsed = timer ? liveElapsed(timer) : 0;
  const focusStatus = active
    ? `${timer?.running ? "Running" : "Paused"} · ${fmtClock(elapsed)}`
    : "Ready for a deep-work block";

  return (
    <WorkspaceSection
      icon={<Flame className="h-6 w-6" />}
      eyebrow="Focus Zone workspace"
      title={active ? active.title : "Build a calmer study rhythm."}
      description="A private timer, task queue, habits and progress space that stays in your browser."
      tone="amber"
      action={{ to: "/focus", label: "Open Focus Zone" }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <PreviewMetric
          icon={<Play className="h-4 w-4" />}
          label="Current block"
          value={focusStatus}
        />
        <PreviewMetric
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Open tasks"
          value={String(open.length)}
        />
        <PreviewMetric
          icon={<Flame className="h-4 w-4" />}
          label="Streak"
          value={`${state?.streak ?? 0} days`}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border bg-background/50 px-3 py-1.5">
          {state?.habits.length ?? 0} habits tracked
        </span>
        <span className="rounded-full border border-border bg-background/50 px-3 py-1.5">
          {state?.groups.length ?? 0} study groups
        </span>
        <span className="rounded-full border border-border bg-background/50 px-3 py-1.5">
          {state?.lockEnabled ? "Focus lock on" : "Focus lock off"}
        </span>
      </div>
    </WorkspaceSection>
  );
}

function WatchPartyPreview() {
  const [rooms, setRooms] = useState<PreviewRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data: liveRooms, error: queryError } = await db
        .from("watch_rooms")
        .select("id,host_id,title,category,source_type,thumbnail_url,created_at")
        .eq("status", "live")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });
      const { data: lobbyData } = await db.rpc("get_watch_party_lobby");
      if (!alive) return;
      if (queryError) {
        const fallbackRooms = (lobbyData ?? []) as PreviewRoom[];
        setRooms(fallbackRooms.slice(0, 3));
        setError(fallbackRooms.length === 0);
      } else {
        const watchingByRoom = new Map<string, number>(
          ((lobbyData ?? []) as LobbyRoom[]).map((room) => [room.id, Number(room.watching ?? 0)]),
        );
        setRooms(
          ((liveRooms ?? []) as Omit<PreviewRoom, "watching">[])
            .map((room) => ({
              ...room,
              watching: watchingByRoom.get(room.id) ?? 0,
            }))
            .slice(0, 3),
        );
        setError(false);
      }
      setLoading(false);
    };
    void load();
    const interval = window.setInterval(() => void load(), 20000);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);

  const totalWatching = rooms.reduce((total, room) => total + (room.watching ?? 0), 0);

  return (
    <WorkspaceSection
      icon={<Radio className="h-6 w-6" />}
      eyebrow="Watch Party"
      title={rooms[0]?.title ?? "Study together, without losing focus."}
      description="See what is live now and join a focused room with classmates."
      tone="blue"
      action={{ to: "/watch", label: "Open Watch Party" }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <PreviewMetric
          icon={<Radio className="h-4 w-4" />}
          label="Live rooms"
          value={loading ? "Loading…" : String(rooms.length)}
        />
        <PreviewMetric
          icon={<Users className="h-4 w-4" />}
          label="Studying now"
          value={loading ? "—" : String(totalWatching)}
        />
        <PreviewMetric icon={<Target className="h-4 w-4" />} label="Room mode" value="Live study" />
      </div>
      <div className="mt-3 rounded-2xl border border-border bg-background/45 p-3">
        {error ? (
          <p className="text-sm text-muted-foreground">
            Live rooms are temporarily unavailable. Open Watch Party to retry.
          </p>
        ) : rooms.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground">
            No rooms are live right now. Start one and invite your study group.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-3">
            {(loading
              ? [{ id: "loading", label: "Loading live rooms…" }]
              : rooms.map((room) => ({
                  id: room.id,
                  label: `${room.title} · ${room.watching} watching`,
                }))
            ).map((room) => (
              <li
                key={room.id}
                className="flex min-w-0 items-center gap-2 rounded-xl border border-border/70 px-3 py-2.5 text-xs font-semibold"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" />
                <span className="truncate">{room.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </WorkspaceSection>
  );
}

function WorkspaceSection({
  icon,
  eyebrow,
  title,
  description,
  tone,
  action,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tone: "violet" | "amber" | "blue";
  action: { to: "/jee360" | "/focus" | "/watch"; label: string };
  children: ReactNode;
}) {
  const toneClass = {
    violet: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
    amber: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    blue: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  }[tone];
  return (
    <GlassSurface className="overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${toneClass}`}>
              {icon}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {eyebrow}
              </p>
              <h2 className="mt-1 font-display text-xl font-black tracking-tight sm:text-2xl">
                {title}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <div className="mt-4">{children}</div>
        </div>
        <Link
          to={action.to}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-glow transition hover:-translate-y-0.5 active:scale-[0.98] lg:mt-1"
        >
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </GlassSurface>
  );
}

function PreviewMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-background/45 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 truncate text-base font-bold tabular-nums">{value}</p>
    </div>
  );
}
function PreviewList({
  title,
  empty,
  items,
  icon,
}: {
  title: string;
  empty: string;
  items: string[];
  icon: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-background/45 p-3">
      <p className="flex min-w-0 items-center gap-1.5 text-xs font-bold">
        <span className="text-primary">{icon}</span>
        <span className="min-w-0 break-words">{title}</span>
      </p>
      {items.length ? (
        <ul className="mt-2 min-w-0 space-y-1.5">
          {items.map((item) => (
            <li
              key={item}
              className="line-clamp-2 min-w-0 break-words text-xs leading-5 text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}
function formatShortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
