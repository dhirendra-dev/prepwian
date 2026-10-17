/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  Clock3,
  Copy,
  Loader2,
  LogOut,
  RefreshCw,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  arenaError,
  battleAnswer,
  battleGet,
  battleLeave,
  battleReady,
  battleReview,
  inviteSend,
  signQuizImages,
} from "@/lib/quiz-arena";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/quiz/battle/$battleId")({
  head: () => ({ meta: [
      { property: "og:title", content: "Live Quiz Battle — JEE Prep Hub" },
      { property: "og:description", content: "Face another JEE aspirant in a live quiz battle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Live Quiz Battle — JEE Prep Hub" },
      { name: "twitter:description", content: "Face another JEE aspirant in a live quiz battle." },
{ title: "Live Quiz Battle — JEE Prep Hub" }, { name: "description", content: "Face another JEE aspirant in a live quiz battle." }] }),
 component: BattleRoute });
type Any = any;
function BattleRoute() {
  const { battleId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signImages = useServerFn(signQuizImages);
  const [selected, setSelected] = useState<string[]>([]);
  const [numerical, setNumerical] = useState("");
  const [lockedSeq, setLockedSeq] = useState<number | null>(null);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const battle = useQuery({
    queryKey: ["quiz-battle", battleId],
    queryFn: () => battleGet(battleId),
    enabled: Boolean(user),
    refetchInterval: 1200,
    retry: 2,
  });
  const state = (battle.data as Any) ?? {};
  const b = state.battle as Any;
  const current = state.current as Any;
  const me = ((state.players as Any[]) ?? []).find((p) => p.is_me);
  const opponent = ((state.players as Any[]) ?? []).find((p) => !p.is_me);
  const offset = state.server_now ? new Date(state.server_now).getTime() - Date.now() : 0;
  const serverNow = Date.now() + offset;
  const secondsLeft = current?.closes_at
    ? Math.max(0, Math.ceil((new Date(current.closes_at).getTime() - serverNow) / 1000))
    : 0;
  const nextLeft = current?.next_at
    ? Math.max(0, Math.ceil((new Date(current.next_at).getTime() - serverNow) / 1000))
    : 0;
  const images = useQuery({
    queryKey: ["quiz-battle-images", battleId, current?.seq, b?.status],
    queryFn: () => signImages({ data: { kind: "battle", id: battleId } }),
    enabled: Boolean(user && current && b?.status === "active"),
    staleTime: 50 * 60_000,
  });
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`quiz-battle-${battleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_battles", filter: `id=eq.${battleId}` },
        () => void battle.refetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_battle_players",
          filter: `battle_id=eq.${battleId}`,
        },
        () => void battle.refetch(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [battle, battleId, user]);
  useEffect(() => {
    if (current?.seq !== undefined && current.seq !== lockedSeq) {
      setSelected([]);
      setNumerical("");
      setLockedSeq(null);
    }
  }, [current?.seq, lockedSeq]);
  const answer = useMutation({
    mutationFn: () =>
      battleAnswer(battleId, current.seq, selected, numerical === "" ? null : Number(numerical)),
    onSuccess: (result: Any) => {
      if (result?.accepted) setLockedSeq(current.seq);
      else toast.error("Too late — this question is closed.");
      void battle.refetch();
    },
    onError: (e) => toast.error(arenaError(e)),
  });
  const leave = useMutation({
    mutationFn: () => battleLeave(battleId),
    onSuccess: () => navigate({ to: "/quiz" }),
    onError: (e) => toast.error(arenaError(e)),
  });
  if (!user) return <GuestState />;
  if (battle.isLoading)
    return <StatusCard title="Loading battle" text="Connecting to the server…" />;
  if (battle.isError || !b)
    return (
      <StatusCard
        title="Battle unavailable"
        text={battle.error ? arenaError(battle.error) : "We could not load this battle."}
        retry={() => battle.refetch()}
      />
    );
  const snapshot = current?.snapshot as Any;
  const options = snapshot?.options ?? [];
  const isChoice = ["single", "multiple"].includes(current?.qtype);
  const hasAnswer = isChoice ? selected.length > 0 : numerical.trim() !== "";
  return (
    <main className="quiz-theme mx-auto min-h-[calc(100dvh-5rem)] max-w-4xl bg-[#f4f8ff] p-3 pb-24 text-slate-900 dark:bg-[#080d19] dark:text-white sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <Link
          to="/quiz"
          className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" /> Arena
        </Link>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${online ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200" : "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200"}`}
        >
          {online ? (
            "Live sync"
          ) : (
            <>
              <WifiOff className="h-3 w-3" /> Reconnecting
            </>
          )}
        </span>
      </div>
      {b.status === "lobby" && (
        <Lobby
          battle={b}
          me={me}
          opponent={opponent}
          onReady={(ready: boolean) =>
            battleReady(battleId, ready)
              .then(() => battle.refetch())
              .catch((e) => toast.error(arenaError(e)))
          }
          onLeave={() => leave.mutate()}
        />
      )}
      {b.status === "countdown" && <Countdown startsAt={b.starts_at} now={serverNow} />}
      {b.status === "active" && current && (
        <>
          <header className="sticky top-[calc(var(--site-global-header-height)+0.5rem)] z-10 rounded-2xl border border-blue-200 bg-white p-3 shadow-lg dark:border-blue-400/20 dark:bg-[#101a32]">
            <div className="flex items-center justify-between gap-3 text-sm">
              <Score name="You" score={me?.score ?? 0} avatar={me?.profile?.avatar_url} />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Round
                </p>
                <b>
                  {current.seq}/{current.total}
                </b>
              </div>
              <Score
                name={opponent?.profile?.name ?? opponent?.profile?.username ?? "Opponent"}
                score={opponent?.score ?? 0}
                avatar={opponent?.profile?.avatar_url}
              />
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${secondsLeft <= 3 ? "bg-rose-500" : "bg-blue-500"}`}
                style={{
                  width: `${Math.min(100, (secondsLeft / Math.max(1, Number(current.seconds ?? 20))) * 100)}%`,
                }}
              />
            </div>
          </header>
          <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#101a32] sm:p-6">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="rounded-full bg-blue-500/10 px-2 py-1 font-bold uppercase">
                {current.qtype}
              </span>
              <span className="inline-flex items-center gap-1 font-mono font-bold">
                <Clock3 className="h-4 w-4" /> {secondsLeft}s
              </span>
            </div>
            <h1 className="mt-5 text-lg font-bold leading-8 sm:text-xl">
              {snapshot?.text ?? "Question loading…"}
            </h1>
            {snapshot?.image_url && (
              <img
                src={images.data?.[snapshot.image_url] ?? snapshot.image_url}
                alt="Question"
                className="mt-4 max-h-72 w-full rounded-2xl object-contain"
              />
            )}
            {snapshot?.images?.map((image: Any) => (
              <img
                key={image.path ?? image.url}
                src={images.data?.[image.path] ?? image.url ?? images.data?.[image]}
                alt="Question diagram"
                className="mt-4 max-h-72 w-full rounded-2xl object-contain"
              />
            ))}
            <div className="mt-5 space-y-2">
              {isChoice ? (
                options.map((option: Any) => {
                  const active = selected.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (lockedSeq === current.seq || current.closed) return;
                        setSelected(
                          current.qtype === "single"
                            ? [option.id]
                            : active
                              ? selected.filter((id) => id !== option.id)
                              : [...selected, option.id],
                        );
                        if (current.qtype === "single") answer.mutate();
                      }}
                      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border p-3 text-left ${active ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-white/10"}`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 font-bold dark:bg-white/10">
                        {option.label}
                      </span>
                      <span className="flex-1 text-sm">{option.text}</span>
                      {active && <Check className="h-4 w-4 text-blue-500" />}
                    </button>
                  );
                })
              ) : (
                <input
                  type="number"
                  inputMode="decimal"
                  value={numerical}
                  onChange={(e) => setNumerical(e.target.value)}
                  placeholder="Enter a number"
                  className="min-h-14 w-full rounded-2xl border bg-slate-50 px-4 text-lg font-bold dark:border-white/10 dark:bg-[#0b1429]"
                />
              )}
            </div>
            {opponent?.answered && !current.closed && (
              <p className="mt-4 text-xs font-bold text-emerald-600">Opponent has answered.</p>
            )}
            {lockedSeq === current.seq && !current.closed && (
              <p className="mt-4 text-center text-sm font-bold text-slate-500">
                Locked, waiting for reveal…
              </p>
            )}
            {!isChoice || current.qtype === "multiple" ? (
              <Button
                className="mt-5 min-h-12 w-full"
                onClick={() => answer.mutate()}
                disabled={
                  !hasAnswer || answer.isPending || lockedSeq === current.seq || current.closed
                }
              >
                {answer.isPending
                  ? "Sending…"
                  : lockedSeq === current.seq
                    ? "Locked"
                    : "Lock Answer"}
              </Button>
            ) : null}
            {current.closed && (
              <Reveal reveal={current.reveal} me={me} opponent={opponent} nextLeft={nextLeft} />
            )}
          </section>
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm("Leaving an active battle counts as a forfeit. Leave?"))
                  leave.mutate();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Leave battle
            </Button>
          </div>
        </>
      )}
      {b.status === "finished" && (
        <Finished
          battle={b}
          players={state.players ?? []}
          review={battleReview}
          battleId={battleId}
          onBack={() => navigate({ to: "/quiz" })}
        />
      )}
      {b.status === "cancelled" && (
        <StatusCard
          title="Battle cancelled"
          text={b.end_reason ?? "The opponent left or the lobby expired."}
          retry={() => navigate({ to: "/quiz" })}
        />
      )}
    </main>
  );
}
function GuestState() {
  return (
    <StatusCard
      title="Sign in to play"
      text="Live battles need an account so the server can keep both players in sync."
    />
  );
}
function StatusCard({ title, text, retry }: { title: string; text: string; retry?: () => void }) {
  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="rounded-3xl border bg-white p-6 text-center dark:border-white/10 dark:bg-[#101a32]">
        <h1 className="text-xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{text}</p>
        {retry && (
          <Button className="mt-5" onClick={retry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
      </div>
    </main>
  );
}
function Lobby({ battle, me, opponent, onReady, onLeave }: Any) {
  return (
    <section className="rounded-3xl border bg-white p-5 dark:border-white/10 dark:bg-[#101a32]">
      <p className="text-xs font-black uppercase tracking-widest text-blue-500">Battle lobby</p>
      <h1 className="mt-2 text-2xl font-black">Ready when you are</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 text-center">
        <Player player={me} label="You" />
        <Player player={opponent} label="Opponent" />
      </div>
      <p className="mt-5 text-center text-sm text-slate-500">
        {battle.format} · {battle.subject} · {battle.question_count} questions
      </p>
      {battle.join_code && (
        <p className="mt-3 flex items-center justify-center gap-2 font-mono text-xl font-black tracking-widest">
          {battle.join_code}
          <Copy className="h-4 w-4" />
        </p>
      )}
      <div className="mt-6 flex gap-2">
        <Button className="min-h-12 flex-1" onClick={() => onReady(!me?.ready)}>
          {me?.ready ? "Ready ✓" : "I’m ready"}
        </Button>
        <Button variant="outline" onClick={onLeave}>
          Leave
        </Button>
      </div>
    </section>
  );
}
function Player({ player, label }: Any) {
  return (
    <div className="rounded-2xl border p-4 dark:border-white/10">
      <div
        className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${player ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400 dark:bg-white/10"}`}
      >
        {player?.profile?.avatar_url ? (
          <img
            src={player.profile.avatar_url}
            className="h-full w-full rounded-full object-cover"
            alt=""
          />
        ) : player ? (
          (player.profile?.name ?? "P").slice(0, 1)
        ) : (
          "?"
        )}
      </div>
      <p className="mt-2 text-sm font-bold">
        {player?.profile?.name ?? player?.profile?.username ?? label}
      </p>
      <p className="text-xs text-slate-500">
        {player ? `${player.rating ?? "—"} rating` : "Waiting…"}
      </p>
    </div>
  );
}
function Score({ name, score, avatar }: Any) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-500 text-xs font-bold text-white">
        {avatar ? (
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          name.slice(0, 1)
        )}
      </div>
      <div className="min-w-0">
        <p className="max-w-24 truncate text-[10px] font-bold uppercase text-slate-500">{name}</p>
        <p className="text-lg font-black">{score}</p>
      </div>
    </div>
  );
}
function Countdown({ startsAt, now }: Any) {
  const left = Math.max(0, Math.ceil((new Date(startsAt).getTime() - now) / 1000));
  return (
    <div className="rounded-3xl border bg-white p-10 text-center dark:border-white/10 dark:bg-[#101a32]">
      <p className="text-xs font-black uppercase tracking-widest text-blue-500">Battle starts in</p>
      <p className="mt-3 text-7xl font-black tabular-nums">{left}</p>
      <p className="mt-3 text-sm text-slate-500">Get ready.</p>
    </div>
  );
}
function Reveal({ reveal, me, opponent, nextLeft }: Any) {
  return (
    <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-950/20">
      <p className="font-black text-emerald-800 dark:text-emerald-200">Answer revealed</p>
      <p className="mt-2 text-sm">
        Correct answer: <b>{reveal?.key ?? "—"}</b>
      </p>
      <div className="mt-3 flex justify-between text-xs">
        <span>You: {me?.score ?? 0} points</span>
        <span>Opponent: {opponent?.score ?? 0} points</span>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">Next question in {nextLeft}s</p>
    </div>
  );
}
function Finished({ battle, players, review, battleId, onBack }: Any) {
  const [details, setDetails] = useState<Any[] | null>(null);
  const me = players.find((p: Any) => p.is_me);
  const opponent = players.find((p: Any) => !p.is_me);
  return (
    <section className="rounded-3xl border bg-white p-5 dark:border-white/10 dark:bg-[#101a32]">
      <div className="text-center">
        <Zap className="mx-auto h-10 w-10 text-amber-500" />
        <p className="mt-3 text-xs font-black uppercase tracking-widest text-blue-500">
          Battle complete
        </p>
        <h1 className="mt-2 text-3xl font-black">
          {battle.winner === "draw" ? "Draw" : battle.winner === "me" ? "Victory" : "Defeat"}
        </h1>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/20">
          <b className="block text-3xl">{me?.score ?? 0}</b>
          <span className="text-xs text-slate-500">Your score</span>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4 dark:bg-white/10">
          <b className="block text-3xl">{opponent?.score ?? 0}</b>
          <span className="text-xs text-slate-500">Opponent</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <p>
          Correct <b>{me?.correct ?? 0}</b>
        </p>
        <p>
          Accuracy{" "}
          <b>
            {me?.score && battle.question_count
              ? Math.round((me.correct / battle.question_count) * 100)
              : 0}
            %
          </b>
        </p>
        <p>
          XP <b>+{me?.xp_awarded ?? 0}</b>
        </p>
        <p>
          Rating{" "}
          <b>
            {battle.mode === "ranked"
              ? `${me?.rating_delta > 0 ? "+" : ""}${me?.rating_delta ?? 0}`
              : "Unranked"}
          </b>
        </p>
      </div>
      {details && (
        <div className="mt-5 space-y-2">
          {details.map((item, i) => (
            <div key={i} className="rounded-xl border p-3 text-sm dark:border-white/10">
              Question {i + 1}: {item.text ?? item.explanation ?? "Reviewed"}
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          onClick={async () => setDetails((await review(battleId)) as Any[])}
          variant="outline"
        >
          Review questions
        </Button>
        <Button onClick={onBack}>Back to Arena</Button>
      </div>
    </section>
  );
}
