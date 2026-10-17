import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PolicyDocView } from "@/components/legal/PolicyDoc";
import { getPolicyDoc } from "@/lib/legal/content";

export const Route = createFileRoute("/legal/$docId")({
  loader: ({ params }) => {
    const doc = getPolicyDoc(params.docId);
    if (!doc) throw notFound();
    return { doc };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Policy not found — PREPWIAN" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.doc.title} — PREPWIAN`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.doc.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.doc.summary },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: PolicyNotFound,
  component: PolicyPage,
});

function PolicyPage() {
  const { doc } = Route.useLoaderData();
  return (
    <AppShell>
      <PolicyDocView doc={doc} />
    </AppShell>
  );
}

function PolicyNotFound() {
  return (
    <AppShell>
      <div className="glass-surface rounded-2xl border border-border/60 p-8 text-center">
        <h1 className="font-display text-xl font-bold">Policy not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This policy page does not exist. Open the policy index instead.</p>
      </div>
    </AppShell>
  );
}
