import { cn } from "@/lib/utils";

/**
 * Community Live logo mark — a custom SVG "chat spark" glyph with a pulsing
 * halo and a slow orbital ring. Pure CSS/SVG so it costs nothing to animate.
 */
export function CommunityLogo({
  size = 44,
  live = true,
  className,
}: {
  size?: number;
  live?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "community-logo relative inline-flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {live && (
        <span className="absolute inset-0 rounded-full bg-primary/25 motion-safe:animate-ping" />
      )}
      <span className="absolute inset-0 rounded-full bg-primary/10" />

      {/* Orbital ring */}
      <svg
        viewBox="0 0 48 48"
        className="absolute inset-0 h-full w-full motion-safe:animate-[spin_9s_linear_infinite] text-primary/50"
      >
        <circle
          cx="24"
          cy="24"
          r="21"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="26 90"
        />
        <circle cx="45" cy="24" r="2.2" fill="currentColor" />
      </svg>

      {/* Core mark */}
      <svg viewBox="0 0 48 48" className="relative h-[62%] w-[62%]">
        <defs>
          <linearGradient id="jphCommunityMark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary-h, 250) 90% 62%)" />
            <stop offset="100%" stopColor="currentColor" />
          </linearGradient>
        </defs>
        <path
          d="M8 18a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v10a8 8 0 0 1-8 8H22l-9 7v-7.6A8 8 0 0 1 8 28z"
          className="fill-primary"
        />
        <path
          d="M24 15.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z"
          className="fill-primary-foreground"
        />
      </svg>
    </span>
  );
}
