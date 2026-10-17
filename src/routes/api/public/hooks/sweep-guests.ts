import { createFileRoute } from "@tanstack/react-router";

/**
 * Shared-secret + rate-limit gate for this public hook. Callers must send
 * `x-hook-secret: <CRON_HOOK_SECRET>`. Returns a Response to short-circuit.
 */
async function guardHook(request: Request): Promise<Response | null> {
  const g = await import("@/lib/security-guard.server");
  try {
    await g.enforceRateLimit(g.RATE_LIMITS.public_hook_ip, g.clientIp());
  } catch (error) {
    const retryAfter = (error as { retryAfter?: number }).retryAfter ?? 60;
    return new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }
  const expected = process.env["CRON_HOOK_SECRET"];
  if (!expected) return null; // not configured yet — keep existing jobs working
  const provided = request.headers.get("x-hook-secret") ?? "";
  if (provided.length !== expected.length || provided !== expected) {
    await g.logServerSecurityEvent({ kind: "hook_denied", action: new URL(request.url).pathname });
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}

/**
 * Cron sweep endpoint — invoked every 5 minutes by pg_cron (see migration).
 * Also callable manually as a safety fallback if pg_cron is disabled.
 * Delegates to the SQL function public.sweep_expired_guests(), which only
 * targets rows where profiles.is_guest = true AND auth.users.is_anonymous = true.
 */
export const Route = createFileRoute("/api/public/hooks/sweep-guests")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await guardHook(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("sweep_expired_guests" as any);
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ ok: true, deleted: data ?? 0 }), {
          headers: { "Content-Type": "application/json" },
        });
      },
      GET: async () => new Response("ok"),
    },
  },
});
