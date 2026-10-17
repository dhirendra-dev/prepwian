import { cn } from "@/lib/utils";

export function OrbitRing({
  value,
  size = 148,
  label,
  caption,
  className,
}: {
  value: number;
  size?: number;
  label: string;
  caption?: string;
  className?: string;
}) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * c;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 128 128" className="size-full" aria-hidden="true">
        <circle cx="64" cy="64" r={r} fill="none" className="stroke-border" strokeWidth="6" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          className="stroke-primary transition-[stroke-dasharray] duration-[var(--motion-emphasis)] ease-[var(--ease-smooth-out)]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 64 64)"
        />
        <circle
          cx="64"
          cy="64"
          r="62"
          fill="none"
          className="brand-ring stroke-primary/40"
          strokeWidth="0.8"
          strokeDasharray="8 10"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-3xl tabular-nums leading-none tracking-tight">{Math.round(clamped)}</p>
        <p className="mt-1 text-[10px] tracking-widest text-muted-foreground uppercase">{label}</p>
        {caption ? <p className="text-[10px] text-muted-foreground">{caption}</p> : null}
      </div>
    </div>
  );
}
