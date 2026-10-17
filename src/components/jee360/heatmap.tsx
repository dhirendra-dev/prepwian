import { formatShortDate } from "@/lib/jee360/dates";
import type { HeatCell } from "@/lib/jee360/intel";
import { cn } from "@/lib/utils";

export function Heatmap({ cells }: { cells: HeatCell[] }) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => (
          <div
            key={cell.date}
            title={`${cell.date} · ${cell.value}`}
            className={cn(
              "aspect-square rounded-sm border border-border",
              cell.value === 0 && "bg-secondary/40",
              cell.value === 1 && "bg-primary/25",
              cell.value === 2 && "bg-primary/45",
              cell.value === 3 && "bg-primary/70",
              cell.value >= 4 && "bg-primary",
            )}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{cells[0] ? formatShortDate(cells[0].date) : ""}</span>
        <span>Activity · 28 days</span>
        <span>{cells.at(-1) ? formatShortDate(cells.at(-1)!.date) : ""}</span>
      </div>
    </div>
  );
}
