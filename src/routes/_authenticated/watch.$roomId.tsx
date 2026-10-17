// src/routes/_authenticated/watch.$roomId.tsx
// Watch Party room: synced player, controls, who's watching, live chat.

import { LinkifiedText } from "@/components/LinkifiedText";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Link2,
  Loader2,
  LogOut,
  MessageSquare,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Pause,
  Play,
  Power,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Search,
  Send,
  Tv,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PartyPlayer, type PlayerHandle } from "@/features/party/PartyPlayer";
import { SOURCE_LABEL, fmtTime, parseSource, type ParsedSource } from "@/features/party/partyLib";

export const Route = createFileRoute("/_authenticated/watch/$roomId")({
  head: () => ({ meta: [
      { property: "og:title", content: "Study Watch Party — JEE Prep Hub" },
      { property: "og:description", content: "Watch lectures together and discuss them with fellow JEE aspirants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Study Watch Party — JEE Prep Hub" },
      { name: "twitter:description", content: "Watch lectures together and discuss them with fellow JEE aspirants." },
{ title: "Study Watch Party — JEE Prep Hub" }, { name: "description", content: "Watch lectures together and discuss them with fellow JEE aspirants." }] }),

  component: RoomRoute,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;

type Person = { id: string; name: string; avatar: string | null };
type ChatMsg = { id: string; user_id: string; body: string; created_at: string };
type Ctrl = { playing: boolean; pos: number; rate: number };
type Room = {
  id: string;
  host_id: string;
  title: string;
  status: string;
  visibility: string;
  source_url: string | null;
  current_video_id: string | null;
  is_playing: boolean;
  position_seconds: number | string;
  playback_rate: number | string;
  playback_updated_at: string | null;
};

/* ------------------------------------------------------------------ */
/* Route wrapper: needs the signed-in user id                          */
/* ------------------------------------------------------------------ */

function RoomRoute() {
  const { roomId } = Route.useParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setUserId(data.user?.id ?? null);
      setChecked(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!checked)
    return (
      <FullPage>
        <Loader2 className="h-7 w-7 animate-spin text-white/50" />
      </FullPage>
    );
  if (!userId) {
    return (
      <FullPage>
        <p className="text-lg font-semibold">Sign in to join this party</p>
      </FullPage>
    );
  }
  return <PartyRoom roomId={roomId} userId={userId} />;
}

function FullPage({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-3 overflow-hidden bg-background p-6 text-foreground">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The room                                                            */
/* ------------------------------------------------------------------ */

function PartyRoom({ roomId, userId }: { roomId: string; userId: string }) {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"loading" | "ready" | "error" | "ended">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [source, setSource] = useState<ParsedSource | null>(null);

  const [me, setMe] = useState<Person>({ id: userId, name: "You", avatar: null });
  const [people, setPeople] = useState<Person[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Person>>({});
  const [input, setInput] = useState("");

  const [playerReady, setPlayerReady] = useState(false);
  const [canSync, setCanSync] = useState(true);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const handleRef = useRef<PlayerHandle | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const startedRef = useRef(false);
  const stateRef = useRef({ playing: false, pos: 0, rate: 1, at: Date.now() });
  const playerBoxRef = useRef<HTMLDivElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);
  const profilesRef = useRef<Record<string, Person>>({});
  profilesRef.current = profiles;

  const isHost = room?.host_id === userId;

  /* ---------- helpers ---------- */

  const expected = useCallback(() => {
    const s = stateRef.current;
    return {
      playing: s.playing,
      rate: s.rate,
      pos: s.pos + (s.playing ? ((Date.now() - s.at) / 1000) * s.rate : 0),
    };
  }, []);

  const applyState = useCallback((st: Ctrl, force: boolean) => {
    const h = handleRef.current;
    if (!h || !h.canSync || !startedRef.current) return;
    if (Math.abs(h.getTime() - st.pos) > (force ? 0.4 : 1.5)) h.seek(st.pos);
    h.setRate(st.rate);
    if (st.playing) h.play();
    else h.pause();
  }, []);

  const loadProfiles = useCallback(async (ids: string[]) => {
    const missing = ids.filter((id) => !profilesRef.current[id]);
    if (!missing.length) return;
    const { data } = await db
      .from("public_profiles")
      .select("id,full_name,username,avatar_url")
      .in("id", missing);
    if (!data) return;
    setProfiles((prev) => {
      const next = { ...prev };
      for (const p of data as any[]) {
        next[p.id] = {
          id: p.id,
          name: p.username || p.full_name || "Student",
          avatar: p.avatar_url,
        };
      }
      return next;
    });
  }, []);

  const addMessage = useCallback(
    (m: ChatMsg) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      void loadProfiles([m.user_id]);
    },
    [loadProfiles],
  );

  /* ---------- load room, join, connect realtime ---------- */

  useEffect(() => {
    let alive = true;
    let channel: RealtimeChannel | null = null;
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    const fail = (msg: string) => {
      if (!alive) return;
      setErrorMsg(msg);
      setPhase("error");
    };

    (async () => {
      // 1) make sure I'm a member (never touch an existing role)
      const { data: existing } = await db
        .from("watch_room_members")
        .select("role,status")
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existing?.status === "banned") return fail("You can't join this party.");

      if (!existing) {
        const ins = await db.from("watch_room_members").insert({
          room_id: roomId,
          user_id: userId,
          role: "participant",
          status: "active",
        });
        if (ins.error) {
          const up = await db
            .from("watch_room_members")
            .update({ status: "active", left_at: null })
            .eq("room_id", roomId)
            .eq("user_id", userId)
            .select("role");
          if (up.error || !up.data?.length) {
            return fail("This party is private or no longer exists.");
          }
        }
      } else if (existing.status !== "active") {
        await db
          .from("watch_room_members")
          .update({ status: "active", left_at: null })
          .eq("room_id", roomId)
          .eq("user_id", userId);
      }

      // 2) room
      const { data: roomRow } = await db
        .from("watch_rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();
      if (!alive) return;
      if (!roomRow) return fail("This party doesn't exist.");

      setRoom(roomRow as Room);
      if (roomRow.status !== "live") {
        setPhase("ended");
        return;
      }

      const src = parseSource(
        roomRow.source_url ||
          (roomRow.current_video_id ? `https://youtu.be/${roomRow.current_video_id}` : ""),
      );
      if (!src) return fail("This party has no video link.");
      setSource(src);

      // 3) starting playback state from the database
      const rate = Number(roomRow.playback_rate) || 1;
      let pos = Number(roomRow.position_seconds) || 0;
      if (roomRow.is_playing && roomRow.playback_updated_at) {
        const elapsed = (Date.now() - Date.parse(roomRow.playback_updated_at)) / 1000;
        if (elapsed > 0 && elapsed < 6 * 3600) pos += elapsed * rate;
      }
      stateRef.current = { playing: !!roomRow.is_playing, pos, rate, at: Date.now() };

      // 4) profile + chat history
      const { data: mine } = await db
        .from("public_profiles")
        .select("id,full_name,username,avatar_url")
        .eq("id", userId)
        .maybeSingle();
      const meP: Person = {
        id: userId,
        name: mine?.username || mine?.full_name || "You",
        avatar: mine?.avatar_url ?? null,
      };
      if (alive) {
        setMe(meP);
        setProfiles((p) => ({ ...p, [userId]: meP }));
      }

      const { data: msgs } = await db
        .from("watch_room_messages")
        .select("id,user_id,body,created_at")
        .eq("room_id", roomId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100);
      const history = ((msgs ?? []) as ChatMsg[]).reverse();
      if (!alive) return;
      setMessages(history);
      void loadProfiles(Array.from(new Set(history.map((m) => m.user_id))));

      // 5) realtime: sync + presence + chat
      channel = supabase.channel(`party:${roomId}`, {
        config: { broadcast: { self: false }, presence: { key: userId } },
      });
      channelRef.current = channel;

      channel
        .on("broadcast", { event: "ctrl" }, ({ payload }) => {
          const c = payload as Ctrl;
          stateRef.current = {
            playing: !!c.playing,
            pos: Number(c.pos) || 0,
            rate: Number(c.rate) || 1,
            at: Date.now(),
          };
          applyState(expected(), false);
        })
        .on("broadcast", { event: "who" }, () => {
          const h = handleRef.current;
          if (!h || !h.canSync || !startedRef.current) return;
          void channel?.send({
            type: "broadcast",
            event: "ctrl",
            payload: { playing: h.isPlaying(), pos: h.getTime(), rate: stateRef.current.rate },
          });
        })
        .on("broadcast", { event: "ended" }, () => {
          if (alive) setPhase("ended");
        })
        .on("presence", { event: "sync" }, () => {
          const state = channel!.presenceState() as Record<string, any[]>;
          const list: Person[] = [];
          for (const key of Object.keys(state)) {
            const p = state[key]?.[0];
            if (p) list.push({ id: p.id, name: p.name, avatar: p.avatar ?? null });
          }
          if (alive) setPeople(list);
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "watch_room_messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => addMessage(payload.new as ChatMsg),
        )
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel!.track({ id: userId, name: meP.name, avatar: meP.avatar });
            void channel!.send({ type: "broadcast", event: "who", payload: {} });
          }
        });

      // 6) heartbeat so the lobby can count who is watching
      heartbeat = setInterval(() => {
        void db
          .from("watch_room_members")
          .update({ status: "active" })
          .eq("room_id", roomId)
          .eq("user_id", userId);
      }, 60000);

      if (alive) setPhase("ready");
    })();

    return () => {
      alive = false;
      if (heartbeat) clearInterval(heartbeat);
      if (channel) void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, userId, addMessage, applyState, expected, loadProfiles]);

  /* ---------- ticking UI + drift correction ---------- */

  useEffect(() => {
    const ui = setInterval(() => {
      const h = handleRef.current;
      if (!h || !h.canSync) return;
      setTime(h.getTime());
      setDuration(h.getDuration());
      setPlaying(h.isPlaying());
    }, 500);

    const drift = setInterval(() => {
      const h = handleRef.current;
      if (!h || !h.canSync || !startedRef.current) return;
      const e = expected();
      if (e.playing && Math.abs(h.getTime() - e.pos) > 2.5) h.seek(e.pos);
    }, 4000);

    return () => {
      clearInterval(ui);
      clearInterval(drift);
    };
  }, [expected]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const el = chatListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  /* ---------- player callbacks ---------- */

  const onPlayerReady = useCallback((h: PlayerHandle) => {
    handleRef.current = h;
    setCanSync(h.canSync);
    setPlayerReady(true);
    if (!h.canSync) {
      startedRef.current = true;
      setStarted(true);
    }
  }, []);

  const startWatching = () => {
    const h = handleRef.current;
    if (!h) return;
    startedRef.current = true;
    setStarted(true);
    h.setMuted(false);
    setMuted(false);
    applyState(expected(), true);
  };

  /* ---------- controls (everyone in the room can control) ---------- */

  const control = (patch: Partial<Ctrl>) => {
    const h = handleRef.current;
    if (!h || !h.canSync || !startedRef.current) return;
    const next: Ctrl = {
      playing: h.isPlaying(),
      pos: h.getTime(),
      rate: stateRef.current.rate,
      ...patch,
    };
    stateRef.current = { ...next, at: Date.now() };
    applyState(next, true);
    void channelRef.current?.send({ type: "broadcast", event: "ctrl", payload: next });
    void db.rpc("party_set_state", {
      _room_id: roomId,
      _is_playing: next.playing,
      _position: next.pos,
      _rate: next.rate,
    });
  };

  const togglePlay = () => {
    const h = handleRef.current;
    if (h) control({ playing: !h.isPlaying() });
  };

  const skip = (delta: number) => {
    const h = handleRef.current;
    if (!h) return;
    const max = h.getDuration() || Number.MAX_SAFE_INTEGER;
    control({ pos: Math.min(max, Math.max(0, h.getTime() + delta)) });
  };

  const commitScrub = () => {
    if (scrub === null) return;
    control({ pos: scrub });
    setScrub(null);
  };

  const toggleMute = () => {
    const h = handleRef.current;
    if (!h) return;
    const next = !muted;
    h.setMuted(next);
    setMuted(next);
  };

  const resync = () => {
    void channelRef.current?.send({ type: "broadcast", event: "who", payload: {} });
    applyState(expected(), true);
    toast("Re-syncing…");
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void playerBoxRef.current?.requestFullscreen?.();
  };

  /* ---------- chat ---------- */

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const body = input.trim();
    if (!body) return;
    setInput("");
    const h = handleRef.current;
    const { data, error } = await db
      .from("watch_room_messages")
      .insert({
        room_id: roomId,
        user_id: userId,
        body: body.slice(0, 1000),
        timestamp_seconds: h?.canSync ? Math.floor(h.getTime()) : null,
      })
      .select("id,user_id,body,created_at")
      .single();
    if (error) {
      setInput(body);
      toast.error("Message not sent. Try again.");
      return;
    }
    addMessage(data as ChatMsg);
  };

  /* ---------- menu actions ---------- */

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/watch/${roomId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy. Long-press the address bar to copy.");
    }
  };

  const leaveRoom = async () => {
    await db
      .from("watch_room_members")
      .update({ status: "removed", left_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("user_id", userId);
    void navigate({ to: "/watch" });
  };

  const endParty = async () => {
    const { error } = await db.rpc("end_watch_room", { _room_id: roomId });
    if (error) {
      toast.error("Couldn't end the party.");
      return;
    }
    void channelRef.current?.send({ type: "broadcast", event: "ended", payload: {} });
    void navigate({ to: "/watch" });
  };

  const goBack = () => void navigate({ to: "/watch" });

  const watching = Math.max(people.length, 1);
  const displayTime = scrub ?? time;
  const peopleList = useMemo(() => (people.length ? people : [me]), [people, me]);

  /* ---------- states ---------- */

  if (phase === "loading") {
    return (
      <FullPage>
        <Loader2 className="h-7 w-7 animate-spin text-white/50" />
        <p className="text-sm text-white/50">Joining party…</p>
      </FullPage>
    );
  }

  if (phase === "error") {
    return (
      <FullPage>
        <p className="text-lg font-semibold">Can't open this party</p>
        <p className="max-w-sm text-center text-sm text-white/55">{errorMsg}</p>
        <button
          type="button"
          onClick={goBack}
          className="mt-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold"
        >
          Back to parties
        </button>
      </FullPage>
    );
  }

  if (phase === "ended" || !room || !source) {
    return (
      <FullPage>
        <p className="text-lg font-semibold">This party has ended</p>
        <button
          type="button"
          onClick={goBack}
          className="mt-2 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-6 py-3 text-sm font-bold"
        >
          Back to parties
        </button>
      </FullPage>
    );
  }

  const iconBtn =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10";

  return (
    <main className="jph-room-ui relative min-h-screen overflow-x-hidden bg-[#07070a] text-white selection:bg-fuchsia-400/30">
      <style>{`
        .jph-room-ui {
          --room-bg: #f4f5ff;
          --room-panel: rgba(255,255,255,.96);
          --room-text: #191b35;
          --room-muted: rgba(38,43,82,.62);
          --room-border: rgba(54,59,112,.14);
          min-height: 100vh;
          min-height: 100dvh;
          color-scheme: light;
          color: var(--room-text) !important;
          background: var(--room-bg) !important;
        }
        .dark .jph-room-ui {
          --room-bg: #070b18;
          --room-panel: rgba(18,24,40,.98);
          --room-text: #f5f6ff;
          --room-muted: rgba(238,240,255,.58);
          --room-border: rgba(255,255,255,.09);
          color-scheme: dark;
          color: var(--room-text) !important;
          background: var(--room-bg) !important;
        }
        :root:not(.dark) .jph-room-header {
          color: var(--room-text) !important;
          border-color: var(--room-border) !important;
          background: rgba(255,255,255,.88) !important;
          box-shadow: 0 9px 30px rgba(44,48,112,.09) !important;
        }
        :root:not(.dark) .jph-room-header [class*="text-white/"] { color: var(--room-muted) !important; }
        :root:not(.dark) .jph-room-header [class*="border-white/"] { border-color: var(--room-border) !important; }
        :root:not(.dark) .jph-room-header [class*="bg-white/"] { background: rgba(73,78,138,.055) !important; }
        :root:not(.dark) .jph-room-meta,
        :root:not(.dark) .jph-room-controls,
        :root:not(.dark) .jph-room-watching,
        :root:not(.dark) .jph-room-people,
        :root:not(.dark) .jph-room-chat {
          color: var(--room-text) !important;
          border-color: var(--room-border) !important;
          background-color: rgba(255,255,255,.86) !important;
          box-shadow: 0 12px 34px rgba(44,48,112,.08) !important;
        }
        :root:not(.dark) .jph-room-meta,
        :root:not(.dark) .jph-room-people {
          background: transparent !important;
          box-shadow: none !important;
        }
        :root:not(.dark) .jph-room-meta > div,
        :root:not(.dark) .jph-room-people > span {
          border-color: var(--room-border) !important;
          background-color: rgba(255,255,255,.88) !important;
        }
        :root:not(.dark) .jph-room-meta [class*="text-white/"],
        :root:not(.dark) .jph-room-controls [class*="text-white/"],
        :root:not(.dark) .jph-room-watching [class*="text-white/"],
        :root:not(.dark) .jph-room-people [class*="text-white/"],
        :root:not(.dark) .jph-room-chat [class*="text-white/"] { color: var(--room-muted) !important; }
        :root:not(.dark) .jph-room-meta [class*="border-white/"],
        :root:not(.dark) .jph-room-controls [class*="border-white/"],
        :root:not(.dark) .jph-room-watching [class*="border-white/"],
        :root:not(.dark) .jph-room-people [class*="border-white/"],
        :root:not(.dark) .jph-room-chat [class*="border-white/"] { border-color: var(--room-border) !important; }
        :root:not(.dark) .jph-room-meta [class*="bg-white/"],
        :root:not(.dark) .jph-room-controls [class*="bg-white/"],
        :root:not(.dark) .jph-room-watching [class*="bg-white/"],
        :root:not(.dark) .jph-room-people [class*="bg-white/"],
        :root:not(.dark) .jph-room-chat [class*="bg-white/"] { background-color: rgba(60,67,128,.055) !important; }
        :root:not(.dark) .jph-room-chat form { border-color: var(--room-border) !important; background: rgba(243,245,255,.92) !important; }
        :root:not(.dark) .jph-room-chat input,
        :root:not(.dark) .jph-invite-sheet input {
          color: var(--room-text) !important;
          border-color: var(--room-border) !important;
          background: #f5f6ff !important;
        }
        :root:not(.dark) .jph-room-chat input::placeholder,
        :root:not(.dark) .jph-invite-sheet input::placeholder { color: rgba(42,48,91,.45) !important; }
        :root:not(.dark) .jph-room-chat input:focus,
        :root:not(.dark) .jph-invite-sheet input:focus { background: white !important; }
        :root:not(.dark) .jph-invite-sheet {
          color: var(--room-text) !important;
          border-color: var(--room-border) !important;
          background: rgba(255,255,255,.98) !important;
          box-shadow: 0 25px 80px rgba(30,34,82,.2) !important;
        }
        :root:not(.dark) .jph-invite-sheet [class*="text-white/"] { color: var(--room-muted) !important; }
        :root:not(.dark) .jph-invite-sheet [class*="border-white/"] { border-color: var(--room-border) !important; }
        :root:not(.dark) .jph-invite-sheet [class*="bg-white/"] { background-color: rgba(60,67,128,.055) !important; }
        :root:not(.dark) .jph-invite-sheet[class*="bg-[#121217]"] { background: rgba(255,255,255,.98) !important; }
        .jph-room-menu {
          border: 1px solid var(--room-border);
          background: var(--room-panel);
          color: var(--room-text);
          box-shadow: 0 18px 48px rgba(26,31,73,.18);
        }
        .jph-room-menu-item {
          display: flex;
          width: 100%;
          align-items: center;
          gap: .75rem;
          border-radius: .85rem;
          padding: .7rem .8rem;
          color: var(--room-text);
          text-align: left;
          font-size: .875rem;
          font-weight: 600;
          transition: background-color .15s ease, color .15s ease;
        }
        .jph-room-menu-item:hover { background: color-mix(in srgb, var(--room-text) 8%, transparent); }
        .jph-room-menu-item-danger { color: #dc2626; }
        .dark .jph-room-menu { box-shadow: 0 22px 60px rgba(0,0,0,.48); }
        .dark .jph-room-menu-item-danger { color: #fda4af; }
        @media (max-width: 1023px) {
          .jph-room-layout {
            display: flex;
            flex-direction: column;
            gap: .65rem;
          }
          /* Promote the player, controls, chat and people strip into one mobile flow.
             This puts chat immediately after the video instead of below the people list. */
          .jph-room-player-column { display: contents; }
          .jph-room-player { order: 1; }
          .jph-room-controls { order: 2; }
          .jph-room-chat {
            order: 3;
            width: 100%;
            position: sticky;
            top: .5rem;
            z-index: 20;
            height: min(54dvh, 500px);
            min-height: 300px;
            background: var(--room-panel) !important;
          }
          .jph-room-chat > div:first-child {
            height: auto;
            min-height: 0;
            flex: 1 1 auto;
          }
          .jph-room-chat form {
            position: sticky;
            bottom: 0;
            z-index: 2;
            flex-shrink: 0;
          }
          .jph-room-meta { padding-top: .5rem; }
          .jph-room-watching { order: 4; }
          .jph-room-people { order: 5; }
        }
        @media (max-width: 639px) {
          .jph-room-layout { padding: .5rem; }
          .jph-room-header { padding-top: max(.5rem, env(safe-area-inset-top)); }
          .jph-room-player { border-radius: 1.15rem; padding: .25rem; }
          .jph-room-controls {
            overflow-x: auto;
            overscroll-behavior-x: contain;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .jph-room-controls::-webkit-scrollbar { display: none; }
          .jph-room-chat {
            height: min(54dvh, 460px);
            min-height: 300px;
            border-radius: 1.15rem;
          }
          .jph-room-actions {
            width: min(39vw, 176px);
            max-width: min(39vw, 176px);
            flex: 0 1 min(39vw, 176px);
            overflow-x: auto;
            overscroll-behavior-x: contain;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          .jph-room-actions::-webkit-scrollbar { display: none; }
          .jph-room-actions > button { height: 2.4rem; width: 2.4rem; }
        }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-14%] top-[-10%] h-[32rem] w-[32rem] rounded-full bg-fuchsia-600/[0.09] blur-[125px]" />
        <div className="absolute right-[-16%] top-[16%] h-[30rem] w-[30rem] rounded-full bg-violet-600/[0.08] blur-[125px]" />
        <div className="absolute bottom-[-18%] left-[28%] h-[28rem] w-[28rem] rounded-full bg-indigo-500/[0.06] blur-[125px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.045),transparent_35%)]" />
        <div className="absolute inset-0 opacity-[0.018] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>
      {/* Top bar */}
      <header className="jph-room-header sticky top-0 z-50 flex items-center gap-1.5 border-b border-white/[0.07] bg-[#08080c]/80 px-3 py-2.5 shadow-[0_12px_45px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:px-4">
        <button type="button" onClick={goBack} aria-label="Back" className={iconBtn}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-600 shadow-[0_10px_35px_rgba(139,92,246,0.30)]">
          <Tv className="h-5 w-5" />
        </div>
        <div className="mx-1 min-w-0 flex-1 rounded-2xl border border-transparent px-2 py-1 transition hover:border-white/[0.05] hover:bg-white/[0.025]">
          <p className="min-w-0 truncate text-[15px] font-bold tracking-[-0.01em]">{room.title}</p>
          <p className="mt-0.5 truncate text-[10px] font-semibold tracking-[0.09em] text-white/42 uppercase">
            {watching} watching · {SOURCE_LABEL[source.type]}
          </p>
        </div>
        <div className="jph-room-actions flex min-w-0 shrink-0 items-center gap-1.5">
          <button type="button" onClick={copyLink} aria-label="Copy link" className={iconBtn}>
            <Link2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            aria-label="Invite"
            className={iconBtn}
          >
            <UserPlus className="h-5 w-5" />
          </button>
          <button type="button" onClick={resync} aria-label="Re-sync" className={iconBtn}>
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Fullscreen"
            className={iconBtn}
          >
            {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() =>
              chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            aria-label="Chat"
            className={`${iconBtn} lg:hidden`}
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More"
            className={iconBtn}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="jph-room-menu absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-[1rem] p-1.5 backdrop-blur-2xl">
              {isHost ? (
                <button
                  type="button"
                  onClick={() => void endParty()}
                  className="jph-room-menu-item jph-room-menu-item-danger"
                >
                  <Power className="h-4 w-4" /> End party
                </button>
              ) : null}
              <button type="button" onClick={() => void leaveRoom()} className="jph-room-menu-item">
                <LogOut className="h-4 w-4" /> Leave party
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="jph-room-meta mx-auto flex max-w-[1480px] items-center justify-between gap-3 px-3 pt-3 sm:px-5 lg:pt-5">
        <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-[10px] font-bold tracking-[0.12em] text-white/45 uppercase backdrop-blur-xl">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live room
          <span className="text-white/20">•</span>
          {SOURCE_LABEL[source.type]}
        </div>
        <div className="hidden rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-[10px] font-semibold tracking-[0.1em] text-white/35 backdrop-blur-xl sm:block">
          {isHost ? "HOST CONTROLS" : "WATCHING TOGETHER"}
        </div>
      </div>

      <div className="jph-room-layout relative mx-auto grid max-w-[1480px] gap-3 p-2.5 sm:p-4 lg:grid-cols-[minmax(0,1fr)_410px] lg:gap-5 lg:p-5">
        {/* Player column */}
        <div className="jph-room-player-column min-w-0">
          <div
            ref={playerBoxRef}
            className="jph-room-player group/player relative overflow-hidden rounded-[1.65rem] border border-white/[0.09] bg-white/[0.025] p-1.5 shadow-[0_25px_100px_rgba(0,0,0,0.40)] ring-1 ring-black/20 sm:p-2 lg:rounded-[1.9rem]"
          >
            <PartyPlayer
              source={source}
              onReady={onPlayerReady}
              onTap={togglePlay}
              onEnded={() => control({ playing: false })}
              onError={(m) => setPlayerError(m)}
            >
              {/* Loading */}
              {!playerReady && !playerError && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
                  <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                </div>
              )}

              {/* Player error */}
              {playerError && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-black/90 p-6 text-center">
                  <p className="font-semibold">Can't play this video</p>
                  <p className="text-sm text-white/60">{playerError}</p>
                </div>
              )}

              {/* Tap to start (browsers block autoplay until a tap) */}
              {playerReady && canSync && !started && !playerError && (
                <button
                  type="button"
                  onClick={startWatching}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/75"
                >
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-500">
                    <Play className="h-9 w-9 fill-white" />
                  </span>
                  <span className="text-base font-semibold">Tap to start watching</span>
                </button>
              )}

              {/* Paused indicator */}
              {started && canSync && !playing && !playerError && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/55">
                    <Play className="h-9 w-9 fill-white" />
                  </span>
                </div>
              )}
            </PartyPlayer>
          </div>

          {/* Controls */}
          {canSync ? (
            <div className="jph-room-controls mt-2 flex items-center gap-1.5 rounded-[1.35rem] border border-white/[0.08] bg-white/[0.045] px-2.5 py-2.5 shadow-[0_15px_50px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:gap-3 sm:px-3.5">
              <button
                type="button"
                onClick={() => skip(-10)}
                aria-label="Back 10 seconds"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center text-white/80"
              >
                <RotateCcw className="h-7 w-7" />
                <span className="absolute text-[9px] font-bold">10</span>
              </button>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-fuchsia-300 via-fuchsia-400 to-violet-500 text-white shadow-[0_12px_38px_rgba(217,70,239,0.30)] transition-transform active:scale-90"
              >
                {playing ? (
                  <Pause className="h-6 w-6 fill-black" />
                ) : (
                  <Play className="h-6 w-6 fill-black" />
                )}
              </button>
              <button
                type="button"
                onClick={() => skip(10)}
                aria-label="Forward 10 seconds"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center text-white/80"
              >
                <RotateCw className="h-7 w-7" />
                <span className="absolute text-[9px] font-bold">10</span>
              </button>

              <span className="w-11 shrink-0 text-right text-xs tabular-nums text-white/70">
                {fmtTime(displayTime)}
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(duration, 1)}
                step={1}
                value={Math.min(displayTime, Math.max(duration, 1))}
                onChange={(e) => setScrub(Number(e.target.value))}
                onPointerUp={commitScrub}
                onTouchEnd={commitScrub}
                onKeyUp={commitScrub}
                aria-label="Seek"
                className="h-1.5 min-w-0 flex-1 cursor-pointer accent-fuchsia-400"
              />
              <span className="w-11 shrink-0 text-xs tabular-nums text-white/70">
                {fmtTime(duration)}
              </span>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.035] text-white/75 transition hover:bg-white/[0.08] active:scale-95"
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          ) : (
            <p className="mt-2 rounded-2xl border border-amber-300/10 bg-amber-300/[0.035] px-4 py-3 text-xs leading-relaxed text-white/52 backdrop-blur-xl">
              {SOURCE_LABEL[source.type]} plays inside the page, so play and pause can't be synced.
              Chat and the watching list still work for everyone.
            </p>
          )}

          {/* Watching now */}
          <div className="jph-room-watching mt-2 flex items-center justify-between rounded-[1.25rem] border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-[10px] font-bold tracking-[0.15em] text-white/45 backdrop-blur-xl sm:px-4">
            <Users className="h-4 w-4" />
            WATCHING NOW · {watching}
          </div>
          <div className="jph-room-people flex gap-2 overflow-x-auto px-1 py-3 [scrollbar-width:none] sm:px-0">
            {peopleList.map((p) => (
              <span
                key={p.id}
                className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.045] py-1.5 pl-1.5 pr-3.5 text-sm text-white/88 shadow-[0_8px_25px_rgba(0,0,0,0.12)] backdrop-blur-xl transition hover:border-white/[0.14] hover:bg-white/[0.065]"
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.08] text-xs font-semibold shadow-inner">
                  {p.avatar ? (
                    <img src={p.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    p.name.slice(0, 1).toUpperCase()
                  )}
                </span>
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Chat column */}
        <div
          ref={chatSectionRef}
          className="jph-room-chat relative flex min-h-0 flex-col overflow-hidden rounded-[1.55rem] border border-white/[0.09] bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.30)] backdrop-blur-2xl lg:sticky lg:top-[88px] lg:h-[calc(100vh-108px)]"
        >
          <div
            ref={chatListRef}
            className="flex h-[42vh] min-h-[250px] flex-col gap-3.5 overflow-y-auto px-3.5 py-4 [scrollbar-width:thin] lg:h-auto lg:flex-1 lg:px-4"
          >
            {messages.length === 0 && (
              <p className="m-auto text-sm text-white/40">No messages yet. Say hi 👋</p>
            )}
            {messages.map((m) => {
              const mine = m.user_id === userId;
              const who = profiles[m.user_id]?.name ?? "Student";
              return (
                <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <span className="mb-1 px-1 text-xs text-white/50">{mine ? me.name : who}</span>
                  <p
                    className={`max-w-[85%] break-words rounded-3xl px-4 py-2.5 text-[15px] leading-snug ${
                      mine
                        ? "border border-fuchsia-200/20 bg-gradient-to-br from-fuchsia-300 to-violet-400 text-white shadow-[0_8px_25px_rgba(217,70,239,0.14)]"
                        : "border border-white/[0.06] bg-white/[0.055] text-white/90 backdrop-blur-xl"
                    }`}
                  >
                    <LinkifiedText text={m.body} />
                  </p>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 border-t border-white/[0.08] bg-black/10 p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:p-3 sm:pb-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder="Type a message…"
              className="min-w-0 flex-1 rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3.5 text-base outline-none transition placeholder:text-white/30 focus:border-fuchsia-400/50 focus:bg-white/[0.055] focus:ring-2 focus:ring-fuchsia-400/10 focus:shadow-[0_0_0_1px_rgba(232,121,249,0.08),0_8px_30px_rgba(0,0,0,0.12)]"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-fuchsia-300 via-fuchsia-400 to-violet-500 text-white shadow-[0_8px_28px_rgba(217,70,239,0.22)] transition hover:brightness-110 active:scale-95 disabled:opacity-35"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {inviteOpen && (
        <InviteSheet
          roomId={roomId}
          canAdd={isHost}
          shareLink={shareLink}
          onCopy={copyLink}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Invite sheet                                                        */
/* ------------------------------------------------------------------ */

function InviteSheet({
  roomId,
  canAdd,
  shareLink,
  onCopy,
  onClose,
}: {
  roomId: string;
  canAdd: boolean;
  shareLink: string;
  onCopy: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [added, setAdded] = useState<string[]>([]);

  useEffect(() => {
    const q = query
      .trim()
      .replace(/[%,()]/g, "")
      .replace(/^@/, "");
    if (!canAdd || q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await db
        .from("public_profiles")
        .select("id,full_name,username,avatar_url")
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(6);
      setResults(
        (data ?? []).map((p: any) => ({
          id: p.id,
          name: p.username || p.full_name || "Student",
          avatar: p.avatar_url,
        })),
      );
    }, 250);
    return () => clearTimeout(t);
  }, [query, canAdd]);

  const add = async (p: Person) => {
    const { error } = await db.from("watch_room_members").insert({
      room_id: roomId,
      user_id: p.id,
      role: "participant",
      status: "active",
    });
    if (error && error.code !== "23505") {
      toast.error("Couldn't add that person.");
      return;
    }
    setAdded((prev) => [...prev, p.id]);
    toast.success(`${p.name} added`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/72 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div className="jph-invite-sheet max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-white/[0.10] bg-[#121217]/94 p-5 text-white shadow-[0_-20px_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:rounded-[2rem] sm:shadow-[0_25px_100px_rgba(0,0,0,0.55)]">
        <div
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden"
          aria-hidden="true"
        />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Invite friends</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-white/60 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="break-all rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm text-white/62">
          {shareLink}
        </p>
        <button
          type="button"
          onClick={onCopy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 py-3.5 font-bold shadow-[0_10px_35px_rgba(139,92,246,0.24)] transition hover:brightness-110 active:scale-[0.99]"
        >
          <Link2 className="h-5 w-5" /> Copy link
        </button>

        {canAdd && (
          <>
            <p className="mb-2 mt-6 text-xs font-medium tracking-widest text-white/50">
              ADD BY NAME OR @USERNAME
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] py-3.5 pl-12 pr-5 text-base outline-none transition placeholder:text-white/30 focus:border-fuchsia-400/45 focus:bg-white/[0.055]"
              />
            </div>
            <ul className="mt-2">
              {results.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-2xl px-2 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm font-semibold">
                      {r.avatar ? (
                        <img src={r.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        r.name.slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span className="truncate text-sm">{r.name}</span>
                  </span>
                  <button
                    type="button"
                    disabled={added.includes(r.id)}
                    onClick={() => void add(r)}
                    className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold disabled:opacity-40"
                  >
                    {added.includes(r.id) ? "Added" : "Add"}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
