import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, GraduationCap } from "lucide-react";

export function PostLoginDestinationChooser({ userLabel }: { userLabel?: string }) {
  return (
    <main className="articles-destination-page">
      <section className="articles-destination-shell" aria-labelledby="articles-destination-title">
        <span className="articles-destination-eyebrow">JEE PREP HUB</span>
        <h1 id="articles-destination-title">Where would you like to go?</h1>
        <p className="articles-destination-subtitle">
          {userLabel ? `Welcome back, ${userLabel}. ` : "Welcome back. "}
          Choose your study workspace or explore articles from the community.
        </p>
        <div className="articles-destination-grid">
          <Link
            to="/dashboard"
            className="articles-destination-card articles-destination-dashboard"
          >
            <span className="articles-destination-icon">
              <GraduationCap size={24} aria-hidden="true" />
            </span>
            <span className="articles-destination-kicker">STUDY WORKSPACE</span>
            <strong>Open Dashboard</strong>
            <span className="articles-destination-description">
              Continue with your study tools, materials, tests, challenges and progress.
            </span>
            <span className="articles-destination-action">
              Go to dashboard <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </Link>
          <Link to="/articles" className="articles-destination-card articles-destination-articles">
            <span className="articles-destination-icon">
              <BookOpen size={24} aria-hidden="true" />
            </span>
            <span className="articles-destination-kicker">READ · WRITE · SHARE</span>
            <strong>Open Articles</strong>
            <span className="articles-destination-description">
              Read concept explainers, discover study strategies, follow authors and publish your
              own articles.
            </span>
            <span className="articles-destination-action">
              Explore articles <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </Link>
        </div>
        <p className="articles-destination-footnote">
          You can switch between the dashboard and Articles at any time.
        </p>
      </section>
      <style>{`
        .articles-destination-page{min-height:70vh;display:grid;place-items:center;padding:clamp(18px,4vw,48px);color:var(--foreground,#172033)}
        .articles-destination-shell{width:min(100%,980px);margin:auto}
        .articles-destination-eyebrow{font-size:11px;letter-spacing:.19em;font-weight:850;opacity:.65}
        .articles-destination-shell h1{font-size:clamp(30px,5vw,48px);line-height:1.08;letter-spacing:-.045em;margin:14px 0 10px}
        .articles-destination-subtitle{max-width:620px;line-height:1.7;opacity:.75;margin:0 0 28px}
        .articles-destination-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
        .articles-destination-card{position:relative;isolation:isolate;overflow:hidden;display:flex;flex-direction:column;align-items:flex-start;gap:12px;min-height:270px;padding:clamp(22px,3vw,32px);border:1px solid var(--border,#dfe5ef);border-radius:28px;color:inherit;text-decoration:none;background:color-mix(in srgb,var(--card,#fff) 84%,transparent);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);box-shadow:0 12px 38px #14213d0a;transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}
        .articles-destination-card:before{content:"";position:absolute;inset:0;z-index:-1;opacity:.8;background:radial-gradient(ellipse at 90% 0%,var(--glow,#dbeafe),transparent 62%)}
        .articles-destination-card:hover{transform:translateY(-4px);border-color:var(--accent,#93c5fd);box-shadow:0 20px 48px #14213d18}
        .articles-destination-card:focus-visible{outline:3px solid var(--ring,#60a5fa);outline-offset:4px}
        .articles-destination-dashboard{--glow:#dbeafe;--accent:#93c5fd}
        .articles-destination-articles{--glow:#d9f7f0;--accent:#7dd3c7}
        .articles-destination-icon{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:color-mix(in srgb,var(--card,#fff) 75%,transparent);border:1px solid var(--border,#e5e7eb)}
        .articles-destination-kicker{font-size:10px;letter-spacing:.15em;font-weight:850;opacity:.68}
        .articles-destination-card strong{font-size:clamp(22px,3vw,29px);letter-spacing:-.035em}
        .articles-destination-description{font-size:14px;line-height:1.75;max-width:430px;opacity:.76}
        .articles-destination-action{display:flex;align-items:center;gap:7px;margin-top:auto;padding-top:8px;font-size:13px;font-weight:800}
        .articles-destination-footnote{font-size:12px;opacity:.6;margin-top:18px}
        .dark .articles-destination-dashboard{--glow:#183a5a;--accent:#4b8fc7}
        .dark .articles-destination-articles{--glow:#164b46;--accent:#4baba0}
        @media(max-width:640px){.articles-destination-grid{grid-template-columns:1fr}.articles-destination-card{min-height:225px;border-radius:23px}}
        @media(prefers-reduced-motion:reduce){.articles-destination-card{transition:none}.articles-destination-card:hover{transform:none}}
      `}</style>
    </main>
  );
}
