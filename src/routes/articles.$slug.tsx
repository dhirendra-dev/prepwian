import { createFileRoute } from "@tanstack/react-router";
import { ArticlesHub } from "@/features/articles/ArticlesHub";
import { z } from "zod";

const BASE = "https://jeeprephub.co.in";

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const Route = createFileRoute("/articles/$slug")({
  head: ({ params }) => {
    const title = `${titleFromSlug(params.slug)} — PREPWIAN`;
    const url = `${BASE}/articles/${params.slug}`;
    return {
      meta: [
      { name: "description", content: `Read ${titleFromSlug(params.slug)}: a JEE preparation article from the PREPWIAN community.` },
      { property: "og:description", content: `Read ${titleFromSlug(params.slug)}: a JEE preparation article from the PREPWIAN community.` },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: `Read ${titleFromSlug(params.slug)}: a JEE preparation article from the PREPWIAN community.` },
        { title },
        { property: "og:title", content: title },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: titleFromSlug(params.slug),
            mainEntityOfPage: url,
            publisher: {
              "@type": "Organization",
              name: "PREPWIAN",
              url: BASE,
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: BASE },
              { "@type": "ListItem", position: 2, name: "Articles", item: `${BASE}/articles` },
              { "@type": "ListItem", position: 3, name: titleFromSlug(params.slug), item: url },
            ],
          }),
        },
      ],
    };
  },
  validateSearch: z.object({ comment: z.string().optional() }),
  component: ArticlePermalink,
});

function ArticlePermalink() {
  const { slug } = Route.useParams();
  const { comment } = Route.useSearch();
  return <ArticlesHub initialSlug={slug} initialCommentId={comment} />;
}
