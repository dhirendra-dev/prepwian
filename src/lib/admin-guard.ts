import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { PermissionKey } from "@/lib/permissions";

/**
 * Route guard for admin sections. Full admins pass everything; moderators pass
 * only the sections they were granted. Redirects to /dashboard otherwise.
 */
export async function requirePermission(userId: string, permission: PermissionKey) {
  const { data } = await (supabase as any).rpc("has_permission", {
    _user_id: userId,
    _permission: permission,
  });
  if (!data) throw redirect({ to: "/dashboard" });
}

/** Guard for full-admin-only sections (security, audit, moderator management). */
export async function requireFullAdmin(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw redirect({ to: "/dashboard" });
}
