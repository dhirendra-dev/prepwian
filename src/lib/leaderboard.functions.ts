import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Idempotent: records winners (and awards 7-day Pro) only for weeks that have fully ended.
export const finalizeWeeklyWinners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("finalize_weekly_winners" as never);
    if (error) throw new Error(error.message);
    return { finalized: Number(data ?? 0) };
  });
