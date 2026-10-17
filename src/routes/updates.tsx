import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, History, Search, Sparkles } from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import {
  changelog,
  formatChangeDate,
  kindMeta,
  totalChangeCount,
  totalReleaseDayCount,
  type ChangeKind,
} from "@/lib/changelog";

export const Route = createFileRoute("/updates")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Updates & Change History — JEE Prep Hub" },
      { name: "twitter:description", content: "Day-by-day history of everything that changed on JEE Prep Hub." },

      { title: "Updates & Change History — JEE Prep Hub" },
      {
        name: "description",
        content:
          "Recorded JEE Prep Hub changes, grouped by day — new features, improvements, fixes, security work and design updates.",
      },
      { property: "og:title", content: "Updates & Change History — JEE Prep Hub" },
      {
        property: "og:description",
        content: "Day-by-day history of everything that changed on JEE Prep Hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UpdatesPage,
});

const filters: Array<{ value: "all" | ChangeKind; label: string }> = [
  { value: "all", label: "Everything" },
  { value: "feature", label: "New" },
  { value: "improvement", label: "Improved" },
  { value: "fix", label: "Fixed" },
  { value: "design", label: "Design" },
  { value: "security", label: "Security" },
];

function UpdatesPage() {
  const [kind, setKind] = useState<"all" | ChangeKind>("all");
  const [q, setQ] = useState("");

  const days = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return changelog
      .map((day) => ({
        ...day,
        items: day.items.filter((it) => {
          if (kind !== "all" && it.kind !== kind) return false;
          if (!needle) return true;
          return `${it.title} ${it.detail ?? ""} ${it.area ?? ""} ${it.commit ?? ""}`
            .toLowerCase()
            .includes(needle);
        }),
      }))
      .filter((day) => day.items.length > 0);
  }, [kind, q]);

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-2 sm:px-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Home
        </Link>

        <header className="mt-4">
          <span className="inline-flex items-center gap-2 glass-surface rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <History className="h-3.5 w-3.5" /> Change history
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
            <span className="text-liquid">Everything</span> that changed
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            {totalChangeCount()} updates across {totalReleaseDayCount()} dates with recorded
            changes. Newest first — search or filter by category, text, or commit hash.
          </p>
        </header>

        <GlassSurface className="mt-6 p-3">
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search updates — timer, pulse, security…"
              aria-label="Search updates"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setKind(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  kind === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </GlassSurface>

        {days.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">No updates match that search yet.</p>
        ) : (
          <ol className="relative mt-8 space-y-5 border-l border-border/60 pl-5">
            {days.map((day, i) => (
              <li key={day.date} className="relative">
                <span
                  className={`absolute -left-[27px] top-4 h-3 w-3 rounded-full border-2 border-background ${
                    i === 0 ? "bg-accent" : "bg-border"
                  }`}
                />
                <GlassSurface className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <time className="font-display text-sm font-bold">
                      {formatChangeDate(day.date)}
                    </time>
                    {day.version && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {day.version}
                      </span>
                    )}
                    {i === 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                        <Sparkles className="h-3 w-3" /> Latest
                      </span>
                    )}
                  </div>
                  {day.headline && (
                    <h2 className="mt-1 font-display text-lg font-semibold sm:text-xl">
                      {day.headline}
                    </h2>
                  )}

                  <ul className="mt-3 space-y-3">
                    {day.items.map((it) => (
                      <li
                        key={it.commit ?? it.title}
                        className="flex flex-col gap-1 rounded-xl bg-muted/25 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${kindMeta[it.kind].className}`}
                          >
                            {kindMeta[it.kind].label}
                          </span>
                          {it.area && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {it.area}
                            </span>
                          )}
                          {it.commit && (
                            <a
                              href={`https://github.com/dhirendra-dev/prepwian/commit/${it.commit}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`View commit ${it.commit} on GitHub`}
                              className="font-mono text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                            >
                              {it.commit}
                            </a>
                          )}
                        </div>
                        <p className="text-sm font-semibold leading-snug">{it.title}</p>
                        {it.detail && <p className="text-xs text-muted-foreground">{it.detail}</p>}
                      </li>
                    ))}
                  </ul>
                </GlassSurface>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
