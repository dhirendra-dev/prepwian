import { createFileRoute } from "@tanstack/react-router";
import NewCommunityFeed from "@/components/NewCommunityFeed";

const SITE_URL = "https://jeeprephub.co.in";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Community Feed — JEE Prep Hub" },
      { name: "twitter:description", content: "Ask doubts, share notes and connect with fellow JEE aspirants." },
      { title: "Community Feed — JEE Prep Hub" },
      { name: "description", content: "Share doubts, notes and study updates with JEE aspirants, and get useful answers from the community." },
      { property: "og:title", content: "Community Feed — JEE Prep Hub" },
      { property: "og:description", content: "Ask doubts, share notes and connect with fellow JEE aspirants." },
      { property: "og:url", content: `${SITE_URL}/feed` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/feed` }],
  }),
  component: NewCommunityFeed,
});
