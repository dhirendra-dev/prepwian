import { useEffect, useState, type CSSProperties, type TransitionEvent } from "react";
import { Logo } from "@/components/Logo";

const splashMessages = [
  {
    icon: "◒",
    label: "FOCUS",
    text: "Build a calmer daily study rhythm",
    status: "Setting your focus space",
  },
  {
    icon: "✦",
    label: "PRACTICE",
    text: "Turn preparation into steady progress",
    status: "Loading your practice tools",
  },
  {
    icon: "▣",
    label: "PLAN",
    text: "Know what to study next and why",
    status: "Organising your next steps",
  },
  {
    icon: "↗",
    label: "MOVE FORWARD",
    text: "Study together. Keep moving closer to JEE.",
    status: "Bringing your study hub to life",
  },
] as const;

const splashFeatures = [
  { icon: "▤", label: "Materials" },
  { icon: "◈", label: "CBT Tests" },
  { icon: "◒", label: "Focus Timer" },
  { icon: "✦", label: "Daily Quiz" },
  { icon: "♧", label: "Community" },
  { icon: "⌁", label: "AI Study Help" },
] as const;

export function LogoSplash() {
  const [show, setShow] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShow(false);
      return;
    }

    // Give the opening enough time to communicate the product, without making it feel like a loader.
    const leaveTimer = window.setTimeout(() => setLeaving(true), 2480);
    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % splashMessages.length);
    }, 520);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearInterval(messageTimer);
    };
  }, []);

  const finishFade = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.propertyName === "opacity") {
      setShow(false);
    }
  };

  if (!show) return null;

  const currentMessage = splashMessages[messageIndex] ?? splashMessages[0];

  return (
    <div
      aria-hidden="true"
      onTransitionEnd={finishFade}
      className={`jph-splash fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-[420ms] motion-reduce:duration-0 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <span className="jph-splash-aurora jph-splash-aurora-one" />
      <span className="jph-splash-aurora jph-splash-aurora-two" />
      <span className="jph-splash-grid" />
      <div className="jph-splash-stage">
        <div className="jph-splash-mark-wrap">
          <span className="jph-splash-ring jph-splash-ring-one" />
          <span className="jph-splash-ring jph-splash-ring-two" />
          <span className="jph-splash-star jph-splash-star-one">✦</span>
          <span className="jph-splash-star jph-splash-star-two">·</span>
          <div className="jph-splash-mark">
            <Logo className="h-24 w-24 rounded-[26px]" />
          </div>
        </div>
        <div className="jph-splash-copy">
          <p className="jph-splash-kicker">YOUR FOCUS SPACE</p>
          <h1>
            JEE Prep <span>Hub</span>
          </h1>
          <p className="jph-splash-tagline">Study with focus. Move with purpose.</p>
        </div>
        <div className="jph-splash-feature" key={currentMessage.label}>
          <span className="jph-splash-feature-icon">{currentMessage.icon}</span>
          <span>
            <strong>{currentMessage.label}</strong>
            <small>{currentMessage.text}</small>
          </span>
        </div>
        <div className="jph-splash-feature-dots" aria-hidden="true">
          {splashMessages.map((message, index) => (
            <span key={message.label} className={index === messageIndex ? "is-active" : ""} />
          ))}
        </div>
        <div className="jph-splash-offerings">
          {splashFeatures.map((feature, index) => (
            <span
              key={feature.label}
              style={{ "--feature-delay": `${index * 70 + 480}ms` } as CSSProperties}
            >
              <b>{feature.icon}</b>
              {feature.label}
            </span>
          ))}
        </div>
        <div className="jph-splash-progress" aria-hidden="true">
          <span />
        </div>
        <p className="jph-splash-status">
          {currentMessage.status}
          <span>...</span>
        </p>
      </div>
      <style>{`
        .jph-splash {
          overflow: hidden;
          isolation: isolate;
          color: var(--foreground);
          background:
            radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 30%),
            radial-gradient(circle at 15% 15%, color-mix(in srgb, #5eead4 11%, transparent), transparent 28%),
            var(--background);
        }
        .jph-splash::after {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          content: "";
          background: linear-gradient(120deg, transparent 22%, color-mix(in srgb, white 8%, transparent) 48%, transparent 71%);
          transform: translateX(-100%);
          animation: jph-splash-sheen 1.8s ease-out .1s both;
        }
        .jph-splash-aurora {
          position: absolute;
          width: min(62vw, 620px);
          aspect-ratio: 1;
          border-radius: 999px;
          filter: blur(42px);
          opacity: .35;
          pointer-events: none;
          animation: jph-splash-breathe 4s ease-in-out infinite alternate;
        }
        .jph-splash-aurora-one { top: -26%; left: -18%; background: #35d6ff; }
        .jph-splash-aurora-two { right: -20%; bottom: -30%; background: #8b5cf6; animation-delay: -1.6s; }
        .jph-splash-grid {
          position: absolute;
          inset: 0;
          opacity: .18;
          pointer-events: none;
          background-image: linear-gradient(color-mix(in srgb, var(--foreground) 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--foreground) 5%, transparent) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(ellipse at center, black, transparent 70%);
        }
        .jph-splash-stage { display: flex; position: relative; z-index: 1; flex-direction: column; align-items: center; width: min(88vw, 430px); text-align: center; animation: jph-splash-stage-in .72s cubic-bezier(.16,1,.3,1) both; }
        .jph-splash-mark-wrap { position: relative; display: grid; place-items: center; width: 190px; height: 190px; }
        .jph-splash-mark { position: relative; display: grid; place-items: center; width: 120px; height: 120px; border: 1px solid color-mix(in srgb, var(--foreground) 16%, transparent); border-radius: 34px; background: color-mix(in srgb, var(--card) 62%, transparent); box-shadow: 0 24px 70px color-mix(in srgb, var(--primary) 24%, transparent), inset 0 1px 0 color-mix(in srgb, white 20%, transparent); backdrop-filter: blur(18px); animation: jph-splash-mark-in .9s cubic-bezier(.16,1,.3,1) .08s both; }
        .jph-splash-ring { position: absolute; border: 1px solid color-mix(in srgb, var(--primary) 35%, transparent); border-radius: 999px; transform: rotate(-20deg); animation: jph-splash-orbit 6s linear infinite; }
        .jph-splash-ring-one { width: 176px; height: 70px; }
        .jph-splash-ring-two { width: 150px; height: 150px; border-color: color-mix(in srgb, #5eead4 25%, transparent); animation-direction: reverse; animation-duration: 8s; }
        .jph-splash-star { position: absolute; color: color-mix(in srgb, var(--primary) 80%, white); font-weight: 800; animation: jph-splash-star 1.8s ease-in-out infinite alternate; }
        .jph-splash-star-one { top: 18px; right: 12px; font-size: 18px; }
        .jph-splash-star-two { bottom: 20px; left: 22px; font-size: 34px; animation-delay: -.7s; }
        .jph-splash-copy { margin-top: -2px; animation: jph-splash-copy-in .65s ease-out .24s both; }
        .jph-splash-kicker { margin: 0; color: color-mix(in srgb, var(--primary) 82%, var(--foreground)); font-size: 10px; font-weight: 800; letter-spacing: .28em; }
        .jph-splash-copy h1 { margin: 10px 0 0; font-family: var(--scholar-display-family, 'Urbanist', system-ui, sans-serif); font-size: clamp(32px, 8vw, 48px); font-weight: 800; letter-spacing: -.06em; line-height: 1; }
        .jph-splash-copy h1 span { background: linear-gradient(100deg, #26c6da, #7c7cff 55%, #d946ef); background-clip: text; -webkit-background-clip: text; color: transparent; }
        .jph-splash-tagline { margin: 13px 0 0; color: var(--muted-foreground); font-size: 13px; letter-spacing: .02em; }
        .jph-splash-feature { display: flex; align-items: center; gap: 11px; width: min(310px, 78vw); min-height: 58px; margin-top: 24px; padding: 10px 14px; border: 1px solid color-mix(in srgb, var(--foreground) 10%, transparent); border-radius: 18px; background: color-mix(in srgb, var(--card) 48%, transparent); box-shadow: inset 0 1px 0 color-mix(in srgb, white 12%, transparent); text-align: left; backdrop-filter: blur(14px); animation: jph-splash-feature-in .42s cubic-bezier(.16,1,.3,1) both; }
        .jph-splash-feature-icon { display: grid; flex: 0 0 auto; place-items: center; width: 32px; height: 32px; border-radius: 11px; color: var(--primary-foreground); background: linear-gradient(135deg, #25d9df, #7386ff 55%, #d946ef); font-size: 16px; font-weight: 900; }
        .jph-splash-feature strong, .jph-splash-feature small { display: block; }
        .jph-splash-feature strong { color: var(--foreground); font-size: 10px; letter-spacing: .15em; }
        .jph-splash-feature small { margin-top: 3px; color: var(--muted-foreground); font-size: 11px; line-height: 1.3; }
        .jph-splash-feature-dots { display: flex; gap: 5px; margin-top: 11px; }
        .jph-splash-feature-dots span { width: 5px; height: 5px; border-radius: 99px; background: color-mix(in srgb, var(--foreground) 20%, transparent); transition: width .25s ease, background .25s ease; }
        .jph-splash-feature-dots span.is-active { width: 18px; background: var(--primary); }
        .jph-splash-offerings { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; width: min(350px, 84vw); margin-top: 14px; }
        .jph-splash-offerings span { display: flex; align-items: center; justify-content: center; gap: 5px; min-width: 0; min-height: 29px; padding: 5px 4px; border: 1px solid color-mix(in srgb, var(--foreground) 9%, transparent); border-radius: 10px; background: color-mix(in srgb, var(--card) 38%, transparent); color: var(--muted-foreground); font-size: 9px; font-weight: 700; white-space: nowrap; opacity: 0; animation: jph-splash-offering-in .45s cubic-bezier(.16,1,.3,1) var(--feature-delay) both; }
        .jph-splash-offerings b { color: var(--primary); font-size: 12px; }
        .jph-splash-progress { position: relative; width: min(260px, 68vw); height: 4px; margin-top: 22px; overflow: hidden; border-radius: 999px; background: color-mix(in srgb, var(--foreground) 11%, transparent); }
        .jph-splash-progress span { display: block; width: 42%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #25d9df, #7386ff, #d946ef); box-shadow: 0 0 18px color-mix(in srgb, var(--primary) 65%, transparent); animation: jph-splash-progress 2.42s cubic-bezier(.2,.8,.2,1) both; }
        .jph-splash-status { margin: 12px 0 0; color: var(--muted-foreground); font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10px; letter-spacing: .08em; opacity: .75; }
        .jph-splash-status span { display: inline-block; width: 18px; overflow: hidden; text-align: left; animation: jph-splash-dots 1s steps(4,end) infinite; }
        @keyframes jph-splash-stage-in { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes jph-splash-mark-in { from { opacity: 0; transform: scale(.72) rotate(-8deg); } 70% { transform: scale(1.035) rotate(2deg); } to { opacity: 1; transform: scale(1) rotate(0); } }
        @keyframes jph-splash-copy-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes jph-splash-feature-in { from { opacity: 0; transform: translateY(7px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes jph-splash-offering-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes jph-splash-progress { from { transform: translateX(-140%); } to { transform: translateX(260%); } }
        @keyframes jph-splash-sheen { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        @keyframes jph-splash-orbit { to { transform: rotate(340deg); } }
        @keyframes jph-splash-breathe { from { transform: scale(.92); opacity: .25; } to { transform: scale(1.08); opacity: .42; } }
        @keyframes jph-splash-star { from { transform: scale(.75) rotate(0); opacity: .42; } to { transform: scale(1.15) rotate(18deg); opacity: 1; } }
        @keyframes jph-splash-dots { from { width: 5px; } to { width: 18px; } }
        @media (prefers-reduced-motion: reduce) {
          .jph-splash::after, .jph-splash-aurora, .jph-splash-stage, .jph-splash-mark, .jph-splash-ring, .jph-splash-star, .jph-splash-copy, .jph-splash-feature, .jph-splash-offerings span, .jph-splash-progress span, .jph-splash-status span { animation: none !important; }
          .jph-splash-stage, .jph-splash-mark, .jph-splash-copy { opacity: 1; transform: none; }
          .jph-splash-progress span { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
