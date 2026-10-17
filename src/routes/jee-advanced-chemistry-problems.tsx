import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MaterialsUnlock } from "@/components/MaterialsUnlock";
import { getChemistryLandingData } from "@/lib/chemistry-landing.functions";
import type { ChemistryLandingData } from "@/lib/chemistry-landing.functions";
import { FlaskConical, Beaker, Atom, TestTube, BookOpen, FileText, ArrowRight, Users, Clock, ExternalLink, MessageCircle, HelpCircle, Lightbulb } from "lucide-react";

const BASE_URL = "https://jeeprephub.co.in";
const OG_IMAGE = `${BASE_URL}/og-jeeprephub.png`;
const TITLE = "JEE Advanced Chemistry Problems — Free PYQs, Books & Notes";

export const Route = createFileRoute("/jee-advanced-chemistry-problems")({
  head: () => ({
    meta: [
      { title: `${TITLE} | JEE Prep Hub` },
      { name: "description", content: "Practice JEE Advanced chemistry problems with curated previous year questions, physical, organic and inorganic chemistry books and notes for Class 11 & 12 aspirants." },
      { name: "keywords", content: "JEE advanced chemistry, JEE Advanced chemistry problems, JEE chemistry PYQ, IIT JEE chemistry, physical chemistry JEE, organic chemistry JEE, inorganic chemistry JEE, Class 11 chemistry, Class 12 chemistry" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: "Curated JEE Advanced chemistry problems, previous year questions, books and notes across physical, organic and inorganic chemistry." },
      { property: "og:url", content: `${BASE_URL}/jee-advanced-chemistry-problems` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: "Curated JEE Advanced chemistry problems, PYQs, books and notes for serious aspirants." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/jee-advanced-chemistry-problems` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "JEE Advanced Chemistry Problems",
          url: `${BASE_URL}/jee-advanced-chemistry-problems`,
          description: "Practice JEE Advanced chemistry problems with curated previous year questions, physical, organic and inorganic chemistry books and notes for Class 11 & 12 aspirants.",
          isPartOf: { "@type": "WebSite", name: "JEE Prep Hub", url: BASE_URL },
          about: {
            "@type": "Thing",
            name: "Joint Entrance Examination Advanced Chemistry",
            alternateName: "IIT JEE Advanced Chemistry",
          },
        }),
      },
    ],
  }),
  component: ChemistryLandingPage,
});

function ChemistryLandingPage() {
  const fetchData = useServerFn(getChemistryLandingData);
  const query = useQuery({ queryKey: ["chemistry-landing-data"], queryFn: () => fetchData(), staleTime: 5 * 60_000 });
  const empty = { locked: true, all: [] } as unknown as ChemistryLandingData;
  const data = query.data ?? empty;

  return (
    <div className="min-h-screen bg-hero-glow">

      <main className="mx-auto max-w-6xl px-5 pt-8 pb-16">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5 text-accent" /> JEE Advanced Chemistry
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient-hero">JEE Advanced Chemistry Problems</span>
            <br />
            <span className="text-foreground">Practice, PYQs & Notes</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A curated collection of JEE Advanced chemistry problems, previous year questions and topic-wise resources across physical, organic and inorganic chemistry — for Class 11, Class 12 and Droppers.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95">
              Access all chemistry resources <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/community" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted">
              Ask a chemistry doubt <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Why JEE Advanced chemistry needs three different study habits</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Chemistry is the one JEE Advanced subject that rewards three separate skills at once: calculation in physical chemistry, mechanism reasoning in organic chemistry, and structured recall in
            inorganic chemistry. Solving a wide spread of <strong>JEE Advanced chemistry problems</strong> is what turns those three habits into marks.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InfoCard icon={Beaker} title="Physical: solve daily" desc="Numericals need daily reps so unit handling and approximations become automatic." />
            <InfoCard icon={TestTube} title="Organic: reason, don't memorise" desc="Work through mechanisms and intermediates instead of learning product lists." />
            <InfoCard icon={Atom} title="Inorganic: revise in cycles" desc="Short, repeated revision beats long one-off reading for periodic trends and compounds." />
          </div>
        </section>

        {data.locked ? (
          <section className="mt-16">
            <MaterialsUnlock
              title="Chemistry resources are locked"
              description="Our chemistry problem sets, books and PYQs are copyrighted material, so they are password protected. Enter the current access password shared by the JEE Prep Hub team."
              onUnlocked={() => query.refetch()}
            />
          </section>
        ) : (
          <>
            <section className="mt-16">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Topic-wise JEE Advanced chemistry problem resources</h2>
              <p className="mt-2 text-sm text-muted-foreground">Start with the branch you lose the most marks in.</p>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TopicCard title="Physical Chemistry" icon={Beaker} items={data.physical} />
                <TopicCard title="Organic Chemistry" icon={TestTube} items={data.organic} />
                <TopicCard title="Inorganic Chemistry" icon={Atom} items={data.inorganic} />
                <TopicCard title="Advanced Problem Sets" icon={FlaskConical} items={data.advanced} />
              </div>
            </section>

            <section className="mt-16">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Class 11 & 12 chemistry foundation</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                NCERT and school-level chemistry is non-negotiable for JEE Advanced, especially in inorganic chemistry where questions are often lifted straight from the textbook.
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
                  Browse all chemistry resources <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <section className="mt-16">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">JEE Advanced previous year chemistry problems</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Previous year papers show you exactly how deep JEE Advanced goes in each chapter — and which chapters repeat almost every year.
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

        <section className="mt-16 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">How to use these JEE Advanced chemistry resources</h2>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-muted-foreground sm:text-base">
            <li>
              <strong className="text-foreground">Finish NCERT first:</strong> Especially for inorganic chemistry, read the chapter before any problem set.
            </li>
            <li>
              <strong className="text-foreground">Physical chemistry daily:</strong> Ten numericals a day keeps calculation speed and unit handling sharp.
            </li>
            <li>
              <strong className="text-foreground">Organic by mechanism:</strong> Redraw each mechanism yourself rather than reading the solution.
            </li>
            <li>
              <strong className="text-foreground">Attempt PYQs timed:</strong> Use previous year chemistry problems under exam conditions.
            </li>
            <li>
              <strong className="text-foreground">Keep a mistake log:</strong> Record every wrong reaction or formula and revise it weekly.
            </li>
          </ol>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">More ways to prepare on JEE Prep Hub</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/jee-advanced-physics-problems" className="group rounded-xl border border-border bg-card p-5 shadow-soft transition hover:shadow-glow">
              <Lightbulb className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-semibold">Physics Problems</h3>
              <p className="mt-1 text-sm text-muted-foreground">Mechanics, electromagnetism and modern physics problem sets.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">Open <ArrowRight className="h-3 w-3" /></span>
            </Link>
            <Link to="/jee-advanced-math-problems" className="group rounded-xl border border-border bg-card p-5 shadow-soft transition hover:shadow-glow">
              <BookOpen className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-semibold">Maths Problems</h3>
              <p className="mt-1 text-sm text-muted-foreground">Calculus, algebra and coordinate geometry practice resources.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">Open <ArrowRight className="h-3 w-3" /></span>
            </Link>
            <Link to="/timer" className="group rounded-xl border border-border bg-card p-5 shadow-soft transition hover:shadow-glow">
              <Clock className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-semibold">Focus Timer</h3>
              <p className="mt-1 text-sm text-muted-foreground">Pomodoro and stopwatch to track every minute of practice.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">Focus now <ArrowRight className="h-3 w-3" /></span>
            </Link>
            <Link to="/community" className="group rounded-xl border border-border bg-card p-5 shadow-soft transition hover:shadow-glow">
              <Users className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-semibold">Study Community</h3>
              <p className="mt-1 text-sm text-muted-foreground">Live chat and doubt threads with fellow aspirants.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">Join <ArrowRight className="h-3 w-3" /></span>
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Common questions about JEE Advanced chemistry</h2>
          <div className="mt-6 space-y-4">
            <Faq
              q="Which chemistry branch should I start with?"
              a="Start with physical chemistry if your calculation speed is weak, and with inorganic chemistry if you are short on time — it gives the fastest return per hour of revision."
            />
            <Faq
              q="Is NCERT enough for JEE Advanced chemistry?"
              a="NCERT is essential but not sufficient on its own. Use it as the base for inorganic chemistry, then add problem books and previous year questions for physical and organic chemistry."
            />
            <Faq
              q="How many chemistry problems should I solve per day?"
              a="A steady mix works better than bulk sessions: a handful of physical chemistry numericals, a few organic mechanisms, and one short inorganic revision cycle each day."
            />
          </div>
        </section>

        <section className="mt-16 text-center">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Ready to start solving JEE Advanced chemistry problems?</h2>
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
      <Icon className="h-6 w-6 text-accent" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <h3 className="flex items-start gap-2 font-semibold">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {q}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{a}</p>
    </div>
  );
}

function TopicCard({ title, icon: Icon, items }: { title: string; icon: React.ElementType; items: ChemistryLandingData["physical"] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-accent/15 p-2 text-accent">
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

function MaterialCard({ material: m }: { material: ChemistryLandingData["all"][number] }) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-soft transition hover:shadow-glow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">{m.title}</h3>
        <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
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
