import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileCheck2,
  Heart,
  Loader2,
  MessageCircle,
  PlayCircle,
  Radio,
  Swords,
  Timer,
  Trophy,
  UsersRound,
} from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createComment, getMyLikes, toggleLike } from "@/lib/feed.functions";
import { listPulseItems } from "@/lib/pulse.functions";
import { listPublicTests } from "@/lib/tests.functions";
import type { SupabaseClient } from "@supabase/supabase-js";

const articleDb = supabase as unknown as SupabaseClient;

type PublicTest = {
  id: string;
  name: string;
  description?: string | null;
  exam_type?: string;
  subject?: string;
  difficulty?: string;
  duration_min?: number;
  question_count?: number;
  status?: string;
};
type SearchArticle = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  cover_image_url: string | null;
  reading_minutes: number;
  published_at: string | null;
};

function formatDuration(minutes?: number) {
  return minutes ? `${minutes} min` : "Timed practice";
}

const QUICK_STUDY_TOOLS = [
  {
    label: "Focus timer",
    description: "Study in distraction-free blocks",
    to: "/timer",
    icon: Timer,
  },
  {
    label: "Materials",
    description: "Open notes, modules and PYQs",
    to: "/materials",
    icon: BookOpen,
  },
  { label: "Quiz arena", description: "Challenge yourself in minutes", to: "/quiz", icon: Swords },
  {
    label: "Test series",
    description: "Attempt a real CBT mock",
    to: "/tests",
    icon: ClipboardList,
  },
  {
    label: "Community",
    description: "Ask, discuss and stay consistent",
    to: "/community",
    icon: MessageCircle,
  },
  {
    label: "Planner",
    description: "Turn goals into a study plan",
    to: "/planner",
    icon: CalendarDays,
  },
  { label: "AI chat", description: "Work through a doubt", to: "/ai-chat", icon: Bot },
  {
    label: "Leaderboard",
    description: "See your progress with peers",
    to: "/leaderboard",
    icon: Trophy,
  },
] as const;

export function SearchRecommendations() {
  const { user } = useAuth();
  const getPulseItems = useServerFn(listPulseItems);
  const getPublicTests = useServerFn(listPublicTests);
  const getMyFeedLikes = useServerFn(getMyLikes);
  const toggleFeedLike = useServerFn(toggleLike);
  const addFeedComment = useServerFn(createComment);
  const [likeOverrides, setLikeOverrides] = useState<
    Record<string, { liked: boolean; delta: number }>
  >({});
  const [commentOverrides, setCommentOverrides] = useState<Record<string, number>>({});
  const [commentOpen, setCommentOpen] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const myLikes = useQuery({
    queryKey: ["search-recommendations", "my-feed-likes"],
    queryFn: () => getMyFeedLikes(),
    enabled: !!user,
    staleTime: 60_000,
    retry: false,
  });
  const articles = useQuery({
    queryKey: ["search-recommendations", "articles-all"],
    queryFn: async () => {
      const { data, error } = await articleDb
        .from("articles")
        .select("id,title,slug,summary,category,cover_image_url,reading_minutes,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as SearchArticle[];
    },
    staleTime: 60_000,
    retry: false,
  });
  const videos = useQuery({
    queryKey: ["search-recommendations", "pulse-videos"],
    queryFn: () => getPulseItems({ data: { itemType: "video", limit: 3 } }),
    staleTime: 60_000,
    retry: false,
  });
  const community = useQuery({
    queryKey: ["search-recommendations", "community-posts"],
    queryFn: () => getPulseItems({ data: { itemType: "post", limit: 6 } }),
    staleTime: 30_000,
    retry: false,
  });
  const tests = useQuery({
    queryKey: ["search-recommendations", "tests"],
    queryFn: async () => (await getPublicTests()) as PublicTest[],
    staleTime: 60_000,
    retry: false,
  });
  const toggleLikeNow = async (postId: string) => {
    if (!user) {
      toast.error("Sign in to like community messages");
      return;
    }
    const current = likeOverrides[postId];
    const wasLiked = current?.liked ?? myLikes.data?.posts.includes(postId) ?? false;
    setLikeOverrides((items) => ({
      ...items,
      [postId]: { liked: !wasLiked, delta: wasLiked ? -1 : 1 },
    }));
    try {
      await toggleFeedLike({ data: { targetType: "post", targetId: postId } });
      void myLikes.refetch();
    } catch {
      setLikeOverrides((items) => {
        const next = { ...items };
        delete next[postId];
        return next;
      });
      toast.error("Couldn't save your like");
    }
  };
  const submitComment = async (postId: string) => {
    const body = commentDraft.trim();
    if (!body) return;
    if (!user) {
      toast.error("Sign in to comment on community messages");
      return;
    }
    try {
      await addFeedComment({ data: { postId, body } });
      setCommentDraft("");
      setCommentOverrides((items) => ({ ...items, [postId]: (items[postId] ?? 0) + 1 }));
      setCommentOpen(null);
      toast.success("Comment added");
    } catch {
      toast.error("Couldn't add your comment");
    }
  };

  return (
    <div className="jph-search-recommendations">
      <section
        className="mx-auto max-w-6xl px-4 pb-14 sm:px-5"
        aria-labelledby="search-articles-title"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
              Read · write · grow
            </p>
            <h2
              id="search-articles-title"
              className="mt-1 flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl"
            >
              <BookOpen className="h-6 w-6 text-accent" /> All articles &amp; ideas
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Browse every published explainer, strategy note and learner insight from the JEE Prep
              Hub journal.
            </p>
          </div>
          <Link
            to="/articles"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Open Articles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {articles.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-56 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : articles.data?.length ? (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {articles.data.map((article) => (
              <GlassSurface
                key={article.id}
                as={Link}
                to="/articles/$slug"
                params={{ slug: article.slug }}
                interactive
                className="group overflow-hidden rounded-2xl p-0 transition-transform hover:-translate-y-0.5"
              >
                {article.cover_image_url ? (
                  <img
                    src={article.cover_image_url}
                    alt=""
                    loading="lazy"
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 text-accent">
                    <BookOpen className="h-8 w-8" aria-hidden="true" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="truncate">{article.category}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 normal-case tracking-normal">
                      <Clock3 className="h-3 w-3" /> {article.reading_minutes} min
                    </span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 font-display text-base font-bold leading-snug group-hover:text-primary">
                    {article.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {article.summary}
                  </p>
                </div>
              </GlassSurface>
            ))}
          </div>
        ) : (
          <GlassSurface className="rounded-2xl p-4 text-sm text-muted-foreground">
            Articles are temporarily unavailable.{" "}
            <Link to="/articles" className="font-semibold text-primary">
              Open the library
            </Link>
            .
          </GlassSurface>
        )}
      </section>

      <section
        className="mx-auto max-w-6xl px-4 pb-14 sm:px-5"
        aria-labelledby="search-learning-title"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
              Keep moving
            </p>
            <h2
              id="search-learning-title"
              className="mt-1 flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl"
            >
              Learn, practise, compete
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Fresh lectures, real test series and the spaces where JEE preparation stays active.
            </p>
          </div>
          <Link
            to="/pulse"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Open learning hub <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/watch" className="group">
            <GlassSurface interactive className="h-full rounded-2xl p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <UsersRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold">Watch Party</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Study a lecture together in a synced room.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Join a room <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </GlassSurface>
          </Link>
          <Link to="/pulse" className="group">
            <GlassSurface interactive className="h-full rounded-2xl p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent/15">
                <Radio className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold">Pulse</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Lectures, updates and learner activity in one feed.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Open Pulse <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </GlassSurface>
          </Link>
          <Link to="/tests" className="group">
            <GlassSurface interactive className="h-full rounded-2xl p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <FileCheck2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold">Test series</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {tests.data?.length
                  ? `${tests.data.length} public tests ready to attempt.`
                  : "CBT practice with timed analysis."}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Browse tests <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </GlassSurface>
          </Link>
          <Link to="/quiz" className="group">
            <GlassSurface interactive className="h-full rounded-2xl p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent/15">
                <Swords className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold">Quiz Arena</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Daily challenges and rapid-fire practice for every subject.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Enter arena <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </GlassSurface>
          </Link>
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl px-4 pb-14 sm:px-5"
        aria-labelledby="search-tools-title"
      >
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
            Your study toolkit
          </p>
          <h2 id="search-tools-title" className="mt-1 font-display text-2xl font-bold sm:text-3xl">
            Jump straight in
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The tools you need between two searches.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_STUDY_TOOLS.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="jph-search-tool group flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-3 transition hover:border-primary/40 hover:bg-card/80"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                <tool.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">{tool.label}</span>
                <span className="mt-0.5 block line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                  {tool.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {videos.isLoading || videos.data?.items.length ? (
        <section
          className="mx-auto max-w-6xl px-4 pb-14 sm:px-5"
          aria-labelledby="search-video-title"
        >
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
                Fresh from Pulse
              </p>
              <h2
                id="search-video-title"
                className="mt-1 flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl"
              >
                <PlayCircle className="h-6 w-6 text-accent" /> Recommended lectures
              </h2>
            </div>
            <Link
              to="/pulse"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {videos.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-2xl bg-muted/50" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {videos.data?.items.map((video) => (
                <GlassSurface
                  key={video.id}
                  as={Link}
                  to="/pulse"
                  search={{ v: video.id }}
                  interactive
                  className="group rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="truncate">{video.subject ?? "JEE lecture"}</span>
                    <PlayCircle className="h-4 w-4 shrink-0 text-accent" />
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-display text-base font-bold leading-snug group-hover:text-primary">
                    {video.title ?? "Recommended lecture"}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {video.chapter ?? video.body_text ?? "Open Pulse to continue learning."}
                  </p>
                </GlassSurface>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {community.isLoading || community.data?.items.length ? (
        <section
          className="mx-auto max-w-6xl px-4 pb-14 sm:px-5"
          aria-labelledby="search-community-title"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
                Happening now
              </p>
              <h2
                id="search-community-title"
                className="mt-1 flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl"
              >
                <MessageCircle className="h-6 w-6 text-accent" /> Latest from the community
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Doubts, tips, wins and updates shared by JEE Prep Hub learners.
              </p>
            </div>
            <Link
              to="/pulse"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Join the conversation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {community.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {community.data?.items.map((post) => (
                <GlassSurface key={post.id} interactive className="group rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                    <span className="truncate font-semibold">
                      {post.author_name ?? "JEE learner"}
                    </span>
                    <time dateTime={post.created_at}>
                      {new Date(post.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </time>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed group-hover:text-primary">
                    {post.body_text ?? "Shared an update in the community."}
                  </p>
                  <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void toggleLikeNow(post.id);
                      }}
                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs transition ${likeOverrides[post.id]?.liked || myLikes.data?.posts.includes(post.id) ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"}`}
                      aria-label={
                        likeOverrides[post.id]?.liked || myLikes.data?.posts.includes(post.id)
                          ? "Unlike message"
                          : "Like message"
                      }
                      aria-pressed={
                        likeOverrides[post.id]?.liked ||
                        myLikes.data?.posts.includes(post.id) ||
                        false
                      }
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={
                          likeOverrides[post.id]?.liked || myLikes.data?.posts.includes(post.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                      {Math.max(0, post.like_count + (likeOverrides[post.id]?.delta ?? 0))}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setCommentOpen((current) => (current === post.id ? null : post.id));
                      }}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-muted-foreground transition hover:text-primary"
                      aria-expanded={commentOpen === post.id}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.comment_count + (commentOverrides[post.id] ?? 0)}
                    </button>
                    <Link
                      to="/pulse"
                      className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10"
                    >
                      Open Pulse <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  {commentOpen === post.id && (
                    <form
                      className="mt-3 flex items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void submitComment(post.id);
                      }}
                    >
                      <input
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        placeholder={user ? "Add a helpful comment…" : "Sign in to comment"}
                        maxLength={500}
                        disabled={!user}
                        className="min-w-0 flex-1 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60"
                        aria-label="Write a comment"
                      />
                      <button
                        type="submit"
                        disabled={!user || !commentDraft.trim()}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                        aria-label="Post comment"
                      >
                        {user ? (
                          <ArrowRight className="h-4 w-4" />
                        ) : (
                          <Loader2 className="h-4 w-4" />
                        )}
                      </button>
                    </form>
                  )}
                </GlassSurface>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tests.data?.length ? (
        <section
          className="mx-auto max-w-6xl px-4 pb-14 sm:px-5"
          aria-labelledby="search-tests-title"
        >
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
                Practice with feedback
              </p>
              <h2
                id="search-tests-title"
                className="mt-1 flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl"
              >
                <FileCheck2 className="h-6 w-6 text-accent" /> Test series picks
              </h2>
            </div>
            <Link
              to="/tests"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Browse all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {tests.data.slice(0, 3).map((test) => (
              <GlassSurface
                key={test.id}
                as={Link}
                to="/tests"
                search={{ series: test.id }}
                interactive
                className="group rounded-2xl p-4"
              >
                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>{test.subject ?? test.exam_type ?? "JEE"}</span>
                  <span className="inline-flex items-center gap-1 normal-case tracking-normal">
                    <Clock3 className="h-3 w-3" /> {formatDuration(test.duration_min)}
                  </span>
                </div>
                <h3 className="mt-3 line-clamp-2 font-display text-base font-bold leading-snug group-hover:text-primary">
                  {test.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {test.description ??
                    `${test.difficulty ?? "Mixed difficulty"} practice for focused revision.`}
                </p>
              </GlassSurface>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
