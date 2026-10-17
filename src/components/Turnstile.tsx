import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget (free plan). Renders only when a site key is
 * configured (VITE_TURNSTILE_SITE_KEY) so the app keeps working locally and
 * before the keys are added. Only the *site* key is used here — the secret key
 * lives on the server and is never shipped to the browser.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

export const TURNSTILE_SITE_KEY: string =
  (import.meta.env["VITE_TURNSTILE_SITE_KEY"] as string | undefined) ?? "";

export const turnstileEnabled = () => TURNSTILE_SITE_KEY.length > 0;

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;
function loadScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const el = document.createElement("script");
      el.src = SCRIPT_SRC;
      el.async = true;
      el.defer = true;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error("turnstile_script_failed"));
      document.head.appendChild(el);
    });
  }
  return scriptPromise;
}

export function Turnstile({
  onToken,
  action,
  className,
}: {
  onToken: (token: string) => void;
  action?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!turnstileEnabled() || !ref.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          theme: "auto",
          size: "flexible",
          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      try {
        if (widgetId.current) window.turnstile?.remove(widgetId.current);
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!turnstileEnabled()) return null;

  return (
    <div className={className}>
      <div ref={ref} />
      {failed ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Verification could not load. Check your connection and try again.
        </p>
      ) : null}
    </div>
  );
}

/** Small hook that keeps the current token and lets a form reset it. */
export function useTurnstileToken() {
  const [token, setToken] = useState("");
  return { token, setToken, ready: !turnstileEnabled() || token.length > 0 };
}
