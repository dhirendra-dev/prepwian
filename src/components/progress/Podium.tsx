import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Medal } from "lucide-react";

export type PodiumEntry = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  value: string;
  valueLabel: string;
};

const ORDER = [1, 0, 2]; // 2nd, 1st, 3rd

/** Top-3 podium block shared by every leaderboard surface. */
export function Podium({ entries }: { entries: PodiumEntry[] }) {
  if (entries.length === 0) return null;
  const heights = ["h-24", "h-16", "h-12"];
  const ringTone = [
    "ring-warning/70 shadow-[0_0_36px_-6px_var(--warning)]",
    "ring-muted-foreground/40",
    "ring-accent/50",
  ];
  const barTone = [
    "bg-gradient-to-t from-warning/40 to-warning/80 text-warning-foreground",
    "bg-gradient-to-t from-muted to-muted-foreground/40 text-foreground",
    "bg-gradient-to-t from-accent/25 to-accent/60 text-accent-foreground",
  ];
  const place = ["1st", "2nd", "3rd"];

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6">
      {ORDER.map((i) => {
        const e = entries[i];
        if (!e) return <div key={i} className="w-[30%] max-w-28" />;
        return (
          <div key={e.userId} className="flex w-[30%] max-w-32 flex-col items-center">
            {i === 0 && <Crown className="mb-1 h-6 w-6 text-warning" />}
            <div className="relative">
              <Avatar className={`h-14 w-14 ring-2 ring-offset-2 ring-offset-background sm:h-16 sm:w-16 ${ringTone[i]}`}>
                {e.avatarUrl ? <AvatarImage src={e.avatarUrl} alt="" /> : null}
                <AvatarFallback className="bg-primary/15 font-display text-sm font-bold text-primary">
                  {(e.name || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full ring-2 ring-background ${
                  i === 0 ? "bg-warning text-warning-foreground" : i === 1 ? "bg-muted text-foreground" : "bg-accent text-accent-foreground"
                }`}
              >
                {i === 0 ? <Crown className="h-3.5 w-3.5" /> : <Medal className="h-3.5 w-3.5" />}
              </span>
            </div>
            <Link
              to="/u/$userId"
              params={{ userId: e.userId }}
              className="mt-2 max-w-full truncate text-sm font-semibold hover:underline"
            >
              {e.name}
            </Link>
            <div className={`font-display text-lg font-bold tabular-nums ${i === 0 ? "text-warning" : ""}`}>{e.value}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{e.valueLabel}</div>
            <div className={`mt-2 grid w-full place-items-start justify-center rounded-t-xl pt-1.5 font-display text-sm font-bold ${heights[i]} ${barTone[i]}`}>
              {place[i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
