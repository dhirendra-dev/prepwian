import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MaterialsUnlock } from "@/components/MaterialsUnlock";
import { getMathLandingData } from "@/lib/math-landing.functions";
import type { MathLandingData } from "@/lib/math-landing.functions";
import { Sigma, Calculator, BookOpen, FileText, ArrowRight, Users, Clock, ExternalLink, MessageCircle, HelpCircle, Lightbulb } from "lucide-react";

const BASE_URL = "https://jeeprephub.co.in";
const OG_IMAGE = `${BASE_URL}/og-jee-advanced-math.png`;

export const Route = createFileRoute("/jee-advanced-math-problems")({
  head: () => ({
    meta: [
      { title: "JEE Advanced Math Problems — Free PYQs, Books & Notes | JEE Prep Hub" },
      { name: "description", content: "Master JEE Advanced math problems with curated previous year questions, topic-wise books, calculus notes, coordinate geometry and functions resources for Class 11 & 12 aspirants." },
      { name: "keywords", content: "JEE advanced math problems, JEE Advanced mathematics, JEE math PYQ, IIT JEE math problems, JEE calculus, JEE coordinate geometry, JEE functions, Class 11 maths, Class 12 maths" },
      { property: "og:title", content: "JEE Advanced Math Problems — Free PYQs, Books & Notes" },
      { property: "og:description", content: "Curated JEE Advanced math problems, previous year questions, books and notes. Practice calculus, coordinate geometry, functions and more with JEE Prep Hub." },
      { property: "og:url", content: `${BASE_URL}/jee-advanced-math-problems` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1280" },
      { property: "og:image:height", content: "640" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "JEE Advanced Math Problems — Free PYQs, Books & Notes" },
      { name: "twitter:description", content: "Curated JEE Advanced math problems, previous year questions, books and notes for serious aspirants." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/jee-advanced-math-problems` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "JEE Advanced Math Problems",
          url: `${BASE_URL}/jee-advanced-math-problems`,
          description: "Master JEE Advanced math problems with curated previous year questions, topic-wise books, calculus notes, coordinate geometry and functions resources for Class 11 & 12 aspirants.",
          isPartOf: { "@type": "WebSite", name: "JEE Prep Hub", url: BASE_URL },
          about: {
            "@type": "Thing",
            name: "Joint Entrance Examination Advanced Mathematics",
            alternateName: "IIT JEE Advanced Math",
          },
        }),
      },
    ],
  }),
  component: MathLandingPage,
});

function MathLandingPage() {
  const fetchData = useServerFn(getMathLandingData);
  const query = useQuery({ queryKey: ["math-landing-data"], queryFn: () => fetchData(), staleTime: 5 * 60_000 });
  const empty = { locked: true, all: [] } as unknown as MathLandingData;
  const data = query.data ?? empty;

  return (
    <div className="min-h-screen bg-hero-glow">

      <main className="mx-auto max-w-6xl px-5 pt-8 pb-16">
        {/* Hero / H1 */}
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sigma className="h-3.5 w-3.5 text-mathematics" /> JEE Advanced Mathematics
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient-hero">JEE Advanced Math Problems</span>
            <br />
            <span className="text-foreground">Practice, PYQs & Notes</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A curated collection of JEE Advanced math problems, previous year questions, and topic-wise study resources for Class 11, Class 12 and Droppers.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95">
              Access all math resources <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/community" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted">
              Ask a math doubt <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Why JEE Advanced math problems matter */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Why JEE Advanced math problems need a different approach</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            JEE Advanced mathematics is not about speed alone — it tests conceptual depth, multiple concept linking, and problem-solving intuition. To crack it, you need to solve a wide variety of
            <strong> JEE Advanced math problems</strong> across every topic: calculus, algebra, coordinate geometry, trigonometry, vectors, and 3D geometry.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InfoCard icon={Lightbulb} title="Concept-first practice" desc="Every problem set is selected to build intuition, not just memorization." />
            <InfoCard icon={Calculator} title="Topic-wise focus" desc="Drill down by calculus, coordinate geometry, functions, and PYQs." />
            <InfoCard icon={Clock} title="Timed sprints" desc="Pair problems with the Pomodoro timer to build exam stamina." />
          </div>
        </section>

        {data.locked ? (
          <section className="mt-16">
            <MaterialsUnlock title="Mathematics resources are locked" description="Our mathematics problem sets, books and PYQs are copyrighted material, so they are password protected. Enter the current access password shared by the JEE Prep Hub team." onUnlocked={() => query.refetch()} />
          </section>
        ) : (
          <>
          {/* Topic-wise resources */}
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Topic-wise JEE Advanced math problem resources</h2>
            <p className="mt-2 text-sm text-muted-foreground">Jump to the topic you are weak in and start solving right away.</p>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TopicCard title="Calculus" icon={Calculator} color="mathematics" items={data.calculus} />
              <TopicCard title="Coordinate Geometry" icon={Sigma} color="mathematics" items={data.coordinateGeometry} />
              <TopicCard title="Functions & Graphs" icon={BookOpen} color="mathematics" items={data.functions} />
              <TopicCard title="Advanced Problem Sets" icon={Lightbulb} color="mathematics" items={data.advanced} />
            </div>
          </section>

          {/* Class 11 / 12 foundation */}
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Class 11 & 12 mathematics foundation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Before you attempt JEE Advanced math problems, your Class 11 and Class 12 basics must be rock solid. These notes and books cover the full syllabus end-to-end.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.foundation.length === 0 ? (
                <p className="text-sm text-muted-foreground">Foundation materials are being organized.</p>
              ) : (
                data.foundation.slice(0, 6).map((m) => <MaterialCard key={m.id} material={m} />)
              )}
            </div>
            <div className="mt-4 text-center">
              <Link to="/materials" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                Browse all math resources <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* JEE Advanced PYQs */}
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">JEE Advanced previous year math problems</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing beats real JEE Advanced math problems. These previous year question banks let you understand the exact pattern, difficulty, and traps set by IIT JEE examiners.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.pyqs.length === 0 ? (
                <p className="text-sm text-muted-foreground">PYQ materials are being organized.</p>
              ) : (
                data.pyqs.map((m) => <MaterialCard key={m.id} material={m} />)
              )}
            </div>
          </section>
          </>
        )}

        {/* How to use */}
        <section className="mt-16 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">How to use these JEE Advanced math resources</h2>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-muted-foreground sm:text-base">
            <li>
              <strong className="text-foreground">Start with theory:</strong> Read the topic notes or book for a chapter before touching problems.
            </li>
            <li>
              <strong className="text-foreground">Solve solved examples:</strong> Study the approach, not just the final answer.
            </li>
            <li>
              <strong className="text-foreground">Attempt JEE Advanced math problems:</strong> Use PYQs and advanced problem sets under timed conditions.
            </li>
            <li>
              <strong className="text-foreground">Review mistakes:</strong> Log every wrong question and revisit the concept gap.
            </li>
            <li>
              <strong className="text-foreground">Repeat in cycles:</strong> Re-solve the same problems after a week to build retention.
            </li>
          </ol>
        </section>

        {/* Internal navigation links */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">More ways to prepare on JEE Prep Hub</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/materials" className="group rounded-xl border border-border bg-card p-5 shadow-soft transition hover:shadow-glow">
              <BookOpen className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-semibold">Full Materials Library</h3>
              <p className="mt-1 text-sm text-muted-foreground">Physics, Chemistry and Math resources organized by class and topic.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">Browse <ArrowRight className="h-3 w-3" /></span>
            </Link>
            <Link to="/timer" className="group rounded-xl border border-border bg-card p-5 shadow-soft transition hover:shadow-glow">
              <Clock className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-semibold">Focus Timer</h3>
              <p className="mt-1 text-sm text-muted-foreground">Pomodoro and stopwatch to track every minute of math practice.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">Focus now <ArrowRight className="h-3 w-3" /></span>
            </Link>
            <Link to="/forum" className="group rounded-xl border border-border bg-card p-5 shadow-soft transition hover:shadow-glow">
              <HelpCircle className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-semibold">Math Forum</h3>
              <p className="mt-1 text-sm text-muted-foreground">Post tough JEE Advanced math problems and get answers from the community.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">Ask now <ArrowRight className="h-3 w-3" /></span>
            </Link>
            <Link to="/community" className="group rounded-xl border border-border bg-card p-5 shadow-soft transition hover:shadow-glow">
              <Users className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-semibold">Study Community</h3>
              <p className="mt-1 text-sm text-muted-foreground">Join live chat and WhatsApp groups for JEE math discussions.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">Join <ArrowRight className="h-3 w-3" /></span>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Ready to start solving JEE Advanced math problems?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Create a free account and track every problem you solve.</p>
            <Link to="/auth" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95">
              Start practicing free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">JEE Prep Hub</Link> — Built by aspirants, for aspirants.
      </footer>
    </div>
  );
}

function InfoCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <Icon className="h-6 w-6 text-mathematics" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function TopicCard({ title, icon: Icon, color, items }: { title: string; icon: React.ElementType; color: string; items: MathLandingData["calculus"] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span className={`rounded-md bg-${color}/15 p-2 text-${color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Resources for this topic are being added.</p>
        ) : (
          items.slice(0, 4).map((m) => (
            <a key={m.id} href={m.drive_url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm hover:bg-muted">
              <span className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{m.title}</span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          ))
        )}
      </div>
    </div>
  );
}

function MaterialCard({ material: m }: { material: MathLandingData["all"][number] }) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-soft transition hover:shadow-glow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">{m.title}</h3>
        <span className="shrink-0 rounded-full bg-mathematics/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-mathematics">
          {m.resource_type}
        </span>
      </div>
      {m.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{m.description}</p>}
      {m.topic && m.topic !== "All" && (
        <span className="mt-3 inline-block w-fit rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{m.topic}</span>
      )}
      <a href={m.drive_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
        <ExternalLink className="h-3.5 w-3.5" /> Open resource
      </a>
    </article>
  );
}
