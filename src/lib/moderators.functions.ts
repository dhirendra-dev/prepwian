import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSION_KEYS } from "@/lib/permissions";

type AnyClient = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown }>;
};

async function assertAdmin(sb: unknown, userId: string) {
  const { data } = await (sb as AnyClient).rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

const permissionSchema = z.array(z.enum(PERMISSION_KEYS)).max(20);

export type ModeratorRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  permissions: string[];
  created_at: string | null;
};

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "mod"
  );
}

function randomPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*?";
  const all = upper + lower + digits + symbols;
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < 14) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

export const adminListModerators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sba = supabaseAdmin as unknown as {
      from: (t: string) => any;
      auth: { admin: { getUserById: (id: string) => Promise<{ data: { user: { email?: string | null } | null } }> } };
    };

    const { data: roleRows } = await sba.from("user_roles").select("user_id").eq("role", "moderator");
    const ids: string[] = (roleRows ?? []).map((r: { user_id: string }) => r.user_id);
    if (ids.length === 0) return { rows: [] as ModeratorRow[] };

    const [{ data: profiles }, { data: perms }] = await Promise.all([
      sba.from("profiles").select("id, full_name").in("id", ids),
      sba.from("moderator_permissions").select("user_id, permissions, created_at").in("user_id", ids),
    ]);
    const pmap = new Map<string, string | null>(
      ((profiles ?? []) as Array<{ id: string; full_name: string | null }>).map((p) => [p.id, p.full_name]),
    );
    const permMap = new Map<string, { permissions: string[]; created_at: string }>(
      ((perms ?? []) as Array<{ user_id: string; permissions: string[]; created_at: string }>).map((p) => [
        p.user_id,
        { permissions: p.permissions, created_at: p.created_at },
      ]),
    );

    const emails = await Promise.all(
      ids.map((id) => sba.auth.admin.getUserById(id).then((r) => r.data.user?.email ?? null).catch(() => null)),
    );

    const rows: ModeratorRow[] = ids.map((id, i) => ({
      user_id: id,
      full_name: pmap.get(id) ?? null,
      email: emails[i] ?? null,
      permissions: permMap.get(id)?.permissions ?? [],
      created_at: permMap.get(id)?.created_at ?? null,
    }));
    return { rows };
  });

export const adminCreateModerator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(80),
        email: z.string().trim().email().optional().or(z.literal("")),
        permissions: permissionSchema,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sba = supabaseAdmin as unknown as {
      from: (t: string) => any;
      auth: { admin: { createUser: (a: Record<string, unknown>) => Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }> } };
    };

    const email =
      data.email && data.email.length > 0
        ? data.email
        : `jeeprephubofficial+${slugify(data.full_name)}${Math.floor(1000 + Math.random() * 9000)}@gmail.com`;
    const password = randomPassword();

    const created = await sba.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error || !created.data.user) throw new Error(created.error?.message ?? "Could not create account");
    const uid = created.data.user.id;

    await sba.from("profiles").upsert({ id: uid, full_name: data.full_name }, { onConflict: "id" });
    await sba.from("user_roles").upsert({ user_id: uid, role: "moderator" }, { onConflict: "user_id,role" });
    await sba.from("moderator_permissions").upsert(
      { user_id: uid, permissions: data.permissions, created_by: context.userId },
      { onConflict: "user_id" },
    );
    try {
      await sba.from("audit_logs").insert({
        actor_id: context.userId,
        action: "admin.moderator.create",
        target_user_id: uid,
        target_email: email,
        metadata: { permissions: data.permissions },
      });
    } catch (e) {
      console.error("audit log failed", e);
    }

    return { email, password, full_name: data.full_name };
  });

export const adminUpdateModeratorPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().uuid(), permissions: permissionSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sba = supabaseAdmin as unknown as { from: (t: string) => any };
    const { error } = await sba
      .from("moderator_permissions")
      .upsert({ user_id: data.user_id, permissions: data.permissions }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    try {
      await sba.from("audit_logs").insert({
        actor_id: context.userId,
        action: "admin.moderator.permissions_update",
        target_user_id: data.user_id,
        metadata: { permissions: data.permissions },
      });
    } catch (e) {
      console.error("audit log failed", e);
    }
    return { ok: true };
  });

export const adminRevokeModerator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId) throw new Error("You cannot revoke your own access.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sba = supabaseAdmin as unknown as { from: (t: string) => any };
    await sba.from("user_roles").delete().eq("user_id", data.user_id).eq("role", "moderator");
    await sba.from("moderator_permissions").delete().eq("user_id", data.user_id);
    try {
      await sba.from("audit_logs").insert({
        actor_id: context.userId,
        action: "admin.moderator.revoke",
        target_user_id: data.user_id,
        metadata: {},
      });
    } catch (e) {
      console.error("audit log failed", e);
    }
    return { ok: true };
  });
