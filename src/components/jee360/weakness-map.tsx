import { SUBJECT_SHORT } from "@/lib/jee360/planner";
import { weaknessMap, type WeakRow } from "@/lib/jee360/weakness";
import { useAppStore } from "@/lib/jee360/store";
import { cn } from "@/lib/utils";

export function WeaknessMap({ limit = 6 }: { limit?: number }) {
  const lectures = useAppStore((s) => s.lectures);
  const backlog = useAppStore((s) => s.backlog);
  const cards = useAppStore((s) => s.cards);
  const mistakes = useAppStore((s) => s.mistakes);
  const rows = weaknessMap({ lectures, backlog, cards, mistakes }).slice(0, limit);

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No weak chapters yet — keep sitting papers and the loop.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <WeakRowView key={row.key} row={row} />
      ))}
    </ul>
  );
}

function WeakRowView({ row }: { row: WeakRow }) {
  const pct = (row.heat / 5) * 100;
  return (
    <li className="flex min-w-0 items-center gap-3">
      <span className="w-10 shrink-0 text-xs text-muted-foreground">{SUBJECT_SHORT[row.subject]}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm">{row.chapter}</p>
          <p className="shrink-0 text-[10px] text-muted-foreground">{row.reasons.join(" · ")}</p>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full bg-primary transition-[width] duration-[var(--motion-fast)]")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </li>
  );
}
