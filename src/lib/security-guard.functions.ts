import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Client-callable guards. These wrap the server-only helpers in
 * security-guard.server.ts (loaded inside the handlers so the secrets and the
 * service-role client never reach the browser bundle).
 */

const GUARD_ACTIONS = ["signin", "signup", "password_reset"] as const;

const guardSchema = z.object({
  action: z.enum(GUARD_ACTIONS),
  token: z.string().max(4096).optional(),
  identity: z.string().trim().max(255).optional(),
  honeypot: z.string().max(200).optional(),
});

/**
 * Called before an authentication attempt. Rate-limits per IP and per
 * identity, verifies the Turnstile token server-side, and trips the honeypot.
 * Returns { ok: true } or throws a 429 / verification error.
 */
export const guardAuthAction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => guardSchema.parse(d))
  .handler(async ({ data }) => {
    const g = await import("./security-guard.server");
    await g.rejectHoneypot(data.honeypot, data.action);

    const ipRule =
      data.action === "signup"
        ? g.RATE_LIMITS.auth_signup_ip
        : data.action === "password_reset"
          ? g.RATE_LIMITS.auth_reset_ip
          : g.RATE_LIMITS.auth_signin_ip;
    await g.enforceRateLimit(ipRule, g.clientIp());

    if (data.identity) {
      const idRule =
        data.action === "password_reset"
          ? g.RATE_LIMITS.auth_reset_id
          : g.RATE_LIMITS.auth_signin_id;
      if (data.action !== "signup") {
        await g.enforceRateLimit(idRule, data.identity.toLowerCase());
      }
    }

    await g.verifyTurnstile(data.token, data.action);
    return { ok: true as const };
  });

/** Tells the UI whether a Turnstile widget must be rendered. Public, non-secret. */
export const getTurnstileState = createServerFn({ method: "GET" }).handler(async () => {
  const g = await import("./security-guard.server");
  return { required: g.turnstileConfigured() };
});
