import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export function showXpRewardToast(amount: number, activity = "Activity complete") {
  if (!Number.isFinite(amount) || amount <= 0) return;

  toast.custom(
    (id) => (
      <div
        role="status"
        aria-live="polite"
        className="animate-in slide-in-from-bottom-5 zoom-in-95 fade-in duration-500 rounded-2xl border border-amber-300/70 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 px-4 py-3 text-amber-950 shadow-[0_14px_40px_rgba(245,158,11,0.28)] ring-1 ring-white/70 dark:border-amber-400/30 dark:from-amber-950/95 dark:via-yellow-950/95 dark:to-orange-950/95 dark:text-amber-50"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-400 text-amber-950 shadow-sm animate-pulse">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold">+{amount} XP earned</p>
            <p className="max-w-[18rem] truncate text-xs font-medium opacity-75">{activity}</p>
          </div>
          <button
            type="button"
            aria-label="Dismiss XP notification"
            onClick={() => toast.dismiss(id)}
            className="ml-1 rounded-full px-1.5 text-lg leading-none opacity-50 transition-opacity hover:opacity-100"
          >
            ×
          </button>
        </div>
      </div>
    ),
    { duration: 3200, position: "bottom-right" },
  );
}
