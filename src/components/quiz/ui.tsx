import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Renders under <body> so `fixed` always means "the phone screen". */
export function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-4 text-slate-900 shadow-[0_8px_26px_rgba(30,64,120,0.08)] sm:p-5 dark:border-white/[0.08] dark:from-[#121d32] dark:to-[#0f1728] dark:text-white dark:shadow-[0_12px_35px_rgba(0,0,0,0.12)] ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-200/90">
          {eyebrow}
        </p>
        <h2 className="mt-0.5 truncate text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

/** Circular progress ring with a gradient stroke. */
export function Ring({
  value,
  size = 64,
  stroke = 7,
  from = "#38bdf8",
  to = "#8b5cf6",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  from?: string;
  to?: string;
  children?: ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-200 dark:text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/** Bottom sheet on phones, centred dialog on larger screens. Solid colours, no blur. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <Portal>
      <div
        className="quiz-theme fixed inset-0 z-[2147483001] flex items-end justify-center bg-slate-950/40 dark:bg-black/70 sm:items-center"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-slate-900 shadow-2xl sm:rounded-3xl dark:border-white/10 dark:bg-[#111a2d] dark:text-white"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-extrabold">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1.5 text-slate-600 active:bg-slate-100 dark:text-slate-300 dark:active:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </Portal>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "",
  tone = "blue",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  tone?: "blue" | "white" | "ghost" | "danger" | "green";
}) {
  const tones = {
    blue: "bg-gradient-to-r from-amber-300 via-yellow-400 to-sky-400 text-[#111827] shadow-lg shadow-black/20",
    white: "border border-slate-200 bg-white text-indigo-900 shadow-md dark:border-transparent",
    ghost: "bg-slate-900/[0.045] text-slate-800 dark:bg-slate-700 dark:text-white",
    danger: "bg-rose-500 text-white",
    green: "bg-gradient-to-r from-emerald-400 to-teal-400 text-[#06221b]",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold transition active:scale-[0.97] disabled:opacity-50 ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}
