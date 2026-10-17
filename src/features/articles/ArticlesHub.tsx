import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const StudyMarkdown = lazy(() =>
  import("@/components/StudyMarkdown").then((m) => ({ default: m.StudyMarkdown })),
);
const ArticleEditor = lazy(() =>
  import("./ArticleEditor").then((m) => ({ default: m.ArticleEditor })),
);
const AuthorDashboard = lazy(() =>
  import("./AuthorDashboard").then((m) => ({ default: m.AuthorDashboard })),
);
import {
  getArticleAuthorProfile,
  profileDisplayName,
  resolveArticleAuthorIdentity,
} from "./article-author";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Clock3,
  Copy,
  Eye,
  Heart,
  Search,
  Share2,
  Sparkles,
  UserRound,
} from "lucide-react";
import "./articles.css";
import "./articles-engineering-theme.css";
const articleDb = supabase as unknown as SupabaseClient;

type ArticleComment = {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
};
type Article = {
  id: string;
  author_id: string | null;
  author_name: string;
  author_avatar_url: string | null;
  author_username?: string | null;
  title: string;
  slug: string;
  summary: string;
  category: string;
  cover_image_url: string | null;
  body_markdown: string;
  status: "draft" | "published";
  reading_minutes: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
const CATEGORIES = [
  "All articles",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Study Strategy",
  "Revision",
  "Test Strategy",
  "Exam Updates",
];
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0] ?? "")
    .join("")
    .toUpperCase();
const authorProfileKey = (author: Pick<Article, "author_id" | "author_username">) =>
  author.author_username?.trim() || author.author_id || "";
const visitorKey = () => {
  const key = "jph_article_visitor";
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(key, value);
  }
  return value;
};

function ArticleLoadingState() {
  return (
    <main className="articles-shell">
      <div className="articles-grid">
        <div className="article-skeleton" />
        <div className="article-skeleton" />
        <div className="article-skeleton" />
      </div>
    </main>
  );
}

export function ArticlesHub({
  initialSlug,
  initialCommentId,
}: {
  initialSlug?: string;
  initialCommentId?: string;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("All articles"),
    [selected, setSelected] = useState<Article | null>(null);
  const [editing, setEditing] = useState<Article | null | "new">(null),
    [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<"library" | "dashboard">("library"),
    [myDrafts, setMyDrafts] = useState(false);
  const [following, setFollowing] = useState(false),
    [likes, setLikes] = useState(0),
    [liked, setLiked] = useState(false),
    [bookmarked, setBookmarked] = useState(false),
    [subscribers, setSubscribers] = useState(0),
    [comments, setComments] = useState<ArticleComment[]>([]),
    [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!initialCommentId || !comments.some((item) => item.id === initialCommentId)) return;
    const frame = requestAnimationFrame(() =>
      document
        .getElementById(`article-comment-${initialCommentId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [comments, initialCommentId]);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError("");
    setUserId(user?.id ?? null);
    let req = articleDb
      .from("articles")
      .select(
        "id,author_id,author_name,author_avatar_url,title,slug,summary,category,cover_image_url,body_markdown,status,reading_minutes,view_count,created_at,updated_at,published_at",
      )
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (initialSlug) {
      req = req.eq("slug", initialSlug).eq("status", "published");
    } else if (myDrafts) {
      if (!user) {
        setArticles([]);
        setLoading(false);
        return;
      }
      req = req.eq("author_id", user.id);
    } else req = req.eq("status", "published");
    const { data, error } = await req;
    if (error) setError(error.message);
    setArticles(await resolveArticleAuthorIdentity((data ?? []) as Article[]));
    setLoading(false);
  }, [initialSlug, myDrafts, user]);
  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);
  const filtered = useMemo(
    () =>
      articles.filter(
        (a) =>
          (category === "All articles" || a.category === category) &&
          (!query.trim() ||
            [a.title, a.summary, a.category, a.author_name].some((s) =>
              s?.toLowerCase().includes(query.trim().toLowerCase()),
            )),
      ),
    [articles, category, query],
  );
  const topAuthors = useMemo(() => {
    const byAuthor = new Map<
      string,
      {
        id: string;
        username: string | null;
        name: string;
        avatar: string | null;
        articles: number;
        reads: number;
      }
    >();
    for (const article of articles) {
      if (!article.author_id) continue;
      const current = byAuthor.get(article.author_id) ?? {
        id: article.author_id,
        username: article.author_username ?? null,
        name: article.author_name,
        avatar: article.author_avatar_url,
        articles: 0,
        reads: 0,
      };
      current.articles += 1;
      current.reads += article.view_count ?? 0;
      byAuthor.set(article.author_id, current);
    }
    return [...byAuthor.values()]
      .sort((a, b) => b.reads - a.reads || b.articles - a.articles)
      .slice(0, 6);
  }, [articles]);

  const openArticle = useCallback(
    async (a: Article) => {
      setSelected(a);
      if (!initialSlug) {
        void navigate({ to: "/articles/$slug", params: { slug: a.slug } });
      }
      setNotice("");
      setUserId(user?.id ?? null);
      try {
        await articleDb.rpc("record_article_view", {
          p_article_id: a.id,
          p_visitor_key: user?.id ?? visitorKey(),
        });
      } catch {
        // View tracking is best-effort and should not interrupt reading.
      }
      const [likeRes, bookmarkRes, followRes, subscriberRes, commentRes] = await Promise.all([
        articleDb
          .from("article_likes")
          .select("id", { count: "exact", head: true })
          .eq("article_id", a.id),
        user
          ? articleDb
              .from("article_bookmarks")
              .select("id")
              .eq("article_id", a.id)
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        user && a.author_id
          ? articleDb
              .from("article_author_subscriptions")
              .select("id")
              .eq("author_id", a.author_id)
              .eq("subscriber_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        a.author_id
          ? articleDb
              .from("article_author_subscriptions")
              .select("id", { count: "exact", head: true })
              .eq("author_id", a.author_id)
          : Promise.resolve({ count: 0 }),
        articleDb
          .from("article_comments")
          .select("id,author_id,author_name,body,created_at")
          .eq("article_id", a.id)
          .eq("status", "visible")
          .order("created_at", { ascending: true })
          .limit(100),
      ]);
      setLikes(likeRes.count ?? 0);
      setLiked(false);
      if (user) {
        const { data } = await articleDb
          .from("article_likes")
          .select("id")
          .eq("article_id", a.id)
          .eq("user_id", user.id)
          .maybeSingle();
        setLiked(!!data);
      } else setLiked(false);
      setBookmarked(!!bookmarkRes.data);
      setFollowing(!!followRes.data);
      setSubscribers(subscriberRes.count ?? 0);
      setComments((commentRes.data ?? []) as ArticleComment[]);
    },
    [initialSlug, navigate, user],
  );
  useEffect(() => {
    if (!initialSlug || loading || selected) return;
    const match = articles.find((a) => a.slug === initialSlug);
    if (match) void openArticle(match);
  }, [initialSlug, loading, articles, selected, openArticle]);
  async function requireLogin() {
    if (!user) {
      setNotice("Please sign in with your existing JEE Prep Hub account to use this feature.");
      return null;
    }
    return user;
  }
  async function share(a: Article) {
    const url = `${window.location.origin}/articles/${a.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: a.title, text: a.summary, url });
      else {
        await navigator.clipboard.writeText(url);
        setNotice("Article link copied. You can share it anywhere.");
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError")
        setNotice("Could not share automatically. Copy this URL: " + url);
    }
  }
  async function toggleLike(a: Article) {
    const user = await requireLogin();
    if (!user) return;
    if (liked) {
      const { error } = await articleDb
        .from("article_likes")
        .delete()
        .eq("article_id", a.id)
        .eq("user_id", user.id);
      if (!error) {
        setLiked(false);
        setLikes((x) => Math.max(0, x - 1));
      }
    } else {
      const { error } = await articleDb
        .from("article_likes")
        .insert({ article_id: a.id, user_id: user.id });
      if (!error) {
        setLiked(true);
        setLikes((x) => x + 1);
      }
    }
  }
  async function toggleBookmark(a: Article) {
    const user = await requireLogin();
    if (!user) return;
    if (bookmarked) {
      const { error } = await articleDb
        .from("article_bookmarks")
        .delete()
        .eq("article_id", a.id)
        .eq("user_id", user.id);
      if (!error) setBookmarked(false);
    } else {
      const { error } = await articleDb
        .from("article_bookmarks")
        .insert({ article_id: a.id, user_id: user.id });
      if (!error) setBookmarked(true);
    }
  }
  async function toggleFollow(a: Article) {
    const user = await requireLogin();
    if (!user) return;
    if (!a.author_id || a.author_id === user.id) {
      setNotice("You cannot subscribe to your own author account.");
      return;
    }
    if (following) {
      const { error } = await articleDb
        .from("article_author_subscriptions")
        .delete()
        .eq("author_id", a.author_id)
        .eq("subscriber_id", user.id);
      if (!error) {
        setFollowing(false);
        setSubscribers((x) => Math.max(0, x - 1));
      }
    } else {
      const { error } = await articleDb
        .from("article_author_subscriptions")
        .insert({ author_id: a.author_id, subscriber_id: user.id });
      if (!error) {
        setFollowing(true);
        setSubscribers((x) => x + 1);
      }
    }
  }
  async function sendComment(a: Article) {
    const user = await requireLogin();
    if (!user) return;
    if (!comment.trim()) return;
    const { data: profile } = await getArticleAuthorProfile(user.id);
    const name = profileDisplayName(profile);
    if (!name) {
      setNotice("We could not verify your profile. Add a full name or username before commenting.");
      return;
    }
    const { data, error } = await articleDb
      .from("article_comments")
      .insert({ article_id: a.id, author_id: user.id, author_name: name, body: comment.trim() })
      .select("id,author_id,author_name,body,created_at")
      .single();
    if (error) {
      setNotice(error.message);
      return;
    }
    setComments((x) => [...x, data]);
    setComment("");
  }

  if (editing !== null)
    return (
      <Suspense fallback={<ArticleLoadingState />}>
        <ArticleEditor
          article={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await loadArticles();
          }}
        />
      </Suspense>
    );
  if (view === "dashboard")
    return (
      <Suspense fallback={<ArticleLoadingState />}>
        <AuthorDashboard
          onBack={() => setView("library")}
          onEdit={(a) => setEditing(a)}
          onNew={() => setEditing("new")}
        />
      </Suspense>
    );
  if (selected)
    return (
      <main className="articles-shell">
        <button
          className="article-back"
          onClick={() => (initialSlug ? void navigate({ to: "/articles" }) : setSelected(null))}
        >
          <ArrowLeft size={17} /> Back to articles
        </button>
        <article className="article-reader">
          {selected.cover_image_url && (
            <img className="article-reader-cover" src={selected.cover_image_url} alt="" />
          )}
          <div className="article-reader-content">
            <span className="article-category">{selected.category}</span>
            <h1>{selected.title}</h1>
            <p className="article-summary">{selected.summary}</p>
            <div className="article-byline">
              {selected.author_avatar_url ? (
                <img className="article-avatar" src={selected.author_avatar_url} alt="" />
              ) : (
                <span className="article-avatar">{initials(selected.author_name)}</span>
              )}
              <span>
                {selected.author_id ? (
                  <Link
                    to="/u/$userId"
                    params={{ userId: authorProfileKey(selected) }}
                    className="article-author-link"
                  >
                    <strong>{selected.author_name}</strong>
                  </Link>
                ) : (
                  <strong>{selected.author_name}</strong>
                )}
                <small>
                  {selected.reading_minutes} min read ·{" "}
                  {new Date(selected.published_at ?? selected.created_at).toLocaleDateString()} ·{" "}
                  <Eye size={12} style={{ display: "inline" }} /> {selected.view_count} views ·{" "}
                  {subscribers} subscribers
                </small>
              </span>
              {selected.author_id === userId && (
                <button
                  className="article-button article-button-quiet"
                  onClick={() => setEditing(selected)}
                >
                  Edit
                </button>
              )}
            </div>
            {selected.author_id && selected.author_id !== userId && (
              <button
                className="article-button article-button-primary"
                onClick={() => void toggleFollow(selected)}
              >
                {following ? "Subscribed to author" : "Subscribe to author"} · {subscribers}
              </button>
            )}
            <div className="article-action-row">
              <button
                className={`article-button ${liked ? "article-button-primary" : "article-button-quiet"}`}
                onClick={() => void toggleLike(selected)}
              >
                <Heart size={16} fill={liked ? "currentColor" : "none"} />{" "}
                {liked ? "Liked" : "Like"} · {likes}
              </button>
              <button
                className={`article-button ${bookmarked ? "article-button-primary" : "article-button-quiet"}`}
                onClick={() => void toggleBookmark(selected)}
              >
                <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />{" "}
                {bookmarked ? "Saved" : "Save"}
              </button>
              <button
                className="article-button article-button-quiet"
                onClick={() => void share(selected)}
              >
                <Share2 size={16} /> Share article
              </button>
              <button
                className="article-button article-button-quiet"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/articles/${selected.slug}`,
                  );
                  setNotice("Link copied to clipboard.");
                }}
              >
                <Copy size={15} /> Copy link
              </button>
            </div>
            {notice && <p className="article-notice">{notice}</p>}
            <div className="article-prose">
              <Suspense fallback={<div className="article-markdown-loading">Loading article…</div>}>
                <StudyMarkdown content={selected.body_markdown} />
              </Suspense>
            </div>
            <section className="article-comments">
              <h2>
                Discussion <span>{comments.length}</span>
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendComment(selected);
                }}
              >
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1500}
                  placeholder="Ask a thoughtful question or share what helped you..."
                />
                <button className="article-button article-button-primary" type="submit">
                  Post comment
                </button>
              </form>
              {comments.map((c) => (
                <div
                  className={`article-comment scroll-mt-6 ${c.id === initialCommentId ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`}
                  id={`article-comment-${c.id}`}
                  key={c.id}
                >
                  <strong>{c.author_name}</strong>
                  <small>{new Date(c.created_at).toLocaleDateString()}</small>
                  <p>{c.body}</p>
                </div>
              ))}
            </section>
          </div>
        </article>
      </main>
    );

  return (
    <main className="articles-shell">
      <section className="articles-hero">
        <div className="articles-hero-copy">
          <span className="articles-eyebrow">
            <Sparkles size={14} /> THE JEE PREP HUB JOURNAL
          </span>
          <h1>
            Ideas that move
            <br />
            <em>you forward.</em>
          </h1>
          <p>
            A growing library of concept explainers, exam strategies and student-written insights.
            Learn something today, share something tomorrow.
          </p>
          <div className="articles-hero-actions">
            <button
              className="article-button article-button-primary"
              onClick={async () => {
                const u = await requireLogin();
                if (u) setEditing("new");
              }}
            >
              Write an article
            </button>
            <button
              className="article-button article-button-glass"
              onClick={() => setView("dashboard")}
            >
              Author dashboard
            </button>
            <button
              className="article-button article-button-glass"
              onClick={() => {
                setMyDrafts((v) => !v);
                setView("library");
              }}
            >
              {myDrafts ? "Browse published" : "My drafts"}
            </button>
          </div>
        </div>
        <div className="articles-hero-art" aria-hidden="true">
          <div className="articles-orbit orbit-one" />
          <div className="articles-orbit orbit-two" />
          <div className="articles-book">
            <BookOpen size={74} />
            <span>
              LEARN
              <br />
              GROW
              <br />
              REPEAT
            </span>
          </div>
          <div className="articles-floating-note note-top">01 / CURIOSITY</div>
          <div className="articles-floating-note note-bottom">Ideas worth keeping.</div>
        </div>
      </section>
      <section className="articles-toolbar">
        <div>
          <span className="articles-eyebrow">THE READING ROOM</span>
          <h2>{myDrafts ? "Your writing desk" : "Explore the library"}</h2>
        </div>
        <label className="articles-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, concepts, authors..."
          />
        </label>
      </section>
      <nav className="articles-categories">
        {CATEGORIES.map((c) => (
          <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </nav>
      {!myDrafts && topAuthors.length > 0 && (
        <section className="articles-authors" aria-labelledby="top-authors-title">
          <div className="articles-authors-heading">
            <div>
              <span className="articles-eyebrow">DISCOVER THE COMMUNITY</span>
              <h2 id="top-authors-title">Top Authors</h2>
              <p>Ranked by real published reads from the current library.</p>
            </div>
          </div>
          <div className="articles-authors-grid">
            {topAuthors.map((author) => (
              <Link
                key={author.id}
                to="/u/$userId"
                params={{ userId: author.username || author.id }}
                className="article-author-card"
              >
                {author.avatar ? (
                  <img src={author.avatar} alt="" className="article-author-avatar" />
                ) : (
                  <span className="article-author-avatar article-author-initials">
                    {initials(author.name)}
                  </span>
                )}
                <span className="article-author-card-copy">
                  <strong>{author.name}</strong>
                  <small>
                    {author.articles} {author.articles === 1 ? "article" : "articles"} ·{" "}
                    {author.reads.toLocaleString()} reads
                  </small>
                </span>
                <span
                  className="article-author-rank"
                  aria-label={`Ranked author with ${author.reads} reads`}
                >
                  #{topAuthors.indexOf(author) + 1}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {error && (
        <div className="articles-error">
          {error}
          <p>Check that the database migration was applied.</p>
        </div>
      )}
      {loading ? (
        <div className="articles-grid">
          {[1, 2, 3].map((i) => (
            <div className="article-skeleton" key={i} />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="articles-grid">
          {filtered.map((a, i) => (
            <article
              className={`article-card ${i === 0 ? "article-card-featured" : ""}`}
              key={a.id}
            >
              <button className="article-card-open" onClick={() => void openArticle(a)}>
                <div className="article-card-image">
                  {a.cover_image_url ? (
                    <img src={a.cover_image_url} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <div className={`article-image-placeholder placeholder-${i % 4}`}>
                      <BookOpen size={36} />
                      <span>{a.category.toUpperCase()}</span>
                    </div>
                  )}
                  <span className="article-image-tag">{a.category}</span>
                </div>
                <div className="article-card-copy">
                  <div className="article-card-meta">
                    {a.author_id ? (
                      <Link
                        to="/u/$userId"
                        params={{ userId: authorProfileKey(a) }}
                        className="article-author-link"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {a.author_name}
                      </Link>
                    ) : (
                      <span>{a.author_name}</span>
                    )}
                    <span>
                      <Clock3 size={13} /> {a.reading_minutes} min
                    </span>
                  </div>
                  <h3>{a.title}</h3>
                  <p>{a.summary}</p>
                  <span className="article-read-link">Read article ↗</span>
                  <span className="article-card-views">
                    <Eye size={13} /> {a.view_count} views
                  </span>
                </div>
              </button>
              <button
                className="article-save"
                aria-label="Share article"
                onClick={() => void share(a)}
              >
                <Share2 size={16} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="articles-empty" role={initialSlug ? "alert" : undefined}>
          <BookOpen size={32} />
          <h3>{initialSlug ? "Article not found" : "No articles found"}</h3>
          <p>
            {initialSlug
              ? "This article may have been unpublished or the link may be incorrect."
              : "Try another search or category, or write the first one."}
          </p>
          {initialSlug ? (
            <Link className="article-button article-button-primary" to="/articles">
              Back to articles
            </Link>
          ) : (
            <button
              className="article-button article-button-primary"
              onClick={async () => {
                const u = await requireLogin();
                if (u) setEditing("new");
              }}
            >
              Write an article
            </button>
          )}
        </div>
      )}
      <footer className="articles-footer">
        <span>
          <UserRound size={15} /> A community of learners and authors
        </span>
        <span>Built for curious minds</span>
      </footer>
    </main>
  );
}
