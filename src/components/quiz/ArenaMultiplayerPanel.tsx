/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound, Loader2, Search, Swords, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  arenaError,
  arenaOverview,
  inviteCancel,
  inviteRespond,
  inviteSend,
  invitesList,
  queueJoin,
  queueLeave,
  queuePoll,
  roomCreate,
  roomJoin,
  searchPlayers,
  type ArenaMode,
  type ArenaSubject,
} from "@/lib/quiz-arena";
import { Button } from "@/components/ui/button";

type Format = {
  key?: string;
  id?: string;
  name?: string;
  label?: string;
  question_count?: number;
  seconds_per_question?: number;
};
type Subject = ArenaSubject;
const subjects: Array<[Subject, string]> = [
  ["all", "All subjects"],
  ["physics", "Physics"],
  ["chemistry", "Chemistry"],
  ["mathematics", "Mathematics"],
  ["biology", "Biology"],
];

export function ArenaMultiplayerPanel({ user }: { user: { id: string } | null }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"quick" | "room" | "friend" | null>(null);
  const [format, setFormat] = useState("");
  const [subject, setSubject] = useState<Subject>("all");
  const [ranked, setRanked] = useState(true);
  const [roomCode, setRoomCode] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const overview = useQuery({
    queryKey: ["quiz-arena-overview", user?.id],
    queryFn: arenaOverview,
    enabled: Boolean(user),
    refetchInterval: mode ? 5_000 : false,
  });
  const formats = useMemo(
    () => ((overview.data as any)?.formats ?? []) as Format[],
    [overview.data],
  );
  useEffect(() => {
    if (!format && formats[0]) setFormat(formats[0].key ?? formats[0].id ?? "");
  }, [formats, format]);
  useEffect(() => {
    if (mode !== "quick") return;
    const timer = window.setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => window.clearInterval(timer);
  }, [mode]);
  const quick = useMutation({
    mutationFn: () => queueJoin(format, subject, ranked),
    onSuccess: (data: any) => {
      if (data?.status === "matched" && data.battle_id)
        navigate({ to: "/quiz/battle/$battleId", params: { battleId: data.battle_id } });
    },
    onError: (e) => toast.error(arenaError(e)),
  });
  const poll = useQuery({
    queryKey: ["quiz-queue-poll", user?.id],
    queryFn: queuePoll,
    enabled: quick.isSuccess && mode === "quick",
    refetchInterval: 2000,
  });
  useEffect(() => {
    const data: any = poll.data;
    if (data?.status === "matched" && data.battle_id)
      navigate({ to: "/quiz/battle/$battleId", params: { battleId: data.battle_id } });
    if (data?.status === "expired" || data?.status === "cancelled") {
      toast.message(
        data.status === "expired" ? "No opponent found this time." : "Matchmaking cancelled.",
      );
      setMode(null);
    }
  }, [navigate, poll.data]);
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`quiz-arena-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_matchmaking_queue",
          filter: `user_id=eq.${user.id}`,
        },
        () => void poll.refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_battle_invitations" },
        () => {
          void overview.refetch();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [overview, poll, user]);
  const create = useMutation({
    mutationFn: () => roomCreate(format, subject, null, ranked ? "ranked" : "unranked"),
    onSuccess: (data: any) => {
      setCreatedCode(data.join_code);
      if (data.battle_id)
        navigate({ to: "/quiz/battle/$battleId", params: { battleId: data.battle_id } });
    },
    onError: (e) => toast.error(arenaError(e)),
  });
  const join = useMutation({
    mutationFn: () => roomJoin(roomCode),
    onSuccess: (data: any) =>
      navigate({ to: "/quiz/battle/$battleId", params: { battleId: data.battle_id } }),
    onError: (e) => toast.error(arenaError(e)),
  });
  const players = useQuery({
    queryKey: ["quiz-search-players", search],
    queryFn: () => searchPlayers(search),
    enabled: mode === "friend" && Boolean(user),
  });
  const send = useMutation({
    mutationFn: () =>
      inviteSend(selectedUser, format, subject, null, ranked ? "ranked" : "unranked"),
    onSuccess: () => {
      toast.success("Invite sent.");
      setSelectedUser("");
      void overview.refetch();
    },
    onError: (e) => toast.error(arenaError(e)),
  });
  const invites = useQuery({
    queryKey: ["quiz-invites", user?.id],
    queryFn: invitesList,
    enabled: Boolean(user),
    refetchInterval: 5000,
  });
  if (!user)
    return (
      <section className="rounded-3xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-[#2a2210] dark:text-amber-100">
        <p className="font-bold">Sign in to play live battles</p>
        <p className="mt-1">
          Quick Match, private rooms, and friend challenges are tied to your account.
        </p>
      </section>
    );
  const incoming = ((invites.data as any)?.incoming ??
    (overview.data as any)?.invites?.incoming ??
    []) as any[];
  const outgoing = ((invites.data as any)?.outgoing ??
    (overview.data as any)?.invites?.outgoing ??
    []) as any[];
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#101a32] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            Live arena
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            Play against a real student
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Server-synced battles with no client-side scoring.
          </p>
        </div>
        {incoming.length > 0 && (
          <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">
            {incoming.length} invite{incoming.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      {(overview.data as any)?.active_battle && (
        <button
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-blue-300 bg-blue-50 p-3 text-left dark:border-blue-400/30 dark:bg-blue-950/30"
          onClick={() =>
            navigate({
              to: "/quiz/battle/$battleId",
              params: { battleId: (overview.data as any).active_battle },
            })
          }
        >
          <span>
            <b>Resume battle</b>
            <span className="block text-xs text-slate-600 dark:text-slate-300">
              Your active battle is waiting.
            </span>
          </span>
          <Swords className="h-4 w-4" />
        </button>
      )}
      {incoming.length > 0 && (
        <div className="mt-4 space-y-2">
          {incoming.slice(0, 3).map((invite) => (
            <div
              key={invite.id}
              className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-400/20 dark:bg-rose-950/20"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {invite.from?.name ?? invite.from?.username ?? "A student"}
                </p>
                <p className="text-xs text-slate-500">
                  {invite.format} · {invite.subject}
                </p>
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    const r: any = await inviteRespond(invite.id, true);
                    if (r?.battle_id)
                      navigate({ to: "/quiz/battle/$battleId", params: { battleId: r.battle_id } });
                  } catch (e) {
                    toast.error(arenaError(e));
                  }
                }}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => inviteRespond(invite.id, false).then(() => invites.refetch())}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <BattleTile
          icon={<Users />}
          title="Quick Match"
          text="Find an opponent"
          onClick={() => {
            setMode("quick");
            setElapsed(0);
            quick.reset();
          }}
        />
        <BattleTile
          icon={<KeyRound />}
          title="Private Room"
          text="Create or join"
          onClick={() => setMode("room")}
        />
        <BattleTile
          icon={<Swords />}
          title="Challenge a friend"
          text="Invite by username"
          onClick={() => setMode("friend")}
        />
      </div>
      {mode && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#0b1429]">
          {mode === "quick" && (
            <>
              <ModalTitle
                title={quick.isSuccess ? "Searching for an opponent" : "Quick Match 1v1"}
                onClose={() => {
                  queueLeave().catch(() => {});
                  setMode(null);
                }}
              />
              {quick.isSuccess ? (
                <div className="py-5 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
                  <p className="mt-3 font-bold">Finding a worthy opponent…</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {elapsed}s elapsed · your heartbeat stays active
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => {
                      queueLeave().catch(() => {});
                      quick.reset();
                      setMode(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="mt-4 ml-2"
                    variant="ghost"
                    onClick={() => {
                      queueLeave().catch(() => {});
                      setMode(null);
                    }}
                  >
                    Practice instead
                  </Button>
                </div>
              ) : (
                <Options
                  formats={formats}
                  format={format}
                  setFormat={setFormat}
                  subject={subject}
                  setSubject={setSubject}
                  ranked={ranked}
                  setRanked={setRanked}
                  onGo={() => quick.mutate()}
                  busy={quick.isPending}
                />
              )}
            </>
          )}
          {mode === "room" && (
            <>
              <ModalTitle title="Private Room" onClose={() => setMode(null)} />
              {createdCode ? (
                <div className="py-3 text-center">
                  <p className="text-sm text-slate-500">Share this room code</p>
                  <p className="my-3 font-mono text-4xl font-black tracking-[0.25em] text-blue-700 dark:text-blue-300">
                    {createdCode}
                  </p>
                  <Button
                    onClick={() => {
                      navigator.clipboard?.writeText(createdCode);
                      toast.success("Code copied.");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy code
                  </Button>
                  <p className="mt-3 text-xs text-slate-500">Opening your lobby…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Options
                    formats={formats}
                    format={format}
                    setFormat={setFormat}
                    subject={subject}
                    setSubject={setSubject}
                    ranked={ranked}
                    setRanked={setRanked}
                    onGo={() => create.mutate()}
                    busy={create.isPending}
                  />
                  <div className="border-t border-slate-200 pt-4 dark:border-white/10">
                    <label className="text-xs font-bold">Join with a code</label>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={roomCode}
                        onChange={(e) =>
                          setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                        }
                        maxLength={12}
                        placeholder="ROOM CODE"
                        className="min-h-11 min-w-0 flex-1 rounded-xl border bg-white px-3 font-mono uppercase dark:border-white/10 dark:bg-[#101a32]"
                      />
                      <Button
                        onClick={() => join.mutate()}
                        disabled={roomCode.length < 4 || join.isPending}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {mode === "friend" && (
            <>
              <ModalTitle title="Challenge a friend" onClose={() => setMode(null)} />
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search username"
                    className="min-h-11 w-full rounded-xl border bg-white pl-9 pr-3 dark:border-white/10 dark:bg-[#101a32]"
                  />
                </div>
                <div className="max-h-40 space-y-2 overflow-auto">
                  {((players.data as any[]) ?? []).map((player) => (
                    <button
                      key={player.username}
                      onClick={() => setSelectedUser(player.username)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left ${selectedUser === player.username ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-white/10"}`}
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500 font-bold text-white">
                        {(player.name ?? player.username).slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate">{player.name ?? player.username}</b>
                        <small className="text-slate-500">
                          @{player.username} ·{" "}
                          {player.busy ? "Busy" : player.is_friend ? "Friend" : "Available"}
                        </small>
                      </span>
                      {selectedUser === player.username && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
                <Options
                  formats={formats}
                  format={format}
                  setFormat={setFormat}
                  subject={subject}
                  setSubject={setSubject}
                  ranked={ranked}
                  setRanked={setRanked}
                  onGo={() => send.mutate()}
                  busy={send.isPending}
                  disabled={!selectedUser}
                />
              </div>
            </>
          )}
        </div>
      )}
      {outgoing.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          {outgoing.length} outgoing invite{outgoing.length > 1 ? "s" : ""} pending ·{" "}
          <button
            className="underline"
            onClick={() =>
              inviteCancel(outgoing[0].id).then(() =>
                qc.invalidateQueries({ queryKey: ["quiz-invites"] }),
              )
            }
          >
            Cancel latest
          </button>
        </p>
      )}
    </section>
  );
}
function BattleTile({
  icon,
  title,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-400 dark:border-white/10 dark:bg-[#15213e]"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
        {icon}
      </span>
      <span>
        <b className="block text-sm">{title}</b>
        <small className="text-xs text-slate-500">{text}</small>
      </span>
    </button>
  );
}
function ModalTitle({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="font-black">{title}</h3>
      <button onClick={onClose} aria-label="Close">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
function Options({
  formats,
  format,
  setFormat,
  subject,
  setSubject,
  ranked,
  setRanked,
  onGo,
  busy,
  disabled,
}: {
  formats: Format[];
  format: string;
  setFormat: (v: string) => void;
  subject: Subject;
  setSubject: (v: Subject) => void;
  ranked: boolean;
  setRanked: (v: boolean) => void;
  onGo: () => void;
  busy: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold">
        Format
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 dark:border-white/10 dark:bg-[#101a32]"
        >
          {formats.length ? (
            formats.map((f) => (
              <option key={f.key ?? f.id} value={f.key ?? f.id}>
                {f.label ?? f.name ?? f.key} · {f.question_count ?? ""} questions
              </option>
            ))
          ) : (
            <option value="">Loading formats…</option>
          )}
        </select>
      </label>
      <label className="block text-xs font-bold">
        Subject
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value as Subject)}
          className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 capitalize dark:border-white/10 dark:bg-[#101a32]"
        >
          {subjects.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex rounded-xl border border-slate-200 p-1 dark:border-white/10">
        <button
          className={`flex-1 rounded-lg py-2 text-sm font-bold ${ranked ? "bg-blue-500 text-white" : "text-slate-500"}`}
          onClick={() => setRanked(true)}
        >
          Ranked
        </button>
        <button
          className={`flex-1 rounded-lg py-2 text-sm font-bold ${!ranked ? "bg-blue-500 text-white" : "text-slate-500"}`}
          onClick={() => setRanked(false)}
        >
          Unranked
        </button>
      </div>
      <Button className="min-h-11 w-full" onClick={onGo} disabled={busy || disabled || !format}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Continue
      </Button>
    </div>
  );
}
