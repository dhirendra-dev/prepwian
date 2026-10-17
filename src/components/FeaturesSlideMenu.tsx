import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "framer-motion";
import {
  Menu,
  Info,
  LayoutDashboard,
  BookOpen,
  Timer,
  Flame,
  MessagesSquare,
  Users,
  Trophy,
  MessageCircle,
  LifeBuoy,
  Rss,
  Award,
  User,
  ArrowRight,
  Sigma,
  Atom,
  FlaskConical,
  UserPlus,
  Send,
  ShieldCheck,
  FileText,
  Megaphone,
  BadgeCheck,
  Home,
  LogIn,
  GraduationCap,
  Heart,
  ShieldAlert,
  Bell,
  Sparkles,
  Radio,
  RefreshCw,
  ListChecks,
  Video,
  PanelLeft,
  PanelBottom,
  Youtube,
  UsersRound,
  X,
  BarChart3,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  Cake,
  Target,
  ChevronDown,
  Search,
  Rocket,
  Brain,
  Compass,
  Building2,
  Code2,
  Scale,
  Wallet,
  Library,
  Calculator,
  Layers,
  UserCircle2,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { useMenuStyle, type MenuStyle } from "@/lib/menu-style";
import { cn } from "@/lib/utils";

type Item = {
  to: string;
  label: string;
  icon: any;
  desc: string;
  params?: Record<string, string>;
  hideWhenSignedIn?: boolean;
};

type Group = {
  id: string;
  title: string;
  icon: any;
  color: string;
  bg: string;
  defaultOpen?: boolean;
  admin?: boolean;
  items: Item[];
};

/* ------------------------------------------------------------------ */
/*  Menu structure — ordered by priority (most-used first)             */
/* ------------------------------------------------------------------ */
const allGroups: Group[] = [
  {
    id: "quick",
    title: "Quick Access",
    icon: Rocket,
    color: "text-sky-600",
    bg: "bg-sky-500/10",
    defaultOpen: true,
    items: [
      { to: "/searches", label: "Search Engine", icon: Search, desc: "Find any JEE resource fast" },
      { to: "/home", label: "Home", icon: Home, desc: "Landing & quick highlights" },
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Overview, checklist & targets" },
      { to: "/notes", label: "Notes", icon: BookOpen, desc: "Class 11 & 12 notes, NCERT & solutions" },
      { to: "/materials", label: "Material Hub", icon: Library, desc: "Notes, modules, PYQs & tests" },
      { to: "/tests", label: "Test Series", icon: FileText, desc: "JEE-style CBT mock tests" },
      { to: "/progress", label: "Study Streak", icon: Flame, desc: "Track your streak & progress" },
      { to: "/sahai", label: "SahAI", icon: Sparkles, desc: "Your AI study buddy for doubts, plans & motivation" },
      { to: "/timer", label: "Focus Timer", icon: Timer, desc: "Pomodoro & study stats" },
    ],
  },
  {
    id: "tools",
    title: "Study Tools",
    icon: Brain,
    color: "text-violet-600",
    bg: "bg-violet-500/10",
    items: [
      { to: "/planner", label: "Weekly Planner", icon: ListChecks, desc: "Weekly tasks by subject" },
      { to: "/focus", label: "Focus Zone", icon: ListChecks, desc: "Todos, habits & sessions" },
      { to: "/jee360", label: "JEE 360", icon: Atom, desc: "Lectures, backlog, tests & revision" },
      { to: "/lecture-tracker", label: "Lecture Tracker", icon: Video, desc: "Track lectures and watch progress" },
      { to: "/youtube-checklist", label: "YouTube Checklist", icon: Youtube, desc: "Turn videos & playlists into checklists" },
      { to: "/watch", label: "Watch Party", icon: UsersRound, desc: "Watch and study videos together" },
      { to: "/watch-history", label: "Watch History", icon: Radio, desc: "Resume lectures you started" },
      { to: "/ai-chat", label: "AI Study Chat", icon: Sparkles, desc: "Step-by-step JEE & NEET tutor" },
    ],
  },
  {
    id: "practice",
    title: "Tests & Practice",
    icon: Target,
    color: "text-rose-600",
    bg: "bg-rose-500/10",
    items: [
      { to: "/prep-lab", label: "Prep Lab", icon: Brain, desc: "2,000 generated practice questions, adaptive sets & mistake revision" },
      { to: "/tests/leaderboard", label: "Test Rank Leaderboard", icon: Trophy, desc: "Points & ranks across all tests" },
      { to: "/tests/create", label: "Create CBT Test", icon: FileText, desc: "Turn your PDFs into a CBT test" },
      { to: "/jee-predictor/pyq", label: "JEE PYQ Practice", icon: FileText, desc: "Chapter and topic-wise PYQs" },
      { to: "/jee-predictor/daily-practice", label: "Daily JEE Practice", icon: Flame, desc: "Complete your daily practice set" },
      { to: "/jee-predictor/dpp-tracker", label: "DPP Tracker", icon: CheckCircle2, desc: "Track daily practice sheets" },
      { to: "/jee-predictor/mistake-book", label: "Mistake Book", icon: FileText, desc: "Track and learn from your mistakes" },
      { to: "/jee-advanced-math-problems", label: "JEE Advanced Math", icon: Sigma, desc: "Curated PYQs & problems" },
      { to: "/jee-advanced-physics-problems", label: "JEE Advanced Physics", icon: Atom, desc: "Curated PYQs & problems" },
      { to: "/jee-advanced-chemistry-problems", label: "JEE Advanced Chemistry", icon: FlaskConical, desc: "Curated PYQs & problems" },
    ],
  },
  {
    id: "system",
    title: "JEE Study System",
    icon: Layers,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    items: [
      { to: "/jee-predictor/syllabus", label: "Syllabus Tracker", icon: BookOpen, desc: "Track chapter and topic completion" },
      { to: "/jee-predictor/study-planner", label: "JEE Study Planner", icon: ListChecks, desc: "Plan your daily JEE preparation" },
      { to: "/jee-predictor/study-now", label: "What Should I Study Now?", icon: Timer, desc: "Get your next study recommendation" },
      { to: "/jee-predictor/daily-targets", label: "Daily Targets", icon: Target, desc: "Track today's study targets" },
      { to: "/jee-predictor/study-goals", label: "Study Goals", icon: Target, desc: "Set measurable study goals" },
      { to: "/jee-predictor/backlog", label: "Backlog Manager", icon: ListChecks, desc: "Track pending chapters and work" },
      { to: "/jee-predictor/smart-revision", label: "Smart Revision", icon: Sparkles, desc: "Turn backlog into prioritized revision" },
      { to: "/jee-predictor/revision", label: "Revision System", icon: RefreshCw, desc: "Schedule and track chapter revisions" },
      { to: "/jee-predictor/weekly-review", label: "Weekly Study Review", icon: BarChart3, desc: "Review tests, weaknesses and revisions" },
      { to: "/jee-predictor/exam-countdown", label: "Exam Countdown", icon: CalendarClock, desc: "Track important exam milestones" },
      { to: "/jee-predictor/question-bookmarks", label: "Question Review Queue", icon: Bookmark, desc: "Review bookmarked questions" },
      { to: "/jee-predictor/heatmap", label: "Syllabus Heatmap", icon: Flame, desc: "See strongest and weakest chapters" },
      { to: "/jee-predictor/concept-map", label: "Concept Dependency Map", icon: Atom, desc: "Understand chapter prerequisites" },
    ],
  },
  {
    id: "analytics",
    title: "Performance Analytics",
    icon: BarChart3,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    items: [
      { to: "/jee-predictor/mock-analysis", label: "Mock Test Analysis", icon: BarChart3, desc: "Analyse completed mock tests" },
      { to: "/jee-predictor/performance-trends", label: "Performance Trends", icon: BarChart3, desc: "Track test performance over time" },
      { to: "/jee-predictor/mock-test-comparison", label: "Mock Test Comparison", icon: Scale, desc: "Compare two completed tests" },
      { to: "/jee-predictor/weak-chapters", label: "Weak Chapter Detector", icon: Target, desc: "Find chapters needing attention" },
    ],
  },
  {
    id: "rank",
    title: "Rank Predictor",
    icon: Calculator,
    color: "text-indigo-600",
    bg: "bg-indigo-500/10",
    items: [
      { to: "/jee-predictor", label: "JEE Main Rank Predictor", icon: GraduationCap, desc: "Estimate rank from NTA percentile" },
      { to: "/jee-predictor/advanced", label: "JEE Advanced Rank Estimator", icon: Sigma, desc: "Estimate rank from Advanced marks" },
      { to: "/jee-predictor/marks-percentile", label: "Marks ↔ Percentile", icon: Sigma, desc: "Marks and percentile relationships" },
      { to: "/jee-predictor/marks-rank", label: "Marks ↔ Rank", icon: Trophy, desc: "Historical marks-to-rank data" },
      { to: "/jee-predictor/rank-trends", label: "Rank Trends", icon: RefreshCw, desc: "Explore historical rank trends" },
    ],
  },
  {
    id: "colleges",
    title: "Find Colleges",
    icon: Compass,
    color: "text-cyan-600",
    bg: "bg-cyan-500/10",
    items: [
      { to: "/jee-predictor/college", label: "College Predictor", icon: GraduationCap, desc: "Colleges from your expected rank" },
      { to: "/jee-predictor/nit-iiit-gfti", label: "NIT / IIIT / GFTI Predictor", icon: GraduationCap, desc: "Explore NITs, IIITs and GFTIs" },
      { to: "/jee-predictor/range-explorer", label: "College Range Explorer", icon: BookOpen, desc: "Colleges across rank ranges" },
      { to: "/jee-predictor/cutoffs", label: "Cutoff Explorer", icon: FileText, desc: "College and branch cutoffs" },
      { to: "/jee-predictor/cutoff-tracker", label: "Historical Cutoff Tracker", icon: RefreshCw, desc: "Cutoff trends across years" },
      { to: "/jee-predictor/seat-matrix", label: "Seat Matrix", icon: Users, desc: "Available seats and categories" },
      { to: "/jee-predictor/institutes", label: "Institute Directory", icon: Building2, desc: "Browse institutes and programs" },
      { to: "/jee-predictor/programs", label: "Academic Program Explorer", icon: BookOpen, desc: "Programs and branches" },
      { to: "/jee-predictor/branches", label: "Branch & Program Search", icon: Search, desc: "Search branches and programs" },
      { to: "/jee-predictor/branch-demand", label: "Branch Demand", icon: Trophy, desc: "Branch demand patterns" },
      { to: "/jee-predictor/campus", label: "Campus Explorer", icon: Home, desc: "College locations and campuses" },
    ],
  },
  {
    id: "compare",
    title: "Compare & Decide",
    icon: Scale,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-500/10",
    items: [
      { to: "/jee-predictor/compare", label: "Branch Comparison", icon: Scale, desc: "Compare branches and admission options" },
      { to: "/jee-predictor/college-comparison", label: "College Comparison", icon: Scale, desc: "Compare colleges side by side" },
      { to: "/jee-predictor/comparison-360", label: "College Comparison 360°", icon: Atom, desc: "Deep comparison workspace" },
      { to: "/jee-predictor/admission-fit", label: "Admission Fit", icon: BadgeCheck, desc: "How your profile fits options" },
      { to: "/jee-predictor/recommendations", label: "Recommendation Workspace", icon: Sparkles, desc: "Structured JEE recommendations" },
    ],
  },
  {
    id: "counselling",
    title: "Counselling Help",
    icon: ListChecks,
    color: "text-teal-600",
    bg: "bg-teal-500/10",
    items: [
      { to: "/jee-predictor/preferences", label: "Preference List Builder", icon: ListChecks, desc: "Build your preference list" },
      { to: "/jee-predictor/preference-optimizer", label: "Preference Optimizer", icon: Sparkles, desc: "Analyze and optimize your list" },
      { to: "/jee-predictor/choice-filling", label: "Choice Filling Assistant", icon: FileText, desc: "Validate and organize choices" },
      { to: "/jee-predictor/shortlist", label: "College Shortlist", icon: Bookmark, desc: "Save colleges you are considering" },
      { to: "/jee-predictor/counselling-checklist", label: "Counselling Checklist", icon: CheckCircle2, desc: "Track your counselling tasks" },
      { to: "/jee-predictor/documents", label: "Documents & Certificates", icon: FileText, desc: "Track admission documents" },
    ],
  },
  {
    id: "money",
    title: "Fees & Scholarships",
    icon: Wallet,
    color: "text-lime-600",
    bg: "bg-lime-500/10",
    items: [
      { to: "/jee-predictor/fees", label: "College Fee Explorer", icon: Wallet, desc: "Explore college fees and costs" },
      { to: "/jee-predictor/living-costs", label: "Hostel & Living Costs", icon: Home, desc: "Hostel and living expenses" },
      { to: "/jee-predictor/placements", label: "Placement & ROI Explorer", icon: Trophy, desc: "Placement and ROI information" },
      { to: "/jee-predictor/roi", label: "ROI Calculator", icon: Calculator, desc: "Education cost versus return" },
      { to: "/jee-predictor/scholarships", label: "Scholarship Explorer", icon: Award, desc: "Scholarships and fee waivers" },
      { to: "/jee-predictor/scholarship-checker", label: "Scholarship Eligibility", icon: BadgeCheck, desc: "Check scholarship eligibility" },
    ],
  },
  {
    id: "community",
    title: "Community",
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-500/10",
    items: [
      { to: "/pulse", label: "Pulse", icon: Radio, desc: "Lectures + community updates in one feed" },
      { to: "/groups", label: "Study Squads", icon: Users, desc: "Group chats & files" },
      { to: "/community", label: "Community Chat & Doubts", icon: MessageCircle, desc: "Live chat, doubt board & AI answers" },
      { to: "/feed", label: "Social Feed", icon: Rss, desc: "Share, ask, like & comment" },
      { to: "/forum", label: "Forum", icon: MessagesSquare, desc: "Threaded subject discussions" },
      {
        to: "/birthday",
        label: "Birthday Hub",
        icon: Cake,
        desc: "Birthday cards, wishes & celebrations",
      },
      { to: "/friends", label: "Friends", icon: UserPlus, desc: "Follow aspirants" },
      { to: "/messages", label: "Messages", icon: Send, desc: "Private 1-on-1 chats" },
      { to: "/follow-channel", label: "WhatsApp Channel", icon: MessageCircle, desc: "Follow & earn a certificate" },
    ],
  },
  {
    id: "updates",
    title: "Rankings & Updates",
    icon: Megaphone,
    color: "text-orange-600",
    bg: "bg-orange-500/10",
    items: [
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy, desc: "Top aspirants by hours" },
      { to: "/notices", label: "Notice Board", icon: Megaphone, desc: "Official updates & announcements" },
      { to: "/nta", label: "NTA JEE Main", icon: GraduationCap, desc: "Official notices, papers & answer keys" },
      { to: "/toppers", label: "Toppers Hall of Fame", icon: Trophy, desc: "JEE & NEET AIR toppers" },
      { to: "/certificates", label: "Certificates", icon: Award, desc: "Earn & download awards" },
      { to: "/updates", label: "Updates & History", icon: Sparkles, desc: "Everything we shipped, day by day" },
    ],
  },
  {
    id: "support",
    title: "Help & Support",
    icon: LifeBuoy,
    color: "text-cyan-600",
    bg: "bg-cyan-500/10",
    items: [
      { to: "/contact", label: "Contact the team", icon: Send, desc: "Ask a question or get help" },
      { to: "/feedback", label: "Feedback Hub", icon: MessageCircle, desc: "Report issues and suggest improvements" },
    ],
  },
  {
    id: "account",
    title: "Account",
    icon: UserCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    items: [
      { to: "/profile", label: "My Profile", icon: User, desc: "Avatar, bio & stats" },
      { to: "/my-activity", label: "My Activity", icon: LayoutDashboard, desc: "Appeals, tickets, certificates & more" },
      { to: "/pricing", label: "Earn Pro", icon: Trophy, desc: "Weekly #1 champion reward" },
      { to: "/verified", label: "Get Blue Tick", icon: BadgeCheck, desc: "How to become a verified member" },
      { to: "/consent", label: "Consent & Details", icon: ShieldCheck, desc: "Manage verification & data sharing" },
      { to: "/donate", label: "Support the website", icon: Heart, desc: "Optional UPI contribution" },
    ],
  },
  {
    id: "about",
    title: "About & Policies",
    icon: Info,
    color: "text-slate-600",
    bg: "bg-slate-500/10",
    items: [
      { to: "/engineering", label: "Engineering", icon: Building2, desc: "Explore engineering branches and careers" },
      { to: "/about", label: "About Us", icon: Info, desc: "Learn about the JEE Prep Hub ecosystem" },
      { to: "/developer", label: "Developer Portal", icon: Code2, desc: "Explore the public GitHub project" },
      { to: "/official", label: "Official", icon: BadgeCheck, desc: "Official JEE Prep Hub resources and links" },
      { to: "/legal", label: "About & Policies", icon: ShieldCheck, desc: "Who we are, rules & all documents" },
    ],
  },
  {
    id: "admin",
    title: "Admin Panel",
    icon: ShieldAlert,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    admin: true,
    items: [
      { to: "/admin", label: "Admin Center", icon: LayoutDashboard, desc: "Overview of all admin tools" },
      { to: "/admin/system", label: "System Control Center", icon: ShieldCheck, desc: "Securely manage platform AI credentials" },
      { to: "/admin/users", label: "User Management", icon: ShieldCheck, desc: "Roles & member search" },
      { to: "/admin/materials", label: "Manage Materials", icon: FileText, desc: "Upload & edit resources" },
      { to: "/admin/tests", label: "Manage Tests", icon: FileText, desc: "CBT tests & questions" },
      { to: "/admin/tests/approvals", label: "CBT Approvals", icon: BadgeCheck, desc: "Review learner-made tests" },
      { to: "/admin/scheduled-tests", label: "Scheduled AI Tests", icon: CalendarClock, desc: "Monitor automated test generation" },
      { to: "/admin/videos", label: "Video Lectures", icon: Video, desc: "Manage Pulse lectures" },
      { to: "/admin/community", label: "Manage Community", icon: MessageCircle, desc: "WhatsApp & groups" },
      { to: "/admin/notifications", label: "Send Notifications", icon: Megaphone, desc: "Broadcast announcements" },
      { to: "/admin/notices", label: "Manage Notice Board", icon: Megaphone, desc: "Publish official updates" },
      { to: "/admin/nta", label: "NTA Sync", icon: RefreshCw, desc: "Fetch official JEE Main updates" },
      { to: "/admin/certificates", label: "Manage Certificates", icon: BadgeCheck, desc: "Types & awards" },
      { to: "/admin/toppers", label: "Manage Toppers", icon: Trophy, desc: "Add JEE/NEET AIR toppers" },
      { to: "/admin/feedback", label: "Feedback Console", icon: MessageCircle, desc: "Review feedback & requests" },
      { to: "/admin/search-analytics", label: "Search Analytics", icon: Search, desc: "See what students search for" },
      { to: "/admin/audit", label: "Audit Log", icon: Bell, desc: "Admin actions & sign-ins" },
    ],
  },
];

const itemCls =
  "feature-menu-item liquid-lens-item liquid-lens-flat liquid-glass-card group flex w-full min-w-0 max-w-full items-center gap-3 rounded-2xl px-2.5 py-2.5";

/* ------------------------------------------------------------------ */
/*  Menu body — collapsible groups + search                            */
/* ------------------------------------------------------------------ */
function MenuBody({
  groups,
  query,
  pathname,
  onNavigate,
  userId,
}: {
  groups: Group[];
  query: string;
  pathname: string;
  onNavigate: () => void;
  userId?: string;
}) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const q = query.trim().toLowerCase();

  const filtered = groups
    .map((g) => ({
      ...g,
      items: q
        ? g.items.filter(
            (i) => i.label.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q),
          )
        : g.items,
    }))
    .filter((g) => g.items.length > 0);

  if (filtered.length === 0) {
    return (
      <p className="px-3 py-10 text-center text-sm text-muted-foreground">
        No features match “{query}”.
      </p>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      {filtered.map((g) => {
        const hasActive = g.items.some((i) => i.to === pathname);
        const open = q ? true : (openMap[g.id] ?? (!!g.defaultOpen || hasActive));

        return (
          <section key={g.id} className="min-w-0">
            <button
              type="button"
              onClick={() => setOpenMap((m) => ({ ...m, [g.id]: !open }))}
              aria-expanded={open}
              className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-2 text-left"
            >
              <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", g.bg, g.color)}>
                <g.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] font-bold uppercase tracking-wide text-foreground/80">
                {g.title}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {g.items.length}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>

            {open && (
              <div className="ml-3.5 mt-1 mb-1 flex min-w-0 flex-col gap-1.5 border-l border-border/50 pl-2.5">
                {g.items.map((f) => {
                  const active = f.to === pathname;
                  const inner = (
                    <>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                        <f.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold leading-tight">{f.label}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{f.desc}</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    </>
                  );

                  return f.to === "/profile" && userId ? (
                    <Link
                      key={f.label}
                      to="/u/$userId"
                      params={{ userId }}
                      onClick={onNavigate}
                      className={cn(itemCls, active && "ring-2 ring-primary/40")}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <Link
                      key={f.label}
                      to={f.to}
                      params={f.params as any}
                      onClick={onNavigate}
                      className={cn(itemCls, active && "ring-2 ring-primary/40")}
                    >
                      {inner}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function StyleSwitch({ style, onChange }: { style: MenuStyle; onChange: (s: MenuStyle) => void }) {
  const options: { key: MenuStyle; label: string; icon: any }[] = [
    { key: "drawer", label: "Side drawer", icon: PanelLeft },
    { key: "sheet", label: "Bottom sheet", icon: PanelBottom },
  ];
  return (
    <div className="feature-menu-style-switch flex min-w-0 items-center gap-1 rounded-full border border-border/60 bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={style === o.key}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
            style === o.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <o.icon className="h-3.5 w-3.5" /> {o.label}
        </button>
      ))}
    </div>
  );
}

export function FeaturesSlideMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const { style, setStyle } = useMenuStyle();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduceMotion = useReducedMotion();
  const menuTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.17, ease: [0.2, 0.75, 0.25, 1] as const };

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const groups = allGroups
    .filter((g) => !g.admin || isAdmin)
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !(user && i.hideWhenSignedIn)),
    }))
    .filter((g) => g.items.length > 0);

  const header = (
    <div className="feature-menu-header flex min-w-0 items-center gap-3">
      <Logo className="h-9 w-9 shrink-0 md:h-11 md:w-11" />
      <div className="min-w-0 flex-1 text-left">
        <Dialog.Title className="truncate font-display text-base font-semibold leading-tight">
          JEE Prep Hub
        </Dialog.Title>
        <p className="truncate text-[11px] text-muted-foreground">All features, one tap away</p>
      </div>
      <Dialog.Close
        aria-label="Close menu"
        className="nav-glass-btn grid h-9 w-9 shrink-0 place-items-center rounded-full"
      >
        <X className="h-4 w-4" />
      </Dialog.Close>
    </div>
  );

  const searchBar = (
    <div className="feature-menu-search mt-3 flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border/60 bg-muted px-3.5 py-2">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search features"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {query && (
        <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );

  const footer = (
    <div className="flex min-w-0 flex-col gap-2.5">
      <StyleSwitch style={style} onChange={setStyle} />
      {user ? (
        <Link
          to="/dashboard"
          onClick={close}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <Link
          to="/auth"
          onClick={close}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          <LogIn className="h-4 w-4" /> Sign in / Sign up
        </Link>
      )}
    </div>
  );

  const body = (
    <MenuBody
      groups={groups}
      query={query}
      pathname={pathname}
      onNavigate={close}
      userId={user?.id}
    />
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <Dialog.Trigger asChild>
        <motion.button
          type="button"
          whileTap={reduceMotion ? undefined : { scale: 0.985 }}
          transition={menuTransition}
          className="feature-menu-trigger nav-glass-btn inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold"
        >
          <Menu className="h-4 w-4" /> Menu
        </motion.button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="feature-menu-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-50 bg-foreground/30"
        />
        {style === "sheet" ? (
          <Dialog.Content
            className="feature-menu-content feature-menu-mobile-surface data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:fade-out-0 liquid-glass-card fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-[2.2rem] p-0"
            aria-describedby={undefined}
          >
            <motion.div
              className="feature-menu-shell flex min-h-0 flex-1 flex-col"
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              transition={menuTransition}
            >
              <div className="flex justify-center pt-2.5 pb-1">
                <span className="h-1.5 w-11 rounded-full bg-foreground/25" aria-hidden />
              </div>
              <div className="feature-menu-section feature-menu-header-section border-b border-border/50 px-4 pb-3">
                {header}
                {searchBar}
              </div>
              <nav className="feature-menu-section feature-menu-nav min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-3">{body}</nav>
              <div className="feature-menu-section feature-menu-footer shrink-0 border-t border-border/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
                {footer}
              </div>
            </motion.div>
          </Dialog.Content>
        ) : (
          <Dialog.Content
            className="feature-menu-content feature-menu-mobile-surface data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=closed]:fade-out-0 liquid-glass-card fixed inset-y-0 left-0 z-50 flex w-[92vw] max-w-sm flex-col p-0 sm:w-[400px]"
            aria-describedby={undefined}
          >
            <motion.div
              className="feature-menu-shell flex min-h-0 flex-1 flex-col"
              initial={{ x: -8 }}
              animate={{ x: 0 }}
              transition={menuTransition}
            >
              <div className="feature-menu-section feature-menu-header-section shrink-0 border-b border-border/50 px-4 py-3.5">
                {header}
                {searchBar}
              </div>
              <nav className="feature-menu-section feature-menu-nav min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-3">{body}</nav>
              <div className="feature-menu-section feature-menu-footer shrink-0 border-t border-border/50 p-3">{footer}</div>
            </motion.div>
          </Dialog.Content>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
      }
