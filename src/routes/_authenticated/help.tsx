import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  LifeBuoy,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Users,
  Video,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Help Center — PREPWIAN" },
      { property: "og:description", content: "Step-by-step guides for study materials, tests, JEE 360 planning, focus, and account support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Help Center — PREPWIAN" },
      { name: "twitter:description", content: "Step-by-step guides for study materials, tests, JEE 360 planning, focus, and account support." },

      { title: "Help Center — PREPWIAN" },
      {
        name: "description",
        content:
          "Step-by-step guides for study materials, tests, JEE 360 planning, focus, and account support.",
      },
    ],
  }),
  component: HelpCenterPage,
});

type Guide = {
  title: string;
  category: string;
  description: string;
  icon: LucideIcon;
  href: string;
  tags: string;
  steps: string[];
};

const guides: Guide[] = [
  {
    title: "Start with one clear next action",
    category: "Getting started",
    description:
      "Turn a busy dashboard into one useful study decision instead of trying to do everything at once.",
    icon: Target,
    href: "/dashboard",
    tags: "first steps home dashboard beginner today routine",
    steps: [
      "Open your dashboard and scan the study or test activity shown there.",
      "Choose one specific task: a chapter, a lecture, or a short practice set.",
      "After the session, write down the next small action you want to take.",
    ],
  },
  {
    title: "Find a resource by subject or class",
    category: "Study",
    description: "Narrow the materials library before searching so the results are easier to scan.",
    icon: BookOpen,
    href: "/materials",
    tags: "materials library physics chemistry mathematics class 11 12 dropper pdf books notes pyq dpp",
    steps: [
      "Choose a subject and class filter that match your current syllabus.",
      "Search with a chapter name or resource type such as PYQ, DPP, formula, or module.",
      "Open a resource and check its label/access note before relying on it.",
    ],
  },
  {
    title: "Keep lecture progress organized",
    category: "Study",
    description: "Use Lecture Tracker to keep planned lessons and watched progress in one list.",
    icon: Video,
    href: "/lecture-tracker",
    tags: "lecture tracker add source url planned date duration progress completed pending video watch",
    steps: [
      "Select Add Lecture, then enter a subject and a title you will recognize later.",
      "Add duration and a planned date; source, video link, and personal notes are optional.",
      "Update the lecture status as you work so the pending list stays meaningful.",
    ],
  },
  {
    title: "Browse your notes by class and subject",
    category: "Study",
    description:
      "Open the Notes area and use the class, subject, and chapter structure available to your account.",
    icon: FileText,
    href: "/notes/",
    tags: "notes chapters class subject revision notebook formula",
    steps: [
      "Start from Notes and choose the class and subject you are studying.",
      "Open the relevant chapter rather than jumping between unrelated topics.",
      "Pair reading with a few practice questions and note what still feels unclear.",
    ],
  },
  {
    title: "Explore lessons and learning updates",
    category: "Study",
    description:
      "Use Pulse to discover the learning or video items currently available in the app.",
    icon: Video,
    href: "/pulse",
    tags: "pulse video lesson lecture playlist watch learning updates",
    steps: [
      "Open Pulse and browse the items currently available to you.",
      "Choose one lesson that matches your syllabus and available study time.",
      "After watching, write a one-line takeaway or the next question to solve.",
    ],
  },
  {
    title: "Choose a test that fits your session",
    category: "Practice",
    description:
      "Use Test Series filters and tabs to find available tests, saved tests, or previous attempts.",
    icon: FileText,
    href: "/tests",
    tags: "test series exam mock test live saved history subject physics chemistry maths biology mixed free",
    steps: [
      "Browse the Series tab; use the subject, search, or availability filters to narrow the list.",
      "Check the test name, duration, marks, and any access label before starting.",
      "Use Saved or History when you want to return to a bookmarked test or an earlier attempt.",
    ],
  },
  {
    title: "Navigate a computer-based test",
    category: "Practice",
    description: "Know the controls before the clock is running so you can focus on the questions.",
    icon: CheckCircle2,
    href: "/tests",
    tags: "attempt question palette mark for review save next clear answer calculator submit keyboard shortcuts",
    steps: [
      "Read the test instructions and note the duration and marks shown for each question.",
      "Use Save & Next to move through questions; mark a question for review if you want to revisit it.",
      "Before submitting, use the question palette to check unanswered and marked questions.",
    ],
  },
  {
    title: "Review a test and decide what to revise",
    category: "Practice",
    description:
      "Treat an attempt as feedback: identify one concept to revisit and one action to take next.",
    icon: Trophy,
    href: "/tests",
    tags: "result score attempt analytics history mistakes wrong answers revision",
    steps: [
      "Open the History tab in Test Series and select a submitted attempt.",
      "Review the score and any question-level analysis shown for that test.",
      "Turn a repeated gap into a chapter revision, a backlog item, or a short follow-up practice set.",
    ],
  },
  {
    title: "Build a realistic weekly schedule",
    category: "Planning",
    description: "Use the JEE 360 schedule to see planned lectures and tests by day and subject.",
    icon: CalendarDays,
    href: "/jee360/schedule",
    tags: "calendar week schedule lectures tests previous next today filter subject timetable",
    steps: [
      "Use Previous week, Today, or Next week to reach the week you want to plan.",
      "Select a day to see its planned lectures and tests; filter by subject when useful.",
      "Leave space for review and recovery rather than filling every available hour.",
    ],
  },
  {
    title: "Make backlog feel manageable",
    category: "Planning",
    description:
      "Break missed or older chapters into trackable items with a catch-up date and status.",
    icon: GraduationCap,
    href: "/jee360/backlog",
    tags: "backlog missed lecture catch up chapter priority open catching up cleared recovery",
    steps: [
      "Open Backlog; missed scheduled lectures can appear there, and older chapters can be added manually.",
      "Give the item a clear chapter title, subject, priority, and a realistic catch-up date.",
      "Move it through Open, Catching up, and Cleared as your work changes.",
    ],
  },
  {
    title: "Import a coaching timetable into JEE 360",
    category: "Planning",
    description:
      "Convert a timetable to the supported JSON format, then import it as a merge or replacement.",
    icon: FileText,
    href: "/jee360/upload",
    tags: "import planner json coaching pdf excel timetable upload merge replace chatgpt",
    steps: [
      "Open Import and use its prompt/schema to prepare a supported JSON timetable.",
      "Check the current planner and choose Merge or Replace deliberately; Replace replaces current planner data.",
      "Import the file or paste the JSON, then review the resulting lectures in JEE 360.",
    ],
  },
  {
    title: "Back up or move your JEE 360 planner",
    category: "Planning",
    description:
      "JEE 360 keeps planner data in this browser, so export a copy before changing browsers or clearing site data.",
    icon: ShieldCheck,
    href: "/jee360/upload",
    tags: "backup export local storage browser device sync data lost transfer restore json",
    steps: [
      "Open Import and use Export JSON to download a copy of your current planner.",
      "Store the file somewhere you control; do not include private details in a public link.",
      "On the other browser, use Import and verify the result before selecting Replace or Merge.",
    ],
  },
  {
    title: "Set up a focused study block",
    category: "Planning",
    description:
      "The Focus Workspace includes Pomodoro presets, a stopwatch, a custom countdown, and session notes.",
    icon: Timer,
    href: "/timer",
    tags: "focus pomodoro stopwatch countdown custom 15 25 50 90 minutes session subject note fullscreen deep focus",
    steps: [
      "Choose Pomodoro or Stopwatch; Pomodoro has presets and a custom countdown.",
      "Select the subject and add a short chapter note before starting, if helpful.",
      "Use Pause or Deep focus when needed, then check Session history afterward.",
    ],
  },
  {
    title: "Use JEE 360 plans and reminders",
    category: "Planning",
    description:
      "Explore the Plans and Reminders sections to organize upcoming study work and notifications.",
    icon: Sparkles,
    href: "/jee360/plans",
    tags: "jee 360 plans reminders notifications targets organize goals",
    steps: [
      "Open Plans from the JEE 360 navigation and review the planning options shown there.",
      "Keep targets specific enough to finish in one sitting, then adjust them as your week changes.",
      "Check Reminders separately if you want to review or configure planner notifications.",
    ],
  },
  {
    title: "Review progress and recent wins",
    category: "Progress",
    description:
      "Use your dashboard as a check-in, not a judgement: look for trends and choose what to do next.",
    icon: Trophy,
    href: "/dashboard",
    tags: "progress dashboard activity score xp streak recent unlocks analytics performance",
    steps: [
      "Review the activity, test attempts, and progress cards available on your dashboard.",
      "Compare patterns over time where history is shown; one score is only one data point.",
      "Choose a concrete follow-up: revise a weak topic, schedule a session, or try another test.",
    ],
  },
  {
    title: "Find and verify a certificate",
    category: "Progress",
    description: "Check the certificates area using the account that earned the achievement.",
    icon: CheckCircle2,
    href: "/certificates",
    tags: "certificate achievement award verify missing earned download",
    steps: [
      "Open Certificates while signed in to the account associated with the achievement.",
      "Check the award name and any date or eligibility details shown on the page.",
      "If it is still missing, contact support with the achievement name and relevant date.",
    ],
  },
  {
    title: "Ask a clear question in Community",
    category: "Community & safety",
    description:
      "A focused question is easier for classmates to answer and keeps discussions useful.",
    icon: Users,
    href: "/community",
    tags: "community doubt discussion post question answer classmates",
    steps: [
      "State the subject, chapter, and exact step where you got stuck.",
      "Share your attempt and what you already tried; remove personal details first.",
      "Keep replies respectful and use any moderation/reporting controls shown in the app.",
    ],
  },
  {
    title: "Keep your account and messages safe",
    category: "Community & safety",
    description:
      "Protect passwords, verification codes, and private contact details in every app area.",
    icon: ShieldCheck,
    href: "/settings",
    tags: "privacy security account password otp one time code direct messages credentials safety",
    steps: [
      "Use only the account you intend to use and review the profile/settings pages when needed.",
      "Never send passwords, one-time codes, payment details, or private keys in a message or support request.",
      "If a message or post seems unsafe, stop engaging and contact support with a concise description.",
    ],
  },
  {
    title: "Send a support request that can be acted on",
    category: "Account & support",
    description:
      "A short, specific report helps the team reproduce an issue and point you to the right fix.",
    icon: LifeBuoy,
    href: "/contact",
    tags: "contact admin support technical issue bug error response time screenshot attach help",
    steps: [
      "Name the page or feature and what you were trying to do.",
      "Include what happened, what you expected, steps to reproduce, and any visible error text.",
      "Do not include passwords or codes; the contact form currently asks you to describe screenshots rather than upload them.",
    ],
  },
];

const categories = ["All", ...Array.from(new Set(guides.map((guide) => guide.category)))];
const starterSteps = [
  {
    number: "01",
    title: "Choose",
    description: "Pick one topic or lecture to work on.",
    href: "/materials",
    linkLabel: "Browse materials",
  },
  {
    number: "02",
    title: "Practice",
    description: "Try a small set or a test that fits your time.",
    href: "/tests",
    linkLabel: "Open Test Series",
  },
  {
    number: "03",
    title: "Review",
    description: "Capture one mistake and schedule the next step.",
    href: "/jee360",
    linkLabel: "Open JEE 360",
  },
];

function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return guides.filter((guide) => {
      const text = [guide.title, guide.category, guide.description, guide.tags, ...guide.steps]
        .join(" ")
        .toLowerCase();
      return (
        (category === "All" || guide.category === category) &&
        terms.every((term) => text.includes(term))
      );
    });
  }, [category, normalizedQuery]);

  return (
    <AppShell>
      <main className="mx-auto w-full min-w-0 max-w-6xl space-y-5 overflow-x-clip px-3 py-3 [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)] sm:space-y-6 sm:px-5 sm:py-7 lg:px-8">
        <header className="relative isolate overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft sm:rounded-3xl sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 -z-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> PREPWIAN · SUPPORT
          </div>
          <h1 className="mt-4 break-words font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Help Center
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Practical, step-by-step help for study materials, tests, JEE 360, focus sessions,
            progress, and your account.
          </p>
          <label className="mt-5 flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-border bg-background/80 px-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 sm:max-w-2xl">
            <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search a feature, task, or problem…"
              aria-label="Search help guides"
              aria-controls="help-guides"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear help search"
                className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                Clear
              </button>
            )}
          </label>
          <p className="mt-2 text-xs text-muted-foreground">
            Search by words like “backlog”, “test answer”, “planner backup”, or “certificate”.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/faq"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background/70 px-3 text-sm font-medium hover:border-primary/40 hover:bg-primary/5"
            >
              Browse frequently asked questions <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/contact"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background/70 px-3 text-sm font-medium hover:border-primary/40 hover:bg-primary/5"
            >
              Contact support <LifeBuoy className="h-4 w-4" />
            </a>
          </div>
        </header>

        <section
          aria-labelledby="study-loop-heading"
          className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:rounded-3xl sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                A practical routine
              </p>
              <h2 id="study-loop-heading" className="mt-1 text-lg font-bold sm:text-xl">
                A simple study loop
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">Make the next step clear, not perfect.</p>
          </div>
          <ol className="grid gap-3 md:grid-cols-3">
            {starterSteps.map((step) => (
              <li
                key={step.number}
                className="rounded-2xl border border-border/80 bg-background/60 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
                <a
                  href={step.href}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  {step.linkLabel} <ArrowRight className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ol>
        </section>

        <nav
          aria-label="Help categories"
          className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
        >
          {categories.map((item) => {
            const count =
              item === "All"
                ? guides.length
                : guides.filter((guide) => guide.category === item).length;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${category === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"}`}
              >
                {item}{" "}
                <span
                  className={category === item ? "ml-1 opacity-80" : "ml-1 text-muted-foreground"}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <section id="help-guides" aria-labelledby="guides-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="guides-heading" className="text-lg font-bold sm:text-xl">
                Browse practical guides
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Each guide includes concrete steps and a direct link to the relevant area.
              </p>
            </div>
            <span
              aria-live="polite"
              aria-atomic="true"
              className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium"
            >
              {filtered.length} of {guides.length} guides
            </span>
          </div>
          {filtered.length ? (
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((guide) => {
                const Icon = guide.icon;
                return (
                  <a
                    key={guide.title}
                    href={guide.href}
                    className="group flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                        {guide.category}
                      </span>
                    </div>
                    <h3 className="mt-4 break-words font-semibold">{guide.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {guide.description}
                    </p>
                    <ol className="mt-4 flex-1 space-y-2 border-t border-border/70 pt-3">
                      {guide.steps.map((step, index) => (
                        <li
                          key={step}
                          className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
                        >
                          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Open this page{" "}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <Search aria-hidden="true" className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 font-semibold">No guides match those words</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a shorter search or choose another category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Reset search and filters
              </button>
            </div>
          )}
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Protect your planner data</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  One useful thing to know about JEE 360
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              JEE 360 stores its planner in this browser. It may not follow you to another browser
              or device. Use{" "}
              <a href="/jee360/upload" className="font-semibold text-primary hover:underline">
                Import → Export JSON
              </a>{" "}
              to keep a copy before clearing site data or changing devices.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LifeBuoy className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Before you contact support</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Give the team enough context to reproduce it
                </p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm leading-5 text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Page or feature name, plus what you were trying to do
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                What you expected, what happened, and exact error text
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Device/browser and approximate time; never include passwords or codes
              </li>
            </ul>
            <a
              href="/contact"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Open Contact Admin <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
