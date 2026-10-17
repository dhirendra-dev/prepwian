import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { Play, Pause, RotateCcw, Save, Timer as TimerIcon, ArrowUpRight } from "lucide-react";

const PRESETS = [15, 25, 50];

export function MiniFocusTimer() {
  const timer = useFocusTimer();
  const [savePulse, setSavePulse] = useState(false);
  async function handleSaveAll() {
    setSavePulse(true);
    setTimeout(() => setSavePulse(false), 700);
    await timer.saveSession().catch(() => {});
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <TimerIcon className="h-4 w-4 text-accent" /> Focus Timer
        </h2>
        <Link to="/timer" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
          Full timer <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="my-5 text-center">
        <div className="font-display text-5xl font-bold tabular-nums">{timer.display}</div>
        {timer.mode === "pomodoro" && (
          <div className="mx-auto mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${timer.progress}%` }} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => timer.setPomoMinutes(m)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
              timer.pomoMinutes === m ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted dark:hover:bg-slate-800"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-center">
        <select
          value={timer.subject}
          onChange={(e) => timer.setSubject(e.target.value as "physics" | "chemistry" | "mathematics")}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="physics">Physics</option>
          <option value="chemistry">Chemistry</option>
          <option value="mathematics">Math</option>
        </select>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {!timer.running ? (
          <button onClick={timer.start} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Play className="h-4 w-4" /> Start
          </button>
        ) : (
          <button onClick={timer.pause} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold hover:opacity-90">
            <Pause className="h-4 w-4" /> Pause
          </button>
        )}
        <button onClick={timer.reset} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted dark:hover:bg-slate-800">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
        <button
          onClick={handleSaveAll}
          className={`inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-2 text-sm font-semibold text-success-foreground hover:opacity-90 active:scale-95 transition-transform ${savePulse ? "animate-save-pulse" : ""}`}
        >
          <Save className="h-4 w-4" /> Save all
        </button>
      </div>
    </section>
  );
}
