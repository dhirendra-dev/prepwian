import { createFileRoute } from "@tanstack/react-router";

const DEFAULT_OWNER = "dhirendra-dev";
const DEFAULT_REPO = "prepwian";
const GITHUB_API = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { expiresAt: number; body: string }>();

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": status === 200 ? "private, max-age=30" : "no-store",
      ...headers,
    },
  });
}

async function getAdminUser(request: Request) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  const { data: role, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  return roleError || !role ? null : user;
}

function configuredRepository() {
  const owner = (process.env.GITHUB_OWNER || process.env.VITE_GITHUB_OWNER || DEFAULT_OWNER).trim();
  const repo = (process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO || DEFAULT_REPO).trim();
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(owner) || !/^[A-Za-z0-9_.-]{1,100}$/.test(repo)) {
    throw new Error("Invalid GitHub repository configuration.");
  }
  return { owner, repo };
}

function allowedPath(rawPath: string | null) {
  const path = rawPath ?? "/";
  if (path === "" || path === "/") return "/";
  const hasControlCharacter = [...path].some((character) => character.charCodeAt(0) < 32);
  if (
    !path.startsWith("/") ||
    path.includes("..") ||
    path.includes("\\") ||
    path.includes("#") ||
    hasControlCharacter
  ) {
    return null;
  }
  const match = path.match(
    /^\/(commits|branches|releases|issues|pulls|contributors|contents|readme)(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?(?:\?[^#]*)?$/,
  );
  if (!match) return null;
  const query = path.includes("?") ? path.slice(path.indexOf("?") + 1) : "";
  const params = new URLSearchParams(query);
  for (const key of params.keys()) {
    if (!["per_page", "state"].includes(key)) return null;
  }
  if (params.has("per_page")) {
    const perPage = Number(params.get("per_page"));
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) return null;
  }
  if (params.has("state") && !["all", "open", "closed"].includes(params.get("state")!)) return null;
  return path;
}

export const Route = createFileRoute("/api/developer/github")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await getAdminUser(request);
          if (!user) return json({ error: "Admin authorization required." }, 403);
          const path = allowedPath(new URL(request.url).searchParams.get("path"));
          if (!path) return json({ error: "Unsupported GitHub API path." }, 400);
          const { owner, repo } = configuredRepository();
          const githubToken = process.env.GITHUB_TOKEN;
          if (!githubToken) {
            return json(
              {
                error:
                  "The configured GitHub repository is private. Add a server-only GITHUB_TOKEN with read access to deployment Secrets, then rebuild.",
                code: "GITHUB_TOKEN_REQUIRED",
              },
              503,
            );
          }
          const cacheKey = `${owner}/${repo}${path}`;
          const cached = cache.get(cacheKey);
          if (cached && cached.expiresAt > Date.now()) {
            return new Response(cached.body, {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "private, max-age=30",
                "X-GitHub-Proxy-Cache": "HIT",
              },
            });
          }
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
          try {
            const headers: Record<string, string> = {
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "User-Agent": "JEE-Prep-Hub-Developer-Portal",
            };
            headers.Authorization = `Bearer ${githubToken}`;
            const response = await fetch(
              `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${path === "/" ? "" : path}`,
              {
                headers,
                signal: controller.signal,
              },
            );
            const text = await response.text();
            if (!response.ok) {
              const message =
                response.status === 404
                  ? "GitHub cannot find this repository with the configured access. If it is private, configure the server-only GITHUB_TOKEN."
                  : response.status === 403
                    ? "GitHub denied the request or the API rate limit was reached. Configure a server-only GITHUB_TOKEN or try again later."
                    : `GitHub API request failed (${response.status}).`;
              return json(
                { error: message, status: response.status },
                response.status === 404 ? 404 : response.status === 403 ? 429 : 502,
              );
            }
            cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, body: text });
            return new Response(text, {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "private, max-age=30",
                "X-GitHub-Proxy-Cache": "MISS",
              },
            });
          } finally {
            clearTimeout(timer);
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return json({ error: "GitHub took too long to respond. Please try again." }, 504);
          }
          console.error("Developer GitHub proxy failed", error);
          return json(
            { error: "The GitHub connection failed on the server. Please try again." },
            502,
          );
        }
      },
    },
  },
});
