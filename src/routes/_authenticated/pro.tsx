import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/pro")({
  beforeLoad: async ({ context }) => {
    const user = context.user;

    if (!user) {
      throw redirect({
        to: "/auth",
      });
    }

    // Keep the existing dashboard architecture:
    // /dashboard contains Classic, Focus and Pro workspaces.
    // /pro simply switches the saved dashboard preference to Pro
    // and then opens the dashboard.
    const { error } = await supabase
      .from("dashboard_preferences")
      .upsert(
        {
          user_id: user.id,
          mode: "pro",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

    if (error) {
      console.error("Failed to set Pro dashboard mode:", error);
    }

    throw redirect({
      to: "/dashboard",
    });
  },

  component: () => null,
});