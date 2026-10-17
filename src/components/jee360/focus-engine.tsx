import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/jee360/store";
import { useNow } from "@/lib/jee360/use-now";

function remainingMs(startedAt: number, durationMin: number, now: number) {
  return startedAt + durationMin * 60_000 - now;
}

function formatRemain(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function FocusEngine() {
  const now = useNow(500);
  const active = useAppStore((s) => s.activeFocus);
  const stopFocus = useAppStore((s) => s.stopFocus);

  useEffect(() => {
    if (!active) return;
    if (remainingMs(active.startedAt, active.durationMin, Date.now()) <= 0) {
      stopFocus("completed");
      toast.success("Focus block complete");
    }
  }, [active, now, stopFocus]);

  if (!active || !now) return null;

  const left = remainingMs(active.startedAt, active.durationMin, now.getTime());
  const pct = Math.max(0, Math.min(100, 100 - (left / (active.durationMin * 60_000)) * 100));

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background/95 px-3 py-2 backdrop-blur-sm dark:bg-slate-950/95 md:bottom-0 md:left-56">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <Link to="/jee360/focus" className="truncate text-sm font-medium">
              {active.title}
            </Link>
            <span className="font-mono text-sm tabular-nums">{formatRemain(left)}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => stopFocus("abandoned")}>
          Stop
        </Button>
      </div>
    </div>
  );
}
