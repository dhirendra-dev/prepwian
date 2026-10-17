import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type FeedAuthor = { id: string; full_name: string | null; avatar_url: string | null; is_admin: boolean };
export type FeedPost = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  image_url: string | null;
  source_profile_post_id: string | null;
  author: FeedAuthor | null;
  like_count: number;
  comment_count: number;
};
export type FeedComment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: FeedAuthor | null;
  like_count: number;
};

async function fetchAuthors(sb: ReturnType<typeof publicClient>, userIds: string[]) {
  if (userIds.length === 0) return new Map<string, FeedAuthor>();
  const unique = Array.from(new Set(userIds));
  const [{ data }, { data: adminRows }] = await Promise.all([
    (sb.rpc as any)("public_feed_authors", { _ids: unique }),
    sb.rpc("list_admin_ids"),
  ]);
  const adminSet = new Set((adminRows ?? []).map((r: { user_id: string }) => r.user_id));
  return new Map(
    ((data ?? []) as { id: string; full_name: string | null; avatar_url: string | null }[]).map((p) => [
      p.id,
      { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, is_admin: adminSet.has(p.id) } as FeedAuthor,
    ]),
  );
}


async function fetchLikeCounts(
  sb: ReturnType<typeof publicClient>,
  targetType: "post" | "comment",
  targetIds: string[],
) {
  const counts = new Map<string, number>();
  if (targetIds.length === 0) return counts;
  const { data } = await sb
    .from("feed_likes")
    .select("target_id")
    .eq("target_type", targetType)
    .in("target_id", targetIds);
  for (const row of data ?? []) counts.set(row.target_id, (counts.get(row.target_id) ?? 0) + 1);
  return counts;
}

export const listFeedPosts = createServerFn({ method: "GET" }).handler(async (): Promise<FeedPost[]> => {
  const sb = publicClient();
  const { data: posts, error } = await sb
    .from("feed_posts")
    .select("id, user_id, body, created_at, image_url, source_profile_post_id")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const ids = (posts ?? []).map((p) => p.id);
  const authors = await fetchAuthors(sb, (posts ?? []).map((p) => p.user_id));
  const likeCounts = await fetchLikeCounts(sb, "post", ids);

  const commentCounts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: cs } = await sb.from("feed_comments").select("post_id").in("post_id", ids);
    for (const c of cs ?? []) commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1);
  }

  return (posts ?? []).map((p) => ({
    id: p.id,
    user_id: p.user_id,
    body: p.body,
    created_at: p.created_at,
    image_url: (p as { image_url: string | null }).image_url ?? null,
    source_profile_post_id: (p as { source_profile_post_id: string | null }).source_profile_post_id ?? null,
    author: authors.get(p.user_id) ?? null,
    like_count: likeCounts.get(p.id) ?? 0,
    comment_count: commentCounts.get(p.id) ?? 0,
  }));
});

export const listPostComments = createServerFn({ method: "GET" })
  .inputValidator((input: { postId: string }) => z.object({ postId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<FeedComment[]> => {
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("feed_comments")
      .select("id, post_id, user_id, body, created_at")
      .eq("post_id", data.postId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const ids = (rows ?? []).map((r) => r.id);
    const authors = await fetchAuthors(sb, (rows ?? []).map((r) => r.user_id));
    const likeCounts = await fetchLikeCounts(sb, "comment", ids);
    return (rows ?? []).map((r) => ({
      id: r.id,
      post_id: r.post_id,
      user_id: r.user_id,
      body: r.body,
      created_at: r.created_at,
      author: authors.get(r.user_id) ?? null,
      like_count: likeCounts.get(r.id) ?? 0,
    }));
  });

export const getMyLikes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("feed_likes")
      .select("target_type, target_id")
      .eq("user_id", context.userId);
    if (error) throw error;
    return {
      posts: (data ?? []).filter((r) => r.target_type === "post").map((r) => r.target_id),
      comments: (data ?? []).filter((r) => r.target_type === "comment").map((r) => r.target_id),
    };
  });

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { body: string }) =>
    z.object({ body: z.string().trim().min(1).max(1000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("feed_posts")
      .insert({ user_id: context.userId, body: data.body })
      .select("id")
      .single();
    if (error) throw error;
    return row;
  });

export const createComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { postId: string; body: string }) =>
    z.object({ postId: z.string().uuid(), body: z.string().trim().min(1).max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("feed_comments")
      .insert({ post_id: data.postId, user_id: context.userId, body: data.body })
      .select("id")
      .single();
    if (error) throw error;
    return row;
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { targetType: "post" | "comment"; targetId: string }) =>
    z.object({ targetType: z.enum(["post", "comment"]), targetId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("feed_likes")
      .select("id")
      .eq("user_id", context.userId)
      .eq("target_type", data.targetType)
      .eq("target_id", data.targetId)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase.from("feed_likes").delete().eq("id", existing.id);
      if (error) throw error;
      return { liked: false };
    }
    const { error } = await context.supabase
      .from("feed_likes")
      .insert({ user_id: context.userId, target_type: data.targetType, target_id: data.targetId });
    if (error) throw error;
    return { liked: true };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("feed_posts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("feed_comments").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
