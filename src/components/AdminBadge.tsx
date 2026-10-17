import { BadgeCheck, ShieldCheck, Flame, MessageSquare, Users, Trophy, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { isBadgeHidden } from "@/lib/hidden-badges";

/**
 * Blue verified tick — clickable, opens a popover explaining how to earn it.
 * Sized bigger than a regular badge icon so it's visible next to names.
 */
export function VerifiedTick({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "lg" ? "h-8 w-8" : size === "sm" ? "h-5 w-5" : "h-7 w-7";


  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label="Verified — tap to learn how to earn"
          className={`inline-flex items-center justify-center align-middle rounded-full hover:scale-110 active:scale-95 transition-transform ${className}`}
        >
          <BadgeCheck
            className={`${sizeClass} fill-sky-500 text-white drop-shadow-[0_0_4px_rgba(14,165,233,0.5)]`}
            strokeWidth={2.5}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-4 text-white">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-7 w-7 fill-white text-sky-500" strokeWidth={2.5} />
            <div>
              <h3 className="font-bold text-base leading-tight">Verified Member</h3>
              <p className="text-xs text-sky-50/90">PREPWIAN blue tick</p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            The blue tick recognises active, trusted members of our community. Here's how to earn yours:
          </p>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
              <span><b>Login daily</b> for at least 14 days in a row</span>
            </li>
            <li className="flex items-start gap-2">
              <Flame className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <span>Maintain a <b>7+ day study streak</b> on the daily checklist</span>
            </li>
            <li className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span><b>Participate</b> in community chat, feed & study squads</span>
            </li>
            <li className="flex items-start gap-2">
              <Users className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
              <span><b>Follow</b> other members and help juniors with doubts</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <span>Earn <b>certificates</b> and climb the leaderboard</span>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground border-t pt-2">
            Admins review active members weekly. Stay consistent — your tick is on the way! 🚀
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const DEVELOPER_ACCOUNT_ID = "38283c48-2244-464e-9357-670ec3630384";

export function AdminBadge({ userId }: { userId?: string | null } = {}) {
  // Visual-only suppression for specific accounts (permissions unaffected).
  if (isBadgeHidden(userId)) return null;
  const label = userId === DEVELOPER_ACCOUNT_ID ? "Developer" : "Admin";
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <VerifiedTick size="md" />
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
        <ShieldCheck className="h-2.5 w-2.5" /> {label}
      </span>
    </span>
  );
}