import { supabase } from "@/integrations/supabase/client";

/**
 * Guest lifecycle:
 *  - Heartbeat: while the tab is open & visible, ping profiles.last_seen_at every 60s.
 *  - On pagehide (navigation away / close), stamp profiles.guest_left_at using a keepalive fetch
 *    so it survives page unload. Server-side sweeper deletes the guest after ~30s.
 *  - visibilitychange is NOT used as a delete trigger (per spec — tab-switch mid-typing must not wipe).
 *
 * Guarded to run ONLY for anonymous auth users. Real users are never touched.
 */

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let installed = false;
let currentGuestId: string | null = null;

async function isGuestUser(): Promise<{ id: string; token: string } | null> {
  const { data } = await supabase.auth.getSession();
  const s = data.session;
  const u = s?.user as any;
  if (!s || !u) return null;
  if (!u.is_anonymous) return null;
  return { id: u.id as string, token: s.access_token };
}

async function heartbeat(userId: string) {
  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}

function fireLeaveBeacon(userId: string, token: string) {
  // Use keepalive fetch — pagehide is the reliable exit signal.
  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  try {
    fetch(url, {
      method: "PATCH",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${token}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ guest_left_at: new Date().toISOString() }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
  // Clear client-side session storage tied to guest
  try {
    sessionStorage.clear();
    // Preserve theme; wipe anything else guest-scoped
    const keep = ["theme"];
    for (const k of Object.keys(localStorage)) {
      if (!keep.includes(k) && (k.includes(userId) || k.startsWith("guest_"))) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
}

export async function installGuestLifecycle() {
  if (installed || typeof window === "undefined") return;
  const guest = await isGuestUser();
  if (!guest) return;

  installed = true;
  currentGuestId = guest.id;

  // Initial ping
  heartbeat(guest.id).catch(() => {});
  heartbeatTimer = setInterval(() => {
    if (document.visibilityState === "visible" && currentGuestId) {
      heartbeat(currentGuestId).catch(() => {});
    }
  }, 60_000);

  const onPageHide = () => {
    if (!currentGuestId) return;
    // Grab a fresh token if possible (best-effort; may be stale but sweep is idempotent)
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (token && currentGuestId) fireLeaveBeacon(currentGuestId, token);
    });
  };

  window.addEventListener("pagehide", onPageHide);
  // Also handle sign-out from within the session
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      teardownGuestLifecycle();
    }
  });
}

export function teardownGuestLifecycle() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  installed = false;
  currentGuestId = null;
}
