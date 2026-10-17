import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutGrid,
  LayoutDashboard,
  BookOpen,
  Timer,
  Trophy,
  MessageCircle,
  Rss,
  Award,
  User,
  Users,
  Megaphone,
  Send,
  UserPlus,
  Heart,
  Sigma,
  Crown,
  FileText,
  Sparkles,
  Radio,
  NotebookText,
  Swords,
  CalendarDays,
  ChartNoAxesCombined,
  Video,
  Atom,
  FlaskConical,
  CheckCircle2,
  GraduationCap,
  Target,
  BookMarked,
  Brain,
  Medal,
  Clock3,
  Zap,
  Calculator,
  CircleDollarSign,
  PlaySquare,
  Settings,
  Building2,
  Code2,
  Info,
  BadgeCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

type Section =
  | "Study"
  | "JEE 360"
  | "Predictor"
  | "AI"
  | "Community"
  | "App/Social"
  | "Focus"
  | "Media"
  | "Hub"
  | "Help & Support"
  | "Account";

type Tile = {
  to: string;
  label: string;
  icon: any;
  color: string;
  section: Section;
  popular?: boolean;
};

const tiles: Tile[] = [
  // Study
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-sky-600", section: "Study", popular: true },
  { to: "/planner", label: "Planner", icon: BookOpen, color: "text-lime-600", section: "Study", popular: true },
  { to: "/materials", label: "Materials", icon: BookOpen, color: "text-emerald-600", section: "Study" },
  { to: "/notes", label: "Notes", icon: NotebookText, color: "text-blue-600", section: "Study" },
  { to: "/lecture-tracker", label: "Lectures", icon: Video, color: "text-violet-600", section: "Study" },
  { to: "/progress", label: "Progress", icon: ChartNoAxesCombined, color: "text-cyan-600", section: "Study" },
  { to: "/tests", label: "Test Series", icon: FileText, color: "text-teal-600", section: "Study", popular: true },
  { to: "/tests/create", label: "Create CBT", icon: FileText, color: "text-emerald-700", section: "Study" },
  { to: "/tests/leaderboard", label: "Test Ranks", icon: Trophy, color: "text-amber-500", section: "Study" },
  { to: "/quiz", label: "Quiz Arena", icon: Swords, color: "text-rose-500", section: "Study" },
  { to: "/jee-advanced-math-problems", label: "JEE Adv Math", icon: Sigma, color: "text-indigo-600", section: "Study" },
  { to: "/jee-advanced-physics-problems", label: "JEE Adv Physics", icon: Atom, color: "text-cyan-600", section: "Study" },
  { to: "/jee-advanced-chemistry-problems", label: "JEE Adv Chem", icon: FlaskConical, color: "text-emerald-600", section: "Study" },
  { to: "/youtube-checklist", label: "YT Checklist", icon: CheckCircle2, color: "text-red-500", section: "Study" },
  { to: "/nta", label: "NTA Tools", icon: GraduationCap, color: "text-blue-600", section: "Study" },

  // JEE 360
  { to: "/jee360", label: "JEE 360", icon: Target, color: "text-fuchsia-600", section: "JEE 360", popular: true },
  { to: "/jee360/schedule", label: "Schedule", icon: CalendarDays, color: "text-indigo-600", section: "JEE 360" },
  { to: "/jee360/backlog", label: "Backlog", icon: BookMarked, color: "text-orange-600", section: "JEE 360" },
  { to: "/jee360/coach", label: "Coach", icon: Brain, color: "text-violet-600", section: "JEE 360" },
  { to: "/jee360/lab", label: "Lab", icon: FlaskConical, color: "text-cyan-600", section: "JEE 360" },
  { to: "/jee360/tests", label: "360 Tests", icon: FileText, color: "text-rose-600", section: "JEE 360" },
  { to: "/jee360/rank", label: "360 Rank", icon: Medal, color: "text-amber-600", section: "JEE 360" },
  { to: "/jee360/reminders", label: "Reminders", icon: Clock3, color: "text-sky-600", section: "JEE 360" },
  { to: "/jee360/memory", label: "Memory", icon: Brain, color: "text-pink-600", section: "JEE 360" },
  { to: "/jee360/sprint", label: "Sprint", icon: Zap, color: "text-yellow-600", section: "JEE 360" },

  // Predictor
  { to: "/jee-predictor", label: "JEE Predictor", icon: Calculator, color: "text-blue-600", section: "Predictor", popular: true },
  { to: "/jee-predictor/marks-rank", label: "Marks → Rank", icon: Calculator, color: "text-cyan-600", section: "Predictor" },
  { to: "/jee-predictor/marks-percentile", label: "Percentile", icon: ChartNoAxesCombined, color: "text-indigo-600", section: "Predictor" },
  { to: "/jee-predictor/college-comparison", label: "Compare", icon: Trophy, color: "text-amber-600", section: "Predictor" },
  { to: "/jee-predictor/cutoff-tracker", label: "Cutoffs", icon: Target, color: "text-rose-600", section: "Predictor" },
  { to: "/jee-predictor/scholarship-checker", label: "Scholarships", icon: CircleDollarSign, color: "text-emerald-600", section: "Predictor" },
  { to: "/jee-predictor/preference-optimizer", label: "Preferences", icon: Sparkles, color: "text-fuchsia-600", section: "Predictor" },
  { to: "/jee-predictor/admission-fit", label: "Admission Fit", icon: CheckCircle2, color: "text-green-600", section: "Predictor" },

  // AI
  { to: "/ai-chat", label: "AI Chat", icon: Sparkles, color: "text-purple-600", section: "AI", popular: true },
  { to: "/sahai", label: "SahAI", icon: Sparkles, color: "text-fuchsia-600", section: "AI" },
  { to: "/pulse", label: "Pulse", icon: Radio, color: "text-amber-500", section: "AI" },

  // Community
  { to: "/community", label: "Community", icon: MessageCircle, color: "text-cyan-600", section: "Community", popular: true },
  { to: "/feed", label: "Feed", icon: Rss, color: "text-rose-600", section: "Community" },
  { to: "/groups", label: "Squads", icon: Users, color: "text-fuchsia-600", section: "Community" },
  { to: "/friends", label: "Friends", icon: UserPlus, color: "text-pink-600", section: "Community" },
  { to: "/messages", label: "Messages", icon: Send, color: "text-blue-600", section: "Community" },
  { to: "/notices", label: "Notices", icon: Megaphone, color: "text-violet-600", section: "Community" },
  { to: "/toppers", label: "Toppers", icon: Trophy, color: "text-amber-700", section: "Community" },

  // App / Social
  { to: "/articles", label: "Articles", icon: BookOpen, color: "text-cyan-600", section: "App/Social", popular: true },

  // Focus
  { to: "/timer", label: "Focus Timer", icon: Timer, color: "text-orange-600", section: "Focus", popular: true },
  { to: "/focus", label: "Focus Zone", icon: Timer, color: "text-cyan-700", section: "Focus" },
  { to: "/focus/todos", label: "Tasks", icon: CheckCircle2, color: "text-green-600", section: "Focus" },
  { to: "/focus/habits", label: "Habits", icon: Target, color: "text-violet-600", section: "Focus" },
  { to: "/focus/stats", label: "Stats", icon: ChartNoAxesCombined, color: "text-blue-600", section: "Focus" },
  { to: "/focus/friends", label: "Focus Friends", icon: Users, color: "text-pink-600", section: "Focus" },

  // Media
  { to: "/watch", label: "Watch Party", icon: PlaySquare, color: "text-fuchsia-600", section: "Media", popular: true },
  { to: "/watch-history", label: "Watch History", icon: Radio, color: "text-slate-500", section: "Media" },
  { to: "/engineering", label: "Engineering", icon: Building2, color: "text-amber-600", section: "Media", popular: true },
  { to: "/about", label: "About Us", icon: Info, color: "text-violet-600", section: "Media" },
  { to: "/developer", label: "Developer Portal", icon: Code2, color: "text-slate-700", section: "Media" },
  { to: "/official", label: "Official", icon: BadgeCheck, color: "text-cyan-600", section: "Media" },
  { to: "/updates", label: "Updates", icon: Megaphone, color: "text-sky-600", section: "Media" },

  // Hub
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy, color: "text-amber-600", section: "Hub" },
  { to: "/certificates", label: "Certificates", icon: Award, color: "text-yellow-600", section: "Hub" },
  { to: "/verified", label: "Verified", icon: CheckCircle2, color: "text-emerald-600", section: "Hub" },
  // Help & Support
  { to: "/feedback", label: "Feedback", icon: MessageCircle, color: "text-cyan-600", section: "Help & Support" },
  { to: "/contact", label: "Contact", icon: Send, color: "text-indigo-600", section: "Help & Support" },

  // Account
  { to: "/pro", label: "Pro", icon: Crown, color: "text-amber-500", section: "Account", popular: true },
  { to: "/pricing", label: "Earn Pro", icon: Crown, color: "text-amber-500", section: "Account" },
  { to: "/donate", label: "Support", icon: Heart, color: "text-rose-500", section: "Account" },
  { to: "/profile", label: "Profile", icon: User, color: "text-slate-600", section: "Account" },
  { to: "/settings", label: "Settings", icon: Settings, color: "text-slate-600", section: "Account" },
];

const TABS = [
  "Popular",
  "Study",
  "JEE 360",
  "Predictor",
  "AI",
  "Community",
  "App/Social",
  "Focus",
  "Media",
  "Hub",
  "Help & Support",
  "Account",
] as const;

type Tab = (typeof TABS)[number];

/* Guests can't open these routes (or anything under them). */
const LOGIN_REQUIRED = [
  "/dashboard",
  "/profile",
  "/messages",
  "/friends",
  "/planner",
  "/jee360",
  "/jee-predictor",
  "/settings",
  "/pro",
  "/progress",
  "/focus",
  "/timer",
  "/materials",
  "/notes",
  "/tests",
  "/groups",
  "/community",
];

const requiresLogin = (to: string) =>
  LOGIN_REQUIRED.some((p) => to === p || to.startsWith(`${p}/`));

export function AppLauncher() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("Popular");
  const contentRef = useRef<HTMLDivElement>(null);

  const visible = tiles.filter((t) => user || !requiresLogin(t.to));

  // Hide tabs that would be empty (e.g. JEE 360 for guests).
  const availableTabs = TABS.filter(
    (name) =>
      name === "Popular" ||
      visible.some((t) => t.section === name),
  );
  const activeTab: Tab = availableTabs.includes(tab) ? tab : "Popular";

  const shown = visible.filter((t) =>
    activeTab === "Popular" ? t.popular : t.section === activeTab,
  );

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setTab("Popular");
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        aria-label="Open app launcher"
        data-tour="launcher"
        className="nav-glass-btn inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LayoutGrid className="h-[18px] w-[18px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={contentRef}
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="max-h-[calc(100dvh-6rem)] w-[min(92vw,20rem)] overflow-y-auto overscroll-contain border-white/40 bg-card/70 p-3 backdrop-blur-md"
      >
        <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Apps & tools
        </div>

        <div
          role="tablist"
          aria-label="App categories"
          className="-mx-1 mb-2.5 flex gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {availableTabs.map((name) => {
            const active = name === activeTab;
            return (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(name)}
                className={`shrink-0 touch-manipulation rounded-full border px-3 py-2 text-[11px] font-semibold leading-none transition-all active:scale-95 ${
                  active
                    ? "border-white/60 bg-background/80 text-foreground shadow-sm"
                    : "border-white/30 bg-background/35 text-muted-foreground hover:bg-background/60"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {shown.map((t) => {
            const isProfile = t.to === "/profile" && user?.id;
            const commonCls = "liquid-lens-item flex touch-manipulation flex-col items-center justify-center gap-1 rounded-xl border border-white/30 bg-background/45 px-1.5 py-2.5 text-center shadow-sm transition-all hover:bg-background/70 active:scale-95";
            const inner = (
              <>
                <span className={`grid h-9 w-9 place-items-center rounded-lg bg-background/70 ${t.color}`}>
                  <t.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="w-full truncate text-[11px] font-medium leading-tight">{t.label}</span>
              </>
            );

            if (isProfile) {
              return (
                <Link
                  key={t.to}
                  to="/u/$userId"
                  params={{ userId: user!.id }}
                  onClick={() => handleOpenChange(false)}
                  className={commonCls}
                >
                  {inner}
                </Link>
              );
            }
            return (
              <Link
                key={t.to}
                to={t.to}
                onClick={() => handleOpenChange(false)}
                className={commonCls}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
