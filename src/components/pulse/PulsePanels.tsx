import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Award, ChevronRight, Loader2, Trophy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getTestPointsLeaderboard } from "@/lib/scheduled-tests.functions";

/**
 * In-app Pulse panels. The bottom nav switches these in place instead of
 * navigating away to the standard (non-Pulse) pages, so the custom Pulse
 * look and feel is preserved end-to-end.
 */

function PanelShell({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="pl-mono mb-2" style={{ fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--pl-faint)" }}>
        {title}
      </h2>
      {hint && <p className="mb-2.5" style={{ fontSize: 12.5, color: "var(--pl-muted)" }}>{hint}</p>}
      {children}
    </section>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--pl-muted)" }} />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="pl-card p-5 text-center" style={{ fontSize: 13, color: "var(--pl-muted)" }}>{text}</p>;
}

export function PulseSquadsPanel({ userId }: { userId: string | null }) {
  const squads = useQuery({
    queryKey: ["pulse-squads", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id, role")
        .eq("user_id", userId!);
      const ids = (memberships ?? []).map((m) => m.group_id);
      if (!ids.length) return [] as { id: string; name: string; description: string | null; role: string }[];
      const { data: groups } = await supabase
        .from("groups")
        .select("id, name, description")
        .in("id", ids);
      const roleMap = new Map((memberships ?? []).map((m) => [m.group_id, m.role as string]));
      return (groups ?? []).map((g) => ({ ...g, role: roleMap.get(g.id) ?? "member" }));
    },
  });

  if (!userId) return <Empty text="Sign in to see your squads." />;
  if (squads.isLoading) return <Spinner />;

  return (
    <PanelShell title="Your squads" hint="Group chats, shared files and study sprints.">
      {(squads.data ?? []).length === 0 ? (
        <Empty text="You're not in a squad yet." />
      ) : (
        <div className="space-y-2.5">
          {squads.data!.map((g, i) => (
            <Link
              key={g.id}
              to="/squad/$groupId"
              params={{ groupId: g.id }}
              className="pl-card animate-rise-in flex items-center gap-3 p-3.5"
              style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px]" style={{ background: "var(--pl-bg-elevated)", color: "var(--pl-maths)" }}>
                <Users className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="pl-head block truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--pl-text)" }}>{g.name}</span>
                <span className="block truncate" style={{ fontSize: 11.5, color: "var(--pl-muted)" }}>
                  {g.description || g.role}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--pl-faint)" }} />
            </Link>
          ))}
        </div>
      )}
      <Link
        to="/groups"
        className="pl-mono mt-3 inline-block rounded-full px-3.5 py-1.5"
        style={{ background: "var(--pl-bg-elevated)", border: "1px solid var(--pl-card-border)", color: "var(--pl-text)", fontSize: 11.5 }}
      >
        Browse all squads
      </Link>
    </PanelShell>
  );
}

export function PulseRanksPanel({ userId }: { userId: string | null }) {
  const ranks = useQuery({
    queryKey: ["pulse-test-ranks"],
    enabled: !!userId,
    queryFn: () => getTestPointsLeaderboard(),
    staleTime: 60_000,
  });

  if (!userId) return <Empty text="Sign in to see the test rank leaderboard." />;
  if (ranks.isLoading) return <Spinner />;

  const rows = ranks.data?.rows ?? [];

  return (
    <PanelShell title="Test rank leaderboard" hint="Points are your best score on every CBT test, added up.">
      {ranks.data?.myRank && (
        <div className="pl-card animate-rise-in animate-mine-glow mb-3 flex items-center gap-3 p-3.5" style={{ borderLeft: "3px solid var(--pl-maths)" }}>
          <Trophy className="h-5 w-5" style={{ color: "var(--pl-maths)" }} />
          <span style={{ fontSize: 13, color: "var(--pl-text)" }}>
            You're <strong>#{ranks.data.myRank}</strong> with {Math.round(Number(ranks.data.me?.total_points ?? 0))} points
          </span>
        </div>
      )}
      {rows.length === 0 ? (
        <Empty text="No test attempts yet." />
      ) : (
        <div className="pl-card divide-y" style={{ borderColor: "var(--pl-card-border)" }}>
          {rows.slice(0, 50).map((r, i) => (
            <div
              key={r.user_id}
              className="animate-rise-in flex items-center gap-3 px-3.5 py-2.5"
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--pl-card-border)", animationDelay: `${Math.min(i, 12) * 40}ms` }}
            >
              <span className="pl-mono w-6 shrink-0" style={{ fontSize: 12, color: i < 3 ? "var(--pl-maths)" : "var(--pl-faint)" }}>#{i + 1}</span>
              <span className="min-w-0 flex-1 truncate" style={{ fontSize: 13, color: "var(--pl-text)" }}>
                {r.full_name || r.username || "Aspirant"}
              </span>
              <span className="pl-mono shrink-0" style={{ fontSize: 12, color: "var(--pl-text)" }}>
                {Math.round(Number(r.total_points ?? 0))} pts
              </span>
            </div>
          ))}
        </div>
      )}
      <Link
        to="/tests/leaderboard"
        className="pl-mono mt-3 inline-block rounded-full px-3.5 py-1.5"
        style={{ background: "var(--pl-bg-elevated)", border: "1px solid var(--pl-card-border)", color: "var(--pl-text)", fontSize: 11.5 }}
      >
        Full leaderboard
      </Link>
    </PanelShell>
  );
}

export function PulseProfilePanel({ userId }: { userId: string | null }) {
  const me = useQuery({
    queryKey: ["pulse-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url, bio, class_level")
        .eq("id", userId!)
        .maybeSingle();
      return data;
    },
  });

  if (!userId) return <Empty text="Sign in to see your profile." />;
  if (me.isLoading) return <Spinner />;

  const links = [
    { to: "/profile", label: "Edit profile" },
    { to: "/watch-history", label: "Watch history" },
    { to: "/certificates", label: "Certificates" },
    { to: "/timer", label: "Focus timer" },
    { to: "/tests", label: "Test series" },
    { to: "/messages", label: "Messages" },
  ] as const;

  return (
    <PanelShell title="You">
      <div className="pl-card animate-rise-in flex items-center gap-3 p-4">
        {me.data?.avatar_url ? (
          <img src={me.data.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--pl-bg-elevated)", color: "var(--pl-maths)", fontSize: 20, fontWeight: 700 }}>
            {(me.data?.full_name ?? "A").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <div className="pl-head truncate" style={{ fontSize: 16, fontWeight: 700, color: "var(--pl-text)" }}>
            {me.data?.full_name ?? "Aspirant"}
          </div>
          <div className="pl-mono truncate" style={{ fontSize: 11.5, color: "var(--pl-muted)" }}>
            {me.data?.username ? `@${me.data.username}` : "No username yet"}
            {me.data?.class_level ? ` · Class ${me.data.class_level}` : ""}
          </div>
        </div>
      </div>
      {me.data?.bio && (
        <p className="mt-2.5 px-1" style={{ fontSize: 13, lineHeight: 1.45, color: "var(--pl-muted)" }}>{me.data.bio}</p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {links.map((l, i) => (
          <Link
            key={l.to}
            to={l.to}
            className="pl-card animate-rise-in flex items-center justify-between gap-2 px-3.5 py-3"
            style={{ fontSize: 12.5, color: "var(--pl-text)", animationDelay: `${i * 45}ms` }}
          >
            {l.label}
            <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--pl-faint)" }} />
          </Link>
        ))}
      </div>
      <Link
        to="/u/$userId"
        params={{ userId }}
        className="pl-mono mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
        style={{ background: "var(--pl-maths)", color: "#10131C", fontSize: 11.5 }}
      >
        <Award className="h-3.5 w-3.5" /> View public profile
      </Link>
    </PanelShell>
  );
}
