import { createFileRoute } from "@tanstack/react-router";
import { ArticlesHub } from "@/features/articles/ArticlesHub";

export const Route = createFileRoute("/articles/")({
  head: () => ({
    meta: [
      { property: "og:description", content: "Explore JEE concept explainers, exam strategies and student-written insights." },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Articles — JEE Prep Hub" },
      { name: "twitter:description", content: "Explore JEE concept explainers, exam strategies and student-written insights." },
      { title: "Articles — JEE Prep Hub" },
      {
        name: "description",
        content: "Explore JEE concept explainers, exam strategies and student-written insights.",
      },
      { property: "og:title", content: "Articles — JEE Prep Hub" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://jeeprephub.co.in/articles" },
    ],
    links: [{ rel: "canonical", href: "https://jeeprephub.co.in/articles" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://jeeprephub.co.in" },
            { "@type": "ListItem", position: 2, name: "Articles", item: "https://jeeprephub.co.in/articles" },
          ],
        }),
      },
    ],
  }),
  component: ArticlesHub,
});
