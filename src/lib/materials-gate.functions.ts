 import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Study-material password gate.
 *
 * The materials table is no longer readable from the browser (RLS allows only
 * admins). Everything a visitor sees comes from `listMaterials` below, which
 * refuses to return anything until the shared password has been entered. The
 * password itself lives hashed in `public.material_gate` so an admin can rotate
 * it as often as they like. `public.trusted_unlock_codes` holds extra
 * permanent passwords for trusted individuals that keep working across
 * rotations of the main password.
 */

type GateSession = { materialsUnlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "jph-materials-gate",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hashesMatch(a: string, b: string) {
  const x = Buffer.from(sha256(a), "utf8");
  const y = Buffer.from(b.trim().toLowerCase(), "utf8");
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

async function hasTrustedMaterialsAccess(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("material_trusted_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

async function hasMaterialsAccess(userId: string) {
  if (await hasTrustedMaterialsAccess(userId)) return true;
  const session = await useSession<GateSession>(sessionConfig());
  return session.data.materialsUnlocked === true;
}

export const getMaterialsGate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ unlocked: await hasMaterialsAccess(context.userId) }));

export const unlockMaterials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { password: string }) => ({ password: String(data?.password ?? "") }))
  .handler(async ({ data }) => {
    if (!data.password) return { ok: false as const };
    {
      const g = await import("./security-guard.server");
      await g.enforceRateLimit(g.RATE_LIMITS.materials_unlock_ip, g.clientIp());
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("material_gate" as never)
      .select("password_hash")
      .eq("id", true)
      .maybeSingle();
    const stored = (row as { password_hash?: string } | null)?.password_hash;

    let matched = !!stored && hashesMatch(data.password, stored);

    if (!matched) {
      const { data: trustedRows } = await supabaseAdmin
        .from("trusted_unlock_codes" as never)
        .select("password_hash");
      matched = ((trustedRows ?? []) as { password_hash: string }[]).some((r) =>
        hashesMatch(data.password, r.password_hash),
      );
    }

    if (!matched) return { ok: false as const };
    const session = await useSession<GateSession>(sessionConfig());
    await session.update({ materialsUnlocked: true });
    return { ok: true as const };
  });

export const lockMaterials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const session = await useSession<GateSession>(sessionConfig());
    await session.clear();
    return { ok: true as const };
  });

export type GatedMaterial = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  topic: string | null;
  class_level: string;
  resource_type: string;
  drive_url: string;
};

const materialFiltersSchema = z.object({
  subject: z.enum(["all", "physics", "chemistry", "mathematics", "general"]).default("all"),
  class_level: z.enum(["all", "class_11", "class_12", "dropper", "both"]).default("all"),
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type MaterialFilters = z.infer<typeof materialFiltersSchema>;

/**
 * Returns one filtered page from the complete library. Filtering and counting
 * happen in Postgres, so PostgREST's per-response row cap cannot hide matches.
 */
export const listMaterials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => materialFiltersSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    if (!(await hasMaterialsAccess(context.userId))) {
      return {
        locked: true as const,
        materials: [] as GatedMaterial[],
        total: 0,
        page: data.page,
        pageSize: data.pageSize,
        hasNextPage: false,
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let query = supabaseAdmin
      .from("materials")
      .select("id, title, description, subject, topic, class_level, resource_type, drive_url", {
        count: "exact",
      });

    if (data.subject !== "all") query = query.eq("subject", data.subject);
    if (data.class_level !== "all") {
      query = data.class_level === "both"
        ? query.eq("class_level", "both")
        : query.in("class_level", [data.class_level, "both"]);
    }

    // PostgREST's `or` syntax uses commas and parentheses structurally. Remove
    // those delimiters from user text before applying a full-table ILIKE search.
    const search = data.search.replace(/[(),%_]/g, " ").replace(/\s+/g, " ").trim();
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,topic.ilike.%${search}%`,
      );
    }

    const { data: rows, error, count } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);
    if (error) throw error;

    const total = count ?? 0;
    return {
      locked: false as const,
      materials: (rows ?? []) as GatedMaterial[],
      total,
      page: data.page,
      pageSize: data.pageSize,
      hasNextPage: to + 1 < total,
    };
  });

/* ---------------------------------- admin --------------------------------- */

async function assertAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data: isAdmin } = await (context.supabase as never as {
    rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: boolean | null }>;
  }).rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

export const getMaterialPasswordMeta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("material_gate" as never)
      .select("updated_at")
      .eq("id", true)
      .maybeSingle();
    return { updatedAt: (data as { updated_at?: string } | null)?.updated_at ?? null };
  });

export const setMaterialPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { password: string }) => ({ password: String(data?.password ?? "") }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const password = data.password.trim();
    if (password.length < 6) throw new Error("Password must be at least 6 characters");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("material_gate" as never)
      .upsert({ id: true, password_hash: sha256(password), updated_at: new Date().toISOString() } as never);
    if (error) throw error;
    return { ok: true as const };
  });

export const adminSetTrustedMaterialsAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ user_id: z.string().uuid(), trusted: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.trusted) {
      const { error } = await supabaseAdmin
        .from("material_trusted_users")
        .upsert({ user_id: data.user_id, granted_by: context.userId }, { onConflict: "user_id" });
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("material_trusted_users")
        .delete()
        .eq("user_id", data.user_id);
      if (error) throw error;
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      actor_email: context.claims?.email ?? null,
      action: data.trusted ? "materials.trusted_access.grant" : "materials.trusted_access.revoke",
      target_user_id: data.user_id,
      metadata: {},
    });
    return { ok: true as const };
  });