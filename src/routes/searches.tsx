import { createFileRoute } from "@tanstack/react-router";
import GoogleSearchHome from "@/features/search/GoogleSearchHome";

export const Route = createFileRoute("/searches")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Search JEE Resources — PREPWIAN" },
      { property: "og:description", content: "Search notes, PYQs, articles, lectures, questions and study resources for JEE preparation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Search JEE Resources — PREPWIAN" },
      { name: "twitter:description", content: "Search notes, PYQs, articles, lectures, questions and study resources for JEE preparation." },

      { title: "Search JEE Resources — PREPWIAN" },
      {
        name: "description",
        content:
          "Search notes, PYQs, articles, lectures, questions and study resources for JEE preparation.",
      },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "https://jeeprephub.co.in/searches" }],
  }),
  component: GoogleSearchHome,
});
