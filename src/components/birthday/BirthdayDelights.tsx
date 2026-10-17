import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Cake,
  Gift,
  Mail,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  WandSparkles,
  X,
} from "lucide-react";
import { BirthdayFireworks } from "@/components/birthday/BirthdayFireworks";
import type { BirthdayActivity, BirthdayPartyTheme } from "@/components/birthday/birthday-types";

const BALLOON_COLORS = ["#f43f5e", "#0ea5e9", "#8b5cf6", "#f59e0b"];
const CONFETTI_COLORS = ["#fb7185", "#fbbf24", "#38bdf8", "#a78bfa", "#34d399", "#fb923c"];
const SURPRISE_NOTES = [
  {
    title: "Your effort is adding up",
    message:
      "Every difficult problem you solve is proof of the patience and potential you already have.",
  },
  {
    title: "One brave step at a time",
    message:
      "You do not need to have it all figured out today. Keep showing up, and let steady progress surprise you.",
  },
  {
    title: "A fresh chapter is yours",
    message:
      "May this year bring good questions, kind people, and more reasons to believe in yourself.",
  },
];

function makeBurstBits(cycle: number) {
  return Array.from({ length: 24 }, (_, index) => {
    const angle = (index / 24) * Math.PI * 2 + (cycle % 4) * 0.13;
    const distance = 52 + ((index * 17 + cycle * 11) % 64);
    const x = Math.cos(angle) * distance;
    const midY = -22 + Math.sin(angle) * 24;
    return {
      x,
      midX: x * 0.44,
      midY,
      y: 22 + Math.max(0, Math.sin(angle)) * 48 + (index % 4) * 8,
      rotation: `${((index * 83 + cycle * 31) % 540) - 180}deg`,
      midRotation: `${((index * 29) % 140) - 70}deg`,
      color: CONFETTI_COLORS[(index + cycle) % CONFETTI_COLORS.length],
      width: index % 5 === 0 ? 4 : 6 + (index % 3),
      height: index % 5 === 0 ? 4 : 8 + (index % 4) * 2,
      round: index % 5 === 0,
      delay: `${(index % 6) * 18}ms`,
      duration: 760 + (index % 5) * 60,
    };
  });
}

export function BirthdayBalloonArt({ id, color }: { id: string; color: string }) {
  return (
    <svg viewBox="0 0 120 158" className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="31%" cy="22%" r="78%">
          <stop offset="0" stopColor="white" stopOpacity="0.92" />
          <stop offset="0.22" stopColor={color} stopOpacity="0.96" />
          <stop offset="0.76" stopColor={color} />
          <stop offset="1" stopColor="#312e81" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={`${id}-shine`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.78" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M60 7C34 7 16 25 17 49c1 24 17 40 34 51l9 6 9-6c17-11 33-27 34-51C104 25 86 7 60 7Z"
        fill={`url(#${id})`}
        stroke="white"
        strokeOpacity="0.32"
        strokeWidth="1.5"
      />
      <path
        d="M39 19c-8 5-12 14-12 24 0 8 2 15 6 21"
        fill="none"
        stroke={`url(#${id}-shine)`}
        strokeLinecap="round"
        strokeWidth="7"
        opacity="0.82"
      />
      <ellipse
        cx="76"
        cy="31"
        rx="12"
        ry="4"
        fill="white"
        opacity="0.18"
        transform="rotate(32 76 31)"
      />
      <path d="m55 105 5 10 5-10-5 2-5-2Z" fill={color} stroke="white" strokeOpacity="0.35" />
      <path
        d="M60 115c-9 9 11 13 0 22-7 6 5 10 0 16"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BirthdayDelights({
  displayName = "Aspirant",
  partyTheme = "pastel",
  onActivity,
}: {
  displayName?: string;
  partyTheme?: BirthdayPartyTheme;
  onActivity?: (activity: BirthdayActivity) => void;
}) {
  const [balloonStage, setBalloonStage] = useState<"inflating" | "ready" | "popped">("inflating");
  const [balloonCycle, setBalloonCycle] = useState(0);
  const [balloonColorIndex, setBalloonColorIndex] = useState(0);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftCycle, setGiftCycle] = useState(0);
  const [openedGiftId, setOpenedGiftId] = useState<number | null>(null);
  const [noteIndex, setNoteIndex] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const [litCandles, setLitCandles] = useState([true, true, true]);
  const [cakeCut, setCakeCut] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const [wandCycle, setWandCycle] = useState(0);
  const [wandTaps, setWandTaps] = useState(0);
  const [secretQuoteIndex, setSecretQuoteIndex] = useState(0);
  const [fireworksCycle, setFireworksCycle] = useState(0);
  const [fireworksActive, setFireworksActive] = useState(false);
  const respawnTimer = useRef<number | null>(null);
  const fireworksTimer = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const burstBits = useMemo(() => makeBurstBits(balloonCycle), [balloonCycle]);
  const firstName = displayName.trim().split(/\s+/)[0] || "Aspirant";
  const allCandlesOut = litCandles.every((lit) => !lit);
  const balloonColor = BALLOON_COLORS[balloonColorIndex];

  useEffect(() => {
    if (balloonStage !== "inflating") return;
    const timer = window.setTimeout(() => setBalloonStage("ready"), 1250);
    return () => window.clearTimeout(timer);
  }, [balloonStage, balloonCycle]);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(
    () => () => {
      if (respawnTimer.current !== null) window.clearTimeout(respawnTimer.current);
      if (fireworksTimer.current !== null) window.clearTimeout(fireworksTimer.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close().catch(() => {});
      }
    },
    [],
  );

  async function playEffect(effect: "balloon-pop" | "gift-open") {
    if (!soundEffectsEnabled || typeof window.AudioContext === "undefined") return;
    try {
      const context = audioContextRef.current ?? new window.AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") await context.resume();
      const now = context.currentTime;

      if (effect === "balloon-pop") {
        const sampleCount = Math.floor(context.sampleRate * 0.12);
        const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let index = 0; index < sampleCount; index += 1) {
          const envelope = 1 - index / sampleCount;
          samples[index] = (Math.random() * 2 - 1) * envelope * envelope;
        }
        const noise = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const noiseGain = context.createGain();
        noise.buffer = buffer;
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(3400, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.12, now + 0.006);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        noise.connect(filter).connect(noiseGain).connect(context.destination);
        noise.start(now);
        noise.stop(now + 0.125);

        const thump = context.createOscillator();
        const thumpGain = context.createGain();
        thump.type = "sine";
        thump.frequency.setValueAtTime(170, now);
        thump.frequency.exponentialRampToValueAtTime(62, now + 0.095);
        thumpGain.gain.setValueAtTime(0.0001, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.09, now + 0.005);
        thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.105);
        thump.connect(thumpGain).connect(context.destination);
        thump.start(now);
        thump.stop(now + 0.11);
        return;
      }

      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const startAt = now + index * 0.075;
        const chime = context.createOscillator();
        const chimeGain = context.createGain();
        chime.type = "sine";
        chime.frequency.setValueAtTime(frequency, startAt);
        chimeGain.gain.setValueAtTime(0.0001, startAt);
        chimeGain.gain.exponentialRampToValueAtTime(0.045, startAt + 0.018);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.34);
        chime.connect(chimeGain).connect(context.destination);
        chime.start(startAt);
        chime.stop(startAt + 0.35);
      });
    } catch {
      // Audio is an optional enhancement; blocked or unavailable sound never interrupts the interaction.
    }
  }

  function replayBalloon() {
    if (respawnTimer.current !== null) window.clearTimeout(respawnTimer.current);
    respawnTimer.current = null;
    setBalloonCycle((cycle) => cycle + 1);
    setBalloonStage("inflating");
  }

  function popBalloon() {
    if (balloonStage !== "ready") return;
    void playEffect("balloon-pop");
    onActivity?.("balloon_pop");
    setBalloonStage("popped");
    if (respawnTimer.current !== null) window.clearTimeout(respawnTimer.current);
    respawnTimer.current = window.setTimeout(() => {
      setBalloonCycle((cycle) => cycle + 1);
      setBalloonStage("inflating");
      respawnTimer.current = null;
    }, 1080);
  }

  function openSurprise(giftId = 0) {
    void playEffect("gift-open");
    setNoteIndex((giftId + giftCycle + (giftOpen ? 1 : 0)) % SURPRISE_NOTES.length);
    setOpenedGiftId(giftId);
    setGiftCycle((cycle) => cycle + 1);
    setGiftOpen(true);
    onActivity?.("gift_open");
  }

  function resetCake() {
    setLitCandles([true, true, true]);
    setCakeCut(false);
  }

  function cutCake() {
    if (!allCandlesOut || cakeCut) return;
    setCakeCut(true);
    onActivity?.("cake_cut");
  }

  function openCapsule() {
    if (!capsuleOpen) {
      setNoteIndex((index) => (index + 1) % SURPRISE_NOTES.length);
      onActivity?.("capsule_open");
    }
    setCapsuleOpen(!capsuleOpen);
  }

  function waveWand() {
    const next = wandTaps + 1;
    setWandTaps(next);
    setWandCycle((cycle) => cycle + 1);
    setBalloonColorIndex((index) => (index + 1) % BALLOON_COLORS.length);
    if (next % 5 === 0) setSecretQuoteIndex((index) => (index + 1) % SURPRISE_NOTES.length);
    onActivity?.("magic_wand");
  }

  function launchFireworks() {
    if (fireworksTimer.current !== null) window.clearTimeout(fireworksTimer.current);
    setFireworksCycle((cycle) => cycle + 1);
    setFireworksActive(true);
    onActivity?.("fireworks");
    fireworksTimer.current = window.setTimeout(() => {
      setFireworksActive(false);
      fireworksTimer.current = null;
    }, 2300);
  }

  const themeBorder = {
    pastel: "border-rose-200/70 dark:border-rose-100/15",
    galaxy: "border-indigo-200/70 dark:border-indigo-100/15",
    candy: "border-pink-200/70 dark:border-pink-100/15",
    golden: "border-amber-200/70 dark:border-amber-100/15",
  }[partyTheme];

  return (
    <section
      className={`birthday-delights ${pageVisible ? "" : "birthday-delights-paused"} rounded-3xl border ${themeBorder} bg-card p-4 shadow-soft sm:p-5`}
      aria-labelledby="birthday-delights-title"
    >
      <style>{`
        @keyframes birthday-balloon-inflate {
          0% { opacity: .36; transform: translateY(12px) scale(.34,.42) rotate(-8deg); }
          48% { opacity: 1; transform: translateY(-4px) scale(1.055,.96) rotate(3deg); }
          73% { transform: translateY(-2px) scale(.98,1.025) rotate(-2deg); }
          100% { transform: translateY(0) scale(1) rotate(0); }
        }
        @keyframes birthday-balloon-float {
          0%,100% { transform: translate3d(0,0,0) rotate(-2deg); }
          28% { transform: translate3d(2px,-5px,0) rotate(1.5deg); }
          58% { transform: translate3d(-2px,-9px,0) rotate(2.5deg); }
          82% { transform: translate3d(1px,-4px,0) rotate(-1deg); }
        }
        @keyframes birthday-balloon-pop {
          0% { opacity: 1; transform: scale(1); }
          28% { opacity: 1; transform: scale(1.13,.9) rotate(2deg); }
          54% { opacity: .92; transform: scale(.9,1.1) rotate(-3deg); }
          100% { opacity: 0; transform: scale(.5); filter: blur(2px); }
        }
        @keyframes birthday-confetti-flight {
          0% { opacity: 0; transform: translate3d(-50%,-50%,0) scale(.65) rotate(0); }
          14% { opacity: 1; }
          48% { opacity: 1; transform: translate3d(calc(-50% + var(--burst-mid-x)),calc(-50% + var(--burst-mid-y)),0) scale(1) rotate(var(--burst-mid-rotation)); }
          100% { opacity: 0; transform: translate3d(calc(-50% + var(--burst-x)),calc(-50% + var(--burst-y)),0) scale(.8) rotate(var(--burst-rotation)); }
        }
        @keyframes birthday-mini-balloon {
          0% { opacity: 0; transform: translateY(12px) scale(.35); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-72px) scale(.8) rotate(var(--mini-rotate)); }
        }
        @keyframes birthday-gift-lid-open {
          0% { transform: translateY(0) rotate(0); }
          68% { transform: translateY(-12px) rotate(-15deg); }
          100% { transform: translateY(-10px) rotate(-11deg); }
        }
        @keyframes birthday-gift-card-reveal {
          0% { opacity: 0; transform: translateY(8px) scale(.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes birthday-mini-flame {
          0%,100% { transform: translateX(-50%) rotate(-4deg) scale(.94); }
          50% { transform: translateX(-50%) rotate(4deg) scale(1.08); }
        }
        @keyframes birthday-mini-candle-out {
          0% { opacity: 1; transform: translate(-50%,0) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-11px) scale(.3); }
        }
        @keyframes birthday-mini-cake-reveal {
          0% { opacity: 0; transform: translateY(6px) scale(.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes birthday-letter-unfold { 0% { opacity: 0; transform: translateY(6px) scaleY(.55); transform-origin: top; } 100% { opacity: 1; transform: translateY(0) scaleY(1); } }
        .birthday-envelope-flap { transform-box: fill-box; transform-origin: 50% 0%; transition: transform .3s ease; }
        .birthday-envelope-open .birthday-envelope-flap { transform: rotateX(180deg); }
        .birthday-envelope-paper { opacity: 0; transform: translateY(7px); transition: opacity .3s ease, transform .32s cubic-bezier(.16,1,.3,1); }
        .birthday-envelope-open .birthday-envelope-paper { opacity: 1; transform: translateY(-8px); }
        @keyframes birthday-capsule-crack { 0% { transform: rotate(0) scale(1); } 35% { transform: rotate(-7deg) scale(1.08); } 70% { transform: rotate(6deg) scale(.96); } 100% { transform: rotate(0) scale(1); } }
        @keyframes birthday-wand-spark { 0% { opacity: 0; transform: translate(0,0) scale(.3) rotate(0); } 22% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--wand-x),var(--wand-y)) scale(.1) rotate(100deg); } }
        @keyframes birthday-wish-burst {
          0% { opacity: 1; transform: translate(-50%,-50%) scale(1) rotate(0); }
          100% { opacity: 0; transform: translate(calc(-50% + var(--wish-x)),calc(-50% + var(--wish-y))) scale(.25) rotate(var(--wish-rotation)); }
        }
        .birthday-balloon-inflating { animation: birthday-balloon-inflate 1.25s cubic-bezier(.2,.8,.2,1) both; }
        .birthday-balloon-ready { animation: birthday-balloon-float 3.6s ease-in-out infinite; transform-origin: 50% 80%; }
        .birthday-balloon-popped { animation: birthday-balloon-pop .28s ease-out both; }
        .birthday-delights-paused *, .birthday-delights-paused *::before, .birthday-delights-paused *::after { animation-play-state: paused !important; }
        .birthday-gift-open { animation: birthday-gift-lid-open .46s cubic-bezier(.2,.8,.2,1) both; transform-origin: 50% 100%; }
        .birthday-gift-card-reveal { animation: birthday-gift-card-reveal .35s cubic-bezier(.16,1,.3,1) both; }
        .birthday-mini-flame { animation: birthday-mini-flame .58s ease-in-out infinite alternate; transform-origin: 50% 100%; }
        .birthday-mini-candle-out { animation: birthday-mini-candle-out .26s ease-out both; }
        .birthday-mini-cake-half { transition: transform .62s cubic-bezier(.18,.72,.28,1.2); }
        .birthday-mini-cake-cut .birthday-mini-cake-left { transform: translateX(-7px) rotate(-3deg); }
        .birthday-mini-cake-cut .birthday-mini-cake-right { transform: translateX(7px) rotate(3deg); }
        .birthday-mini-cake-cut .birthday-mini-cake-filling { opacity: 1; }
        .birthday-mini-cake-reveal { animation: birthday-mini-cake-reveal .36s cubic-bezier(.16,1,.3,1) both; }
        .birthday-letter-unfold { animation: birthday-letter-unfold .42s cubic-bezier(.16,1,.3,1) both; }
        .birthday-capsule-crack { animation: birthday-capsule-crack .38s ease-out both; }
        .birthday-wand-spark { position:absolute; left:50%; top:50%; width:6px; height:6px; border-radius:50%; background:#fbbf24; box-shadow:0 0 12px #fbbf24; animation:birthday-wand-spark .7s ease-out var(--wand-delay) both; }
        .birthday-wish-confetti i { position:absolute; left:50%; top:50%; width:6px; height:9px; border-radius:2px; animation: birthday-wish-burst .8s cubic-bezier(.1,.7,.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .birthday-delights *, .birthday-delights *::before, .birthday-delights *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
          .birthday-wish-confetti i { animation: none !important; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
          <h2 id="birthday-delights-title" className="truncate font-display text-base font-bold">
            Little moments of joy
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setSoundEffectsEnabled((enabled) => !enabled)}
          aria-label={
            soundEffectsEnabled ? "Mute birthday sound effects" : "Turn on birthday sound effects"
          }
          aria-pressed={soundEffectsEnabled}
          title={soundEffectsEnabled ? "Birthday sound effects on" : "Birthday sound effects muted"}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {soundEffectsEnabled ? (
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <VolumeX className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mt-3 rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-card to-rose-50 p-3 dark:border-white/10 dark:from-sky-950/25 dark:via-card dark:to-rose-950/20 sm:p-4">
        <div className="flex min-h-32 items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-sky-700 dark:text-sky-300">
              A tiny celebration
            </p>
            <h3 className="mt-1 text-sm font-bold">Inflate, then pop</h3>
            <p id="birthday-balloon-hint" className="mt-1 text-xs leading-5 text-muted-foreground">
              {balloonStage === "ready"
                ? "Your balloon is ready. Tap it to send a little joy into the air."
                : balloonStage === "popped"
                  ? "Pop! A shower of confetti is on its way."
                  : "A balloon is gently inflating…"}
            </p>
            <p className="sr-only" role="status" aria-live="polite">
              {balloonStage === "ready"
                ? "Birthday balloon ready to pop."
                : balloonStage === "popped"
                  ? "Birthday balloon popped. Confetti released."
                  : "Birthday balloon inflating."}
            </p>
            <button
              type="button"
              onClick={replayBalloon}
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 text-[11px] font-semibold text-foreground transition hover:bg-accent"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" /> Replay balloon
            </button>
          </div>
          <div className="relative grid h-32 w-24 shrink-0 place-items-center">
            <button
              type="button"
              onClick={popBalloon}
              disabled={balloonStage !== "ready"}
              aria-label={
                balloonStage === "ready" ? "Pop the birthday balloon" : "Birthday balloon"
              }
              aria-describedby="birthday-balloon-hint"
              className="relative z-10 h-32 w-24 rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait"
            >
              <span
                className={`block h-full w-full ${balloonStage === "inflating" ? "birthday-balloon-inflating" : balloonStage === "popped" ? "birthday-balloon-popped" : "birthday-balloon-ready"}`}
              >
                <BirthdayBalloonArt id={`birthday-balloon-${balloonCycle}`} color={balloonColor} />
              </span>
            </button>
            {balloonStage === "popped" && (
              <span className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
                {burstBits.map((bit, index) => (
                  <i
                    key={`${balloonCycle}-${index}`}
                    className="absolute left-1/2 top-1/2"
                    style={
                      {
                        width: `${bit.width}px`,
                        height: `${bit.height}px`,
                        borderRadius: bit.round ? "50%" : "2px",
                        backgroundColor: bit.color,
                        "--burst-x": `${bit.x}px`,
                        "--burst-y": `${bit.y}px`,
                        "--burst-mid-x": `${bit.midX}px`,
                        "--burst-mid-y": `${bit.midY}px`,
                        "--burst-rotation": bit.rotation,
                        "--burst-mid-rotation": bit.midRotation,
                        animation: `birthday-confetti-flight ${bit.duration}ms cubic-bezier(.12,.7,.3,1) ${bit.delay} both`,
                      } as CSSProperties
                    }
                  />
                ))}
                {[0, 1, 2].map((index) => (
                  <span
                    key={`mini-${balloonCycle}-${index}`}
                    className="absolute left-1/2 top-1/2 h-7 w-5"
                    style={
                      {
                        color:
                          BALLOON_COLORS[(balloonColorIndex + index + 1) % BALLOON_COLORS.length],
                        marginLeft: `${(index - 1) * 20}px`,
                        animation: `birthday-mini-balloon .9s ease-out ${index * 55}ms both`,
                        "--mini-rotate": `${(index - 1) * 18}deg`,
                      } as CSSProperties
                    }
                  >
                    <svg viewBox="0 0 24 36" className="h-full w-full" aria-hidden="true">
                      <ellipse cx="12" cy="11" rx="9" ry="11" fill="currentColor" />
                      <path d="m10 21 2 3 2-3" fill="currentColor" />
                      <path
                        d="M12 24c-4 4 5 5 1 10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth=".8"
                      />
                    </svg>
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-sky-200/60 pt-2 dark:border-white/10">
          <span className="text-[11px] font-medium text-muted-foreground">Choose a color</span>
          <div role="group" aria-label="Choose balloon color" className="flex items-center gap-1">
            {BALLOON_COLORS.map((color, index) => (
              <button
                key={color}
                type="button"
                aria-label={`Use ${["rose", "sky blue", "violet", "amber"][index]} balloon`}
                aria-pressed={balloonColorIndex === index}
                onClick={() => setBalloonColorIndex(index)}
                className={`grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${balloonColorIndex === index ? "ring-2 ring-primary ring-offset-2" : ""}`}
              >
                <span
                  className="h-5 w-5 rounded-full shadow-sm"
                  style={{ backgroundColor: color }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3 dark:border-white/10 dark:bg-amber-950/20 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex shrink-0 gap-2" role="group" aria-label="Magical gift room">
            {[
              { label: "Rose gift", lid: "bg-rose-400", box: "from-rose-400 to-pink-500" },
              { label: "Sky gift", lid: "bg-sky-400", box: "from-sky-400 to-cyan-500" },
              { label: "Violet gift", lid: "bg-violet-400", box: "from-violet-400 to-fuchsia-500" },
            ].map((gift, index) => (
              <button
                key={gift.label}
                type="button"
                onClick={() => openSurprise(index)}
                aria-label={`Open ${gift.label}`}
                aria-expanded={giftOpen && openedGiftId === index}
                aria-controls="birthday-surprise-note"
                className="group relative grid h-[60px] w-[60px] shrink-0 place-items-center rounded-2xl border border-white/70 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-card"
              >
                <span className="relative block h-8 w-9" aria-hidden="true">
                  <span
                    key={`${giftCycle}-${index}`}
                    className={`absolute left-0 top-0 z-10 h-2.5 w-9 rounded-sm ${gift.lid} transition-transform duration-300 ${giftOpen && openedGiftId === index ? "birthday-gift-open" : ""}`}
                  />
                  <span
                    className={`absolute left-0 top-2.5 h-5 w-9 rounded-b-md bg-gradient-to-br ${gift.box}`}
                  />
                  <span className="absolute left-[17px] top-0.5 z-20 h-7 w-1.5 rounded-full bg-amber-300" />
                  <span className="absolute left-[13px] top-[-2px] z-20 h-2.5 w-3 rounded-full border-2 border-amber-400" />
                </span>
                <Gift
                  className="absolute bottom-1 right-1 h-3 w-3 text-rose-700 dark:text-rose-300"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-800 dark:text-amber-200">
              A pocket of encouragement
            </p>
            <p className="mt-1 text-sm font-semibold">Choose a gift to open</p>
            {giftOpen ? (
              <div
                key={noteIndex}
                id="birthday-surprise-note"
                role="status"
                aria-live="polite"
                className="birthday-gift-card-reveal mt-2 rounded-xl border border-amber-200/80 bg-white/80 p-3 shadow-sm dark:border-amber-200/15 dark:bg-black/15"
              >
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200">
                  {SURPRISE_NOTES[noteIndex].title}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {SURPRISE_NOTES[noteIndex].message}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Each box holds a different note for the next chapter.
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => openSurprise(openedGiftId ?? 0)}
                className="min-h-11 rounded-full bg-gradient-to-r from-amber-300 to-pink-300 px-3 text-xs font-bold text-slate-950 transition hover:brightness-105"
              >
                {giftOpen ? "Reveal another note" : "Open a surprise"}
              </button>
              {giftOpen && (
                <button
                  type="button"
                  onClick={() => setGiftOpen(false)}
                  aria-label="Close birthday surprise"
                  className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50 via-card to-amber-50 p-3 dark:border-white/10 dark:from-rose-950/20 dark:via-card dark:to-amber-950/15 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-rose-700 dark:text-rose-300">
              Make a wish
            </p>
            <h3 className="mt-1 text-sm font-bold">A slice of celebration</h3>
          </div>
          <button
            type="button"
            onClick={resetCake}
            aria-label="Replay the cake interaction"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-background/80 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-3 flex justify-center gap-5">
          {litCandles.map((lit, index) => (
            <button
              key={index}
              type="button"
              disabled={!lit || cakeCut}
              onClick={() =>
                setLitCandles((candles) =>
                  candles.map((isLit, candle) => (candle === index ? false : isLit)),
                )
              }
              aria-label={lit ? `Blow out candle ${index + 1}` : `Candle ${index + 1} is out`}
              className="relative h-11 w-11 rounded-t-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default"
            >
              <span
                className={`absolute left-1/2 top-0 h-3.5 w-2 -translate-x-1/2 rounded-[70%_30%_65%_35%] bg-gradient-to-t from-orange-500 via-amber-300 to-white shadow-[0_0_10px_2px_rgba(251,191,36,.35)] ${lit ? "birthday-mini-flame" : "birthday-mini-candle-out opacity-0"}`}
              />
              <span className="absolute bottom-0 left-1/2 h-7 w-2.5 -translate-x-1/2 rounded-sm bg-gradient-to-r from-sky-200 via-white to-sky-300 shadow-sm" />
            </button>
          ))}
        </div>
        <div
          className={`birthday-mini-cake mx-auto mt-1 w-44 ${cakeCut ? "birthday-mini-cake-cut" : ""}`}
        >
          <div className="mx-auto h-2 w-36 rounded-full bg-gradient-to-r from-rose-200 via-white to-rose-200 shadow-sm" />
          <div className="relative mx-auto mt-0.5 flex h-12 w-40 items-center justify-center">
            <div
              className={`birthday-mini-cake-half birthday-mini-cake-left absolute inset-y-0 left-0 flex w-1/2 items-center justify-end rounded-l-xl border-t-2 border-rose-100 bg-gradient-to-br from-rose-400 to-pink-500 pr-2 shadow-sm`}
            >
              <span className="text-[10px] font-black tracking-widest text-white/90">JPH</span>
            </div>
            <div className="birthday-mini-cake-filling pointer-events-none absolute left-1/2 top-1/2 z-[1] h-8 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100 opacity-0 shadow-[0_0_10px_rgba(251,191,36,.5)] transition-opacity duration-300" />
            <div className="birthday-mini-cake-half birthday-mini-cake-right absolute inset-y-0 right-0 w-1/2 rounded-r-xl border-t-2 border-rose-100 bg-gradient-to-br from-orange-300 to-amber-300 shadow-sm" />
          </div>
          <div className="mx-auto h-1.5 w-40 rounded-b-full bg-amber-200/80" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={!allCandlesOut || cakeCut}
            onClick={cutCake}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-pink-300 px-4 text-xs font-bold text-slate-950 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Cake className="h-3.5 w-3.5" aria-hidden="true" />
            {cakeCut
              ? "Cake cut! Make a wish"
              : allCandlesOut
                ? "Cut the cake"
                : "Blow out the candles"}
          </button>
        </div>
        {!allCandlesOut && !cakeCut && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Tap each flame, then cut your cake.
          </p>
        )}
        {cakeCut && (
          <div
            key={`cake-message-${balloonCycle}`}
            role="status"
            aria-live="polite"
            className="birthday-mini-cake-reveal mt-3 rounded-xl border border-amber-200/80 bg-white/80 p-3 text-center shadow-sm dark:border-amber-200/15 dark:bg-black/15"
          >
            <p className="text-xs font-bold text-rose-700 dark:text-rose-200">
              A wish for {firstName}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              May this next chapter bring steady progress, kind people, and work you are proud of.
            </p>
          </div>
        )}
      </div>

      <details className="group mt-3 rounded-2xl border border-border/70 bg-background/50">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <WandSparkles className="h-4 w-4 text-violet-500" aria-hidden="true" />
            Optional party magic
          </span>
          <span
            className="text-xs text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          >
            ⌄
          </span>
        </summary>
        <div className="grid gap-2 border-t border-border/60 p-3 sm:grid-cols-2">
          <article className="rounded-xl border border-sky-200/60 bg-sky-50/70 p-3 dark:border-white/10 dark:bg-sky-950/15">
            <button
              type="button"
              onClick={() => {
                setLetterOpen((open) => !open);
                if (!letterOpen) onActivity?.("letter_open");
              }}
              aria-expanded={letterOpen}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 text-xs font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Mail className="h-4 w-4 text-sky-600 dark:text-sky-300" aria-hidden="true" />
              {letterOpen ? "Fold the letter" : "Open a letter"}
            </button>
            <div
              className={`birthday-envelope relative mx-auto mt-3 h-14 w-20 ${letterOpen ? "birthday-envelope-open" : ""}`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 80 56" className="absolute inset-0 h-full w-full overflow-visible">
                <rect x="4" y="16" width="72" height="38" rx="7" fill="#bae6fd" />
                <rect
                  className="birthday-envelope-paper"
                  x="23"
                  y="4"
                  width="34"
                  height="39"
                  rx="3"
                  fill="#fff"
                  stroke="#7dd3fc"
                  strokeWidth="1.5"
                />
                <path d="M5 19 40 45 75 19V49a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" fill="#7dd3fc" />
                <path
                  className="birthday-envelope-flap"
                  d="M5 18 40 42 75 18 40 4Z"
                  fill="#38bdf8"
                  stroke="#fff"
                  strokeOpacity=".8"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
            {letterOpen && (
              <div className="birthday-letter-unfold mt-3 rounded-xl border border-sky-200/70 bg-background/85 p-3 shadow-sm dark:border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-sky-700 dark:text-sky-300">
                  A note to your future self
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  You have already done hard things. Be patient with the pace, proud of the effort,
                  and curious about what comes next.
                </p>
              </div>
            )}
          </article>

          <article className="rounded-xl border border-rose-200/60 bg-rose-50/70 p-3 dark:border-white/10 dark:bg-rose-950/15">
            <button
              type="button"
              onClick={openCapsule}
              aria-expanded={capsuleOpen}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 text-xs font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className={capsuleOpen ? "birthday-capsule-crack" : ""} aria-hidden="true">
                🧧
              </span>
              {capsuleOpen ? "Close mystery capsule" : "Open mystery capsule"}
            </button>
            {capsuleOpen && (
              <div
                className="birthday-gift-card-reveal mt-3 rounded-xl border border-rose-200/70 bg-background/85 p-3 dark:border-white/10"
                role="status"
                aria-live="polite"
              >
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-rose-700 dark:text-rose-300">
                  A little fortune
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {SURPRISE_NOTES[(noteIndex + 1) % SURPRISE_NOTES.length].message}
                </p>
                <span className="mt-2 inline-flex rounded-full bg-amber-400/15 px-2 py-1 text-[10px] font-bold text-amber-800 dark:text-amber-200">
                  Mystery sticker · ✨
                </span>
              </div>
            )}
          </article>

          <article className="relative overflow-hidden rounded-xl border border-violet-200/60 bg-violet-50/70 p-3 dark:border-white/10 dark:bg-violet-950/15">
            <button
              type="button"
              onClick={waveWand}
              aria-label="Wave the magic wand"
              className="relative z-10 inline-flex min-h-11 items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 text-xs font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <WandSparkles
                className="h-4 w-4 text-violet-600 dark:text-violet-300"
                aria-hidden="true"
              />
              Wave magic wand
            </button>
            {wandCycle > 0 && (
              <span
                key={wandCycle}
                className="pointer-events-none absolute left-24 top-8"
                aria-hidden="true"
              >
                {Array.from({ length: 8 }, (_, index) => {
                  const angle = (index / 8) * Math.PI * 2;
                  return (
                    <i
                      key={`${wandCycle}-${index}`}
                      className="birthday-wand-spark"
                      style={
                        {
                          "--wand-x": `${Math.cos(angle) * 45}px`,
                          "--wand-y": `${Math.sin(angle) * 38}px`,
                          "--wand-delay": `${index * 24}ms`,
                        } as CSSProperties
                      }
                    />
                  );
                })}
              </span>
            )}
            {wandTaps > 0 && wandTaps % 5 === 0 && (
              <p
                className="birthday-letter-unfold mt-3 rounded-xl bg-background/80 p-3 text-xs leading-5 text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                Secret note found:{" "}
                <strong className="text-foreground">
                  {SURPRISE_NOTES[secretQuoteIndex].title}
                </strong>{" "}
                — {SURPRISE_NOTES[secretQuoteIndex].message}
              </p>
            )}
          </article>

          <article className="relative overflow-hidden rounded-xl border border-amber-200/70 bg-amber-50/70 p-3 dark:border-white/10 dark:bg-amber-950/15">
            <BirthdayFireworks active={fireworksActive} cycle={fireworksCycle} />
            <button
              type="button"
              onClick={launchFireworks}
              className="relative z-10 inline-flex min-h-11 items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 text-xs font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Launch fireworks
            </button>
            <p className="relative z-10 mt-2 text-[10px] text-muted-foreground">
              A short, user-triggered sky show. No sound or autoplay.
            </p>
          </article>
        </div>
      </details>
    </section>
  );
}

export function WishConfetti() {
  const bits = useMemo(() => makeBurstBits(0).slice(0, 12), []);
  return (
    <span
      className="birthday-wish-confetti pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden="true"
    >
      {bits.map((bit, index) => (
        <i
          key={index}
          style={
            {
              backgroundColor: bit.color,
              "--wish-x": `${bit.x * 1.4}px`,
              "--wish-y": `${bit.y * 1.4}px`,
              "--wish-rotation": bit.rotation,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
