import { Link } from "@tanstack/react-router";
import { Crown, Sparkles, ArrowRight, Zap } from "lucide-react";
import { useProStatus } from "@/hooks/use-pro";

export function ProStatusCard({ userId }: { userId: string | undefined }) {
  const { isPro, sub, loading } = useProStatus(userId);
  if (loading) return null;

  if (isPro && sub) {
    return (
      <div className="relative rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#1a1408] via-[#0f0a04] to-[#1a1408] p-4 text-amber-50 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.35)] sm:p-5">

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full pro-gradient-bg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black shadow">
              <Crown className="h-3 w-3" strokeWidth={2.8} /> Pro Member
            </div>
            <h3 className="mt-2 font-display text-xl font-bold pro-gradient-text sm:text-2xl">
              Weekly Champion
            </h3>
            <p className="mt-0.5 text-xs text-amber-100/70 sm:text-sm">
              Pro is yours while you hold the current weekly #1 rank
            </p>
          </div>
          <Sparkles className="h-6 w-6 shrink-0 text-amber-300 pro-glow-anim rounded-full" />
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-2 text-[11px] text-amber-100/80">
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5">✨ Ad-free</span>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5">⚡ Priority support</span>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5">🎯 Elite problems</span>
        </div>
        <Link
          to="/leaderboard"
          className="relative mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200"
        >
          View weekly standings <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  // Upsell card for non-Pro users
  return (
    <Link
      to="/leaderboard"
      className="group relative block rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-yellow-400/5 to-transparent p-4 shadow-soft transition hover:border-amber-500/60 hover:shadow-[0_10px_30px_-10px_rgba(245,158,11,0.35)] sm:p-5"
    >

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full pro-gradient-bg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black shadow">
            <Crown className="h-3 w-3" strokeWidth={2.8} /> Weekly challenge
          </div>
          <h3 className="mt-2 font-display text-lg font-bold sm:text-xl">
            Earn <span className="pro-gradient-text">PREPWIAN Pro</span>
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Finish #1 on this week's study leaderboard. Every saved Pomodoro, stopwatch, and manual study log counts.
          </p>
        </div>
        <Zap className="h-6 w-6 shrink-0 text-amber-500 transition group-hover:scale-110" />
      </div>
      <div className="relative mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
        View leaderboard <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
