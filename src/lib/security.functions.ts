import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EVENT_TYPES = [
  "login",
  "logout",
  "signup",
  "failed_login",
  "password_reset",
  "profile_update",
  "avatar_change",
  "suspicious",
] as const;

async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const salt = process.env.SECURITY_IP_SALT ?? process.env.SUPABASE_URL ?? "jeeprephub";
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readRequestMeta(): { ip: string | null; ua: string | null } {
  try {
    const h = getRequestHeaders() as unknown as Record<string, string | undefined>;
    const xff = h["x-forwarded-for"] ?? "";
    const ip =
      h["cf-connecting-ip"] ||
      h["x-real-ip"] ||
      (xff ? xff.split(",")[0].trim() : "") ||
      null;
    const ua = h["user-agent"] ?? null;
    return { ip: ip || null, ua: ua || null };
  } catch {
    return { ip: null, ua: null };
  }
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

// Record a security event for the current user
export const logSecurityEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        event_type: z.enum(EVENT_TYPES),
        metadata: z.record(z.string(), z.any()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { ip, ua } = readRequestMeta();
    const ip_hash = await hashIp(ip);

    // Block check
    if (ip_hash) {
      const { data: blocked } = await context.supabase
        .from("blocked_ips")
        .select("id, expires_at")
        .eq("ip_hash", ip_hash)
        .maybeSingle();
      if (blocked && (!blocked.expires_at || new Date(blocked.expires_at) > new Date())) {
        throw new Error("Access denied");
      }
    }

    const { error } = await context.supabase.from("user_security_events").insert({
      user_id: context.userId,
      event_type: data.event_type,
      ip_hash,
      user_agent: ua,
      metadata: data.metadata ?? {},
    });
    if (error) throw error;
    return { ok: true };
  });

// Admin: get security KPIs
export const adminSecurityOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [events24h, failed24h, suspicious24h, moderation, recentEvents] = await Promise.all([
      context.supabase
        .from("user_security_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dayAgo),
      context.supabase
        .from("user_security_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "failed_login")
        .gte("created_at", dayAgo),
      context.supabase
        .from("user_security_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "suspicious")
        .gte("created_at", weekAgo),
      context.supabase.from("user_moderation").select("status"),
      context.supabase
        .from("user_security_events")
        .select("id, user_id, event_type, ip_hash, user_agent, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const modCounts = { active: 0, suspended: 0, banned: 0 };
    (moderation.data ?? []).forEach((r: any) => {
      if (r.status in modCounts) (modCounts as any)[r.status]++;
    });

    return {
      events24h: events24h.count ?? 0,
      failed24h: failed24h.count ?? 0,
      suspicious7d: suspicious24h.count ?? 0,
      moderation: modCounts,
      recentEvents: (recentEvents.data ?? []) as Array<{
        id: string;
        user_id: string | null;
        event_type: string;
        ip_hash: string | null;
        user_agent: string | null;
        created_at: string;
      }>,
    };
  });

// Admin: list events for a user
export const adminListUserEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().uuid(), limit: z.number().int().min(1).max(200).default(100) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("user_security_events")
      .select("*")
      .eq("user_id", data.user_id)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw error;
    return rows ?? [];
  });

// Admin: set moderation status
export const adminSetModeration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        status: z.enum(["active", "suspended", "banned"]),
        reason: z.string().trim().max(500).optional(),
        suspended_until: z.string().datetime().nullable().optional(),
        can_post: z.boolean().optional(),
        can_message: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId) throw new Error("You cannot moderate yourself");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_moderation")
      .upsert(
        {
          user_id: data.user_id,
          status: data.status,
          reason: data.reason ?? null,
          suspended_until: data.suspended_until ?? null,
          can_post: data.can_post ?? true,
          can_message: data.can_message ?? true,
          set_by: context.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (error) throw error;

    // Audit
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      actor_email: context.claims?.email ?? null,
      action: `moderation.${data.status}`,
      target_user_id: data.user_id,
      metadata: { reason: data.reason ?? null, suspended_until: data.suspended_until ?? null },
    });

    // Force sign-out if banning
    if (data.status === "banned" || data.status === "suspended") {
      try {
        await supabaseAdmin.auth.admin.signOut(data.user_id, "global" as any);
      } catch (e) {
        console.error("force signout failed", e);
      }
    }
    return { ok: true };
  });

// Admin: force logout
export const adminForceLogout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.auth.admin.signOut(data.user_id, "global" as any);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      actor_email: context.claims?.email ?? null,
      action: "moderation.force_logout",
      target_user_id: data.user_id,
      metadata: {},
    });
    return { ok: true };
  });

// Admin: delete user
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId) throw new Error("You cannot delete yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw error;
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      actor_email: context.claims?.email ?? null,
      action: "moderation.delete_user",
      target_user_id: data.user_id,
      metadata: {},
    });
    return { ok: true };
  });

// Admin: blocked IPs
export const adminListBlockedIps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("blocked_ips")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const adminBlockIp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        ip: z.string().trim().min(3).max(100),
        reason: z.string().trim().max(500).optional(),
        expires_at: z.string().datetime().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const ip_hash = await hashIp(data.ip);
    if (!ip_hash) throw new Error("Invalid IP");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("blocked_ips").upsert(
      {
        ip_hash,
        reason: data.reason ?? null,
        expires_at: data.expires_at ?? null,
        created_by: context.userId,
      },
      { onConflict: "ip_hash" },
    );
    if (error) throw error;
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      actor_email: context.claims?.email ?? null,
      action: "security.ip_block",
      metadata: { reason: data.reason ?? null },
    });
    return { ok: true };
  });

export const adminUnblockIp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("blocked_ips").delete().eq("id", data.id);
    if (error) throw error;
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      actor_email: context.claims?.email ?? null,
      action: "security.ip_unblock",
      metadata: { id: data.id },
    });
    return { ok: true };
  });

// Admin notes
export const adminListNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("admin_notes")
      .select("*")
      .eq("target_user_id", data.user_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const adminAddNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ user_id: z.string().uuid(), body: z.string().trim().min(1).max(2000) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("admin_notes").insert({
      target_user_id: data.user_id,
      author_id: context.userId,
      body: data.body,
    });
    if (error) throw error;
    return { ok: true };
  });

// Get current user's moderation status (so we can show a banner)
export const getMyModeration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_moderation")
      .select("status, reason, suspended_until, can_post, can_message")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data ?? null;
  });
