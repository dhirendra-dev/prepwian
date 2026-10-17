import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Cake,
  Check,
  Music2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { BirthdayBalloonArt } from "@/components/birthday/BirthdayDelights";
import { BirthdayFireworks } from "@/components/birthday/BirthdayFireworks";
import type { BirthdayActivity } from "@/components/birthday/birthday-types";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { birthdayRpc, isAnonymousAccount } from "@/lib/birthday-rpc";
import { toast } from "sonner";

const SPARKS = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  delay: `${(i % 9) * 0.1}s`,
  duration: `${2.4 + (i % 5) * 0.18}s`,
  size: `${3 + (i % 3) * 2}px`,
  hue: [42, 172, 205, 274, 332][i % 5],
}));
const BUTTERFLIES = Array.from({ length: 5 }, (_, i) => ({
  top: `${12 + ((i * 19) % 72)}%`,
  delay: `${i * 0.14}s`,
  duration: `${5.4 + (i % 3) * 0.25}s`,
  size: `${i % 2 === 0 ? 52 : 40}px`,
  hue: `${(i * 43) % 360}deg`,
}));
const ENTRANCE_BALLOONS = Array.from({ length: 7 }, (_, i) => ({
  left: `${3 + i * 14}%`,
  delay: `${i * 0.11}s`,
  duration: `${5.2 + (i % 3) * 0.22}s`,
  drift: `${(i % 2 === 0 ? 1 : -1) * (24 + (i % 3) * 12)}px`,
  midDrift: `${(i % 2 === 0 ? 1 : -1) * (12 + (i % 3) * 6)}px`,
  midRotation: `${(i % 2 === 0 ? 1 : -1) * (4 + i)}deg`,
  rotation: `${(i % 2 === 0 ? 1 : -1) * (9 + i * 2)}deg`,
  color: ["#f43f5e", "#0ea5e9", "#8b5cf6", "#f59e0b", "#34d399", "#ec4899", "#38bdf8"][i],
}));
const INDIA_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const INDIA_MONTH_DAY = new Intl.DateTimeFormat("en", {
  timeZone: "Asia/Kolkata",
  month: "numeric",
  day: "numeric",
});

function todayInHubTimezone() {
  return INDIA_DAY.format(new Date());
}

function formatAudioTime(seconds: number) {
  const totalSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function ButterflyArt() {
  return (
    <svg viewBox="0 0 48 40" className="h-full w-full overflow-visible" aria-hidden="true">
      <g className="birthday-butterfly-wing birthday-butterfly-wing-left">
        <path d="M23 19C14 3 4 4 4 14c0 7 7 10 19 8Z" fill="#a78bfa" />
        <path d="M23 21C12 18 8 26 12 33c4 5 9 1 12-8Z" fill="#f9a8d4" />
      </g>
      <g className="birthday-butterfly-wing birthday-butterfly-wing-right">
        <path d="M25 19C34 3 44 4 44 14c0 7-7 10-19 8Z" fill="#c4b5fd" />
        <path d="M25 21c11-3 15 5 11 12-4 5-9 1-12-8Z" fill="#fbcfe8" />
      </g>
      <path d="M24 13c-3 5-3 13 0 18 3-5 3-13 0-18Z" fill="#7c3aed" />
      <path
        d="M23 14c-2-4-4-5-6-5m8 5c2-4 4-5 6-5"
        fill="none"
        stroke="#7c3aed"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <circle cx="12" cy="14" r="1.4" fill="white" opacity=".75" />
      <circle cx="36" cy="14" r="1.4" fill="white" opacity=".75" />
    </svg>
  );
}

function birthdayToday(month: number | null | undefined, day: number | null | undefined) {
  if (!month || !day) return false;
  const parts = INDIA_MONTH_DAY.formatToParts(new Date());
  const currentMonth = Number(parts.find((part) => part.type === "month")?.value);
  const currentDay = Number(parts.find((part) => part.type === "day")?.value);
  return currentMonth === month && currentDay === day;
}

type BirthdaySettings = {
  birthday_month: number | null;
  birthday_day: number | null;
  music_enabled: boolean;
};

/** Displays one account-wide birthday overlay and checks only the signed-in user's own month/day. */
export function BirthdayCelebrationExperience() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userId = user?.id;
  const fallbackName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0];
  const [settings, setSettings] = useState<BirthdaySettings | null>(null);
  const [name, setName] = useState("Aspirant");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [burst, setBurst] = useState(0);
  const [entranceActive, setEntranceActive] = useState(false);
  const [entranceCycle, setEntranceCycle] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [musicVisuals, setMusicVisuals] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [litCandles, setLitCandles] = useState([true, true, true]);
  const [cakeCut, setCakeCut] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const audio = useRef<HTMLAudioElement | null>(null);
  const entranceTimer = useRef<number | null>(null);

  const replayEntrance = useCallback(() => {
    if (entranceTimer.current !== null) window.clearTimeout(entranceTimer.current);
    setEntranceCycle((cycle) => cycle + 1);
    setEntranceActive(true);
    entranceTimer.current = window.setTimeout(() => {
      setEntranceActive(false);
      entranceTimer.current = null;
    }, 6400);
  }, []);

  const skipEntrance = useCallback(() => {
    if (entranceTimer.current !== null) window.clearTimeout(entranceTimer.current);
    entranceTimer.current = null;
    setEntranceActive(false);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setMusicPlaying(false);
    if (audio.current) {
      audio.current.pause();
      audio.current.currentTime = 0;
    }
    setCurrentTime(0);
  }, []);

  useEffect(() => {
    if (!open) {
      skipEntrance();
      return;
    }
    replayEntrance();
    return () => {
      if (entranceTimer.current !== null) window.clearTimeout(entranceTimer.current);
      entranceTimer.current = null;
    };
  }, [open, replayEntrance, skipEntrance]);

  useEffect(() => {
    if (!userId) {
      setSettings(null);
      setOpen(false);
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data, error }, { data: profile }] = await Promise.all([
        birthdayRpc<BirthdaySettings[]>("birthday_my_settings"),
        supabase
          .from("profiles")
          .select("full_name, username, avatar_url")
          .eq("id", userId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (error) {
        console.warn("Birthday check could not be completed.", error);
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      const nextSettings = row as BirthdaySettings | null;
      setSettings(nextSettings);
      setName(
        profile?.full_name?.trim() ||
          profile?.username?.trim() ||
          String(fallbackName ?? "Aspirant"),
      );
      setAvatarUrl(profile?.avatar_url ?? null);
      if (!birthdayToday(nextSettings?.birthday_month, nextSettings?.birthday_day)) return;
      let alreadyShown = false;
      try {
        const key = `birthday:auto:${userId}:${todayInHubTimezone()}`;
        alreadyShown = sessionStorage.getItem(key) === "1";
        if (!alreadyShown) sessionStorage.setItem(key, "1");
      } catch {
        // Storage can be disabled; the shell still mounts only once per auth identity.
      }
      if (!alreadyShown) {
        setLitCandles([true, true, true]);
        setCakeCut(false);
        setBurst((n) => n + 1);
        setSecondsRemaining(60);
        setOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, fallbackName]);

  useEffect(() => {
    const replay = () => {
      setLitCandles([true, true, true]);
      setCakeCut(false);
      setSecondsRemaining(60);
      setBurst((n) => n + 1);
      setOpen(true);
      replayEntrance();
    };
    window.addEventListener("jph-birthday-replay", replay);
    return () => window.removeEventListener("jph-birthday-replay", replay);
  }, [replayEntrance]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (audio.current) {
      audio.current.muted = muted;
      audio.current.volume = volume;
    }
  }, [muted, volume]);

  const startMusic = useCallback(async () => {
    if (!audio.current) return;
    audio.current.volume = volume;
    audio.current.muted = muted;
    try {
      await audio.current.play();
      setAudioError(false);
      setMusicPlaying(true);
    } catch {
      setMusicPlaying(false);
      setAudioError(true);
    }
  }, [muted, volume]);

  const pauseMusic = useCallback(() => {
    audio.current?.pause();
    setMusicPlaying(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, 60 - Math.floor((Date.now() - startedAt) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) close();
    }, 250);
    return () => window.clearInterval(timer);
  }, [open, burst, close]);

  const allCandlesOut = litCandles.every((lit) => !lit);

  const recordActivity = useCallback(
    async (activity: BirthdayActivity) => {
      if (!userId || isAnonymousAccount(user)) return;
      try {
        const { error } = await birthdayRpc<boolean>("birthday_record_activity", {
          _activity: activity,
        });
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ["birthday-badges", userId] });
      } catch (error) {
        console.warn("Birthday keepsake could not be recorded.", error);
        toast.error("Your celebration continued, but its keepsake couldn't be saved.");
      }
    },
    [queryClient, user, userId],
  );

  const celebrateAgain = () => {
    setLitCandles([true, true, true]);
    setCakeCut(false);
    setSecondsRemaining(60);
    setBurst((n) => n + 1);
    replayEntrance();
    void recordActivity("grand_finale");
  };
  const cutCake = () => {
    if (!allCandlesOut || cakeCut) return;
    setCakeCut(true);
    setBurst((n) => n + 1);
    void recordActivity("cake_cut");
  };

  return (
    <>
      <audio
        ref={audio}
        src="/audio/birthday-celebration.mp3"
        aria-hidden="true"
        preload="none"
        loop
        onPlay={() => setMusicPlaying(true)}
        onPause={() => setMusicPlaying(false)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onError={() => {
          setMusicPlaying(false);
          setAudioError(true);
        }}
      />
      {!open ? null : (
        <div
          className={`birthday-overlay fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto px-3 py-5 sm:px-6 ${pageVisible ? "" : "birthday-overlay-paused"}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="birthday-title"
          aria-describedby="birthday-message"
        >
          <style>{`
            .birthday-overlay{isolation:isolate;background:radial-gradient(ellipse at 16% 12%,color-mix(in oklab,var(--accent) 17%,transparent),transparent 31%),radial-gradient(ellipse at 86% 83%,color-mix(in oklab,var(--primary) 12%,transparent),transparent 36%),linear-gradient(140deg,color-mix(in oklab,var(--background) 96%,var(--primary) 4%),var(--background) 50%,color-mix(in oklab,var(--background) 96%,var(--accent) 4%));backdrop-filter:blur(13px);color:var(--foreground)}
            .birthday-overlay-paused *,.birthday-overlay-paused:before,.birthday-overlay-paused:after{animation-play-state:paused!important}
            .dark .birthday-overlay{background:radial-gradient(ellipse at 16% 12%,rgba(252,211,77,.18),transparent 31%),radial-gradient(ellipse at 86% 83%,rgba(217,70,239,.18),transparent 36%),linear-gradient(140deg,rgba(7,13,37,.97),rgba(20,28,68,.965) 50%,rgba(40,20,60,.98));color:#fff}
            .birthday-overlay:before{content:"";position:fixed;inset:-20%;z-index:-2;pointer-events:none;background:radial-gradient(ellipse at 22% 28%,rgba(66,133,244,.17),transparent 38%),radial-gradient(ellipse at 78% 72%,rgba(171,71,188,.15),transparent 42%);filter:blur(56px);animation:bday-aurora-breathe 9s ease-in-out infinite alternate}
            .birthday-overlay:after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;box-shadow:inset 0 0 54px 7px rgba(59,130,246,.1),inset 0 0 100px 18px rgba(217,70,239,.06);animation:bday-edge-pulse 5s ease-in-out infinite alternate}
            .dark .birthday-overlay:after{box-shadow:inset 0 0 52px 8px rgba(90,115,255,.42),inset 0 0 100px 18px rgba(191,74,255,.17)}
            .birthday-rainbow-edge{position:fixed;inset:0;z-index:1;padding:3px;pointer-events:none;background:conic-gradient(from 0deg,#4285f4,#34a853,#fbbc05,#ea4335,#a142f4,#4285f4);opacity:.34;filter:drop-shadow(0 0 7px rgba(104,126,255,.28));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;animation:bday-edge-pulse 4.5s ease-in-out infinite alternate}
            .dark .birthday-rainbow-edge{opacity:.68;filter:drop-shadow(0 0 8px rgba(104,126,255,.55))}
            .birthday-card{animation:bday-card-in .72s cubic-bezier(.16,1,.3,1) both}
            .birthday-title{background:linear-gradient(100deg,#172554 7%,#a16207 32%,#be185d 62%,#0369a1 90%);background-clip:text;color:transparent;animation:bday-title-in .8s cubic-bezier(.16,1,.3,1) both}
            .dark .birthday-title{background:linear-gradient(100deg,#fff 7%,#fde68a 32%,#f9a8d4 62%,#bae6fd 90%)}
            .birthday-spark{position:absolute;top:-16px;left:var(--fall-left);width:var(--fall-size);height:var(--fall-size);background:hsl(var(--fall-hue) 92% 72%);border-radius:2px;opacity:.84;box-shadow:0 0 10px hsl(var(--fall-hue) 92% 72%);pointer-events:none;animation:bday-fall var(--fall-duration) ease-out var(--fall-delay) both}
            .birthday-entry-balloon{position:absolute;bottom:-22vh;width:clamp(54px,7vw,92px);height:clamp(71px,9.3vw,122px);opacity:0;filter:drop-shadow(0 8px 10px rgba(24,39,75,.16));animation:bday-rise-balloon var(--rise-duration) cubic-bezier(.28,.62,.38,1) var(--rise-delay) both;will-change:transform,opacity}
            .birthday-butterfly{position:fixed;left:-12vw;z-index:2;pointer-events:none;width:var(--butterfly-size);height:var(--butterfly-size);filter:hue-rotate(var(--butterfly-hue)) drop-shadow(0 5px 9px rgba(43,33,74,.14));animation:bday-butterfly-flight var(--butterfly-duration) ease-in-out var(--butterfly-delay) both;will-change:transform,opacity}
            .birthday-butterfly-wing{transform-box:fill-box;animation:bday-wing-flap .42s ease-in-out infinite alternate}
            .birthday-butterfly-wing-left{transform-origin:100% 55%}
            .birthday-butterfly-wing-right{transform-origin:0% 55%}
            .birthday-cake{filter:drop-shadow(0 18px 34px rgba(251,191,36,.2))}
            .birthday-flame{animation:bday-flicker .7s ease-in-out infinite alternate;transform-origin:bottom center}
            .birthday-cut-half{transition:transform .72s cubic-bezier(.18,.72,.28,1.2)}
            .birthday-cake-cut .birthday-cut-left{transform:translateX(-13px) rotate(-5deg)}
            .birthday-cake-cut .birthday-cut-right{transform:translateX(13px) rotate(5deg)}
            .birthday-cake-filling{transition:opacity .45s ease-out}
            .birthday-cake-cut .birthday-cake-filling{opacity:.92}
            .birthday-knife{position:absolute;left:50%;top:2px;width:4px;height:96px;border-radius:99px;background:linear-gradient(90deg,#cbd5e1,#fff,#94a3b8);box-shadow:0 0 12px rgba(255,255,255,.55);transform:translateX(-50%) rotate(-24deg);animation:bday-knife-cut .72s ease-in forwards;z-index:3}
            .birthday-cut-message{animation:bday-message-in .38s cubic-bezier(.16,1,.3,1) both}
            .birthday-progress{background:linear-gradient(90deg,#60a5fa,#c084fc,#f472b6,#fbbf24)}
            .birthday-music-visualizer span{transform-origin:center;animation:bday-music-pulse var(--music-delay) ease-in-out infinite alternate}
            @keyframes bday-card-in{from{opacity:0;transform:translateY(24px) scale(.975)}to{opacity:1;transform:translateY(0) scale(1)}}
            @keyframes bday-title-in{from{opacity:0;transform:translateY(10px);filter:blur(4px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}
            @keyframes bday-message-in{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
            @keyframes bday-fall{0%{transform:translate3d(0,-5vh,0) rotate(0deg);opacity:0}15%{opacity:.95}100%{transform:translate3d(24px,110vh,0) rotate(300deg);opacity:0}}
            @keyframes bday-rise-balloon{0%{opacity:0;transform:translate3d(0,0,0) rotate(0) scale(.76)}10%{opacity:.86}42%{transform:translate3d(var(--rise-mid-drift),-52vh,0) rotate(var(--rise-mid-rotation)) scale(1)}100%{opacity:0;transform:translate3d(var(--rise-drift),-138vh,0) rotate(var(--rise-rotation)) scale(.9)}}
            @keyframes bday-flicker{from{transform:rotate(-4deg) scale(.94);opacity:.86}to{transform:rotate(4deg) scale(1.08);opacity:1}}
            @keyframes bday-aurora-breathe{from{opacity:.58;transform:scale(.98)}to{opacity:.92;transform:scale(1.02)}}
            @keyframes bday-edge-pulse{from{opacity:.58}to{opacity:.9}}
            @keyframes bday-butterfly-flight{0%{opacity:0;transform:translate3d(-10vw,7vh,0) rotate(-10deg) scale(.82)}16%{opacity:.84}48%{transform:translate3d(49vw,-7vh,0) rotate(8deg) scale(1)}100%{opacity:0;transform:translate3d(119vw,8vh,0) rotate(-8deg) scale(.88)}}
            @keyframes bday-wing-flap{from{scale:.6 1}to{scale:1 1}}
            @keyframes bday-knife-cut{0%{transform:translate(-50%,-30px) rotate(-24deg);opacity:0}36%{opacity:1}100%{transform:translate(-50%,65px) rotate(-24deg);opacity:0}}
            @keyframes bday-music-pulse{from{transform:scaleY(.24);opacity:.55}to{transform:scaleY(1);opacity:1}}
            @media(prefers-reduced-motion:reduce){.birthday-card,.birthday-title,.birthday-spark,.birthday-flame,.birthday-cut-message,.birthday-rainbow-edge,.birthday-butterfly,.birthday-entry-balloon,.birthday-overlay:before,.birthday-overlay:after,.birthday-music-visualizer span{animation:none!important}.birthday-entry-balloon,.birthday-butterfly,.birthday-spark{display:none!important}.birthday-overlay *{scroll-behavior:auto!important;transition:none!important}.birthday-rainbow-edge{opacity:.25}}
          `}</style>
          <div className="birthday-rainbow-edge" aria-hidden="true" />
          <BirthdayFireworks active={entranceActive} cycle={entranceCycle} fullScreen />
          {entranceActive && (
            <div
              key={`entrance-balloons-${entranceCycle}`}
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-[2] overflow-hidden"
            >
              {ENTRANCE_BALLOONS.map((balloon, index) => (
                <span
                  key={`${entranceCycle}-balloon-${index}`}
                  className="birthday-entry-balloon"
                  style={
                    {
                      left: balloon.left,
                      color: balloon.color,
                      "--rise-delay": balloon.delay,
                      "--rise-duration": balloon.duration,
                      "--rise-drift": balloon.drift,
                      "--rise-mid-drift": balloon.midDrift,
                      "--rise-mid-rotation": balloon.midRotation,
                      "--rise-rotation": balloon.rotation,
                    } as CSSProperties
                  }
                >
                  <BirthdayBalloonArt
                    id={`birthday-entrance-balloon-${entranceCycle}-${index}`}
                    color={balloon.color}
                  />
                </span>
              ))}
            </div>
          )}
          {entranceActive && (
            <div
              key={`entrance-butterflies-${entranceCycle}`}
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-[2] overflow-hidden"
            >
              {BUTTERFLIES.map((butterfly, index) => (
                <span
                  key={`${entranceCycle}-butterfly-${index}`}
                  className="birthday-butterfly"
                  style={
                    {
                      top: butterfly.top,
                      "--butterfly-delay": butterfly.delay,
                      "--butterfly-duration": butterfly.duration,
                      "--butterfly-size": butterfly.size,
                      "--butterfly-hue": butterfly.hue,
                    } as CSSProperties
                  }
                >
                  <ButterflyArt />
                </span>
              ))}
            </div>
          )}
          {entranceActive && (
            <div
              key={`entrance-confetti-${entranceCycle}`}
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-[3] overflow-hidden"
            >
              {SPARKS.map((spark, index) => (
                <span
                  key={`${entranceCycle}-${index}`}
                  className="birthday-spark"
                  style={
                    {
                      "--fall-left": spark.left,
                      "--fall-delay": spark.delay,
                      "--fall-duration": spark.duration,
                      "--fall-size": spark.size,
                      "--fall-hue": spark.hue,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          )}
          <button
            type="button"
            aria-label="Close birthday celebration"
            onClick={close}
            className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-border bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-white/25 dark:bg-white/10 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-white dark:focus-visible:ring-amber-200"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="birthday-card relative z-10 mx-auto my-auto w-full max-w-3xl rounded-[2rem] border border-border/70 bg-card/95 px-5 py-7 text-center text-card-foreground shadow-soft backdrop-blur-xl dark:border-white/20 dark:bg-white/[0.09] dark:text-white dark:shadow-[0_32px_120px_-35px_rgba(0,0,0,.8)] sm:px-10 sm:py-9">
            <div className="mx-auto flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-[.22em] text-amber-800 dark:border-amber-100/25 dark:bg-amber-100/10 dark:text-amber-100">
                <Cake className="h-4 w-4" /> Your moment · {secondsRemaining}s
              </div>
              <button
                type="button"
                onClick={entranceActive ? skipEntrance : replayEntrance}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 text-xs font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {entranceActive ? (
                  <>
                    <SkipForward className="h-3.5 w-3.5" aria-hidden="true" /> Skip intro
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Replay entrance
                  </>
                )}
              </button>
            </div>
            <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-full border border-border/70 bg-background/80 py-1.5 pl-1.5 pr-4 dark:border-white/15 dark:bg-black/10">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${name}'s profile`}
                  className="h-12 w-12 rounded-full border-2 border-amber-200 object-cover shadow-[0_0_18px_rgba(251,191,36,.35)]"
                />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-amber-200 bg-gradient-to-br from-indigo-400 to-rose-400 text-lg font-black text-white">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="text-xs font-semibold text-slate-600 dark:text-white/80">
                A whole community is cheering for you
              </span>
            </div>
            <h1
              id="birthday-title"
              className="birthday-title mt-4 font-display text-4xl font-black leading-tight tracking-tight sm:text-6xl"
            >
              Happy Birthday,
              <br className="sm:hidden" /> {name}!
            </h1>
            <p
              id="birthday-message"
              className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-indigo-50/85 sm:text-base"
            >
              From everyone at PREPWIAN: may your day bring joy, fresh inspiration, and the
              confidence to keep reaching for what matters to you.
            </p>

            <div
              className="birthday-cake mx-auto mt-6 w-fit"
              aria-label="Interactive birthday cake. Tap the candle flames to blow them out, then cut the cake."
              role="group"
            >
              <div className="mb-[-2px] flex h-12 items-end justify-center gap-6">
                {litCandles.map((lit, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={lit ? `Blow out candle ${index + 1}` : `Candle ${index + 1} is out`}
                    disabled={!lit}
                    onClick={() =>
                      setLitCandles((old) => old.map((on, i) => (i === index ? false : on)))
                    }
                    className="relative flex h-11 w-11 items-end justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <span
                      className={`absolute bottom-0 left-1/2 h-9 w-3 -translate-x-1/2 rounded-t-sm bg-gradient-to-r from-sky-200 via-white to-sky-300 shadow-sm ${lit ? "" : "opacity-45"}`}
                      aria-hidden="true"
                    />
                    <span
                      className={`birthday-flame absolute left-1/2 top-0 h-4 w-2 -translate-x-1/2 rounded-[70%_30%_65%_35%] bg-gradient-to-t from-orange-400 via-amber-200 to-white shadow-[0_0_13px_4px_rgba(251,191,36,.45)] ${lit ? "" : "hidden"}`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
              <div className={`relative ${cakeCut ? "birthday-cake-cut" : ""}`}>
                <span
                  className="birthday-cake-filling pointer-events-none absolute left-1/2 top-1/2 z-[1] h-12 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-amber-50 via-rose-100 to-amber-200 opacity-0 shadow-[0_0_16px_rgba(251,191,36,.5)]"
                  aria-hidden="true"
                />
                {cakeCut && <span className="birthday-knife" aria-hidden="true" />}
                <div className="flex h-9 w-52 justify-center sm:w-60">
                  <div className="birthday-cut-half birthday-cut-left h-full w-1/2 rounded-tl-[1.2rem] border-t-4 border-pink-200/90 bg-gradient-to-r from-pink-500 to-fuchsia-400" />
                  <div className="birthday-cut-half birthday-cut-right h-full w-1/2 rounded-tr-[1.2rem] border-t-4 border-pink-200/90 bg-gradient-to-l from-rose-400 to-fuchsia-400" />
                </div>
                <div className="flex h-11 w-56 sm:w-64">
                  <div className="birthday-cut-half birthday-cut-left flex h-full w-1/2 items-center justify-end rounded-bl-[1.25rem] border-t-[3px] border-amber-100 bg-gradient-to-r from-amber-300 to-orange-200 pr-2 shadow-lg">
                    {!cakeCut && (
                      <span className="text-sm font-black tracking-[.2em] text-rose-900/75">
                        JPH
                      </span>
                    )}
                  </div>
                  <div className="birthday-cut-half birthday-cut-right flex h-full w-1/2 items-center justify-start rounded-br-[1.25rem] border-t-[3px] border-amber-100 bg-gradient-to-l from-amber-400 to-orange-200 pl-2 shadow-lg" />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-indigo-100/70">
                Tap the candles, make a wish, then cut your cake
              </p>
              <button
                type="button"
                disabled={cakeCut || !allCandlesOut}
                onClick={cutCake}
                className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-55 dark:border-rose-200/30 dark:bg-rose-300/10 dark:text-rose-100 dark:hover:bg-rose-300/20"
              >
                <Cake className="h-4 w-4" />
                {cakeCut
                  ? "Cake cut—make a wish!"
                  : allCandlesOut
                    ? "Cut the cake"
                    : "Blow out all candles first"}
              </button>
            </div>

            <div
              key={cakeCut ? "cake-wish-revealed" : "cake-wish-hidden"}
              role={cakeCut ? "status" : undefined}
              aria-live={cakeCut ? "polite" : undefined}
              className={`mx-auto mt-5 max-w-xl rounded-2xl border border-sky-100 bg-sky-50/80 px-5 py-3.5 text-sm leading-6 text-slate-700 dark:border-white/12 dark:bg-black/15 dark:text-indigo-50/90 ${cakeCut ? "birthday-cut-message" : ""}`}
            >
              <span className="mb-1 block text-xs font-bold uppercase tracking-[.18em] text-amber-700 dark:text-amber-200">
                {cakeCut ? `A wish for ${name}` : "A note for your next chapter"}
              </span>
              {cakeCut ? (
                <>
                  May this next chapter bring steady progress, kind people, and work you are proud
                  of.{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Your dreams are worth a wish—and a whole year of brave steps.
                  </span>
                </>
              ) : (
                <>
                  Every tough problem you solve is proof of your patience and potential. Keep
                  learning, keep growing, and keep moving toward the future you imagine.{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Your dreams are worth fighting for—make this year count.
                  </span>
                </>
              )}
            </div>

            {settings?.music_enabled ? (
              <div className="mx-auto mt-4 w-full max-w-xl rounded-2xl border border-border/70 bg-muted/60 px-4 py-3 dark:border-white/10 dark:bg-black/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground dark:text-indigo-100">
                    <Music2 className="h-4 w-4 text-amber-600 dark:text-amber-200" /> Birthday song
                    <span className="font-normal text-muted-foreground">
                      · starts when you press play
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {musicPlaying ? (
                      <button
                        type="button"
                        onClick={pauseMusic}
                        aria-label="Pause birthday song"
                        className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-accent dark:border-white/20 dark:hover:bg-white/10"
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void startMusic()}
                        aria-label="Play birthday song"
                        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-200/40 dark:bg-amber-200/10 dark:text-amber-50 dark:hover:bg-amber-200/20"
                      >
                        <Play className="h-4 w-4" /> {audioError ? "Try song again" : "Play song"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!audio.current) return;
                        audio.current.currentTime = 0;
                        setCurrentTime(0);
                        void startMusic();
                      }}
                      aria-label="Replay birthday song from the beginning"
                      className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-accent dark:border-white/15 dark:hover:bg-white/10"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      aria-label={muted ? "Unmute birthday song" : "Mute birthday song"}
                      className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-accent dark:border-white/15 dark:hover:bg-white/10"
                    >
                      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] tabular-nums text-muted-foreground">
                  <span>{formatAudioTime(currentTime)}</span>
                  <input
                    aria-label="Seek birthday song"
                    aria-valuetext={`${formatAudioTime(currentTime)} elapsed, ${formatAudioTime(Math.max(0, (duration || 60) - currentTime))} remaining`}
                    type="range"
                    min="0"
                    max={duration || 60}
                    step="0.1"
                    value={Math.min(currentTime, duration || 60)}
                    onChange={(event) => {
                      const nextTime = Number(event.target.value);
                      setCurrentTime(nextTime);
                      if (audio.current) audio.current.currentTime = nextTime;
                    }}
                    className="min-w-0 flex-1 accent-amber-400"
                  />
                  <span>−{formatAudioTime(Math.max(0, (duration || 60) - currentTime))}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground dark:text-indigo-100/80">
                    <span>Volume</span>
                    <input
                      aria-label="Birthday song volume"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(event) => setVolume(Number(event.target.value))}
                      className="w-20 accent-amber-400"
                    />
                  </label>
                  <button
                    type="button"
                    aria-pressed={musicVisuals}
                    onClick={() => setMusicVisuals((enabled) => !enabled)}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 text-[11px] font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/15 dark:bg-white/5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                    {musicVisuals ? "Music glow on" : "Add music glow"}
                  </button>
                  {audioError && (
                    <span role="status" className="text-xs text-destructive">
                      Song couldn't be loaded. Check your connection and retry.
                    </span>
                  )}
                </div>
                {musicPlaying && musicVisuals && (
                  <div
                    className="birthday-music-visualizer pointer-events-none mt-2 flex h-7 items-center justify-center gap-[3px]"
                    aria-hidden="true"
                  >
                    {Array.from({ length: 23 }, (_, index) => (
                      <span
                        key={index}
                        className="w-[3px] rounded-full bg-gradient-to-t from-sky-400 via-fuchsia-400 to-amber-300 shadow-[0_0_8px_rgba(217,70,239,.35)]"
                        style={
                          {
                            height: `${8 + ((index * 17) % 17)}px`,
                            "--music-delay": `${420 + (index % 7) * 90}ms`,
                          } as CSSProperties
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mx-auto mt-4 max-w-md rounded-2xl border border-border/70 bg-muted/60 px-4 py-3 text-xs leading-5 text-muted-foreground dark:border-white/10 dark:bg-black/10">
                Birthday music is turned off. You can enable the player in{" "}
                <Link
                  to="/profile"
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Profile settings
                </Link>
                .
              </p>
            )}

            <div
              className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted dark:bg-white/10"
              aria-hidden="true"
            >
              <div
                className="birthday-progress h-full rounded-full transition-[width] duration-1000"
                style={{ width: `${(secondsRemaining / 60) * 100}%` }}
              />
            </div>
            <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={celebrateAgain}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-pink-300 px-5 text-sm font-bold text-slate-950 shadow-[0_8px_30px_-10px_rgba(251,191,36,.8)] transition hover:-translate-y-0.5"
              >
                <Cake className="h-4 w-4" /> Celebrate Again
              </button>
              <button
                type="button"
                onClick={() => {
                  close();
                  void navigate({ to: "/birthday" });
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-accent dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                <span aria-hidden="true">💌</span> Explore Birthday Wishes
              </button>
              <button
                type="button"
                onClick={close}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition hover:text-foreground dark:text-indigo-100/80 dark:hover:text-white"
              >
                <Check className="h-4 w-4" /> Continue to PREPWIAN
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground dark:text-white/50">
              You can close this celebration any time. Your study session will be right here.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
