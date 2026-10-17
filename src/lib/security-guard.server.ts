/**
 * Server-only abuse protection: Cloudflare Turnstile verification,
 * database-backed rate limiting and security logging.
 *
 * Nothing in this file may be imported from client code — it reads
 * server secrets (TURNSTILE_SECRET_KEY) and uses the service-role client.
 */
import { getRequestHeaders } from "@tanstack/react-start/server";

export type RateLimitRule = { action: string; limit: number; windowSeconds: number };

/** Canonical limits per sensitive action. Keep them generous enough for humans. */
export const RATE_LIMITS = {
  auth_signin_ip: { action: "auth_signin_ip", limit: 20, windowSeconds: 600 },
  auth_signin_id: { action: "auth_signin_id", limit: 8, windowSeconds: 600 },
  auth_signup_ip: { action: "auth_signup_ip", limit: 6, windowSeconds: 3600 },
  auth_reset_ip: { action: "auth_reset_ip", limit: 6, windowSeconds: 3600 },
  auth_reset_id: { action: "auth_reset_id", limit: 3, windowSeconds: 900 },
  contact_user: { action: "contact_user", limit: 3, windowSeconds: 3600 },
  contact_ip: { action: "contact_ip", limit: 10, windowSeconds: 3600 },
  materials_unlock_ip: { action: "materials_unlock_ip", limit: 10, windowSeconds: 600 },
  write_user: { action: "write_user", limit: 40, windowSeconds: 60 },
  expensive_user: { action: "expensive_user", limit: 20, windowSeconds: 3600 },
  public_hook_ip: { action: "public_hook_ip", limit: 12, windowSeconds: 3600 },
} satisfies Record<string, RateLimitRule>;

export class RateLimitError extends Error {
  status = 429;
  retryAfter: number;
  constructor(retryAfter: number) {
    super("Too many requests. Please wait a moment and try again.");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class VerificationError extends Error {
  status = 400;
  constructor(message = "Human verification failed. Please retry the check and submit again.") {
    super(message);
    this.name = "VerificationError";
  }
}

function headers(): Record<string, string | undefined> {
  try {
    return getRequestHeaders() as unknown as Record<string, string | undefined>;
  } catch {
    return {};
  }
}

export function clientIp(): string | null {
  const h = headers();
  const xff = h["x-forwarded-for"] ?? "";
  return (
    h["cf-connecting-ip"] ||
    h["x-real-ip"] ||
    (xff ? xff.split(",")[0]!.trim() : "") ||
    null
  );
}

export function userAgent(): string | null {
  return headers()["user-agent"] ?? null;
}

/** Salted SHA-256 so logs never contain a raw IP address. */
export async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const salt = process.env["SECURITY_IP_SALT"] ?? process.env["SUPABASE_URL"] ?? "jeeprephub";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type SecurityLog = {
  kind: "rate_limit" | "turnstile_failed" | "suspicious" | "hook_denied" | "honeypot";
  action?: string;
  userId?: string | null;
  detail?: Record<string, unknown>;
};

/** Best-effort security log. Never throws, never records secrets or raw IPs. */
export async function logServerSecurityEvent(entry: SecurityLog): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("server_security_events" as never).insert({
      kind: entry.kind,
      action: entry.action ?? null,
      ip_hash: await hashIp(clientIp()),
      user_id: entry.userId ?? null,
      detail: {
        ...(entry.detail ?? {}),
        ua: (userAgent() ?? "").slice(0, 200),
      },
    } as never);
  } catch {
    /* logging must never break the request */
  }
}

/**
 * Consume one unit from a rate-limit bucket. Throws RateLimitError (429) when
 * the caller is over the limit. Falls open if the database is unreachable so a
 * transient outage never locks legitimate users out.
 */
export async function enforceRateLimit(
  rule: RateLimitRule,
  identity: string | null | undefined,
  opts: { userId?: string | null } = {},
): Promise<void> {
  const idPart = (identity ?? clientIp() ?? "unknown").toString().slice(0, 120).toLowerCase();
  const bucket = `${rule.action}:${idPart}`;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("consume_rate_limit" as never, {
      _bucket: bucket,
      _limit: rule.limit,
      _window_seconds: rule.windowSeconds,
    } as never);
    if (error) return; // fail open on infrastructure errors
    const result = data as { allowed?: boolean; retry_after?: number } | null;
    if (result && result.allowed === false) {
      const retryAfter = Math.max(1, Number(result.retry_after ?? rule.windowSeconds));
      await logServerSecurityEvent({
        kind: "rate_limit",
        action: rule.action,
        userId: opts.userId ?? null,
        detail: { limit: rule.limit, window_seconds: rule.windowSeconds },
      });
      throw new RateLimitError(retryAfter);
    }
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    /* fail open */
  }
}

export function turnstileConfigured(): boolean {
  return Boolean(process.env["TURNSTILE_SECRET_KEY"]);
}

/**
 * Server-side Turnstile verification against Cloudflare's Siteverify API.
 * Rejects missing, invalid, expired and already-used tokens.
 * When no secret is configured the check is skipped (graceful degradation) —
 * rate limiting and input validation still apply.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  action: string,
  opts: { userId?: string | null } = {},
): Promise<void> {
  const secret = process.env["TURNSTILE_SECRET_KEY"];
  if (!secret) return;

  if (!token || typeof token !== "string" || token.length < 10 || token.length > 4096) {
    await logServerSecurityEvent({
      kind: "turnstile_failed",
      action,
      userId: opts.userId ?? null,
      detail: { reason: "missing_token" },
    });
    throw new VerificationError("Please complete the human verification check.");
  }

  const ip = clientIp();
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  let outcome: { success?: boolean; "error-codes"?: string[] } = {};
  try {
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    outcome = (await resp.json()) as typeof outcome;
  } catch {
    // Cloudflare unreachable: do not lock out real users.
    return;
  }

  if (outcome.success !== true) {
    await logServerSecurityEvent({
      kind: "turnstile_failed",
      action,
      userId: opts.userId ?? null,
      detail: { codes: (outcome["error-codes"] ?? []).slice(0, 5) },
    });
    throw new VerificationError();
  }
}

/** Simple hidden-field spam trap. Never the only protection. */
export async function rejectHoneypot(
  value: unknown,
  action: string,
  opts: { userId?: string | null } = {},
): Promise<void> {
  if (typeof value === "string" && value.trim().length > 0) {
    await logServerSecurityEvent({ kind: "honeypot", action, userId: opts.userId ?? null });
    throw new VerificationError("Your submission could not be processed.");
  }
}
