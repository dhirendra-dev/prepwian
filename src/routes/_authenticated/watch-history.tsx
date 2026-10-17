import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Loader2, History, PlayCircle } from "lucide-react";
import { getMyWatchProgress } from "@/lib/pulse.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/watch-history")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Watch History — JEE Prep Hub" },
      { name: "twitter:description", content: "Resume any lecture exactly where you left off." },

      { title: "Watch History — JEE Prep Hub" },
      { name: "description", content: "Every lecture you have watched on Pulse, with how far you got and quick links to resume." },
      { property: "og:title", content: "Watch History — JEE Prep Hub" },
      { property: "og:description", content: "Resume any lecture exactly where you left off." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: WatchHistoryPage,
});

type Lecture = { id: string; title: string; youtube_video_id: string; subject: string | null; chapter: string | null };

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function WatchHistoryPage() {
  const progress = useQuery({ queryKey: ["my-watch-progress"], queryFn: () => getMyWatchProgress() });

  const videos = useQuery({
    queryKey: ["watch-history-videos", (progress.data ?? []).map((p) => p.video_id).join(",")],
    enabled: !!progress.data?.length,
    queryFn: async (): Promise<Lecture[]> => {
      const ids = (progress.data ?? []).map((p) => p.video_id);
      const { data } = await supabase
        .from("video_lectures")
        .select("id, title, youtube_video_id, subject, chapter")
        .in("id", ids);
      return (data ?? []) as Lecture[];
    },
  });

  const map = new Map((videos.data ?? []).map((v) => [v.id, v]));
  const rows = (progress.data ?? []).flatMap((p) => {
    const v = map.get(p.video_id);
    return v ? [{ ...p, video: v }] : [];
  });

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-amber-500" />
            <h1 className="font-display text-xl font-bold sm:text-2xl">Watch history</h1>
          </div>
          <Link to="/pulse" className="text-xs text-muted-foreground hover:underline">← Back to Pulse</Link>
        </div>

        {progress.isLoading || videos.isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            You haven’t watched any lectures yet. <Link to="/pulse" className="text-primary hover:underline">Open Pulse</Link>
          </Card>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const pct = r.duration_seconds ? Math.min(100, Math.round((r.position_seconds / r.duration_seconds) * 100)) : null;
              return (
                <li key={r.video_id}>
                  <Card className="flex items-center gap-3 p-3">
                    <img
                      src={`https://i.ytimg.com/vi/${r.video.youtube_video_id}/mqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="h-14 w-24 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{r.video.title}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {r.video.subject}{r.video.chapter ? ` · ${r.video.chapter}` : ""} · watched {fmt(r.position_seconds)}
                        {pct !== null ? ` (${pct}%)` : ""}
                        {r.completed ? " · completed" : ""}
                      </div>
                      {pct !== null && (
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                    <Link
                      to="/pulse"
                      search={{ v: r.video.id } as never}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
                    >
                      <PlayCircle className="h-4 w-4" /> Resume
                    </Link>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
