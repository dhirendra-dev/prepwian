import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Pulse = unified feed of admin video lectures (public.video_lectures) plus the
 * EXISTING community feed posts (public.feed_posts + feed_likes + feed_comments),
 * read through the public.pulse_feed_items view. Likes/comments/share reuse
 * src/lib/feed.functions.ts — nothing is duplicated here.
 */

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type PulseItem = {
  id: string;
  item_type: "video" | "post";
  title: string | null;
  body_text: string | null;
  author_id: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  image_url: string | null;
  youtube_video_id: string | null;
  subject: string | null;
  chapter: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
};

const FilterSchema = z.object({
  cursor: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(50).optional(),
  subject: z.enum(["Physics", "Chemistry", "Mathematics"]).nullable().optional(),
  itemType: z.enum(["video", "post"]).nullable().optional(),
});

export const listPulseItems = createServerFn({ method: "GET" })
  .inputValidator((input: z.input<typeof FilterSchema>) => FilterSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<{ items: PulseItem[]; nextCursor: string | null }> => {
    const sb = publicClient();
    const limit = data.limit ?? 15;
    let q = sb
      .from("pulse_feed_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit + 1);
    if (data.cursor) q = q.lt("created_at", data.cursor);
    if (data.subject) q = q.eq("subject", data.subject);
    if (data.itemType) q = q.eq("item_type", data.itemType);
    const { data: rows, error } = await q;
    if (error) throw error;
    const all = (rows ?? []) as unknown as PulseItem[];
    const items = all.slice(0, limit).map((r) => ({
      ...r,
      like_count: Number(r.like_count ?? 0),
      comment_count: Number(r.comment_count ?? 0),
    }));
    return {
      items,
      nextCursor: all.length > limit ? (items[items.length - 1]?.created_at ?? null) : null,
    };
  });

export const countPulseItemsSince = createServerFn({ method: "GET" })
  .inputValidator((input: { since: string }) => z.object({ since: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { count, error } = await sb
      .from("pulse_feed_items")
      .select("id", { count: "exact", head: true })
      .gt("created_at", data.since);
    if (error) throw error;
    return { count: count ?? 0 };
  });

export const getPulseSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb.from("app_settings").select("jee_main_date").eq("id", 1).maybeSingle();
  return { jeeMainDate: data?.jee_main_date ?? "2027-01-24" };
});

export const incrementVideoView = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.supabase.rpc("increment_video_view", { video_id: data.id });
    try {
      const { data: reward } = await (context.supabase as any).rpc("award_action_xp", {
        p_source_type: "video",
        p_source_id: data.id,
        p_reason: "Watched a video lecture",
      });
      return { ok: true, awarded: Boolean(reward?.awarded) };
    } catch {
      // XP rewards must never prevent a video from opening.
    }
    return { ok: true, awarded: false };
  });

/* ── Video lecture management (admin; RLS enforces the admin role) ───────── */

export type VideoLecture = {
  id: string;
  title: string;
  youtube_video_id: string;
  subject: string;
  chapter: string;
  description: string | null;
  duration_minutes: number | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
};

export const listAllVideoLectures = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VideoLecture[]> => {
    const { data, error } = await context.supabase
      .from("video_lectures")
      .select("id, title, youtube_video_id, subject, chapter, description, duration_minutes, is_published, view_count, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as VideoLecture[];
  });

const VideoInput = z.object({
  id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  youtube_video_id: z.string().trim().length(11),
  subject: z.enum(["Physics", "Chemistry", "Mathematics"]),
  chapter: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
});

export const saveVideoLecture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof VideoInput>) => VideoInput.parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      title: data.title,
      youtube_video_id: data.youtube_video_id,
      subject: data.subject,
      chapter: data.chapter,
      description: data.description ?? null,
      duration_minutes: data.duration_minutes ?? null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("video_lectures").update(payload).eq("id", data.id);
      if (error) throw error;
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("video_lectures")
      .insert({ ...payload, added_by: context.userId })
      .select("id")
      .single();
    if (error) throw error;
    return row;
  });

export const setVideoPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; published: boolean }) =>
    z.object({ id: z.string().uuid(), published: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("video_lectures")
      .update({ is_published: data.published })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteVideoLecture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("video_lectures").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ── Pulse AI suggestion: weakest chapter → matching lecture ─────────────── */

export type PulseSuggestion = {
  chapter: string;
  subject: string;
  scorePercent: number;
  video: { id: string; title: string; youtube_video_id: string; subject: string; chapter: string };
};

export const getPulseSuggestion = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PulseSuggestion | null> => {
    const sb = context.supabase;
    const { data: attempts } = await sb
      .from("test_attempts")
      .select("id")
      .eq("user_id", context.userId)
      .in("status", ["submitted", "auto_submitted"])
      .order("submitted_at", { ascending: false })
      .limit(3);
    const attemptIds = (attempts ?? []).map((a) => a.id);
    if (attemptIds.length === 0) return null;

    const { data: responses } = await sb
      .from("test_responses")
      .select("question_id, marks_awarded")
      .in("attempt_id", attemptIds);
    if (!responses || responses.length === 0) return null;

    const questionIds = responses.map((r) => r.question_id);
    const { data: questions } = await sb
      .from("test_questions")
      .select("id, subject, chapter, marks")
      .in("id", questionIds);
    if (!questions || questions.length === 0) return null;

    const qMap = new Map(questions.map((q) => [q.id, q]));
    const buckets = new Map<string, { subject: string; chapter: string; got: number; max: number }>();
    for (const r of responses) {
      const q = qMap.get(r.question_id);
      if (!q?.chapter || !q.subject) continue;
      const key = `${q.subject}::${q.chapter}`;
      const b = buckets.get(key) ?? { subject: q.subject, chapter: q.chapter, got: 0, max: 0 };
      b.got += Number(r.marks_awarded ?? 0);
      b.max += Number(q.marks ?? 4);
      buckets.set(key, b);
    }
    const scored = [...buckets.values()]
      .filter((b) => b.max > 0)
      .map((b) => ({ ...b, pct: Math.max(0, Math.round((b.got / b.max) * 100)) }))
      .sort((a, b) => a.pct - b.pct);
    const weakest = scored[0];
    if (!weakest) return null;

    const subjectName =
      weakest.subject.toLowerCase() === "physics"
        ? "Physics"
        : weakest.subject.toLowerCase() === "chemistry"
          ? "Chemistry"
          : weakest.subject.toLowerCase() === "mathematics"
            ? "Mathematics"
            : null;
    if (!subjectName) return null;

    const cols = "id, title, youtube_video_id, subject, chapter";
    const { data: exact } = await sb
      .from("video_lectures")
      .select(cols)
      .eq("is_published", true)
      .eq("subject", subjectName)
      .ilike("chapter", weakest.chapter)
      .limit(1);
    let video = exact?.[0] ?? null;
    if (!video) {
      const { data: bySubject } = await sb
        .from("video_lectures")
        .select(cols)
        .eq("is_published", true)
        .eq("subject", subjectName)
        .order("created_at", { ascending: false })
        .limit(1);
      video = bySubject?.[0] ?? null;
    }
    if (!video) return null;

    return {
      chapter: weakest.chapter,
      subject: subjectName,
      scorePercent: weakest.pct,
      video,
    };
  });

/* ── Scheduled tests (admin visibility) ─────────────────────────────────── */

export const listScheduledTests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("scheduled_tests")
      .select("id, test_number, scheduled_date, test_name, subjects, total_questions, status, generated_test_id, error, updated_at")
      .order("test_number", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

/* ── Video likes ─────────────────────────────────────────────────────────── */

export const toggleVideoLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { videoId: string }) => z.object({ videoId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ liked: boolean }> => {
    const sb = context.supabase;
    const { data: existing } = await sb
      .from("video_likes")
      .select("video_id")
      .eq("video_id", data.videoId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      const { error } = await sb.from("video_likes").delete().eq("video_id", data.videoId).eq("user_id", context.userId);
      if (error) throw error;
      return { liked: false };
    }
    const { error } = await sb.from("video_likes").insert({ video_id: data.videoId, user_id: context.userId });
    if (error) throw error;
    return { liked: true };
  });

export const getMyVideoLikes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<string[]> => {
    const { data } = await context.supabase
      .from("video_likes")
      .select("video_id")
      .eq("user_id", context.userId);
    return (data ?? []).map((r) => r.video_id);
  });

/* ── Video comments ──────────────────────────────────────────────────────── */

export type VideoComment = {
  id: string;
  video_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  author_name: string | null;
  author_avatar_url: string | null;
};

export const listVideoComments = createServerFn({ method: "GET" })
  .inputValidator((input: { videoId: string }) => z.object({ videoId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<VideoComment[]> => {
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("video_comments")
      .select("id, video_id, user_id, comment_text, created_at")
      .eq("video_id", data.videoId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profiles } = ids.length
      ? await sb.from("profiles").select("id, full_name, avatar_url").in("id", ids)
      : { data: [] as Array<{ id: string; full_name: string | null; avatar_url: string | null }> };
    const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({
      ...r,
      author_name: pMap.get(r.user_id)?.full_name ?? null,
      author_avatar_url: pMap.get(r.user_id)?.avatar_url ?? null,
    }));
  });

export const createVideoComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { videoId: string; body: string }) =>
    z.object({ videoId: z.string().uuid(), body: z.string().trim().min(1).max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("video_comments")
      .insert({ video_id: data.videoId, user_id: context.userId, comment_text: data.body })
      .select("id")
      .single();
    if (error) throw error;
    return row;
  });

export const deleteVideoComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("video_comments").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ── Continue watching ───────────────────────────────────────────────────── */

export type WatchProgress = {
  video_id: string;
  position_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  updated_at: string;
};

export const saveWatchProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { videoId: string; position: number; duration?: number | null }) =>
    z
      .object({
        videoId: z.string().uuid(),
        position: z.number().int().min(0).max(86_400),
        duration: z.number().int().min(0).max(86_400).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const duration = data.duration ?? null;
    const completed = !!duration && duration > 0 && data.position / duration >= 0.92;
    const { error } = await context.supabase.from("video_watch_progress").upsert(
      {
        user_id: context.userId,
        video_id: data.videoId,
        position_seconds: data.position,
        duration_seconds: duration,
        completed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,video_id" },
    );if (!error && completed) {
  try {
    await context.supabase.rpc("record_study_activity", {
      _source: "lecture",
    });
  } catch (streakError) {
    console.error("Study streak lecture activity error:", streakError);
  }
}
    if (error) throw error;
    return { ok: true, completed };
  });

export const getMyWatchProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WatchProgress[]> => {
    const { data } = await context.supabase
      .from("video_watch_progress")
      .select("video_id, position_seconds, duration_seconds, completed, updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(200);
    return (data ?? []) as WatchProgress[];
  });

export type ContinueWatchingItem = {
  id: string;
  title: string;
  youtube_video_id: string;
  subject: string;
  chapter: string;
  position_seconds: number;
  duration_seconds: number | null;
};

export const listContinueWatching = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ContinueWatchingItem[]> => {
    const sb = context.supabase;
    const { data: rows } = await sb
      .from("video_watch_progress")
      .select("video_id, position_seconds, duration_seconds")
      .eq("user_id", context.userId)
      .eq("completed", false)
      .gt("position_seconds", 20)
      .order("updated_at", { ascending: false })
      .limit(6);
    if (!rows || rows.length === 0) return [];
    const { data: videos } = await sb
      .from("video_lectures")
      .select("id, title, youtube_video_id, subject, chapter")
      .in("id", rows.map((r) => r.video_id))
      .eq("is_published", true);
    const vMap = new Map((videos ?? []).map((v) => [v.id, v]));
    return rows.flatMap((r) => {
      const v = vMap.get(r.video_id);
      if (!v) return [];
      return [{ ...v, position_seconds: r.position_seconds, duration_seconds: r.duration_seconds }];
    });
  });

/* ── YouTube helpers (admin): topic search + playlist sync ───────────────── */

type YtSearchItem = {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
};

async function requireAdmin(sb: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: unknown }> }, userId: string) {
  const { data } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Admins only");
}

function ytKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YouTube search isn't configured yet — add the YouTube Data API key in project settings.");
  return key;
}

export const searchYouTubeLectures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { topic: string; subject: string }) =>
    z
      .object({
        topic: z.string().trim().min(2).max(120),
        subject: z.enum(["Physics", "Chemistry", "Mathematics"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<YtSearchItem[]> => {
    await requireAdmin(context.supabase as never, context.userId);
    const key = ytKey();
    const q = `${data.subject} ${data.topic} JEE lecture`;
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "10");
    url.searchParams.set("relevanceLanguage", "en");
    url.searchParams.set("q", q);
    url.searchParams.set("key", key);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("YouTube search failed. Please try again.");
    const json = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          channelTitle?: string;
          publishedAt?: string;
          thumbnails?: { medium?: { url?: string } };
        };
      }>;
    };
    return (json.items ?? []).flatMap((it) => {
      const videoId = it.id?.videoId;
      if (!videoId) return [];
      return [{
        videoId,
        title: it.snippet?.title ?? "Untitled",
        channelTitle: it.snippet?.channelTitle ?? "",
        publishedAt: it.snippet?.publishedAt ?? "",
        thumbnail: it.snippet?.thumbnails?.medium?.url ?? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      }];
    });
  });

export type SyncedPlaylist = {
  id: string;
  youtube_playlist_id: string;
  title: string | null;
  subject: string;
  chapter: string | null;
  last_synced_at: string | null;
  last_status: string;
  last_error: string | null;
  videos_added: number;
  created_at: string;
};

export const listSyncedPlaylists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SyncedPlaylist[]> => {
    const { data, error } = await context.supabase
      .from("synced_playlists")
      .select("id, youtube_playlist_id, title, subject, chapter, last_synced_at, last_status, last_error, videos_added, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SyncedPlaylist[];
  });

export const addSyncedPlaylist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { playlistId: string; subject: string; chapter?: string | null; title?: string | null }) =>
    z
      .object({
        playlistId: z.string().trim().min(5).max(120),
        subject: z.enum(["Physics", "Chemistry", "Mathematics"]),
        chapter: z.string().trim().max(120).nullable().optional(),
        title: z.string().trim().max(200).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("synced_playlists")
      .insert({
        youtube_playlist_id: data.playlistId,
        subject: data.subject,
        chapter: data.chapter ?? null,
        title: data.title ?? null,
        added_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    return row;
  });

export const deleteSyncedPlaylist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("synced_playlists").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Pulls playlist items from YouTube and inserts any lecture we don't have yet. */
export const syncPlaylist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ added: number; skipped: number }> => {
    const sb = context.supabase;
    await requireAdmin(sb as never, context.userId);
    const { data: pl, error: plErr } = await sb
      .from("synced_playlists")
      .select("id, youtube_playlist_id, subject, chapter")
      .eq("id", data.id)
      .single();
    if (plErr || !pl) throw new Error("Playlist not found");

    try {
      const key = ytKey();
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("maxResults", "50");
      url.searchParams.set("playlistId", pl.youtube_playlist_id);
      url.searchParams.set("key", key);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("YouTube rejected the playlist request");
      const json = (await res.json()) as {
        items?: Array<{ snippet?: { title?: string; resourceId?: { videoId?: string } } }>;
      };
      const found = (json.items ?? []).flatMap((it) => {
        const videoId = it.snippet?.resourceId?.videoId;
        if (!videoId) return [];
        return [{ videoId, title: (it.snippet?.title ?? "Untitled").slice(0, 200) }];
      });

      const { data: existing } = await sb
        .from("video_lectures")
        .select("youtube_video_id")
        .in("youtube_video_id", found.map((f) => f.videoId));
      const have = new Set((existing ?? []).map((e) => e.youtube_video_id));
      const toInsert = found.filter((f) => !have.has(f.videoId));

      if (toInsert.length > 0) {
        const { error } = await sb.from("video_lectures").insert(
          toInsert.map((f) => ({
            title: f.title,
            youtube_video_id: f.videoId,
            subject: pl.subject,
            chapter: pl.chapter ?? "General",
            added_by: context.userId,
            is_published: true,
          })),
        );
        if (error) throw error;
      }

      await sb
        .from("synced_playlists")
        .update({
          last_synced_at: new Date().toISOString(),
          last_status: "ok",
          last_error: null,
          videos_added: toInsert.length,
        })
        .eq("id", pl.id);
      return { added: toInsert.length, skipped: found.length - toInsert.length };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sync failed";
      await sb
        .from("synced_playlists")
        .update({ last_synced_at: new Date().toISOString(), last_status: "error", last_error: message })
        .eq("id", pl.id);
      throw new Error(message);
    }
  });
