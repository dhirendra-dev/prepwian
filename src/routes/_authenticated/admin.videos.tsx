import { createFileRoute } from "@tanstack/react-router";
import { requireFullAdmin } from "@/lib/admin-guard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listAllVideoLectures, saveVideoLecture, setVideoPublished, deleteVideoLecture,
  searchYouTubeLectures, listSyncedPlaylists, addSyncedPlaylist, deleteSyncedPlaylist, syncPlaylist,
  type VideoLecture,
} from "@/lib/pulse.functions";
import { Eye, ListVideo, Loader2, RefreshCw, Search, Trash2, Video } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/videos")({
  head: () => ({
    meta: [
      { title: "Video Lectures — Admin | JEE Prep Hub" },
      { name: "description", content: "Add, publish and manage the YouTube video lectures that appear in the Pulse feed." },
      { property: "og:title", content: "Video Lectures — Admin" },
      { property: "og:description", content: "Manage Pulse video lectures for JEE Prep Hub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),  beforeLoad: async ({ context }) => {
    await requireFullAdmin(context.user.id);
  },
  component: AdminVideosPage,
});

const SUBJECTS = ["Physics", "Chemistry", "Mathematics"] as const;

/** Accepts a raw 11-char id or any common YouTube URL shape. */
function extractYouTubeId(input: string): string | null {
  const v = input.trim();
  if (/^[\w-]{11}$/.test(v)) return v;
  const m = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

function AdminVideosPage() {
  const qc = useQueryClient();
  const { data: videos, isLoading } = useQuery({
    queryKey: ["admin-video-lectures"],
    queryFn: () => listAllVideoLectures(),
  });

  const [editing, setEditing] = useState<VideoLecture | null>(null);
  const [form, setForm] = useState({
    title: "", url: "", subject: "Physics", chapter: "", description: "", duration: "",
  });

  function reset() {
    setEditing(null);
    setForm({ title: "", url: "", subject: "Physics", chapter: "", description: "", duration: "" });
  }

  const save = useMutation({
    mutationFn: async () => {
      const ytId = extractYouTubeId(form.url);
      if (!ytId) throw new Error("Enter a valid YouTube link or 11-character video ID");
      return saveVideoLecture({
        data: {
          id: editing?.id ?? null,
          title: form.title.trim(),
          youtube_video_id: ytId,
          subject: form.subject as (typeof SUBJECTS)[number],
          chapter: form.chapter.trim(),
          description: form.description.trim() || null,
          duration_minutes: form.duration ? Number(form.duration) : null,
        },
      });
    },
    onSuccess: () => {
      toast.success(editing ? "Lecture updated" : "Lecture added");
      reset();
      qc.invalidateQueries({ queryKey: ["admin-video-lectures"] });
      qc.invalidateQueries({ queryKey: ["pulse-items"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not save the lecture"),
  });

  const togglePublish = useMutation({
    mutationFn: (v: VideoLecture) => setVideoPublished({ data: { id: v.id, published: !v.is_published } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-video-lectures"] });
      qc.invalidateQueries({ queryKey: ["pulse-items"] });
      toast.success("Visibility updated");
    },
    onError: () => toast.error("Could not update visibility"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteVideoLecture({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-video-lectures"] });
      qc.invalidateQueries({ queryKey: ["pulse-items"] });
      toast.success("Lecture deleted");
    },
    onError: () => toast.error("Could not delete the lecture"),
  });

  return (
    <AppShell>
      <div className="space-y-5">
        <header>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Video className="h-5 w-5 text-primary" /> Video Lectures
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Published lectures appear in the Pulse feed alongside community posts.
          </p>
        </header>

        <Card className="p-4">
          <h2 className="text-sm font-semibold">{editing ? "Edit lecture" : "Add a lecture"}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="v-title">Title</Label>
              <Input id="v-title" value={form.title} maxLength={200}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Rotational Motion — Full Chapter Revision" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="v-url">YouTube link or video ID</Label>
              <Input id="v-url" value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://youtu.be/dQw4w9WgXcQ" />
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="v-chapter">Chapter</Label>
              <Input id="v-chapter" value={form.chapter} maxLength={120}
                onChange={(e) => setForm({ ...form, chapter: e.target.value })} placeholder="Rotational Motion" />
            </div>
            <div>
              <Label htmlFor="v-duration">Duration (minutes, optional)</Label>
              <Input id="v-duration" type="number" min={1} value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="48" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="v-desc">Description (optional)</Label>
              <Textarea id="v-desc" rows={2} maxLength={500} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.title || !form.url || !form.chapter}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add lecture"}
            </Button>
            {editing && <Button variant="outline" onClick={reset}>Cancel</Button>}
          </div>
        </Card>

        <TopicSearchCard
          onPick={(pick) => {
            setEditing(null);
            setForm({
              title: pick.title,
              url: pick.videoId,
              subject: pick.subject,
              chapter: pick.topic,
              description: "",
              duration: "",
            });
            toast.success("Filled the form — review and add it");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />

        <PlaylistSyncCard />


        <Card className="overflow-hidden">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading lectures…</p>
          ) : (videos ?? []).length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No lectures yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(videos ?? []).map((v) => (
                <li key={v.id} className="flex items-start gap-3 p-3">
                  <img
                    src={`https://img.youtube.com/vi/${v.youtube_video_id}/default.jpg`}
                    alt="" loading="lazy" className="h-12 w-20 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{v.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{v.subject} · {v.chapter}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant={v.is_published ? "default" : "secondary"}>
                        {v.is_published ? "Published" : "Draft"}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Eye className="h-3 w-3" /> {v.view_count}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => togglePublish.mutate(v)}>
                      {v.is_published ? "Unpublish" : "Publish"}
                    </Button>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEditing(v);
                        setForm({
                          title: v.title, url: v.youtube_video_id, subject: v.subject,
                          chapter: v.chapter, description: v.description ?? "",
                          duration: v.duration_minutes ? String(v.duration_minutes) : "",
                        });
                      }}>Edit</Button>
                      <Button size="sm" variant="ghost" aria-label="Delete lecture"
                        onClick={() => { if (window.confirm("Delete this lecture?")) remove.mutate(v.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

/** Find lectures on YouTube by topic and pre-fill the add form with one click. */
function TopicSearchCard({
  onPick,
}: {
  onPick: (pick: { videoId: string; title: string; subject: (typeof SUBJECTS)[number]; topic: string }) => void;
}) {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("Physics");

  const search = useMutation({
    mutationFn: () => searchYouTubeLectures({ data: { topic: topic.trim(), subject } }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Search failed"),
  });

  return (
    <Card className="p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Search className="h-4 w-4 text-primary" /> Find lectures by topic
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Searches YouTube for JEE lectures on a chapter, then fills the form above.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <div>
          <Label htmlFor="t-topic">Topic / chapter</Label>
          <Input id="t-topic" value={topic} maxLength={120}
            onChange={(e) => setTopic(e.target.value)} placeholder="Thermodynamics" />
        </div>
        <div>
          <Label>Subject</Label>
          <Select value={subject} onValueChange={(v) => setSubject(v as (typeof SUBJECTS)[number])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={() => search.mutate()} disabled={topic.trim().length < 2 || search.isPending}>
            {search.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Search
          </Button>
        </div>
      </div>

      {search.data && search.data.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">No results for that topic.</p>
      )}
      {search.data && search.data.length > 0 && (
        <ul className="mt-3 divide-y divide-border">
          {search.data.map((r) => (
            <li key={r.videoId} className="flex items-start gap-3 py-2.5">
              <img src={r.thumbnail} alt="" loading="lazy" className="h-12 w-20 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">{r.channelTitle}</p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0"
                onClick={() => onPick({ videoId: r.videoId, title: r.title, subject, topic: topic.trim() })}>
                Use
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Accepts a playlist URL or raw playlist id. */
function extractPlaylistId(input: string): string | null {
  const v = input.trim();
  if (/^[\w-]{10,}$/.test(v) && !/^https?:/.test(v)) return v;
  const m = v.match(/[?&]list=([\w-]+)/);
  return m?.[1] ?? null;
}

/** Auto-import every video from a YouTube playlist into the Pulse lecture library. */
function PlaylistSyncCard() {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("Physics");
  const [chapter, setChapter] = useState("");

  const { data: playlists, isLoading } = useQuery({
    queryKey: ["synced-playlists"],
    queryFn: () => listSyncedPlaylists(),
  });

  const add = useMutation({
    mutationFn: async () => {
      const id = extractPlaylistId(url);
      if (!id) throw new Error("Enter a valid YouTube playlist link or ID");
      return addSyncedPlaylist({ data: { playlistId: id, subject, chapter: chapter.trim() || null } });
    },
    onSuccess: () => {
      setUrl(""); setChapter("");
      toast.success("Playlist added — press Sync to import");
      qc.invalidateQueries({ queryKey: ["synced-playlists"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not add the playlist"),
  });

  const sync = useMutation({
    mutationFn: (id: string) => syncPlaylist({ data: { id } }),
    onSuccess: (r) => {
      toast.success(`Imported ${r.added} new lecture${r.added === 1 ? "" : "s"} (${r.skipped} already present)`);
      qc.invalidateQueries({ queryKey: ["synced-playlists"] });
      qc.invalidateQueries({ queryKey: ["admin-video-lectures"] });
      qc.invalidateQueries({ queryKey: ["pulse-items"] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Sync failed");
      qc.invalidateQueries({ queryKey: ["synced-playlists"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSyncedPlaylist({ data: { id } }),
    onSuccess: () => {
      toast.success("Playlist removed");
      qc.invalidateQueries({ queryKey: ["synced-playlists"] });
    },
    onError: () => toast.error("Could not remove the playlist"),
  });

  return (
    <Card className="p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <ListVideo className="h-4 w-4 text-primary" /> Playlist auto-sync
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Every video in the playlist is imported as a published lecture. Re-sync any time to pull new uploads.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px_1fr_auto]">
        <div>
          <Label htmlFor="p-url">Playlist link or ID</Label>
          <Input id="p-url" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/playlist?list=PL..." />
        </div>
        <div>
          <Label>Subject</Label>
          <Select value={subject} onValueChange={(v) => setSubject(v as (typeof SUBJECTS)[number])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="p-chapter">Chapter (optional)</Label>
          <Input id="p-chapter" value={chapter} maxLength={120}
            onChange={(e) => setChapter(e.target.value)} placeholder="Full syllabus" />
        </div>
        <div className="flex items-end">
          <Button onClick={() => add.mutate()} disabled={!url.trim() || add.isPending}>
            {add.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading playlists…</p>
      ) : (playlists ?? []).length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No playlists synced yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {(playlists ?? []).map((p) => (
            <li key={p.id} className="flex items-start gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.title ?? p.youtube_playlist_id}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.subject}{p.chapter ? ` · ${p.chapter}` : ""}
                  {p.last_synced_at ? ` · synced ${new Date(p.last_synced_at).toLocaleString()}` : " · never synced"}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant={p.last_status === "error" ? "destructive" : p.last_status === "ok" ? "default" : "secondary"}>
                    {p.last_status === "ok" ? `${p.videos_added} added` : p.last_status}
                  </Badge>
                  {p.last_error && <span className="text-[11px] text-destructive">{p.last_error}</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button size="sm" variant="outline" onClick={() => sync.mutate(p.id)} disabled={sync.isPending}>
                  {sync.isPending && sync.variables === p.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-1.5">Sync</span>
                </Button>
                <Button size="sm" variant="ghost" aria-label="Remove playlist"
                  onClick={() => { if (window.confirm("Remove this playlist? Imported lectures stay.")) remove.mutate(p.id); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
