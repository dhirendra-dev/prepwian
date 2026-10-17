import { createFileRoute } from "@tanstack/react-router";

import { YouTubeChecklistPage } from "@/features/youtube-checklist/components/YouTubeChecklistPage";

export const Route = createFileRoute(
  "/_authenticated/youtube-checklist",
)({
  head: () => ({ meta: [
      { property: "og:title", content: "YouTube Study Checklist — JEE Prep Hub" },
      { property: "og:description", content: "Import YouTube playlists and track lecture completion with personal study checklists." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "YouTube Study Checklist — JEE Prep Hub" },
      { name: "twitter:description", content: "Import YouTube playlists and track lecture completion with personal study checklists." },
{ title: "YouTube Study Checklist — JEE Prep Hub" }, { name: "description", content: "Import YouTube playlists and track lecture completion with personal study checklists." }] }),

  component: YouTubeChecklistPage,
});