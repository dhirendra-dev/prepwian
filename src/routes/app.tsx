import { createFileRoute } from "@tanstack/react-router";
import type * as React from "react";
import {
  ArrowDown, ArrowRight, BarChart3, BrainCircuit, CalendarDays, CheckCircle2,
  Clock3, Code2, Compass, Database, EyeOff, FileText, FlaskConical, Gauge,
  GraduationCap, Layers3, Lightbulb, LineChart, ListChecks, Network,
  Puzzle, Radar, Rocket, Scale, Server, ShieldCheck, Sparkles, Swords,
  Target, Timer, Users, Wrench, Zap,
} from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { getLandingData } from "@/lib/landing.functions";
import type { LandingData } from "@/lib/landing.functions";
import {
  changelog,
  formatChangeDate,
  kindMeta,
  totalChangeCount,
} from "@/lib/changelog";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { property: "og:description", content: "Explore JEE Prep Hub: a connected ecosystem for planning, learning, practice, analysis, focus, AI, resources and community." },
      { name: "twitter:title", content: "JEE Prep Hub — The JEE Preparation Ecosystem" },
      { name: "twitter:description", content: "Explore JEE Prep Hub: a connected ecosystem for planning, learning, practice, analysis, focus, AI, resources and community." },
      {
        title: "JEE Prep Hub — The JEE Preparation Ecosystem",
      },
      {
        name: "description",
        content:
          "Explore JEE Prep Hub: a connected ecosystem for planning, learning, practice, analysis, focus, AI, resources and community.",
      },
      {
        property: "og:title",
        content: "JEE Prep Hub — The JEE Preparation Ecosystem",
      },
      {
        property: "og:site_name",
        content: "JEE Prep Hub",
      },
      {
        property: "og:url",
        content: "https://jeeprephub.co.in/app",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://jeeprephub.co.in/app",
      },
    ],
  }),

  loader: async ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["app-hub-data"],
      queryFn: () => getLandingData(),
    }),

  component: AppHub,
});

const ecosystem = [
  [
    "PLAN",
    "JEE 360",
    "/jee360",
    Radar,
    "Turn the syllabus into actions.",
    "Today · Schedule · Backlog · Plans · Reminders · Import",
  ],
  [
    "LEARN",
    "Resources & Pulse",
    "/materials",
    Layers3,
    "Find material and stay close to useful updates.",
    "Notes · PYQs · Books · Pulse · Subjects",
  ],
  [
    "PRACTICE",
    "Tests & Quiz",
    "/tests",
    Swords,
    "Practice under pressure and review what happened.",
    "CBT · Attempts · Results · Rankings · Quiz",
  ],
  [
    "ANALYSE",
    "Progress Intelligence",
    "/dashboard",
    BarChart3,
    "See progress, performance and the next thing worth fixing.",
    "Analytics · Progress · Rank · Achievements",
  ],
  [
    "IMPROVE",
    "AI Study Layer",
    "/ai-chat",
    BrainCircuit,
    "Use AI for explanations, planning and reflection without replacing thinking.",
    "AI Chat · SahAI · Revision · Planning",
  ],
  [
    "FOCUS",
    "Focus Zone",
    "/focus",
    Timer,
    "Protect the time that actually changes preparation.",
    "Sessions · Todos · Habits · Stats · Blocking",
  ],
  [
    "CONNECT",
    "Community",
    "/community",
    Users,
    "Discuss, collaborate and learn together with responsible moderation.",
    "Doubts · Groups · Feed · Profiles",
  ],
] as const;

function AppHub() {
  const data = Route.useLoaderData() as LandingData;

  const counts = data?.counts ?? {
    materials: 0,
    groups: 0,
  };

  const notices = data?.notices ?? [];
  const latest = changelog.slice(0, 5);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px]">
          <div className="absolute left-[8%] top-10 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute right-[8%] top-20 h-80 w-80 rounded-full bg-accent/15 blur-[110px]" />

          <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:48px_48px]" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[.2em] backdrop-blur-xl">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            JEE Prep Hub · The preparation ecosystem
          </span>

          <h1 className="mt-7 font-display text-4xl font-extrabold leading-[.98] tracking-[-.045em] sm:text-6xl md:text-7xl">
            Your preparation deserves
            <span className="block text-liquid">
              a system, not a pile of tabs.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            One connected place for planning, learning, practice, analysis,
            focus, AI, resources and community.
            Built around the actual preparation journey.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow"
            >
              Enter the workspace
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="#ecosystem"
              className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/50 px-5 py-3 text-sm font-bold"
            >
              Explore the ecosystem
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </div>

        <GlassSurface className="mx-auto mt-12 max-w-5xl rounded-[2rem] p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-5">
            {[
              [Compass, "PLAN", "JEE 360"],
              [BookIcon, "LEARN", "Resources"],
              [Swords, "PRACTICE", "Tests"],
              [LineChart, "ANALYSE", "Progress"],
              [Rocket, "IMPROVE", "AI + Focus"],
            ].map(([Icon, label, detail]) => (
              <div
                key={label as string}
                className="rounded-2xl border border-border/60 bg-background/35 p-4 text-center"
              >
                <Icon className="mx-auto h-5 w-5 text-accent" />

                <p className="mt-3 text-[10px] font-bold tracking-[.16em]">
                  {label as string}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {detail as string}
                </p>
              </div>
            ))}
          </div>
        </GlassSurface>
      </section>

      {/* WHAT IS JPH */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <Kicker>01 · THE IDEA</Kicker>

            <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
              More than a resource website.
            </h2>
          </div>

          <GlassSurface className="rounded-3xl p-6 sm:p-9">
            <p className="text-base leading-8 text-muted-foreground sm:text-lg">
              JEE preparation is often fragmented: lectures in one place,
              PDFs in another, tests somewhere else, planning in a notebook,
              discussion in a group and progress in a spreadsheet.
              JEE Prep Hub is built around the opposite idea: connect the
              pieces so students spend less energy managing tools and more
              energy learning.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Info
                icon={Layers3}
                title="Connected by design"
                text="The product follows the preparation journey rather than a random feature list."
              />

              <Info
                icon={Zap}
                title="Built for momentum"
                text="Move from planning to execution without constantly rebuilding context."
              />
            </div>
          </GlassSurface>
        </div>
      </section>

      {/* LIVE STATS */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-20">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={Layers3}
            value={`${counts.materials}+`}
            label="Study materials"
            detail="indexed in the platform"
          />

          <Metric
            icon={Users}
            value={`${counts.groups}`}
            label="Groups"
            detail="community ecosystem"
          />

          <Metric
            icon={Code2}
            value={`${totalChangeCount()}+`}
            label="Product changes"
            detail="recorded in history"
          />

          <Metric
            icon={ShieldCheck}
            value="24/7"
            label="Web platform"
            detail="available whenever you study"
          />
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section
        id="ecosystem"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-20"
      >
        <Kicker>02 · THE ECOSYSTEM</Kicker>

        <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
          Everything has a place.
        </h2>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          Seven layers form one preparation loop:
          Plan → Learn → Practice → Analyse → Improve → Focus → Connect.
        </p>

        <div className="mt-9 grid gap-4 lg:grid-cols-2">
          {ecosystem.map(
            ([eyebrow, title, href, Icon, detail, tags], i) => (
              <a
                key={title}
                href={href}
                className="group rounded-[2rem] border border-border/60 bg-card/30 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Kicker>{`0${i + 1} · ${eyebrow}`}</Kicker>

                    <h3 className="mt-2 font-display text-2xl font-bold">
                      {title}
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-primary/10 p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {detail}
                </p>

                <p className="mt-5 text-xs leading-6 text-muted-foreground">
                  {tags}
                </p>

                <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-primary">
                  Explore
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </a>
            ),
          )}
        </div>
      </section>

      {/* JEE 360 */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <GlassSurface className="rounded-[2rem] p-6 sm:p-10">
          <Kicker>03 · JEE 360</Kicker>

          <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
            Your preparation command center.
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            JEE 360 turns a huge syllabus into actions: Today, Schedule,
            Backlog, Tests, Plans, Reminders, Import and Lab.
            The objective is simple — make the next useful action visible.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                CalendarDays,
                "Schedule",
                "Turn lectures and study blocks into a plan.",
              ],
              [
                ListChecks,
                "Backlog",
                "Make unfinished work visible and actionable.",
              ],
              [
                Clock3,
                "Reminders",
                "Keep important preparation events in view.",
              ],
              [
                Network,
                "Import",
                "Bring structured lecture-plan data into the workspace.",
              ],
              [
                Gauge,
                "Lab",
                "Experiment with preparation utilities.",
              ],
              [
                Target,
                "Today",
                "Know what matters now instead of staring at the whole syllabus.",
              ],
            ].map(([Icon, title, text]) => (
              <Info
                key={title as string}
                icon={Icon as typeof Target}
                title={title as string}
                text={text as string}
              />
            ))}
          </div>

          <a
            href="/jee360"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Open JEE 360
            <ArrowRight className="h-4 w-4" />
          </a>
        </GlassSurface>
      </section>

      {/* AI */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <GlassSurface className="rounded-[2rem] p-6 sm:p-10">
            <Kicker>04 · AI STUDY LAYER</Kicker>

            <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
              AI inside the workflow.
            </h2>

            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              AI can explain a difficult concept, help structure a plan,
              support revision or help a student think through a question.
              It should not replace independent reasoning or turn every hard
              problem into answer copying.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {[
                "Concept explanations",
                "Study planning",
                "Revision support",
                "Problem-solving discussion",
                "JEE 360 support",
                "Post-test reflection",
              ].map((x) => (
                <Check key={x}>{x}</Check>
              ))}
            </div>

            <a
              href="/ai-chat"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary"
            >
              Open AI Study Chat
              <ArrowRight className="h-4 w-4" />
            </a>
          </GlassSurface>

          <GlassSurface className="rounded-[2rem] p-6 sm:p-10">
            <BrainCircuit className="h-7 w-7 text-accent" />

            <h3 className="mt-4 font-display text-2xl font-bold">
              The healthy AI loop
            </h3>

            <div className="mt-6 space-y-3">
              {[
                ["01", "Ask", "What am I actually struggling with?"],
                [
                  "02",
                  "Understand",
                  "Build the idea instead of memorising the response.",
                ],
                [
                  "03",
                  "Apply",
                  "Take it back to questions and tests.",
                ],
                [
                  "04",
                  "Reflect",
                  "What improved after practice?",
                ],
              ].map(([n, t, d]) => (
                <div key={n} className="flex gap-3">
                  <span className="font-mono text-[10px] text-accent">
                    {n}
                  </span>

                  <div>
                    <b className="text-sm">{t}</b>

                    <p className="text-xs leading-5 text-muted-foreground">
                      {d}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassSurface>
        </div>
      </section>

      {/* ADVANCED */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <Kicker>05 · DEEP PRACTICE</Kicker>

        <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
          For the harder questions.
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            [
              "/jee-advanced-physics-problems",
              "Advanced Physics",
              FlaskConical,
              "Concept-first problems and resources.",
            ],
            [
              "/jee-advanced-chemistry-problems",
              "Advanced Chemistry",
              FlaskConical,
              "Practice and deeper conceptual work.",
            ],
            [
              "/jee-advanced-math-problems",
              "Advanced Mathematics",
              Gauge,
              "Problem-solving resources for deeper practice.",
            ],
          ].map(([href, title, Icon, text]) => (
            <a
              key={title as string}
              href={href as string}
              className="rounded-3xl border border-border/60 bg-card/30 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-primary/40"
            >
              <Icon className="h-6 w-6 text-primary" />

              <h3 className="mt-5 font-display text-xl font-bold">
                {title as string}
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                {text as string}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* ARTICLE INDEX */}
      <section
        id="articles"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-20"
      >
        <Kicker>06 · THE STORY BEHIND THE PRODUCT</Kicker>

        <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
          JEE Prep Hub, explained in depth.
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ArticleJump
            icon={Puzzle}
            title="The problem"
            href="#problem"
            text="Why fragmented preparation creates unnecessary friction."
          />

          <ArticleJump
            icon={Wrench}
            title="Engineering"
            href="#engineering"
            text="How engineering turns constraints into useful systems."
          />

          <ArticleJump
            icon={Lightbulb}
            title="Problem solving"
            href="#problem-solving"
            text="The reasoning loop behind serious preparation."
          />

          <ArticleJump
            icon={EyeOff}
            title="Privacy"
            href="#privacy"
            text="How responsible data handling should work."
          />
        </div>
      </section>

      {/* PROBLEM ARTICLE */}
      <Article
        id="problem"
        kicker="07 · THE PROBLEM"
        title="The problem isn't a lack of resources."
      >
        <p>
          JEE aspirants already have an enormous amount of content.
          The harder problem is turning that content into a coherent
          preparation system.
        </p>

        <h3>Fragmentation creates invisible work</h3>

        <p>
          Lectures, PDFs, tests, schedules, discussions and progress can
          live in separate places. Switching between them consumes attention
          that should go into learning.
        </p>

        <h3>Backlog becomes harder when it is invisible</h3>

        <p>
                    An unfinished lecture, unanswered question or unreviewed test can
          look small alone. Together they become preparation debt.
          Visibility is the first step toward fixing it.
        </p>

        <h3>Practice without analysis is incomplete</h3>

        <p>
          More questions do not automatically mean better preparation.
          Students need to see accuracy, time loss, repeated mistakes and
          what deserves attention next.
        </p>

        <h3>Technology should reduce cognitive load</h3>

        <p>
          A study platform should not become another project to manage.
          It should make the next useful action clearer and return the
          student to the work.
        </p>

        <Callout title="The central question">
          Can technology make preparation more organized without making
          students more dependent on technology?
        </Callout>
      </Article>

      {/* ENGINEERING ARTICLE */}
      <Article
        id="engineering"
        kicker="08 · ENGINEERING"
        title="Engineering is applied problem solving."
      >
        <p>
          Engineering is more than a degree or job title. At its core,
          it is the practice of turning real constraints into useful
          solutions: understand the problem, model the system, build,
          test, learn and improve.
        </p>

        <p>
          JEE trains many of the same habits. Physics models physical
          systems. Mathematics exposes structure and relationships.
          Chemistry connects microscopic ideas with observable behaviour.
          Software engineering applies the same reasoning to information
          and computation.
        </p>

        <p>
          Inside JEE Prep Hub, engineering also means thinking about
          interfaces, data, authentication, permissions, security,
          reliability, performance and failure cases — not merely making
          a button work.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Info
            icon={Lightbulb}
            title="Define"
            text="Understand the real problem before choosing technology."
          />

          <Info
            icon={Network}
            title="Model"
            text="Understand how users, data and systems interact."
          />

          <Info
            icon={Wrench}
            title="Build"
            text="Create a useful solution that can be tested."
          />

          <Info
            icon={BarChart3}
            title="Measure"
            text="Use feedback and failures to improve the system."
          />
        </div>

        <h3>Engineering is broad</h3>

        <p>
          Computer Science, Electronics, Mechanical, Civil, Electrical
          and Chemical engineering solve different classes of problems
          using the same underlying habits of reasoning, modelling,
          design and iteration.
        </p>
      </Article>

      {/* PROBLEM SOLVING ARTICLE */}
      <Article
        id="problem-solving"
        kicker="09 · PROBLEM SOLVING"
        title="Don't train yourself to recognize answers. Train yourself to solve problems."
      >
        <p>
          The useful loop is:
          <b> Understand → Represent → Attack → Verify → Reflect.</b>
          The objective is not merely reaching an answer; it is becoming
          better at producing a solution when the next question looks
          unfamiliar.
        </p>

        <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "01",
              "Understand",
              "Identify concepts, quantities, constraints and the actual question.",
            ],
            [
              "02",
              "Represent",
              "Draw, define variables, write equations or translate the statement into a model.",
            ],
            [
              "03",
              "Attack",
              "Try a strategy. If it fails, change the representation or route.",
            ],
            [
              "04",
              "Reflect",
              "Ask why it worked, what could transfer and what you missed.",
            ],
          ].map(([n, t, d]) => (
            <div
              key={n}
              className="rounded-3xl border border-border/60 bg-background/35 p-5"
            >
              <span className="font-mono text-[10px] text-accent">
                {n}
              </span>

              <h3 className="mt-4 font-bold">{t}</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {d}
              </p>
            </div>
          ))}
        </div>

        <h3>Physics</h3>

        <p>
          Model the system, identify laws and assumptions, track units and
          directions, then test whether the result makes physical sense.
        </p>

        <h3>Chemistry</h3>

        <p>
          Connect equations, trends, mechanisms, structure and quantitative
          relationships instead of treating facts as isolated fragments.
        </p>

        <h3>Mathematics</h3>

        <p>
          Look for structure: definitions, transformations, symmetry,
          invariants, cases, bounds and equivalent representations.
        </p>

        <Callout title="The role of AI">
          AI should help a student understand a stuck point or compare
          approaches. It should strengthen independent reasoning, not
          replace it.
        </Callout>
      </Article>
            {/* PRIVACY ARTICLE */}
      <Article
        id="privacy"
        kicker="10 · PRIVACY & RESPONSIBLE DATA"
        title="Privacy is part of the product, not a footer link."
      >
        <p>
          Students may use JEE Prep Hub for accounts, study plans, tests,
          community participation and progress tracking. Responsible data
          handling is therefore an engineering requirement, not an
          afterthought.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Info
            icon={Database}
            title="What may be collected"
            text="Account information, authentication data, study activity, test attempts, community content and technical information needed to operate the service."
          />

          <Info
            icon={Scale}
            title="Why it is used"
            text="To authenticate users, provide requested features, save progress, operate communities and protect the platform."
          />

          <Info
            icon={EyeOff}
            title="Data minimisation"
            text="Information should have a clear product or safety purpose rather than being collected merely because it is technically possible."
          />

          <Info
            icon={Server}
            title="Security"
            text="Access controls, validation, rate limiting, security headers and careful handling of privileged operations are part of responsible engineering."
          />

          <Info
            icon={Users}
            title="Community responsibility"
            text="Public posts and profiles affect other students, so moderation, reporting and clear community rules matter."
          />

          <Info
            icon={FileText}
            title="Transparency"
            text="Students should be able to understand what a feature needs and where to find the applicable formal policy."
          />
        </div>

        <Callout title="A practical privacy principle">
          Collect what is needed for a clear purpose, protect it
          appropriately, and avoid turning unnecessary personal information
          into a requirement.
        </Callout>

        <Callout title="Important">
          This section is a plain-language explanation of our approach.
          The formal Privacy Policy and Terms of Service remain the
          authoritative legal documents.
        </Callout>

        <a
          href="/legal"
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary"
        >
          Open the legal centre
          <ArrowRight className="h-4 w-4" />
        </a>
      </Article>

      {/* FOUNDER */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <GlassSurface className="overflow-hidden rounded-[2rem] p-0">
          <div className="grid lg:grid-cols-[.9fr_1.1fr]">

            {/* Main founder photograph */}
            <div className="relative min-h-[520px] overflow-hidden lg:min-h-[700px]">
              <img
                src="/founder-dhirendra-portrait.jpg"
                alt="Dhirendra Kumar, founder of JEE Prep Hub"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />

              <div className="absolute bottom-0 p-6 sm:p-10">
                <Kicker>11 · THE FOUNDER</Kicker>

                <h2 className="mt-3 font-display text-4xl font-extrabold text-white sm:text-6xl">
                  Dhirendra Kumar
                </h2>

                <p className="mt-2 font-mono text-xs uppercase tracking-[.2em] text-white/70">
                  Founder · Builder · Student
                </p>
              </div>
            </div>

            {/* Founder story */}
            <div className="p-6 sm:p-10 lg:p-14">
              <p className="text-lg leading-8 sm:text-xl">
                JEE Prep Hub began as a student-built attempt to solve a
                deceptively difficult problem: preparing seriously while
                also managing resources, lectures, schedules, tests,
                community, notes and progress.
              </p>

              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                The idea is simple: students should spend their energy
                solving problems, learning concepts and improving their
                preparation — not constantly searching for where something
                is stored or rebuilding their study system from scratch.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Info
                  icon={Sparkles}
                  title="Start with the problem"
                  text="Build from real preparation friction rather than a random feature checklist."
                />

                <Info
                  icon={Code2}
                  title="Build, test, iterate"
                  text="Product, design, security and workflow improve through repeated iteration."
                />

                <Info
                  icon={GraduationCap}
                  title="Keep the student central"
                  text="Technology should make preparation clearer, not create dependency."
                />

                <Info
                  icon={Rocket}
                  title="Think beyond one feature"
                  text="The direction is a connected preparation ecosystem."
                />
              </div>

              {/* Founder photo gallery */}
              <div className="mt-8">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-accent">
                  Founder archive
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <img
                    src="/founder-dhirendra-profile.jpg"
                    alt="Dhirendra Kumar"
                    className="h-52 w-full rounded-2xl object-cover"
                  />

                  <img
                    src="/founder-dhirendra-full.jpg"
                    alt="Dhirendra Kumar"
                    className="h-52 w-full rounded-2xl object-cover"
                  />
                </div>
              </div>

              <Callout title="Founder note">
                The goal is not simply to build the biggest website.
                The goal is to build something that genuinely makes a
                student's preparation more organized, focused and useful.
              </Callout>
            </div>
          </div>
        </GlassSurface>
      </section>

      {/* EVOLUTION */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[.65fr_1.35fr]">
          <div>
            <Kicker>12 · EVOLUTION</Kicker>

            <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
              Built in public.
            </h2>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              JEE Prep Hub is continuously evolving. The changelog records
              how the product has changed over time rather than presenting
              it as something that appeared fully formed.
            </p>
          </div>

          <div className="space-y-3">
            {latest.map((day) => (
              <div
                key={day.date}
                className="rounded-2xl border border-border/60 bg-card/30 p-5"
              >
                <span className="font-mono text-[10px] text-accent">
                  {formatChangeDate(day.date)}
                </span>

                <h3 className="mt-2 text-sm font-bold">
                  {day.headline}
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {day.items.slice(0, 3).map((item) => (
                    <span
                      key={item.title}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${kindMeta[item.kind].className}`}
                    >
                      {kindMeta[item.kind].label} · {item.title}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <GlassSurface className="rounded-[2rem] p-6 sm:p-10">
          <Kicker>13 · WHAT WE BELIEVE</Kicker>

          <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
            Technology should serve preparation.
          </h2>

          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Principle
              title="Clarity"
              text="Make the next useful action easier to see."
            />

            <Principle
              title="Depth"
              text="Prefer understanding and problem solving over superficial progress."
            />

            <Principle
              title="Access"
              text="Useful preparation infrastructure should be easier to reach."
            />

            <Principle
              title="Responsibility"
              text="Privacy, security and community safety are part of the product."
            />
          </div>
        </GlassSurface>
      </section>

      {/* LIVE NOTICES */}
      {notices.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Kicker>14 · LIVE FROM THE HUB</Kicker>

          <h2 className="mt-3 font-display text-3xl font-bold">
            Latest notices
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {notices.map((n) => (
              <a
                key={n.id}
                href={n.link_url ?? "/notices"}
                className="rounded-2xl border border-border/60 bg-card/30 p-4"
              >
                <p className="text-[10px] font-bold uppercase text-accent">
                  {n.category}
                </p>

                <p className="mt-2 text-sm font-bold">
                  {n.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {n.body}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-24 pt-10 text-center sm:px-6">
        <GlassSurface className="rounded-[2.5rem] p-8 sm:p-14">
          <Rocket className="mx-auto h-8 w-8 text-accent" />

          <h2 className="mt-5 font-display text-3xl font-extrabold sm:text-5xl">
            Stop managing preparation.
            <br />
            Start actually preparing.
          </h2>

          <p className="mt-4 text-sm text-muted-foreground">
            Plan · Learn · Practice · Analyse · Improve
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="/dashboard"
              className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
            >
              Enter JEE Prep Hub
            </a>

            <a
              href="/jee360"
              className="rounded-2xl border border-border px-6 py-3 text-sm font-bold"
            >
              Open JEE 360
            </a>
          </div>
        </GlassSurface>
      </section>
          </div>
  );
}

/* ---------- HELPER COMPONENTS ---------- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-accent">
      {children}
    </p>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  detail,
}: {
  icon: any;
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <GlassSurface className="rounded-2xl p-5">
      <Icon className="h-5 w-5 text-accent" />

      <p className="mt-4 font-display text-3xl font-extrabold">
        {value}
      </p>

      <p className="mt-1 text-sm font-bold">
        {label}
      </p>

      <p className="mt-1 text-[11px] text-muted-foreground">
        {detail}
      </p>
    </GlassSurface>
  );
}

function Info({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
      <Icon className="h-5 w-5 text-accent" />

      <p className="mt-3 text-sm font-bold">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function Check({
  children,
}: {
  children: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/30 px-3 py-2 text-xs font-semibold">
      <CheckCircle2 className="h-4 w-4 text-accent" />
      {children}
    </div>
  );
}

function Article({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-20"
    >
      <GlassSurface className="rounded-[2rem] p-6 sm:p-10 lg:p-12">
        <Kicker>{kicker}</Kicker>

        <h2 className="mt-3 max-w-4xl font-display text-3xl font-bold sm:text-5xl">
          {title}
        </h2>

        <article className="mt-8 max-w-4xl space-y-6 text-sm leading-7 text-muted-foreground sm:text-base">
          {children}
        </article>
      </GlassSurface>
    </section>
  );
}

function Callout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-7 rounded-2xl border border-primary/20 bg-primary/[.05] p-5">
      <p className="font-bold text-foreground">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function ArticleJump({
  icon: Icon,
  title,
  href,
  text,
}: {
  icon: any;
  title: string;
  href: string;
  text: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-3xl border border-border/60 bg-card/30 p-5 transition hover:-translate-y-1 hover:border-primary/40"
    >
      <Icon className="h-5 w-5 text-primary" />

      <h3 className="mt-5 font-display text-lg font-bold">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {text}
      </p>

      <ArrowRight className="mt-4 h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
    </a>
  );
}

function Principle({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-background/35 p-5">
      <div className="h-2 w-2 rounded-full bg-accent" />

      <h3 className="mt-4 font-display text-lg font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}
function BookIcon(
  props: React.ComponentProps<typeof Layers3>,
) {
  return <Layers3 {...props} />;
}
