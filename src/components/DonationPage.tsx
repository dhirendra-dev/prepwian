import { useState } from "react";
import "./donation-page.css";

type Expense = {
  title: string;
  detail: string;
  amount: number | null;
  amountLabel: string;
  icon: string;
};
export type RecentSupporter = {
  id: string;
  /** Use a public display name approved by the supporter, or "Anonymous supporter". */
  displayName: string;
  /** Optional; only show if the supporter has agreed to publish it. */
  amount?: number;
  /** Optional message approved for public display. */
  message?: string;
  /** Human-readable date, e.g. "15 Oct 2026". */
  dateLabel?: string;
  /** Set by an admin after checking the contribution. */
  verified?: boolean;
};
type DonationPageProps = {
  upiId?: string;
  projectName?: string;
  monthlyGoal?: number;
  /** Recent supporters published by your admin after verifying consent and payment. */
  recentSupporters?: RecentSupporter[];
  /** Keep these figures aligned with the project’s stated, transparent costs. */
  expenses?: Expense[];
};

const PRESETS = [50, 100, 200, 300, 500, 750, 1000, 1500, 2500, 4999];

const DEFAULT_EXPENSES: Expense[] = [
  {
    title: "Domain",
    detail: "The project’s domain cost. No billing period is implied.",
    amount: 700,
    amountLabel: "stated cost",
    icon: "◇",
  },
  {
    title: "Platform running costs",
    detail: "Hosting, database, storage, security, maintenance and other running expenses.",
    amount: 300,
    amountLabel: "+ / month baseline",
    icon: "⌁",
  },
  {
    title: "AI APIs & future improvements",
    detail: "Usage can grow as more students use AI features and new tools are developed.",
    amount: null,
    amountLabel: "variable",
    icon: "✳",
  },
];

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function DonationPage({
  upiId = "dhirendra01@fam",
  projectName = "JEE Prep Hub",
  monthlyGoal = 5000,
  recentSupporters = [],
  expenses = DEFAULT_EXPENSES,
}: DonationPageProps) {
  const [amount, setAmount] = useState(100);
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [showCosts, setShowCosts] = useState(true);
  const [toast, setToast] = useState("");
  const selectedAmount = custom.trim() ? Number(custom) : amount;
  const validAmount =
    Number.isFinite(selectedAmount) && selectedAmount >= 50 && selectedAmount <= 4999;
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const copyUPI = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      notify("UPI ID copied. Thank you for supporting the project!");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      notify(`UPI ID: ${upiId}`);
    }
  };

  const donate = () => {
    if (!validAmount) {
      notify("Choose an amount between ₹50 and ₹4,999.");
      return;
    }
    const params = new URLSearchParams({
      pa: upiId,
      pn: projectName,
      am: selectedAmount.toFixed(2),
      cu: "INR",
      tn: note.trim() || `Voluntary support for ${projectName}`,
    });
    window.location.href = `upi://pay?${params.toString()}`;
  };

  return (
    <main className="jph-donation">
      <div className="jph-orb jph-orb-one" aria-hidden="true" />
      <div className="jph-orb jph-orb-two" aria-hidden="true" />
      <section className="jph-hero">
        <div className="jph-heart-bubble" aria-hidden="true">
          <span>♥</span>
        </div>
        <p className="jph-eyebrow">
          <span className="jph-live-dot" /> KEEP LEARNING ACCESSIBLE
        </p>
        <h1>
          A little support.
          <br />
          <span>A bigger learning journey.</span>
        </h1>
        <p className="jph-hero-copy">
          JEE Prep Hub is a student-powered project built to make useful study tools, resources and
          a supportive learning space easier to access. Keeping it running takes time,
          infrastructure and ongoing maintenance.
        </p>
        <p className="jph-hero-copy jph-hero-copy-secondary">
          Thinking of spending a little on a pizza or burger? If you can comfortably spare it, you
          could support JEE Prep Hub instead. Please never contribute money needed for essentials.
        </p>
        <div className="jph-trust-row">
          <span>♡ Voluntary support</span>
          <span>✦ Core access stays free</span>
          <span>↗ No pressure, ever</span>
        </div>
        <div className="jph-hero-actions">
          <button
            type="button"
            className="jph-primary-btn jph-hero-primary"
            onClick={() =>
              document.getElementById("donation-form")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          >
            <span>♥</span> Support JEE Prep Hub <span className="jph-btn-arrow">↘</span>
          </button>
          <button
            type="button"
            className="jph-secondary-btn jph-hero-secondary"
            onClick={() =>
              document.getElementById("project-costs")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          >
            See where support goes <span>↓</span>
          </button>
        </div>
      </section>

      <div className="jph-layout">
        <section
          className="jph-panel jph-give-panel"
          id="donation-form"
          aria-labelledby="donation-form-heading"
        >
          <div className="jph-panel-heading">
            <div>
              <p className="jph-eyebrow">MAKE A CONTRIBUTION</p>
              <h2 id="donation-form-heading">Choose your amount</h2>
            </div>
            <span className="jph-secure-pill">
              UPI <span>↗</span>
            </span>
          </div>
          <p className="jph-muted">
            Every contribution is optional. Pick what feels comfortable—₹50 is welcome too.
          </p>

          <div className="jph-amount-grid" role="group" aria-label="Suggested donation amounts">
            {PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                className={`jph-amount ${!custom && amount === value ? "is-selected" : ""}`}
                onClick={() => {
                  setAmount(value);
                  setCustom("");
                }}
                aria-pressed={!custom && amount === value}
              >
                {money(value)}
                {value === 100 && <span className="jph-popular">POPULAR</span>}
              </button>
            ))}
          </div>

          <label className="jph-field-label" htmlFor="jph-custom">
            Or enter a custom amount (₹50–₹4,999)
          </label>
          <div className="jph-custom-input">
            <span>₹</span>
            <input
              id="jph-custom"
              type="number"
              min="50"
              max="4999"
              step="1"
              inputMode="numeric"
              placeholder="Enter amount"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>
          {custom && !validAmount && (
            <p className="jph-field-error">Please enter an amount from ₹50 to ₹4,999.</p>
          )}

          <label className="jph-field-label" htmlFor="jph-note">
            A note (optional)
          </label>
          <input
            id="jph-note"
            className="jph-text-input"
            maxLength={80}
            placeholder="e.g. Keep building, team!"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="jph-summary">
            <span>Your contribution</span>
            <strong>{validAmount ? money(selectedAmount) : "—"}</strong>
          </div>
          <button
            type="button"
            className="jph-primary-btn"
            disabled={!validAmount}
            onClick={donate}
            aria-label={
              validAmount
                ? `Support JEE Prep Hub with ${money(selectedAmount)}`
                : "Choose a valid contribution amount"
            }
          >
            <span>♥</span> Support JEE Prep Hub{" "}
            <span className="jph-btn-amount">{validAmount ? money(selectedAmount) : ""}</span>{" "}
            <span className="jph-btn-arrow">↗</span>
          </button>
          <button type="button" className="jph-secondary-btn" onClick={copyUPI}>
            {copied ? "✓ Copied UPI ID" : "Copy UPI ID"}
          </button>
          <div className="jph-upi-detail">
            <span>UPI ID</span>
            <strong>{upiId}</strong>
          </div>
          <p className="jph-smallprint">
            Your UPI app will open if your device supports UPI links. Review the payee and amount in
            your app before approving. Never share your UPI PIN or OTP with anyone.
          </p>
        </section>

        <aside className="jph-side-column">
          <section className="jph-panel jph-impact-panel">
            <div className="jph-panel-heading">
              <div>
                <p className="jph-eyebrow">WHY IT MATTERS</p>
                <h2>Small help, real impact</h2>
              </div>
              <span className="jph-icon-tile">✦</span>
            </div>
            <div className="jph-impact-list">
              <div>
                <span className="jph-impact-icon">▤</span>
                <p>
                  <strong>Study resources</strong>
                  <small>Organise and maintain useful learning materials.</small>
                </p>
              </div>
              <div>
                <span className="jph-impact-icon">⌁</span>
                <p>
                  <strong>Reliable access</strong>
                  <small>Help cover hosting, storage and domain expenses.</small>
                </p>
              </div>
              <div>
                <span className="jph-impact-icon">✳</span>
                <p>
                  <strong>AI APIs and study tools</strong>
                  <small>
                    Help cover usage-based AI API charges and improve planners, practice features
                    and student experience.
                  </small>
                </p>
              </div>
              <div>
                <span className="jph-impact-icon">◷</span>
                <p>
                  <strong>Time for building and fixing</strong>
                  <small>
                    Support ongoing testing, bug fixes, maintenance and the many hours it takes to
                    keep improving the platform.
                  </small>
                </p>
              </div>
              <div>
                <span className="jph-impact-icon">♡</span>
                <p>
                  <strong>A student-first space</strong>
                  <small>Keep core learning access free and welcoming.</small>
                </p>
              </div>
            </div>
          </section>

          <section className="jph-panel jph-story-panel">
            <div className="jph-story-top">
              <span className="jph-story-heart">♥</span>
              <p className="jph-eyebrow">A NOTE FROM THE BUILDER</p>
            </div>
            <h2>Built with effort, kept alive by community.</h2>
            <p>
              JEE Prep Hub started with a simple idea: students should have a place to organise
              their preparation, discover useful resources and find helpful tools without feeling
              alone. Behind every feature are hours of learning, planning, coding, testing, fixing
              bugs and trying again when something breaks. I’m building this while continuing my own
              studies, learning new technologies step by step and doing my best to make the platform
              more useful for students.
            </p>
            <p>
              Keeping a website running also has real ongoing costs: domain renewal, hosting,
              database and file storage, security and maintenance. AI-powered features can create
              API charges that vary with usage, so even a useful tool may cost more as more students
              use it. Troubleshooting deployment and database issues can take many hours too—time
              that could otherwise go to studying. I’m sharing this honestly, not to make anyone
              feel guilty, but so the effort and costs behind a free student project are easier to
              understand. If the platform has made your preparation a little easier, sharing
              feedback or telling a friend about it is already meaningful support. If you choose to
              donate, thank you for helping this student-focused project grow. Please contribute
              only if it is comfortable for you and your family. There is absolutely no pressure,
              and core access should remain free.
            </p>
            <div className="jph-signoff">
              <span className="jph-avatar">D</span>
              <span>
                <strong>Dhirendra</strong>
                <small>Builder of JEE Prep Hub</small>
              </span>
            </div>
          </section>
        </aside>
      </div>

      {recentSupporters.length > 0 && (
        <section
          className="jph-panel jph-supporters-panel"
          aria-labelledby="jph-supporters-heading"
        >
          <div className="jph-supporters-heading">
            <div>
              <p className="jph-eyebrow">COMMUNITY APPRECIATION</p>
              <h2 id="jph-supporters-heading">Recent supporters</h2>
              <p className="jph-muted">
                A thank-you to people who choose to help keep this student project growing.
              </p>
            </div>
            <span className="jph-supporter-count">
              {recentSupporters.length} <small>published</small>
            </span>
          </div>
          <div className="jph-supporters-list">
            {recentSupporters.slice(0, 12).map((supporter) => (
              <article className="jph-supporter-card" key={supporter.id}>
                <span className="jph-supporter-avatar" aria-hidden="true">
                  {supporter.displayName.trim().toLowerCase().startsWith("anonymous")
                    ? "♡"
                    : supporter.displayName.trim().charAt(0).toUpperCase()}
                </span>
                <div className="jph-supporter-main">
                  <div className="jph-supporter-name-row">
                    <strong>{supporter.displayName}</strong>
                    {supporter.verified && (
                      <span className="jph-verified-label">
                        <span>✓</span> Verified
                      </span>
                    )}
                  </div>
                  {supporter.message && <p>“{supporter.message}”</p>}
                  {supporter.dateLabel && <small>{supporter.dateLabel}</small>}
                </div>
                {typeof supporter.amount === "number" && supporter.amount > 0 && (
                  <strong className="jph-supporter-amount">{money(supporter.amount)}</strong>
                )}
              </article>
            ))}
          </div>
          <p className="jph-supporters-note">
            Names, messages and amounts are shown only when approved for public display. Supporters
            can also choose to remain anonymous.
          </p>
        </section>
      )}

      <section
        className="jph-panel jph-cost-panel"
        id="project-costs"
        aria-labelledby="project-costs-heading"
      >
        <button
          type="button"
          className="jph-cost-toggle"
          onClick={() => setShowCosts(!showCosts)}
          aria-expanded={showCosts}
        >
          <span className="jph-cost-icon">⌁</span>
          <span className="jph-cost-title">
            <small>TRANSPARENCY</small>
            <strong id="project-costs-heading">What it takes to keep this running</strong>
          </span>
          <span className="jph-cost-toggle-text">
            {showCosts ? "Hide details" : "View details"} {showCosts ? "−" : "+"}
          </span>
        </button>
        {showCosts && (
          <>
            <p className="jph-muted jph-cost-intro">
              These are the project’s current stated figures, shown plainly. The ₹300+ baseline is
              not a claim that every service is included in one bill, and AI costs vary with usage.
            </p>
            <div className="jph-expense-grid">
              {expenses.map((item) => (
                <div className="jph-expense-card" key={item.title}>
                  <span className="jph-expense-icon">{item.icon}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                  <b>
                    {item.amount === null ? "Variable" : money(item.amount)}
                    <small>{item.amountLabel}</small>
                  </b>
                </div>
              ))}
            </div>
            <p className="jph-disclaimer">
              Donations are voluntary and do not buy special access or guaranteed outcomes. Nobody
              should contribute money they need for food, education, bills or other essentials.
            </p>
          </>
        )}
      </section>

      <section className="jph-thanks-strip">
        <span className="jph-thanks-sparkle">✦</span>
        <div>
          <strong>Can’t donate? You’re still part of the journey.</strong>
          <p>
            Use the free tools, share helpful feedback, and keep studying. Your progress is the
            point.
          </p>
        </div>
        <a href="/feedback">
          Share feedback <span>↗</span>
        </a>
      </section>

      {toast && (
        <div className="jph-toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
