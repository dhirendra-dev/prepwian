import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Atom,
  Beaker,
  BookOpen,
  Brain,
  FileText,
  FlaskConical,
  Lightbulb,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { getLandingData, type LandingData } from "@/lib/landing.functions";
import { GlassSurface } from "@/components/GlassSurface";
import "./welcome.css";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Welcome to PREPWIAN" },
      { property: "og:description", content: "A calmer, smarter starting point for JEE Main, JEE Advanced and NEET preparation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Welcome to PREPWIAN" },
      { name: "twitter:description", content: "A calmer, smarter starting point for JEE Main, JEE Advanced and NEET preparation." },

      { title: "Welcome to PREPWIAN" },
      {
        name: "description",
        content:
          "A calmer, smarter starting point for JEE Main, JEE Advanced and NEET preparation.",
      },
    ],
  }),
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["welcome-data"],
      queryFn: () => getLandingData(),
    }),
  component: WelcomePage,
});

const subjects = [
  {
    name: "Physics",
    detail: "Concepts, problems & intuition",
    icon: Atom,
    to: "/jee-advanced-physics-problems",
    tone: "blue",
  },
  {
    name: "Chemistry",
    detail: "Reactions, revision & practice",
    icon: FlaskConical,
    to: "/jee-advanced-chemistry-problems",
    tone: "violet",
  },
  {
    name: "Mathematics",
    detail: "Patterns, methods & PYQs",
    icon: Brain,
    to: "/jee-advanced-math-problems",
    tone: "amber",
  },
  {
    name: "Biology",
    detail: "NEET diagrams & key ideas",
    icon: Beaker,
    to: "/materials",
    tone: "green",
  },
] as const;

const shortcuts = [
  { label: "Notes", detail: "Build your concepts", icon: FileText, to: "/notes" },
  { label: "PYQs", detail: "Learn from the exam", icon: Target, to: "/jee-predictor/pyq" },
  { label: "Lectures", detail: "Watch and understand", icon: PlayCircle, to: "/pulse" },
  { label: "Practice", detail: "Test your progress", icon: Zap, to: "/quiz" },
  { label: "Articles", detail: "Read smarter", icon: BookOpen, to: "/articles" },
] as const;

function WelcomePage() {
  const data = Route.useLoaderData() as LandingData;
  const materials = data.materials ?? [];
  const notices = data.notices ?? [];

  return (
    <main className="welcome-page relative isolate overflow-hidden pb-8">
      <div
        className="welcome-butterflies pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <span className="welcome-butterfly welcome-butterfly--one">🦋</span>
        <span className="welcome-butterfly welcome-butterfly--two">🦋</span>
        <span className="welcome-butterfly welcome-butterfly--three">🦋</span>
        <span className="welcome-butterfly welcome-butterfly--four">🦋</span>
        <span className="welcome-butterfly welcome-butterfly--five">🦋</span>
        <span className="welcome-butterfly welcome-butterfly--six">🦋</span>
        <span className="welcome-butterfly welcome-butterfly--seven">🦋</span>
        <span className="welcome-butterfly welcome-butterfly--eight">🦋</span>
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-9 pt-5 sm:px-6 sm:pb-12 sm:pt-10">
        <div className="welcome-hero relative overflow-hidden rounded-[2rem] border border-blue-200/70 bg-[linear-gradient(135deg,rgba(239,247,255,.98),rgba(255,255,255,.96)_55%,rgba(239,233,255,.95))] p-5 shadow-[0_28px_80px_-46px_rgba(30,64,175,.42)] dark:border-blue-200/15 dark:bg-[linear-gradient(135deg,rgba(18,38,78,.98),rgba(15,27,55,.98)_58%,rgba(40,27,76,.98))] sm:rounded-[2.5rem] sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-blue-800 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-blue-100">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> JEE Main · JEE Advanced · NEET
            </div>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-black leading-[1.02] tracking-tight text-slate-950 dark:text-white sm:text-6xl">
              Welcome to Your{" "}
              <span className="text-blue-600 dark:text-blue-300">Next Breakthrough</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-700 dark:text-blue-50/80 sm:text-base sm:leading-7">
              Start with one clear next step. Find the right note, question, lecture or article for
              the way you learn today—and keep moving with confidence.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Link
                to="/searches"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 active:scale-[.98] dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
              >
                Begin exploring <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/articles"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white/90 px-5 text-sm font-bold text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-blue-100 dark:hover:bg-white/15"
              >
                Read something useful <BookOpen className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-blue-100/70">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> You’re in a focused place to
              learn, practise, and grow.
            </p>
            <div
              className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-blue-100/70"
              aria-label="Quick searches"
            >
              {["JEE Main PYQs", "Thermodynamics", "Organic chemistry"].map((suggestion) => (
                <Link
                  key={suggestion}
                  to="/searches"
                  search={{ q: suggestion }}
                  className="rounded-full border border-blue-200/80 bg-white/75 px-3 py-1.5 transition hover:border-blue-400 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
                >
                  Search {suggestion}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-9 sm:px-6" aria-labelledby="subjects-heading">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Choose your lane
            </p>
            <h2 id="subjects-heading" className="mt-1 font-display text-2xl font-bold sm:text-3xl">
              Study by subject
            </h2>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Focused paths for every serious aspirant
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            return (
              <Link
                key={subject.name}
                to={subject.to}
                className={`welcome-subject welcome-subject--${subject.tone} group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/85 shadow-sm dark:bg-white/10">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold">{subject.name}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{subject.detail}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
                  Explore{" "}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-9 sm:px-6" aria-labelledby="shortcuts-heading">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Your study shelf
          </p>
          <h2 id="shortcuts-heading" className="mt-1 font-display text-2xl font-bold sm:text-3xl">
            Go straight to practice
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link
                key={shortcut.label}
                to={shortcut.to}
                className="group rounded-2xl border border-border/80 bg-card/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-bold">{shortcut.label}</h3>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                  {shortcut.detail}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {materials.length > 0 && (
        <section
          className="mx-auto max-w-6xl px-4 pb-9 sm:px-6"
          aria-labelledby="resources-heading"
        >
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                From the library
              </p>
              <h2
                id="resources-heading"
                className="mt-1 font-display text-2xl font-bold sm:text-3xl"
              >
                Recently added resources
              </h2>
            </div>
            <Link to="/materials" className="text-xs font-bold text-primary hover:underline">
              See all <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {materials.slice(0, 6).map((material) => (
              <a
                key={material.id}
                href={material.drive_url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-border/80 bg-card/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {material.subject}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {material.resource_type}
                  </span>
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-bold group-hover:text-primary">
                  {material.title}
                </h3>
                {material.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {material.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {notices.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-9 sm:px-6" aria-labelledby="updates-heading">
          <GlassSurface className="rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h2 id="updates-heading" className="font-display text-xl font-bold">
                What’s happening now
              </h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {notices.slice(0, 4).map((notice) => (
                <Link
                  key={notice.id}
                  to={notice.link_url?.startsWith("/") ? notice.link_url : "/notices"}
                  className="rounded-2xl border border-border/70 bg-background/75 p-4 transition hover:border-primary/40"
                >
                  <p className="text-xs font-bold">{notice.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {notice.body}
                  </p>
                </Link>
              ))}
            </div>
          </GlassSurface>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-5 sm:px-6">
        <div className="rounded-3xl border border-primary/15 bg-primary/[0.045] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold">
              <Trophy className="h-4 w-4 text-amber-500" /> Progress feels better together
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Find your study rhythm, join a focused community, and return tomorrow with one less
              thing to figure out.
            </p>
          </div>
          <Link
            to="/community"
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-background/90 px-4 text-xs font-bold text-primary transition hover:bg-background sm:mt-0"
          >
            Meet the community <Users className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
