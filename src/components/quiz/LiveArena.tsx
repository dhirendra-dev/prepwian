import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, Loader2, Swords, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MathText } from "@/components/MathText";

type Profile = { name: string; username: string; avatar_url?: string };
type Player = { is_me: boolean; profile: Profile; ready: boolean; online: boolean; score: number; result?: string; xp_awarded?: number };
type Snapshot = { text: string; image_url?: string; options: { id: string; label: string; text: string }[] };
type BattleState = {
  server_now: string;
  battle: { id: string; status: string; join_code?: string; starts_at?: string; winner?: string; end_reason?: string };
  players: Player[];
  current: null | { seq: number; total: number; qtype: string; snapshot: Snapshot; closes_at: string; closed: boolean; my_answered: boolean; reveal?: { key: { correct_option_ids?: string[]; correct_numerical?: number; explanation?: string } } };
};
type Invite = { id: string; from?: Profile; to?: Profile; status?: string; battle_id?: string };
type Invites = { incoming: Invite[]; outgoing: Invite[] };

async function battleGet(id: string): Promise<BattleState> {
  const { data, error } = await supabase.rpc("quiz_battle_get", { _bid: id });
  if (error) throw error;
  return data as unknown as BattleState;
}

export function LiveArena({ userId, subject, mode, onClose, initialBattleId }: {
  userId: string; subject: string; mode: "quick" | "room" | null; onClose: () => void; initialBattleId?: string;
}) {
  const [battleId, setBattleId] = useState<string | null>(initialBattleId ?? null);
  const [searching, setSearching] = useState(false);
  const [code, setCode] = useState("");
  const invites = useQuery({
    queryKey: ["quiz-live-invites", userId],
    queryFn: async (): Promise<Invites> => {
      const { data, error } = await supabase.rpc("quiz_invites_list");
      if (error) throw error;
      return data as unknown as Invites;
    },
    refetchInterval: battleId ? false : 5000,
    retry: false,
  });
  useEffect(() => {
    const accepted = invites.data?.outgoing.find((i) => i.status === "accepted" && i.battle_id);
    if (accepted?.battle_id) setBattleId(accepted.battle_id);
  }, [invites.data]);
  const queue = useQuery({
    queryKey: ["quiz-live-queue", userId], enabled: searching,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("quiz_queue_poll");
      if (error) throw error;
      return data as unknown as { status: string; battle_id?: string };
    }, refetchInterval: searching ? 2000 : false, retry: false,
  });
  useEffect(() => {
    if (queue.data?.battle_id) { setBattleId(queue.data.battle_id); setSearching(false); onClose(); }
    else if (queue.data?.status === "expired") { setSearching(false); toast.info("No opponent joined. You can search again."); }
    if (queue.error) { setSearching(false); toast.error(queue.error.message); }
  }, [queue.data, queue.error, onClose]);
  useEffect(() => {
    if (!searching) return;
    return () => { void supabase.rpc("quiz_queue_leave"); };
  }, [searching]);
  const action = useMutation({
    mutationFn: async (kind: "quick" | "create" | "join" | "cancel") => {
      const result = kind === "quick"
        ? await supabase.rpc("quiz_queue_join", { _format: "quick", _subject: subject === "any" ? "all" : subject, _ranked: false })
        : kind === "create"
          ? await supabase.rpc("quiz_room_create", { _format: "standard", _subject: subject === "any" ? "all" : subject, _chapter: "", _mode: "unranked" })
          : kind === "join"
            ? await supabase.rpc("quiz_room_join", { _code: code.trim().toUpperCase() })
            : await supabase.rpc("quiz_queue_leave");
      if (result.error) throw result.error;
      return { kind, value: result.data as unknown as { battle_id?: string; status?: string } };
    },
    onSuccess: ({ kind, value }) => {
      if (value.battle_id) { setBattleId(value.battle_id); setSearching(false); onClose(); }
      else setSearching(kind === "quick");
      if (kind === "cancel") onClose();
    }, onError: (e) => toast.error(e.message),
  });
  const accept = useMutation({
    mutationFn: async ({ id, yes }: { id: string; yes: boolean }) => {
      const { data, error } = await supabase.rpc("quiz_invite_respond", { _id: id, _accept: yes });
      if (error) throw error;
      return data as unknown as { battle_id?: string };
    }, onSuccess: (value) => { if (value.battle_id) setBattleId(value.battle_id); void invites.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  return <>
    {invites.data?.incoming.map((invite) => <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-foreground">
      <p className="text-sm font-semibold">{invite.from?.name ?? "A student"} challenged you</p>
      <div className="flex gap-2"><Button variant="outline" disabled={accept.isPending} onClick={() => accept.mutate({ id: invite.id, yes: false })}>Decline</Button><Button disabled={accept.isPending} onClick={() => accept.mutate({ id: invite.id, yes: true })}><Swords className="mr-2 h-4 w-4" />Accept</Button></div>
    </div>)}
    {invites.data?.outgoing.filter((i) => i.status === "pending").map((invite) => <p key={invite.id} className="text-sm text-muted-foreground">Waiting for {invite.to?.name ?? "your friend"} to accept…</p>)}
    <Dialog open={Boolean(mode) && !battleId} onOpenChange={(open) => { if (!open && !action.isPending) { if (searching) action.mutate("cancel"); else onClose(); } }}>
      <DialogContent><DialogHeader><DialogTitle>{mode === "quick" ? "Quick Match 1v1" : "Private Room"}</DialogTitle></DialogHeader>
        {mode === "quick" ? <div className="space-y-4 py-3">
          <p className="text-sm text-muted-foreground">{searching ? "Searching for a real student…" : "Ready for a live 10-question match?"}</p>
          <Button className="w-full" disabled={action.isPending} onClick={() => action.mutate(searching ? "cancel" : "quick")}>{searching ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cancel search</> : "Find opponent"}</Button>
        </div> : <div className="space-y-4 py-3">
          <Button className="w-full" disabled={action.isPending} onClick={() => action.mutate("create")}>Create room</Button>
          <div className="flex gap-2"><Input aria-label="Secret room code" placeholder="Secret room code" value={code} maxLength={8} onChange={(e) => setCode(e.target.value.toUpperCase())} /><Button variant="outline" disabled={action.isPending || code.trim().length !== 8} onClick={() => action.mutate("join")}>Join</Button></div>
        </div>}
      </DialogContent>
    </Dialog>
    {battleId && <LiveBattle battleId={battleId} onDone={() => { setBattleId(null); onClose(); void invites.refetch(); }} />}
  </>;
}

function LiveBattle({ battleId, onDone }: { battleId: string; onDone: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [number, setNumber] = useState("");
  const [now, setNow] = useState(Date.now());
  const [confirmExit, setConfirmExit] = useState(false);
  const state = useQuery({ queryKey: ["quiz-live-battle", battleId], queryFn: () => battleGet(battleId), refetchInterval: (q) => q.state.data?.battle.status === "finished" || q.state.data?.battle.status === "cancelled" ? false : 1000, retry: false });
  const current = state.data?.current;
  useEffect(() => { setSelected([]); setNumber(""); }, [current?.seq]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 250); const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { window.clearInterval(timer); document.body.style.overflow = previous; }; }, []);
  const change = useMutation({
    mutationFn: async (kind: "ready" | "answer" | "leave") => {
      const result = kind === "ready" ? await supabase.rpc("quiz_battle_ready", { _bid: battleId, _ready: true })
        : kind === "leave" ? await supabase.rpc("quiz_battle_leave", { _bid: battleId })
          : await supabase.rpc("quiz_battle_answer", { _bid: battleId, _seq: current?.seq ?? 0, _selected: selected, _numerical: number.trim() ? Number(number) : null as unknown as number });
      if (result.error) throw result.error;
      if (kind === "answer") { const response = result.data as unknown as { accepted: boolean; reason?: string }; if (!response.accepted) throw new Error(response.reason === "already_answered" ? "Your answer was already saved." : "This question has closed. Your answer was not saved."); }
      return kind;
    }, onSuccess: (kind) => { if (kind === "leave") onDone(); else void state.refetch(); }, onError: (e) => toast.error(e.message),
  });
  const battle = state.data?.battle;
  const offset = state.data ? new Date(state.data.server_now).getTime() - state.dataUpdatedAt : 0;
  const remaining = Math.max(0, Math.ceil((new Date(current?.closes_at ?? battle?.starts_at ?? "").getTime() - now - offset) / 1000)) || 0;
  const numeric = current && ["integer", "numerical", "range"].includes(current.qtype);
  const ended = battle?.status === "finished" || battle?.status === "cancelled";
  return <div className="fixed inset-0 z-[2147483000] flex h-dvh flex-col bg-background text-foreground">
    <header className="shrink-0 border-b border-border bg-card px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]"><div className="mx-auto flex max-w-3xl items-center justify-between gap-3"><h1 className="font-bold">Live Battle</h1><Button size="icon" variant="ghost" aria-label="Exit live battle" onClick={() => ended ? onDone() : setConfirmExit(true)}><X className="h-5 w-5" /></Button></div></header>
    <main className="min-h-0 flex-1 overflow-y-auto p-4"><div className="mx-auto max-w-3xl space-y-5">
      {state.isPending && <p role="status" className="py-12 text-center">Connecting to your battle…</p>}
      {state.error && <div role="alert" className="space-y-3"><p className="text-destructive">{state.error.message}</p><Button variant="outline" onClick={() => state.refetch()}>Reconnect</Button></div>}
      <div className="grid grid-cols-2 gap-3">{state.data?.players.map((p) => <div key={p.is_me ? "me" : "opponent"} className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3">{p.profile.avatar_url && <img src={p.profile.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />}<div className="min-w-0"><p className="truncate text-sm font-semibold">{p.is_me ? "You" : p.profile.name}</p><p className="text-xs text-muted-foreground">{p.score} points · {p.online ? "Online" : "Reconnecting"}</p></div></div>)}</div>
      {battle?.status === "lobby" && <div className="space-y-4 py-6 text-center">
        {battle.join_code && <><p className="text-sm text-muted-foreground">Room code</p><p className="font-mono text-3xl font-bold">{battle.join_code}</p><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(battle.join_code ?? ""); toast.success("Room code copied"); } catch { toast.error("Could not copy. Select the room code instead."); } }}><Copy className="mr-2 h-4 w-4" />Copy code</Button></>}
        <p className="text-sm text-muted-foreground">{state.data?.players.length === 1 ? "Waiting for your opponent…" : "Both players must be ready."}</p>
        <Button disabled={change.isPending || state.data?.players.find((p) => p.is_me)?.ready} onClick={() => change.mutate("ready")}>{state.data?.players.find((p) => p.is_me)?.ready ? "Ready · waiting" : "I'm ready"}</Button>
      </div>}
      {battle?.status === "countdown" && <div className="py-12 text-center"><p className="text-muted-foreground">Starting in</p><p className="mt-3 text-5xl font-bold tabular-nums">{remaining}</p></div>}
      {current && <>
        <div className="flex justify-between text-sm font-semibold"><span>Question {current.seq} / {current.total}</span><span className="tabular-nums">{current.closed ? "Round complete" : `${remaining}s`}</span></div>
        <div className="text-base leading-8"><MathText text={current.snapshot.text} /></div>
        {current.snapshot.image_url && <img src={current.snapshot.image_url} alt="Question diagram" className="max-h-72 w-full object-contain" />}
        {numeric ? <Input aria-label="Numerical answer" type="number" step={current.qtype === "integer" ? "1" : "any"} value={number} disabled={current.closed || current.my_answered} onChange={(e) => setNumber(e.target.value)} /> : <div className="space-y-3">{current.snapshot.options.map((option) => <Button key={option.id} variant="outline" aria-pressed={selected.includes(option.id)} disabled={current.closed || current.my_answered || change.isPending} className={`h-auto min-h-14 w-full justify-start whitespace-normal px-4 py-3 text-left ${selected.includes(option.id) ? "border-primary bg-primary/10" : ""} ${current.reveal?.key.correct_option_ids?.includes(option.id) ? "border-primary" : ""}`} onClick={() => setSelected((old) => current.qtype === "multiple" ? old.includes(option.id) ? old.filter((id) => id !== option.id) : [...old, option.id] : [option.id])}><span className="mr-3 font-bold">{option.label}</span><MathText text={option.text} /></Button>)}</div>}
        {!current.closed && <Button className="w-full" disabled={current.my_answered || change.isPending || (numeric ? !number.trim() || !Number.isFinite(Number(number)) || (current.qtype === "integer" && !Number.isInteger(Number(number))) : !selected.length)} onClick={() => change.mutate("answer")}>{current.my_answered ? "Answer saved · waiting for opponent" : change.isPending ? "Saving…" : "Lock answer"}</Button>}
        {current.closed && current.reveal?.key.explanation && <div className="rounded-lg bg-muted p-4 text-sm"><MathText text={current.reveal.key.explanation} /></div>}
        {current.closed && numeric && <p className="text-sm text-muted-foreground">Correct answer: {current.reveal?.key.correct_numerical ?? "See solution"}</p>}
      </>}
      {ended && <div className="space-y-4 py-8 text-center"><Swords className="mx-auto h-10 w-10 text-primary" /><h2 className="text-2xl font-bold">{battle?.status === "cancelled" ? "Battle cancelled" : battle?.winner === "me" ? "You won!" : battle?.winner === "draw" ? "It's a draw" : "Battle complete"}</h2><p className="text-muted-foreground">{state.data?.players.find((p) => p.is_me)?.score ?? 0} points · +{state.data?.players.find((p) => p.is_me)?.xp_awarded ?? 0} XP</p><Button onClick={onDone}>Back to Arena</Button></div>}
    </div></main>
    <Dialog open={confirmExit} onOpenChange={setConfirmExit}><DialogContent><DialogHeader><DialogTitle>Leave this battle?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Leaving an active match counts as a forfeit.</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirmExit(false)}>Stay</Button><Button variant="destructive" disabled={change.isPending} onClick={() => change.mutate("leave")}>Leave battle</Button></div></DialogContent></Dialog>
  </div>;
}