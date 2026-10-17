import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission } from "@/lib/permissions";

export const grantPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string; plan: "trial" | "monthly" | "yearly" | "lifetime"; note?: string }) => input)
  .handler(async ({ data, context }) => {
    await assertPermission(context.supabase, context.userId, "pro");

    let expires_at: string | null = null;
    const now = new Date();
    if (data.plan === "trial") expires_at = new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString();
    else if (data.plan === "monthly") expires_at = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    else if (data.plan === "yearly") expires_at = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();

    // cancel any existing active subs first
    await context.supabase
      .from("pro_subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", data.user_id)
      .eq("status", "active");

    const { error } = await context.supabase.from("pro_subscriptions").insert({
      user_id: data.user_id,
      plan: data.plan,
      status: "active",
      expires_at,
      granted_by: context.userId,
      note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokePro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertPermission(context.supabase, context.userId, "pro");
    const { error } = await context.supabase
      .from("pro_subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", data.user_id)
      .eq("status", "active");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
