import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BookHeart,
  Check,
  Loader2,
  LockKeyhole,
  Share2,
  Sparkles,
  Star,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { BirthdayDelights } from "@/components/birthday/BirthdayDelights";
import {
  BIRTHDAY_PARTY_THEMES,
  isBirthdayPartyTheme,
  type BirthdayActivity,
  type BirthdayPartyTheme,
} from "@/components/birthday/birthday-types";
import { Textarea } from "@/components/ui/textarea";
import { birthdayRpc } from "@/lib/birthday-rpc";

type VisibleWish = {
  id: string;
  sender_name: string;
  message: string;
  reaction: string;
  created_at: string;
};

type BadgeRow = { badge_key: string; awarded_at: string };

const BADGES = [
  {
    key: "balloon_friend",
    title: "Balloon friend",
    description: "Let a little joy fly.",
    icon: "🎈",
  },
  {
    key: "gift_opener",
    title: "Gift opener",
    description: "Unwrap a note of encouragement.",
    icon: "🎁",
  },
  {
    key: "cake_cutter",
    title: "Cake cutter",
    description: "Make a wish and share a slice.",
    icon: "🍰",
  },
  {
    key: "firework_captain",
    title: "Firework captain",
    description: "Light up the party sky.",
    icon: "🎆",
  },
  {
    key: "letter_keeper",
    title: "Letter keeper",
    description: "Open a little handwritten hope.",
    icon: "💌",
  },
  {
    key: "capsule_finder",
    title: "Capsule finder",
    description: "Discover a hidden pep talk.",
    icon: "🧧",
  },
  {
    key: "sparkle_caster",
    title: "Sparkle caster",
    description: "Wave the magic wand.",
    icon: "🪄",
  },
  {
    key: "finale_star",
    title: "Finale star",
    description: "Trigger the grand finale.",
    icon: "🌟",
  },
  {
    key: "memory_maker",
    title: "Memory maker",
    description: "Create a card worth keeping.",
    icon: "🖼️",
  },
  {
    key: "wish_giver",
    title: "Wish giver",
    description: "Send someone a birthday wish.",
    icon: "💛",
  },
] as const;

const THEME_SURFACES: Record<BirthdayPartyTheme, string> = {
  pastel: "from-rose-50 via-white to-sky-50 dark:from-rose-950/25 dark:via-card dark:to-sky-950/20",
  galaxy:
    "from-indigo-50 via-white to-violet-100 dark:from-indigo-950/35 dark:via-card dark:to-violet-950/30",
  candy:
    "from-pink-50 via-white to-amber-50 dark:from-pink-950/25 dark:via-card dark:to-amber-950/20",
  golden:
    "from-amber-50 via-white to-orange-50 dark:from-amber-950/25 dark:via-card dark:to-orange-950/20",
};
const THEME_COLORS: Record<BirthdayPartyTheme, [string, string]> = {
  pastel: ["#fff1f2", "#bae6fd"],
  galaxy: ["#312e81", "#7c3aed"],
  candy: ["#fbcfe8", "#fed7aa"],
  golden: ["#fde68a", "#fb923c"],
};
const CARD_DECORATIONS = ["🦋", "🎈", "🌟", "🎂"] as const;
const STAR_POSITIONS = [
  [12, 22],
  [29, 52],
  [43, 19],
  [60, 40],
  [79, 18],
  [88, 60],
  [69, 76],
  [44, 67],
  [21, 82],
  [7, 56],
  [34, 36],
  [55, 86],
  [76, 44],
  [92, 33],
  [17, 40],
  [49, 47],
] as const;

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character] ?? character;
  });
}

function wrapWords(value: string, maxCharacters: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > maxCharacters) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
    if (lines.length === 3) break;
  }
  if (line && lines.length < 3) lines.push(line);
  if (lines.length === 3 && words.join(" ").length > lines.join(" ").length) {
    lines[2] = `${lines[2].slice(0, Math.max(0, maxCharacters - 1)).trimEnd()}…`;
  }
  return lines;
}

async function createCardFile(
  recipient: string,
  message: string,
  decoration: string,
  theme: BirthdayPartyTheme,
) {
  const [start, end] = THEME_COLORS[theme];
  const titleColor = theme === "galaxy" ? "#ffffff" : "#231c3c";
  const recipientColor = theme === "galaxy" ? "#fbcfe8" : "#9d174d";
  const bodyColor = theme === "galaxy" ? "#ede9fe" : "#334155";
  const labelColor = theme === "galaxy" ? "#ddd6fe" : "#6b4a7a";
  const footerColor = theme === "galaxy" ? "#e0e7ff" : "#475569";
  const messageLines = wrapWords(message, 43);
  const messageMarkup = messageLines
    .map((line, index) => `<tspan x="600" dy="${index === 0 ? 0 : 42}">${escapeXml(line)}</tspan>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient><radialGradient id="glow"><stop stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" rx="48" fill="url(#bg)"/><circle cx="1040" cy="105" r="220" fill="url(#glow)" opacity=".8"/><circle cx="170" cy="520" r="235" fill="url(#glow)" opacity=".42"/><rect x="38" y="38" width="1124" height="554" rx="34" fill="none" stroke="#fff" stroke-opacity=".74" stroke-width="3"/><text x="600" y="142" text-anchor="middle" font-family="system-ui, sans-serif" font-size="29" font-weight="700" letter-spacing="7" fill="${labelColor}">A LITTLE JOY FOR YOUR JOURNEY</text><text x="600" y="228" text-anchor="middle" font-family="system-ui, sans-serif" font-size="86" font-weight="800" fill="${titleColor}">Happy Birthday,</text><text x="600" y="318" text-anchor="middle" font-family="system-ui, sans-serif" font-size="74" font-weight="800" fill="${recipientColor}">${escapeXml(recipient)}</text><text x="600" y="412" text-anchor="middle" font-family="system-ui, sans-serif" font-size="31" font-weight="500" fill="${bodyColor}">${messageMarkup}</text><text x="600" y="525" text-anchor="middle" font-family="system-ui, sans-serif" font-size="44">${escapeXml(decoration)}&#160;✨&#160;${escapeXml(decoration)}</text><text x="600" y="566" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="${footerColor}">JEE PREP HUB · KEEP DREAMING</text></svg>`;
  const svgFile = new File([svg], "birthday-memory.svg", { type: "image/svg+xml" });
  if (typeof createImageBitmap !== "function") return svgFile;

  try {
    const bitmap = await createImageBitmap(new Blob([svg], { type: "image/svg+xml" }));
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");
    if (!context) return svgFile;
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    return png ? new File([png], "birthday-memory.png", { type: "image/png" }) : svgFile;
  } catch {
    return svgFile;
  }
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BirthdayExperienceStudio({
  userId,
  recipientName,
  wishes,
  wishesLoading,
  wishesError,
}: {
  userId?: string;
  recipientName: string;
  wishes: VisibleWish[];
  wishesLoading: boolean;
  wishesError: boolean;
}) {
  const queryClient = useQueryClient();
  const themeStorageKey = `jph-birthday-theme:${userId ?? "visitor"}`;
  const [tab, setTab] = useState<"play" | "card" | "stars" | "badges">("play");
  const [theme, setTheme] = useState<BirthdayPartyTheme>(() => {
    if (typeof window === "undefined") return "pastel";
    try {
      const saved = localStorage.getItem(themeStorageKey);
      return isBirthdayPartyTheme(saved) ? saved : "pastel";
    } catch {
      return "pastel";
    }
  });
  const [cardRecipient, setCardRecipient] = useState(recipientName);
  const [cardMessage, setCardMessage] = useState(
    "May your next chapter bring brave steps, bright ideas, and people who cheer you on.",
  );
  const [decoration, setDecoration] = useState<(typeof CARD_DECORATIONS)[number]>("🦋");
  const [selectedWishId, setSelectedWishId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  const themeQuery = useQuery({
    queryKey: ["birthday-party-theme", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await birthdayRpc<string>("birthday_my_party_theme");
      if (error) throw error;
      return isBirthdayPartyTheme(data) ? data : "pastel";
    },
    staleTime: 60_000,
  });
  const badgesQuery = useQuery({
    queryKey: ["birthday-badges", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await birthdayRpc<BadgeRow[]>("birthday_my_badges");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    setCardRecipient(recipientName || "Aspirant");
  }, [recipientName]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(themeStorageKey);
      if (isBirthdayPartyTheme(saved)) setTheme(saved);
    } catch {
      // Local fallback settings are optional.
    }
  }, [themeStorageKey]);

  useEffect(() => {
    if (!themeQuery.data) return;
    setTheme(themeQuery.data);
    try {
      localStorage.setItem(themeStorageKey, themeQuery.data);
    } catch {
      // The authenticated preference remains available from the server RPC.
    }
  }, [themeQuery.data, themeStorageKey]);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const awardedKeys = useMemo(
    () => new Set((badgesQuery.data ?? []).map((badge) => badge.badge_key)),
    [badgesQuery.data],
  );
  const selectedWish = wishes.find((wish) => wish.id === selectedWishId) ?? null;

  async function recordActivity(activity: BirthdayActivity) {
    if (!userId) return;
    try {
      const { error } = await birthdayRpc<boolean>("birthday_record_activity", {
        _activity: activity,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["birthday-badges", userId] });
    } catch (error) {
      console.error("Birthday activity reward could not be recorded.", error);
      toast.error(
        "The activity worked, but its keepsake couldn't be saved. Please try again later.",
      );
      return;
    }
  }

  async function chooseTheme(nextTheme: BirthdayPartyTheme) {
    setTheme(nextTheme);
    try {
      localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // Local storage is only a guest-friendly fallback, never required.
    }
    if (!userId) return;
    try {
      const { data, error } = await birthdayRpc<boolean>("birthday_save_my_party_theme", {
        _theme: nextTheme,
      });
      if (error || data !== true)
        throw error ?? new Error("The theme save RPC returned no success result.");
      queryClient.setQueryData(["birthday-party-theme", userId], nextTheme);
    } catch (error) {
      console.error("Birthday party theme could not be saved.", error);
      toast.error("Your party theme changed for now, but couldn't be saved to your account.");
      return;
    }
  }

  async function shareCard() {
    const recipient = cardRecipient.trim();
    const message = cardMessage.trim();
    if (!recipient || !message) {
      toast.error("Add a name and a birthday message before sharing.");
      return;
    }
    setSharing(true);
    try {
      const file = await createCardFile(recipient, message, decoration, theme);
      const title = `A birthday card for ${recipient}`;
      const text = `Happy Birthday, ${recipient}! ${message}`;
      let saved = false;
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ title, text, files: [file] });
        saved = true;
      } else if (navigator.share) {
        await navigator.share({ title, text });
        saved = true;
        downloadFile(file);
      } else {
        let copied = false;
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          copied = true;
        }
        downloadFile(file);
        saved = true;
        toast.success(
          copied ? "Birthday card downloaded and message copied" : "Birthday card downloaded",
        );
      }
      if (saved) await recordActivity("memory_card_saved");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Birthday card share failed.", error);
      toast.error("Couldn't share the birthday card. You can still preview it here.");
    } finally {
      setSharing(false);
    }
  }

  const tabs = [
    { id: "play", label: "Party room", icon: <Sparkles className="h-4 w-4" /> },
    { id: "card", label: "Memory card", icon: <BookHeart className="h-4 w-4" /> },
    { id: "stars", label: "Wish stars", icon: <Star className="h-4 w-4" /> },
    { id: "badges", label: "Keepsakes", icon: <BadgeCheck className="h-4 w-4" /> },
  ] as const;

  return (
    <section
      className={`birthday-studio ${pageVisible ? "" : "birthday-studio-paused"} mt-8 overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br ${THEME_SURFACES[theme]} p-4 shadow-soft sm:p-6`}
      aria-labelledby="birthday-studio-title"
      data-birthday-theme={theme}
    >
      <style>{`
        @keyframes birthday-constellation-glow { 0%,100% { opacity:.72; filter:drop-shadow(0 0 0 transparent); } 50% { opacity:1; filter:drop-shadow(0 0 8px rgba(251,191,36,.7)); } }
        @keyframes birthday-wish-star-reveal { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .birthday-constellation-star { animation:birthday-constellation-glow 3.4s ease-in-out infinite; }
        .birthday-wish-star-reveal { animation:birthday-wish-star-reveal .28s ease-out both; }
        .birthday-studio-paused *, .birthday-studio-paused *::before, .birthday-studio-paused *::after { animation-play-state:paused!important; }
        @media (prefers-reduced-motion: reduce) { .birthday-studio *, .birthday-studio *::before, .birthday-studio *::after { animation:none!important; transition:none!important; scroll-behavior:auto!important; } }
      `}</style>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
            A little room for magic
          </p>
          <h2 id="birthday-studio-title" className="mt-1 font-display text-2xl font-black">
            Birthday Memory Studio
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Play, make a card, and keep the moments you earn. Your theme changes this studio without
            changing the site-wide light or dark setting.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Birthday party theme">
          {BIRTHDAY_PARTY_THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void chooseTheme(item.id)}
              aria-pressed={theme === item.id}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${theme === item.id ? "border-primary/60 bg-background text-foreground shadow-sm" : "border-border/70 bg-background/60 text-muted-foreground hover:bg-background"}`}
            >
              <span aria-hidden="true">{item.emoji}</span>
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-border/60 bg-background/55 p-1.5"
        role="tablist"
        aria-label="Birthday Studio"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            id={`birthday-studio-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`birthday-studio-panel-${item.id}`}
            onClick={() => setTab(item.id)}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-1 ${tab === item.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/70 hover:text-foreground"}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div
        id={`birthday-studio-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`birthday-studio-tab-${tab}`}
        className="mt-4"
      >
        {tab === "play" && (
          <BirthdayDelights
            displayName={recipientName}
            partyTheme={theme}
            onActivity={(activity) => void recordActivity(activity)}
          />
        )}

        {tab === "card" && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-5">
              <div>
                <h3 className="font-display text-lg font-bold">Make a card worth keeping</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Personalize a message, preview it, then share or download your finished card.
                </p>
              </div>
              <label className="block space-y-1.5 text-xs font-semibold">
                <span>For</span>
                <input
                  value={cardRecipient}
                  maxLength={48}
                  onChange={(event) => setCardRecipient(event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Card recipient name"
                />
              </label>
              <label className="block space-y-1.5 text-xs font-semibold">
                <span>Your message</span>
                <Textarea
                  value={cardMessage}
                  onChange={(event) => setCardMessage(event.target.value)}
                  maxLength={220}
                  rows={4}
                  className="resize-y rounded-xl bg-background text-sm font-normal"
                  aria-label="Birthday card message"
                />
                <span className="block text-right text-[10px] font-normal text-muted-foreground">
                  {cardMessage.length}/220
                </span>
              </label>
              <div>
                <p className="mb-2 text-xs font-semibold">Choose a decoration</p>
                <div className="flex gap-2" role="group" aria-label="Card decoration">
                  {CARD_DECORATIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-label={`Use ${item} decoration`}
                      aria-pressed={decoration === item}
                      onClick={() => setDecoration(item)}
                      className={`grid h-11 w-11 place-items-center rounded-full border text-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${decoration === item ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-accent"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void shareCard()}
                disabled={sharing || !cardRecipient.trim() || !cardMessage.trim()}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-pink-300 px-4 text-sm font-bold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {sharing ? "Preparing card…" : "Share birthday card"}
              </button>
            </div>
            <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-background/55 p-4 sm:p-6">
              <article
                className={`relative flex aspect-[1.62/1] w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/70 bg-gradient-to-br ${THEME_SURFACES[theme]} px-5 text-center shadow-[0_20px_55px_-30px_rgba(30,41,59,.4)]`}
                aria-label={`Birthday card preview for ${cardRecipient || "recipient"}`}
              >
                <span
                  className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-amber-300/25 blur-2xl"
                  aria-hidden="true"
                />
                <span
                  className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-rose-300/25 blur-2xl"
                  aria-hidden="true"
                />
                <span className="relative text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                  A little joy for your journey
                </span>
                <span aria-hidden="true" className="relative mt-3 text-3xl sm:text-4xl">
                  {decoration} ✨ {decoration}
                </span>
                <h3 className="relative mt-2 font-display text-2xl font-black tracking-tight sm:text-4xl">
                  Happy Birthday,
                </h3>
                <p className="relative mt-1 max-w-full truncate font-display text-xl font-bold text-rose-700 dark:text-rose-200 sm:text-3xl">
                  {cardRecipient.trim() || "Someone wonderful"}
                </p>
                <p className="relative mt-3 max-w-lg text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                  {cardMessage.trim() || "Your message will appear here."}
                </p>
                <span className="relative mt-4 text-[9px] font-bold tracking-[.2em] text-muted-foreground">
                  JEE PREP HUB · KEEP DREAMING
                </span>
              </article>
            </div>
          </div>
        )}

        {tab === "stars" && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.7fr)]">
            <div className="relative min-h-[240px] overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-100 dark:border-white/10 dark:from-indigo-950/30 dark:via-slate-950/40 dark:to-violet-950/30">
              <svg
                className="absolute inset-0 h-full w-full opacity-35"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M12 22 29 52 43 19 60 40 79 18 88 60 69 76 44 67 21 82 7 56 34 36 55 86 76 44 92 33"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth=".45"
                  strokeDasharray="1.2 2.5"
                />
              </svg>
              {wishesError ? (
                <div role="alert" className="relative z-10 p-6 text-sm text-destructive">
                  Visible birthday wishes couldn't be loaded, so no stars are shown.
                </div>
              ) : wishesLoading ? (
                <div className="relative z-10 flex min-h-[240px] items-center justify-center text-muted-foreground">
                  <Loader2
                    className="h-5 w-5 animate-spin"
                    aria-label="Loading visible birthday wishes"
                  />
                </div>
              ) : wishes.length === 0 ? (
                <div className="relative z-10 flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
                  <Star className="h-7 w-7 text-indigo-500" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold">The sky is waiting for a wish</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                    Select a community-visible birthday above. Only wishes already visible on that
                    person's wall appear here.
                  </p>
                </div>
              ) : (
                wishes.slice(0, STAR_POSITIONS.length).map((wish, index) => {
                  const [left, top] = STAR_POSITIONS[index];
                  const active = wish.id === selectedWishId;
                  return (
                    <button
                      key={wish.id}
                      type="button"
                      onClick={() => setSelectedWishId(active ? null : wish.id)}
                      aria-label={`Reveal wish ${index + 1} from ${wish.sender_name}`}
                      aria-pressed={active}
                      className={`birthday-constellation-star absolute z-10 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${active ? "scale-125 bg-white/85 text-amber-500 shadow-[0_0_22px_rgba(251,191,36,.8)] dark:bg-indigo-950/80" : "text-amber-500 hover:scale-110 hover:bg-white/50 dark:text-amber-200 dark:hover:bg-white/10"}`}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        animationDelay: `${(index % 7) * 160}ms`,
                      }}
                    >
                      <Star className="h-5 w-5 fill-current" aria-hidden="true" />
                    </button>
                  );
                })
              )}
              {wishes.length > STAR_POSITIONS.length && !wishesError && !wishesLoading && (
                <p className="absolute bottom-2 right-3 z-10 rounded-full bg-background/80 px-2 py-1 text-[10px] text-muted-foreground">
                  Showing {STAR_POSITIONS.length} of {wishes.length} visible wishes
                </p>
              )}
            </div>
            <div className="flex min-h-[220px] flex-col justify-center rounded-2xl border border-border/70 bg-card/80 p-5">
              {selectedWish ? (
                <div key={selectedWish.id} className="birthday-wish-star-reveal">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-indigo-600 dark:text-indigo-300">
                    A wish from {selectedWish.sender_name}
                  </p>
                  <p className="mt-3 text-lg" aria-hidden="true">
                    {selectedWish.reaction}
                  </p>
                  <blockquote className="mt-2 text-sm leading-6">
                    “{selectedWish.message}”
                  </blockquote>
                  <time
                    className="mt-4 block text-xs text-muted-foreground"
                    dateTime={selectedWish.created_at}
                  >
                    {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(
                      new Date(selectedWish.created_at),
                    )}
                  </time>
                </div>
              ) : (
                <div className="text-center">
                  <Sparkles className="mx-auto h-6 w-6 text-amber-500" aria-hidden="true" />
                  <h3 className="mt-3 font-display font-bold">Tap a star to read its wish</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Each star is an existing wish returned by the privacy-checked Birthday Wall.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "badges" && (
          <div className="rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold">Your birthday keepsakes</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Earn them by playing, sharing a card, and sending a real birthday wish. One reward
                  per activity—duplicates never add extra badges.
                </p>
              </div>
              <BadgeCheck className="h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
            </div>
            {!userId ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden="true" /> Sign in with a full
                account to save collectibles across devices.
              </div>
            ) : badgesQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2
                  className="h-5 w-5 animate-spin text-primary"
                  aria-label="Loading saved birthday badges"
                />
              </div>
            ) : badgesQuery.isError ? (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"
              >
                Saved badges couldn't be loaded.{" "}
                {badgesQuery.error instanceof Error ? badgesQuery.error.message : "Retry later."}
              </div>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {BADGES.map((badge) => {
                  const earned = awardedKeys.has(badge.key);
                  const award = badgesQuery.data?.find((item) => item.badge_key === badge.key);
                  return (
                    <article
                      key={badge.key}
                      className={`flex min-h-[82px] items-center gap-3 rounded-2xl border p-3 ${earned ? "border-amber-300/70 bg-amber-50/70 dark:border-amber-200/20 dark:bg-amber-400/[.08]" : "border-border/60 bg-background/60 opacity-75"}`}
                    >
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-background text-2xl shadow-sm"
                        aria-hidden="true"
                      >
                        {earned ? badge.icon : "🔒"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold">{badge.title}</p>
                        <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
                          {earned ? badge.description : "Not yet collected"}
                        </p>
                        {earned && award && (
                          <time
                            className="mt-1 block text-[9px] text-muted-foreground"
                            dateTime={award.awarded_at}
                          >
                            {new Intl.DateTimeFormat("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }).format(new Date(award.awarded_at))}
                          </time>
                        )}
                      </div>
                      {earned && (
                        <Check
                          className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300"
                          aria-label="Collected"
                        />
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
