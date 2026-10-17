import { Link } from "@tanstack/react-router";
import { ArrowLeft, Home, LockKeyhole, ShieldCheck } from "lucide-react";

export function DeveloperAccessInfoPanel() {
  return (
    <div className="text-center lg:pt-4">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-cyan-300">
        <LockKeyhole className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-sky-600 dark:text-cyan-300">
        Restricted area
      </p>
      <h1 className="mt-2 font-display text-2xl font-black tracking-tight sm:text-3xl">
        Developer Access Restricted
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
        This page is reserved for authorised administrators. It is intended for development and
        maintenance of JEE Prep Hub, not general account use.
      </p>

      <div className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-2xl border border-border bg-muted/35 p-3 text-left">
        <ShieldCheck
          className="h-5 w-5 shrink-0 text-sky-600 dark:text-cyan-300"
          aria-hidden="true"
        />
        <p className="text-xs leading-5 text-muted-foreground">
          If you believe you should have access, contact an authorised administrator.
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          to="/home"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:-translate-y-0.5 hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Return to Home
        </Link>
        <Link
          to="/dashboard"
          className="flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Go to dashboard instead
        </Link>
      </div>
    </div>
  );
}
