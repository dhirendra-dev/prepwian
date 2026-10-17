  import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Flame, MessageSquare, Users, Trophy, CheckCircle2, Calendar, Award } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/verified")({
  component: VerifiedPage,
  head: () => ({
    meta: [
      { property: "og:title", content: "How to get the Blue Tick — JEE Prep Hub" },
      { property: "og:description", content: "Learn how to earn the verified blue tick on JEE Prep Hub by staying active, consistent, and helpful." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "How to get the Blue Tick — JEE Prep Hub" },
      { name: "twitter:description", content: "Learn how to earn the verified blue tick on JEE Prep Hub by staying active, consistent, and helpful." },

      { title: "How to get the Blue Tick — JEE Prep Hub" },
      { name: "description", content: "Learn how to earn the verified blue tick on JEE Prep Hub by staying active, consistent, and helpful." },
    ],
  }),
});

type ProgressField = { value: number; target: number; met: boolean };
type BlueTickProgress = {
  login_streak: ProgressField;
  study_streak: ProgressField;
  community: ProgressField;
  helpfulness: { follows: number; help_signal: number; follow_target: number; help_target: number; met: boolean };
  achievements: { certificates: number; leaderboard_weeks: number; met: boolean };
};

type Step = {
  key: keyof BlueTickProgress;
  icon: typeof Calendar;
  color: string;
  bg: string;
  title: string;
  gapLabel: (p: BlueTickProgress) => string;
  met: (p: BlueTickProgress) => boolean;
  pct: (p: BlueTickProgress) => number;
};

const steps: Step[] = [
  {
    key: "login_streak",
    icon: Calendar,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    title: "Login streak",
    gapLabel: (p) => `${p.login_streak.value}/${p.login_streak.target} days · ${Math.max(0, p.login_streak.target - p.login_streak.value)} to go`,
    met: (p) => p.login_streak.met,
    pct: (p) => Math.min(100, (p.login_streak.value / p.login_streak.target) * 100),
  },
  {
    key: "study_streak",
    icon: Flame,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    title: "Study streak",
    gapLabel: (p) => `${p.study_streak.value}/${p.study_streak.target} days · ${Math.max(0, p.study_streak.target - p.study_streak.value)} to go`,
    met: (p) => p.study_streak.met,
    pct: (p) => Math.min(100, (p.study_streak.value / p.study_streak.target) * 100),
  },
  {
    key: "community",
    icon: MessageSquare,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    title: "Community activity",
    gapLabel: (p) => `${p.community.value}/${p.community.target} posts in 30 days · ${Math.max(0, p.community.target - p.community.value)} to go`,
    met: (p) => p.community.met,
    pct: (p) => Math.min(100, (p.community.value / p.community.target) * 100),
  },
  {
    key: "helpfulness",
    icon: Users,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    title: "Helping others",
    gapLabel: (p) =>
      `${p.helpfulness.follows}/${p.helpfulness.follow_target} follows · ${p.helpfulness.help_signal}/${p.helpfulness.help_target} helped`,
    met: (p) => p.helpfulness.met,
    pct: (p) =>
      Math.min(
        100,
        (Math.min(1, p.helpfulness.follows / p.helpfulness.follow_target) +
          Math.min(1, p.helpfulness.help_signal / p.helpfulness.help_target)) *
          50,
      ),
  },
  {
    key: "achievements",
    icon: Trophy,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    title: "Certificates & leaderboard",
    gapLabel: (p) => `${p.achievements.certificates} certificates · ${p.achievements.leaderboard_weeks} weeks ranked`,
    met: (p) => p.achievements.met,
    pct: (p) => (p.achievements.met ? 100 : Math.min(90, (p.achievements.certificates + p.achievements.leaderboard_weeks) * 20)),
  },
];

function VerifiedPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<BlueTickProgress | null>(null);
  const [loading, setLoading] = useState(!!user);

  useEffect(() => {
    if (!user) {
      setProgress(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (supabase.rpc as any)("get_my_blue_tick_progress").then(({ data }: { data: BlueTickProgress | null }) => {
      if (cancelled) return;
      setProgress(data ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const metCount = progress ? steps.filter((s) => s.met(progress)).length : 0;
  const allMet = progress ? metCount === steps.length : false;
  const unmetSorted = progress
    ? steps.filter((s) => !s.met(progress)).sort((a, b) => b.pct(progress) - a.pct(progress))
    : [];
  const featured = unmetSorted[0];
  const rest = steps.filter((s) => s.key !== featured?.key);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/30">
            <BadgeCheck className="h-9 w-9 fill-white text-sky-600" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Get the Blue Tick</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Tracked live, automatically — no application, no manual review.
          </p>

          {user && (
            <div className="max-w-xs mx-auto space-y-1.5 pt-1">
              <p className="text-sm font-medium">
                {loading ? "Loading your progress…" : allMet ? "All 5 criteria met" : `${metCount} of ${steps.length} criteria met`}
              </p>
              <Progress value={progress ? (metCount / steps.length) * 100 : 0} className="h-1.5" />
            </div>
          )}
        </header>

        {user && featured && progress && (
          <div className="rounded-xl border-2 border-sky-500/40 bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-sky-600 bg-sky-500/10 px-2.5 py-0.5 rounded-full">Closest to done</span>
              <featured.icon className={`h-4 w-4 ${featured.color}`} />
            </div>
            <h3 className="font-semibold">{featured.title}</h3>
            <p className="text-sm text-muted-foreground">{featured.gapLabel(progress)}</p>
            <Progress value={featured.pct(progress)} className="h-1.5" />
          </div>
        )}

        <div className="grid gap-2">
          {rest.map((s) => {
            const isMet = progress ? s.met(progress) : false;
            return (
              <div
                key={s.key}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isMet ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"
                }`}
              >
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${s.bg} ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.title}</p>
                  {user && !isMet && progress && (
                    <>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.gapLabel(progress)}</p>
                      <Progress value={s.pct(progress)} className="h-1 mt-1.5" />
                    </>
                  )}
                </div>
                {isMet ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">{progress ? `${Math.round(s.pct(progress))}%` : ""}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-blue-500/10 p-4">
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Every night we check every member against all five criteria — the moment you cross all of them, the blue tick appears next to your name across chat, feed, forum and your profile. Good luck! 🚀
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
