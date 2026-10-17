import { usePresence } from "@/contexts/PresenceContext";
import { cn } from "@/lib/utils";

type Props = {
  userId: string | null | undefined;
  className?: string;
  showLabel?: boolean;
};

/** Small green/grey dot indicator. Position it on an avatar with `absolute` classes via className. */
export function OnlineDot({ userId, className, showLabel = false }: Props) {
  const { isOnline } = usePresence();
  const online = isOnline(userId);
  if (showLabel) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground", className)}>
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full ring-2 ring-background",
            online ? "bg-emerald-500" : "bg-muted-foreground/40",
          )}
        />
        {online ? "Online" : "Offline"}
      </span>
    );
  }
  return (
    <span
      aria-label={online ? "Online" : "Offline"}
      title={online ? "Online" : "Offline"}
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full ring-2 ring-background",
        online ? "bg-emerald-500" : "bg-muted-foreground/40",
        className,
      )}
    />
  );
}
