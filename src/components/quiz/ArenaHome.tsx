import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Beaker,
  Brain,
  CalendarDays,
  Check,
  Flame,
  Info,
  KeyRound,
  Medal,
  Play,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { levelProgress, type QuizStats } from "@/lib/quiz-xp";
import type { ProgressOverview } from "@/lib/progress.functions";
import { ArenaMultiplayerPanel } from "./ArenaMultiplayerPanel";
import RecallSprint from "./RecallSprint";
import { Panel, PrimaryButton, Ring, SectionTitle } from "./ui";

export type Subject = "any" | "physics" | "chemistry" | "mathematics";

export const SUBJECTS = [
  { key: "any", label: "All", icon: Brain, color: "#38bdf8", ok: true },
  { key: "physics", label: "Physics", icon: Activity, color: "#22d3ee", ok: true },
  { key: "chemistry", label: "Chemistry", icon: Beaker, color: "#a78bfa", ok: true },
  { key: "mathematics", label: "Maths", icon: Target, color: "#60a5fa", ok: true },
  { key: "biology", label: "Biology", icon: Sparkles, color: "#34d399", ok: false },
] as const;

const MILESTONES = [
  {
    title: "First Run",
    hint: "Finish your first run",
    target: 1,
    value: (s: QuizStats) => s.played,
    icon: Play,
    from: "#38bdf8",
    to: "#22d3ee",
  },
  {
    title: "Streak Starter",
    hint: "Reach a 3-day streak",
    target: 3,
    value: (s: QuizStats) => s.streak,
    icon: Flame,
    from: "#fb923c",
    to: "#fbbf24",
  },
  {
    title: "Sharp Mind",
    hint: "50 correct answers",
    target: 50,
    value: (s: QuizStats) => s.correct,
    icon: Target,
    from: "#a78bfa",
    to: "#e879f9",
  },
  {
    title: "XP Hunter",
    hint: "Earn 500 XP",
    target: 500,
    value: (s: QuizStats) => s.xp,
    icon: Zap,
    from: "#6366f1",
    to: "#38bdf8",
  },
];

type Props = {
  user: { id: string; user_metadata?: Record<string, unknown>; email?: string | null } | null;
  stats: QuizStats;
  progress: ProgressOverview | null;
  accuracy: number;
  subject: Subject;
  onSubject: (s: Subject) => void;
  topics: string[];
  topicsLoading: boolean;
  selectedTopics: string[];
  onTopics: (topics: string[]) => void;
  countdown: string;
  loadingMode: "daily" | "battle" | null;
  emptyNotice: boolean;
  challengePending: boolean;
  onStartDaily: () => void;
  onStartPractice: () => void;
};

export default function ArenaHome(p: Props) {
  const name =
    (p.user?.user_metadata?.username as string | undefined) ||
    (p.user?.user_metadata?.full_name as string | undefined) ||
    p.user?.email?.split("@")[0] ||
    "Guest";
  const avatar =
    (p.user?.user_metadata?.avatar_url as string | undefined) ||
    (p.user?.user_metadata?.picture as string | undefined);

  return (
    <div className="quiz-theme mx-auto w-full max-w-none space-y-4 rounded-[30px] bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.10),_transparent_55%),#f4f8ff] text-slate-900 dark:bg-[radial-gradient(ellipse_at_top,_rgba(30,64,175,0.14),_transparent_55%),#080d19] dark:text-white sm:max-w-5xl sm:space-y-5 sm:p-5">
      <PlayerCard
        name={name}
        avatar={avatar}
        stats={p.stats}
        tier={p.progress?.tier ?? null}
        accuracy={p.accuracy}
      />

      {!p.user && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-[#2a2210] dark:text-amber-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
          <p>
            You are playing as a guest.{" "}
            <Link to="/auth" className="font-bold underline underline-offset-2">
              Sign in
            </Link>{" "}
            to save XP and streaks to your account.
          </p>
        </div>
      )}
      {p.emptyNotice && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-[#111a35] dark:text-slate-300">
          No published questions are available for this selection yet. Try another subject.
        </div>
      )}
      {p.challengePending && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-300 bg-violet-50 p-4 dark:border-violet-300/20 dark:bg-violet-950/30">
          <div>
            <p className="font-bold text-violet-950 dark:text-violet-100">
              A friend challenged you
            </p>
            <p className="mt-0.5 text-xs text-violet-800 dark:text-violet-200/80">
              Start the battle to take the same 15-question set and compare scores.
            </p>
          </div>
          <button
            type="button"
            onClick={p.onStartPractice}
            disabled={p.loadingMode === "battle"}
            className="inline-flex min-h-10 items-center rounded-xl bg-violet-700 px-4 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60 dark:bg-violet-300 dark:text-violet-950 dark:hover:bg-violet-200"
          >
            {p.loadingMode === "battle" ? "Loading…" : "Accept challenge"}
          </button>
        </div>
      )}

      <PracticeFocus subject={p.subject} onSubject={p.onSubject} topics={p.topics} topicsLoading={p.topicsLoading} selectedTopics={p.selectedTopics} onTopics={p.onTopics} />

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <DailyCard
          stats={p.stats}
          countdown={p.countdown}
          loading={p.loadingMode === "daily"}
          onStart={p.onStartDaily}
        />
        <StatsBento stats={p.stats} accuracy={p.accuracy} />
      </div>

      <ArenaMultiplayerPanel user={p.user} />
      <Modes
        subject={p.subject}
        loading={p.loadingMode === "battle"}
        onStart={p.onStartPractice}
        onChallengeFriendClick={() => undefined}
        canInvite={Boolean(p.user)}
      />
      <Milestones stats={p.stats} />
      <SubjectBars progress={p.progress} />
      <RecallSprint />

      <div className="grid gap-3 sm:grid-cols-2">
        <HubLink
          to="/progress"
          icon={<Medal className="h-5 w-5" />}
          title="Full progress"
          text="Tests, accuracy and weak topics"
        />
        <HubLink
          to="/leaderboard"
          icon={<Trophy className="h-5 w-5" />}
          title="Leaderboard"
          text="See how you rank among students"
        />
      </div>
    </div>
  );
}

function PlayerCard({
  name,
  avatar,
  stats,
  tier,
  accuracy,
}: {
  name: string;
  avatar?: string;
  stats: QuizStats;
  tier: string | null;
  accuracy: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-violet-100 p-4 text-slate-900 shadow-[0_14px_36px_rgba(31,65,120,0.10)] sm:p-6 dark:border-amber-300/15 dark:from-[#172344] dark:via-[#10182e] dark:to-[#211c35] dark:text-white dark:shadow-[0_18px_55px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/20" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-600/20" />
      <div className="relative flex items-center gap-4">
        <div className="relative">
          <Ring value={levelProgress(stats.xp)} size={88} stroke={7}>
            <div className="grid h-[68px] w-[68px] place-items-center overflow-hidden rounded-full bg-sky-100 text-2xl font-black text-slate-900 dark:bg-[#1b2750] dark:text-white">
              {avatar ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                name.slice(0, 1).toUpperCase()
              )}
            </div>
          </Ring>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-2.5 py-0.5 text-[#17120a] text-[10px] font-black tracking-wider shadow-lg">
            LV {stats.level}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-sky-800 dark:text-sky-200/80">
            Welcome back
          </p>
          <h1 className="truncate text-xl font-black tracking-tight sm:text-3xl">{name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/[0.045] dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold">
              <Medal className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />{" "}
              {tier ? `${tier} tier` : "Unranked"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-800 dark:bg-orange-500/15 dark:text-orange-200">
              <Flame className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" /> {stats.streak}d
              streak
            </span>
          </div>
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <Mini
          icon={<Zap className="h-4 w-4 text-sky-700 dark:text-sky-300" />}
          label="Total XP"
          value={stats.xp.toLocaleString()}
        />
        <Mini
          icon={<Target className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />}
          label="Accuracy"
          value={`${accuracy}%`}
        />
        <Mini
          icon={<Play className="h-4 w-4 text-violet-700 dark:text-violet-300" />}
          label="Runs"
          value={String(stats.played)}
        />
      </div>
      <p className="relative mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
        {stats.xp % 250}/250 XP to level {stats.level + 1}
      </p>
    </div>
  );
}

function Mini({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/75 p-3 text-center shadow-sm dark:border-white/10 dark:bg-[#0b1427]">
      <div className="mx-auto w-fit">{icon}</div>
      <p className="mt-1 text-lg font-black tabular-nums">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
    </div>
  );
}

function DailyCard({
  stats,
  countdown,
  loading,
  onStart,
}: {
  stats: QuizStats;
  countdown: string;
  loading: boolean;
  onStart: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-[radial-gradient(ellipse_at_90%_0%,_rgba(245,158,11,0.14),_transparent_38%),linear-gradient(135deg,#fff8e8_0%,#f1f7ff_56%,#f3efff_100%)] p-5 text-slate-900 shadow-[0_14px_36px_rgba(31,65,120,0.10)] sm:p-6 dark:bg-[radial-gradient(ellipse_at_90%_0%,_rgba(245,158,11,0.22),_transparent_38%),linear-gradient(135deg,#172342_0%,#11172b_56%,#25203a_100%)] dark:text-white dark:shadow-[0_22px_60px_rgba(0,0,0,0.24)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-sky-500/5 blur-3xl dark:bg-white/15" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/[0.06] px-3 py-1 dark:bg-black/25 text-[10px] font-black uppercase tracking-[0.18em]">
            <Flame className="h-3.5 w-3.5 text-orange-600 dark:text-orange-300" /> Daily challenge
          </span>
          <CalendarDays className="h-6 w-6 text-amber-700 dark:text-white/80" />
        </div>
        <h2 className="mt-4 text-2xl font-black leading-tight sm:text-3xl">
          10 questions.
          <br />
          One shot at your streak.
        </h2>
        <div
          className="mt-4 flex items-center gap-1.5"
          aria-label={`Best score ${stats.dailyBest} of 10`}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className={`h-2.5 flex-1 rounded-full ${i < stats.dailyBest ? "bg-sky-600 dark:bg-white" : "bg-slate-900/10 dark:bg-slate-950/70"}`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-900 dark:text-white/80">
          <span>Best today: {stats.dailyBest}/10</span>
          <span className="font-mono">New set in {countdown}</span>
        </div>
        <PrimaryButton
          tone="white"
          onClick={onStart}
          disabled={loading}
          className="mt-5 w-full sm:w-auto"
        >
          {loading ? "Loading challenge…" : stats.dailyBest > 0 ? "Play again" : "Start challenge"}{" "}
          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

function StatsBento({ stats, accuracy }: { stats: QuizStats; accuracy: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#10182b]">
        <Ring value={accuracy} size={72} stroke={8} from="#34d399" to="#22d3ee">
          <span className="text-sm font-black">{accuracy}%</span>
        </Ring>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Overall accuracy
          </p>
          <p className="mt-0.5 text-lg font-black">
            {stats.correct}
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {" "}
              / {stats.answered} correct
            </span>
          </p>
        </div>
      </div>
      <BentoTile
        icon={<Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
        label="Daily best"
        value={`${stats.dailyBest}/10`}
      />
      <BentoTile
        icon={<Swords className="h-4 w-4 text-violet-700 dark:text-violet-300" />}
        label="Battle best"
        value={`${stats.battleBest}/15`}
      />
    </div>
  );
}

function BentoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#10182b]">
      {icon}
      <p className="mt-2 text-xl font-black tabular-nums">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
    </div>
  );
}

function PracticeFocus({ subject, onSubject, topics, topicsLoading, selectedTopics, onTopics }: {
  subject: Subject;
  onSubject: (subject: Subject) => void;
  topics: string[];
  topicsLoading: boolean;
  selectedTopics: string[];
  onTopics: (topics: string[]) => void;
}) {
  return (
    <section className="rounded-3xl border border-sky-200 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-[#10182b] sm:p-5">
      <h2 className="text-base font-black">Focus your practice</h2>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Choose a subject and target topics you want to strengthen.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Practice subject">
        {SUBJECTS.filter((choice) => choice.ok).map((choice) => (
          <button key={choice.key} type="button" role="radio" aria-checked={choice.key === subject}
            onClick={() => onSubject(choice.key as Subject)}
            className={`min-h-10 rounded-full border px-4 text-xs font-bold transition ${choice.key === subject ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"}`}>
            {choice.label}
          </button>
        ))}
      </div>
      <details className="mt-4 rounded-2xl border border-slate-200 dark:border-white/10">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold">Choose topics <span className="text-slate-500">({selectedTopics.length} selected)</span></summary>
        <div className="max-h-56 overflow-y-auto border-t border-slate-200 p-3 dark:border-white/10">
          {topicsLoading ? <p className="p-2 text-xs text-muted-foreground">Loading available topics…</p> : topics.length === 0 ? <p className="p-2 text-xs text-muted-foreground">No topic-labelled questions are available for this subject yet.</p> : (
            <div className="grid gap-1 sm:grid-cols-2">
              {topics.map((topic) => <label key={topic} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/5">
                <input type="checkbox" className="h-4 w-4 accent-sky-600" checked={selectedTopics.includes(topic)} onChange={(event) => onTopics(event.target.checked ? [...selectedTopics, topic] : selectedTopics.filter((value) => value !== topic))} />
                <span className="truncate">{topic}</span>
              </label>)}
            </div>
          )}
        </div>
      </details>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Selected topics filter the Daily Challenge. Leave all unchecked to use the whole subject. Practice Battle uses the selected subject across all topics.</p>
    </section>
  );
}

function Modes({
  subject,
  loading,
  onStart,
  onChallengeFriendClick,
  canInvite,
}: {
  subject: Subject;
  loading: boolean;
  onStart: () => void;
  onChallengeFriendClick: () => void;
  canInvite: boolean;
}) {
  return (
    <Panel>
      <SectionTitle eyebrow="Pick your fight" title="Battle modes" />
      <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-4 text-slate-900 dark:border-sky-400/20 dark:from-[#14224f] dark:to-[#1a1747] dark:text-white">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200">
            <Swords className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold">Practice Battle</h3>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                Live
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              15 questions against the clock. Beat your best score and accuracy.
            </p>
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-slate-900/[0.04] px-3 py-2 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
          Focus subject: <strong className="capitalize text-slate-900 dark:text-white">{SUBJECTS.find((choice) => choice.key === subject)?.label ?? "All"}</strong> · all topics
        </p>
        <PrimaryButton onClick={onStart} disabled={loading} className="mt-4 w-full">
          {loading ? "Loading battle…" : "Start 15-question battle"}{" "}
          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>

      <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-400/20 dark:bg-blue-950/20 dark:text-blue-100">Live Arena above handles Quick Match, Private Rooms, and Friend Challenges.</p>
    </Panel>
  );
}

function SoonTile({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/[0.07] dark:bg-[#0f1730] p-3.5 opacity-80 dark:opacity-100">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900/[0.04] dark:bg-white/5 text-slate-600 dark:text-slate-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{title}</p>
        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{text}</p>
      </div>
      <span className="shrink-0 rounded-full bg-slate-900/[0.045] dark:bg-slate-800 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
        Soon
      </span>
    </div>
  );
}

function Milestones({ stats }: { stats: QuizStats }) {
  return (
    <Panel>
      <SectionTitle eyebrow="Keep climbing" title="Milestones" />
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {MILESTONES.map((m) => {
          const v = m.value(stats);
          const pct = Math.min(100, (v / m.target) * 100);
          const Icon = m.icon;
          const done = v >= m.target;
          return (
            <div
              key={m.title}
              className="flex min-w-[230px] snap-start items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/[0.07] dark:bg-[#0f1730] p-3.5"
            >
              <Ring value={pct} size={54} stroke={6} from={m.from} to={m.to}>
                {done ? (
                  <Check className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                ) : (
                  <Icon className="h-5 w-5" style={{ color: m.from }} />
                )}
              </Ring>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">{m.title}</p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{m.hint}</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {Math.min(v, m.target)}/{m.target}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function SubjectBars({ progress }: { progress: ProgressOverview | null }) {
  const subjects = progress?.subjects ?? [];
  return (
    <Panel>
      <SectionTitle
        eyebrow="Know your game"
        title="Subject accuracy"
        right={
          <Link to="/progress" className="text-xs font-bold text-amber-800 dark:text-amber-200">
            Details <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" />
          </Link>
        }
      />
      {subjects.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 dark:bg-[#0f1730] p-5 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Complete a test to unlock your subject-wise accuracy here.
        </p>
      ) : (
        <div className="space-y-3.5">
          {subjects.slice(0, 5).map((s) => (
            <div key={s.subject}>
              <div className="flex justify-between text-xs">
                <span className="font-semibold capitalize text-slate-700 dark:text-slate-200">
                  {s.subject}
                </span>
                <span className="font-mono font-bold">{s.accuracy.toFixed(0)}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-900/[0.045] dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-sky-400"
                  style={{ width: `${Math.min(100, Math.max(2, s.accuracy))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function HubLink({
  to,
  icon,
  title,
  text,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white dark:border-white/[0.07] dark:bg-[#111a35] p-4 transition active:scale-[0.98]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">{title}</p>
        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{text}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
    </Link>
  );
}
