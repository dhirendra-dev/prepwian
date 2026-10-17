import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowRight, BookOpen, Clock3, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ArticlesEntryCard } from "@/components/articles/ArticlesEntryCard";
import { GlassSurface } from "@/components/GlassSurface";
import { Skeleton } from "@/components/ui/skeleton";

type ArticlePreview = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  cover_image_url: string | null;
  reading_minutes: number;
  published_at: string | null;
};

const articleDb = supabase as unknown as SupabaseClient;

export function ArticlesHomeSection({ canWrite = false }: { canWrite?: boolean }) {
  const articles = useQuery({
    queryKey: ["articles-home-preview"],
    queryFn: async () => {
      const { data, error } = await articleDb
        .from("articles")
        .select("id,title,slug,summary,category,cover_image_url,reading_minutes,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(3);
      if (error) throw error;
      return (data ?? []) as ArticlePreview[];
    },
    staleTime: 60_000,
    retry: false,
  });

  return (
    <section
      className="mx-auto max-w-6xl px-4 pb-14 sm:px-5"
      aria-labelledby="homepage-articles-title"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
            Read · write · grow
          </p>
          <h2
            id="homepage-articles-title"
            className="mt-1 flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl"
          >
            <BookOpen className="h-6 w-6 text-accent" /> Articles &amp; ideas
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Clear concept explainers, exam strategies and useful insights from fellow learners.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canWrite && (
            <Link
              to="/articles"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              <PenLine className="h-4 w-4" /> Write an article
            </Link>
          )}
          <Link
            to="/articles"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Explore Articles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {articles.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3" aria-label="Loading recent articles">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : articles.data?.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
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
        <GlassSurface className="rounded-2xl p-4 text-sm text-muted-foreground" role="status">
          {articles.isError
            ? "Recent articles are temporarily unavailable. You can still open the Articles library."
            : "New articles are on the way. Visit the library to explore the journal."}
        </GlassSurface>
      )}

      <ArticlesEntryCard articlesHref="/articles" mainHubHref="/dashboard" />
    </section>
  );
}
