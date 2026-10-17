import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useProStatus } from "@/hooks/use-pro";
import { AppShell } from "@/components/AppShell";
import { JeeCountdown } from "@/components/JeeCountdown";
import { EngineeringCountdown } from "@/components/EngineeringCountdown";
import { supabase } from "@/integrations/supabase/client";
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";
import { CustomizableDashboard, DashboardWidget } from "@/components/dashboard/CustomizableDashboard";

import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bot,
  Clock,
  FileText,
  Flame,
  History,
  Medal,
  Play,
  QrCode,
  Sparkles,
  Swords,
  Timer,
  Trophy,
  Tv,
  Users,
} from "lucide-react";
import { QrCodeDialog } from "@/components/QrCodeDialog";
import { DailyChecklist } from "@/components/DailyChecklist";
import { StreakHistory } from "@/components/StreakHistory";
import { StudyStreakButton } from "@/components/StudyStreakButton";
import { MiniFocusTimer } from "@/components/MiniFocusTimer";
import { LogStudyHours } from "@/components/LogStudyHours";
import { DmInboxCard } from "@/components/DmInboxCard";
import { ProStatusCard } from "@/components/ProStatusCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CommunityLogo } from "@/components/CommunityLogo";
import { ConsentSkippedBanner } from "@/components/ConsentSkippedBanner";
import { MembershipCard } from "@/components/MembershipCard";
import { ClassicProWidgets } from "@/components/dashboard/ClassicProWidgets";
import { ClassicWorkspaceSections } from "@/components/dashboard/ClassicWorkspaceSections";
import { StudyAnalyticsWidget } from "@/components/dashboard/StudyAnalyticsWidget";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Dashboard — PREPWIAN" },
      { name: "twitter:description", content: "Track your study hours, rank, streaks and JEE preparation in one place." },

      { title: "Dashboard — PREPWIAN" },
      {
        name: "description",
        content:
          "Your personal JEE prep dashboard: study hours, rank, daily checklist, focus timer, tests, lectures and community activity.",
      },
      {
        property: "og:title",
        content: "Dashboard — PREPWIAN",
      },
      {
        property: "og:description",
        content:
          "Track your study hours, rank, streaks and JEE preparation in one place.",
      },
      {
        property: "og:url",
        content:
          "https://jeeprephub.co.in/dashboard",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "robots",
        content: "noindex, follow",
      },
    ],
    links: [
      {
        rel: "canonical",
        href:
          "https://jeeprephub.co.in/dashboard",
      },
    ],
  }),
  component: Dashboard,
});

const QUICK_ACTIONS = [
  {
    to: "/pulse",
    label: "Pulse",
    desc: "Lectures & feed",
    icon: Play,
  },
  {
    to: "/tests",
    label: "Test Series",
    desc: "CBT mocks",
    icon: FileText,
  },
  {
    to: "/tests/leaderboard",
    label: "Test Ranks",
    desc: "Points table",
    icon: Medal,
  },
  {
    to: "/ai-chat",
    label: "AI Study Chat",
    desc: "Ask anything",
    icon: Sparkles,
  },
  {
    to: "/sahai",
    label: "SahAI Buddy",
    desc: "Your mentor",
    icon: Bot,
  },
  {
    to: "/community",
    label: "Community",
    desc: "Live chat",
    icon: Users,
  },
  {
    to: "/materials",
    label: "Materials",
    desc: "Notes & PYQs",
    icon: BookOpen,
  },
  {
    to: "/timer",
    label: "Focus Timer",
    desc: "Deep work",
    icon: Timer,
  },
  {
    to: "/watch",
    label: "Watch Party",
    desc: "Study together",
    icon: Tv,
  },
] as const;

function Dashboard() {
    const { user } = Route.useRouteContext();

  type DashboardMode = "classic" | "focus" | "pro";

  const { isPro, loading: proLoading } = useProStatus(user.id);

  const queryClient = useQueryClient();

  const [dashboardMode, setDashboardMode] =
    useState<DashboardMode>("classic");

  const dashboardPreference = useQuery({
    queryKey: ["dashboard-preference", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboard_preferences")
        .select("mode")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      return (data?.mode ?? "classic") as DashboardMode;
    },
  });

  useEffect(() => {
    if (dashboardPreference.data) {
      setDashboardMode(dashboardPreference.data);
    }
  }, [dashboardPreference.data]);

  const saveDashboardMode = useMutation({
    mutationFn: async (mode: DashboardMode) => {
      const { error } = await supabase
        .from("dashboard_preferences")
        .upsert(
          {
            user_id: user.id,
            mode,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (error) throw error;

      return mode;
    },
    onSuccess: (mode) => {
      setDashboardMode(mode);

      queryClient.setQueryData(
        ["dashboard-preference", user.id],
        mode,
      );
    },
  });

  const handleDashboardModeChange = (
    mode: DashboardMode,
  ) => {
    if (mode === "pro" && !isPro) {
      setDashboardMode("focus");
      saveDashboardMode.mutate("focus");
      return;
    }

    setDashboardMode(mode);
    saveDashboardMode.mutate(mode);
  };

  useEffect(() => {
    if (!proLoading && dashboardMode === "pro" && !isPro) {
      setDashboardMode("focus");
      saveDashboardMode.mutate("focus");
    }
  }, [isPro, proLoading]);



  const stats = useQuery({
    queryKey: ["dashboard-stats-v2", user.id],

    queryFn: async () => {
      const since = new Date(
        Date.now() - 7 * 86_400_000,
      ).toISOString();

      const [
        sessionsRes,
        profileRes,
        materialsRes,
        leaderboardRes,
        attemptsRes,
        watchRes,
      ] = await Promise.all([
        supabase
          .from("study_sessions")
          .select("duration_seconds")
          .eq("user_id", user.id)
          .gte("ended_at", since),

        supabase
          .from("profiles")
          .select(
            "full_name, class_level, avatar_url",
          )
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("materials")
          .select(
            "id, title, subject, drive_url, created_at",
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(5),

        supabase.rpc("study_totals_since", {
          _since: since,
        }),

        supabase
          .from("test_attempts")
          .select(
            "id, score, accuracy, submitted_at, test_id",
          )
          .eq("user_id", user.id)
          .not("submitted_at", "is", null)
          .order("submitted_at", {
            ascending: false,
          })
          .limit(3),

        supabase
          .from("video_watch_progress")
          .select(
            "video_id, position_seconds, duration_seconds, updated_at",
          )
          .eq("user_id", user.id)
          .order("updated_at", {
            ascending: false,
          })
          .limit(3),
      ]);

      const weekSeconds = (
        sessionsRes.data ?? []
      ).reduce(
        (total, row) =>
          total + (row.duration_seconds ?? 0),
        0,
      );

      const totals = new Map<string, number>();

      (
        (leaderboardRes.data ?? []) as Array<{
          user_id: string;
          total_seconds: number;
        }>
      ).forEach((row) => {
        totals.set(
          row.user_id,
          Number(row.total_seconds ?? 0),
        );
      });

      const sorted = [...totals.entries()].sort(
        (a, b) => b[1] - a[1],
      );

      const rank = sorted.findIndex(
        ([id]) => id === user.id,
      );

      return {
        weekSeconds,
        profile: profileRes.data,
        recent: materialsRes.data ?? [],
        rank: rank >= 0 ? rank + 1 : null,
        totalRanked: sorted.length,
        attempts: attemptsRes.data ?? [],
        watching: watchRes.data ?? [],
      };
    },
  });
const commandCenter = useQuery({
  queryKey: ["dashboard-command-center", user.id],
  queryFn: async () => {
    // This RPC is not yet represented in the generated Supabase function types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc(
      "get_dashboard_command_center",
    );

    if (error) throw error;

    return data;
  },
  staleTime: 60_000,
});
const squadWorkspace = useQuery({
  queryKey: ["dashboard-squad-workspace", user.id],
  queryFn: async () => {
    // This RPC is not yet represented in the generated Supabase function types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc(
      "get_dashboard_squad_workspace",
    );

    if (error) throw error;

    return data;
  },
  staleTime: 60_000,
});

  const weekSeconds =
    stats.data?.weekSeconds ?? 0;

  const hours = Math.floor(
    weekSeconds / 3600,
  );

  const minutes = Math.floor(
    (weekSeconds % 3600) / 60,
  );

  const greeting = (() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";

    return "Good evening";
  })();

  const name =
    stats.data?.profile?.full_name?.split(" ")[0] ??
    "Aspirant";

  const goal = 21 * 3600;

  const progress = Math.min(
    100,
    Math.round((weekSeconds / goal) * 100),
  );

  const remainingHours = Math.max(
    0,
    21 - Math.floor(weekSeconds / 3600),
  );

  if (
    dashboardMode !== "classic" &&
    dashboardPreference.isFetched &&
    !proLoading
  ) {
    return (
      <AppShell>
        <DashboardWorkspace
          mode={dashboardMode}
          userName={name}
          profile={stats.data?.profile}
          weekHours={hours}
          weekMinutes={minutes}
          rank={stats.data?.rank ?? null}
          recentTests={stats.data?.attempts.length ?? 0}
          watchingCount={stats.data?.watching.length ?? 0}

  commandCenter={commandCenter.data}
  commandCenterLoading={commandCenter.isLoading}
squadWorkspace={squadWorkspace.data}
squadWorkspaceLoading={squadWorkspace.isLoading}
          onSwitchMode={handleDashboardModeChange}
        />
      </AppShell>
    );
  }

  return (

    <AppShell>
      <main className="mx-auto w-full max-w-[1440px] px-3 pb-12 pt-3 sm:px-5 sm:pb-16 sm:pt-5 lg:px-7">
        <div className="space-y-4 sm:space-y-5">
{/* DASHBOARD VIEW SWITCH */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-1.5 shadow-soft">
            <span className="pl-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Dashboard view
            </span>

            <div className="flex items-center rounded-xl bg-muted p-1">
              {(["classic", "focus", "pro"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleDashboardModeChange(m)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                    dashboardMode === m
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <CustomizableDashboard userId={user.id}>
          <DashboardWidget id="overview" title="Welcome & study progress" defaultSpan="full">
          {/* HERO */}
          <section
            data-tour="welcome"
            className="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-soft"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {greeting}
                  </p>

                  <h1 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                    {name} 👋
                  </h1>

                  <p className="mt-1.5 max-w-xl text-xs leading-5 text-muted-foreground sm:text-sm">
                    Stay consistent, keep learning and move
                    one step closer to your JEE goal.
                  </p>
                </div>

                <QrCodeDialog
                  url="https://jeeprephub.co.in"
                  title="Share PREPWIAN"
                  description="Invite friends — they can scan this QR with any phone camera to open the site."
                  fileName="jee-prep-hub"
                  trigger={
                    <button
                      type="button"
                      aria-label="Share PREPWIAN"
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background/70 px-3 text-xs font-semibold shadow-sm backdrop-blur transition hover:bg-muted"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">
                        Share
                      </span>
                    </button>
                  }
                />
              </div>

              {/* WEEKLY GOAL */}
              <div className="mt-5 rounded-2xl border border-border/70 bg-background/45 p-3.5 backdrop-blur sm:p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Weekly study goal
                    </p>

                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-display text-xl font-black sm:text-2xl">
                        {hours}h {minutes}m
                      </span>

                      <span className="text-[11px] text-muted-foreground">
                        / 21h
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-display text-lg font-black text-primary">
                      {progress}%
                    </span>

                    <p className="text-[9px] text-muted-foreground">
                      completed
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>3 hours/day target</span>

                  <span>
                    {progress >= 100
                      ? "Goal completed 🎉"
                      : `${remainingHours}h remaining`}
                  </span>
                </div>
              </div>

              {/* STATS */}
              <div
                data-tour="stats"
                className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
              >
                <StatCard
                  icon={Clock}
                  label="Study time"
                  value={`${hours}h ${minutes}m`}
                  hint="This week"
                />

                <StatCard
                  icon={Trophy}
                  label="Study rank"
                  value={
                    stats.data?.rank
                      ? `#${stats.data.rank}`
                      : "—"
                  }
                  hint={
                    stats.data?.totalRanked
                      ? `of ${stats.data.totalRanked}`
                      : "Start studying"
                  }
                />

                <StatCard
                  icon={FileText}
                  label="Tests"
                  value={`${stats.data?.attempts.length ?? 0}`}
                  hint="Recent attempts"
                />

                <StatCard
                  icon={Flame}
                  label="Consistency"
                  value="Daily"
                  hint="Keep the streak"
                />
              </div>
            </div>
          </section>
          </DashboardWidget>

          <DashboardWidget id="community" title="Community & notices" defaultSpan="full">
          <ConsentSkippedBanner />

          {/* COMMUNITY */}
          <Link
            to="/community"
            data-tour="community"
            className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3.5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow active:scale-[0.99] sm:p-4"
          >
            <CommunityLogo size={42} className="md:[transform:scale(1.12)] lg:[transform:scale(1.22)]" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-bold sm:text-base">
                  Community Live
                </h2>

                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-destructive">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive motion-safe:animate-pulse" />
                  Live
                </span>
              </div>

              <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">
                Doubts, notices and real-time chat with
                fellow aspirants
              </p>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
          </DashboardWidget>

          {/* PRACTICE ARENA */}
          <DashboardWidget id="practice" title="Practice arena" defaultSpan="full">
          <section>
            <SectionTitle
              eyebrow="Practice"
              title="Practice Arena"
              description="Challenge yourself every day"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <PracticeCard
                to="/quiz"
                icon={Flame}
                title="Daily Challenge"
                description="10 fresh questions · build your streak"
              />

              <PracticeCard
                to="/quiz"
                icon={Swords}
                title="Question Battle"
                description="15 rapid-fire questions from the test bank"
                accent
              />
            </div>
          </section>
          </DashboardWidget>

          {/* COUNTDOWNS */}
          <DashboardWidget id="countdown" title="Exam countdowns" defaultSpan="full">
          <section data-tour="countdown">
            <SectionTitle
              eyebrow="Your targets"
              title="Exam Countdown"
              description="Keep your preparation on track"
            />

            <div className="grid gap-3 lg:grid-cols-2">
              <JeeCountdown />
              <EngineeringCountdown />
            </div>
          </section>
          </DashboardWidget>

          {/* QUICK ACTIONS */}
          <DashboardWidget id="shortcuts" title="Quick actions" defaultSpan="full">
          <section>
            <SectionTitle
              eyebrow="Shortcuts"
              title="Jump back in"
              description="Everything you use most, one tap away"
            />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {QUICK_ACTIONS.map(
                (action, index) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.to}
                      to={action.to}
                      style={{
                        animationDelay: `${index * 35}ms`,
                      }}
                      className="group flex min-w-0 items-center gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-soft transition motion-safe:animate-rise-in hover:-translate-y-0.5 hover:shadow-glow active:scale-[0.98]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                        <Icon className="h-4 w-4" />
                      </span>

                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold sm:text-sm">
                          {action.label}
                        </span>

                        <span className="mt-0.5 block truncate text-[9px] text-muted-foreground sm:text-[10px]">
                          {action.desc}
                        </span>
                      </span>
                    </Link>
                  );
                },
              )}
            </div>
          </section>
          </DashboardWidget>

          <DashboardWidget id="workspace-hub" title="Study workspaces" defaultSpan="full">
            <section>
              <SectionTitle
                eyebrow="Your study systems"
                title="Plan, focus and study together"
                description="Live previews from your connected workspaces — open any one for the full experience."
              />
              <ClassicWorkspaceSections />
            </section>
          </DashboardWidget>

          <DashboardWidget id="checklist" title="Daily checklist" defaultSpan="full">
            <DailyChecklist userId={user.id} />
          </DashboardWidget>
          <DashboardWidget id="analytics" title="Study analytics" defaultSpan="half">
            <StudyAnalyticsWidget userId={user.id} />
          </DashboardWidget>

          {/* MAIN GRID */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">

            {/* LEFT COLUMN */}
            <div className="min-w-0 space-y-4">

              <DashboardWidget id="watching" title="Continue watching" defaultSpan="half">
              {/* CONTINUE WATCHING */}
              {(stats.data?.watching.length ?? 0) > 0 && (
                <DashboardCard
                  title="Continue watching"
                  icon={Play}
                  action={
                    <Link
                      to="/watch-history"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                    >
                      History
                      <History className="h-3 w-3" />
                    </Link>
                  }
                >
                  <div className="space-y-2">
                    {stats.data?.watching.map(
                      (watch) => {
                        const pct =
                          watch.duration_seconds
                            ? Math.min(
                                100,
                                Math.round(
                                  (watch.position_seconds /
                                    watch.duration_seconds) *
                                    100,
                                ),
                              )
                            : 0;

                        return (
                          <Link
                            key={watch.video_id}
                            to="/pulse"
                            search={{
                              v: watch.video_id,
                            }}
                            className="block rounded-xl border border-border p-3 transition hover:bg-muted/40"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium">
                                Resume lecture
                              </span>

                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {pct}%
                              </span>
                            </div>

                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-accent transition-all"
                                style={{
                                  width: `${pct}%`,
                                }}
                              />
                            </div>
                          </Link>
                        );
                      },
                    )}
                  </div>
                </DashboardCard>
              )}
              </DashboardWidget>

              <DashboardWidget id="tests" title="Recent tests" defaultSpan="half">
              {/* RECENT TESTS */}
              <DashboardCard
                title="Recent tests"
                icon={FileText}
                action={
                  <Link
                    to="/tests"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                  >
                    All tests
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              >
                {stats.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                ) : (stats.data?.attempts.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No attempts yet —{" "}
                    <Link to="/tests" className="font-semibold text-accent hover:underline">
                      take your first mock test
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.data?.attempts.map((attempt) => (
                      <Link
                        key={attempt.id}
                        to="/tests/result/$attemptId"
                        params={{ attemptId: attempt.id }}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            Score {attempt.score ?? 0}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {attempt.submitted_at
                              ? new Date(attempt.submitted_at).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] font-semibold text-accent">
                          {Math.round(Number(attempt.accuracy ?? 0))}%
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </DashboardCard>
              </DashboardWidget>

              <DashboardWidget id="materials" title="Latest materials" defaultSpan="half">
              {/* MATERIALS */}
              <DashboardCard
                title="Latest materials"
                icon={BookOpen}
                action={
                  <Link
                    to="/materials"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                  >
                    Browse
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                }
              >
                {stats.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ) : (stats.data?.recent.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No materials uploaded yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.data?.recent.map((material) => (
                      <a
                        key={material.id}
                        href={material.drive_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{material.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {material.subject ?? "General"}
                          </p>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                )}
              </DashboardCard>
              </DashboardWidget>

              <DashboardWidget id="streaks" title="Study streaks & history" defaultSpan="half">
<StudyStreakButton />
<StreakHistory userId={user.id} />
              </DashboardWidget>
            </div>

            {/* RIGHT COLUMN */}
            <div className="min-w-0 space-y-4">
              <DashboardWidget id="membership" title="Membership & plan" defaultSpan="half">
              <MembershipCard userId={user.id} />
              <ProStatusCard userId={user.id} />
              </DashboardWidget>
              <DashboardWidget id="focus" title="Focus & study tools" defaultSpan="half">
              <MiniFocusTimer />
              <LogStudyHours />
              </DashboardWidget>
              <DashboardWidget id="messages" title="Messages" defaultSpan="half">
              <DmInboxCard userId={user.id} />
              </DashboardWidget>
              <DashboardWidget id="planner" title="Study planner & insights" defaultSpan="full">
              <ClassicProWidgets commandCenter={commandCenter.data} />
              </DashboardWidget>
            </div>
          </div>
          </CustomizableDashboard>
        </div>
      </main>
    </AppShell>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="font-display text-base font-black sm:text-lg">{title}</h2>
      <p className="text-[11px] text-muted-foreground">{description}</p>
    </div>
  );
}

function PracticeCard({
  to,
  icon: Icon,
  title,
  description,
  accent,
}: {
  to: "/quiz";
  icon: typeof BookOpen;
  title: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 rounded-2xl border border-border p-3.5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow active:scale-[0.99] ${
        accent ? "bg-accent/10" : "bg-card"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function DashboardCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof BookOpen;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold sm:text-base">
          <Icon className="h-4 w-4 text-accent" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-3 shadow-soft backdrop-blur sm:p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" />
      </div>
      <div className="mt-1.5 font-display text-lg font-bold sm:text-2xl">{value}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">{hint}</div>
    </div>
  );
}
