import { useState } from "react";
import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import {
  Atom,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  ClipboardList,
  Gauge,
  Inbox,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Timer,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FocusEngine } from "@/components/jee360/focus-engine";
import { ReminderEngine } from "@/components/jee360/reminder-engine";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCountdown, todayISO } from "@/lib/jee360/dates";
import { useAppStore } from "@/lib/jee360/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jee360")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "JEE 360 — Your JEE command centre" },
      { name: "twitter:description", content: "Plan lectures, clear backlog, log tests and revise with spaced repetition — all stored in your browser." },
      { title: "JEE 360 — Lecture Planner, Backlog & Test Command Centre" },
      {
        name: "description",
        content:
          "JEE 360 keeps your coaching lectures, backlog, mock tests, revision cards and focus sessions in one offline planner inside JEE Prep Hub.",
      },
      { property: "og:title", content: "JEE 360 — Your JEE command centre" },
      {
        property: "og:description",
        content: "Plan lectures, clear backlog, log tests and revise with spaced repetition — all stored in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Jee360Layout,
});

const LAB_PATHS = ["/jee360/lab", "/jee360/focus", "/jee360/memory", "/jee360/rank", "/jee360/coach"];

type NavItem = { to: string; label: string; icon: LucideIcon; mobile?: boolean; match?: string[] };

const NAV: NavItem[] = [
  { to: "/jee360", label: "Today", icon: LayoutDashboard, mobile: true },
  { to: "/jee360/schedule", label: "Schedule", icon: CalendarDays, mobile: true },
  { to: "/jee360/backlog", label: "Backlog", icon: Inbox, mobile: true },
  { to: "/jee360/tests", label: "Tests", icon: ClipboardList, mobile: true },
  { to: "/jee360/lab", label: "Lab", icon: Atom, mobile: true, match: LAB_PATHS },
  { to: "/jee360/plans", label: "Plans", icon: BookOpen },
  { to: "/jee360/reminders", label: "Reminders", icon: Bell },
  { to: "/jee360/upload", label: "Import", icon: Upload },
];

function NavLink({
  to,
  label,
  icon: Icon,
  compact,
  onClick,
  match,
}: NavItem & { compact?: boolean; onClick?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = match
    ? match.includes(pathname)
    : to === "/jee360"
      ? pathname === "/jee360" || pathname === "/jee360/"
      : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
        compact ? "h-12 flex-col justify-center gap-0.5 px-1 text-xs" : "h-11 px-3",
        active
          ? "bg-primary/15 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </Link>
  );
}

function Jee360Layout() {
  const examDate = useAppStore((s) => s.settings.examDate);
  const meta = useAppStore((s) => s.meta);
  const openBacklog = useAppStore((s) => s.backlog.filter((b) => b.status !== "cleared").length);
  const activeFocus = useAppStore((s) => s.activeFocus);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div data-lg-root className="min-h-dvh w-full overflow-x-hidden bg-aurora-shift text-foreground dark:bg-slate-950 md:min-h-[calc(100dvh-var(--site-global-header-height))]">
      <ReminderEngine />
      <FocusEngine />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 p-3 md:top-[var(--site-global-header-height)] md:flex md:flex-col">
        <div className="glass-surface flex h-full flex-col rounded-3xl p-3 dark:border-slate-800/80 dark:bg-slate-900/90">
          <Link to="/jee360" className="mb-6 flex items-center gap-2.5 px-2 pt-1">
            <Atom className="size-6 text-primary" />
            <span className="font-display text-xl font-semibold tracking-tight text-liquid">JEE 360</span>
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => (
              <NavLink key={item.to} {...item} />
            ))}
          </nav>
          <div className="glass-surface mt-3 rounded-2xl p-3 dark:border-slate-800/80 dark:bg-slate-900/90">
            <p className="text-xs text-muted-foreground">JEE Main</p>
            <p className="font-display text-lg tabular-nums tracking-tight">{formatCountdown(examDate)}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{meta?.batch ?? "No batch yet"}</p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 px-3 py-2 md:hidden">
        <div className="glass-surface flex items-center justify-between gap-3 rounded-2xl px-3 py-2 dark:border-slate-800/80 dark:bg-slate-900/90">
          <Link to="/jee360" className="flex min-w-0 items-center gap-2">
            <Atom className="size-5 text-primary" />
            <span className="font-display text-lg tracking-tight">JEE 360</span>
          </Link>
          <div className="flex items-center gap-1">
            <div className="pr-1 text-right">
              <p className="text-xs text-muted-foreground">{todayISO()}</p>
              {openBacklog > 0 ? (
                <p className="text-xs text-destructive">{openBacklog} backlog</p>
              ) : (
                <p className="text-xs text-muted-foreground">{formatCountdown(examDate)}</p>
              )}
            </div>
            <Button size="icon" variant="ghost" aria-label="More pages" onClick={() => setMoreOpen(true)}>
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>More</DialogTitle>
            <DialogDescription>Plans, reminders, import, and the rest of Lab.</DialogDescription>
          </DialogHeader>
          <nav className="flex flex-col gap-1">
            {NAV.filter((item) => !item.mobile).map((item) => (
              <NavLink key={item.to} {...item} onClick={() => setMoreOpen(false)} />
            ))}
            <NavLink to="/jee360/focus" label="Focus" icon={Timer} onClick={() => setMoreOpen(false)} />
            <NavLink to="/jee360/memory" label="Memory" icon={Brain} onClick={() => setMoreOpen(false)} />
            <NavLink to="/jee360/rank" label="Rank sim" icon={Gauge} onClick={() => setMoreOpen(false)} />
            <NavLink to="/jee360/coach" label="AI coach" icon={MessageSquare} onClick={() => setMoreOpen(false)} />
          </nav>
        </DialogContent>
      </Dialog>

      <main className="min-w-0 overflow-x-hidden md:pl-56">
        <div
          key={pathname}
          className={cn(
            "mx-auto w-full min-w-0 max-w-5xl px-4 py-6 pb-28 md:py-8 md:pb-10",
            activeFocus && "pb-40 md:pb-20",
          )}
        >
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 px-2 pb-2 md:hidden">
        <div className="glass-surface grid grid-cols-5 rounded-2xl px-1 py-1 dark:border-slate-800/80 dark:bg-slate-900/90">
          {NAV.filter((n) => n.mobile).map((item) => (
            <NavLink key={item.to} {...item} compact />
          ))}
        </div>
      </nav>
    </div>
  );
}
