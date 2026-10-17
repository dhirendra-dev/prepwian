// @ts-nocheck -- references certificate/forum columns not yet in the database schema
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase generated types predate the new Threads tables. */
import { LinkifiedText } from "@/components/LinkifiedText";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bookmark,
  Check,
  Eye,
  Flag,
  Heart,
  Link2,
  Loader2,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  Send,
  ThumbsUp,
  TrendingUp,
  X,
} from "lucide-react";

const searchSchema = z.object({ thread: z.string().optional(), reply: z.string().optional() });
export const Route = createFileRoute("/_authenticated/forum")({
  head: () => ({ meta: [
      { name: "description", content: "Discuss JEE preparation, share questions and explore community threads." },
      { property: "og:title", content: "Threads — JEE Prep Hub" },
      { property: "og:description", content: "Discuss JEE preparation, share questions and explore community threads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Threads — JEE Prep Hub" },
      { name: "twitter:description", content: "Discuss JEE preparation, share questions and explore community threads." },
{ title: "Threads — JEE Prep Hub" }] }),
  validateSearch: searchSchema,
  component: ForumPage,
});
type Subject = "physics" | "chemistry" | "mathematics" | "general";
type SortMode = "latest" | "popular" | "replies";
const subjects = [
  { value: "all", label: "All subjects" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "mathematics", label: "Mathematics" },
  { value: "general", label: "General" },
] as const;
const labels: Record<Subject, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  mathematics: "Mathematics",
  general: "Discussion",
};
const dateLabel = (v: string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(d);
};
function ForumPage() {
  const s = Route.useSearch();
  return s.thread ? <ThreadDetail threadId={s.thread} replyId={s.reply} /> : <ThreadList />;
}
function useViewer() {
  return useQuery({
    queryKey: ["forum-viewer"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user ?? null;
    },
    staleTime: 60000,
  });
}

function ThreadList() {
  const nav = useNavigate(),
    qc = useQueryClient(),
    viewer = useViewer();
  const [open, setOpen] = useState(false),
    [subject, setSubject] = useState<Subject>("physics"),
    [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState<Subject | "all">("all"),
    [sort, setSort] = useState<SortMode>("latest"),
    [saving, setSaving] = useState(false);
  const threads = useQuery({
    queryKey: ["forum-threads-v2", sort, viewer.data?.id],
    queryFn: async () => {
      const q = supabase
        .from("forum_threads")
        .select("id,title,body,subject,created_at,updated_at,user_id,views_count")
        .order(sort === "latest" ? "updated_at" : "created_at", { ascending: false })
        .limit(100);
      const { data, error } = await q;
      if (error) throw error;
      const rows = data ?? [],
        ids = [...new Set(rows.map((x) => x.user_id))],
        threadIds = rows.map((x) => x.id);
      const [pr, rr, lr, br] = await Promise.all([
        ids.length
          ? supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids)
          : Promise.resolve({ data: [], error: null } as any),
        threadIds.length
          ? supabase.from("forum_replies").select("thread_id").in("thread_id", threadIds)
          : Promise.resolve({ data: [], error: null } as any),
        threadIds.length
          ? supabase
              .from("forum_thread_reactions")
              .select("thread_id,user_id,reaction_type")
              .in("thread_id", threadIds)
          : Promise.resolve({ data: [], error: null } as any),
        viewer.data?.id && threadIds.length
          ? supabase
              .from("forum_thread_bookmarks")
              .select("thread_id")
              .eq("user_id", viewer.data.id)
              .in("thread_id", threadIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);
      for (const x of [pr, rr, lr, br]) if (x.error) throw x.error;
      const pm = new Map((pr.data ?? []).map((p: any) => [p.id, p])),
        rc = new Map<string, number>(),
        lc = new Map<string, number>(),
        liked = new Set<string>(),
        saved = new Set((br.data ?? []).map((x: any) => x.thread_id));
      for (const x of rr.data ?? []) rc.set(x.thread_id, (rc.get(x.thread_id) ?? 0) + 1);
      for (const x of lr.data ?? []) {
        lc.set(x.thread_id, (lc.get(x.thread_id) ?? 0) + 1);
        if (x.user_id === viewer.data?.id && x.reaction_type === "like") liked.add(x.thread_id);
      }
      return rows.map((t) => ({
        ...t,
        author: pm.get(t.user_id),
        repliesCount: rc.get(t.id) ?? 0,
        likesCount: lc.get(t.id) ?? 0,
        liked: liked.has(t.id),
        saved: saved.has(t.id),
      }));
    },
  });
  const visible = useMemo(() => {
    const a = (threads.data ?? []).filter(
      (t) =>
        (filter === "all" || t.subject === filter) &&
        `${t.title} ${t.body} ${(t.author as any)?.full_name ?? ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    );
    if (sort === "popular") a.sort((x, y) => y.likesCount - x.likesCount);
    if (sort === "replies") a.sort((x, y) => y.repliesCount - x.repliesCount);
    return a;
  }, [threads.data, filter, query, sort]);
  async function createThread() {
    const t = title.trim(),
      b = body.trim(),
      uid = viewer.data?.id;
    if (t.length < 5) return toast.error("Title must be at least 5 characters.");
    if (b.length < 10) return toast.error("Add at least 10 characters of detail.");
    if (!uid) return toast.error("Please sign in to create a thread.");
    setSaving(true);
    const { data, error } = await supabase
      .from("forum_threads")
      .insert({ user_id: uid, subject, title: t, body: b })
      .select("id")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setOpen(false);
    setTitle("");
    setBody("");
    await qc.invalidateQueries({ queryKey: ["forum-threads-v2"] });
    toast.success("Thread posted");
    nav({ to: "/forum", search: { thread: data.id } });
  }
  async function bookmark(t: any) {
    const uid = viewer.data?.id;
    if (!uid) return toast.error("Sign in to save threads.");
    const r = t.saved
      ? await supabase
          .from("forum_thread_bookmarks")
          .delete()
          .eq("thread_id", t.id)
          .eq("user_id", uid)
      : await supabase.from("forum_thread_bookmarks").insert({ thread_id: t.id, user_id: uid });
    if (r.error) return toast.error(r.error.message);
    await qc.invalidateQueries({ queryKey: ["forum-threads-v2"] });
  }
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-5">
        <header className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                JEE Prep Hub Community
              </span>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">Threads</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask doubts. Share solutions. Learn together.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl">
                  <Plus className="h-4 w-4" />
                  Create post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Start a thread</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects
                          .filter((x) => x.value !== "all")
                          .map((x) => (
                            <SelectItem key={x.value} value={x.value}>
                              {x.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={title}
                      maxLength={160}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What do you need help with?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Details</Label>
                    <Textarea
                      value={body}
                      maxLength={4000}
                      rows={6}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Explain what you tried and where you're stuck…"
                    />
                  </div>
                  <Button onClick={createThread} disabled={saving} className="w-full gap-2">
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {saving ? "Posting…" : "Publish thread"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative mt-5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search threads"
              className="h-11 rounded-xl pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions, topics, or people…"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {subjects.map((s) => (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium ${filter === s.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/60 hover:border-primary/50"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            {visible.length} {visible.length === 1 ? "thread" : "threads"}
          </p>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card/70 p-1">
            <button
              onClick={() => setSort("latest")}
              className={`rounded-lg px-3 py-2 text-xs ${sort === "latest" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Latest
            </button>
            <button
              onClick={() => setSort("popular")}
              className={`rounded-lg px-3 py-2 text-xs ${sort === "popular" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <TrendingUp className="mr-1 inline h-3.5 w-3.5" />
              Popular
            </button>
            <button
              onClick={() => setSort("replies")}
              className={`rounded-lg px-3 py-2 text-xs ${sort === "replies" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Most replies
            </button>
          </div>
        </div>
        {threads.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-32 animate-pulse rounded-2xl border border-border bg-card/60"
              />
            ))}
          </div>
        ) : threads.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-card p-6">
            <p className="font-semibold">Threads couldn't load.</p>
            <Button variant="outline" className="mt-3" onClick={() => threads.refetch()}>
              Try again
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">No matching threads</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another filter or start a discussion.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section className="min-w-0 space-y-3">
              {visible.map((t) => (
                <article
                  key={t.id}
                  className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm transition hover:border-primary/40 sm:p-5"
                >
                  <button
                    className="block w-full text-left"
                    onClick={() => nav({ to: "/forum", search: { thread: t.id } })}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {labels[t.subject as Subject] ?? "Discussion"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dateLabel(t.updated_at)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-base font-semibold leading-snug sm:text-lg">
                      {t.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      <LinkifiedText text={t.body} />
                    </p>
                  </button>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
                    <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
                        {((t.author as any)?.full_name ?? "S").slice(0, 1).toUpperCase()}
                      </span>
                      <span className="max-w-[140px] truncate font-medium text-foreground">
                        {(t.author as any)?.full_name ?? "Student"}
                      </span>
                      <span>· {dateLabel(t.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        <MessageCircle className="mr-1 inline h-3.5 w-3.5" />
                        {t.repliesCount}
                      </span>
                      <span>
                        <Heart className="mr-1 inline h-3.5 w-3.5" />
                        {t.likesCount}
                      </span>
                      <span>
                        <Eye className="mr-1 inline h-3.5 w-3.5" />
                        {t.views_count ?? 0}
                      </span>
                      <button
                        aria-label={t.saved ? "Remove bookmark" : "Bookmark thread"}
                        className={t.saved ? "text-primary" : "hover:text-primary"}
                        onClick={() => bookmark(t)}
                      >
                        <Bookmark className={`h-4 w-4 ${t.saved ? "fill-current" : ""}`} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
            <aside className="hidden space-y-3 lg:block">
              <div className="rounded-2xl border border-border bg-card/70 p-4">
                <h3 className="font-semibold">A helpful thread includes</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• A clear title</li>
                  <li>• Your attempt so far</li>
                  <li>• The exact step causing trouble</li>
                  <li>• Your own words and diagrams</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card/70 p-4">
                <p className="font-semibold">Study together</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Be respectful, explain your reasoning, and help others learn.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function ThreadDetail({ threadId, replyId }: { threadId: string; replyId?: string }) {
  const nav = useNavigate(),
    qc = useQueryClient(),
    viewer = useViewer();
  const [reply, setReply] = useState(""),
    [sending, setSending] = useState(false),
    [reportOpen, setReportOpen] = useState(false),
    [reportReason, setReportReason] = useState("spam or advertising");
  const thread = useQuery({
    queryKey: ["forum-thread-v2", threadId, viewer.data?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_threads")
        .select("*")
        .eq("id", threadId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [p, r, b, f] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name,avatar_url")
          .eq("id", data.user_id)
          .maybeSingle(),
        supabase
          .from("forum_thread_reactions")
          .select("id,user_id,reaction_type")
          .eq("thread_id", threadId),
        viewer.data?.id
          ? supabase
              .from("forum_thread_bookmarks")
              .select("id")
              .eq("thread_id", threadId)
              .eq("user_id", viewer.data.id)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
        viewer.data?.id
          ? supabase
              .from("forum_thread_follows")
              .select("id")
              .eq("thread_id", threadId)
              .eq("user_id", viewer.data.id)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      if (p.error || r.error) throw p.error ?? r.error;
      return {
        ...data,
        author: p.data,
        reactions: r.data ?? [],
        saved: !!b.data,
        following: !!f.data,
      };
    },
  });
  const replies = useQuery({
    queryKey: ["forum-replies-v2", threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_replies")
        .select("id,thread_id,body,created_at,user_id")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(300);
      if (error) throw error;
      const rows = data ?? [],
        ids = [...new Set(rows.map((x) => x.user_id))];
      const [p, r] = await Promise.all([
        ids.length
          ? supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids)
          : Promise.resolve({ data: [], error: null } as any),
        rows.length
          ? supabase
              .from("forum_reply_reactions")
              .select("reply_id,user_id,reaction_type")
              .in(
                "reply_id",
                rows.map((x) => x.id),
              )
          : Promise.resolve({ data: [], error: null } as any),
      ]);
      if (p.error || r.error) throw p.error ?? r.error;
      const map = new Map((p.data ?? []).map((x: any) => [x.id, x]));
      return rows.map((x) => ({
        ...x,
        author: map.get(x.user_id),
        reactions: (r.data ?? []).filter((z: any) => z.reply_id === x.id),
      }));
    },
  });
  useEffect(() => {
    if (!replyId || !replies.data?.some((reply) => reply.id === replyId)) return;
    const frame = requestAnimationFrame(() =>
      document
        .getElementById(`forum-reply-${replyId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [replyId, replies.data]);
  async function toggleReaction() {
    const uid = viewer.data?.id;
    if (!uid) return toast.error("Sign in to react.");
    const x = (thread.data?.reactions ?? []).find(
      (r: any) => r.user_id === uid && r.reaction_type === "like",
    );
    const out = x
      ? await supabase.from("forum_thread_reactions").delete().eq("id", x.id)
      : await supabase
          .from("forum_thread_reactions")
          .insert({ thread_id: threadId, user_id: uid, reaction_type: "like" });
    if (out.error) return toast.error(out.error.message);
    await qc.invalidateQueries({ queryKey: ["forum-thread-v2", threadId] });
    await qc.invalidateQueries({ queryKey: ["forum-threads-v2"] });
  }
  async function toggleBookmark() {
    const uid = viewer.data?.id;
    if (!uid) return toast.error("Sign in to save threads.");
    const out = thread.data?.saved
      ? await supabase
          .from("forum_thread_bookmarks")
          .delete()
          .eq("thread_id", threadId)
          .eq("user_id", uid)
      : await supabase.from("forum_thread_bookmarks").insert({ thread_id: threadId, user_id: uid });
    if (out.error) return toast.error(out.error.message);
    await qc.invalidateQueries({ queryKey: ["forum-thread-v2", threadId] });
    await qc.invalidateQueries({ queryKey: ["forum-threads-v2"] });
  }
  async function toggleFollow() {
    const uid = viewer.data?.id;
    if (!uid) return toast.error("Sign in to follow threads.");
    const out = thread.data?.following
      ? await supabase
          .from("forum_thread_follows")
          .delete()
          .eq("thread_id", threadId)
          .eq("user_id", uid)
      : await supabase.from("forum_thread_follows").insert({ thread_id: threadId, user_id: uid });
    if (out.error) return toast.error(out.error.message);
    await qc.invalidateQueries({ queryKey: ["forum-thread-v2", threadId] });
    toast.success(thread.data?.following ? "Unfollowed thread" : "Following thread");
  }
  async function postReply() {
    const uid = viewer.data?.id,
      clean = reply.trim();
    if (!uid) return toast.error("Sign in to reply.");
    if (clean.length < 2) return toast.error("Write a little more before replying.");
    if (thread.data?.is_locked) return toast.error("This thread is locked.");
    setSending(true);
    const { error } = await supabase
      .from("forum_replies")
      .insert({ thread_id: threadId, user_id: uid, body: clean });
    setSending(false);
    if (error) return toast.error(error.message);
    setReply("");
    await qc.invalidateQueries({ queryKey: ["forum-replies-v2", threadId] });
    await qc.invalidateQueries({ queryKey: ["forum-thread-v2", threadId] });
    toast.success("Reply posted");
  }
  async function report() {
    const uid = viewer.data?.id;
    if (!uid) return toast.error("Sign in to report.");
    const { error } = await supabase
      .from("forum_thread_reports")
      .insert({ thread_id: threadId, reporter_id: uid, reason: reportReason });
    if (error)
      return toast.error(
        error.code === "23505" ? "You already reported this thread." : error.message,
      );
    setReportOpen(false);
    toast.success("Report sent to moderators.");
  }
  async function deleteThread() {
    if (!thread.data || thread.data.user_id !== viewer.data?.id)
      return toast.error("Only the author can delete this thread.");
    if (!window.confirm("Delete this thread and its replies?")) return;
    const { error } = await supabase
      .from("forum_threads")
      .delete()
      .eq("id", threadId)
      .eq("user_id", viewer.data.id);
    if (error) return toast.error(error.message);
    nav({ to: "/forum", search: {} });
    await qc.invalidateQueries({ queryKey: ["forum-threads-v2"] });
    toast.success("Thread deleted");
  }
  async function deleteReply(id: string, uid: string) {
    if (uid !== viewer.data?.id) return toast.error("You can only delete your own reply.");
    if (!window.confirm("Delete your reply?")) return;
    const { error } = await supabase
      .from("forum_replies")
      .delete()
      .eq("id", id)
      .eq("user_id", viewer.data!.id);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["forum-replies-v2", threadId] });
  }
  async function likeReply(id: string, reactions: any[]) {
    const uid = viewer.data?.id;
    if (!uid) return toast.error("Sign in to react.");
    const exists = reactions.some((x) => x.user_id === uid && x.reaction_type === "like");
    const out = exists
      ? await supabase
          .from("forum_reply_reactions")
          .delete()
          .eq("reply_id", id)
          .eq("user_id", uid)
          .eq("reaction_type", "like")
      : await supabase
          .from("forum_reply_reactions")
          .insert({ reply_id: id, user_id: uid, reaction_type: "like" });
    if (out.error) return toast.error(out.error.message);
    await qc.invalidateQueries({ queryKey: ["forum-replies-v2", threadId] });
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link on this browser.");
    }
  }
  if (thread.isLoading)
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl space-y-3">
          <div className="h-44 animate-pulse rounded-2xl border border-border bg-card/60" />
          <div className="h-28 animate-pulse rounded-2xl border border-border bg-card/60" />
        </main>
      </AppShell>
    );
  if (thread.isError)
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6">
          <p>Could not load this thread.</p>
          <Button className="mt-3" onClick={() => thread.refetch()}>
            Try again
          </Button>
        </main>
      </AppShell>
    );
  if (!thread.data)
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6">
          <p>Thread not found.</p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => nav({ to: "/forum", search: {} })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </main>
      </AppShell>
    );
  const t = thread.data,
    liked = (t.reactions ?? []).some(
      (x: any) => x.user_id === viewer.data?.id && x.reaction_type === "like",
    );
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl space-y-4">
        <button
          onClick={() => nav({ to: "/forum", search: {} })}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Threads
        </button>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-4">
            <article className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-xl sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {labels[t.subject as Subject] ?? "Discussion"}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Copy link" onClick={copyLink}>
                    <Link2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Report thread"
                    onClick={() => setReportOpen(true)}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                  {t.user_id === viewer.data?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete thread"
                      onClick={deleteThread}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <h1 className="mt-3 break-words font-display text-xl font-bold leading-tight sm:text-2xl">
                {t.title}
              </h1>
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {t.author?.full_name ?? "Student"}
                </span>{" "}
                · {dateLabel(t.created_at)}
              </p>
              <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 sm:text-base">
                <LinkifiedText text={t.body} />
              </p>
              {Array.isArray(t.attachment_urls) && t.attachment_urls.length > 0 && (
                <div className="mt-4 space-y-2">
                  {t.attachment_urls.map((u: string, i: number) => (
                    <a
                      key={i}
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                      className="block break-all rounded-xl border border-border p-3 text-sm text-primary underline"
                    >
                      Attachment {i + 1}
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <Button
                  variant={liked ? "default" : "outline"}
                  size="sm"
                  className="gap-2 rounded-xl"
                  onClick={toggleReaction}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {t.reactions?.length ?? 0}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl"
                  onClick={toggleBookmark}
                >
                  <Bookmark className={`h-4 w-4 ${t.saved ? "fill-current text-primary" : ""}`} />
                  {t.saved ? "Saved" : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl"
                  onClick={toggleFollow}
                >
                  {t.following ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {t.following ? "Following" : "Follow"}
                </Button>
                <span className="ml-auto text-xs text-muted-foreground">
                  <MessageCircle className="mr-1 inline h-4 w-4" />
                  {replies.data?.length ?? 0} replies
                </span>
              </div>
            </article>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">
                  Replies ({replies.data?.length ?? 0})
                </h2>
                <span className="text-xs text-muted-foreground">Oldest first</span>
              </div>
              {replies.isLoading ? (
                <div className="h-28 animate-pulse rounded-2xl border border-border bg-card/60" />
              ) : replies.isError ? (
                <div className="rounded-xl border border-border bg-card p-4 text-sm">
                  Replies could not load.{" "}
                  <Button variant="outline" size="sm" onClick={() => replies.refetch()}>
                    Retry
                  </Button>
                </div>
              ) : (replies.data ?? []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-7 text-center">
                  <MessageCircle className="mx-auto h-7 w-7 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">Be the first to reply</p>
                </div>
              ) : (
                (replies.data ?? []).map((r: any) => (
                  <article
                    key={r.id}
                    id={`forum-reply-${r.id}`}
                    className={`scroll-mt-6 rounded-2xl border border-border/80 bg-card/80 p-4 sm:p-5 ${r.id === replyId ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                          {(r.author?.full_name ?? "S").slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {r.author?.full_name ?? "Student"}
                          </p>
                          <p className="text-xs text-muted-foreground">{dateLabel(r.created_at)}</p>
                        </div>
                      </div>
                      {r.user_id === viewer.data?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete reply"
                          onClick={() => deleteReply(r.id, r.user_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
                      <LinkifiedText text={r.body} />
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 gap-2"
                      onClick={() => likeReply(r.id, r.reactions)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {r.reactions.length}
                    </Button>
                  </article>
                ))
              )}
            </section>
            <section className="rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur-xl sm:p-5">
              <Label htmlFor="reply-text" className="text-sm font-semibold">
                Write a reply
              </Label>
              <Textarea
                id="reply-text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                maxLength={4000}
                rows={4}
                placeholder="Share an explanation or ask a follow-up…"
                className="mt-2 rounded-xl"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{reply.length}/4000</span>
                <Button
                  onClick={postReply}
                  disabled={sending || reply.trim().length < 2 || !!t.is_locked}
                  className="gap-2 rounded-xl"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {t.is_locked ? "Thread locked" : sending ? "Posting…" : "Post reply"}
                </Button>
              </div>
            </section>
          </div>
          <aside className="hidden space-y-3 lg:block">
            <div className="rounded-2xl border border-border bg-card/80 p-4">
              <h3 className="font-semibold">Thread details</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Subject: {labels[t.subject as Subject] ?? "Discussion"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Created {dateLabel(t.created_at)}
              </p>
              <Button
                className="mt-4 w-full"
                variant={t.following ? "secondary" : "default"}
                onClick={toggleFollow}
              >
                {t.following ? "Following" : "Follow thread"}
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-card/80 p-4">
              <h3 className="font-semibold">Community guidelines</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Be kind, explain your steps, and keep discussions focused on learning.
              </p>
            </div>
          </aside>
        </div>
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Report this thread</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Choose the closest reason.</p>
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "spam or advertising",
                  "harassment or bullying",
                  "misinformation",
                  "copyright concern",
                  "inappropriate content",
                  "other",
                ].map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={report}>Submit report</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </AppShell>
  );
}
