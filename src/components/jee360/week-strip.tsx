import { formatShortDate, formatWeekday, isToday } from "@/lib/jee360/dates";
import { cn } from "@/lib/utils";

export function WeekStrip({
  dates,
  selected,
  counts,
  onSelect,
}: {
  dates: string[];
  selected: string;
  counts: Record<string, number>;
  onSelect: (date: string) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {dates.map((date) => {
        const active = date === selected;
        const today = isToday(date);
        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelect(date)}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center rounded-lg border px-1 py-2 text-center transition-[background-color,border-color,color,transform] duration-[var(--motion-quick)] ease-[var(--ease-smooth-out)] active:scale-[0.96]",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-secondary",
            )}
          >
            <span className="text-xs tracking-wide uppercase opacity-70">{formatWeekday(date)}</span>
            <span className="font-display text-lg leading-none tabular-nums">
              {formatShortDate(date).split(" ")[0]}
            </span>
            <span className={cn("mt-1 text-xs", active ? "opacity-80" : "text-muted-foreground")}>
              {counts[date] ? `${counts[date]}` : today ? "·" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
