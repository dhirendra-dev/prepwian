import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission } from "@/lib/permissions";
import type { Database } from "@/integrations/supabase/types";

type Json = Database["public"]["Tables"]["audit_logs"]["Row"]["metadata"];

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  metadata: Json;
  created_at: string;
};

export const adminListAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        search: z.string().trim().max(200).optional(),
        action: z.string().trim().max(100).optional(),
        page: z.number().int().min(1).max(500).default(1),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context.supabase, context.userId, "users");

    const perPage = 50;
    const from = (data.page - 1) * perPage;
    const to = from + perPage - 1;

    let q = context.supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.action) q = q.eq("action", data.action);
    if (data.search) {
      const s = data.search.replace(/%/g, "");
      q = q.or(
        `actor_email.ilike.%${s}%,target_email.ilike.%${s}%,action.ilike.%${s}%`,
      );
    }

    const { data: rows, error, count } = await q;
    if (error) throw error;
    return {
      rows: (rows ?? []) as AuditLogRow[],
      page: data.page,
      perPage,
      total: count ?? 0,
      hasMore: (count ?? 0) > to + 1,
    };
  });

export const logUserEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        action: z.enum(["auth.sign_in", "auth.sign_out", "auth.sign_up"]),
        metadata: z.record(z.string(), z.any()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = context.claims?.email ?? null;
    const { error } = await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      actor_email: email,
      action: data.action,
      target_user_id: context.userId,
      target_email: email,
      metadata: (data.metadata ?? {}) as Json,
    });
    if (error) throw error;
    return { ok: true };
  });
