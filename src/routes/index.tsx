import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Atom,
  FlaskConical,
  Sigma,
  Timer,
  Users,
  Trophy,
  BookOpen,
  ArrowRight,
  MessageCircle,
  Send,
  ExternalLink,
  Rss,
  Sparkles,
  Megaphone,
  Pin,
  History,
  Swords,
  CalendarDays,
  ClipboardList,
  Bot,
  Building2,
  Info,
  BadgeCheck,
} from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { getLandingData } from "@/lib/landing.functions";
import type { LandingData } from "@/lib/landing.functions";
import ExamCountdown from "@/components/ExamCountdown";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { HomepageDemoVideo } from "@/components/HomepageDemoVideo";
import { ExpandableText } from "@/components/ExpandableText";
import {
  changelog,
  formatChangeDate,
  kindMeta,
  latestUpdate,
  totalChangeCount,
} from "@/lib/changelog";
import { ArticlesHomeSection } from "@/components/articles/ArticlesHomeSection";
import { DailyChecklist } from "@/components/DailyChecklist";
import { StreakMilestoneBadges } from "@/components/StreakMilestoneBadges";
import { OAUTH_RETURN_PATH_KEY, POST_LOGIN_CHOICE_KEY } from "@/lib/post-login-destination";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "JEE Prep Hub — Crack JEE Together" },
      { name: "twitter:description", content: "Curated materials, Pomodoro timer, leaderboard, live chat, and a focused community of JEE Class 11 & 12 aspirants." },
      { title: "JEE Prep Hub — Crack JEE Together" },
      {
        name: "description",
        content:
          "Curated materials, Pomodoro timer, leaderboard, live chat, and a focused community of JEE Class 11 & 12 aspirants.",
      },
      { property: "og:title", content: "JEE Prep Hub — Crack JEE Together" },
      { property: "og:site_name", content: "JEE Prep Hub" },
      {
        property: "og:description",
        content:
          "Curated materials, Pomodoro timer, leaderboard, live chat, and a focused community of JEE Class 11 & 12 aspirants.",
      },
      { property: "og:url", content: "https://jeeprephub.co.in/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://jeeprephub.co.in/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "JEE Prep Hub",
          url: "https://jeeprephub.co.in/",
          description:
            "Curated materials, Pomodoro timer, leaderboard, live chat, and a focused community of JEE Class 11 & 12 aspirants.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "JEE Prep Hub",
          url: "https://jeeprephub.co.in/",
        }),
      },
    ],
  }),
  component: LandingRedirect,
});

const subjectColor: Record<string, string> = {
  physics: "bg-physics/15 text-physics",
  chemistry: "bg-chemistry/15 text-chemistry",
  mathematics: "bg-mathematics/15 text-mathematics",
};

const quickActions = [
  { icon: Timer, label: "Focus timer", to: "/timer" },
  { icon: BookOpen, label: "Materials", to: "/materials" },
  { icon: Swords, label: "Quiz arena", to: "/quiz" },
  { icon: ClipboardList, label: "Test series", to: "/tests" },
  { icon: MessageCircle, label: "Community", to: "/community" },
  { icon: CalendarDays, label: "Planner", to: "/planner" },
  { icon: Bot, label: "AI chat", to: "/ai-chat" },
  { icon: Trophy, label: "Leaderboard", to: "/leaderboard" },
] as const;

function LandingRedirect() {
  const data = Route.useLoaderData() as LandingData;
  return <Landing data={data} />;
}

export function Landing({ data }: { data: LandingData }) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin(user?.id);

  const materials = data?.materials ?? [];
  const groups = data?.groups ?? [];
  const notices = data?.notices ?? [];
  const counts = data?.counts ?? { materials: 0, groups: 0 };

  useEffect(() => {
    if (authLoading || !user) return;
    try {
      const oauthDestination = window.sessionStorage.getItem(OAUTH_RETURN_PATH_KEY);
      if (oauthDestination) {
        window.sessionStorage.removeItem(OAUTH_RETURN_PATH_KEY);
        void navigate({ to: oauthDestination as never, replace: true });
      } else if (window.sessionStorage.getItem(POST_LOGIN_CHOICE_KEY) === "pending") {
        void navigate({ to: "/start", replace: true });
      }
    } catch {
      // Keep the homepage available if browser session storage is disabled.
    }
  }, [authLoading, navigate, user]);

  return (
    <div className="min-h-screen">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-5 sm:pt-8">
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <GlassSurface className="relative overflow-hidden rounded-3xl p-6 sm:p-9">
            <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
            <span className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

            <Link
              to="/updates"
              className="relative inline-flex max-w-full items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="truncate">{latestUpdate.headline ?? "Latest update"}</span>
              <span className="shrink-0 opacity-70">· {formatChangeDate(latestUpdate.date)}</span>
            </Link>

            <h1 className="relative mt-5 font-display text-[2rem] font-bold leading-[1.08] tracking-tight sm:text-6xl">
              <span className="text-liquid">Crack JEE</span>
              <br />
              with focus, materials
              <br className="hidden sm:block" /> and a squad.
            </h1>
            <p className="relative mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
              Everything a Class 11, 12 or dropper aspirant needs — study material, CBT mock tests,
              a focus timer, quizzes and a community that actually shows up. Open it all without an
              account.
            </p>

            <div className="relative mt-6 flex flex-wrap gap-2.5">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95"
              >
                Start studying <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/community"
                className="inline-flex items-center gap-2 glass-surface glass-surface-interactive rounded-2xl px-5 py-3 text-sm font-semibold"
              >
                Join community <MessageCircle className="h-4 w-4" />
              </Link>
            </div>

            <dl className="relative mt-7 grid grid-cols-3 gap-2 sm:max-w-md">
              <Stat label="Materials" value={`${counts.materials}+`} />
              <Stat label="Groups" value={`${counts.groups}`} />
              <Stat label="Updates" value={`${totalChangeCount()}`} />
            </dl>
          </GlassSurface>

          <div className="grid gap-4">
            <ExamCountdown isAdmin={isAdmin} />
            <GlassSurface className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Jump straight in
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {quickActions.map((a) => (
                  <Link
                    key={a.label}
                    to={a.to}
                    className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/30 p-2 text-center transition hover:bg-muted/60"
                  >
                    <a.icon className="h-4.5 w-4.5 text-accent" />
                    <span className="text-[10px] font-semibold leading-tight">{a.label}</span>
                  </Link>
                ))}
              </div>
            </GlassSurface>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl px-4 pb-8 sm:px-5"
        aria-labelledby="personal-study-heading"
      >
        {user ? (
          <div>
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
                Your momentum
              </p>
              <h2
                id="personal-study-heading"
                className="mt-1 font-display text-2xl font-bold sm:text-3xl"
              >
                Make today count
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Track your habits, keep your streak alive, and plan the next study move.
              </p>
            </div>
            <DailyChecklist userId={user.id} />
            <div className="mt-4">
              <StreakMilestoneBadges userId={user.id} compact />
            </div>
          </div>
        ) : (
          <GlassSurface className="flex flex-col items-start justify-between gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
                Personal study dashboard
              </p>
              <h2 id="personal-study-heading" className="mt-1 font-display text-2xl font-bold">
                Build a streak that sticks
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Sign in to create daily targets, tick your study habits, and see your best streak.
              </p>
            </div>
            <Link
              to="/auth"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Sign in to track <ArrowRight className="h-4 w-4" />
            </Link>
          </GlassSurface>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-5" aria-label="Explore JEE Prep Hub">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            {
              to: "/engineering",
              label: "Engineering",
              description: "Branches, careers & insights",
              icon: Building2,
            },
            {
              to: "/about",
              label: "About Us",
              description: "Get to know JEE Prep Hub",
              icon: Info,
            },
            {
              to: "/official",
              label: "Official",
              description: "Official links & resources",
              icon: BadgeCheck,
            },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-label={`${item.label}: ${item.description}`}
              className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-3 transition-colors hover:border-primary/40 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{item.label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <ArrowRight
                className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl px-4 pb-8 sm:px-5"
        aria-labelledby="help-support-heading"
      >
        <div className="mb-4">
          <h2
            id="help-support-heading"
            className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl"
          >
            <MessageCircle className="h-6 w-6 text-accent" /> Help & Support
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Need help or have an idea? Reach the team or help us improve JEE Prep Hub.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              to: "/contact",
              label: "Contact the team",
              description: "Ask a question or get help with your account and study journey.",
              icon: Send,
            },
            {
              to: "/feedback",
              label: "Share feedback",
              description: "Report a bug, suggest an improvement, or ask a product question.",
              icon: MessageCircle,
            },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 transition-colors hover:border-primary/40 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <ArrowRight
                className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>
      <ArticlesHomeSection
        canWrite={Boolean(user && !(user as typeof user & { is_anonymous?: boolean }).is_anonymous)}
      />

      {/* ── What's new ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
              <History className="h-6 w-6 text-accent" /> What's new
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every change to the site, day by day — features, fixes and design updates.
            </p>
          </div>
          <Link
            to="/updates"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Full history <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {changelog.slice(0, 3).map((day, i) => (
            <GlassSurface key={day.date} interactive as={Link} to="/updates" className="block p-4">
              <div className="flex items-center gap-2">
                <time className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {formatChangeDate(day.date)}
                </time>
                {i === 0 && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    Latest
                  </span>
                )}
              </div>
              <h3 className="mt-2 font-semibold leading-snug">{day.headline ?? day.version}</h3>
              <ul className="mt-3 space-y-2">
                {day.items.slice(0, 3).map((it) => (
                  <li key={it.title} className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${kindMeta[it.kind].className}`}
                    >
                      {kindMeta[it.kind].label}
                    </span>
                    <span className="text-xs text-muted-foreground">{it.title}</span>
                  </li>
                ))}
              </ul>
            </GlassSurface>
          ))}
        </div>
      </section>

      <HomepageDemoVideo />

      {/* ── Quiz Arena ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <GlassSurface
            as={Link}
            to="/quiz"
            interactive
            className="group relative block overflow-hidden rounded-3xl p-6"
          >
            <span className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-primary/25 blur-3xl" />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Free · no sign-up to try
            </p>
            <h2 className="text-liquid relative mt-2 font-display text-2xl font-bold">
              Daily Challenge
            </h2>
            <p className="relative mt-1 text-sm text-muted-foreground">
              Ten questions a day, identical for every aspirant. Instant solutions after you submit.
            </p>
            <span className="relative mt-4 inline-block text-sm font-semibold text-primary group-hover:underline">
              Play today's quiz →
            </span>
          </GlassSurface>
          <GlassSurface
            as={Link}
            to="/quiz"
            interactive
            className="group relative block overflow-hidden rounded-3xl p-6"
          >
            <span className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-accent/25 blur-3xl" />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Thousands of questions
            </p>
            <h2 className="relative mt-2 font-display text-2xl font-bold">Question Battle</h2>
            <p className="relative mt-1 text-sm text-muted-foreground">
              Rapid-fire rounds drawn from the full test-series bank — pick Physics, Chemistry or
              Maths.
            </p>
            <span className="relative mt-4 inline-block text-sm font-semibold text-primary group-hover:underline">
              Enter the arena →
            </span>
          </GlassSurface>
        </div>
      </section>

      {/* ── Notice board ───────────────────────────────────── */}
      {notices.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
                <Megaphone className="h-6 w-6 text-accent" /> Notice Board
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest announcements, exam updates and events — no sign-in needed.
              </p>
            </div>
            <Link
              to="/notices"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {notices.map((n) => (
              <GlassSurface as="article" key={n.id} interactive className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 font-semibold leading-snug">
                    {n.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-accent" />}
                    {n.title}
                  </h3>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {n.category}
                  </span>
                </div>
                <ExpandableText
                  text={n.body}
                  chars={160}
                  className="mt-2 text-xs text-muted-foreground"
                />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString("en-GB")}
                  </span>
                  {n.link_url ? (
                    <a
                      href={n.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                    >
                      {n.link_label ?? "Open"} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <Link
                      to="/notices"
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      Read more →
                    </Link>
                  )}
                </div>
              </GlassSurface>
            ))}
          </div>
        </section>
      )}

      {/* ── Materials ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Latest study materials</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Curated notes, modules, PYQs and tests — open without signing in.
            </p>
          </div>
          <Link
            to="/materials"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {materials.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Materials are being added soon.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <GlassSurface as="article" key={m.id} interactive className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug">{m.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${subjectColor[m.subject] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {m.subject}
                  </span>
                </div>
                {m.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="rounded bg-muted px-2 py-0.5">{m.resource_type}</span>
                  {m.topic && (
                    <span className="rounded bg-muted px-2 py-0.5 normal-case tracking-normal">
                      {m.topic}
                    </span>
                  )}
                </div>
                <a
                  href={m.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open resource
                </a>
              </GlassSurface>
            ))}
          </div>
        )}
      </section>

      {/* ── Community groups ───────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Join the community</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Live chat on the site + WhatsApp groups for every need.
            </p>
          </div>
          <Link
            to="/community"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <GlassSurface
              as="a"
              key={g.id}
              href={g.invite_url}
              target="_blank"
              rel="noopener noreferrer"
              interactive
              className="group block p-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{g.icon_emoji ?? "💬"}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {g.category}
                </span>
              </div>
              <h3 className="mt-3 font-semibold leading-snug">{g.name}</h3>
              {g.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{g.description}</p>
              )}
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">
                Join group <ExternalLink className="h-3 w-3" />
              </span>
            </GlassSurface>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-5">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Everything you need to prep</h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "Curated Materials",
              desc: "Notes, modules, PYQs and test series — organized by subject, class, and topic.",
              to: "/materials",
            },
            {
              icon: Timer,
              title: "Focus Timer",
              desc: "Pomodoro + stopwatch that tracks every minute of focused study.",
              to: "/timer",
            },
            {
              icon: Users,
              title: "Study Squads",
              desc: "Form groups, share doubts, and stay accountable together.",
              to: "/groups",
            },
            {
              icon: Trophy,
              title: "Leaderboard",
              desc: "Healthy competition based on study hours and contribution.",
              to: "/leaderboard",
            },
            {
              icon: Rss,
              title: "Social Feed",
              desc: "Ask anything, share wins, like and comment — all in one feed.",
              to: "/feed",
            },
            {
              icon: Sparkles,
              title: "Certificates",
              desc: "Earn verifiable certificates for streaks, study hours and milestones.",
              to: "/certificates",
            },
          ].map((f) => (
            <GlassSurface as={Link} key={f.title} to={f.to} interactive className="group block p-5">
              <f.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">
                Explore <ArrowRight className="h-3 w-3" />
              </span>
            </GlassSurface>
          ))}
        </div>
      </section>

      {/* ── Subjects ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: Atom, name: "Physics", color: "text-physics", to: "/materials" },
            { icon: FlaskConical, name: "Chemistry", color: "text-chemistry", to: "/materials" },
            {
              icon: Sigma,
              name: "Mathematics",
              color: "text-mathematics",
              to: "/jee-advanced-math-problems",
            },
          ].map((s) => (
            <GlassSurface as={Link} key={s.name} to={s.to} interactive className="block p-5">
              <s.icon className={`h-7 w-7 ${s.color}`} />
              <h3 className="mt-3 font-display text-lg font-semibold">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Class 11, 12 and Droppers — organized topic-by-topic.
              </p>
            </GlassSurface>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 pb-20 text-center sm:px-5">
        <GlassSurface className="rounded-3xl p-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Ready to start your JEE 2028 journey?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Free to join. No email confirmation required.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95"
            >
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/updates"
              className="inline-flex items-center gap-2 glass-surface glass-surface-interactive rounded-2xl px-6 py-3 text-sm font-semibold"
            >
              See all updates <History className="h-4 w-4" />
            </Link>
          </div>
        </GlassSurface>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <Link to="/updates" className="font-semibold text-accent hover:underline">
          Updates & history
        </Link>
        <span className="mx-2 opacity-50">·</span>
        Built by aspirants, for aspirants. <Sigma className="inline h-3 w-3" />
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/30 p-3">
      <dd className="font-display text-xl font-bold">{value}</dd>
      <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
    </div>
  );
}
