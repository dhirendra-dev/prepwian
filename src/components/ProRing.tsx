import type { ReactNode } from "react";
import { Crown } from "lucide-react";
import { useProStatus } from "@/hooks/use-pro";
import { cn } from "@/lib/utils";

/**
 * Wraps an avatar with a rotating gold ring + crown when the user is Pro.
 * Use for any avatar surface (header, profile, leaderboard, chat).
 */
export function ProRing({
  userId,
  children,
  size = "md",
  showCrown = true,
  className,
}: {
  userId: string | undefined;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCrown?: boolean;
  className?: string;
}) {
  const { isPro } = useProStatus(userId);
  if (!isPro) return <>{children}</>;

  const pad = { sm: "p-[2px]", md: "p-[2.5px]", lg: "p-[3px]", xl: "p-[3.5px]" }[size];
  const crownSize = { sm: "h-3 w-3", md: "h-3.5 w-3.5", lg: "h-4 w-4", xl: "h-5 w-5" }[size];
  const crownBox = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6", xl: "h-7 w-7" }[size];

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "relative rounded-full pro-gradient-bg",
          pad,
        )}
      >
        <div className="rounded-full bg-background p-[1.5px]">{children}</div>
      </div>
      {showCrown && (
        <span
          aria-label="Pro member"
          title="Pro member"
          className={cn(
            "absolute -top-1 -right-1 grid place-items-center rounded-full bg-amber-500 text-white shadow ring-2 ring-background",
            crownBox,
          )}
        >
          <Crown className={cn("text-white", crownSize)} strokeWidth={2.5} />
        </span>
      )}
    </div>
  );
}
