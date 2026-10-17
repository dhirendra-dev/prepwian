import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Ban, Lock, LockOpen, Plus, Trash2 } from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { uid, updateFocusZone, useFocusZone } from "@/lib/focus-zone";

export const Route = createFileRoute("/focus/block")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Distraction Block — Focus Zone" },
      { name: "twitter:description", content: "Curate a blocklist and toggle focus lock during deep work." },
      { title: "Distraction Block — Focus Zone" },
      {
        name: "description",
        content: "Pick the sites that derail your study sessions and switch focus lock on so Focus Zone reminds you the moment you drift.",
      },
      { property: "og:title", content: "Distraction Block — Focus Zone" },
      { property: "og:description", content: "Curate a blocklist and toggle focus lock during deep work." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlockPage,
});

function BlockPage() {
  const { state } = useFocusZone();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  if (!state) return <div className="h-48 animate-pulse rounded-2xl bg-muted/40" />;

  const add = () => {
    const l = label.trim();
    if (l.length < 2) return;
    updateFocusZone((s) => ({
      ...s,
      blocked: [...s.blocked, { id: uid(), label: l, url: url.trim() || l.toLowerCase(), enabled: true }],
    }));
    setLabel("");
    setUrl("");
  };

  const activeCount = state.blocked.filter((b) => b.enabled).length;

  return (
    <div className="space-y-3">
      <GlassSurface className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold">Distraction Block</h1>
            <p className="text-sm text-muted-foreground">
              {activeCount} of {state.blocked.length} sites on your blocklist
            </p>
          </div>
          <button
            onClick={() => updateFocusZone((s) => ({ ...s, lockEnabled: !s.lockEnabled }))}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
              state.lockEnabled ? "border-primary/50 bg-primary/15 text-primary" : "border-border/70 hover:bg-muted/60"
            }`}
          >
            {state.lockEnabled ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            {state.lockEnabled ? "Lock enabled" : "Enable lock"}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Site name"
            className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background/50 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com/feed"
            className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background/50 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            onClick={add}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </GlassSurface>

      <ul className="grid gap-2 sm:grid-cols-2">
        {state.blocked.map((b) => (
          <GlassSurface as="li" key={b.id} className="flex items-center gap-3 p-3.5">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                b.enabled ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
              }`}
            >
              <Ban className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{b.label}</p>
              <p className="truncate text-xs text-muted-foreground">{b.url}</p>
            </div>
            <button
              role="switch"
              aria-checked={b.enabled}
              aria-label={`Toggle blocking for ${b.label}`}
              onClick={() =>
                updateFocusZone((s) => ({
                  ...s,
                  blocked: s.blocked.map((x) => (x.id === b.id ? { ...x, enabled: !x.enabled } : x)),
                }))
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${b.enabled ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${b.enabled ? "left-[22px]" : "left-0.5"}`}
              />
            </button>
            <button
              aria-label={`Remove ${b.label}`}
              onClick={() => updateFocusZone((s) => ({ ...s, blocked: s.blocked.filter((x) => x.id !== b.id) }))}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </GlassSurface>
        ))}
      </ul>

      <p className="text-center text-xs text-muted-foreground">
        Focus lock is a self-discipline reminder inside Focus Zone — it doesn&apos;t change your browser settings.
      </p>
    </div>
  );
}
