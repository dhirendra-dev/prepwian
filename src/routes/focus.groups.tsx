import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Plus, Target, Trash2, Users } from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { fmtMinutes, rangeStats, uid, updateFocusZone, useFocusZone } from "@/lib/focus-zone";

export const Route = createFileRoute("/focus/groups")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Groups — Focus Zone" },
      { name: "twitter:description", content: "Shared study goals with hour tracking and member lists." },
      { title: "Groups — Focus Zone" },
      {
        name: "description",
        content: "Set a shared study goal, track logged hours against it and keep a member list — all offline in Focus Zone groups.",
      },
      { property: "og:title", content: "Groups — Focus Zone" },
      { property: "og:description", content: "Shared study goals with hour tracking and member lists." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroupsPage,
});

const code = () => Math.random().toString(36).slice(2, 10).toUpperCase();

function GroupsPage() {
  const { state } = useFocusZone();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  if (!state) return <div className="h-48 animate-pulse rounded-2xl bg-muted/40" />;

  const stats = rangeStats(state.sessions, 7);
  const max = Math.max(1, ...stats.rows.map((r) => r.minutes));

  const add = () => {
    const n = name.trim();
    if (n.length < 2) return;
    updateFocusZone((s) => ({
      ...s,
      groups: [
        ...s.groups,
        {
          id: uid(),
          name: n,
          code: code(),
          goal: goal.trim() || "Finish this week's syllabus",
          goalHours: 10,
          hoursLogged: 0,
          members: [{ id: "me", name: "You", handle: "@you", role: "owner" }],
        },
      ],
    }));
    setName("");
    setGoal("");
  };

  return (
    <div className="space-y-3">
      <GlassSurface className="p-4">
        <h1 className="font-display text-xl font-bold">Groups</h1>
        <p className="text-sm text-muted-foreground">Create a study group, set its goal and watch the hours stack up.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background/50 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Goal (optional)"
            className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background/50 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            onClick={add}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" /> Create
          </button>
        </div>
      </GlassSurface>

      {state.groups.map((g) => {
        const logged = g.hoursLogged + stats.total / 60;
        const pct = Math.min(100, (logged / Math.max(1, g.goalHours)) * 100);
        return (
          <GlassSurface key={g.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold">{g.name}</h2>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {g.members.length} member{g.members.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    void navigator.clipboard?.writeText(g.code);
                    setCopied(g.id);
                    setTimeout(() => setCopied(null), 1500);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-border/70 px-3 py-1.5 font-mono text-xs font-semibold transition-colors hover:bg-muted/60"
                >
                  <Copy className="h-3.5 w-3.5" /> {copied === g.id ? "Copied" : g.code}
                </button>
                <button
                  aria-label={`Delete ${g.name}`}
                  onClick={() => updateFocusZone((s) => ({ ...s, groups: s.groups.filter((x) => x.id !== g.id) }))}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-end gap-1.5">
              {stats.rows.map((r) => (
                <div key={r.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-28 w-full items-end justify-center rounded-lg bg-muted/40">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-primary/60 to-primary transition-all"
                      style={{ height: `${Math.max(4, (r.minutes / max) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(`${r.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "narrow" })}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-border/70 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Target className="h-4 w-4 text-primary" /> {g.goal}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {fmtMinutes(logged * 60)} / {g.goalHours}h
                </span>
              </div>
            </div>

            <ul className="mt-3 space-y-1.5">
              {g.members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {m.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{m.name}</span>
                  <span className="shrink-0 text-xs capitalize text-muted-foreground">{m.role}</span>
                </li>
              ))}
            </ul>
          </GlassSurface>
        );
      })}
    </div>
  );
}
