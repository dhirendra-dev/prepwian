import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Plus, Trash2, UserPlus } from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { fmtMinutes, uid, updateFocusZone, useFocusZone } from "@/lib/focus-zone";

export const Route = createFileRoute("/focus/friends")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Friends — Focus Zone" },
      { name: "twitter:description", content: "Streaks, today's focus minutes and live progress for your study circle." },
      { title: "Friends — Focus Zone" },
      {
        name: "description",
        content: "Keep a private accountability list: friends' streaks, minutes focused today and what they're working on right now.",
      },
      { property: "og:title", content: "Friends — Focus Zone" },
      { property: "og:description", content: "Streaks, today's focus minutes and live progress for your study circle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FriendsPage,
});

function FriendsPage() {
  const { state } = useFocusZone();
  const [name, setName] = useState("");

  if (!state) return <div className="h-48 animate-pulse rounded-2xl bg-muted/40" />;

  const add = () => {
    const n = name.trim();
    if (n.length < 2) return;
    updateFocusZone((s) => ({
      ...s,
      friends: [
        ...s.friends,
        { id: uid(), name: n, handle: `@${n.toLowerCase().replace(/\s+/g, "")}`, streak: 0, todayMin: 0, ongoing: null },
      ],
    }));
    setName("");
  };

  return (
    <div className="space-y-3">
      <GlassSurface className="p-4">
        <h1 className="font-display text-xl font-bold">Friends</h1>
        <p className="text-sm text-muted-foreground">An accountability list you keep yourself — nothing is shared anywhere.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Friend's name"
            className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background/50 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            onClick={add}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform active:scale-95"
          >
            <UserPlus className="h-4 w-4" /> Add friend
          </button>
        </div>
      </GlassSurface>

      <ul className="grid gap-3 sm:grid-cols-2">
        {state.friends.map((f) => (
          <GlassSurface as="li" key={f.id} className="p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {f.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{f.name}</p>
                <p className="truncate text-xs text-muted-foreground">{f.handle}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                <Flame className="h-4 w-4 text-orange-500" /> {f.streak}
              </span>
              <button
                aria-label={`Remove ${f.name}`}
                onClick={() => updateFocusZone((s) => ({ ...s, friends: s.friends.filter((x) => x.id !== f.id) }))}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Today: {fmtMinutes(f.todayMin)}</span>
              <button
                onClick={() =>
                  updateFocusZone((s) => ({
                    ...s,
                    friends: s.friends.map((x) => (x.id === f.id ? { ...x, todayMin: x.todayMin + 15 } : x)),
                  }))
                }
                className="flex items-center gap-1 rounded-lg border border-border/70 px-2 py-1 font-semibold transition-colors hover:bg-muted/60"
              >
                <Plus className="h-3 w-3" /> 15m
              </button>
            </div>

            {f.ongoing !== null && (
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${f.ongoing}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Currently focusing — {f.ongoing}%</p>
              </div>
            )}
          </GlassSurface>
        ))}
      </ul>
    </div>
  );
}
