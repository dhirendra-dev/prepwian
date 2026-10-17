import { LinkifiedText } from "@/components/LinkifiedText";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Post = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

async function signedUrl(path: string) {
  const { data } = await supabase.storage.from("profile-posts").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? "";
}

export function ProfilePosts({ userId, isOwner }: { userId: string; isOwner: boolean }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [pickedBlob, setPickedBlob] = useState<Blob | null>(null);
  const [pickedPreview, setPickedPreview] = useState<string | null>(null);
  const [pickedMime, setPickedMime] = useState<string>("image/jpeg");
  const [caption, setCaption] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [viewing, setViewing] = useState<Post | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const posts = useQuery({
    queryKey: ["profile-posts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_posts")
        .select("id, user_id, image_url, caption, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const ids = rows.map((r) => r.id);
      const [{ data: likesAll }, { data: commentsAll }] = ids.length ? await Promise.all([
        supabase.from("profile_post_likes").select("post_id").in("post_id", ids),
        supabase.from("profile_post_comments").select("post_id").in("post_id", ids),
      ]) : [{ data: [] as any[] }, { data: [] as any[] }];
      const likeCounts = new Map<string, number>();
      (likesAll ?? []).forEach((l: any) => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1));
      const commentCounts = new Map<string, number>();
      (commentsAll ?? []).forEach((c: any) => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1));
      const resolved = await Promise.all(rows.map(async (r) => ({
        ...r,
        image_url: r.image_url.startsWith("http") ? r.image_url : await signedUrl(r.image_url),
        likes: likeCounts.get(r.id) ?? 0,
        comments: commentCounts.get(r.id) ?? 0,
      })));
      return resolved as (Post & { likes: number; comments: number })[];
    },
  });

  function onPickFile(f: File) {
    if (!f.type.startsWith("image/")) return toast.error("Pick an image");
    if (f.size > 8 * 1024 * 1024) return toast.error("Image must be under 8 MB");
    setPickedBlob(f);
    setPickedMime(f.type || "image/jpeg");
    setPickedPreview(URL.createObjectURL(f));
  }

  async function publish() {
    if (!user || !pickedBlob) return;
    setPublishing(true);
    try {
      const ext = pickedMime === "image/png" ? "png" : pickedMime === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/post-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("profile-posts").upload(path, pickedBlob, { contentType: pickedMime, upsert: false });
      if (up.error) throw up.error;
      const { error } = await supabase.from("profile_posts").insert({
        user_id: user.id,
        image_url: path,
        caption: caption.trim() || null,
      });
      if (error) throw error;
      toast.success("Posted!");
      if (pickedPreview) URL.revokeObjectURL(pickedPreview);
      setPickedBlob(null);
      setPickedPreview(null);
      setCaption("");
      qc.invalidateQueries({ queryKey: ["profile-posts", userId] });
      qc.invalidateQueries({ queryKey: ["profile-stats", userId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setPublishing(false);
    }
  }

  async function deletePost(p: Post) {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("profile_posts").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setViewing(null);
    qc.invalidateQueries({ queryKey: ["profile-posts", userId] });
  }

  return (
    <div className="mt-4">
      {isOwner && (
        <div className="mb-4 flex flex-col gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
              e.target.value = "";
            }}
          />
          {!pickedBlob ? (
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
              <Plus className="h-4 w-4" /> New post
            </Button>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-3 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                {pickedPreview && <img src={pickedPreview} alt="preview" className="h-24 w-24 shrink-0 rounded-lg object-cover" />}
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption…"
                  maxLength={500}
                  rows={3}
                  className="flex-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => {
                  if (pickedPreview) URL.revokeObjectURL(pickedPreview);
                  setPickedBlob(null);
                  setPickedPreview(null);
                  setCaption("");
                }}>Discard</Button>
                <Button onClick={publish} disabled={publishing}>{publishing ? "Publishing…" : "Publish"}</Button>
              </div>
            </div>
          )}
        </div>
      )}


      {posts.isLoading ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (posts.data ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          {isOwner ? "Share your first post ✨" : "No posts yet."}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {posts.data!.map((p) => (
            <button
              key={p.id}
              onClick={() => setViewing(p)}
              className="group relative aspect-square overflow-hidden rounded-md bg-muted transition-transform active:scale-[0.98]"
            >
              <img
                src={p.image_url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-4 bg-black/0 text-white opacity-0 transition-all duration-200 group-hover:bg-black/45 group-hover:opacity-100">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <Heart className="h-4 w-4 fill-white" /> {(p as any).likes ?? 0}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <MessageCircle className="h-4 w-4 fill-white" /> {(p as any).comments ?? 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          {viewing && <PostView post={viewing} isOwner={isOwner} onDelete={() => deletePost(viewing)} onClose={() => setViewing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PostView({ post, isOwner, onDelete, onClose }: { post: Post; isOwner: boolean; onDelete: () => void; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const author = useQuery({
    queryKey: ["profile-mini", post.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").eq("id", post.user_id).maybeSingle();
      return data;
    },
  });

  const likes = useQuery({
  queryKey: ["profile-post-likes", post.id, user?.id],
  queryFn: async () => {
    const [{ count }, { data: mine }] = await Promise.all([
      supabase
        .from("profile_post_likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", post.id),
      user?.id
        ? supabase
            .from("profile_post_likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return {
      count: count ?? 0,
      likedByMe: !!mine,
    };
  },
});


      const comments = useQuery({
  queryKey: ["profile-post-comments", post.id],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("get_profile_post_comments", {
      p_post_id: post.id,
    });

    if (error) throw error;

    return (data ?? []).map((c) => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      profile: {
        full_name: c.full_name,
        avatar_url: c.avatar_url,
      },
    }));
  },
});

  const iLike = likes.data?.likedByMe ?? false;
const likeCount = likes.data?.count ?? 0;

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to like");
      if (iLike) {
        const { error } = await supabase.from("profile_post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profile_post_likes").insert({ post_id: post.id, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile-post-likes", post.id] }),
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to comment");
      const body = comment.trim();
      if (!body) return;
      const { error } = await supabase.from("profile_post_comments").insert({ post_id: post.id, user_id: user.id, body });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["profile-post-comments", post.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="flex max-h-[88vh] flex-col md:flex-row">
      <div className="bg-black md:w-1/2">
        <img src={post.image_url} alt="" className="max-h-[50vh] w-full object-contain md:max-h-[85vh]" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col md:w-1/2">
        <DialogHeader className="flex-row items-center justify-between border-b p-3 space-y-0">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {author.data?.avatar_url && <AvatarImage src={author.data.avatar_url} />}
              <AvatarFallback className="text-xs">{(author.data?.full_name ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <DialogTitle className="text-sm">{author.data?.full_name ?? "Aspirant"}</DialogTitle>
          </div>
          <div className="flex items-center gap-1">
            {isOwner && (
              <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete post">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Button>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-[15px]">
          {post.caption && (
            <div className="flex gap-2">
              <span className="font-semibold">{author.data?.full_name ?? "Aspirant"}</span>
              <span className="whitespace-pre-wrap break-words"><LinkifiedText text={post.caption} /></span>
            </div>
          )}
          {(comments.data ?? []).map((c: any) => (
            <div key={c.id} className="flex gap-2">
              <span className="font-semibold">{c.profile?.full_name ?? "User"}</span>
              <span className="flex-1 whitespace-pre-wrap break-words"><LinkifiedText text={c.body} /></span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
            </div>
          ))}
          {(comments.data ?? []).length === 0 && !post.caption && (
            <p className="text-center text-xs text-muted-foreground">No comments yet.</p>
          )}
        </div>

        <div className="border-t p-4">
          <div className="mb-2 flex items-center gap-3">
            <button
              onClick={() => toggleLike.mutate()}
              className="active:scale-90 transition-transform"
              aria-label={iLike ? "Unlike" : "Like"}
            >
              <Heart className={`h-6 w-6 ${iLike ? "fill-destructive text-destructive" : ""}`} />
            </button>
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          </div>
          <p className="text-xs font-semibold">{likeCount} {likeCount === 1 ? "like" : "likes"}</p>
          {user && (
            <form
              onSubmit={(e) => { e.preventDefault(); addComment.mutate(); }}
              className="mt-2 flex items-center gap-2"
            >
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment…"
                maxLength={300}
                className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
              <Button type="submit" size="sm" disabled={!comment.trim() || addComment.isPending}>Post</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
