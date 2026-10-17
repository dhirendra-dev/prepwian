import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission } from "@/lib/permissions";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

async function assertAdmin(sb: ReturnType<typeof publicClient>, userId: string) {
  const { data } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export type ModerationStatus = "active" | "suspended" | "banned";

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_materials_trusted: boolean;
  moderation_status: ModerationStatus;
  moderation_reason: string | null;
  suspended_until: string | null;
};

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        search: z.string().trim().max(200).optional(),
        page: z.number().int().min(1).max(500).default(1),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    await assertPermission(sb, context.userId, "users");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const perPage = 50;
    const list = await supabaseAdmin.auth.admin.listUsers({ page: data.page, perPage });
    if (list.error) throw list.error;

    let users = list.data.users;
    // Fetch profile matches by name when a search term is present so admins can find users by name too.
    let extraUsersById = new Map<string, typeof users[number]>();
    if (data.search) {
      const q = data.search.toLowerCase();
      const emailMatches = users.filter((u) => u.email?.toLowerCase().includes(q));
      const { data: nameMatches } = await sb
        .from("profiles")
        .select("id")
        .ilike("full_name", `%${data.search}%`)
        .limit(100);
      const nameIds = (nameMatches ?? []).map((r) => r.id).filter((id) => !emailMatches.some((u) => u.id === id));
      if (nameIds.length > 0) {
        const results = await Promise.all(
          nameIds.map((id) => supabaseAdmin.auth.admin.getUserById(id).then((r) => r.data.user).catch(() => null)),
        );
        for (const u of results) if (u) extraUsersById.set(u.id, u as typeof users[number]);
      }
      users = [...emailMatches, ...Array.from(extraUsersById.values())];
    }
    const ids = users.map((u) => u.id);
    const [profiles, roles, moderation, trustedMaterials] = await Promise.all([
      ids.length
        ? sb.from("profiles").select("id, full_name, avatar_url").in("id", ids)
        : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; avatar_url: string | null }> }),
      ids.length
        ? sb.from("user_roles").select("user_id, role").in("user_id", ids).eq("role", "admin")
        : Promise.resolve({ data: [] as Array<{ user_id: string; role: string }> }),
      ids.length
        ? sb.from("user_moderation").select("user_id, status, reason, suspended_until").in("user_id", ids)
        : Promise.resolve({ data: [] as Array<{ user_id: string; status: string; reason: string | null; suspended_until: string | null }> }),
      ids.length
        ? supabaseAdmin.from("material_trusted_users").select("user_id").in("user_id", ids)
        : Promise.resolve({ data: [] as Array<{ user_id: string }> }),
    ]);
    const pmap = new Map((profiles.data ?? []).map((p) => [p.id, p]));
    const adminSet = new Set((roles.data ?? []).map((r) => r.user_id));
    const trustedMaterialsSet = new Set((trustedMaterials.data ?? []).map((r) => r.user_id));
    const modMap = new Map((moderation.data ?? []).map((m) => [m.user_id, m]));

    const rows: AdminUserRow[] = users.map((u) => {
      const mod = modMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        full_name: pmap.get(u.id)?.full_name ?? null,
        avatar_url: pmap.get(u.id)?.avatar_url ?? null,
        is_admin: adminSet.has(u.id),
        is_materials_trusted: trustedMaterialsSet.has(u.id),
        moderation_status: (mod?.status as ModerationStatus) ?? "active",
        moderation_reason: mod?.reason ?? null,
        suspended_until: mod?.suspended_until ?? null,
      };
    });
    return { rows, page: data.page, perPage, hasMore: !data.search && list.data.users.length === perPage };
  });

export const adminSetModeration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      status: z.enum(["active", "suspended", "banned"]),
      reason: z.string().trim().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    await assertPermission(sb, context.userId, "users");
    if (data.user_id === context.userId) throw new Error("You cannot moderate your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.status === "active") {
      // Unban / unsuspend: remove the row so is_user_active() returns true.
      const { error } = await supabaseAdmin.from("user_moderation").delete().eq("user_id", data.user_id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from("user_moderation").upsert({
        user_id: data.user_id,
        status: data.status,
        reason: data.reason ?? null,
        set_by: context.userId,
        can_post: false,
        can_message: false,
      }, { onConflict: "user_id" });
      if (error) throw error;
    }

    try {
      const target = await supabaseAdmin.auth.admin.getUserById(data.user_id);
      await supabaseAdmin.from("audit_logs").insert({
        actor_id: context.userId,
        action: `admin.moderation.${data.status}`,
        target_user_id: data.user_id,
        target_email: target.data.user?.email ?? null,
        metadata: { reason: data.reason ?? null },
      });
    } catch (e) {
      console.error("audit log failed", e);
    }
    return { ok: true };
  });

export const adminSetAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().uuid(), is_admin: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as ReturnType<typeof publicClient>;
    await assertAdmin(sb, context.userId);
    if (data.user_id === context.userId && !data.is_admin) {
      throw new Error("You cannot remove your own admin role.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.is_admin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", "admin");
      if (error) throw error;
    }

    // Best-effort audit log
    try {
      const [actor, target] = await Promise.all([
        supabaseAdmin.auth.admin.getUserById(context.userId),
        supabaseAdmin.auth.admin.getUserById(data.user_id),
      ]);
      await supabaseAdmin.from("audit_logs").insert({
        actor_id: context.userId,
        actor_email: actor.data.user?.email ?? null,
        action: data.is_admin ? "admin.role.grant" : "admin.role.revoke",
        target_user_id: data.user_id,
        target_email: target.data.user?.email ?? null,
        metadata: { role: "admin" },
      });
    } catch (e) {
      console.error("audit log failed", e);
    }
    return { ok: true };
  });
