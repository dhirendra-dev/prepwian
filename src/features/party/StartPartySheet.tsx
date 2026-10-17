// src/features/party/StartPartySheet.tsx
// Futuristic "Start a Watch Party" creation sheet.

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Clapperboard,
  ExternalLink,
  Gamepad2,
  Globe,
  Headphones,
  Laugh,
  Link2,
  Loader2,
  Lock,
  Mic2,
  Play,
  Search,
  Sparkles,
  Trophy,
  Tv2,
  X,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, SOURCE_LABEL, parseSource } from "./partyLib";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;

type Visibility = "public" | "unlisted" | "private";

type Person = {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
};

const WHO_CAN_JOIN: {
  id: Visibility;
  label: string;
  hint: string;
  Icon: typeof Globe;
}[] = [
  {
    id: "public",
    label: "Public",
    hint: "Anyone can find it",
    Icon: Globe,
  },
  {
    id: "unlisted",
    label: "Link only",
    hint: "Share the link",
    Icon: Link2,
  },
  {
    id: "private",
    label: "Private",
    hint: "Invite by link",
    Icon: Lock,
  },
];

const CATEGORY_ICONS: Record<string, typeof Play> = {
  youtube: Play,
  movie: Clapperboard,
  series: Tv2,
  cricket: Trophy,
  football: Trophy,
  sports: Trophy,
  gaming: Gamepad2,
  music: Headphones,
  study: BookOpen,
  podcast: Mic2,
  comedy: Laugh,
  other: Sparkles,
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (roomId: string) => void;
};

function SourcePreview({ parsed }: { parsed: ReturnType<typeof parseSource> }) {
  if (!parsed) return null;

  const Icon =
    parsed.type === "youtube"
      ? Play
      : parsed.type === "twitch"
        ? Tv2
        : parsed.type === "mp4"
          ? Clapperboard
          : ExternalLink;

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] shadow-[0_12px_35px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-3 p-3">
        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black/30">
          {parsed.thumbnail ? (
            <img src={parsed.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-500/15 to-violet-500/10">
              <Icon className="h-5 w-5 text-white/55" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            </span>

            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-300">
              Source ready
            </span>
          </div>

          <p className="mt-1 truncate text-sm font-semibold text-white/90">{parsed.label}</p>

          <p className="truncate text-[10px] text-white/30">{parsed.host}</p>
        </div>

        <Check className="h-4 w-4 shrink-0 text-emerald-300" />
      </div>
    </div>
  );
}

export function StartPartySheet({ open, onClose, onCreated }: Props) {
  const [category, setCategory] = useState<string>("youtube");

  const [title, setTitle] = useState("");

  const [url, setUrl] = useState("");

  const [visibility, setVisibility] = useState<Visibility>("public");

  const [query, setQuery] = useState("");

  const [results, setResults] = useState<Person[]>([]);

  const [invited, setInvited] = useState<Person[]>([]);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseSource(url), [url]);

  useEffect(() => {
    const q = query
      .trim()
      .replace(/[%,()]/g, "")
      .replace(/^@/, "");

    if (q.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await db
        .from("public_profiles")
        .select("id,full_name,username,avatar_url")
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(6);

      setResults(
        (data ?? []).map((person: any) => ({
          id: person.id,
          name: person.username || person.full_name || "Student",
          username: person.username,
          avatar: person.avatar_url,
        })),
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!open) {
    return null;
  }

  const cat = CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0];

  const canGoLive = Boolean(parsed) && !busy;

  async function goLive() {
    if (!parsed) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { data: auth } = await supabase.auth.getUser();

      const user = auth.user;

      if (!user) {
        throw new Error("Please sign in to start a watch party.");
      }

      const id = crypto.randomUUID();

      const { error: insertError } = await db.from("watch_rooms").insert({
        id,
        host_id: user.id,
        title: (title.trim() || `${cat.label} party`).slice(0, 200),
        description: null,
        subject: "Mixed",
        visibility,
        status: "live",
        category,
        source_type: parsed.type,
        source_url: parsed.url,
        current_video_id: parsed.type === "youtube" ? parsed.videoId : null,
        thumbnail_url: parsed.thumbnail,
        is_playing: false,
        position_seconds: 0,
        playback_rate: 1,
        playback_sequence: 0,
        playback_updated_by: user.id,
        allow_participant_control: true,
      });

      if (insertError) {
        throw insertError;
      }

      if (invited.length > 0) {
        await db.from("watch_room_members").insert(
          invited.map((person) => ({
            room_id: id,
            user_id: person.id,
            role: "participant",
            status: "active",
          })),
        );
      }

      setTitle("");
      setUrl("");
      setInvited([]);
      setQuery("");
      setResults([]);

      onCreated(id);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't start the party. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="jph-party-create-layer fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 text-white backdrop-blur-xl sm:items-center sm:p-4">
      <style>{`
        :root:not(.dark) .jph-party-create-sheet {
          color: #1b1d38 !important;
          border-color: rgba(57,62,116,.16) !important;
          background: rgba(255,255,255,.97) !important;
          box-shadow: 0 24px 80px rgba(30,34,82,.22) !important;
        }
        :root:not(.dark) .jph-party-create-sheet [class*="text-white/"] {
          color: rgba(30,35,72,.66) !important;
        }
        :root:not(.dark) .jph-party-create-sheet [class*="border-white/"] {
          border-color: rgba(57,62,116,.14) !important;
        }
        :root:not(.dark) .jph-party-create-sheet [class*="bg-white/"] {
          background-color: rgba(46,51,104,.045) !important;
        }
        :root:not(.dark) .jph-party-create-sheet input {
          color: #1b1d38 !important;
          border-color: rgba(57,62,116,.17) !important;
          background: #f7f8ff !important;
        }
        :root:not(.dark) .jph-party-create-sheet input::placeholder {
          color: rgba(54,60,101,.43) !important;
        }
        :root:not(.dark) .jph-party-create-sheet [class*="bg-[#0b0b10]"] {
          background: rgba(255,255,255,.97) !important;
        }
      `}</style>
      <div
        className="jph-party-create-sheet
          relative
          max-h-[94dvh]
          w-full
          max-w-2xl
          overflow-y-auto
          overflow-x-hidden
          rounded-t-[2rem]
          border
          border-white/[0.10]
          bg-[#0b0b10]/95
          shadow-[0_-30px_120px_rgba(0,0,0,0.58)]
          backdrop-blur-3xl
          sm:rounded-[2rem]
          sm:shadow-[0_30px_120px_rgba(0,0,0,0.58)]
        "
      >
        {/* Ambient lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.18),transparent_62%)]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-15%] top-20 h-48 w-48 rounded-full bg-fuchsia-500/[0.06] blur-[80px]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-15%] top-28 h-48 w-48 rounded-full bg-indigo-500/[0.07] blur-[80px]"
        />

        {/* Mobile sheet handle */}
        <div className="relative mx-auto mt-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

        {/* Header */}
        <div className="relative border-b border-white/[0.07] px-5 pb-4 pt-4 sm:px-7 sm:pt-6">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-300/15 bg-gradient-to-br from-fuchsia-400/20 to-violet-500/20 shadow-[0_10px_35px_rgba(217,70,239,0.15)]">
                <Zap className="h-5 w-5 text-fuchsia-200" />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                  Start a watch party
                </h2>

                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                  Create your room
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-2.5 text-white/60 transition hover:bg-white/[0.08] hover:text-white active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="relative px-5 sm:px-7">
          {/* ------------------------------------------------------------ */}
          {/* 01 FORMAT */}
          {/* ------------------------------------------------------------ */}

          <div className="py-5">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                  01 / Format
                </p>

                <h3 className="mt-1 text-sm font-semibold text-white/90">What are you watching?</h3>
              </div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">
                {cat.label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((item) => {
                const active = item.id === category;

                const Icon = CATEGORY_ICONS[item.id] ?? Sparkles;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    aria-pressed={active}
                    className={`group relative min-h-[92px] overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.97] ${
                      active
                        ? "border-fuchsia-300/35 bg-gradient-to-br from-fuchsia-400/[0.16] to-violet-500/[0.10] shadow-[0_12px_35px_rgba(217,70,239,0.12)]"
                        : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.13] hover:bg-white/[0.055]"
                    }`}
                  >
                    {active && (
                      <>
                        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-200/60 to-transparent" />

                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-300 text-[#17101b] shadow-[0_0_14px_rgba(232,121,249,0.55)]">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      </>
                    )}

                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                        active
                          ? "border-fuchsia-200/20 bg-fuchsia-300/10 text-fuchsia-100"
                          : "border-white/[0.06] bg-white/[0.035] text-white/50 group-hover:text-white/80"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="mt-2 block text-[11px] font-semibold leading-tight text-white/80">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* 02 CONTENT */}
          {/* ------------------------------------------------------------ */}

          <div className="border-t border-white/[0.06] py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              02 / Content
            </p>

            <p className="mt-3 text-xs font-semibold text-white/65">Room title</p>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="Give your room a name"
              className="mt-1 w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3.5 text-[15px] outline-none transition placeholder:text-white/25 focus:border-fuchsia-400/45 focus:bg-white/[0.055] focus:ring-2 focus:ring-fuchsia-400/10"
            />

            <p className="mt-4 text-xs font-semibold text-white/65">Source link</p>

            <div className="relative">
              <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Paste any video / stream URL"
                className="mt-3 w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] py-3.5 pl-11 pr-4 text-[15px] outline-none transition placeholder:text-white/25 focus:border-fuchsia-400/45 focus:bg-white/[0.055] focus:ring-2 focus:ring-fuchsia-400/10"
              />
            </div>

            {url.trim() && (
              <p
                className={`mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] ${
                  parsed
                    ? "border-emerald-400/10 bg-emerald-400/[0.035] text-emerald-200/70"
                    : "border-rose-400/10 bg-rose-400/[0.035] text-rose-200/70"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    parsed ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />

                {parsed
                  ? parsed.type === "youtube" || parsed.type === "mp4"
                    ? `${SOURCE_LABEL[parsed.type]} link — everyone stays in sync.`
                    : `${SOURCE_LABEL[parsed.type]} link — it will play for everyone, but play/pause can't be synced.`
                  : "That doesn't look like a valid link."}
              </p>
            )}

            <SourcePreview parsed={parsed} />
          </div>

          {/* ------------------------------------------------------------ */}
          {/* 03 ACCESS */}
          {/* ------------------------------------------------------------ */}

          <div className="border-t border-white/[0.06] py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              03 / Access
            </p>

            <p className="mt-1 text-sm font-semibold text-white/90">Who can join?</p>

            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {WHO_CAN_JOIN.map(({ id, label, hint, Icon }) => {
                const active = visibility === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setVisibility(id)}
                    aria-pressed={active}
                    className={`relative rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.98] ${
                      active
                        ? "border-fuchsia-300/30 bg-fuchsia-400/[0.10] shadow-[0_10px_30px_rgba(217,70,239,0.08)]"
                        : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.13] hover:bg-white/[0.055]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                          active
                            ? "border-fuchsia-200/15 bg-fuchsia-300/10 text-fuchsia-100"
                            : "border-white/[0.06] bg-white/[0.03] text-white/50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      {active && <Check className="h-4 w-4 text-fuchsia-200" />}
                    </div>

                    <p className="mt-2 text-sm font-semibold">{label}</p>

                    <p className="mt-0.5 text-xs leading-snug text-white/40">{hint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* 04 PEOPLE */}
          {/* ------------------------------------------------------------ */}

          <div className="border-t border-white/[0.06] py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              04 / People
            </p>

            <p className="mt-1 text-sm font-semibold text-white/90">
              Invite members <span className="font-normal text-white/30">· optional</span>
            </p>

            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or @username"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] py-3.5 pl-11 pr-5 text-[15px] outline-none transition placeholder:text-white/25 focus:border-fuchsia-400/45 focus:bg-white/[0.055] focus:ring-2 focus:ring-fuchsia-400/10"
              />
            </div>

            {results.length > 0 && (
              <ul className="mt-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] shadow-[0_15px_45px_rgba(0,0,0,0.22)]">
                {results
                  .filter((r) => !invited.some((i) => i.id === r.id))
                  .map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setInvited((prev) => [...prev, r]);
                          setQuery("");
                          setResults([]);
                        }}
                        className="flex w-full items-center gap-3 border-b border-white/[0.05] px-4 py-3 text-left transition last:border-b-0 hover:bg-white/[0.06] active:bg-white/[0.09]"
                      >
                        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.07] text-sm font-semibold">
                          {r.avatar ? (
                            <img src={r.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            r.name.slice(0, 1).toUpperCase()
                          )}
                        </span>

                        <span className="text-sm">{r.name}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}

            {invited.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {invited.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.045] py-1.5 pl-2 pr-1.5 text-xs font-semibold text-white/75 shadow-[0_5px_20px_rgba(0,0,0,0.10)]"
                  >
                    {p.name}

                    <button
                      type="button"
                      aria-label={`Remove ${p.name}`}
                      onClick={() => setInvited((prev) => prev.filter((x) => x.id !== p.id))}
                      className="rounded-lg p-1 text-white/35 transition hover:bg-white/10 hover:text-white/80 active:scale-90"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {error && (
              <p className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-400/15 bg-rose-400/[0.055] px-4 py-3 text-sm leading-relaxed text-rose-200/80">
                {error}
              </p>
            )}

            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full ${
                        canGoLive ? "animate-ping bg-emerald-400/40" : "bg-white/10"
                      }`}
                    />

                    <span
                      className={`relative h-2 w-2 rounded-full ${
                        canGoLive ? "bg-emerald-400" : "bg-white/20"
                      }`}
                    />
                  </span>

                  <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-white/40">
                    {canGoLive ? "Room ready" : "Add a valid source"}
                  </span>
                </div>

                <span className="truncate text-[10px] font-semibold text-white/25">
                  {invited.length > 0 ? `${invited.length} invited` : "No invites yet"}
                </span>
              </div>
            </div>

            <div className="mt-3 border-t border-white/[0.07] pt-4">
              <button
                type="button"
                onClick={() => void goLive()}
                disabled={!canGoLive}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-fuchsia-200/15 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 py-4 text-[15px] font-bold text-white shadow-[0_14px_45px_rgba(139,92,246,0.24)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_18px_55px_rgba(139,92,246,0.30)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/15 blur-md transition-transform duration-700 group-hover:translate-x-[430%]" />

                {busy ? (
                  <>
                    <Loader2 className="relative h-5 w-5 animate-spin" />
                    <span className="relative">Starting…</span>
                  </>
                ) : (
                  <>
                    <Zap className="relative h-5 w-5" />
                    <span className="relative">Go live</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white/45 transition hover:bg-white/[0.03] hover:text-white/75"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
