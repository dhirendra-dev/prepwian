import { useState } from "react";
import { Flame, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type StreakResult = {
  streak: number;
  best: number;
  new_study_day: boolean;
  new_activity: boolean;
};

export function StudyStreakButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StreakResult | null>(null);

  const recordStudyDay = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        "record_study_activity",
        { _source: "manual" },
      );

      if (error) throw error;

      const streak = data as StreakResult;
      setResult(streak);

      if (streak.new_study_day) {
        toast.success(`🔥 Study day recorded! ${streak.streak}-day streak`);
      } else {
        toast.success(`🔥 You're on a ${streak.streak}-day streak`);
      }
    } catch (error) {
      console.error("Study streak error:", error);
      toast.error("Couldn't record your study day. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const recorded = result?.new_study_day === false;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
          <Flame className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-bold">
            Study Streak
          </h3>

          <p className="text-[11px] text-muted-foreground">
            {result
              ? `${result.streak} day${result.streak === 1 ? "" : "s"} in a row`
              : "Record your study day"}
          </p>
        </div>

        <button
          type="button"
          onClick={recordStudyDay}
          disabled={loading || recorded}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : recorded ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Flame className="h-3.5 w-3.5" />
          )}

          {loading
            ? "Recording..."
            : recorded
              ? "Recorded"
              : "Study Today"}
        </button>
      </div>
    </section>
  );
}