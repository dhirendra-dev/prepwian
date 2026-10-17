import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { isClientDisconnect } from "./lib/request-errors";

type ServerEntry = {
  fetch: (
    request: Request,
    env: unknown,
    ctx: unknown,
  ) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  request: Request,
  response: Response,
): Promise<Response> {
  if (response.status < 500) return response;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();

  if (
    !body.includes('"unhandled":true') ||
    !body.includes('"message":"HTTPError"')
  ) {
    return response;
  }

  const capturedError = consumeLastCapturedError();

  // Browsers routinely cancel an in-flight document request during reloads,
  // navigation, and HMR. h3 represents that disconnect as a generic 500 even
  // though the application did not fail.
  if (request.signal.aborted || isClientDisconnect(capturedError)) {
    return new Response(null, { status: 204 });
  }

  console.error(capturedError ?? new Error(`h3 swallowed SSR error: ${body}`));

  return new Response(renderErrorPage(), {
    status: 500,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

/**
 * Security headers.
 *
 * Production framing is restricted to PREPWIAN itself.
 * Lovable preview/editor framing remains available on non-production hosts.
 */
function applySecurityHeaders(
  response: Response,
  request: Request,
): Response {
  try {
    const h = response.headers;
    const hostname = new URL(request.url).hostname;

    const isProduction =
      hostname === "jeeprephub.co.in" ||
      hostname === "www.jeeprephub.co.in";

    h.set("X-Content-Type-Options", "nosniff");
    h.set("Referrer-Policy", "strict-origin-when-cross-origin");
    h.set(
      "Permissions-Policy",
      "camera=(self), microphone=(self), geolocation=(self), payment=()",
    );
    h.set("X-DNS-Prefetch-Control", "off");
    h.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

    // Defense in depth for older browsers.
    if (isProduction) {
      h.set("X-Frame-Options", "SAMEORIGIN");
    }

    if (!h.has("Content-Security-Policy")) {
      h.set(
        "Content-Security-Policy",
        [
          "default-src 'self' https: data: blob:",

          // The framework ships hydration state in an inline script.
          `script-src ${
  isProduction
    ? "'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com"
    : "'self' 'unsafe-inline' 'unsafe-eval' https://*.lovable.app https://*.lovable.dev https://lovable.dev https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com"
}`,
`script-src-elem ${
  isProduction
    ? "'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com"
    : "'self' 'unsafe-inline' 'unsafe-eval' https://*.lovable.app https://*.lovable.dev https://lovable.dev https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com"
}`,

          "style-src 'self' 'unsafe-inline' https:",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https: wss: data: blob:",
          "font-src 'self' data: https:",
          "media-src 'self' data: blob: https:",
          "frame-src 'self' https:",
          "worker-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",

          // Production: only PREPWIAN can frame itself.
          // Preview: retain Lovable editor/preview compatibility.
          `frame-ancestors 'self' ${
            isProduction
              ? "https://jeeprephub.co.in https://www.jeeprephub.co.in"
              : "https://*.lovable.app https://*.lovable.dev https://lovable.dev"
          }`,

          "upgrade-insecure-requests",
        ].join("; "),
      );
    }
  } catch {
    /* immutable headers (e.g. redirects) — nothing to do */
  }

  return response;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);

      return applySecurityHeaders(
        await normalizeCatastrophicSsrResponse(request, response),
        request,
      );
    } catch (error) {
      if (isClientDisconnect(error) || request.signal.aborted) {
        return new Response(null, { status: 204 });
      }

      console.error(error);

      return new Response(renderErrorPage(), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    }
  },
};