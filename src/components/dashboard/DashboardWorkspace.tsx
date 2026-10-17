import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  ChevronRight,
  Clock3,
  Flame,
  FileText,
  Sparkles,
  Target,
  Medal,
  Trophy,
  Users,
  Zap,
  Crown,
  Gauge,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { ProDashboard } from "./ProDashboard";

type WorkspaceMode = "focus" | "pro";

type CommandCenterData = {
  today: {
    studySeconds: number;
    testsCompleted: number;
    learningActivity: number;
    focusSessions: number;
  };
  weakTopics: Array<{
    subject: string;
    topic: string;
    questions: number;
    correct: number;
    accuracy: number;
    lastAttemptAt: string | null;
  }>;
  continueLearning: {
    videoId: string;
    title: string;
    subject: string | null;
    chapter: string | null;
    positionSeconds: number;
    durationSeconds: number;
    completed: boolean;
    updatedAt: string;
  } | null;
  revisionQueue: Array<{
    subject: string;
    topic: string;
    status: string;
    updatedAt: string;
  }>;
  recommendedMaterials: Array<{
    id: string;
    title: string;
    subject: string;
    topic: string | null;
    resourceType: string;
    url: string | null;
  }>;
  recommendation: string;
};

type SquadWorkspaceData = {
  groups: Array<{
    groupId: string;
    name: string;
    description: string | null;
    category: string;
    privacy: string;
    joinedAt: string;
    memberCount: number;
    unreadCount: number;
    latestMessage: {
      body: string;
      createdAt: string;
    } | null;
  }>;
  groupCount: number;
  unreadCount: number;
  generatedAt: string;
};

interface DashboardWorkspaceProps {
  mode: WorkspaceMode;
  userName: string;
  profile?: {
    full_name?: string | null;
    class_level?: string | null;
    avatar_url?: string | null;
  } | null;
  weekHours: number;
  weekMinutes: number;
  rank: number | null;
  recentTests: number;
  watchingCount: number;
  commandCenter?: CommandCenterData;
  commandCenterLoading?: boolean;
  squadWorkspace?: SquadWorkspaceData;
  squadWorkspaceLoading?: boolean;
  onSwitchMode: (mode: "classic" | "focus" | "pro") => void;
}

const focusActions = [
  {
    title: "Continue studying",
    description: "Pick up where you left off",
    icon: BookOpen,
    to: "/pulse" as const,
  },
  {
    title: "Take a test",
    description: "Practice under exam conditions",
    icon: FileText,
    to: "/tests" as const,
  },
  {
    title: "Ask AI",
    description: "Get help with your next step",
    icon: Brain,
    to: "/ai-chat" as const,
  },
  {
    title: "Focus timer",
    description: "Start a distraction-free session",
    icon: Clock3,
    to: "/timer" as const,
  },
];

const glassCard =
  "border border-white/70 bg-white/72 shadow-[0_24px_70px_-34px_rgba(18,59,112,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]";

const glassSoft =
  "border border-white/60 bg-white/58 shadow-[0_18px_50px_-30px_rgba(18,59,112,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]";

const glassInteractive =
  "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-32px_rgba(18,59,112,0.30)] active:scale-[0.985]";

export function DashboardWorkspace({
  mode,
  userName,
  weekHours,
  weekMinutes,
  rank,
  recentTests,
  watchingCount,
  commandCenter,
  onSwitchMode,
}: DashboardWorkspaceProps) {
  if (mode === "pro") {
    return (
      <ProDashboard
        userName={userName}
        weekHours={weekHours}
        weekMinutes={weekMinutes}
        rank={rank}
        commandCenter={commandCenter}
        onSwitchMode={onSwitchMode}
      />
    );
  }

  const weeklyMinutes = weekHours * 60 + weekMinutes;
  const weeklyTargetMinutes = 21 * 60;
  const weeklyPct = Math.min(100, Math.round((weeklyMinutes / weeklyTargetMinutes) * 100));
  const remainingMinutes = Math.max(0, weeklyTargetMinutes - weeklyMinutes);
  const remainingH = Math.floor(remainingMinutes / 60);
  const remainingM = remainingMinutes % 60;

  const todaySeconds = commandCenter?.today.studySeconds ?? 0;
  const weakTopic = commandCenter?.weakTopics?.[0];
  const revisionTopic = commandCenter?.revisionQueue?.[0];
  const learning = commandCenter?.continueLearning ?? null;

  const recommendation =
    commandCenter?.recommendation ??
    (weakTopic
      ? `Review ${weakTopic.topic}`
      : revisionTopic
        ? `Revise ${revisionTopic.topic}`
        : learning
          ? "Continue your unfinished lecture"
          : "Build your next focused study block.");

  const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";
  const pill =
    "inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow active:scale-[0.98]";
  const navyBtn =
    "inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#123b70] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-[#123b70]";

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-x-hidden text-foreground">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
        <div className="mb-4 flex flex-col items-stretch gap-3 rounded-[28px] border border-border bg-card/80 p-2 shadow-soft backdrop-blur motion-safe:animate-rise-in sm:flex-row sm:items-center sm:justify-between sm:pl-4">
          <span className={eyebrow}>Dashboard view</span>
          <div className="flex w-full rounded-full bg-muted p-1 text-sm font-semibold sm:w-auto">
            <button type="button" onClick={() => onSwitchMode("classic")} className="min-w-0 flex-1 rounded-full px-3 py-2 text-center text-muted-foreground transition hover:text-foreground sm:flex-none sm:px-4">
              Classic
            </button>
            <span className="min-w-0 flex-1 rounded-full bg-[#123b70] px-3 py-2 text-center text-white dark:bg-white dark:text-[#123b70] sm:flex-none sm:px-4">Focus</span>
            <button type="button" onClick={() => onSwitchMode("pro")} className="min-w-0 flex-1 rounded-full px-3 py-2 text-center text-muted-foreground transition hover:text-foreground sm:flex-none sm:px-4">
              Pro
            </button>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[28px] border border-border bg-card/80 p-5 shadow-soft backdrop-blur motion-safe:animate-rise-in sm:p-8">
          <p className={eyebrow}>{getGreeting()}</p>
          <h1 className="mt-1 truncate text-3xl font-extrabold tracking-tight sm:text-5xl">{userName} 👋</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Keep the noise out. Focus on the next meaningful piece of work.
          </p>

          <div className="mt-5 rounded-2xl border border-border bg-background/60 p-4 shadow-soft sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className={eyebrow}>Weekly study goal</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums">
                  {weekHours}h {weekMinutes}m
                  <span className="ml-1.5 text-base font-medium text-muted-foreground">/ 21h</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold tracking-tight tabular-nums">{weeklyPct}%</p>
                <p className="text-xs text-muted-foreground">completed</p>
              </div>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${weeklyPct}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>3 hours/day target</span>
              <span>
                {remainingH}h {remainingM}m remaining
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <HeroStat icon={<Clock3 className="h-5 w-5" />} label="Study today" value={formatStudyTime(todaySeconds)} hint="Focused learning" />
            <HeroStat icon={<Trophy className="h-5 w-5" />} label="Study rank" value={rank ? `#${rank}` : "—"} hint={rank ? "Leaderboard" : "Start studying"} />
            <HeroStat icon={<FileText className="h-5 w-5" />} label="Tests" value={String(recentTests)} hint="Recent attempts" />
            <HeroStat icon={<BookOpen className="h-5 w-5" />} label="Learning" value={String(watchingCount)} hint="Recently watched" />
          </div>
        </section>

        <div className="-mx-1 mt-4 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          <Link to="/ai-chat" className={pill}><Brain className="h-4 w-4 text-primary" /> AI Assistant</Link>
          <Link to="/timer" className={pill}><Clock3 className="h-4 w-4 text-primary" /> Focus Timer</Link>
          <Link to="/watch" className={pill}><Users className="h-4 w-4 text-primary" /> Watch Party</Link>
          <Link to="/tests" className={pill}><FileText className="h-4 w-4 text-primary" /> Take a Test</Link>
        </div>

        <section className="mt-4 rounded-[28px] border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className={eyebrow}>Today&apos;s priority</p>
              <h2 className="mt-1 text-lg font-extrabold leading-snug sm:text-xl">{recommendation}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {learning ? (
                  <Link to="/pulse" search={{ v: learning.videoId }} className={navyBtn}>
                    Continue learning <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link to="/tests" className={navyBtn}>
                    Start focused test <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <FocusContent
          commandCenter={commandCenter}
          weekHours={weekHours}
          weekMinutes={weekMinutes}
          rank={rank}
          recentTests={recentTests}
          watchingCount={watchingCount}
        />

        <div className="mt-9 flex justify-center pb-6">
          <button
            type="button"
            onClick={() => onSwitchMode("classic")}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold text-muted-foreground shadow-soft transition hover:-translate-y-0.5 hover:text-foreground"
          >
            Return to Classic
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </main>
  );
}

function HeroStat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-background/60 p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <span className="shrink-0 text-primary">{icon}</span>
      </div>
      <p className="mt-3 truncate text-2xl font-extrabold tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ProContent({
  commandCenter,
  commandCenterLoading,
  recommendation,
  rank,
  recentTests,
  watchingCount,
  weekHours,
  weekMinutes,
  todaySeconds,
  squadWorkspace,
  squadWorkspaceLoading,
}: {
  commandCenter?: CommandCenterData;
  commandCenterLoading?: boolean;
  recommendation: string;
  rank: number | null;
  recentTests: number;
  watchingCount: number;
  weekHours: number;
  weekMinutes: number;
  todaySeconds: number;
  squadWorkspace?: SquadWorkspaceData;
  squadWorkspaceLoading?: boolean;
}) {
  const weakTopics = commandCenter?.weakTopics ?? [];
  const revisionQueue = commandCenter?.revisionQueue ?? [];
  const materials = commandCenter?.recommendedMaterials ?? [];
  const learning = commandCenter?.continueLearning;

  return (
    <div className="mt-8 space-y-8">
      <section>
        <SectionHeading eyebrow="01" title="Study command center" description="Your next study decisions, powered by your actual activity." />
        {commandCenterLoading ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-[1.85rem] bg-muted/60" />)}
          </div>
        ) : (
          <>
            <div className={`relative mt-5 overflow-hidden rounded-[2.5rem] p-5 sm:p-7 ${glassCard}`}>
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-200/25 blur-3xl dark:bg-sky-400/10" />
              <div className="relative grid gap-5 sm:grid-cols-[auto_1fr]">
                <div className="grid h-16 w-16 place-items-center rounded-[1.4rem] bg-[#123b70] text-white shadow-lg dark:bg-white dark:text-[#123b70]"><Target className="h-7 w-7" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Today&apos;s priority</p>
                  <h3 className="mt-2 max-w-2xl font-display text-2xl font-black leading-tight sm:text-3xl">{recommendation}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">One useful action is better than ten distracting ones.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {learning ? (
                      <Link to="/pulse" search={{ v: learning.videoId }} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#123b70] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-[#123b70]">
                        Continue learning<ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link to="/tests" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#123b70] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-[#123b70]">
                        Start focused test<ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                    {revisionQueue[0] && <Link to="/tests" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-5 text-sm font-semibold backdrop-blur-xl transition hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.05]">Revision queue<ChevronRight className="h-4 w-4" /></Link>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={<Clock3 className="h-5 w-5" />} label="Study today" value={formatStudyTime(todaySeconds)} hint="Focused learning" />
              <StatCard icon={<FileText className="h-5 w-5" />} label="Tests today" value={String(commandCenter?.today.testsCompleted ?? 0)} hint="Completed today" />
              <StatCard icon={<BookOpen className="h-5 w-5" />} label="Learning" value={String(commandCenter?.today.learningActivity ?? 0)} hint="Activities today" />
              <StatCard icon={<Zap className="h-5 w-5" />} label="Focus" value={String(commandCenter?.today.focusSessions ?? 0)} hint="Sessions today" />
            </div>
          </>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <ContinueCard learning={learning ?? null} />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <MetricCard icon={Trophy} label="Current rank" value={rank ? `#${rank}` : "—"} description="Study leaderboard" />
          <MetricCard icon={FileText} label="Recent tests" value={String(recentTests)} description="Latest attempts" />
          <MetricCard icon={BookOpen} label="Learning activity" value={String(watchingCount)} description="Recently watched" />
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="02" title="Performance" description="Let your recent practice tell you what deserves attention." />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className={`rounded-[2.5rem] p-5 sm:p-7 ${glassCard}`}>
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Performance</p><h3 className="mt-2 font-display text-2xl font-black">Weak topics</h3></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300"><Target className="h-5 w-5" /></span></div>
            <div className="mt-5 space-y-3">
              {weakTopics.length === 0 ? <EmptyGlass icon={<Target className="h-5 w-5" />} title="No weak topic detected yet." body="Complete more practice tests and the dashboard will identify patterns automatically." action={<Link to="/tests" className="text-xs font-bold text-sky-700 dark:text-sky-300">Take a test</Link>} /> : weakTopics.slice(0, 5).map((topic) => <WeakTopicCard key={`${topic.subject}-${topic.topic}`} topic={topic} />)}
            </div>
          </div>

          <div className={`rounded-[2.5rem] p-5 sm:p-7 ${glassCard}`}>
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revision</p><h3 className="mt-2 font-display text-2xl font-black">Revision priorities</h3></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300"><Zap className="h-5 w-5" /></span></div>
            <div className="mt-5 space-y-3">
              {revisionQueue.length === 0 ? <EmptyGlass icon={<Zap className="h-5 w-5" />} title="Queue is empty" body="Topics that need revision will automatically appear here." /> : revisionQueue.slice(0, 5).map((item, index) => <RevisionItem key={`${item.subject}-${item.topic}`} index={index + 1} item={item} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="min-w-0">
        <div className={`min-w-0 overflow-hidden rounded-[2.5rem] p-5 sm:p-7 ${glassCard}`}>
          <SectionHeading eyebrow="03" title="What to study next" description="Resources selected from your recent performance." />
          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
            {materials.length === 0 ? <EmptyGlass icon={<BookOpen className="h-5 w-5" />} title="Nothing suggested yet" body="Recommendations will appear as your study data grows." /> : materials.slice(0, 4).map((material) => <MaterialCard key={material.id} material={material} />)}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] bg-[#123b70] p-6 text-white shadow-[0_24px_70px_-35px_rgba(18,59,112,0.45)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 backdrop-blur-xl"><Sparkles className="h-5 w-5" /></div>
          <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">AI & insights</p>
          <h2 className="mt-2 max-w-xl font-display text-3xl font-black tracking-tight">Let your study data talk.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/65">Find patterns, identify what needs attention, and turn your activity into your next study action.</p>
          <Link to="/ai-chat" className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-white/10 px-5 text-sm font-bold backdrop-blur-xl transition hover:bg-white/15">Open AI Study Chat<ArrowRight className="ml-2 h-4 w-4" /></Link>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="04" title="Revision priorities" description="Your next decisions should be simple." />
        <div className="space-y-3">
          <PriorityRow number="01" title="Review your weakest topics" description="Turn recent mistakes into your next revision block." icon={Target} to="/tests" />
          <PriorityRow number="02" title="Finish unfinished learning" description="Continue lectures before starting another topic." icon={BookOpen} to="/pulse" />
          <PriorityRow number="03" title="Complete one focused test" description="Use timed practice to measure today's progress." icon={Zap} to="/tests" />
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="05" title="Study together" description="Stay consistent with your study community." />
        {squadWorkspaceLoading ? <div className="h-32 animate-pulse rounded-[2rem] bg-muted/60" /> : squadWorkspace?.groupCount ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{squadWorkspace.groups.slice(0, 6).map((group) => <SquadCard key={group.groupId} group={group} />)}</div> : <div className={`rounded-[2rem] p-6 ${glassCard}`}><EmptyGlass icon={<Users className="h-5 w-5" />} title="No squads joined yet" body="Join a squad to share doubts and keep each other consistent." action={<Link to="/groups" className="text-xs font-bold text-sky-700 dark:text-sky-300">Explore squads</Link>} /></div>}
      </section>

      <section className={`rounded-[2.5rem] p-5 sm:p-7 ${glassSoft}`}>
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Your progress</p>
            <h2 className="mt-2 font-display text-2xl font-black">Build your weekly momentum.</h2>
            <p className="mt-2 text-sm text-muted-foreground">{weekHours}h {weekMinutes}m studied this week · {Math.min(100, Math.round(((weekHours * 60 + weekMinutes) / (21 * 60)) * 100))}% of the 21h reference goal.</p>
          </div>
          <div className="grid h-16 w-16 place-items-center rounded-[1.3rem] bg-sky-500/10 text-sky-700 dark:text-sky-300"><Medal className="h-7 w-7" /></div>
        </div>
      </section>
    </div>
  );
}

function FocusContent({
  commandCenter,
  weekHours,
  weekMinutes,
  rank,
  recentTests,
  watchingCount,
}: {
  commandCenter?: CommandCenterData;
  weekHours: number;
  weekMinutes: number;
  rank: number | null;
  recentTests: number;
  watchingCount: number;
}) {
  const learning = commandCenter?.continueLearning;

  return (
    <div className="mt-8 space-y-7">
      <section>
        <SectionHeading eyebrow="Focus mode" title="Make the next hour count." description="Fewer decisions. Less noise. One meaningful study action at a time." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {focusActions.map((action) => {
            const Icon = action.icon;
            return <Link key={action.title} to={action.to} className={`group rounded-[1.85rem] p-5 ${glassCard} ${glassInteractive}`}><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300"><Icon className="h-5 w-5" /></span><ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div><h3 className="mt-5 text-sm font-bold">{action.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{action.description}</p></Link>;
          })}
        </div>
      </section>

      <ContinueCard learning={learning ?? null} />

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={Flame} label="This week" value={`${weekHours}h ${weekMinutes}m`} description="Focused study" />
        <MetricCard icon={Trophy} label="Study rank" value={rank ? `#${rank}` : "—"} description="Current position" />
        <MetricCard icon={FileText} label="Recent tests" value={String(recentTests)} description="Latest attempts" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={`rounded-[2.5rem] p-5 sm:p-7 ${glassCard}`}>
          <SectionHeading eyebrow="Today's activity" title="Small actions add up." description="Your recent learning activity is already being tracked." />
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard icon={<Clock3 className="h-5 w-5" />} label="Study today" value={formatStudyTime(commandCenter?.today.studySeconds ?? 0)} hint="Focused learning" />
            <StatCard icon={<BookOpen className="h-5 w-5" />} label="Learning" value={String(commandCenter?.today.learningActivity ?? watchingCount)} hint="Activities" />
            <StatCard icon={<FileText className="h-5 w-5" />} label="Tests" value={String(commandCenter?.today.testsCompleted ?? 0)} hint="Completed today" />
            <StatCard icon={<Zap className="h-5 w-5" />} label="Focus" value={String(commandCenter?.today.focusSessions ?? 0)} hint="Sessions today" />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-[#123b70] p-6 text-white shadow-[0_24px_70px_-35px_rgba(18,59,112,0.45)] sm:p-7">
          <Sparkles className="h-6 w-6 text-sky-200" />
          <h2 className="mt-6 font-display text-2xl font-black">One focused session is enough to change the day.</h2>
          <p className="mt-3 text-sm leading-6 text-white/65">Start the timer, put everything else aside, and work on one clearly defined task.</p>
          <Link to="/timer" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-[#123b70] transition hover:bg-white/90">Start focus session<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}

function ModeButton({ label, active, darkActive, onClick }: { label: string; active: boolean; darkActive?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex-1 rounded-[1.1rem] min-w-0 px-2.5 py-2.5 text-xs font-semibold transition sm:px-4 sm:flex-none ${active ? darkActive ? "bg-[#123b70] text-white shadow-lg shadow-black/10 dark:bg-white dark:text-[#123b70]" : "bg-[#123b70] text-white shadow-sm dark:bg-[#17345f] dark:text-white" : "text-muted-foreground hover:bg-black/[0.035] dark:hover:bg-white/[0.06]"}`}>{label}</button>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p><h2 className="mt-2 font-display text-2xl font-black tracking-tight sm:text-3xl">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>;
}

function StatCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return <div className={`rounded-[1.85rem] p-4 ${glassSoft}`}><div className="flex items-center justify-between gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">{icon}</span><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Today</span></div><p className="mt-4 font-display text-2xl font-black tabular-nums">{value}</p><p className="mt-1 text-xs font-semibold">{label}</p><p className="mt-1 text-[11px] text-muted-foreground">{hint}</p></div>;
}

function MetricCard({ icon: Icon, label, value, description }: { icon: ElementType; label: string; value: string; description: string }) {
  return <div className={`rounded-[1.85rem] p-5 ${glassSoft}`}><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300"><Icon className="h-[1.125rem] w-[1.125rem]" /></span><p className="mt-4 font-display text-2xl font-black tabular-nums">{value}</p><p className="mt-1 text-sm font-semibold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>;
}

function ContinueCard({ learning }: { learning: CommandCenterData["continueLearning"] }) {
  return <section className={`rounded-[2.5rem] p-5 sm:p-7 ${glassCard}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Continue</p><h2 className="mt-2 font-display text-2xl font-black">Pick up where you left off</h2></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300"><BookOpen className="h-5 w-5" /></span></div>{learning ? <Link to="/pulse" search={{ v: learning.videoId }} className={`mt-5 block rounded-[1.75rem] p-5 ${glassSoft} ${glassInteractive}`}><p className="line-clamp-3 text-lg font-black leading-7">{learning.title}</p><p className="mt-2 text-xs text-muted-foreground">{learning.subject ?? "General"}{learning.chapter ? ` · ${learning.chapter}` : ""}</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-muted/60"><div className="h-full rounded-full bg-sky-600 transition-all duration-700" style={{ width: `${progressPercent(learning.positionSeconds, learning.durationSeconds)}%` }} /></div><div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{formatWatchTime(learning.positionSeconds)} watched</span><span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 dark:text-sky-300">Resume<ArrowRight className="h-3.5 w-3.5" /></span></div></Link> : <div className="mt-5"><EmptyGlass icon={<BookOpen className="h-5 w-5" />} title="Nothing unfinished yet" body="Your next unfinished lecture will automatically appear here." action={<Link to="/pulse" className="text-xs font-bold text-sky-700 dark:text-sky-300">Browse learning</Link>} /></div>}</section>;
}

function WeakTopicCard({ topic }: { topic: CommandCenterData["weakTopics"][number] }) {
  const accuracy = Math.min(100, Math.max(0, Number(topic.accuracy ?? 0)));
  return <Link to="/tests" className={`group block rounded-[1.65rem] border border-white/60 bg-white/45 p-4 backdrop-blur-xl min-w-0 overflow-hidden dark:border-white/10 dark:bg-white/[0.035] ${glassInteractive}`}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{topic.topic}</p><p className="mt-1 text-[11px] font-medium text-muted-foreground">{topic.subject} · {topic.correct}/{topic.questions} correct</p></div><div className="shrink-0 text-right"><p className="text-sm font-black tabular-nums">{Math.round(accuracy)}%</p><p className="text-[10px] text-muted-foreground">accuracy</p></div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/60"><div className="h-full rounded-full bg-sky-600 transition-all duration-700" style={{ width: `${Math.max(3, accuracy)}%` }} /></div><div className="mt-3 flex items-center justify-end text-[11px] font-bold text-sky-700 dark:text-sky-300">Practice<ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" /></div></Link>;
}

function RevisionItem({ index, item }: { index: number; item: CommandCenterData["revisionQueue"][number] }) {
  return <Link to="/tests" className={`group flex items-center gap-3 rounded-[1.4rem] border border-white/60 bg-white/45 p-3.5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] ${glassInteractive}`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-600/10 text-xs font-black text-sky-700 dark:text-sky-300">{String(index).padStart(2, "0")}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.topic}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{item.subject}</p></div><span className="hidden shrink-0 rounded-full bg-muted/70 px-2.5 py-1 text-[10px] font-bold capitalize text-muted-foreground sm:inline-flex">{item.status.replace(/_/g, " ")}</span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /></Link>;
}

function MaterialCard({ material }: { material: CommandCenterData["recommendedMaterials"][number] }) {
  const content = <><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300">{material.resourceType.toLowerCase().includes("video") ? <BookOpen className="h-5 w-5" /> : <FileText className="h-5 w-5" />}</span><span className="min-w-0 flex-1"><span className="line-clamp-2 block text-sm font-bold leading-5">{material.title}</span><span className="mt-1 block truncate text-[11px] text-muted-foreground">{material.subject}{material.topic ? ` · ${material.topic}` : ""} · {material.resourceType}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></>;
  const className = `group flex min-h-[5.5rem] items-center gap-3 rounded-[1.65rem] border border-white/60 bg-white/45 p-4 backdrop-blur-xl min-w-0 overflow-hidden dark:border-white/10 dark:bg-white/[0.035] ${glassInteractive}`;
  return material.url ? <a href={material.url} target="_blank" rel="noreferrer" className={className}>{content}</a> : <Link to="/materials" className={className}>{content}</Link>;
}

function SquadCard({ group }: { group: SquadWorkspaceData["groups"][number] }) {
  return <Link to="/squad/$groupId" params={{ groupId: group.groupId }} className={`min-w-0 overflow-hidden rounded-[1.85rem] p-5 ${glassCard} ${glassInteractive}`}><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300"><Users className="h-5 w-5" /></span>{group.unreadCount > 0 && <span className="rounded-full bg-sky-600 px-2.5 py-1 text-[10px] font-bold text-white">{group.unreadCount} new</span>}</div><p className="mt-4 truncate text-sm font-bold">{group.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{group.memberCount} {group.memberCount === 1 ? "member" : "members"}</p><p className="mt-3 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-muted-foreground">{group.latestMessage?.body ?? "No messages yet. Say hello."}</p></Link>;
}

function PriorityRow({ number, title, description, icon: Icon, to }: { number: string; title: string; description: string; icon: ElementType; to: "/tests" | "/pulse" }) {
  return <Link to={to} className={`group flex items-center gap-3 rounded-[1.65rem] p-4 ${glassSoft} ${glassInteractive}`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-600/10 text-xs font-black text-sky-700 dark:text-sky-300">{number}</span><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted/60 text-muted-foreground"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{description}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" /></Link>;
}

function EmptyGlass({ icon, title, body, action }: { icon?: ReactNode; title: string; body: string; action?: ReactNode }) {
  return <div className="rounded-[1.65rem] border border-white/55 bg-white/40 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035]"><div className="flex items-start gap-3">{icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">{icon}</span>}<div className="min-w-0"><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>{action && <div className="mt-3">{action}</div>}</div></div></div>;
}

function progressPercent(positionSeconds: number, durationSeconds: number) {
  if (!durationSeconds || durationSeconds <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((positionSeconds / durationSeconds) * 100)));
}

function formatWatchTime(seconds: number) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function formatStudyTime(seconds: number) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}
