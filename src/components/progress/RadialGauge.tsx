import type { ReactNode } from "react";

/**
 * Circular progress dial used for the rating tracker and badge counters.
 * Stroke colour comes from the caller via `stroke` (a semantic token class on
 * the SVG, e.g. `text-primary`).
 */
export function RadialGauge({
  value,
  size = 168,
  thickness = 10,
  label,
  children,
  className = "text-primary",
}: {
  value: number; // 0..1
  size?: number;
  thickness?: number;
  label?: string;
  children?: ReactNode;
  className?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={className} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          className="stroke-muted"
          opacity={0.6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.9,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          {children}
          {label && (
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
