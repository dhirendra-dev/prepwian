import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  subject: z.string().trim().min(3, "Subject is too short").max(200),
  body: z.string().trim().min(10, "Please describe your issue").max(5000),
  token: z.string().max(4096).optional(),
  honeypot: z.string().max(200).optional(),
});

const DEVELOPER_ACCESS_SUBJECT = "[Developer Access Request]";
const DEFAULT_ALERT_FROM = "noreply@jeeprephub.co.in";
const DEFAULT_ALERT_DOMAIN = "jeeprephub.co.in";
const DEFAULT_REQUEST_DURATION = "Other / administrator discretion";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

async function queueDeveloperAccessAlerts(input: {
  requestId: string;
  subject: string;
  body: string;
  requesterEmail: string;
}): Promise<void> {
  if (!input.subject.startsWith(DEVELOPER_ACCESS_SUBJECT)) return;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: adminRoles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (roleError) throw roleError;

    const adminEmails = await Promise.all(
      (adminRoles ?? []).map(async ({ user_id }) => {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(user_id);
        if (error) {
          console.warn("Could not resolve an admin email for developer access alert", {
            userId: user_id,
            error: error.message,
          });
          return null;
        }
        return data.user?.email?.trim() || null;
      }),
    );

    const recipients = [...new Set(adminEmails.filter((email): email is string => Boolean(email)))];
    if (recipients.length === 0) {
      console.warn("Developer access request has no admin email recipients", {
        requestId: input.requestId,
      });
      return;
    }

    const from = process.env.DEVELOPER_ACCESS_ALERT_FROM_EMAIL ?? DEFAULT_ALERT_FROM;
    const senderDomain = process.env.DEVELOPER_ACCESS_ALERT_SENDER_DOMAIN ?? DEFAULT_ALERT_DOMAIN;
    const safeSubject = escapeHtml(input.subject);
    const safeRequesterEmail = escapeHtml(input.requesterEmail || "Unknown account");
    const safeBody = escapeHtml(input.body).replace(/\n/g, "<br />");
    const text = [
      "A user submitted a developer access request.",
      "",
      `Requester: ${input.requesterEmail || "Unknown account"}`,
      `Subject: ${input.subject}`,
      "",
      input.body,
      "",
      "Review the request in the admin contact inbox: https://jeeprephub.co.in/admin/contact",
    ].join("\n");

    await Promise.all(
      recipients.map(async (to) => {
        const messageId = `developer-access-${input.requestId}-${to.toLowerCase()}`;
        const { error } = await supabaseAdmin.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            queued_at: new Date().toISOString(),
            to,
            from,
            sender_domain: senderDomain,
            subject:
              `New developer access request: ${input.subject.replace(DEVELOPER_ACCESS_SUBJECT, "").trim()}`.slice(
                0,
                200,
              ),
            html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033"><h2>New developer access request</h2><p><strong>Requester:</strong> ${safeRequesterEmail}</p><p><strong>Subject:</strong> ${safeSubject}</p><hr /><p>${safeBody}</p><p><a href="https://jeeprephub.co.in/admin/contact">Review in the admin contact inbox</a></p></div>`,
            text,
            purpose: "transactional",
            label: "developer-access-request-admin-alert",
            idempotency_key: messageId,
          },
        });
        if (error) throw error;
      }),
    );
  } catch (error) {
    // The contact row and database-backed admin notification remain authoritative.
    // Email delivery can be retried from the queue without blocking the user's request.
    console.error("Could not queue developer access admin email alert", {
      requestId: input.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function createDeveloperAccessRequest(input: {
  contactMessageId: string;
  requesterId: string;
  requesterEmail: string;
  body: string;
}): Promise<void> {
  const duration =
    input.body.match(/^Requested duration:\s*(.+)$/m)?.[1]?.trim() ?? DEFAULT_REQUEST_DURATION;
  const purpose = input.body.match(/^Purpose:\s*(.+)$/m)?.[1]?.trim() ?? "Developer access request";
  const details = input.body
    .replace(/^Requested duration:.*\n?/m, "")
    .replace(/^Purpose:.*\n?/m, "")
    .replace(/^Requested from:.*$/m, "")
    .trim();
  const safeDuration = ["1 hour", "1 day", "1 week", DEFAULT_REQUEST_DURATION].includes(duration)
    ? duration
    : DEFAULT_REQUEST_DURATION;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // The generated Supabase types are refreshed from the deployed schema separately.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin as any).from("developer_access_requests").insert({
    contact_message_id: input.contactMessageId,
    requester_id: input.requesterId,
    requester_email: input.requesterEmail || null,
    purpose,
    details: details || purpose,
    requested_duration: safeDuration,
  });
  if (error) throw error;
}

/**
 * Contact/support submission. Server-side validated, Turnstile-verified,
 * rate limited per user and per IP, honeypot-trapped, and written with the
 * caller's own RLS-scoped client (user_id can never be spoofed).
 */
export const submitContactMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const g = await import("./security-guard.server");
    const userId = context.userId;

    await g.rejectHoneypot(data.honeypot, "contact", { userId });
    await g.enforceRateLimit(g.RATE_LIMITS.contact_ip, g.clientIp(), { userId });
    await g.enforceRateLimit(g.RATE_LIMITS.contact_user, userId, { userId });
    await g.verifyTurnstile(data.token, "contact", { userId });

    // Duplicate rapid submissions: same subject within 2 minutes is ignored.
    const { data: recent } = await context.supabase
      .from("contact_messages")
      .select("id,subject,created_at")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 2 * 60 * 1000).toISOString())
      .limit(5);
    if ((recent ?? []).some((r) => (r as { subject?: string }).subject === data.subject)) {
      return { ok: true as const, duplicate: true as const };
    }

    const requesterEmail = (context.claims as { email?: string } | null)?.email ?? "";
    const { data: insertedMessage, error } = await context.supabase
      .from("contact_messages")
      .insert({
        user_id: userId,
        user_email: requesterEmail || null,
        subject: data.subject,
        body: data.body,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (data.subject.startsWith(DEVELOPER_ACCESS_SUBJECT)) {
      await createDeveloperAccessRequest({
        contactMessageId: insertedMessage.id,
        requesterId: userId,
        requesterEmail,
        body: data.body,
      });
    }

    await queueDeveloperAccessAlerts({
      requestId: insertedMessage.id,
      subject: data.subject,
      body: data.body,
      requesterEmail,
    });
    return { ok: true as const, duplicate: false as const };
  });
