import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, BarChart3, Check, Clock3, Crown, Flame, ShieldCheck, Sparkles, Target, Timer, Trophy, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProStatus } from "@/hooks/use-pro";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [
      { name: "twitter:title", content: "Earn JEE Prep Hub Pro" },
      { name: "twitter:description", content: "Study, reach weekly #1, and unlock Pro automatically." },

    { title: "Earn JEE Prep Hub Pro — Weekly Leaderboard" },
    { name: "description", content: "JEE Prep Hub Pro is earned, not purchased. Finish #1 on the live weekly study leaderboard to unlock Pro." },
    { property: "og:title", content: "Earn JEE Prep Hub Pro" },
    { property: "og:description", content: "Study, reach weekly #1, and unlock Pro automatically." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ProPage,
});

const benefits = [
  { icon: BarChart3, title: "Champion analytics", desc: "A premium view of your focused effort and subject balance." },
  { icon: Award, title: "Winner identity", desc: "A distinct crown, profile treatment, and Pro badge across the community." },
  { icon: Sparkles, title: "Premium experience", desc: "Special visual styling reserved for the current weekly champion." },
  { icon: Target, title: "Merit only", desc: "No checkout and no payment advantage—consistent study decides the winner." },
];

function ProPage() {
  const { user } = useAuth();
  const { isPro } = useProStatus(user?.id);
  return (
    <div className="min-h-screen bg-background">
      <main>
        <section className="relative overflow-hidden border-y border-border bg-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500" />
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase text-amber-700 dark:text-amber-300"><Crown className="h-3.5 w-3.5" /> Merit-based Pro</span>
              <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-6xl">Pro is <span className="pro-gradient-text">earned.</span><br />Never purchased.</h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">The member at #1 on the live Monday–Sunday leaderboard becomes the JEE Prep Hub Pro champion automatically.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={user ? "/leaderboard" : "/auth"} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"><Trophy className="h-4 w-4" /> {user ? "View live leaderboard" : "Start competing"}</Link>
                <Link to="/donate" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-3 text-sm font-semibold">Support the platform</Link>
              </div>
              {isPro && <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-600"><Crown className="h-4 w-4" /> You currently hold the Pro crown.</p>}
            </div>
            <div className="overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-emerald-500/10 p-6 shadow-soft">
              <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Weekly reward</p><h2 className="mt-1 font-display text-2xl font-bold">The Pro Crown</h2></div><span className="grid h-14 w-14 place-items-center rounded-full bg-amber-500 text-amber-950 shadow"><Crown className="h-7 w-7" /></span></div>
              <div className="mt-6 space-y-3"><Rule icon={Timer} text="Pomodoro sessions count" /><Rule icon={Clock3} text="Stopwatch sessions count" /><Rule icon={Flame} text="Manual study-hour logs count" /><Rule icon={Zap} text="Rank and Pro status update live" /></div>
              <div className="mt-6 rounded-xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">New week, fresh competition. The crown moves whenever another member takes #1.</div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-14">
          <div className="text-center"><h2 className="font-display text-3xl font-bold">One fair path to Pro</h2><p className="mt-2 text-sm text-muted-foreground">Save real study sessions and climb the same live ranking as everyone else.</p></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{benefits.map((item) => <article key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-soft"><span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><item.icon className="h-5 w-5" /></span><h3 className="mt-4 font-display font-semibold">{item.title}</h3><p className="mt-2 text-sm text-muted-foreground">{item.desc}</p></article>)}</div>
          <div className="mt-10 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-3"><Step number="01" title="Study" text="Use the Pomodoro, stopwatch, or manual study logger." /><Step number="02" title="Save" text="Completed time enters the current weekly total instantly." /><Step number="03" title="Reach #1" text="The live leader receives the Pro crown automatically." /></div>
          <div className="mt-10 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm"><ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" /><p><b>No pay-to-win.</b> Donations support the website but never add study time, change rank, or grant Pro.</p></div>
        </section>
      </main>
    </div>
  );
}

function Rule({ icon: Icon, text }: { icon: typeof Timer; text: string }) {
  return <div className="flex items-center gap-3 text-sm"><span className="grid h-8 w-8 place-items-center rounded-lg bg-background"><Icon className="h-4 w-4 text-amber-600" /></span><span className="flex-1">{text}</span><Check className="h-4 w-4 text-emerald-500" /></div>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <div><div className="font-display text-sm font-bold text-amber-600">{number}</div><h3 className="mt-1 font-display text-lg font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>;
}