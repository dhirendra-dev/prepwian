import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

type NotificationStyle = "reference" | "compact" | "classic";
const STORAGE_KEY = "jph-notification-style";
const STYLE_EVENT = "jph-notification-style-change";

function getSavedStyle(): NotificationStyle {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "classic" || saved === "compact" ? saved : "reference";
  } catch {
    return "reference";
  }
}

/**
 * Add <NotificationStyleSetting /> to the existing Settings page.
 * It persists the user's style choice in this browser and updates the bell instantly.
 */
export function NotificationStyleSetting() {
  const [style, setStyle] = useState<NotificationStyle>("reference");

  useEffect(() => setStyle(getSavedStyle()), []);

  function choose(next: NotificationStyle) {
    setStyle(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event(STYLE_EVENT));
      toast.success(`Notification style set to ${next === "reference" ? "Modern" : "Classic"}`);
    } catch {
      toast.error("Couldn't save this preference in your browser.");
    }
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Palette className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">Notification appearance</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose how the notification popup looks. You can switch styles any time.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => choose("reference")}
          aria-pressed={style === "reference"}
          className={`rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${style === "reference" ? "border-primary bg-primary/[0.06] ring-1 ring-primary/30" : "border-border hover:bg-accent/60"}`}
        >
          <div className="mb-3 rounded-xl border border-blue-100 bg-slate-50 p-2 dark:border-white/10 dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Palette className="h-4 w-4" />
              </span>
              <span className="h-2.5 w-24 rounded-full bg-slate-300 dark:bg-zinc-700" />
            </div>
            <div className="mt-3 flex gap-1.5">
              {["w-8", "w-12", "w-14", "w-10"].map((w) => (
                <span key={w} className={`h-4 ${w} rounded-full bg-blue-100 dark:bg-blue-500/20`} />
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {[0, 1, 2].map((n) => (
                <div
                  key={n}
                  className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-zinc-800"
                >
                  <span className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-500/20" />
                  <span className="h-2 w-3/4 rounded-full bg-slate-300 dark:bg-zinc-700" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Modern (recommended)</span>
            {style === "reference" && <Check className="h-4 w-4 text-primary" />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Large, airy layout matching the new design.
          </p>
        </button>

        <button
          type="button"
          onClick={() => choose("compact")}
          aria-pressed={style === "compact"}
          className={`rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${style === "compact" ? "border-primary bg-primary/[0.06] ring-1 ring-primary/30" : "border-border hover:bg-accent/60"}`}
        >
          <div className="mb-3 rounded-xl border border-sky-100 bg-sky-50 p-2 dark:border-white/10 dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Palette className="h-4 w-4" />
              </span>
              <span className="h-2.5 w-24 rounded-full bg-slate-300 dark:bg-zinc-700" />
            </div>
            <div className="mt-3 flex gap-1.5">
              <span className="h-4 w-10 rounded-full bg-blue-600" />
              <span className="h-4 w-14 rounded-full bg-slate-200 dark:bg-zinc-700" />
            </div>
            <div className="mt-3 space-y-1.5">
              {[0, 1, 2].map((n) => (
                <div
                  key={n}
                  className="flex items-center gap-2 border-b border-sky-100 pb-1.5 dark:border-zinc-800"
                >
                  <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-zinc-700" />
                  <span className="h-2 w-3/4 rounded-full bg-slate-300 dark:bg-zinc-700" />
                </div>
              ))}
            </div>
            <div className="mt-2 h-7 rounded-xl border border-blue-100 bg-blue-100/70 dark:border-white/10 dark:bg-blue-500/10" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Compact (earlier design)</span>
            {style === "compact" && <Check className="h-4 w-4 text-primary" />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Keeps the smaller popup and footer layout.
          </p>
        </button>

        <button
          type="button"
          onClick={() => choose("classic")}
          aria-pressed={style === "classic"}
          className={`rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${style === "classic" ? "border-primary bg-primary/[0.06] ring-1 ring-primary/30" : "border-border hover:bg-accent/60"}`}
        >
          <div className="mb-3 rounded-xl border border-border bg-background p-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Palette className="h-4 w-4" />
              </span>
              <span className="h-2.5 w-24 rounded-full bg-muted-foreground/35" />
            </div>
            <div className="mt-3 flex gap-1.5">
              <span className="h-4 w-10 rounded-full bg-primary" />
              <span className="h-4 w-12 rounded-full bg-muted" />
            </div>
            <div className="mt-3 space-y-2">
              {[0, 1, 2].map((n) => (
                <div key={n} className="flex items-center gap-2 border-b border-border pb-2">
                  <span className="h-7 w-7 rounded-lg bg-muted" />
                  <span className="h-2 w-3/4 rounded-full bg-muted-foreground/35" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Classic</span>
            {style === "classic" && <Check className="h-4 w-4 text-primary" />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Compact version of the earlier popup.
          </p>
        </button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        This preference is saved in this browser. It does not change your account data.
      </p>
    </section>
  );
}
