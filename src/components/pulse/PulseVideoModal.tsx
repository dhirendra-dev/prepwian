import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart, Loader2, Send, Trash2, X } from "lucide-react";
import { haptic } from "@/lib/haptics";
import {
  listVideoComments,
  createVideoComment,
  deleteVideoComment,
  toggleVideoLike,
  getMyVideoLikes,
  saveWatchProgress,
  type VideoComment,
} from "@/lib/pulse.functions";

export type PulseModalVideo = {
  id: string;
  title: string;
  youtube_video_id: string;
  subject: string | null;
  chapter: string | null;
  /** Resume point in seconds, when the viewer has watched part of this lecture. */
  resumeAt?: number | null;
};

type YtPlayer = { getCurrentTime: () => number; getDuration: () => number; destroy: () => void };
type YtNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      playerVars: Record<string, string | number>;
      events?: { onReady?: () => void; onError?: () => void };
    },
  ) => YtPlayer;
};

function loadYouTubeApi(): Promise<YtNamespace> {
  const w = window as unknown as { YT?: YtNamespace; __ytApiPromise?: Promise<YtNamespace> };
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (w.__ytApiPromise) return w.__ytApiPromise;
  w.__ytApiPromise = new Promise<YtNamespace>((resolve, reject) => {
    const done = () => {
      if (w.YT?.Player) resolve(w.YT);
      else reject(new Error("YouTube API unavailable"));
    };
    const prev = (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady;
    (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
      prev?.();
      done();
    };
    // If the script tag is already on the page (e.g. React re-mount), just poll.
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const started = Date.now();
      const poll = setInterval(() => {
        if (w.YT?.Player) { clearInterval(poll); resolve(w.YT); }
        else if (Date.now() - started > 8000) { clearInterval(poll); reject(new Error("YouTube API timeout")); }
      }, 150);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => reject(new Error("YouTube API failed to load"));
    document.head.appendChild(s);
  });
  return w.__ytApiPromise;
}


function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Full-screen lecture player. Uses youtube-nocookie, traps focus, closes on Esc,
 * remembers the watch position, and hosts likes + comments for the lecture.
 */
export function PulseVideoModal({
  video,
  currentUserId,
  isAdmin,
  onClose,
}: {
  video: PulseModalVideo;
  currentUserId?: string | null;
  isAdmin?: boolean;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [likedLocal, setLikedLocal] = useState<boolean | null>(null);
  const [apiFailed, setApiFailed] = useState(false);


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const nodes = panel.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), iframe, a[href], textarea, input",
        );
        if (nodes.length === 0) return;
        const first = nodes[0]!;
        const last = nodes[nodes.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Player + watch-position persistence.
  // The YT API REPLACES the element it mounts on, so we always give it a
  // freshly created child node — never the React-owned ref div itself.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const persist = () => {
      const p = playerRef.current;
      if (!p || !currentUserId) return;
      try {
        const position = Math.floor(p.getCurrentTime());
        const duration = Math.floor(p.getDuration());
        if (!Number.isFinite(position) || position < 5) return;
        saveWatchProgress({
          data: { videoId: video.id, position, duration: Number.isFinite(duration) && duration > 0 ? duration : null },
        }).catch(() => {});
      } catch { /* player not ready */ }
    };

    loadYouTubeApi()
      .then((YT) => {
        const host = mountRef.current;
        if (cancelled || !host) return;
        host.innerHTML = "";
        const target = document.createElement("div");
        target.className = "h-full w-full";
        host.appendChild(target);
        playerRef.current = new YT.Player(target, {
          videoId: video.youtube_video_id,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            start: Math.max(0, Math.floor(video.resumeAt ?? 0)),
            origin: window.location.origin,
          },
          events: {
            onError: () => setApiFailed(true),
          },
        });
        timer = setInterval(persist, 10_000);
      })
      .catch(() => { if (!cancelled) setApiFailed(true); });

    return () => {
      cancelled = true;
      persist();
      if (timer) clearInterval(timer);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
      if (mountRef.current) mountRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id, video.youtube_video_id, currentUserId]);



  const comments = useQuery({
    queryKey: ["video-comments", video.id],
    queryFn: () => listVideoComments({ data: { videoId: video.id } }),
    staleTime: 15_000,
  });

  const { data: myLikes } = useQuery({
    queryKey: ["video-my-likes"],
    queryFn: () => getMyVideoLikes(),
    enabled: !!currentUserId,
    staleTime: 30_000,
  });
  const liked = likedLocal ?? (myLikes?.includes(video.id) ?? false);

  const like = useMutation({
    mutationFn: () => toggleVideoLike({ data: { videoId: video.id } }),
    onMutate: () => { haptic("light"); setLikedLocal(!liked); },
    onError: () => { setLikedLocal(liked); toast.error("Couldn't save your like"); },
    onSuccess: (r) => {
      setLikedLocal(r.liked);
      qc.invalidateQueries({ queryKey: ["video-my-likes"] });
      qc.invalidateQueries({ queryKey: ["pulse-items"] });
    },
  });

  const addComment = useMutation({
    mutationFn: (text: string) => createVideoComment({ data: { videoId: video.id, body: text } }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["video-comments", video.id] });
      qc.invalidateQueries({ queryKey: ["pulse-items"] });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't post your comment"),
  });

  const removeComment = useMutation({
    mutationFn: (id: string) => deleteVideoComment({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video-comments", video.id] });
      qc.invalidateQueries({ queryKey: ["pulse-items"] });
    },
    onError: () => toast.error("Couldn't delete the comment"),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const t = body.trim();
    if (!t) return;
    if (!currentUserId) { toast.error("Sign in to comment"); return; }
    addComment.mutate(t);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto"
      style={{ background: "rgba(8,10,16,.96)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={panel} className="mx-auto flex min-h-full w-full max-w-[520px] flex-col">
        <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3" style={{ background: "rgba(8,10,16,.9)" }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close player"
            className="rounded-full p-2"
            style={{ background: "rgba(255,255,255,.08)", color: "#EDEFF4" }}
          >
            <X className="h-[18px] w-[18px]" />
          </button>
          <span className="pl-mono truncate" style={{ fontSize: 11, color: "#8890A6" }}>
            {video.subject}{video.chapter ? ` · ${video.chapter}` : ""}
          </span>
        </div>

        <div className="w-full" style={{ aspectRatio: "16 / 9", background: "#000" }}>
          {apiFailed ? (
            <iframe
              title={video.title}
              src={`https://www.youtube-nocookie.com/embed/${video.youtube_video_id}?rel=0&modestbranding=1&playsinline=1&autoplay=1&start=${Math.max(0, Math.floor(video.resumeAt ?? 0))}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <div ref={mountRef} className="h-full w-full" />
          )}
        </div>


        <div className="px-4 py-4">
          <h2 className="pl-head" style={{ color: "#EDEFF4", fontWeight: 600, fontSize: 16, lineHeight: 1.3 }}>
            {video.title}
          </h2>
          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={() => (currentUserId ? like.mutate() : toast.error("Sign in to like lectures"))}
              aria-label={liked ? "Unlike lecture" : "Like lecture"}
              aria-pressed={liked}
              className="pl-mono inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{
                fontSize: 12,
                color: liked ? "#FF6B6B" : "#8890A6",
                background: "rgba(255,255,255,.06)",
              }}
            >
              <Heart className={`h-4 w-4 ${like.isPending ? "animate-like-pop" : ""}`} fill={liked ? "currentColor" : "none"} />
              {liked ? "Liked" : "Like"}
            </button>
            <span className="pl-mono" style={{ fontSize: 12, color: "#8890A6" }}>
              {comments.data?.length ?? 0} comment{(comments.data?.length ?? 0) === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="px-4 pb-10">
          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={currentUserId ? "Add a comment…" : "Sign in to comment"}
              disabled={!currentUserId}
              rows={2}
              maxLength={500}
              className="min-w-0 flex-1 resize-none rounded-xl px-3 py-2 outline-none"
              style={{ background: "#171B27", border: "1px solid #2A3145", color: "#EDEFF4", fontSize: 13.5 }}
            />
            <button
              type="submit"
              disabled={!body.trim() || addComment.isPending}
              aria-label="Post comment"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full disabled:opacity-50"
              style={{ background: "#FFC857", color: "#10131C" }}
            >
              {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-4 space-y-3">
            {comments.isLoading && (
              <p className="pl-mono" style={{ fontSize: 11.5, color: "#5B6378" }}>Loading comments…</p>
            )}
            {comments.data?.length === 0 && (
              <p className="pl-mono" style={{ fontSize: 11.5, color: "#5B6378" }}>No comments yet — start the discussion.</p>
            )}
            {comments.data?.map((c: VideoComment) => (
              <div key={c.id} className="flex items-start gap-2.5">
                {c.author_avatar_url ? (
                  <img src={c.author_avatar_url} alt="" loading="lazy" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span
                    className="pl-head grid h-8 w-8 place-items-center rounded-full"
                    style={{ background: "#2A3145", color: "#EDEFF4", fontSize: 12, fontWeight: 700 }}
                  >
                    {(c.author_name ?? "A").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="pl-head truncate" style={{ color: "#EDEFF4", fontSize: 12.5, fontWeight: 600 }}>
                      {c.author_name ?? "Aspirant"}
                    </span>
                    <span className="pl-mono" style={{ fontSize: 10.5, color: "#5B6378" }}>{timeAgo(c.created_at)}</span>
                    {(isAdmin || c.user_id === currentUserId) && (
                      <button
                        type="button"
                        aria-label="Delete comment"
                        onClick={() => removeComment.mutate(c.id)}
                        className="ml-auto rounded p-1"
                        style={{ color: "#5B6378" }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p style={{ color: "#C9CEDB", fontSize: 13.5, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                    {c.comment_text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
