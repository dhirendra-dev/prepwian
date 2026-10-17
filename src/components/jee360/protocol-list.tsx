import { Link } from "@tanstack/react-router";
import { nextProtocol } from "@/lib/jee360/intel";
import { useAppStore } from "@/lib/jee360/store";

export function ProtocolList() {
  const lectures = useAppStore((s) => s.lectures);
  const tests = useAppStore((s) => s.tests);
  const backlog = useAppStore((s) => s.backlog);
  const cards = useAppStore((s) => s.cards);
  const mistakes = useAppStore((s) => s.mistakes);
  const steps = nextProtocol({ lectures, tests, backlog, cards, mistakes });

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Next 90</p>
          <h2 className="font-display text-xl">Protocol</h2>
        </div>
        <Link to="/jee360/focus" className="text-xs text-muted-foreground hover:text-foreground">
          Start focus
        </Link>
      </div>
      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">Import a planner to generate a live window.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {steps.map((step, i) => (
            <li key={step.id}>
              <Link
                to={step.href}
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 hover:bg-secondary"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{step.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{step.reason}</span>
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{step.minutes}m</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
