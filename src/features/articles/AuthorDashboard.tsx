import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

import { ArrowLeft, Eye, FilePenLine, FileText, Plus, Users } from "lucide-react";
const articleDb = supabase as unknown as SupabaseClient;

type Article = {
  id: string;
  author_id: string | null;
  author_name: string;
  author_avatar_url: string | null;
  title: string;
  slug: string;
  summary: string;
  category: string;
  cover_image_url: string | null;
  body_markdown: string;
  status: "draft" | "published";
  reading_minutes: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  view_count: number;
};
type Props = { onBack: () => void; onEdit: (a: Article) => void; onNew: () => void };
export function AuthorDashboard({ onBack, onEdit, onNew }: Props) {
  const [articles, setArticles] = useState<Article[]>([]),
    [loading, setLoading] = useState(true),
    [subscriberCount, setSubscriberCount] = useState(0);
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }
      const user = auth.user;
      const [ar, subs] = await Promise.all([
        articleDb
          .from("articles")
          .select("*")
          .eq("author_id", user.id)
          .order("updated_at", { ascending: false }),
        articleDb
          .from("article_author_subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("author_id", user.id),
      ]);
      setArticles((ar.data ?? []) as Article[]);
      setSubscriberCount(subs.count ?? 0);
      setLoading(false);
    })();
  }, []);
  const published = articles.filter((a) => a.status === "published"),
    drafts = articles.filter((a) => a.status === "draft"),
    views = published.reduce((sum, a) => sum + (a.view_count ?? 0), 0);
  return (
    <main className="articles-shell">
      <button className="article-back" onClick={onBack}>
        <ArrowLeft size={17} /> Back to library
      </button>
      <section className="author-dashboard-heading">
        <span className="articles-eyebrow">YOUR AUTHOR WORKSPACE</span>
        <h1>Your ideas, in one place.</h1>
        <p>Manage drafts, track readership and keep improving your articles.</p>
        <button className="article-button article-button-primary" onClick={onNew}>
          <Plus size={16} /> New article
        </button>
      </section>
      <div className="author-stats-grid">
        <div>
          <FileText />
          <span>Published</span>
          <strong>{published.length}</strong>
        </div>
        <div>
          <FilePenLine />
          <span>Drafts</span>
          <strong>{drafts.length}</strong>
        </div>
        <div>
          <Eye />
          <span>Total views</span>
          <strong>{views.toLocaleString()}</strong>
        </div>
        <div>
          <Users />
          <span>Subscribers</span>
          <strong>{subscriberCount.toLocaleString()}</strong>
        </div>
      </div>
      <section className="author-article-list">
        <div className="author-list-heading">
          <h2>Your articles</h2>
          <span>{articles.length} total</span>
        </div>
        {loading ? (
          <p>Loading your author workspace…</p>
        ) : articles.length ? (
          articles.map((a) => (
            <div className="author-article-row" key={a.id}>
              <div className="author-article-mark">
                {a.status === "published" ? <FileText /> : <FilePenLine />}
              </div>
              <div className="author-article-info">
                <strong>{a.title}</strong>
                <span>
                  {a.status === "published" ? "Published" : "Draft"} · {a.category} ·{" "}
                  {a.view_count ?? 0} views · Updated {new Date(a.updated_at).toLocaleDateString()}
                </span>
              </div>
              <button className="article-button article-button-quiet" onClick={() => onEdit(a)}>
                Edit
              </button>
            </div>
          ))
        ) : (
          <div className="articles-empty">
            <h3>Your writing journey starts here</h3>
            <p>Create an article or save a draft to see it in this dashboard.</p>
            <button className="article-button article-button-primary" onClick={onNew}>
              Write an article
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
