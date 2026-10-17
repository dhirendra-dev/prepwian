import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import {
  getQuickSearchRoutesWithClient,
  searchUniversalWithClient,
} from "@/features/search/universalSearch";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    )
      headers.delete("Authorization");
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

const optionalSupabaseSession = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Search is temporarily unavailable.");

  const request = getRequest();
  const authHeader = request?.headers.get("authorization") ?? null;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (authHeader && !token) throw new Error("Unauthorized.");

  const client = createClient<Database>(url, key, {
    global: {
      fetch: createSupabaseFetch(key),
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  let userId: string | null = null;
  let claims: Record<string, unknown> | null = null;
  if (token) {
    const { data, error } = await client.auth.getClaims(token);
    const subject = data?.claims?.sub;
    if (error || typeof subject !== "string" || !subject) throw new Error("Unauthorized.");
    userId = subject;
    claims = data.claims as Record<string, unknown>;
  }

  return next({ context: { supabase: client, userId, claims } });
});

const searchInput = z.object({
  query: z.string().max(300),
  page: z.number().int().min(1).max(1000).optional(),
  pageSize: z.number().int().min(1).max(30).optional(),
  category: z
    .enum([
      "all",
      "route",
      "person",
      "note",
      "material",
      "article",
      "academic",
      "notice",
      "community",
      "forum",
      "message",
      "private-message",
      "test",
      "video",
      "topper",
      "policy",
    ])
    .optional(),
  since: z.string().datetime().nullable().optional(),
  sortBy: z.enum(["relevance", "newest"]).optional(),
});

const routeInput = z.object({ limit: z.number().int().min(1).max(20).optional() });

export const searchUniversal = createServerFn({ method: "POST" })
  .middleware([optionalSupabaseSession])
  .inputValidator((input: unknown) => searchInput.parse(input))
  .handler(async ({ data, context }) => {
    const security = await import("./security-guard.server");
    const identity = context.userId
      ? `user:${context.userId}`
      : `ip:${security.clientIp() ?? "unknown"}`;
    await security.enforceRateLimit(
      { action: "universal_search", limit: 60, windowSeconds: 60 },
      identity,
      { userId: context.userId },
    );
    return searchUniversalWithClient(context.supabase, { ...data, userId: context.userId });
  });

export const getQuickSearchRoutes = createServerFn({ method: "POST" })
  .middleware([optionalSupabaseSession])
  .inputValidator((input: unknown) => routeInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const security = await import("./security-guard.server");
    const identity = context.userId
      ? `user:${context.userId}`
      : `ip:${security.clientIp() ?? "unknown"}`;
    await security.enforceRateLimit(
      { action: "universal_search_routes", limit: 120, windowSeconds: 60 },
      identity,
      { userId: context.userId },
    );
    return getQuickSearchRoutesWithClient(context.supabase, context.userId, data.limit);
  });
