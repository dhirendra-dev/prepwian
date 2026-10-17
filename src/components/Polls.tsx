import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BarChart3, Plus, Trash2, X, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { haptic } from "@/lib/haptics";

type PollOption = { id: string; text: string };
type Poll = {
  id: string;
  location: "community" | "notice";
  question: string;
  options: PollOption[];
  multi: boolean;
  closes_at: string | null;
  created_by: string;
  created_at: string;
};
type Vote = { poll_id: string; user_id: string; option_id: string };

export function Polls({
  location,
  adminOnly = false,
  isAdmin = false,
}: {
  location: "community" | "notice";
  adminOnly?: boolean;
  isAdmin?: boolean;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showComposer, setShowComposer] = useState(false);

  const pollsQ = useQuery({
    queryKey: ["polls", location],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("location", location)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Poll[];
    },
  });

  const votesQ = useQuery({
    queryKey: ["poll-votes", location, pollsQ.data?.map((p) => p.id).join(","), user?.id],
    enabled: !!pollsQ.data && pollsQ.data.length > 0 && !!user,
    queryFn: async () => {
      const ids = pollsQ.data!.map((p) => p.id);
      // Aggregate tallies only — individual voters are never exposed. Signed-in users only.
      const { data: counts, error } = await supabase.rpc("poll_vote_counts", { _poll_ids: ids });
      if (error) throw error;

      let mine: { poll_id: string; option_id: string }[] = [];
      if (user) {
        const { data: own } = await supabase
          .from("poll_votes")
          .select("poll_id,option_id")
          .in("poll_id", ids)
          .eq("user_id", user.id);
        mine = own ?? [];
      }
      const rows: Vote[] = [];
      (counts ?? []).forEach((c: any) => {
        const isMine = mine.some((m) => m.poll_id === c.poll_id && m.option_id === c.option_id);
        for (let i = 0; i < Number(c.votes); i++) {
          rows.push({
            poll_id: c.poll_id,
            option_id: c.option_id,
            user_id: isMine && i === 0 ? (user!.id as string) : "",
          } as Vote);
        }
      });
      return rows;
    },
  });


  useEffect(() => {
    const ch = supabase
      .channel(`polls-${location}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "polls", filter: `location=eq.${location}` }, () => {
        qc.invalidateQueries({ queryKey: ["polls", location] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, () => {
        qc.invalidateQueries({ queryKey: ["poll-votes", location] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [location, qc]);

  const canCompose = user && (!adminOnly || isAdmin);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <BarChart3 className="h-4 w-4 text-primary" /> Polls
        </h3>
        {canCompose && (
          <Button size="sm" variant={showComposer ? "ghost" : "outline"} onClick={() => setShowComposer((v) => !v)}>
            {showComposer ? <X className="h-4 w-4" /> : <><Plus className="mr-1 h-4 w-4" /> New poll</>}
          </Button>
        )}
      </div>

      {showComposer && canCompose && (
        <PollComposer
          location={location}
          onDone={() => {
            setShowComposer(false);
            qc.invalidateQueries({ queryKey: ["polls", location] });
          }}
        />
      )}

      {pollsQ.isLoading && <p className="text-xs text-muted-foreground">Loading polls…</p>}
      {pollsQ.data && pollsQ.data.length === 0 && (
        <p className="rounded-xl border border-dashed border-border bg-card p-4 text-center text-xs text-muted-foreground">
          No polls yet{canCompose ? " — start one!" : "."}
        </p>
      )}

      <div className="space-y-3">
        {pollsQ.data?.map((p) => (
          <PollCard
            key={p.id}
            poll={p}
            votes={(votesQ.data ?? []).filter((v) => v.poll_id === p.id)}
            currentUserId={user?.id ?? null}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  );
}

function PollComposer({ location, onDone }: { location: "community" | "notice"; onDone: () => void }) {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [multi, setMulti] = useState(false);
  const [closesAt, setClosesAt] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) {
      toast.error("Add a question and at least 2 options");
      return;
    }
    if (!user) return;
    setBusy(true);
    const payload = {
      location,
      question: q,
      options: opts.map((text, i) => ({ id: `o${i}_${Math.random().toString(36).slice(2, 7)}`, text })),
      multi,
      closes_at: closesAt ? new Date(closesAt).toISOString() : null,
      created_by: user.id,
    };
    const { error } = await supabase.from("polls").insert(payload);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    haptic("success");
    toast.success("Poll created");
    onDone();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="space-y-3">
        <Input
          placeholder="Ask a question…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={200}
        />
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => setOptions((arr) => arr.map((o, j) => (j === i ? e.target.value : o)))}
                maxLength={120}
              />
              {options.length > 2 && (
                <Button variant="ghost" size="icon" onClick={() => setOptions((arr) => arr.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          {options.length < 8 && (
            <Button variant="outline" size="sm" onClick={() => setOptions((arr) => [...arr, ""])}>
              <Plus className="mr-1 h-3 w-3" /> Add option
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="multi" checked={multi} onCheckedChange={setMulti} />
            <Label htmlFor="multi" className="cursor-pointer text-xs">Allow multiple answers</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="closes" className="text-xs text-muted-foreground">Closes</Label>
            <Input
              id="closes"
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="h-8 w-auto text-xs"
            />
          </div>
        </div>
        <Button onClick={submit} disabled={busy} className="w-full sm:w-auto">
          {busy ? "Publishing…" : "Publish poll"}
        </Button>
      </div>
    </div>
  );
}

function PollCard({
  poll,
  votes,
  currentUserId,
  isAdmin,
}: {
  poll: Poll;
  votes: Vote[];
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const qc = useQueryClient();
  const closed = !!poll.closes_at && new Date(poll.closes_at).getTime() < Date.now();
  const myVotes = useMemo(
    () => new Set(votes.filter((v) => v.user_id === currentUserId).map((v) => v.option_id)),
    [votes, currentUserId],
  );
  const totals = useMemo(() => {
    const m = new Map<string, number>();
    votes.forEach((v) => m.set(v.option_id, (m.get(v.option_id) ?? 0) + 1));
    return m;
  }, [votes]);
  const total = votes.length;

  const vote = useMutation({
    mutationFn: async (optionId: string) => {
      if (!currentUserId) throw new Error("Sign in to vote");
      if (closed) throw new Error("Poll closed");
      const already = myVotes.has(optionId);
      if (already) {
        const { error } = await supabase
          .from("poll_votes")
          .delete()
          .eq("poll_id", poll.id)
          .eq("user_id", currentUserId)
          .eq("option_id", optionId);
        if (error) throw error;
        return;
      }
      if (!poll.multi && myVotes.size > 0) {
        const { error: delErr } = await supabase
          .from("poll_votes")
          .delete()
          .eq("poll_id", poll.id)
          .eq("user_id", currentUserId);
        if (delErr) throw delErr;
      }
      const { error } = await supabase
        .from("poll_votes")
        .insert({ poll_id: poll.id, user_id: currentUserId, option_id: optionId });
      if (error) throw error;
    },
    onSuccess: () => {
      haptic("light");
      qc.invalidateQueries({ queryKey: ["poll-votes", poll.location] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("polls").delete().eq("id", poll.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Poll deleted");
      qc.invalidateQueries({ queryKey: ["polls", poll.location] });
    },
  });

  const canDelete = currentUserId === poll.created_by || isAdmin;

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{poll.question}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>{formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}</span>
            {poll.multi && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Multi-select</span>}
            {poll.closes_at && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {closed ? "Closed" : `Closes ${formatDistanceToNow(new Date(poll.closes_at), { addSuffix: true })}`}
              </span>
            )}
            <span>· {total} {total === 1 ? "vote" : "votes"}</span>
          </div>
        </div>
        {canDelete && (
          <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this poll?")) remove.mutate(); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>

      {total > 0 && (() => {
        const palette = [
          "bg-primary",
          "bg-secondary",
          "bg-accent",
          "bg-chart-1",
          "bg-chart-2",
          "bg-chart-3",
          "bg-chart-4",
          "bg-chart-5",
        ];
        const ranked = poll.options
          .map((o, i) => ({
            ...o,
            count: totals.get(o.id) ?? 0,
            pct: Math.round(((totals.get(o.id) ?? 0) / total) * 100),
            color: palette[i % palette.length],
          }))
          .sort((a, b) => b.count - a.count);
        const leader = ranked[0];
        return (
          <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate font-medium text-foreground">
                Leading: <span className="text-primary">{leader.text}</span> ({leader.pct}%)
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {total} {total === 1 ? "vote" : "votes"}
              </span>
            </div>
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-background">
              {ranked.map((o) =>
                o.count > 0 ? (
                  <div
                    key={o.id}
                    className={`${o.color} h-full`}
                    style={{ width: `${o.pct}%` }}
                    title={`${o.text}: ${o.pct}%`}
                  />
                ) : null,
              )}
            </div>
          </div>
        );
      })()}



      <div className="mt-3 space-y-2">
        {poll.options.map((opt) => {
          const count = totals.get(opt.id) ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const selected = myVotes.has(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => vote.mutate(opt.id)}
              disabled={!currentUserId || closed || vote.isPending}
              className={`group relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition ${
                selected ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
              } disabled:cursor-not-allowed`}
            >
              <div
                className={`absolute inset-y-0 left-0 transition-all ${selected ? "bg-primary/20" : "bg-muted"}`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 truncate font-medium">
                  {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                  {opt.text}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{pct}% · {count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {!currentUserId && (
        <p className="mt-2 text-[11px] text-muted-foreground">Sign in to vote.</p>
      )}
    </article>
  );
}
