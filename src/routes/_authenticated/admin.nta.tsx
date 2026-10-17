import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/lib/admin-guard";
import { AppShell } from "@/components/AppShell";
import NTASync from "@/pages/admin/NTASync";

export const Route = createFileRoute("/_authenticated/admin/nta")({
  head: () => ({
    meta: [
      { title: "Admin · NTA Sync — JEE Prep Hub" },
      {
        name: "robots",
        content: "noindex",
      },
    ],
  }),

  ssr: false,

  beforeLoad: async ({ context }) => {
    await requirePermission(context.user.id, "users");
  },

  component: AdminNTAPage,
});

function AdminNTAPage() {
  return (
    <AppShell>
      <NTASync />
    </AppShell>
  );
}