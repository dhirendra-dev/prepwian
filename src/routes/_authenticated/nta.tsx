import { createFileRoute } from "@tanstack/react-router";
import NTAHub from "@/pages/NTAHub";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/nta")({
  head: () => ({
    meta: [
      { property: "og:title", content: "NTA JEE Main — JEE Prep Hub" },
      { property: "og:description", content: "Official JEE Main notices, question papers, answer keys and information bulletins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "NTA JEE Main — JEE Prep Hub" },
      { name: "twitter:description", content: "Official JEE Main notices, question papers, answer keys and information bulletins." },

      {
        title: "NTA JEE Main — JEE Prep Hub",
      },
      {
        name: "description",
        content:
          "Official JEE Main notices, question papers, answer keys and information bulletins.",
      },
    ],
  }),
  component: NtaRoute,
});

function NtaRoute() {
  return (
    <AppShell>
      <NTAHub />
    </AppShell>
  );
}