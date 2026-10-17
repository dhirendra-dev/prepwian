import { Crown } from "lucide-react";
import { useProStatus } from "@/hooks/use-pro";
import { cn } from "@/lib/utils";

export function ProBadge({ userId, className, showLabel = true }: { userId: string | undefined; className?: string; showLabel?: boolean }) {
  const { isPro } = useProStatus(userId);
  if (!isPro) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm",
        className,
      )}
      title="Pro member"
    >
      <Crown className="h-3 w-3" />
      {showLabel && "Pro"}
    </span>
  );
}
