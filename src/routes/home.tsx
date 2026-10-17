import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/routes/index";
import { getLandingData, type LandingData } from "@/lib/landing.functions";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { name: "description", content: "Explore JEE Prep Hub study resources, focus sessions, community updates and preparation tools." },
      { property: "og:title", content: "Study Resources & Community — JEE Prep Hub" },
      { property: "og:description", content: "Explore JEE Prep Hub study resources, focus sessions, community updates and preparation tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Study Resources & Community — JEE Prep Hub" },
      { name: "twitter:description", content: "Explore JEE Prep Hub study resources, focus sessions, community updates and preparation tools." },{ title: "JEE Prep Hub — Crack JEE Together" }],
    links: [{ rel: "canonical", href: "https://jeeprephub.co.in/home" }],
  }),
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["landing-data"],
      queryFn: () => getLandingData(),
    }),
  component: OriginalHomepage,
});

function OriginalHomepage() {
  const data = Route.useLoaderData() as LandingData;
  return <Landing data={data} />;
}
