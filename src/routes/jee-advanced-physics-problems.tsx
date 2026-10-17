import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MaterialsUnlock } from "@/components/MaterialsUnlock";
import { getPhysicsLandingData } from "@/lib/physics-landing.functions";
import type { PhysicsLandingData } from "@/lib/physics-landing.functions";
import { Atom, Zap, Orbit, Waves, BookOpen, FileText, ArrowRight, Users, Clock, ExternalLink, MessageCircle, HelpCircle, Lightbulb } from "lucide-react";

const BASE_URL = "https://jeeprephub.co.in";
const OG_IMAGE = `${BASE_URL}/og-jee-advanced-physics.png`;

export const Route = createFileRoute("/jee-advanced-physics-problems")({
  head: () => ({
    meta: [
      { title: "JEE Advanced Physics Problems — Free PYQs, Books & Notes | JEE Prep Hub" },
      { name: "description", content: "Master JEE Advanced physics problems with curated previous year questions, topic-wise books, mechanics, electromagnetism, optics and modern physics notes for Class 11 & 12 aspirants." },
      { name: "keywords", content: "JEE advanced physics problems, JEE Advanced physics, JEE physics PYQ, IIT JEE physics problems, JEE mechanics, JEE electromagnetism, JEE modern physics, Class 11 physics, Class 12 physics" },
      { property: "og:title", content: "JEE Advanced Physics Problems — Free PYQs, Books & Notes" },
      { property: "og:description", content: "Curated JEE Advanced physics problems, previous year questions, books and notes. Practice mechanics, electromagnetism, optics and modern physics with JEE Prep Hub." },
      { property: "og:url", content: `${BASE_URL}/jee-advanced-physics-problems` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1280" },
      { property: "og:image:height", content: "640" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "JEE Advanced Physics Problems — Free PYQs, Books & Notes" },
      { name: "twitter:description", content: "Curated JEE Advanced physics problems, previous year questions, books and notes for serious aspirants." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/jee-advanced-physics-problems` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "JEE Advanced Physics Problems",
          url: `${BASE_URL}/jee-advanced-physics-problems`,
          description: "Master JEE Advanced physics problems with curated previous year questions, topic-wise books, mechanics, electromagnetism, optics and modern physics notes for Class 11 & 12 aspirants.",
          isPartOf: { "@type": "WebSite", name: "JEE Prep Hub", url: BASE_URL },
          about: {
            "@type": "Thing",
            name: "Joint Entrance Examination Advanced Physics",
            alternateName: "IIT JEE Advanced Physics",
          },
        }),
      },
    ],
  }),
  component: PhysicsLandingPage,
});

function PhysicsLandingPage() {
  const fetchData = useServerFn(getPhysicsLandingData);
  const query = useQuery({ queryKey: ["physics-landing-data"], queryFn: () => fetchData(), staleTime: 5 * 60_000 });
  const empty = { locked: true, all: [] } as unknown as PhysicsLandingData;
  const data = query.data ?? empty;

  return (
    <div className="min-h-screen bg-hero-glow">

      <main className="mx-auto max-w-6xl px-5 pt-8 pb-16">
        {/* Hero / H1 */}
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Atom className="h-3.5 w-3.5 text-physics" /> JEE Advanced Physics
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient-hero">JEE Advanced Physics Problems</span>
            <br />
            <span className="text-foreground">Practice, PYQs & Notes</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A curated collection of JEE Advanced physics problems, previous year questions, and topic-wise study resources for Class 11, Class 12 and Droppers.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95">
              Access all physics resources <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/community" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted">
              Ask a physics doubt <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Why JEE Advanced physics problems matter */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Why JEE Advanced physics problems need a different approach</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            JEE Advanced physics is not about plugging numbers into formulas — it tests physical intuition, multi-concept linking, and modeling of real situations. To crack it, you need to solve a
            wide variety of <strong>JEE Advanced physics problems</strong> across every topic: mechanics, electromagnetism, thermodynamics, waves, optics, and modern physics.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InfoCard icon={Lightbulb} title="Concept-first practice" desc="Every problem set is selected to build physical intuition, not just formula recall." />
            <InfoCard icon={Zap} title="Topic-wise focus" desc="Drill down by mechanics, electromagnetism, modern physics, and PYQs." />
            <InfoCard icon={Clock} title="Timed sprints" desc="Pair problems with the Pomodoro timer to build exam stamina." />
          </div>
        </section>

        {data.locked ? (
          <section className="mt-16">
            <MaterialsUnlock title="Physics resources are locked" description="Our physics problem sets, books and PYQs are copyrighted material, so they are password protected. Enter the current access password shared by the JEE Prep Hub team." onUnlocked={() => query.refetch()} />
          </section>
        ) : (
          <>
          {/* Topic-wise resources */}
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Topic-wise JEE Advanced physics problem resources</h2>
            <p className="mt-2 text-sm text-muted-foreground">Jump to the topic you are weak in and start solving right away.</p>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TopicCard title="Mechanics" icon={Orbit} items={data.mechanics} />
              <TopicCard title="Electromagnetism" icon={Zap} items={data.electromagnetism} />
              <TopicCard title="Optics & Modern Physics" icon={Atom} items={data.modernPhysics} />
              <TopicCard title="Thermo, Waves & Advanced Sets" icon={Waves} items={[...data.thermodynamics, ...data.advanced]} />
            </div>
          </section>

          {/* Class 11 / 12 foundation */}
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Class 11 & 12 physics foundation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Before you attempt JEE Advanced physics problems, your Class 11 and Class 12 basics must be rock solid. These notes and books cover the full syllabus end-to-end.
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
                Browse all physics resources <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* JEE Advanced PYQs */}
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">JEE Advanced previous year physics problems</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing beats real JEE Advanced physics problems. These previous year question banks let you understand the exact pattern, difficulty, and traps set by IIT JEE examiners.
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
          <h2 className="font-display text-2xl font-bold sm:text-3xl">How to use these JEE Advanced physics resources</h2>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-muted-foreground sm:text-base">
            <li>
              <strong className="text-foreground">Start with theory:</strong> Read the topic notes or book for a chapter before touching problems.
            </li>
            <li>
              <strong className="text-foreground">Solve solved examples:</strong> Study the approach — free-body diagrams, sign conventions, limiting cases — not just the final answer.
            </li>
            <li>
              <strong className="text-foreground">Attempt JEE Advanced physics problems:</strong> Use PYQs and advanced problem sets under timed conditions.
            </li>
            <li>
              <strong className="text-foreground">Review mistakes:</strong> Log every wrong question and revisit the concept gap behind it.
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
              <p className="mt-1 text-sm text-muted-foreground">Pomodoro and stopwatch to track every minute of physics practice.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">Focus now <ArrowRight className="h-3 w-3" /></span>
            </Link>
            <Link to="/forum" className="group rounded-xl border border-border bg-card p-5 shadow-soft transition hover:shadow-glow">
              <HelpCircle className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-semibold">Physics Forum</h3>
              <p className="mt-1 text-sm text-muted-foreground">Post tough JEE Advanced physics problems and get answers from the community.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">Ask now <ArrowRight className="h-3 w-3" /></span>
            </Link>
            <Link to="/community" className="group rounded-xl border border-border bg-card p-5 shadow-soft transition hover:shadow-glow">
              <Users className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-semibold">Study Community</h3>
              <p className="mt-1 text-sm text-muted-foreground">Join live chat and WhatsApp groups for JEE physics discussions.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">Join <ArrowRight className="h-3 w-3" /></span>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Ready to start solving JEE Advanced physics problems?</h2>
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
      <Icon className="h-6 w-6 text-physics" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function TopicCard({ title, icon: Icon, items }: { title: string; icon: React.ElementType; items: PhysicsLandingData["mechanics"] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-physics/15 p-2 text-physics">
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

function MaterialCard({ material: m }: { material: PhysicsLandingData["all"][number] }) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-soft transition hover:shadow-glow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">{m.title}</h3>
        <span className="shrink-0 rounded-full bg-physics/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-physics">
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
