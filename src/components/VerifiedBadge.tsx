import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Blue verified checkmark. Separate from the admin badge.
 * Show whenever `profiles.verified === true`.
 *
 * Implemented as a solid circle + inline check icon so it renders
 * identically across devices without subpixel/fill artifacts.
 */
export function VerifiedBadge({ className, title = "Verified" }: { className?: string; title?: string }) {
  return (
    <span
      title={title}
      aria-label="Verified"
      role="img"
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-500 align-middle text-white",
        className,
      )}
    >
      <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden="true" />
    </span>
  );
}
