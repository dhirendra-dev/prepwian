import { Logo } from "@/components/Logo";

export function SignInSuccessOverlay({ open, name }: { open: boolean; name?: string }) {
  if (!open) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-sm animate-[fade-in_0.25s_ease-out_both]"
    >
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <div className="relative" aria-hidden="true">
          <span className="absolute inset-0 rounded-full bg-primary/25 animate-ping" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-card shadow-lg ring-2 ring-primary/40 animate-[signinPop_0.6s_cubic-bezier(0.2,0.8,0.2,1)_both] md:h-32 md:w-32 lg:h-40 lg:w-40">
            <Logo className="h-16 w-16 md:h-20 md:w-20 lg:h-28 lg:w-28" />
          </div>
        </div>
        <svg
          viewBox="0 0 52 52"
          className="h-10 w-10 text-primary md:h-12 md:w-12 lg:h-14 lg:w-14"
          role="presentation"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 27 l8 8 l16 -18"
            style={{
              strokeDasharray: 48,
              strokeDashoffset: 48,
              animation: "checkdraw 0.5s ease-out 0.25s forwards",
            }}
          />
        </svg>
        <div>
          <p className="font-display text-xl font-semibold">
            Welcome back{name ? `, ${name}` : ""}!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Preparing your next step…</p>
        </div>
      </div>
      <style>{`
        @keyframes signinPop {
          0% { opacity: 0; transform: scale(0.6); }
          70% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes checkdraw { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}
