import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

import { StudyMarkdown } from "@/components/StudyMarkdown";
import { getArticleAuthorProfile, profileDisplayName } from "./article-author";
import { ArrowLeft, Eye, Save, Send } from "lucide-react";
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
type Props = { article: Article | null; onCancel: () => void; onSaved: (article: Article) => void };
const CATEGORIES = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Study Strategy",
  "Revision",
  "Test Strategy",
  "Exam Updates",
];
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140) || "study-article";

export function ArticleEditor({ article, onCancel, onSaved }: Props) {
  const [title, setTitle] = useState(article?.title ?? ""),
    [summary, setSummary] = useState(article?.summary ?? ""),
    [category, setCategory] = useState(article?.category ?? "Study Strategy"),
    [cover, setCover] = useState(article?.cover_image_url ?? ""),
    [body, setBody] = useState(article?.body_markdown ?? ""),
    [preview, setPreview] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save(status: "draft" | "published") {
    setMessage("");
    if (title.trim().length < 5) return setMessage("Title must have at least 5 characters.");
    if (summary.length > 400) return setMessage("Summary must be under 400 characters.");
    if (body.trim().length < 30) return setMessage("Please add more article content.");
    if (cover && !/^https:\/\/\S+/i.test(cover))
      return setMessage("Cover image URL must start with HTTPS.");
    setBusy(true);
    const { data: auth, error: authError } = await supabase.auth.getUser();
    const user = auth.user;
    if (authError || !user) {
      setBusy(false);
      return setMessage("Please sign in first.");
    }
    if (article && article.author_id !== user.id) {
      setBusy(false);
      return setMessage("You do not have permission to edit this article.");
    }
    const { data: profile, error: profileError } = await getArticleAuthorProfile(user.id);
    const name = profileDisplayName(profile);
    if (profileError || !profile || !name) {
      setBusy(false);
      return setMessage(
        "We could not verify your author profile. Add a full name or username to your profile, then try again.",
      );
    }
    const payload = {
      author_id: user.id,
      author_name: name.slice(0, 80),
      author_avatar_url: profile.avatar_url,
      title: title.trim(),
      slug: article?.slug ?? `${slugify(title)}-${user.id.slice(0, 6)}`,
      summary: summary.trim(),
      category,
      cover_image_url: cover.trim() || null,
      body_markdown: body.trim(),
      status,
      reading_minutes: Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 220)),
      ...(status === "published"
        ? { published_at: article?.published_at ?? new Date().toISOString() }
        : {}),
    };
    const result = article
      ? await articleDb
          .from("articles")
          .update(payload)
          .eq("id", article.id)
          .eq("author_id", user.id)
          .select()
          .single()
      : await articleDb.from("articles").insert(payload).select().single();
    setBusy(false);
    if (result.error || !result.data) return setMessage(result.error?.message ?? "Unable to save.");
    onSaved(result.data as Article);
  }
  return (
    <main className="articles-shell article-editor-shell">
      <button className="article-back" onClick={onCancel}>
        <ArrowLeft size={17} /> Back to library
      </button>
      <div className="article-editor-heading">
        <span className="articles-eyebrow">AUTHOR STUDIO</span>
        <h1>{article ? "Shape your story." : "Publish what you learn."}</h1>
        <p>Explain one idea clearly. Your notes could help another student.</p>
      </div>
      <div className="article-editor-layout">
        <section className="article-editor-form">
          <label>
            Article title
            <input
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Understanding rotational motion"
            />
          </label>
          <label>
            Short introduction
            <textarea
              maxLength={400}
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What will readers learn?"
            />
            <small>{summary.length}/400</small>
          </label>
          <label>
            Topic
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Cover image HTTPS URL
            <input
              type="url"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="https://..."
            />
          </label>
          {cover && (
            <img
              className="article-editor-cover-preview"
              src={cover}
              alt="Cover preview"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <label>
            Article content{" "}
            <span className="article-editor-hint">
              Markdown supports headings, lists, links, images, tables and maths.
            </span>
            <textarea
              className="article-body-input"
              rows={18}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                "## The core idea\n\nExplain the concept in your own words...\n\n![Diagram](https://example.com/diagram.png)\n\n$$F = ma$$"
              }
            />
          </label>
          <div className="article-editor-toolbar">
            <button
              className="article-button article-button-quiet"
              onClick={() => setPreview((v) => !v)}
            >
              <Eye size={16} />
              {preview ? "Hide preview" : "Preview"}
            </button>
            <span>
              {body.trim() ? body.trim().split(/\s+/).length + " words" : "Your ideas start here"}
            </span>
          </div>
          {preview && (
            <div className="article-preview">
              <h2>{title || "Your title"}</h2>
              <p>{summary}</p>
              <div className="article-prose">
                <StudyMarkdown content={body || "Your article preview will appear here."} />
              </div>
            </div>
          )}
          {message && (
            <p className="article-form-message" role="alert">
              {message}
            </p>
          )}
          <div className="article-editor-actions">
            <button
              disabled={busy}
              className="article-button article-button-quiet"
              onClick={() => void save("draft")}
            >
              <Save size={16} />
              Save draft
            </button>
            <button
              disabled={busy}
              className="article-button article-button-primary"
              onClick={() => void save("published")}
            >
              <Send size={16} />
              {article?.status === "published" ? "Update article" : "Publish article"}
            </button>
          </div>
        </section>
        <aside className="article-editor-aside">
          <h3>Make difficult ideas feel simple.</h3>
          <p>
            Use clear titles, examples and diagrams. Credit your sources and only share images you
            have permission to use.
          </p>
          <strong>Before publishing</strong>
          <ul>
            <li>Check formulas and facts</li>
            <li>Credit your sources</li>
            <li>Keep it focused on learning</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
