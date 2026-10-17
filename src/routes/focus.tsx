import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Ban,
  CheckCircle2,
  ChevronRight,
  Flame,
  LayoutDashboard,
  Lock,
  LockOpen,
  Menu,
  MoreHorizontal,
  Plus,
  Repeat,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { fmtClock, liveElapsed, pauseTimer, startTodo, useFocusZone } from "@/lib/focus-zone";

export const Route = createFileRoute("/focus")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Focus Zone — Deep work suite for JEE aspirants" },
      { name: "twitter:description", content: "Timer, todos, habits, groups, friends, stats and distraction blocking." },
      { title: "Focus Zone — Deep work suite for JEE aspirants" },
      {
        name: "description",
        content: "A private, offline-first study workspace for focused JEE preparation.",
      },
      { property: "og:title", content: "Focus Zone — Deep work suite for JEE aspirants" },
      {
        property: "og:description",
        content: "Timer, todos, habits, groups, friends, stats and distraction blocking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FocusLayout,
});

const NAV = [
  { to: "/focus", label: "Today", icon: LayoutDashboard, exact: true },
  { to: "/focus/create", label: "Create", icon: Plus, exact: false },
  { to: "/focus/todos", label: "Todos", icon: CheckCircle2, exact: false },
  { to: "/focus/habits", label: "Habits", icon: Repeat, exact: false },
  { to: "/focus/groups", label: "Groups", icon: Users, exact: false },
  { to: "/focus/friends", label: "Friends", icon: User, exact: false },
  { to: "/focus/stats", label: "Stats", icon: BarChart3, exact: false },
  { to: "/focus/block", label: "Block", icon: Ban, exact: false },
] as const;

const MOBILE_NAV = NAV.filter((item) => ["Today", "Todos", "Habits", "Stats"].includes(item.label));

function isActivePath(pathname: string, to: string, exact?: boolean) {
  return exact ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);
}

function FocusLayout() {
  const { state, update } = useFocusZone();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [, setTick] = useState(0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV.find((item) => isActivePath(pathname, item.to, item.exact)) ?? NAV[0];
  const timer = state?.timer;
  const activeTodo = state?.todos.find((todo) => todo.id === timer?.todoId) ?? null;
  const elapsed = timer ? liveElapsed(timer) : 0;

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => setMoreOpen(false), [pathname]);
  useEffect(() => {
    const interval = setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTimer = () => {
    if (!activeTodo) return;
    if (timer?.running) pauseTimer();
    else startTodo(activeTodo.id);
  };

  return (
    <div
      data-lg-root
      className="min-h-[100dvh] w-full bg-aurora-shift text-foreground dark:bg-slate-950 md:min-h-[calc(100dvh-var(--site-global-header-height))] lg:flex"
    >
      {menuOpen || moreOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => {
            setMenuOpen(false);
            setMoreOpen(false);
          }}
          className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[min(19rem,86vw)] p-3 transition-transform duration-200 md:top-[var(--site-global-header-height)] md:bottom-0 lg:static lg:block lg:w-72 lg:translate-x-0 lg:p-4 lg:pr-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <GlassSurface className="flex h-full min-h-0 flex-col p-3 dark:border-slate-800/80 dark:bg-slate-900/90">
          <div className="flex items-center justify-between gap-3 px-2 py-1">
            <Link
              to="/focus"
              className="flex min-w-0 items-center gap-2.5"
              onClick={() => setMenuOpen(false)}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <span className="h-3 w-3 rounded-full bg-primary shadow-glow" />
              </span>
              <span className="truncate font-display text-lg font-bold tracking-tight">
                Focus Zone
              </span>
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-muted lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="px-2 pt-1 text-xs text-muted-foreground">
            Your private study command center
          </p>

          <nav
            className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto"
            aria-label="Focus Zone navigation"
          >
            {NAV.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                label={label}
                Icon={Icon}
                active={isActivePath(pathname, to, exact)}
                onClick={() => setMenuOpen(false)}
              />
            ))}
          </nav>

          {activeTodo ? (
            <button
              type="button"
              onClick={toggleTimer}
              className="mt-3 rounded-2xl border border-primary/25 bg-primary/5 p-3 text-left transition hover:bg-primary/10"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold">{activeTodo.title}</span>
                <span className="shrink-0 font-mono text-xs font-bold text-primary">
                  {fmtClock(elapsed)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, (elapsed / 60 / Math.max(1, activeTodo.estimateMin)) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {timer?.running ? "Tap to pause" : "Tap to resume"}
              </p>
            </button>
          ) : null}

          <div className="mt-3 flex items-center justify-between rounded-2xl border border-border/70 bg-background/30 px-2 py-2">
            <Link
              to="/profile"
              aria-label="Profile"
              className="grid h-9 w-9 place-items-center rounded-xl hover:bg-muted"
            >
              <User className="h-4 w-4" />
            </Link>
            <span className="flex items-center gap-1.5 text-sm font-bold">
              <Flame className="h-4 w-4 text-orange-500" />
              {state?.streak ?? 0}
              <span className="text-xs font-normal text-muted-foreground">streak</span>
            </span>
            <Link
              to="/focus/block"
              aria-label="Focus settings"
              className="grid h-9 w-9 place-items-center rounded-xl hover:bg-muted"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </GlassSurface>
      </aside>

      <div className="flex min-h-[100dvh] min-w-0 flex-col p-3 pb-20 sm:p-4 sm:pb-20 lg:pl-4 lg:pb-4 md:min-h-[calc(100dvh-var(--site-global-header-height))]">
        <GlassSurface className="sticky top-2 z-20 flex items-center gap-2 rounded-2xl p-2.5 dark:border-slate-800/80 dark:bg-slate-900/90 md:top-[calc(var(--site-global-header-height)+0.5rem)]">
          <button
            type="button"
            aria-label="Open Focus Zone menu"
            onClick={() => setMenuOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Focus Zone
            </p>
            <h1 className="truncate font-display text-base font-bold sm:text-lg">
              {current.label}
            </h1>
          </div>
          <div className="hidden items-center gap-1.5 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs font-bold text-orange-600 dark:text-orange-300 sm:flex">
            <Flame className="h-4 w-4" />
            {state?.streak ?? 0} day streak
          </div>
          <button
            type="button"
            aria-label={state?.lockEnabled ? "Disable focus lock" : "Enable focus lock"}
            onClick={() => update((s) => ({ ...s, lockEnabled: !s.lockEnabled }))}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors ${state?.lockEnabled ? "border-primary/50 bg-primary/15 text-primary" : "border-border/70 text-muted-foreground hover:bg-muted"}`}
          >
            {state?.lockEnabled ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
          </button>
        </GlassSurface>

        <main className="min-h-0 flex-1 pt-3 lg:pt-4">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Focus Zone mobile navigation"
        className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-5 gap-1 rounded-2xl border border-border/70 bg-background/90 p-1.5 shadow-xl backdrop-blur-xl lg:hidden"
      >
        {MOBILE_NAV.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            aria-current={isActivePath(pathname, to, exact) ? "page" : undefined}
            className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold transition ${isActivePath(pathname, to, exact) ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold text-muted-foreground transition hover:bg-muted"
          aria-label="More Focus Zone tools"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span>More</span>
        </button>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-x-3 bottom-20 z-40 rounded-3xl border border-border bg-card p-3 shadow-2xl lg:hidden">
          <div className="mb-2 flex items-center justify-between px-2">
            <div>
              <p className="font-bold">More tools</p>
              <p className="text-xs text-muted-foreground">Everything in Focus Zone</p>
            </div>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              aria-label="Close more tools"
              className="grid h-9 w-9 place-items-center rounded-xl hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {NAV.filter((item) => !MOBILE_NAV.some((mobile) => mobile.to === item.to)).map(
              ({ to, label, icon: Icon, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  label={label}
                  Icon={Icon}
                  active={isActivePath(pathname, to, exact)}
                  onClick={() => setMoreOpen(false)}
                />
              ),
            )}
          </div>
          <Link
            to="/profile"
            onClick={() => setMoreOpen(false)}
            className="mt-2 flex items-center justify-between rounded-xl border border-border/70 px-3 py-2.5 text-sm font-semibold"
          >
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" /> Profile
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function NavLink({
  to,
  label,
  Icon,
  active,
  onClick,
}: {
  to: string;
  label: string;
  Icon: typeof LayoutDashboard;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-primary/12 font-bold text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
    >
      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : ""}`} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active ? <ChevronRight className="h-3.5 w-3.5 text-primary" /> : null}
    </Link>
  );
}
