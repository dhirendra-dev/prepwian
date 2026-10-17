import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const articleDb = supabase as unknown as SupabaseClient;
const PROFILE_FIELDS = "id,full_name,username,avatar_url";

export type ArticleAuthorProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export type ArticleWithAuthorIdentity = {
  author_id: string | null;
  author_name: string;
  author_avatar_url: string | null;
  author_username?: string | null;
};

/** Prefer the human-readable profile name; username is only a profile-backed fallback. */
export function profileDisplayName(profile: ArticleAuthorProfile | null | undefined) {
  return profile?.full_name?.trim() || profile?.username?.trim() || null;
}

/** Fetch the authenticated user's current profile row; never use auth metadata as identity. */
export async function getArticleAuthorProfile(userId: string) {
  return articleDb
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .maybeSingle() as unknown as {
    data: ArticleAuthorProfile | null;
    error: { message: string } | null;
  };
}

/** Resolve article display identity from profiles.author_id, never from denormalized article text. */
export async function resolveArticleAuthorIdentity<T extends ArticleWithAuthorIdentity>(
  articles: T[],
) {
  const authorIds = [...new Set(articles.map((article) => article.author_id).filter(Boolean))] as string[];
  if (!authorIds.length) {
    return articles.map((article) => ({
      ...article,
      author_name: "JEE Prep Hub author",
      author_avatar_url: null,
      author_username: null,
    }));
  }

  const { data: profiles } = await articleDb
    .from("profiles")
    .select(PROFILE_FIELDS)
    .in("id", authorIds);
  const profileById = new Map(
    ((profiles ?? []) as ArticleAuthorProfile[]).map((profile) => [profile.id, profile]),
  );

  return articles.map((article) => {
    const profile = article.author_id ? profileById.get(article.author_id) : null;
    return {
      ...article,
      author_name: profileDisplayName(profile) ?? "Author profile unavailable",
      author_avatar_url: profile?.avatar_url ?? null,
      author_username: profile?.username ?? null,
    };
  });
}
