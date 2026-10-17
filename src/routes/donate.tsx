import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import DonationPage from "@/components/DonationPage";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Support JEE Prep Hub" },
      { name: "twitter:description", content: "Help us keep JEE Prep Hub useful and accessible for aspirants." },
      { title: "Support JEE Prep Hub" },
      {
        name: "description",
        content:
          "Support JEE Prep Hub and help keep its study tools and community available to aspirants.",
      },
      { property: "og:title", content: "Support JEE Prep Hub" },
      {
        property: "og:description",
        content: "Help us keep JEE Prep Hub useful and accessible for aspirants.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AppShell>
      <DonationPage />
    </AppShell>
  ),
});
