import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import DonationPage from "@/components/DonationPage";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Support PREPWIAN" },
      { name: "twitter:description", content: "Help us keep PREPWIAN useful and accessible for aspirants." },
      { title: "Support PREPWIAN" },
      {
        name: "description",
        content:
          "Support PREPWIAN and help keep its study tools and community available to aspirants.",
      },
      { property: "og:title", content: "Support PREPWIAN" },
      {
        property: "og:description",
        content: "Help us keep PREPWIAN useful and accessible for aspirants.",
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
