import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { BirthdayCelebrationExperience } from "@/components/birthday/BirthdayCelebration";
import { BirthdayExperienceStudio } from "@/components/birthday/BirthdayExperienceStudio";
import { BirthdayBalloonArt, WishConfetti } from "@/components/birthday/BirthdayDelights";
import { BirthdaySetupGate } from "@/components/birthday/BirthdaySetupGate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { birthdayRpc, isAnonymousAccount } from "@/lib/birthday-rpc";
import { toast } from "sonner";
import {
  ArrowRight,
  Cake,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Gift,
  Heart,
  Loader2,
  LockKeyhole,
  MessageCircle,
  PartyPopper,
  RefreshCw,
  Send,
  Share2,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/birthday")({
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:title", content: "Birthday Hub — PREPWIAN" },
      { property: "og:description", content: "Celebrate the PREPWIAN community with birthday wishes and a year of new possibilities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Birthday Hub — PREPWIAN" },
      { name: "twitter:description", content: "Celebrate the PREPWIAN community with birthday wishes and a year of new possibilities." },
      { title: "Birthday Hub — PREPWIAN" },
      {
        name: "description",
        content:
          "Celebrate the PREPWIAN community with birthday wishes and a year of new possibilities.",
      },
    ],
  }),
  component: BirthdayHubRoute,
});

type BirthdayPerson = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  birthday_on: string;
  days_until: number;
  wish_count: number;
  unique_wisher_count: number;
};
type Wish = {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar_url: string | null;
  message: string;
  reaction: string;
  created_at: string;
  wish_count: number;
  unique_wisher_count: number;
};
const PRESET_WISHES = [
  "Wishing you a bright year full of courage, curiosity, and beautiful breakthroughs. Keep chasing your dreams!",
  "May every challenge you meet become another step toward the future you want. Happy birthday!",
  "A new chapter, new energy, and new reasons to believe in yourself. Have an amazing birthday!",
];
const REACTIONS = ["🎉", "💛", "✨", "🔥", "🌟"];
const HERO_BALLOONS = [
  {
    id: "hero-rose",
    color: "#f43f5e",
    style: {
      top: "5%",
      right: "5%",
      width: "clamp(52px, 6vw, 78px)",
      height: "clamp(68px, 7.8vw, 103px)",
      "--hero-delay": "0s",
      "--sway-delay": "1s",
      "--hero-opacity": ".68",
      "--sway-drift": "8px",
      "--sway-return-drift": "-8px",
      "--travel-x": "24px",
      "--travel-y": "-48px",
      "--travel-return-x": "-14px",
      "--travel-return-y": "-18px",
    },
  },
  {
    id: "hero-sky",
    color: "#0ea5e9",
    style: {
      top: "47%",
      right: "24%",
      width: "clamp(42px, 4.8vw, 62px)",
      height: "clamp(56px, 6.2vw, 82px)",
      "--hero-delay": ".22s",
      "--sway-delay": "1.2s",
      "--hero-opacity": ".48",
      "--sway-drift": "-7px",
      "--sway-return-drift": "7px",
      "--travel-x": "-28px",
      "--travel-y": "-42px",
      "--travel-return-x": "17px",
      "--travel-return-y": "-14px",
    },
  },
  {
    id: "hero-violet",
    color: "#8b5cf6",
    style: {
      bottom: "5%",
      right: "5%",
      width: "clamp(48px, 5.5vw, 70px)",
      height: "clamp(62px, 7.1vw, 92px)",
      "--hero-delay": ".42s",
      "--sway-delay": "1.4s",
      "--hero-opacity": ".56",
      "--sway-drift": "9px",
      "--sway-return-drift": "-9px",
      "--travel-x": "26px",
      "--travel-y": "-50px",
      "--travel-return-x": "-18px",
      "--travel-return-y": "-20px",
    },
  },
  {
    id: "hero-amber",
    color: "#f59e0b",
    style: {
      top: "16%",
      left: "51%",
      width: "clamp(38px, 4.5vw, 58px)",
      height: "clamp(50px, 5.8vw, 76px)",
      "--hero-delay": ".58s",
      "--sway-delay": "1.5s",
      "--hero-opacity": ".38",
      "--sway-drift": "6px",
      "--sway-return-drift": "-6px",
      "--travel-x": "-25px",
      "--travel-y": "-38px",
      "--travel-return-x": "16px",
      "--travel-return-y": "-12px",
    },
  },
  {
    id: "hero-mint",
    color: "#34d399",
    style: {
      top: "51%",
      left: "4%",
      width: "clamp(40px, 4.7vw, 60px)",
      height: "clamp(52px, 6vw, 79px)",
      "--hero-delay": ".78s",
      "--sway-delay": "1.7s",
      "--hero-opacity": ".34",
      "--sway-drift": "-7px",
      "--sway-return-drift": "7px",
      "--travel-x": "23px",
      "--travel-y": "-44px",
      "--travel-return-x": "-17px",
      "--travel-return-y": "-16px",
    },
  },
];
const HERO_BUTTERFLIES = [
  {
    top: "27%",
    right: "21%",
    hue: "8deg",
    delay: ".4s",
    drift: "52px",
    lift: "-30px",
    returnX: "-18px",
    returnY: "-12px",
    duration: "6.8s",
  },
  {
    top: "62%",
    right: "12%",
    hue: "68deg",
    delay: ".7s",
    drift: "-46px",
    lift: "-26px",
    returnX: "16px",
    returnY: "-8px",
    duration: "7.4s",
  },
  {
    bottom: "19%",
    left: "65%",
    hue: "-32deg",
    delay: ".55s",
    drift: "40px",
    lift: "-32px",
    returnX: "-16px",
    returnY: "-10px",
    duration: "7s",
  },
  {
    top: "12%",
    right: "48%",
    hue: "24deg",
    delay: ".3s",
    drift: "-42px",
    lift: "-26px",
    returnX: "18px",
    returnY: "-12px",
    duration: "6.5s",
  },
  {
    top: "48%",
    left: "51%",
    hue: "-18deg",
    delay: ".9s",
    drift: "42px",
    lift: "-36px",
    returnX: "-15px",
    returnY: "-10px",
    duration: "7.2s",
  },
  {
    bottom: "6%",
    left: "39%",
    hue: "42deg",
    delay: "1.2s",
    drift: "-38px",
    lift: "-26px",
    returnX: "14px",
    returnY: "-14px",
    duration: "7.6s",
  },
];

function BirthdayHubRoute() {
  return (
    <BirthdaySetupGate>
      <BirthdayCelebrationExperience />
      <BirthdayHubPage />
    </BirthdaySetupGate>
  );
}

function safeDate(value: string) {
  const date = new Date(`${value}T12:00:00+05:30`);
  return Number.isNaN(date.getTime())
    ? "Coming soon"
    : new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        day: "numeric",
        month: "long",
      }).format(date);
}

function birthdayErrorSummary(error: unknown) {
  if (!error || typeof error !== "object") return "Unknown Supabase error.";
  const value = error as { code?: unknown; message?: unknown };
  const code = typeof value.code === "string" ? `[${value.code}] ` : "";
  const message = typeof value.message === "string" ? value.message : "Unknown Supabase error.";
  return `${code}${message}`;
}

function BirthdayHeroDecorations() {
  return (
    <div className="birthday-hero-decoration-layer" aria-hidden="true">
      {HERO_BALLOONS.map((balloon) => (
        <span
          key={balloon.id}
          className="birthday-hero-balloon"
          data-hero-balloon={balloon.id}
          style={{ ...balloon.style, color: balloon.color } as CSSProperties}
        >
          <span className="birthday-hero-balloon-sway">
            <BirthdayBalloonArt id={`birthday-wall-${balloon.id}`} color={balloon.color} />
          </span>
        </span>
      ))}
      {HERO_BUTTERFLIES.map((butterfly, index) => (
        <span
          key={`hero-butterfly-${index}`}
          className="birthday-hero-butterfly"
          data-hero-butterfly={index}
          style={
            {
              top: butterfly.top,
              right: butterfly.right,
              bottom: butterfly.bottom,
              left: butterfly.left,
              "--butterfly-hue": butterfly.hue,
              "--butterfly-delay": butterfly.delay,
              "--butterfly-travel-x": butterfly.drift,
              "--butterfly-travel-y": butterfly.lift,
              "--butterfly-return-x": butterfly.returnX,
              "--butterfly-return-y": butterfly.returnY,
              "--butterfly-duration": butterfly.duration,
            } as CSSProperties
          }
        >
          <svg viewBox="0 0 48 40" className="h-full w-full overflow-visible">
            <g className="birthday-hero-butterfly-wing birthday-hero-butterfly-wing-left">
              <path d="M23 19C14 3 4 4 4 14c0 7 7 10 19 8Z" fill="#a78bfa" />
              <path d="M23 21C12 18 8 26 12 33c4 5 9 1 12-8Z" fill="#f9a8d4" />
            </g>
            <g className="birthday-hero-butterfly-wing birthday-hero-butterfly-wing-right">
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
        </span>
      ))}
    </div>
  );
}

function BirthdayHubPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [reaction, setReaction] = useState("🎉");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [myBirthdayExists, setMyBirthdayExists] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  const hub = useQuery({
    queryKey: ["birthday-hub", user?.id ?? "visitor"],
    queryFn: async () => {
      const { data, error } = await birthdayRpc<BirthdayPerson[]>("birthday_hub", {
        _days_ahead: 30,
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
  const settings = useQuery({
    queryKey: ["birthday-settings", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } =
        await birthdayRpc<{ birthday_month: number | null; birthday_day: number | null }[]>(
          "birthday_my_settings",
        );
      if (error) throw error;
      return Array.isArray(data) ? (data[0] ?? null) : data;
    },
  });
  const adminAccess = useQuery({
    queryKey: ["birthday-admin", user?.id],
    enabled: Boolean(user?.id && !isAnonymousAccount(user)),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (error) throw error;
      return data === true;
    },
  });

  useEffect(() => {
    setMyBirthdayExists(Boolean(settings.data?.birthday_month && settings.data?.birthday_day));
  }, [settings.data]);
  useEffect(() => {
    if (selectedId || typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("user");
    if (id && hub.data?.some((person) => person.user_id === id)) setSelectedId(id);
  }, [hub.data, selectedId]);
  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(false), 2200);
    return () => window.clearTimeout(timer);
  }, [success]);
  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const selected = useMemo(
    () => hub.data?.find((person) => person.user_id === selectedId) ?? null,
    [hub.data, selectedId],
  );
  const wall = useInfiniteQuery({
    queryKey: ["birthday-wish-wall", selectedId, user?.id ?? "visitor"],
    enabled: Boolean(selectedId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await birthdayRpc<Wish[]>("birthday_wish_wall", {
        _recipient_id: selectedId,
        _limit: 20,
        _offset: pageParam,
      });
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < 20 ? undefined : pages.reduce((count, page) => count + page.length, 0),
  });
  const wishes = wall.data?.pages.flat() ?? [];
  const counts = wishes[0] ?? null;
  const todaysBirthdays = (hub.data ?? []).filter((person) => person.days_until === 0);
  const upcomingBirthdays = (hub.data ?? []).filter((person) => person.days_until > 0);

  async function sendWish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || isAnonymousAccount(user)) {
      toast.error("Sign in with your PREPWIAN account to send a birthday wish.");
      return;
    }
    if (!selected) return;
    if (message.trim().length < 2 || message.trim().length > 280) {
      toast.error("Your wish should be between 2 and 280 characters.");
      return;
    }
    setSending(true);
    const { error } = await birthdayRpc<string>("birthday_send_wish", {
      _recipient_id: selected.user_id,
      _message: message.trim(),
      _reaction: reaction,
    });
    setSending(false);
    if (error) {
      toast.error(error.message || "We couldn't send your wish.");
      return;
    }
    setMessage("");
    setSuccess(true);
    toast.success(`Your wish is on ${selected.display_name}'s wall`);
    await Promise.all([
      wall.refetch(),
      queryClient.invalidateQueries({ queryKey: ["birthday-hub"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] }),
      queryClient.invalidateQueries({ queryKey: ["birthday-badges", user.id] }),
    ]);
  }

  async function replay() {
    if (!myBirthdayExists) {
      toast.info("Add your birthday in your profile settings to personalize the celebration.");
      return;
    }
    window.dispatchEvent(new Event("jph-birthday-replay"));
  }

  async function shareSelectedBirthday() {
    if (!selected) return;
    const birthdayUrl = new URL("/birthday", window.location.origin);
    birthdayUrl.searchParams.set("user", selected.user_id);
    const text =
      selected.days_until === 0
        ? `Join me in celebrating ${selected.display_name} today on PREPWIAN!`
        : `${selected.display_name}'s birthday is coming up in ${selected.days_until} day${selected.days_until === 1 ? "" : "s"} on PREPWIAN.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Birthday Hub", text, url: birthdayUrl.toString() });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${birthdayUrl.toString()}`);
        toast.success("Birthday card link copied");
      } else {
        toast.error("Sharing is not available in this browser.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("We couldn't share this birthday card. Please try again.");
    }
  }

  return (
    <AppShell>
      <main
        className={`mx-auto w-full max-w-6xl pb-12 text-foreground ${pageVisible ? "" : "birthday-hub-paused"}`}
        aria-labelledby="birthday-hub-title"
      >
        <style>{`
          @keyframes birthday-hub-enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes birthday-cta-drift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
          @keyframes birthday-hero-balloon-inflate { 0% { opacity: 0; transform: translateY(14px) scale(.38,.48) rotate(-8deg); } 58% { opacity: var(--hero-opacity,.65); transform: translateY(-3px) scale(1.06,.96) rotate(3deg); } 78% { transform: translateY(1px) scale(.98,1.02) rotate(-2deg); } 100% { opacity: var(--hero-opacity,.65); transform: translateY(0) scale(1) rotate(0); } }
          @keyframes birthday-hero-balloon-sway { 0%,100% { transform: translate3d(0,0,0) rotate(-2deg); } 23% { transform: translate3d(var(--sway-drift,7px),-12px,0) rotate(2.5deg); } 52% { transform: translate3d(var(--travel-x,24px),var(--travel-y,-44px),0) rotate(-3deg); } 78% { transform: translate3d(var(--travel-return-x,-14px),var(--travel-return-y,-16px),0) rotate(2deg); } }
          @keyframes birthday-hero-butterfly-glide { 0%,100% { opacity: .52; transform: translate3d(0,0,0) rotate(-4deg); } 25% { opacity: .86; transform: translate3d(var(--butterfly-travel-x,42px),var(--butterfly-travel-y,-28px),0) rotate(6deg); } 52% { opacity: .72; transform: translate3d(var(--butterfly-return-x,-14px),var(--butterfly-return-y,-10px),0) rotate(-5deg); } 78% { opacity: .88; transform: translate3d(var(--butterfly-travel-x,42px),var(--butterfly-return-y,-10px),0) rotate(4deg); } }
          @keyframes birthday-hero-wing-flap { from { scale: .62 1; } to { scale: 1 1; } }
          .birthday-hub-enter { animation: birthday-hub-enter .48s cubic-bezier(.2,.8,.2,1) both; }
          .birthday-primary-cta { background-size: 200% 100%; animation: birthday-cta-drift 9s ease-in-out infinite; }
          .birthday-hero-decoration-layer { position: absolute; inset: 0; z-index: 10; overflow: visible; pointer-events: none; }
          .birthday-hero-balloon { position: absolute; display: block; transform-origin: 50% 80%; opacity: var(--hero-opacity,.65); filter: drop-shadow(0 8px 10px rgba(24,39,75,.14)); animation: birthday-hero-balloon-inflate 1.15s cubic-bezier(.2,.8,.2,1) var(--hero-delay,0s) both; will-change: transform,opacity; }
          .birthday-hero-balloon-sway { display: block; width: 100%; height: 100%; animation: birthday-hero-balloon-sway 9s ease-in-out var(--sway-delay,1s) infinite; }
          .birthday-hero-butterfly { position: absolute; display: block; width: clamp(32px,4vw,48px); height: clamp(27px,3.5vw,40px); opacity: .72; filter: hue-rotate(var(--butterfly-hue,0deg)) drop-shadow(0 5px 8px rgba(43,33,74,.14)); animation: birthday-hero-butterfly-glide var(--butterfly-duration,7s) ease-in-out var(--butterfly-delay,0s) infinite; will-change: transform,opacity; }
          .birthday-hero-butterfly-wing { transform-box: fill-box; animation: birthday-hero-wing-flap .48s ease-in-out infinite alternate; }
          .birthday-hero-butterfly-wing-left { transform-origin: 100% 55%; }
          .birthday-hero-butterfly-wing-right { transform-origin: 0% 55%; }
          .birthday-hub-paused .birthday-primary-cta { animation-play-state: paused !important; }
          .birthday-hub-paused .birthday-hero-balloon, .birthday-hub-paused .birthday-hero-balloon-sway, .birthday-hub-paused .birthday-hero-butterfly, .birthday-hub-paused .birthday-hero-butterfly-wing { animation-play-state: paused !important; }
          @media (max-width: 639px) {
            .birthday-hero-balloon { filter: drop-shadow(0 5px 8px rgba(24,39,75,.12)); }
            .birthday-hero-balloon[data-hero-balloon="hero-sky"] { top: 53%; right: 15%; }
            .birthday-hero-butterfly[data-hero-butterfly="0"] { top: 25%; right: 6%; }
            .birthday-hero-butterfly[data-hero-butterfly="1"] { top: 67%; right: 8%; }
            .birthday-hero-butterfly[data-hero-butterfly="2"] { bottom: 20%; left: 57%; }
          }
          @media (prefers-reduced-motion: reduce) { .birthday-hub-enter, .birthday-primary-cta, .birthday-hero-balloon, .birthday-hero-balloon-sway, .birthday-hero-butterfly, .birthday-hero-butterfly-wing { animation: none !important; } }
        `}</style>
        <section className="relative isolate overflow-visible rounded-[2rem] border border-sky-100/80 bg-gradient-to-br from-white via-white to-sky-50 px-5 py-9 text-foreground shadow-[0_30px_100px_-45px_rgba(79,70,229,.2)] dark:border-indigo-200/50 dark:from-[#10132f] dark:via-[#10132f] dark:to-[#10132f] dark:text-white dark:shadow-[0_30px_100px_-45px_rgba(79,70,229,.8)] sm:px-9 sm:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
          >
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
          </div>
          {/* Separate paint layer: only the glow clips to rounded corners; decorations stay above the surface and below content. */}
          <BirthdayHeroDecorations />
          <div className="relative z-20 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.18em] text-amber-800 dark:border-amber-100/20 dark:bg-white/10 dark:text-amber-100">
              <PartyPopper className="h-4 w-4" /> The PREPWIAN celebration wall
            </div>
            <h1
              id="birthday-hub-title"
              className="mt-5 font-display text-4xl font-black tracking-tight sm:text-6xl"
            >
              A little more joy
              <br className="hidden sm:block" /> for the journey.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-indigo-100/80 sm:text-base">
              Celebrate our community, send a note that matters, and remind someone that every big
              dream deserves to be celebrated.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="#today"
                className="birthday-primary-cta inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-pink-300 px-5 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                See today's birthdays <ArrowRight className="h-4 w-4" />
              </a>
              {user && (
                <button
                  type="button"
                  onClick={() => void replay()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                >
                  <RefreshCw className="h-4 w-4" /> Replay my celebration
                </button>
              )}
            </div>
          </div>
          <div className="relative z-20 mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile
              label="Today"
              value={todaysBirthdays.length}
              icon={<Cake className="h-4 w-4" />}
            />
            <StatTile
              label="Coming up"
              value={upcomingBirthdays.length}
              icon={<CalendarDays className="h-4 w-4" />}
            />
            <StatTile
              label="Wish wall"
              value="Open"
              icon={<Heart className="h-4 w-4" />}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </section>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(330px,.83fr)]">
          <div className="space-y-7">
            <section id="today" aria-labelledby="today-title">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.2em] text-rose-600 dark:text-rose-300">
                    Make their day
                  </p>
                  <h2 id="today-title" className="mt-1 font-display text-2xl font-bold">
                    Today's birthdays
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">India Standard Time</span>
              </div>
              {hub.isLoading ? (
                <BirthdayLoading />
              ) : hub.isError ? (
                <ErrorPanel error={hub.error} onRetry={() => void hub.refetch()} />
              ) : todaysBirthdays.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {todaysBirthdays.map((person, index) => (
                    <BirthdayCard
                      key={person.user_id}
                      person={person}
                      selected={selectedId === person.user_id}
                      onSelect={() => setSelectedId(person.user_id)}
                      className="birthday-hub-enter"
                      style={{ animationDelay: `${index * 65}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={<Sparkles className="h-5 w-5" />}
                  title="No public birthdays today"
                  body="There are no community birthdays visible today. You can still look ahead and send a note before someone's day arrives."
                />
              )}
            </section>
            <section aria-labelledby="upcoming-title">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.2em] text-indigo-600 dark:text-indigo-300">
                    The next 30 days
                  </p>
                  <h2 id="upcoming-title" className="mt-1 font-display text-2xl font-bold">
                    Coming up
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" /> A little notice goes a long way
                </span>
              </div>
              {hub.isLoading ? (
                <BirthdayLoading />
              ) : hub.isError ? (
                <ErrorPanel error={hub.error} onRetry={() => void hub.refetch()} />
              ) : upcomingBirthdays.length ? (
                <div className="space-y-2.5">
                  {upcomingBirthdays.map((person, index) => (
                    <BirthdayTimelineCard
                      key={person.user_id}
                      person={person}
                      selected={selectedId === person.user_id}
                      onSelect={() => setSelectedId(person.user_id)}
                      className="birthday-hub-enter"
                      style={{ animationDelay: `${index * 55}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={<CalendarDays className="h-5 w-5" />}
                  title="No upcoming birthdays to show"
                  body="When community members choose to share their birthday, their celebration appears here."
                />
              )}
            </section>
            <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <LockKeyhole className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display font-bold">Privacy comes first</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Dates appear only when a member chooses community or public visibility. The hub
                    never shows a birth year or full date of birth.
                  </p>
                  {user ? (
                    <Link
                      to="/profile"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      {myBirthdayExists
                        ? "Manage your birthday settings"
                        : "Add your birthday to your profile"}{" "}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      to="/auth"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      Sign in to add your birthday <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-[calc(var(--site-global-header-height)+1.25rem)]">
            <section
              className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft"
              aria-labelledby="wish-wall-title"
            >
              <div className="border-b border-border/70 bg-gradient-to-br from-rose-500/[.09] via-card to-amber-400/[.09] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-400 text-white shadow-sm">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-rose-600 dark:text-rose-300">
                      Notes from the community
                    </p>
                    <h2 id="wish-wall-title" className="mt-1 font-display text-xl font-bold">
                      Birthday wish wall
                    </h2>
                  </div>
                </div>
                {selected ? (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 p-3">
                    <Avatar className="h-11 w-11 ring-2 ring-rose-300/50">
                      <AvatarImage src={selected.avatar_url ?? undefined} alt="" />
                      <AvatarFallback>
                        {selected.display_name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{selected.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {safeDate(selected.birthday_on)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void shareSelectedBirthday()}
                        aria-label={`Share ${selected.display_name}'s birthday card`}
                        title="Share birthday card"
                        className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedId(null)}
                        aria-label="Clear selected birthday"
                        className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    Choose a birthday above to read wishes or write a message they'll remember.
                  </p>
                )}
              </div>

              {selected ? (
                <>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-border/70 px-5 py-3 text-xs text-muted-foreground">
                    <span>
                      <strong className="text-foreground">
                        {counts?.wish_count ?? selected.wish_count}
                      </strong>{" "}
                      wishes
                    </span>
                    <span>
                      <strong className="text-foreground">
                        {counts?.unique_wisher_count ?? selected.unique_wisher_count}
                      </strong>{" "}
                      people celebrated
                    </span>
                  </div>
                  <div className="max-h-[410px] space-y-3 overflow-y-auto p-4" aria-live="polite">
                    {wall.isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2
                          className="h-5 w-5 animate-spin text-primary"
                          aria-label="Loading birthday wishes"
                        />
                      </div>
                    ) : wall.isError ? (
                      <div
                        role="alert"
                        className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
                      >
                        <p>Wish wall RPC failed: {birthdayErrorSummary(wall.error)}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => void wall.refetch()}
                        >
                          Retry
                        </Button>
                      </div>
                    ) : wishes.length ? (
                      wishes.map((wish) => (
                        <WishCard
                          key={wish.id}
                          wish={wish}
                          currentUserId={user?.id ?? null}
                          recipientId={selected.user_id}
                          onChanged={() => {
                            void wall.refetch();
                            void queryClient.invalidateQueries({ queryKey: ["birthday-hub"] });
                          }}
                        />
                      ))
                    ) : (
                      <div className="py-6 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-500/10 text-rose-500">
                          <Gift className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-sm font-semibold">Be the first to leave a wish</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          A few kind words can make their day.
                        </p>
                      </div>
                    )}
                    {wall.hasNextPage && (
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        disabled={wall.isFetchingNextPage}
                        onClick={() => void wall.fetchNextPage()}
                      >
                        {wall.isFetchingNextPage ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ChevronDown className="mr-2 h-4 w-4" />
                        )}
                        Load more wishes
                      </Button>
                    )}
                  </div>
                  <form
                    onSubmit={(event) => void sendWish(event)}
                    className="border-t border-border/70 bg-muted/20 p-4 sm:p-5"
                  >
                    {selected.days_until > 0 && (
                      <p className="mb-3 text-xs text-muted-foreground">
                        Wish window closes in {selected.days_until} day
                        {selected.days_until === 1 ? "" : "s"}.
                      </p>
                    )}
                    {!user || isAnonymousAccount(user) ? (
                      <div className="rounded-2xl border border-dashed border-border p-4 text-center">
                        <p className="text-sm font-medium">Sign in to add your voice</p>
                        <Link
                          to="/auth"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        >
                          Sign in <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    ) : selected.user_id === user.id ? (
                      <p className="rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">
                        This is your birthday wall. You can remove wishes you don't want displayed.
                      </p>
                    ) : (
                      <>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Choose a reaction
                          </p>
                          <div className="flex gap-1">
                            {REACTIONS.map((item) => (
                              <button
                                key={item}
                                type="button"
                                aria-label={`Use reaction ${item}`}
                                aria-pressed={reaction === item}
                                onClick={() => setReaction(item)}
                                className={`grid h-9 w-9 place-items-center rounded-full text-lg transition ${reaction === item ? "bg-rose-500/15 ring-2 ring-rose-400" : "hover:bg-accent"}`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {PRESET_WISHES.map((preset, index) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setMessage(preset)}
                              className="rounded-full border border-border/70 bg-background px-2.5 py-1.5 text-[10px] font-medium transition hover:border-primary/50 hover:text-primary"
                            >
                              {["Keep dreaming", "Keep growing", "Make it count"][index]}
                            </button>
                          ))}
                        </div>
                        <Textarea
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          placeholder="Write a personal birthday wish…"
                          rows={3}
                          maxLength={280}
                          aria-label="Birthday wish message"
                          className="resize-y rounded-2xl bg-background"
                        />
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {message.length}/280 · One wish per person, per birthday
                          </span>
                          <Button
                            type="submit"
                            disabled={
                              sending || message.trim().length < 2 || selected.days_until > 30
                            }
                            className="min-h-10 rounded-full px-4"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {sending ? "Sending…" : "Send wish"}
                          </Button>
                        </div>
                        {success && (
                          <div
                            role="status"
                            className="relative mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                          >
                            <WishConfetti />
                            <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
                            <Check className="h-4 w-4" />
                            Your wish is on the wall.
                          </div>
                        )}
                      </>
                    )}
                  </form>
                </>
              ) : (
                <div className="p-5">
                  <EmptyPanel
                    icon={<Heart className="h-5 w-5" />}
                    title="Choose someone to celebrate"
                    body="Select a birthday card to see their wishes and leave a note."
                  />
                </div>
              )}
            </section>
            <section className="rounded-3xl border border-primary/15 bg-primary/[.04] p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Your birthday, your choice</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Set visibility to private, community, or public. You can update it or remove
                    your date any time.
                  </p>
                  <Link
                    to={user ? "/profile" : "/auth"}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    {user ? "Open profile settings" : "Sign in to set preferences"}{" "}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </section>
            {user && !isAnonymousAccount(user) && adminAccess.isError && (
              <section
                role="alert"
                className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs"
              >
                <p className="font-semibold">Admin access could not be checked.</p>
                <p className="mt-1 break-words text-muted-foreground">
                  {adminAccess.error instanceof Error
                    ? adminAccess.error.message
                    : "The role-check RPC failed."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => void adminAccess.refetch()}
                >
                  Retry role check
                </Button>
              </section>
            )}
            {adminAccess.data && <BirthdayModerationPanel />}
          </aside>
        </div>
        <BirthdayExperienceStudio
          userId={user && !isAnonymousAccount(user) ? user.id : undefined}
          recipientName={
            selected?.display_name ??
            String(
              user?.user_metadata?.full_name ??
                user?.user_metadata?.name ??
                user?.email?.split("@")[0] ??
                "Aspirant",
            )
          }
          wishes={selected ? wishes : []}
          wishesLoading={Boolean(selectedId) && wall.isLoading}
          wishesError={Boolean(selectedId) && wall.isError}
        />
      </main>
    </AppShell>
  );
}

type ReportedWish = {
  report_id: string;
  wish_id: string;
  reporter_name: string;
  sender_name: string;
  recipient_id: string;
  message: string;
  reason: string;
  reported_at: string;
};

function BirthdayModerationPanel() {
  const queryClient = useQueryClient();
  const reports = useQuery({
    queryKey: ["birthday-moderation-queue"],
    queryFn: async () => {
      const { data, error } = await birthdayRpc<ReportedWish[]>("birthday_moderation_queue", {
        _limit: 50,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
  async function resolve(reportId: string, deleteWish: boolean) {
    if (deleteWish && !window.confirm("Remove this birthday wish from the community wall?")) return;
    const { error } = await birthdayRpc<boolean>("birthday_resolve_report", {
      _report_id: reportId,
      _delete_wish: deleteWish,
    });
    if (error) toast.error(error.message || "The report could not be resolved.");
    else {
      toast.success(deleteWish ? "Wish removed and report resolved" : "Report dismissed");
      await queryClient.invalidateQueries({ queryKey: ["birthday-moderation-queue"] });
      await queryClient.invalidateQueries({ queryKey: ["birthday-hub"] });
    }
  }
  return (
    <section
      className="rounded-3xl border border-amber-500/25 bg-amber-500/[.045] p-5"
      aria-labelledby="birthday-moderation-title"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-700 dark:text-amber-300">
            Admin tools
          </p>
          <h2 id="birthday-moderation-title" className="mt-1 font-display font-bold">
            Reported wishes
          </h2>
        </div>
        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold">
          {reports.data?.length ?? 0}
        </span>
      </div>
      {reports.isLoading ? (
        <p className="mt-3 text-xs text-muted-foreground">Loading reports…</p>
      ) : reports.isError ? (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"
        >
          <p>RPC `birthday_moderation_queue` failed: {birthdayErrorSummary(reports.error)}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => void reports.refetch()}
          >
            Retry reports
          </Button>
        </div>
      ) : reports.data?.length ? (
        <div className="mt-4 space-y-3">
          {reports.data.map((report) => (
            <article
              key={report.report_id}
              className="rounded-2xl border border-border/70 bg-card p-3"
            >
              <p className="text-xs font-semibold">{report.sender_name} → community wish</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">“{report.message}”</p>
              <p className="mt-2 text-[11px]">
                <strong>Reason:</strong> {report.reason}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Reported by {report.reporter_name}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-9 flex-1"
                  onClick={() => void resolve(report.report_id, false)}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="min-h-9 flex-1"
                  onClick={() => void resolve(report.report_id, true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Remove wish
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          No open birthday-wish reports.
        </p>
      )}
    </section>
  );
}

function BirthdayCard({
  person,
  selected,
  onSelect,
  className = "",
  style,
}: {
  person: BirthdayPerson;
  selected: boolean;
  onSelect: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={style}
      className={`group relative min-h-44 overflow-hidden rounded-3xl border p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected ? "border-rose-400 bg-rose-500/[.07] ring-1 ring-rose-400/30" : "border-border/70 bg-card"} ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute -right-5 -top-6 text-7xl opacity-[.08] transition group-hover:rotate-12 group-hover:scale-110"
      >
        🎂
      </span>
      <div className="relative flex items-center gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-rose-300/50">
          <AvatarImage src={person.avatar_url ?? undefined} alt="" />
          <AvatarFallback>{person.display_name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-display font-bold">{person.display_name}</p>
          <p className="text-xs text-muted-foreground">Birthday today</p>
        </div>
      </div>
      <div className="relative mt-5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500/10 to-amber-400/15 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-200">
          <Cake className="h-3.5 w-3.5" /> Today's celebration
        </span>
        <span className="text-xs text-muted-foreground">{person.wish_count} wishes</span>
      </div>
    </button>
  );
}

function BirthdayTimelineCard({
  person,
  selected,
  onSelect,
  className = "",
  style,
}: {
  person: BirthdayPerson;
  selected: boolean;
  onSelect: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={style}
      className={`flex min-h-[76px] w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition hover:border-primary/40 hover:bg-accent/30 ${selected ? "border-primary/50 bg-primary/[.06]" : "border-border/70 bg-card"} ${className}`}
    >
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-rose-500/20 text-center">
        <span className="text-[9px] font-bold uppercase text-muted-foreground">
          {new Intl.DateTimeFormat("en", { month: "short", timeZone: "Asia/Kolkata" }).format(
            new Date(`${person.birthday_on}T12:00:00+05:30`),
          )}
        </span>
        <span className="font-display text-lg font-black leading-5">
          {new Intl.DateTimeFormat("en", { day: "numeric", timeZone: "Asia/Kolkata" }).format(
            new Date(`${person.birthday_on}T12:00:00+05:30`),
          )}
        </span>
      </div>
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={person.avatar_url ?? undefined} alt="" />
        <AvatarFallback>{person.display_name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{person.display_name}</p>
        <p className="text-xs text-muted-foreground">
          {person.days_until === 1 ? "Tomorrow" : `In ${person.days_until} days`} ·{" "}
          {safeDate(person.birthday_on)}
        </p>
      </div>
      <div className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:flex">
        <MessageCircle className="h-3.5 w-3.5" />
        {person.wish_count}
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function WishCard({
  wish,
  currentUserId,
  recipientId,
  onChanged,
}: {
  wish: Wish;
  currentUserId: string | null;
  recipientId: string;
  onChanged: () => void;
}) {
  const isOwn = currentUserId === wish.sender_id;
  const isRecipient = currentUserId === recipientId;
  async function remove() {
    if (!window.confirm("Delete this birthday wish from the wall? This can't be undone.")) return;
    const { error } = await birthdayRpc<boolean>("birthday_delete_wish", { _wish_id: wish.id });
    if (error) toast.error(error.message || "Couldn't delete this wish.");
    else {
      toast.success("Wish removed");
      onChanged();
    }
  }
  async function report() {
    const reason = window.prompt("Why are you reporting this wish? (3–240 characters)");
    if (reason === null) return;
    const { error } = await birthdayRpc<boolean>("birthday_report_wish", {
      _wish_id: wish.id,
      _reason: reason.trim(),
    });
    if (error) toast.error(error.message || "Couldn't submit the report.");
    else toast.success("Thanks. Your report has been sent to the moderation team.");
  }
  return (
    <article className="rounded-2xl border border-border/70 bg-background/75 p-3.5 shadow-sm">
      <div className="flex items-start gap-2.5">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={wish.sender_avatar_url ?? undefined} alt="" />
          <AvatarFallback>{wish.sender_name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-bold">{wish.sender_name}</p>
            <time className="shrink-0 text-[10px] text-muted-foreground" dateTime={wish.created_at}>
              {new Intl.DateTimeFormat("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "numeric",
                month: "short",
              }).format(new Date(wish.created_at))}
            </time>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{wish.message}</p>
        </div>
        <span aria-label={`Reaction ${wish.reaction}`} className="text-lg">
          {wish.reaction}
        </span>
      </div>
      {(isOwn || isRecipient || currentUserId) && (
        <div className="mt-2 flex justify-end gap-1">
          {!isOwn && currentUserId && (
            <button
              type="button"
              onClick={() => void report()}
              aria-label="Report birthday wish"
              title="Report wish"
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
            </button>
          )}
          {(isOwn || isRecipient) && (
            <button
              type="button"
              onClick={() => void remove()}
              aria-label="Delete birthday wish"
              title="Delete wish"
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function StatTile({
  label,
  value,
  icon,
  className = "",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
}) {
  const target = typeof value === "number" ? Math.max(0, value) : null;
  const [count, setCount] = useState(target ?? 0);
  useEffect(() => {
    if (target === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || target === 0) {
      setCount(target);
      return;
    }
    const startedAt = performance.now();
    let frame = 0;
    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 650);
      setCount(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [target]);

  return (
    <div
      className={`rounded-2xl border border-border/70 bg-card/85 p-3.5 text-card-foreground shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[.07] ${className}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground dark:text-indigo-100/70">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[.14em]">{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-black">{target === null ? value : count}</p>
    </div>
  );
}
function BirthdayLoading() {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-3xl border border-border/70 bg-card">
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label="Loading birthdays" />
    </div>
  );
}
function ErrorPanel({ onRetry, error }: { onRetry: () => void; error: unknown }) {
  return (
    <div
      role="alert"
      className="rounded-3xl border border-destructive/20 bg-destructive/[.04] p-5 text-sm"
    >
      <p className="font-semibold">Birthday RPC `birthday_hub` failed.</p>
      <p className="mt-1 break-words text-muted-foreground">{birthdayErrorSummary(error)}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        No placeholder birthday data is being shown.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-3">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
function EmptyPanel({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/70 px-5 py-8 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}
