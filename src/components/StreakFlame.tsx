import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";

interface Props {
  count: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

/**
 * Duolingo-style streak badge.
 *  - Vibrant filled flame in orange/red gradient when active
 *  - Bold number prominently displayed
 *  - Gray "extinguished" state when count is 0
 *  - Pop + sparks on first mount and every increase
 */
export function StreakFlame({ count, size = "sm", label = "day streak" }: Props) {
  const prev = useRef<number | null>(null);
  const [popKey, setPopKey] = useState(0);
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const increased = prev.current === null ? count >= 1 : count > prev.current;
    if (increased) {
      setPopKey((k) => k + 1);
      const id = Date.now();
      setSparks(
        Array.from({ length: 8 }).map((_, i) => ({
          id: id + i,
          x: (Math.random() - 0.5) * 48,
          y: -12 - Math.random() * 28,
        })),
      );
      const t = setTimeout(() => setSparks([]), 900);
      prev.current = count;
      return () => clearTimeout(t);
    }
    prev.current = count;
  }, [count]);

  const active = count >= 1;

  const sizing = {
    sm: {
      wrap: "px-2.5 py-1 gap-1.5",
      icon: "h-5 w-5",
      num: "text-base font-extrabold",
      lbl: "text-[10px] uppercase tracking-wide font-semibold",
    },
    md: {
      wrap: "px-3.5 py-1.5 gap-2",
      icon: "h-6 w-6",
      num: "text-xl font-extrabold",
      lbl: "text-[11px] uppercase tracking-wide font-semibold",
    },
    lg: {
      wrap: "px-4 py-2 gap-2.5",
      icon: "h-8 w-8",
      num: "text-3xl font-extrabold",
      lbl: "text-xs uppercase tracking-wide font-semibold",
    },
  }[size];

  return (
    <div
      className={`relative inline-flex shrink-0 items-center rounded-full ring-1 transition-colors ${sizing.wrap} ${
        active
          ? "bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-rose-500/15 ring-orange-400/40 animate-streak-glow"
          : "bg-muted ring-border"
      }`}
    >
      {/* Flame icon — Duolingo-style filled orange */}
      <span className="relative inline-flex">
        <Flame
          className={`${sizing.icon} ${
            active
              ? "fill-orange-500 text-orange-600 drop-shadow-[0_0_6px_rgba(249,115,22,0.55)] animate-flame-flicker"
              : "fill-muted-foreground/30 text-muted-foreground"
          }`}
          strokeWidth={2}
        />
        {sparks.map((s) => (
          <span
            key={s.id}
            className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400 animate-streak-spark"
            style={{ ["--x" as never]: `${s.x}px`, ["--y" as never]: `${s.y}px` }}
          />
        ))}
      </span>

      {/* Number + label */}
      <span className="flex items-baseline gap-1.5 leading-none">
        <span
          key={popKey}
          className={`${sizing.num} tabular-nums leading-none ${
            active ? "text-orange-600" : "text-muted-foreground"
          } ${popKey > 0 ? "animate-streak-pop" : ""}`}
        >
          {count}
        </span>
        {label && (
          <span
            className={`${sizing.lbl} ${
              active ? "text-orange-600/80" : "text-muted-foreground"
            } hidden sm:inline`}
          >
            {label}
          </span>
        )}
      </span>
    </div>
  );
}
