// src/routes/_authenticated/watch.index.tsx
// Screenshot-matched mobile Watch Party lobby; existing room RPC and creation flow are preserved.

import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileText,
  Gamepad2,
  Home,
  MapPin,
  Music2,
  PlaySquare,
  Plus,
  Users,
  UsersRound,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { StartPartySheet } from "@/features/party/StartPartySheet";
import { CATEGORIES, categoryOf } from "@/features/party/partyLib";

export const Route = createFileRoute("/_authenticated/watch/")({
  head: () => ({ meta: [
      { property: "og:title", content: "Watch Party Lobby — JEE Prep Hub" },
      { property: "og:description", content: "Discover shared lecture sessions and create a watch party with fellow students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Watch Party Lobby — JEE Prep Hub" },
      { name: "twitter:description", content: "Discover shared lecture sessions and create a watch party with fellow students." },
{ title: "Watch Party Lobby — JEE Prep Hub" }, { name: "description", content: "Discover shared lecture sessions and create a watch party with fellow students." }] }),

  component: WatchLobby,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;

type LobbyRoom = {
  id: string;
  host_id: string;
  host_name: string | null;
  host_avatar: string | null;
  title: string;
  category: string;
  source_type: string;
  thumbnail_url: string | null;
  watching: number;
  created_at: string;
};

type LobbyTab = "live" | "upcoming" | "mine";

function WatchLobby() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [myRooms, setMyRooms] = useState<LobbyRoom[]>([]);
  const [roomAvatars, setRoomAvatars] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [myRoomsLoading, setMyRoomsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<LobbyTab>("live");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: directRooms, error: roomsError } = await db
      .from("watch_rooms")
      .select("id,host_id,title,category,source_type,thumbnail_url,created_at")
      .eq("status", "live")
      .eq("visibility", "public")
      .order("created_at", { ascending: false });

    if (!roomsError) {
      // The RPC is useful for watcher counts, but the room table is the source
      // of truth for discoverability. This prevents a stale/partial RPC from
      // hiding otherwise valid public live rooms.
      const { data: lobbyData } = await db.rpc("get_watch_party_lobby");
      const watchingByRoom = new Map<string, number>(
        ((lobbyData ?? []) as LobbyRoom[]).map((room) => [room.id, Number(room.watching ?? 0)]),
      );
      setRooms(
        ((directRooms ?? []) as Omit<LobbyRoom, "host_name" | "host_avatar" | "watching">[]).map(
          (room) => ({
            ...room,
            host_name: null,
            host_avatar: null,
            watching: watchingByRoom.get(room.id) ?? 0,
          }),
        ),
      );
      setError(null);
    } else {
      // Keep the lobby usable if the direct table query is temporarily blocked
      // by an older deployed RLS policy; the RPC remains the safe fallback.
      const { data: fallbackRooms, error: rpcError } = await db.rpc("get_watch_party_lobby");
      if (rpcError) setError(`Live rooms could not be loaded: ${roomsError.message}`);
      else {
        setRooms((fallbackRooms ?? []) as LobbyRoom[]);
        setError(null);
      }
    }
    setLoading(false);
  }, []);

  const loadMyRooms = useCallback(async () => {
    setMyRoomsLoading(true);
    const { data: auth, error: authError } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;
    if (!userId) {
      setMyRooms([]);
      if (authError) setError(`Your rooms could not be loaded: ${authError.message}`);
      setMyRoomsLoading(false);
      return;
    }
    const { data, error: roomsError } = await db
      .from("watch_rooms")
      .select("id,host_id,title,category,source_type,thumbnail_url,created_at")
      .eq("host_id", userId)
      .eq("status", "live")
      .order("created_at", { ascending: false });

    if (!roomsError) {
      setMyRooms(
        ((data ?? []) as Omit<LobbyRoom, "host_name" | "host_avatar" | "watching">[]).map(
          (room) => ({
            ...room,
            host_name: "You",
            host_avatar: null,
            watching: 0,
          }),
        ),
      );
    } else {
      // If a deployed RLS policy blocks the host-filtered select, use the
      // public lobby result and still apply the authenticated host_id filter.
      const { data: fallbackRooms, error: rpcError } = await db.rpc("get_watch_party_lobby");
      const fallbackMine = ((fallbackRooms ?? []) as LobbyRoom[]).filter(
        (room) => room.host_id === userId,
      );
      setMyRooms(fallbackMine);
      if (rpcError || fallbackMine.length === 0)
        setError(`Your rooms could not be loaded: ${roomsError.message}`);
    }
    setMyRoomsLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    void loadMyRooms();
  }, [loadMyRooms]);

  useEffect(() => {
    let alive = true;
    const roomIds = rooms.map((room) => room.id);
    if (!roomIds.length) {
      setRoomAvatars({});
      return;
    }
    void (async () => {
      const { data: members } = await db
        .from("watch_room_members")
        .select("room_id,user_id")
        .in("room_id", roomIds)
        .eq("status", "active")
        .limit(160);
      const memberRows = (members ?? []) as { room_id: string; user_id: string }[];
      const userIds = Array.from(new Set(memberRows.map((member) => member.user_id)));
      if (!userIds.length) return;
      const { data: profiles } = await db
        .from("public_profiles")
        .select("id,avatar_url")
        .in("id", userIds);
      if (!alive || !profiles) return;
      const avatarByUser = new Map<string, string>();
      for (const profile of profiles as { id: string; avatar_url: string | null }[]) {
        if (profile.avatar_url) avatarByUser.set(profile.id, profile.avatar_url);
      }
      const next: Record<string, string[]> = {};
      for (const room of rooms) {
        const avatars = memberRows
          .filter((member) => member.room_id === room.id)
          .map((member) => avatarByUser.get(member.user_id))
          .filter((avatar): avatar is string => Boolean(avatar));
        if (room.host_avatar) avatars.unshift(room.host_avatar);
        next[room.id] = Array.from(new Set(avatars)).slice(0, 4);
      }
      setRoomAvatars(next);
    })();
    return () => {
      alive = false;
    };
  }, [rooms]);

  const visibleRooms = useMemo(() => {
    const source = tab === "mine" ? myRooms : rooms;
    return source.filter((room) => {
      const category = categoryOf(room.category);
      return !activeCategory || category.id === activeCategory;
    });
  }, [rooms, myRooms, tab, activeCategory]);

  const openRoom = (roomId: string) => void navigate({ to: "/watch/$roomId", params: { roomId } });
  const isTabLoading = loading || (tab === "mine" && myRoomsLoading);
  const isEmptyUpcoming = tab === "upcoming";

  const shortcuts = [
    {
      title: "Live Lectures",
      detail: "Join ongoing",
      icon: Camera,
      category: "study",
      tone: "violet",
    },
    {
      title: "Music Room",
      detail: "Study with music",
      icon: Music2,
      category: "music",
      tone: "blue",
    },
    {
      title: "Fun Rooms",
      detail: "Quiz · Games",
      icon: Gamepad2,
      category: "gaming",
      tone: "pink",
    },
    {
      title: "Create Room",
      detail: "Start your own",
      icon: Camera,
      action: "create",
      tone: "cyan",
    },
  ];

  const tabs: { id: LobbyTab; label: string }[] = [
    { id: "live", label: "Live Now" },
    { id: "upcoming", label: "Upcoming" },
    { id: "mine", label: "My Rooms" },
  ];

  return (
    <main className="jph-watch-lobby">
      <style>{`
        .jph-watch-lobby {
          --watch-bg: #f1f3fc;
          --watch-panel: #ffffff;
          --watch-card: #ffffff;
          --watch-line: rgba(52,59,111,.13);
          --watch-text: #181c36;
          --watch-muted: #737a98;
          --watch-soft: rgba(103,58,232,.10);
          --watch-purple: #6435e7;
          min-height: 100vh;
          padding-bottom: calc(82px + env(safe-area-inset-bottom));
          overflow-x: hidden;
          color: var(--watch-text);
          background: var(--watch-bg);
        }
        .dark .jph-watch-lobby {
          --watch-bg: #030b15;
          --watch-panel: #081421;
          --watch-card: #0a1725;
          --watch-line: rgba(142,162,193,.15);
          --watch-text: #f6f7ff;
          --watch-muted: #9ba8c0;
          --watch-soft: rgba(111,68,236,.18);
          --watch-purple: #8b5cff;
          background: radial-gradient(ellipse at 50% -20%,rgba(43,48,117,.22),transparent 38rem),var(--watch-bg);
        }
        .jph-watch-lobby,.jph-watch-lobby *,.jph-watch-lobby *::before,.jph-watch-lobby *::after { box-sizing:border-box; }
        .jph-watch-shell { width:min(720px,100%); margin:0 auto; padding:12px 14px 16px; }
        .jph-watch-hero { position:relative; isolation:isolate; overflow:hidden; height:clamp(140px,34vw,185px); min-height:140px; border:1px solid rgba(115,90,246,.48); border-radius:15px; color:white; background:#2513a9; box-shadow:0 8px 26px rgba(65,45,179,.18); }
        .jph-watch-hero-art { position:absolute; inset:0; z-index:-2; width:100%; height:100%; object-fit:cover; object-position:center 39%; }
        .jph-watch-hero::before { content:""; position:absolute; z-index:-1; inset:0; background:linear-gradient(90deg,rgba(42,12,151,.96) 0%,rgba(44,18,174,.91) 36%,rgba(49,23,179,.56) 61%,rgba(27,14,111,.04) 100%),linear-gradient(0deg,rgba(44,21,157,.18),transparent 70%); }
        .jph-watch-hero-copy { position:relative; width:min(72%,370px); padding:23px 18px; }
        .jph-watch-hero-heading { display:flex; align-items:center; gap:8px; margin:0; color:#fff; font-size:clamp(24px,5.4vw,33px); line-height:1; font-weight:900; letter-spacing:-.055em; text-shadow:0 2px 10px rgba(16,8,82,.25); }
        .jph-watch-hero-heading svg { width:21px; height:21px; flex:none; color:#e7bdff; }
        .jph-watch-beta { margin-left:2px; padding:5px 8px; border-radius:999px; color:#fff; background:rgba(14,11,83,.45); font-size:10px; font-weight:750; letter-spacing:0; }
        .jph-watch-hero-copy p { max-width:255px; margin:12px 0 0; color:rgba(255,255,255,.9); font-size:14px; line-height:1.55; letter-spacing:.005em; text-shadow:0 2px 10px rgba(10,8,63,.3); }
        .jph-watch-shortcuts { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; margin-top:11px; }
        .jph-watch-shortcut { display:flex; align-items:center; gap:10px; min-width:0; min-height:68px; padding:8px 10px; border:1px solid var(--watch-line); border-radius:14px; color:var(--watch-text); text-align:left; background:var(--watch-panel); box-shadow:0 4px 12px rgba(30,38,73,.045); cursor:pointer; transition:transform .16s,border-color .16s,filter .16s; }
        .dark .jph-watch-shortcut { background:linear-gradient(145deg,#0d1929,#091522); box-shadow:0 8px 18px rgba(0,0,0,.14); }
        .jph-watch-shortcut:hover { transform:translateY(-1px); border-color:rgba(125,87,249,.45); }
        .jph-watch-shortcut-icon { width:50px; height:50px; display:grid; flex:none; place-items:center; border:1px solid rgba(255,255,255,.2); border-radius:15px; color:#fff; background:linear-gradient(145deg,#7b38e9,#5116b9); box-shadow:0 5px 13px rgba(80,38,183,.22); }
        .jph-watch-shortcut-icon.blue { color:#e8ffff; background:linear-gradient(145deg,#16c7d4,#107bbb); }
        .jph-watch-shortcut-icon.pink { background:linear-gradient(145deg,#fb477f,#b81daf); }
        .jph-watch-shortcut-icon.cyan { color:#ecffff; background:linear-gradient(145deg,#14d4de,#0797b5); }
        .jph-watch-shortcut-icon svg { width:23px; height:23px; stroke-width:2.2; }
        .jph-watch-shortcut-copy { min-width:0; }
        .jph-watch-shortcut-copy strong { display:block; overflow:hidden; color:var(--watch-text); text-overflow:ellipsis; white-space:nowrap; font-size:14px; line-height:1.3; font-weight:850; letter-spacing:-.025em; }
        .jph-watch-shortcut-copy small { display:block; margin-top:4px; overflow:hidden; color:var(--watch-muted); text-overflow:ellipsis; white-space:nowrap; font-size:10px; line-height:1.2; }
        .jph-watch-tabbar { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:15px; border-bottom:1px solid var(--watch-line); }
        .jph-watch-tab { position:relative; min-height:52px; border:0; border-radius:14px 14px 0 0; color:var(--watch-muted); background:transparent; font-size:13px; font-weight:700; cursor:pointer; transition:color .16s,background .16s; }
        .jph-watch-tab.active { color:#fff; background:linear-gradient(180deg,rgba(81,50,213,.48),rgba(81,50,213,.21)); }
        .jph-watch-tab.active::after { content:""; position:absolute; inset:auto 0 -1px; height:4px; border-radius:4px 4px 0 0; background:linear-gradient(90deg,#8a39ff,#bd44ff); box-shadow:0 0 10px rgba(163,63,255,.42); }
        .jph-watch-tab-count { display:none; }
        .jph-watch-toolbar { display:flex; gap:8px; margin:10px 0 0; }
        .jph-watch-search { position:relative; flex:1; min-width:0; }
        .jph-watch-search > svg { position:absolute; left:11px; top:50%; width:15px; height:15px; transform:translateY(-50%); color:var(--watch-muted); pointer-events:none; }
        .jph-watch-search input { width:100%; height:38px; padding:0 34px; border:1px solid var(--watch-line); border-radius:12px; outline:none; color:var(--watch-text); background:var(--watch-panel); font-size:12px; }
        .jph-watch-search input::placeholder { color:var(--watch-muted); }
        .jph-watch-search input:focus { border-color:var(--watch-purple); box-shadow:0 0 0 3px var(--watch-soft); }
        .jph-watch-search-clear,.jph-watch-refresh { width:38px; height:38px; display:grid; flex:none; place-items:center; border:1px solid var(--watch-line); border-radius:12px; color:var(--watch-muted); background:var(--watch-panel); cursor:pointer; }
        .jph-watch-refresh.loading svg { animation:jph-watch-spin .7s linear infinite; }
        @keyframes jph-watch-spin { to { transform:rotate(360deg); } }
        .jph-watch-filter-row { display:flex; gap:7px; margin-top:8px; overflow:auto; scrollbar-width:none; }
        .jph-watch-filter-row::-webkit-scrollbar { display:none; }
        .jph-watch-filter { min-height:29px; padding:0 10px; flex:none; border:1px solid var(--watch-line); border-radius:999px; color:var(--watch-muted); background:var(--watch-panel); font-size:10px; font-weight:750; cursor:pointer; }
        .jph-watch-filter.active { border-color:transparent; color:white; background:linear-gradient(110deg,#6c4bee,#9250df); }
        .jph-watch-section { margin-top:13px; }
        .jph-watch-section-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin:0 1px 9px; }
        .jph-watch-section-head h2 { margin:0; font-size:15px; font-weight:850; letter-spacing:-.025em; }
        .jph-watch-section-head p { margin:3px 0 0; color:var(--watch-muted); font-size:10px; }
        .jph-watch-see-all { display:inline-flex; align-items:center; gap:3px; border:0; color:var(--watch-purple); background:none; font-size:10px; font-weight:800; cursor:pointer; }
        .jph-watch-row { display:grid; grid-template-columns:minmax(0,1fr); gap:10px; }
        .jph-watch-card { position:relative; isolation:isolate; display:flex; width:100%; min-height:174px; align-items:stretch; overflow:hidden; padding:0; border:1px solid var(--watch-line); border-radius:18px; color:white; text-align:left; background:#091624; box-shadow:0 8px 21px rgba(9,16,36,.13); cursor:pointer; }
        .jph-watch-thumb { position:absolute; z-index:-2; inset:0; overflow:hidden; background:radial-gradient(circle at 25% 20%,rgba(100,69,239,.37),transparent 45%),linear-gradient(135deg,#111e32,#07111c); }
        .jph-watch-thumb img { width:100%; height:100%; display:block; object-fit:cover; opacity:.78; transition:transform .35s,opacity .25s; }
        .jph-watch-card:hover .jph-watch-thumb img { transform:scale(1.025); opacity:.9; }
        .jph-watch-thumb::after { content:""; position:absolute; inset:0; background:linear-gradient(90deg,rgba(4,11,20,.96),rgba(4,11,20,.83) 50%,rgba(4,11,20,.43)),linear-gradient(0deg,rgba(3,8,16,.85),transparent 65%); }
        .jph-watch-card-content { display:flex; width:100%; min-height:174px; flex-direction:column; justify-content:space-between; padding:13px 14px 12px; }
        .jph-watch-card-badges { display:flex; align-items:center; gap:8px; }
        .jph-watch-live-badge,.jph-watch-watchers { display:inline-flex; align-items:center; gap:6px; min-height:28px; padding:5px 9px; border-radius:8px; color:white; background:rgba(11,18,30,.75); font-size:10px; font-weight:850; box-shadow:0 4px 12px rgba(0,0,0,.14); backdrop-filter:blur(10px); }
        .jph-watch-live-badge { background:#f63156; letter-spacing:.02em; }
        .jph-watch-live-badge i { width:6px; height:6px; border-radius:50%; background:#fff; box-shadow:0 0 7px rgba(255,255,255,.8); }
        .jph-watch-watchers svg { width:14px; height:14px; }
        .jph-watch-card-bottom { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:end; gap:12px; }
        .jph-watch-card-copy { min-width:0; }
        .jph-watch-card-title { display:block; overflow:hidden; color:#fff; text-overflow:ellipsis; white-space:nowrap; font-size:17px; font-weight:850; letter-spacing:-.025em; text-shadow:0 2px 9px rgba(0,0,0,.5); }
        .jph-watch-card-subtitle { display:block; overflow:hidden; margin-top:5px; color:rgba(245,247,255,.83); text-overflow:ellipsis; white-space:nowrap; font-size:11px; font-weight:550; text-shadow:0 2px 7px rgba(0,0,0,.65); }
        .jph-watch-card-social { display:flex; align-items:center; gap:9px; margin-top:9px; color:rgba(245,247,255,.88); font-size:10px; font-weight:650; }
        .jph-watch-avatar-stack { display:flex; align-items:center; padding-left:2px; }
        .jph-watch-avatar { width:25px; height:25px; display:grid; flex:none; place-items:center; overflow:hidden; margin-left:-4px; border:2px solid #0b1727; border-radius:50%; color:#fff; background:linear-gradient(145deg,#e94e9c,#5838c6); font-size:9px; font-weight:800; }
        .jph-watch-avatar:first-child { margin-left:0; }.jph-watch-avatar:nth-child(2n) { background:linear-gradient(145deg,#3189c6,#6c44de); }.jph-watch-avatar img { width:100%; height:100%; object-fit:cover; }
        .jph-watch-card-join { min-width:104px; min-height:48px; display:inline-flex; align-items:center; justify-content:center; gap:7px; padding:0 17px; border:1px solid rgba(255,255,255,.18); border-radius:14px; color:white; background:linear-gradient(110deg,#5827e9,#412bf6); box-shadow:0 7px 18px rgba(37,23,157,.3); font-size:13px; font-weight:850; }
        .jph-watch-age { display:none; }
        .jph-watch-empty { margin-top:14px; padding:35px 18px; border:1px dashed var(--watch-line); border-radius:18px; text-align:center; background:var(--watch-panel); }
        .jph-watch-empty-icon { width:45px; height:45px; display:grid; place-items:center; margin:0 auto 11px; border-radius:14px; color:var(--watch-purple); background:var(--watch-soft); }
        .jph-watch-empty h2 { margin:0; font-size:16px; font-weight:850; }.jph-watch-empty p { max-width:360px; margin:7px auto 0; color:var(--watch-muted); font-size:11px; line-height:1.55; }
        .jph-watch-create { min-height:39px; display:inline-flex; align-items:center; justify-content:center; gap:7px; margin-top:14px; padding:0 15px; border:0; border-radius:12px; color:white; background:linear-gradient(110deg,#6c43ed,#4e36e8); font-size:11px; font-weight:820; cursor:pointer; }
        .jph-watch-error { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:10px; padding:10px 12px; border:1px solid rgba(231,70,104,.25); border-radius:12px; color:#a62c4c; background:rgba(239,74,111,.08); font-size:11px; }.dark .jph-watch-error { color:#ffb7c8; }
        .jph-watch-skeleton { display:grid; gap:10px; }.jph-watch-skeleton-card { height:174px; border:1px solid var(--watch-line); border-radius:18px; background:linear-gradient(110deg,var(--watch-panel),color-mix(in srgb,var(--watch-purple) 10%,var(--watch-panel)),var(--watch-panel)); background-size:220% 100%; animation:jph-watch-shimmer 1.4s ease-in-out infinite; }@keyframes jph-watch-shimmer { to { background-position:-220% 0; } }
        .jph-watch-bottom-nav { position:fixed; z-index:40; inset:auto 0 0; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:0; padding:8px 8px calc(8px + env(safe-area-inset-bottom)); border-top:1px solid var(--watch-line); background:var(--watch-panel); box-shadow:0 -9px 26px rgba(20,27,55,.09); backdrop-filter:blur(22px); }
        .jph-watch-nav-item { min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:3px 2px; border:0; color:var(--watch-muted); text-decoration:none; background:transparent; font-size:9px; font-weight:650; }
        .jph-watch-nav-item svg { width:20px; height:20px; }.jph-watch-nav-item.active { color:#8e42f7; }.jph-watch-nav-item.active svg { filter:drop-shadow(0 2px 5px rgba(145,61,255,.22)); }
        @media (min-width:760px) {
          .jph-watch-lobby { padding-bottom:32px; }
          .jph-watch-shell { padding:24px 24px 38px; }
          .jph-watch-hero { height:210px; }
          .jph-watch-hero-copy { padding:26px 28px; }
          .jph-watch-shortcuts { gap:12px; margin-top:14px; }
          .jph-watch-shortcut { min-height:86px; }
          .jph-watch-row { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .jph-watch-card,.jph-watch-card-content { min-height:190px; }
          .jph-watch-bottom-nav { display:none; }
        }
        @media (max-width:380px) {
          .jph-watch-shell { padding:9px 10px 14px; }
          .jph-watch-hero { height:140px; min-height:140px; }
          .jph-watch-hero-copy { width:75%; padding:17px 13px; }
          .jph-watch-hero-heading { font-size:23px; gap:6px; }
          .jph-watch-beta { padding:4px 6px; font-size:9px; }
          .jph-watch-hero-copy p { margin-top:10px; font-size:12px; }
          .jph-watch-shortcut { gap:8px; min-height:64px; padding:7px; }
          .jph-watch-shortcut-icon { width:44px; height:44px; }
          .jph-watch-shortcut-copy strong { font-size:12px; }.jph-watch-shortcut-copy small { font-size:10px; }
          .jph-watch-tab { min-height:46px; font-size:12px; }
          .jph-watch-card-content { min-height:166px; padding:11px; }
          .jph-watch-card { min-height:166px; }
          .jph-watch-card-title { font-size:15px; }.jph-watch-card-subtitle { font-size:10px; }
          .jph-watch-card-join { min-width:82px; min-height:42px; padding:0 11px; }
        }
        @media (prefers-reduced-motion:reduce) { .jph-watch-lobby *, .jph-watch-lobby *::before, .jph-watch-lobby *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; scroll-behavior:auto !important; transition-duration:.01ms !important; } }
      `}</style>

      <div className="jph-watch-shell">
        <section className="jph-watch-hero" aria-label="Watch Party">
          <picture>
            <source srcSet="/watch-party-study-hero.webp" type="image/webp" />
            <img
              className="jph-watch-hero-art"
              src="/watch-party-study-hero.png"
              alt=""
              decoding="async"
            />
          </picture>
          <div className="jph-watch-hero-copy">
            <h1 className="jph-watch-hero-heading">
              <MapPin /> Watch Party <span className="jph-watch-beta">Beta</span>
            </h1>
            <p>
              Watch · Learn · Discuss ·<br />
              Have Fun Together
            </p>
          </div>
        </section>

        <nav className="jph-watch-shortcuts" aria-label="Watch party shortcuts">
          {shortcuts.map(({ title, detail, icon: Icon, category, action, tone }) => (
            <button
              key={title}
              type="button"
              className="jph-watch-shortcut"
              onClick={() => {
                if (action === "create") {
                  setSheetOpen(true);
                  return;
                }
                setTab("live");
                setActiveCategory(category ?? null);
              }}
            >
              <span className={`jph-watch-shortcut-icon ${tone}`}>
                <Icon />
              </span>
              <span className="jph-watch-shortcut-copy">
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="jph-watch-tabbar" role="tablist" aria-label="Watch party rooms">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`jph-watch-tab ${tab === item.id ? "active" : ""}`}
              onClick={() => {
                setTab(item.id);
                setActiveCategory(null);
                if (item.id === "mine") void loadMyRooms();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {activeCategory && tab === "live" && (
          <div className="jph-watch-filter-row">
            <button
              type="button"
              className="jph-watch-filter active"
              onClick={() => setActiveCategory(null)}
            >
              {categoryOf(activeCategory).emoji} {categoryOf(activeCategory).label}
            </button>
          </div>
        )}

        {error && (
          <div className="jph-watch-error" role="alert">
            <span>Couldn’t load rooms: {error}</span>
            <button type="button" className="jph-watch-filter active" onClick={() => void load()}>
              Retry
            </button>
          </div>
        )}

        <section className="jph-watch-section">
          {tab !== "live" && (
            <div className="jph-watch-section-head">
              <div>
                <h2>{tab === "upcoming" ? "Upcoming" : "My Rooms"}</h2>
                <p>{tab === "upcoming" ? "Plan your next study session" : "Rooms you host"}</p>
              </div>
              <div className="flex items-center gap-1">
                {tab !== "upcoming" && (
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="jph-watch-create"
                    aria-label="Create a watch party"
                  >
                    <Plus size={15} />
                  </button>
                )}
              </div>
            </div>
          )}

          {isTabLoading ? (
            <div className="jph-watch-skeleton">
              <div className="jph-watch-skeleton-card" />
              <div className="jph-watch-skeleton-card" />
            </div>
          ) : isEmptyUpcoming ? (
            <EmptyState
              icon="upcoming"
              title="Nothing scheduled yet"
              description="Upcoming watch parties will show up here. Start a room and invite your friends to study or watch together."
              actionLabel="Create a room"
              onAction={() => setSheetOpen(true)}
            />
          ) : visibleRooms.length === 0 ? (
            <EmptyState
              icon={tab === "mine" ? "mine" : "live"}
              title={
                tab === "mine" ? "You haven’t hosted a room yet" : "No rooms are live right now"
              }
              description={
                tab === "mine"
                  ? "Create your first watch room, then invite your friends to join."
                  : "Start a live lecture, put on some music, or invite your friends to watch together."
              }
              actionLabel={tab === "mine" ? "Create a room" : "Start a room"}
              onAction={() => setSheetOpen(true)}
            />
          ) : (
            <div className="jph-watch-row">
              {visibleRooms.map((room) => (
                <PartyCard
                  key={room.id}
                  room={room}
                  avatars={roomAvatars[room.id] ?? []}
                  onOpen={openRoom}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <nav className="jph-watch-bottom-nav" aria-label="Main navigation">
        <Link to="/" className="jph-watch-nav-item">
          <Home />
          <span>Home</span>
        </Link>
        <Link to="/watch" className="jph-watch-nav-item active" aria-current="page">
          <PlaySquare />
          <span>Watch Party</span>
        </Link>
        <Link to="/tests" className="jph-watch-nav-item">
          <ClipboardCheck />
          <span>Tests</span>
        </Link>
        <Link to="/community" className="jph-watch-nav-item">
          <FileText />
          <span>Community</span>
        </Link>
        <Link to="/profile" className="jph-watch-nav-item">
          <Users />
          <span>Profile</span>
        </Link>
      </nav>

      <StartPartySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={async (id) => {
          setSheetOpen(false);
          await Promise.all([load(), loadMyRooms()]);
          openRoom(id);
        }}
      />
    </main>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: "upcoming" | "mine" | "live";
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const Icon = icon === "upcoming" ? CheckCircle2 : icon === "mine" ? UsersRound : PlaySquare;
  return (
    <div className="jph-watch-empty">
      <div className="jph-watch-empty-icon">
        <Icon size={21} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <button type="button" className="jph-watch-create" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}

function PartyCard({
  room,
  avatars,
  onOpen,
}: {
  room: LobbyRoom;
  avatars: string[];
  onOpen: (id: string) => void;
}) {
  const category = categoryOf(room.category);
  const host = room.host_name?.trim() || "JEE Prep Hub";
  return (
    <button
      type="button"
      onClick={() => onOpen(room.id)}
      className="jph-watch-card"
      aria-label={`Join ${room.title}`}
    >
      <div className="jph-watch-thumb">
        {room.thumbnail_url && <img src={room.thumbnail_url} alt="" loading="lazy" />}
      </div>
      <div className="jph-watch-card-content">
        <div className="jph-watch-card-badges">
          <span className="jph-watch-live-badge">
            <i /> LIVE
          </span>
          <span className="jph-watch-watchers">
            <Eye /> {Math.max(0, room.watching || 0)}
          </span>
        </div>
        <div className="jph-watch-card-bottom">
          <div className="jph-watch-card-copy">
            <span className="jph-watch-card-title" title={room.title}>
              {room.title}
            </span>
            <span className="jph-watch-card-subtitle">
              {category.label} · {host}
            </span>
            <span className="jph-watch-card-social">
              {avatars.length > 0 && (
                <span
                  className="jph-watch-avatar-stack"
                  aria-label={`${avatars.length} room participants`}
                >
                  {avatars.map((avatar, index) => (
                    <span className="jph-watch-avatar" key={`${room.id}-${avatar}-${index}`}>
                      <img src={avatar} alt="" />
                    </span>
                  ))}
                </span>
              )}
              <span>+{Math.max(0, (room.watching || 0) - avatars.length)} watching</span>
            </span>
          </div>
          <span className="jph-watch-card-join">
            Join <ChevronRight size={15} />
          </span>
        </div>
      </div>
    </button>
  );
}
