import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { AdminBadge } from "@/components/AdminBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Trophy, Zap } from "lucide-react";
import { ListRowSkeleton } from "@/components/Skeletons";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { finalizeWeeklyWinners } from "@/lib/leaderboard.functions";


export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [
      { name: "description", content: "Compare weekly study rankings and leaderboard achievements." },
      { property: "og:title", content: "Leaderboard — PREPWIAN" },
      { property: "og:description", content: "Compare weekly study rankings and leaderboard achievements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Leaderboard — PREPWIAN" },
      { name: "twitter:description", content: "Compare weekly study rankings and leaderboard achievements." },
{ title: "Leaderboard — PREPWIAN" }] }),
  component: Leaderboard,
});

type Row = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  secs: number;
  rank: number | null;
  is_admin: boolean;
};

function Leaderboard() {
  const qc = useQueryClient();
  const weekStart = (() => {
    const now = new Date();
    const day = now.getDay() || 7;
    now.setDate(now.getDate() - day + 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();
  const finalize = useServerFn(finalizeWeeklyWinners);
  useEffect(() => {
    finalize().then(() => qc.invalidateQueries({ queryKey: ["weekly-winners"] })).catch(() => {});
  }, [finalize, qc]);
  useEffect(() => {
    const ch = supabase
      .channel("leaderboard-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "leaderboard_weekly_totals" }, () => {
        qc.invalidateQueries({ queryKey: ["leaderboard-all"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => {
        qc.invalidateQueries({ queryKey: ["leaderboard-all"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard-all"],
    queryFn: async (): Promise<Row[]> => {
      const [sessions, profiles, roles] = await Promise.all([
        supabase.from("leaderboard_weekly_totals").select("user_id,total_seconds").eq("week_start", weekStart),
        supabase.from("profiles").select("id, full_name, avatar_url"),
        supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
      ]);
      const totals = new Map<string, number>();
      ((sessions.data ?? []) as Array<{ user_id: string; total_seconds: number }>).forEach((r) => totals.set(r.user_id, Number(r.total_seconds ?? 0)));
      const adminSet = new Set((roles.data ?? []).map((r) => r.user_id));

      const ranked = (profiles.data ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        secs: totals.get(p.id) ?? 0,
        is_admin: adminSet.has(p.id),
      }));

      ranked.sort((a, b) => b.secs - a.secs || (a.full_name ?? "").localeCompare(b.full_name ?? ""));

      // Privacy: only members who actually have study time (i.e. a rank) are
      // listed. Everyone else stays off the public board entirely.
      let rank = 0;
      return ranked
        .filter((r) => r.secs > 0)
        .map((r) => {
          rank += 1;
          return { ...r, rank };
        });
    },
    refetchInterval: 30_000,
  });

  const me = useQuery({ queryKey: ["me-id"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });
  const myRow = data?.find((r) => r.id === me.data);
  const gap = myRow && data && myRow.rank! > 1 ? data[0].secs - myRow.secs : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-accent" />
          <h1 className="font-display text-2xl font-bold">Weekly Leaderboard</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Monday–Sunday ranking (India time). Pomodoro, stopwatch, and manual study logs all count.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="liquid-glass-card flex items-start gap-3 rounded-2xl border border-border p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning text-warning-foreground"><Crown className="h-5 w-5" /></span>
            <div>
              <div className="font-display font-semibold">#1 at week end wins 7 days of Pro</div>
              <p className="mt-0.5 text-xs text-muted-foreground">Leading mid-week doesn't count — the winner is locked in when the week closes.</p>
            </div>
          </div>
          <WeekCountdown />
        </div>

        {myRow && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <Zap className="h-5 w-5 text-primary" />
            <div className="text-sm">
              You're <b>#{myRow.rank}</b> with {fmt(myRow.secs)}.
              {gap > 0 ? <> {fmt(gap)} behind #1.</> : <> You're leading — hold it until Sunday midnight!</>}
            </div>
          </div>
        )}


        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          {isLoading ? (
            <ListRowSkeleton count={8} />
          ) : !data || data.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No ranked members this week yet — log a focus session to appear here.</div>
          ) : (
            <ul className="divide-y divide-border">
              {data.map((row) => {
                const h = Math.floor(row.secs / 3600);
                const m = Math.floor((row.secs % 3600) / 60);
                const initials = (row.full_name ?? "?").slice(0, 2).toUpperCase();
                const hasRank = row.rank !== null;
                return (
                  <li key={row.id}>
                    <Link
                      to="/u/$userId"
                      params={{ userId: row.id }}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/40"
                    >
                      <div
                        className={`grid h-9 w-9 place-items-center rounded-full font-display text-sm font-bold ${
                          row.rank === 1
                            ? "bg-warning text-warning-foreground"
                            : hasRank && row.rank! < 4
                              ? "bg-accent text-accent-foreground"
                              : hasRank
                                ? "bg-muted text-muted-foreground"
                                : "bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {row.rank === 1 ? <Crown className="h-4 w-4" /> : hasRank ? row.rank : "—"}
                      </div>
                      <Avatar className="h-9 w-9">
                        {row.avatar_url ? <AvatarImage src={row.avatar_url} alt="" /> : null}
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                          {row.full_name ?? "Aspirant"}
                          {row.is_admin && <AdminBadge userId={row.id} />}
                        </p>
                        {!hasRank && <p className="text-[11px] text-muted-foreground">No rank · log a focus session to climb</p>}
                      </div>
                      <div className="text-sm tabular-nums text-muted-foreground">
                        {hasRank ? `${h}h ${m}m` : "0h 0m"}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <WinnerHistory />
      </div>
    </AppShell>
  );
}

function fmt(secs: number) {
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

// Week ends Sunday 23:59:59 IST = Monday 00:00 IST.
function nextWeekEndMs() {
  const IST = 5.5 * 3600_000;
  const n = new Date(Date.now() + IST);
  const day = n.getUTCDay() || 7;
  const monday = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + (8 - day));
  return monday - IST;
}

function WeekCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, nextWeekEndMs() - now);
  const d = Math.floor(left / 86_400_000), h = Math.floor((left % 86_400_000) / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000), s = Math.floor((left % 60_000) / 1000);
  return (
    <div className="liquid-glass-card rounded-2xl border border-border p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">Week closes in</div>
      <div className="mt-1 font-display text-2xl font-bold tabular-nums" suppressHydrationWarning>
        {d}d {String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s
      </div>
      <div className="text-xs text-muted-foreground">Sunday 11:59 PM India time</div>
    </div>
  );
}

function WinnerHistory() {
  const { data } = useQuery({
    queryKey: ["weekly-winners"],
    queryFn: async () => {
      const { data: w } = await supabase.from("weekly_winners" as never).select("week_start,user_id,total_seconds").order("week_start", { ascending: false }).limit(12);
      const rows = (w ?? []) as Array<{ week_start: string; user_id: string; total_seconds: number }>;
      if (!rows.length) return [];
      const { data: p } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", rows.map((r) => r.user_id));
      const map = new Map((p ?? []).map((x) => [x.id, x]));
      return rows.map((r) => ({ ...r, profile: map.get(r.user_id) }));
    },
  });
  return (
    <div className="mt-6">
      <h2 className="font-display text-lg font-semibold">Past winners</h2>
      {!data?.length ? (
        <p className="mt-2 text-sm text-muted-foreground">The first winner will appear here once this week closes.</p>
      ) : (
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {data.map((r) => (
            <li key={r.week_start}>
              <Link to="/u/$userId" params={{ userId: r.user_id }} className="liquid-glass-card flex items-center gap-3 rounded-2xl border border-border p-3 transition hover:bg-muted/40">
                <Avatar className="h-9 w-9">
                  {r.profile?.avatar_url ? <AvatarImage src={r.profile.avatar_url} alt="" /> : null}
                  <AvatarFallback className="text-xs">{(r.profile?.full_name ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.profile?.full_name ?? "Aspirant"}</p>
                  <p className="text-[11px] text-muted-foreground">Week of {new Date(r.week_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {fmt(Number(r.total_seconds))}</p>
                </div>
                <Crown className="h-4 w-4 text-warning" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
