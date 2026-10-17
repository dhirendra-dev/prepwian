import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/official")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Official Website — PREPWIAN" },
      { name: "twitter:description", content: "The only official PREPWIAN domain is jeeprephub.co.in." },

      {
        title: "Official Website — PREPWIAN",
      },
      {
        name: "description",
        content:
          "Verify the official PREPWIAN website. The only official domain is jeeprephub.co.in.",
      },
      {
        property: "og:title",
        content: "Official Website — PREPWIAN",
      },
      {
        property: "og:description",
        content:
          "The only official PREPWIAN domain is jeeprephub.co.in.",
      },
      {
        property: "og:type",
        content: "website",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://jeeprephub.co.in/official",
      },
    ],
  }),
  component: OfficialWebsitePage,
});

const lookalikeDomains = [
  "jeeprephub.com",
  "jeeprephub.org",
  "jeeprephub.net",
  "jeeprephub.in",
  "jeeprephub.online",
  "jeeprephub.site",
  "jeeprephubofficial.com",
  "jeeprephubofficial.in",
  "jeeprephubofficial.org",
  "jeeprephubofficial.net",
];

const verificationSteps = [
  {
    number: "01",
    title: "Read the address",
    text: "The official website address is exactly jeeprephub.co.in.",
  },
  {
    number: "02",
    title: "Check the spelling",
    text: "Watch for extra words, changed letters, or a different domain extension.",
  },
  {
    number: "03",
    title: "Use the official link",
    text: "When unsure, return to jeeprephub.co.in instead of following an unverified link.",
  },
];
function OfficialWebsitePage() {
  const [dark, setDark] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <main className={dark ? "official-page official-dark" : "official-page"}>
      <OfficialStyles />

      <header className="official-header">
        <nav className="official-nav">
          <Link to="/app" className="official-brand">
            <span className="official-brand-mark">
              <ShieldCheck className="h-5 w-5" />
            </span>

            <span>
              <strong>PREPWIAN</strong>
              <small>Official Website</small>
            </span>
          </Link>

          <div className="official-nav-links">
            <a href="#verify">Verify</a>
            <a href="#domains">Domains</a>
            <a href="#article">Guide</a>
            <a href="#founder">Founder</a>
          </div>

          <div className="official-nav-actions">
            <button
              type="button"
              className="official-round-button"
              onClick={() => setDark(!dark)}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <Link to="/app" className="official-nav-cta">
              Open PREPWIAN
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              className="official-round-button official-mobile-menu-button"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="Menu"
            >
              {mobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>

        {mobileMenu && (
          <div className="official-mobile-menu">
            <a href="#verify" onClick={() => setMobileMenu(false)}>
              Verify
            </a>

            <a href="#domains" onClick={() => setMobileMenu(false)}>
              Domains
            </a>

            <a href="#article" onClick={() => setMobileMenu(false)}>
              Guide
            </a>

            <a href="#founder" onClick={() => setMobileMenu(false)}>
              Founder
            </a>

            <Link to="/app" onClick={() => setMobileMenu(false)}>
              Open PREPWIAN
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </header>
            <section className="official-hero">
        <div className="official-hero-copy">
          <div className="official-kicker">
            <ShieldCheck className="h-4 w-4" />
            Official website
          </div>

          <h1>
            One official website.
            <br />
            <span>No confusion.</span>
          </h1>

          <p>
            If you are looking for PREPWIAN, there is one address you
            should remember. Similar names and modified domains should not be
            assumed to represent the platform.
          </p>

          <div className="official-hero-actions">
            <a
              href="https://jeeprephub.co.in/"
              className="official-main-button"
            >
              Visit jeeprephub.co.in
              <ExternalLink className="h-4 w-4" />
            </a>

            <a href="#verify" className="official-text-button">
              How to verify
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="official-domain-highlight">
          <div className="official-domain-top">
            <span className="official-domain-icon">
              <CheckCircle2 className="h-6 w-6" />
            </span>

            <span className="official-status">
              OFFICIAL
            </span>
          </div>

          <div className="official-domain-label">
            The only official domain
          </div>

          <div className="official-domain-name">
            jeeprephub.co.in
          </div>

          <div className="official-domain-divider" />

          <div className="official-domain-meta">
            <Globe2 className="h-4 w-4" />
            PREPWIAN · Founded by Dhirendra Kumar
          </div>
        </div>
      </section>
            <section
        id="verify"
        className="official-section"
      >
        <div className="official-section-heading">
          <span>01 · VERIFY</span>

          <h2>
            Check before you trust.
          </h2>

          <p>
            A few seconds of checking the address can prevent confusion
            with similarly named websites.
          </p>
        </div>

        <div className="official-step-grid">
          {verificationSteps.map((step) => (
            <article
              className="official-step-card"
              key={step.number}
            >
              <span className="official-step-number">
                {step.number}
              </span>

              <h3>{step.title}</h3>

              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>
            <section
        id="domains"
        className="official-section official-warning-section"
      >
        <div className="official-warning-card">
          <div className="official-warning-copy">
            <div className="official-warning-kicker">
              <AlertTriangle className="h-4 w-4" />
              Lookalike domains
            </div>

            <h2>
              Similar names are
              <br />
              not official.
            </h2>

            <p>
              These are examples of domain patterns that someone could
              confuse with PREPWIAN. They are examples only — this
              page does not claim that each domain currently exists or
              is malicious.
            </p>

            <div className="official-warning-note">
              <ShieldCheck className="h-4 w-4 shrink-0" />

              <span>
                Unless explicitly confirmed by PREPWIAN, use only
                <strong> jeeprephub.co.in</strong>.
              </span>
            </div>
          </div>

          <div className="official-domain-list">
            {lookalikeDomains.map((domain) => (
              <div
                className="official-domain-chip"
                key={domain}
              >
                <Globe2 className="h-4 w-4 shrink-0" />

                <span>{domain}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
            <section
        id="article"
        className="official-section official-article-section"
      >
        <div className="official-section-heading">
          <span>02 · OFFICIAL GUIDE</span>

          <h2>
            How to identify the real PREPWIAN.
          </h2>

          <p>
            A detailed guide for students, parents and JEE Aspirants
            who want to make sure they are using the genuine JEE Prep
            Hub platform.
          </p>
        </div>

        <article className="official-article">
          <div className="official-article-meta">
            <span>PREPWIAN · OFFICIAL NOTICE</span>
            <span>For JEE Aspirants</span>
          </div>

          <h3>
            There is only one official PREPWIAN website
          </h3>

          <p>
            As the internet becomes a bigger part of JEE preparation,
            students increasingly discover study resources, communities,
            tests and learning platforms through links shared on social
            media, messaging groups and search results. That convenience
            also creates an easy source of confusion: a website can use
            a familiar name while having a completely different domain.
          </p>

          <p>
            PREPWIAN has one official web address:
            <strong> jeeprephub.co.in</strong>. This is the domain students
            should use when accessing the official PREPWIAN platform.
            A website having the words “PREPWIAN” in its name does
            not, by itself, establish that it belongs to or is operated
            by PREPWIAN.
          </p>

          <h4>
            Why domain verification matters
          </h4>

          <p>
            Domain names are the identity of a website on the internet.
            Small changes can make two addresses look almost identical
            while leading to completely different websites. For example,
            changing the domain extension, adding a word such as
            “official”, changing the spelling, or adding an extra
            character can create an address that looks familiar at
            first glance.
          </p>

          <p>
            This is why students should not rely only on a logo, page
            design, profile picture, search-result title or the words
            displayed on a website. Before signing in, entering personal
            information or trusting a claim of affiliation, check the
            actual address shown in the browser.
          </p>

          <div className="official-article-callout">
            <ShieldCheck className="h-5 w-5 shrink-0" />

            <div>
              <strong>
                Remember the exact address
              </strong>

              <span>
                https://jeeprephub.co.in/
              </span>
            </div>
          </div>

          <h4>
            What about similar domains?
          </h4>

          <p>
            Students may come across domains that contain similar words,
            different extensions, additional terms or slightly modified
            spellings. Such addresses should not automatically be treated
            as official PREPWIAN websites.
          </p>

          <p>
            The examples listed on this page are provided to demonstrate
            the kinds of names that can cause confusion. They are not a
            statement that every example currently exists, is registered,
            or is malicious. The important rule is much simpler: if the
            address is not exactly
            <strong> jeeprephub.co.in</strong>, do not assume that it is
            an official PREPWIAN website unless PREPWIAN has
            explicitly confirmed it.
          </p>

          <h4>
            How students can stay safe
          </h4>

          <ol className="official-article-list">
            <li>
              <strong>Check the browser address.</strong> Look at the
              actual domain rather than relying on the page title or logo.
            </li>

            <li>
              <strong>Check every character.</strong> Look for extra
              words, changed letters, unusual extensions and spelling
              variations.
            </li>

            <li>
              <strong>Use the official starting point.</strong> Bookmark
              jeeprephub.co.in and use it whenever you need the platform.
            </li>

            <li>
              <strong>Be careful with forwarded links.</strong> A link
              shared in a group or social-media post is not automatically
              an official link just because it mentions PREPWIAN.
            </li>

            <li>
              <strong>When unsure, leave the page.</strong> Return to
              jeeprephub.co.in rather than entering credentials or other
              information on an unverified website.
            </li>
          </ol>

          <h4>
            A note for the JEE community
          </h4>

          <p>
            JEE preparation already comes with enough noise: thousands of
            resources, groups, channels, applications and websites compete
            for students’ attention. The purpose of this page is not to
            create fear. It is simply to give every JEE Aspirant one clear
            reference point.
          </p>

          <p>
            If you are looking for the official PREPWIAN platform,
            remember one address:
            <strong> jeeprephub.co.in</strong>.
          </p>
        </article>
      </section>
            <section
        id="founder"
        className="official-section"
      >
        <div className="official-founder-card">
          <div className="official-founder-photo-wrap">
            <img
              src="/founder-dhirendra-portrait.jpg"
              alt="Dhirendra Kumar, founder of PREPWIAN"
              className="official-founder-photo"
            />
          </div>

          <div className="official-founder-copy">
            <div className="official-section-label">
              ABOUT PREPWIAN
            </div>

            <h2>
              Founded by Dhirendra Kumar.
            </h2>

            <p>
              PREPWIAN is built for JEE Aspirants, bringing
              preparation resources, learning tools, tests, planning
              and student-focused features together in one platform.
            </p>
          </div>

          <div className="official-founder-domain">
            <span>Official domain</span>

            <strong>
              jeeprephub.co.in
            </strong>
          </div>
        </div>
      </section>
            <section className="official-final-section">
        <div className="official-final-card">
          <span className="official-final-icon">
            <ShieldCheck className="h-6 w-6" />
          </span>

          <div className="official-section-label">
            REMEMBER THIS
          </div>

          <h2>
            jeeprephub.co.in
          </h2>

          <p>
            Only jeeprephub.co.in should be treated as the official
            PREPWIAN website.
          </p>

          <a
            href="https://jeeprephub.co.in/"
            className="official-main-button"
          >
            Open official website
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      <footer className="official-footer">
        <div>
          <strong>PREPWIAN</strong>

          <span>
            Official Website · Founded by Dhirendra Kumar
          </span>
        </div>

        <div className="official-footer-links">
          <a href="#article">
            Official Guide
          </a>

          <Link to="/app">
            PREPWIAN
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </footer>
    </main>
  );
}
function OfficialStyles() {
  return (
    <style>{`
      html {
        scroll-behavior: smooth;
      }

      .official-page {
        --bg: #f4f9fd;
        --surface: rgba(255, 255, 255, 0.82);
        --surface-solid: #ffffff;
        --border: rgba(15, 42, 76, 0.09);
        --text: #102a4c;
        --muted: #63758a;
        --soft: #edf6fb;
        --blue: #0b78b8;
        --blue-dark: #123b70;
        --cyan: #10a7c7;
        --warning-bg: #fffaf0;
        --warning-border: #f2dfb1;
        --warning: #9a6911;

        min-height: 100vh;
        overflow-x: hidden;
        background:
          radial-gradient(circle at 8% 5%, rgba(90, 210, 240, 0.14), transparent 28rem),
          radial-gradient(circle at 92% 28%, rgba(111, 160, 255, 0.10), transparent 30rem),
          var(--bg);
        color: var(--text);
        font-family: inherit;
      }

      .official-page * {
        box-sizing: border-box;
      }

      .official-dark {
        --bg: #07111e;
        --surface: rgba(15, 30, 48, 0.76);
        --surface-solid: #0f1e30;
        --border: rgba(255, 255, 255, 0.10);
        --text: #eef8ff;
        --muted: #9cafc2;
        --soft: #10263a;
        --blue: #58c7f0;
        --blue-dark: #9bdff7;
        --cyan: #64d7e8;
        --warning-bg: rgba(91, 66, 17, 0.18);
        --warning-border: rgba(245, 199, 84, 0.18);
        --warning: #f5d98a;

        background:
          radial-gradient(circle at 8% 5%, rgba(32, 178, 218, 0.11), transparent 28rem),
          radial-gradient(circle at 92% 28%, rgba(81, 116, 220, 0.10), transparent 30rem),
          var(--bg);
      }

      .official-header {
        position: sticky;
        top: 0;
        z-index: 40;
        padding: 14px 16px;
        background: color-mix(in srgb, var(--bg) 76%, transparent);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }

      .official-nav {
        max-width: 1180px;
        margin: 0 auto;
        min-height: 58px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 8px 10px 8px 14px;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: var(--surface);
        box-shadow: 0 12px 40px rgba(15, 42, 76, 0.06);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
      }

      .official-brand {
        display: inline-flex;
        min-width: 0;
        align-items: center;
        gap: 10px;
        color: var(--text);
        text-decoration: none;
      }

      .official-brand-mark {
        display: grid;
        width: 38px;
        height: 38px;
        flex: 0 0 auto;
        place-items: center;
        border-radius: 12px;
        color: var(--blue);
        background: var(--soft);
        border: 1px solid var(--border);
      }

      .official-brand strong {
        display: block;
        font-size: 13px;
        line-height: 1.1;
      }

      .official-brand small {
        display: block;
        margin-top: 3px;
        color: var(--muted);
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.17em;
        text-transform: uppercase;
      }

      .official-nav-links {
        display: flex;
        align-items: center;
        gap: 28px;
      }

      .official-nav-links a,
      .official-footer a {
        color: var(--muted);
        font-size: 12px;
        text-decoration: none;
        transition: color 160ms ease;
      }

      .official-nav-links a:hover,
      .official-footer a:hover {
        color: var(--text);
      }

      .official-nav-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .official-round-button {
        display: grid;
        width: 38px;
        height: 38px;
        place-items: center;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--surface-solid);
        color: var(--muted);
        cursor: pointer;
      }

      .official-nav-cta {
        display: inline-flex;
        min-height: 38px;
        align-items: center;
        gap: 7px;
        padding: 0 13px;
        border-radius: 12px;
        background: var(--blue-dark);
        color: white;
        font-size: 11px;
        font-weight: 700;
        text-decoration: none;
      }

      .official-dark .official-nav-cta {
        color: #07111e;
        background: #d9f5ff;
      }

      .official-mobile-menu-button {
        display: none;
      }

      .official-mobile-menu {
        max-width: 1180px;
        margin: 8px auto 0;
        padding: 10px;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: var(--surface-solid);
        box-shadow: 0 16px 40px rgba(15, 42, 76, 0.08);
      }

      .official-mobile-menu a {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 12px;
        border-radius: 11px;
        color: var(--text);
        font-size: 13px;
        text-decoration: none;
      }

      .official-mobile-menu a:hover {
        background: var(--soft);
      }

      .official-hero {
        max-width: 1180px;
        margin: 0 auto;
        padding: 72px 20px 82px;
        display: grid;
        grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.72fr);
        gap: 70px;
        align-items: center;
      }

      .official-kicker,
      .official-warning-kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--blue);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }

      .official-hero-copy h1 {
        max-width: 780px;
        margin: 18px 0 0;
        font-size: clamp(42px, 6vw, 76px);
        line-height: 0.99;
        letter-spacing: -0.055em;
        font-weight: 700;
      }

      .official-hero-copy h1 span {
        color: var(--blue);
      }

      .official-hero-copy > p {
        max-width: 650px;
        margin: 26px 0 0;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.85;
      }

      .official-hero-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 18px;
        margin-top: 30px;
      }

      .official-main-button {
        display: inline-flex;
        min-height: 48px;
        align-items: center;
        justify-content: center;
        gap: 9px;
        padding: 0 18px;
        border-radius: 14px;
        background: var(--blue-dark);
        color: white;
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        box-shadow: 0 12px 28px rgba(18, 59, 112, 0.14);
      }

      .official-dark .official-main-button {
        color: #07111e;
        background: #d9f5ff;
      }

      .official-text-button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: var(--text);
        font-size: 13px;
        font-weight: 650;
        text-decoration: none;
      }
            .official-domain-highlight {
        min-width: 0;
        padding: 30px;
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 30px;
        background:
          radial-gradient(circle at 90% 0%, rgba(84, 213, 245, 0.22), transparent 42%),
          linear-gradient(145deg, #163f73, #0c294f);
        color: white;
        box-shadow: 0 28px 70px rgba(18, 59, 112, 0.20);
      }

      .official-domain-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .official-domain-icon {
        display: grid;
        width: 50px;
        height: 50px;
        place-items: center;
        border-radius: 16px;
        color: #9eefff;
        background: rgba(120, 226, 249, 0.10);
        border: 1px solid rgba(154, 239, 255, 0.16);
      }

      .official-status {
        padding: 7px 10px;
        border-radius: 999px;
        color: #b9f7d2;
        background: rgba(82, 220, 137, 0.10);
        border: 1px solid rgba(82, 220, 137, 0.20);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.18em;
      }

      .official-domain-label {
        margin-top: 42px;
        color: rgba(255,255,255,0.48);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      .official-domain-name {
        margin-top: 10px;
        overflow-wrap: anywhere;
        font-size: clamp(28px, 4vw, 40px);
        line-height: 1.1;
        font-weight: 700;
        letter-spacing: -0.04em;
      }

      .official-domain-divider {
        height: 1px;
        margin: 26px 0;
        background: rgba(255,255,255,0.12);
      }

      .official-domain-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(255,255,255,0.60);
        font-size: 12px;
        line-height: 1.5;
      }

      .official-section {
        max-width: 1180px;
        margin: 0 auto;
        padding: 82px 20px;
      }

      .official-section-heading {
        max-width: 700px;
      }

      .official-section-heading > span,
      .official-section-label {
        color: var(--blue);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.20em;
      }

      .official-section-heading h2 {
        margin: 14px 0 0;
        font-size: clamp(32px, 4vw, 52px);
        line-height: 1.05;
        letter-spacing: -0.045em;
      }

      .official-section-heading p {
        margin: 18px 0 0;
        color: var(--muted);
        line-height: 1.8;
      }

      .official-step-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 36px;
      }

      .official-step-card {
        min-width: 0;
        padding: 25px;
        border: 1px solid var(--border);
        border-radius: 24px;
        background: var(--surface);
        box-shadow: 0 16px 50px rgba(15, 42, 76, 0.055);
      }

      .official-step-number {
        display: grid;
        width: 38px;
        height: 38px;
        place-items: center;
        border-radius: 12px;
        background: var(--soft);
        color: var(--blue);
        font-size: 10px;
        font-weight: 800;
      }

      .official-step-card h3 {
        margin: 24px 0 0;
        font-size: 17px;
      }

      .official-step-card p {
        margin: 9px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.75;
      }

      .official-warning-section {
        padding-top: 30px;
      }

      .official-warning-card {
        display: grid;
        grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.22fr);
        gap: 48px;
        padding: 38px;
        border: 1px solid var(--warning-border);
        border-radius: 30px;
        background: var(--warning-bg);
      }

      .official-warning-kicker {
        color: var(--warning);
      }

      .official-warning-copy h2 {
        margin: 17px 0 0;
        font-size: clamp(30px, 4vw, 48px);
        line-height: 1.04;
        letter-spacing: -0.045em;
      }

      .official-warning-copy > p {
        margin: 18px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.8;
      }

      .official-warning-note {
        display: flex;
        gap: 9px;
        margin-top: 22px;
        padding: 13px 14px;
        border: 1px solid var(--warning-border);
        border-radius: 14px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.6;
      }

      .official-warning-note strong {
        color: var(--text);
      }

      .official-domain-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        align-content: start;
      }

      .official-domain-chip {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 13px 14px;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: var(--surface);
        color: var(--muted);
        font-size: 12px;
      }

      .official-domain-chip span {
        min-width: 0;
        overflow-wrap: anywhere;
      }
            .official-article-section {
        padding-top: 30px;
      }

      .official-article {
        max-width: 900px;
        margin-top: 38px;
        padding: 34px;
        border: 1px solid var(--border);
        border-radius: 28px;
        background: var(--surface);
        box-shadow: 0 18px 60px rgba(15, 42, 76, 0.05);
      }

      .official-article-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border);
        color: var(--muted);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .official-article h3 {
        margin: 34px 0 0;
        font-size: clamp(28px, 4vw, 42px);
        line-height: 1.08;
        letter-spacing: -0.04em;
      }

      .official-article h4 {
        margin: 34px 0 0;
        font-size: 20px;
        line-height: 1.2;
        letter-spacing: -0.02em;
      }

      .official-article p {
        margin: 16px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.9;
      }

      .official-article p strong {
        color: var(--text);
        font-weight: 700;
      }

      .official-article-callout {
        display: flex;
        align-items: center;
        gap: 13px;
        margin-top: 26px;
        padding: 17px 18px;
        border: 1px solid rgba(16, 167, 199, 0.16);
        border-radius: 16px;
        background: var(--soft);
        color: var(--blue);
      }

      .official-article-callout strong {
        display: block;
        color: var(--text);
        font-size: 12px;
      }

      .official-article-callout span {
        display: block;
        margin-top: 4px;
        overflow-wrap: anywhere;
        color: var(--blue);
        font-size: 13px;
        font-weight: 700;
      }

      .official-article-list {
        display: grid;
        gap: 12px;
        margin: 20px 0 0;
        padding: 0;
        list-style: none;
        counter-reset: guide-step;
      }

      .official-article-list li {
        counter-increment: guide-step;
        position: relative;
        padding: 15px 16px 15px 52px;
        border: 1px solid var(--border);
        border-radius: 15px;
        background: color-mix(in srgb, var(--surface) 76%, var(--soft));
        color: var(--muted);
        font-size: 13px;
        line-height: 1.7;
      }

      .official-article-list li::before {
        content: counter(guide-step, decimal-leading-zero);
        position: absolute;
        left: 16px;
        top: 15px;
        color: var(--blue);
        font-size: 10px;
        font-weight: 800;
      }

      .official-article-list strong {
        color: var(--text);
      }

      .official-founder-card {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 24px;
        align-items: center;
        padding: 30px;
        border: 1px solid var(--border);
        border-radius: 28px;
        background: var(--surface);
        box-shadow: 0 18px 60px rgba(15, 42, 76, 0.05);
      }

      .official-founder-photo-wrap {
        width: 96px;
        height: 96px;
        padding: 3px;
        overflow: hidden;
        border-radius: 26px;
        background: linear-gradient(
          145deg,
          rgba(16,167,199,0.45),
          rgba(18,59,112,0.22)
        );
        box-shadow: 0 12px 30px rgba(18, 59, 112, 0.10);
      }

      .official-founder-photo {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 23px;
      }

      .official-founder-copy h2 {
        margin: 9px 0 0;
        font-size: 28px;
        letter-spacing: -0.035em;
      }

      .official-founder-copy p {
        max-width: 700px;
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.75;
      }

      .official-founder-domain {
        min-width: 190px;
        padding: 15px 16px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: var(--soft);
      }

      .official-founder-domain span {
        display: block;
        color: var(--muted);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.15em;
        text-transform: uppercase;
      }

      .official-founder-domain strong {
        display: block;
        margin-top: 6px;
        color: var(--blue);
        font-size: 13px;
      }

      .official-final-section {
        max-width: 900px;
        margin: 0 auto;
        padding: 80px 20px 110px;
      }

      .official-final-card {
        padding: 52px 28px;
        border-radius: 30px;
        text-align: center;
        border: 1px solid rgba(18, 59, 112, 0.10);
        background:
          linear-gradient(145deg, #e8f8ff, #f9fcff);
        box-shadow: 0 30px 90px rgba(18, 59, 112, 0.10);
      }

      .official-dark .official-final-card {
        border-color: rgba(103, 232, 249, 0.13);
        background: linear-gradient(145deg, #102c4b, #0b1d33);
      }

      .official-final-icon {
        display: grid;
        width: 48px;
        height: 48px;
        margin: 0 auto 18px;
        place-items: center;
        border-radius: 15px;
        color: var(--blue);
        background: rgba(103, 232, 249, 0.10);
      }

      .official-final-card h2 {
        margin: 15px 0 0;
        overflow-wrap: anywhere;
        font-size: clamp(30px, 6vw, 54px);
        letter-spacing: -0.05em;
      }

      .official-final-card p {
        max-width: 580px;
        margin: 15px auto 25px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.75;
      }

      .official-footer {
        max-width: 1180px;
        margin: 0 auto;
        padding: 28px 20px 40px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        border-top: 1px solid var(--border);
      }

      .official-footer strong {
        display: block;
        font-size: 13px;
      }

      .official-footer span {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 10px;
      }

      .official-footer a {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .official-footer-links {
        display: flex;
        align-items: center;
        gap: 22px;
      }
            @media (max-width: 900px) {
        .official-hero {
          grid-template-columns: 1fr;
          gap: 40px;
          padding-top: 55px;
        }

        .official-step-grid {
          grid-template-columns: 1fr;
        }

        .official-warning-card {
          grid-template-columns: 1fr;
        }

        .official-founder-card {
          grid-template-columns: auto 1fr;
        }

        .official-founder-domain {
          grid-column: 2;
        }
      }

      @media (max-width: 700px) {
        .official-header {
          padding: 10px;
        }

        .official-nav {
          border-radius: 16px;
        }

        .official-nav-links,
        .official-nav-cta {
          display: none;
        }

        .official-mobile-menu-button {
          display: grid;
        }

        .official-hero {
          padding: 48px 18px 65px;
        }

        .official-hero-copy h1 {
          font-size: clamp(40px, 12vw, 58px);
        }

        .official-hero-copy > p {
          font-size: 15px;
          line-height: 1.75;
        }

        .official-domain-highlight {
          padding: 24px;
          border-radius: 24px;
        }

        .official-domain-name {
          font-size: 29px;
        }

        .official-section {
          padding: 62px 18px;
        }

        .official-warning-card {
          padding: 24px;
          border-radius: 24px;
        }

        .official-article {
          padding: 24px;
          border-radius: 24px;
        }

        .official-article-meta {
          align-items: flex-start;
          flex-direction: column;
        }

        .official-founder-photo-wrap {
          width: 88px;
          height: 88px;
        }

        .official-domain-list {
          grid-template-columns: 1fr;
        }

        .official-founder-card {
          grid-template-columns: 1fr;
          padding: 24px;
          border-radius: 24px;
        }

        .official-founder-domain {
          grid-column: auto;
          min-width: 0;
        }

        .official-final-section {
          padding: 60px 18px 85px;
        }

        .official-final-card {
          padding: 42px 20px;
          border-radius: 24px;
        }

        .official-footer {
          align-items: flex-start;
          flex-direction: column;
        }

        .official-footer-links {
          align-items: flex-start;
          flex-direction: column;
          gap: 10px;
        }
      }
    `}</style>
  );
}
