import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FeedAuthorLite = {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
  verified: boolean;
  role: string | null;
};

export type FeedCommentNode = {
  id: string;
  author: FeedAuthorLite;
  time: string;
  content: string;
  votes: number;
  isSolution: boolean;
  replies: FeedCommentNode[];
};

export type FeedPostItem = {
  id: string;
  author: FeedAuthorLite;
  time: string;
  type: string;
  solved: boolean;
  tags: string[];
  content: string;
  image: string | null;
  document: { title: string; size: string; pages: number; url: string } | null;
  votes: number;
  comments: number;
};

export function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

async function signedUrls(bucket: string, paths: (string | null)[]) {
  const unique = Array.from(
    new Set(paths.filter((path): path is string => !!path && !path.startsWith("http"))),
  );
  if (unique.length === 0) return new Map<string, string>();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(unique, 60 * 60 * 6);
  if (error) return new Map<string, string>();
  return new Map(
    (data ?? []).flatMap((entry) =>
      entry.path && entry.signedUrl ? [[entry.path, entry.signedUrl] as const] : [],
    ),
  );
}

async function loadAuthors(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const map = new Map<string, FeedAuthorLite>();
  if (unique.length === 0) return map;
  const [{ data: profiles }, adminsResult] = await Promise.all([
    supabase.rpc("public_feed_authors", { _ids: unique }),
    // Visitors who aren't signed in can't read the admin list; that's fine.
    supabase.rpc("list_admin_ids").then((r) => r, () => ({ data: [] })),
  ]);
  const adminSet = new Set(
    (((adminsResult as { data: { user_id: string }[] | null }).data ?? [])).map((a) => a.user_id),
  );
  for (const p of (profiles ?? []) as {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
    verified: boolean | null;
  }[]) {
    map.set(p.id, {
      id: p.id,
      name: p.full_name ?? p.username ?? "Aspirant",
      username: p.username,
      avatar: p.avatar_url,
      verified: !!p.verified,
      role: adminSet.has(p.id) ? "Mentor" : null,
    });
  }
  return map;
}

const fallbackAuthor = (id: string): FeedAuthorLite => ({
  id,
  name: "Aspirant",
  username: null,
  avatar: null,
  verified: false,
  role: null,
});

export function useFeedPosts(sort: "Hot" | "New" | "Top") {
  return useQuery({
    queryKey: ["ufeed-posts", sort],
    queryFn: async (): Promise<FeedPostItem[]> => {
      const query = supabase
        .from("feed_posts")
        .select(
          "id, user_id, body, created_at, image_url, tags, votes_count, comments_count, post_type, document_url, document_title, document_size_kb, document_pages",
        )
        .limit(60);
      const { data, error } =
        sort === "Top"
          ? await query.order("votes_count", { ascending: false })
          : await query.order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const authors = await loadAuthors(rows.map((r) => r.user_id));

      // Which doubt posts already have an accepted solution
      const doubtIds = rows.filter((r) => r.post_type === "doubt").map((r) => r.id);
      const solved = new Set<string>();
      if (doubtIds.length > 0) {
        const { data: sols } = await supabase
          .from("feed_comments")
          .select("post_id")
          .in("post_id", doubtIds)
          .eq("is_solution", true);
        for (const s of sols ?? []) solved.add(s.post_id);
      }

      const [imageUrls, documentUrls] = await Promise.all([
        signedUrls(
          "profile-posts",
          rows.map((row) => row.image_url),
        ),
        signedUrls(
          "feed-documents",
          rows.map((row) => row.document_url),
        ),
      ]);

      const items = await Promise.all(
        rows.map(async (r) => ({
          id: r.id,
          author: authors.get(r.user_id) ?? fallbackAuthor(r.user_id),
          time: timeAgo(r.created_at),
          type: r.post_type,
          solved: solved.has(r.id),
          tags: (r.tags ?? []) as string[],
          content: r.body,
          image: r.image_url?.startsWith("http")
            ? r.image_url
            : (imageUrls.get(r.image_url ?? "") ?? null),
          document: r.document_url
            ? {
                title: r.document_title ?? "Attachment.pdf",
                size: `${(((r.document_size_kb ?? 0) / 1024) || 0).toFixed(1)} MB`,
                pages: r.document_pages ?? 0,
                url: r.document_url.startsWith("http")
                  ? r.document_url
                  : (documentUrls.get(r.document_url) ?? ""),
              }
            : null,
          votes: r.votes_count ?? 0,
          comments: r.comments_count ?? 0,
        })),
      );

      if (sort === "Hot") {
        return items
          .slice()
          .sort(
            (a, b) =>
              b.votes + b.comments * 2 - (a.votes + a.comments * 2),
          );
      }
      return items;
    },
    staleTime: 30_000,
  });
}

export function usePostComments(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["ufeed-comments", postId],
    enabled,
    queryFn: async (): Promise<FeedCommentNode[]> => {
      const { data, error } = await supabase
        .from("feed_comments")
        .select("id, user_id, body, created_at, parent_comment_id, is_solution, votes_count")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = data ?? [];
      const authors = await loadAuthors(rows.map((r) => r.user_id));
      const nodes = new Map<string, FeedCommentNode>();
      for (const r of rows) {
        nodes.set(r.id, {
          id: r.id,
          author: authors.get(r.user_id) ?? fallbackAuthor(r.user_id),
          time: timeAgo(r.created_at),
          content: r.body,
          votes: r.votes_count ?? 0,
          isSolution: !!r.is_solution,
          replies: [],
        });
      }
      const roots: FeedCommentNode[] = [];
      for (const r of rows) {
        const node = nodes.get(r.id)!;
        const parent = r.parent_comment_id ? nodes.get(r.parent_comment_id) : null;
        if (parent) parent.replies.push(node);
        else roots.push(node);
      }
      return roots;
    },
  });
}

export type StoryItem = {
  id: string;
  userId: string;
  user: string;
  avatar: string | null;
  contentImg: string;
  text: string | null;
  time: string;
  hasActiveStory: boolean;
};

export function useFeedStories() {
  return useQuery({
    queryKey: ["ufeed-stories"],
    queryFn: async (): Promise<StoryItem[]> => {
      const { data, error } = await supabase
        .from("feed_stories")
        .select("id, user_id, image_url, text_overlay, created_at")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      const rows = data ?? [];
      const [authors, imageUrls] = await Promise.all([
        loadAuthors(rows.map((r) => r.user_id)),
        signedUrls(
          "feed-stories",
          rows.map((r) => r.image_url),
        ),
      ]);
      return Promise.all(
        rows.map(async (r) => {
          const a = authors.get(r.user_id) ?? fallbackAuthor(r.user_id);
          return {
            id: r.id,
            userId: r.user_id,
            user: a.name,
            avatar: a.avatar,
            contentImg: r.image_url?.startsWith("http")
              ? r.image_url
              : (imageUrls.get(r.image_url ?? "") ?? ""),
            text: r.text_overlay,
            time: timeAgo(r.created_at),
            hasActiveStory: true,
          };
        }),
      );
    },
    staleTime: 60_000,
  });
}

/** Instagram-style grouping: one circle per person, all their stories inside. */
export type StoryGroup = {
  userId: string;
  user: string;
  avatar: string | null;
  time: string;
  items: StoryItem[];
};

export function groupStories(items: StoryItem[]): StoryGroup[] {
  const groups: StoryGroup[] = [];
  const byUser = new Map<string, StoryGroup>();
  for (const item of items) {
    let group = byUser.get(item.userId);
    if (!group) {
      group = { userId: item.userId, user: item.user, avatar: item.avatar, time: item.time, items: [] };
      byUser.set(item.userId, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  // Oldest first inside each person's ring, like Instagram.
  for (const g of groups) g.items.reverse();
  return groups;
}

export function useMyVotes() {
  return useQuery({
    queryKey: ["ufeed-my-votes"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getSession();
      const uid = auth.session?.user?.id;
      if (!uid) return { posts: {} as Record<string, number>, comments: {} as Record<string, number> };
      const [{ data: pv }, { data: cv }] = await Promise.all([
        supabase.from("feed_post_votes").select("post_id, vote_value").eq("user_id", uid),
        supabase.from("feed_comment_votes").select("comment_id, vote_value").eq("user_id", uid),
      ]);
      const posts: Record<string, number> = {};
      for (const r of pv ?? []) posts[r.post_id] = r.vote_value;
      const comments: Record<string, number> = {};
      for (const r of cv ?? []) comments[r.comment_id] = r.vote_value;
      return { posts, comments };
    },
  });
}

async function requireUser() {
  // getSession() reads the local session (no network round-trip) so votes and
  // replies feel instant; the server still enforces RLS.
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user || user.is_anonymous) throw new Error("Sign in to do that");
  return user;
}

type MyVotes = { posts: Record<string, number>; comments: Record<string, number> };

export function useVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kind,
      id,
      value,
    }: {
      kind: "post" | "comment";
      id: string;
      value: number;
    }) => {
      const user = await requireUser();
      const db = supabase as unknown as {
        from: (t: string) => any;
      };
      const table = kind === "post" ? "feed_post_votes" : "feed_comment_votes";
      const idCol = kind === "post" ? "post_id" : "comment_id";
      if (value === 0) {
        const { error } = await db.from(table).delete().eq("user_id", user.id).eq(idCol, id);
        if (error) throw error;
        return;
      }
      const { data: existing } = await db
        .from(table)
        .select("id")
        .eq("user_id", user.id)
        .eq(idCol, id)
        .maybeSingle();
      if (existing) {
        const { error } = await db.from(table).update({ vote_value: value }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await db
          .from(table)
          .insert({ user_id: user.id, [idCol]: id, vote_value: value });
        if (error) throw error;
      }
    },
    // Paint the new vote immediately, then reconcile with the server.
    onMutate: async ({ kind, id, value }) => {
      await qc.cancelQueries({ queryKey: ["ufeed-my-votes"] });
      const prevVotes = qc.getQueryData<MyVotes>(["ufeed-my-votes"]);
      const bucket = kind === "post" ? "posts" : "comments";
      const previous = prevVotes?.[bucket]?.[id] ?? 0;
      const delta = value - previous;

      qc.setQueryData<MyVotes>(["ufeed-my-votes"], (old) => {
        const base: MyVotes = old ?? { posts: {}, comments: {} };
        return { ...base, [bucket]: { ...base[bucket], [id]: value } } as MyVotes;
      });

      if (kind === "post") {
        qc.setQueriesData<FeedPostItem[]>({ queryKey: ["ufeed-posts"] }, (old) =>
          (old ?? []).map((p) => (p.id === id ? { ...p, votes: p.votes + delta } : p)),
        );
      } else {
        qc.setQueriesData<FeedCommentNode[]>({ queryKey: ["ufeed-comments"] }, (old) => {
          if (!old) return old;
          const walk = (nodes: FeedCommentNode[]): FeedCommentNode[] =>
            nodes.map((n) => ({
              ...n,
              votes: n.id === id ? n.votes + delta : n.votes,
              replies: walk(n.replies),
            }));
          return walk(old);
        });
      }
      return { prevVotes };
    },
    onError: (_err, _vars, ctx) => {
      const prev = (ctx as { prevVotes?: MyVotes } | undefined)?.prevVotes;
      if (prev) qc.setQueryData(["ufeed-my-votes"], prev);
      qc.invalidateQueries({ queryKey: ["ufeed-posts"] });
      qc.invalidateQueries({ queryKey: ["ufeed-comments"] });
    },
    onSuccess: () => {
      // Background reconcile only — the UI is already correct.
      qc.invalidateQueries({ queryKey: ["ufeed-my-votes"], refetchType: "none" });
      qc.invalidateQueries({ queryKey: ["ufeed-posts"], refetchType: "none" });
      qc.invalidateQueries({ queryKey: ["ufeed-comments"], refetchType: "none" });
    },
  });
}


export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      body: string;
      tags: string[];
      postType: "note" | "doubt" | "update";
      imageFile?: File | null;
      documentFile?: File | null;
    }) => {
      const user = await requireUser();
      let imagePath: string | null = null;
      let docPath: string | null = null;
      let docSizeKb: number | null = null;
      try {
        if (input.imageFile) {
          const ext = input.imageFile.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "jpg";
          imagePath = `${user.id}/feed-${crypto.randomUUID()}.${ext}`;
          const up = await supabase.storage
            .from("profile-posts")
            .upload(imagePath, input.imageFile, { contentType: input.imageFile.type });
          if (up.error) throw up.error;
        }
        if (input.documentFile) {
          const safeName = input.documentFile.name.replace(/[^a-z0-9._-]/gi, "_");
          docPath = `${user.id}/doc-${crypto.randomUUID()}-${safeName}`;
          const up = await supabase.storage
            .from("feed-documents")
            .upload(docPath, input.documentFile, { contentType: input.documentFile.type });
          if (up.error) throw up.error;
          docSizeKb = Math.round(input.documentFile.size / 1024);
        }
        const { error } = await supabase.from("feed_posts").insert({
          user_id: user.id,
          body: input.body.trim(),
          tags: input.tags,
          post_type: input.postType,
          image_url: imagePath,
          document_url: docPath,
          document_title: input.documentFile?.name ?? null,
          document_size_kb: docSizeKb,
        });
        if (error) throw error;
      } catch (error) {
        await Promise.all([
          imagePath ? supabase.storage.from("profile-posts").remove([imagePath]) : Promise.resolve(),
          docPath ? supabase.storage.from("feed-documents").remove([docPath]) : Promise.resolve(),
        ]);
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ufeed-posts"] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const user = await requireUser();
      const { error } = await supabase.from("feed_posts").delete().eq("id", postId).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ufeed-posts"] }),
  });
}

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, parentId }: { body: string; parentId?: string | null }) => {
      const user = await requireUser();
      const { error } = await supabase.from("feed_comments").insert({
        post_id: postId,
        user_id: user.id,
        body,
        parent_comment_id: parentId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ufeed-comments", postId] });
      qc.invalidateQueries({ queryKey: ["ufeed-posts"] });
    },
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, text }: { file: File; text: string }) => {
      const user = await requireUser();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/story-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("feed-stories").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const { error } = await supabase.from("feed_stories").insert({
        user_id: user.id,
        image_url: path,
        text_overlay: text.trim() || null,
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ufeed-stories"] }),
  });
}

export function useLatestNotice() {
  return useQuery({
    queryKey: ["ufeed-notice"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notices")
        .select("id, title, body, link_url, link_label, pinned, created_at")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 120_000,
  });
}

export function useMyFeedIdentity() {
  return useQuery({
    queryKey: ["ufeed-me"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user || user.is_anonymous) return null;
      const [{ data: profile }, { data: streak }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.rpc("get_login_streak", { p_user_id: user.id }),
      ]);
      return {
        id: user.id,
        name: profile?.full_name ?? profile?.username ?? "You",
        avatar: profile?.avatar_url ?? null,
        streak: (streak as number | null) ?? 0,
      };
    },
  });
}
