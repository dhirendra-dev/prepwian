import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function guard(userId: string, honeypot?: string) {
  const g = await import("./security-guard.server");
  await g.rejectHoneypot(honeypot, "feedback");
  await g.enforceRateLimit(g.RATE_LIMITS.contact_user, userId);
}

async function assertAdmin(sb: any, userId: string) {
  const { data } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

const submissionSchema = z.object({
  kind: z.enum(["feedback", "material_request"]),
  category: z.string().trim().min(1).max(40),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(5).max(3000),
  honeypot: z.string().max(200).optional(),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submissionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await guard(context.userId, data.honeypot);
    const { error } = await (context.supabase as any).from("feedback_submissions").insert({
      user_id: context.userId,
      kind: data.kind,
      category: data.category,
      rating: data.kind === "feedback" ? (data.rating ?? null) : null,
      subject: data.subject,
      message: data.message,
    });
    if (error) throw new Error("Could not save your submission.");
    return { ok: true as const };
  });

export const postWallMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ message: z.string().trim().min(2).max(500), honeypot: z.string().max(200).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const g = await import("./security-guard.server");
    await g.rejectHoneypot(data.honeypot, "feedback_wall");
    await g.enforceRateLimit(g.RATE_LIMITS.write_user, context.userId);
    const { error } = await (context.supabase as any)
      .from("feedback_wall_posts")
      .insert({ user_id: context.userId, message: data.message });
    if (error) throw new Error("Could not post. Your account may be restricted.");
    return { ok: true as const };
  });

export const toggleWallLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ postId: z.string().uuid(), like: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const g = await import("./security-guard.server");
    await g.enforceRateLimit(g.RATE_LIMITS.write_user, context.userId);
    const sb = context.supabase as any;
    const res = data.like
      ? await sb.from("feedback_wall_likes").upsert({ post_id: data.postId, user_id: context.userId }, { ignoreDuplicates: true })
      : await sb.from("feedback_wall_likes").delete().eq("post_id", data.postId).eq("user_id", context.userId);
    if (res.error) throw new Error("Could not update like.");
    return { ok: true as const };
  });

export const adminUpdateSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "in_progress", "completed", "rejected"]).optional(),
      adminNote: z.string().trim().max(1000).nullable().optional(),
      remove: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase as any;
    if (data.remove) {
      const { error } = await sb.from("feedback_submissions").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true as const };
    }
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.adminNote !== undefined) patch.admin_note = data.adminNote;
    const { error } = await sb.from("feedback_submissions").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminModerateWall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), action: z.enum(["hide", "show", "delete"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase as any;
    const { error } =
      data.action === "delete"
        ? await sb.from("feedback_wall_posts").delete().eq("id", data.id)
        : await sb.from("feedback_wall_posts").update({ hidden: data.action === "hide" }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminSaveForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().trim().min(2).max(150),
      url: z.string().trim().url().startsWith("https://").max(500),
      description: z.string().trim().max(500).nullable().optional(),
      active: z.boolean().default(true),
      remove: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase as any;
    if (data.id && data.remove) {
      const { error } = await sb.from("feedback_forms").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true as const };
    }
    const row = { title: data.title, url: data.url, description: data.description ?? null, active: data.active };
    const { error } = data.id
      ? await sb.from("feedback_forms").update(row).eq("id", data.id)
      : await sb.from("feedback_forms").insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
