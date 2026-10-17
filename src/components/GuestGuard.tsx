import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Sparkles, X, Eye } from "lucide-react";

type Ctx = {
  isGuest: boolean;
  /** Wrap any write action. If guest, opens the sign-up modal and returns false. */
  guard: (message?: string) => boolean;
};

const GuestGuardContext = createContext<Ctx>({ isGuest: false, guard: () => true });

export function useGuestGuard() {
  return useContext(GuestGuardContext);
}

// Global event so non-React code (e.g. patched supabase calls) can trigger the modal.
const OPEN_EVENT = "guest-guard:open";
export function openGuestGuard(message?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { message } }));
}

/** Patch supabase-js PostgrestQueryBuilder + RealtimeChannel so any guest write
 *  (insert/update/upsert/delete, channel.send) is short-circuited into a friendly
 *  "Sign up to unlock" modal instead of an opaque RLS error. Runs once. */
function installGuestWritePatch() {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__guestWritePatched) return;
  w.__guestWritePatched = true;

  const isGuestNow = () => Boolean(w.__isGuestUser);

  try {
    const qb: any = (supabase as any).from("__probe__");
    const proto = Object.getPrototypeOf(qb);
    for (const method of ["insert", "update", "upsert", "delete"] as const) {
      const original = proto[method];
      if (typeof original !== "function") continue;
      proto[method] = function patched(...args: any[]) {
        if (isGuestNow()) {
          const label =
            method === "delete" ? "delete this" : method === "update" ? "edit this" : "post this";
          openGuestGuard(`Sign up to ${label}`);
          const err = { message: "Guests are read-only. Please sign up to continue.", code: "GUEST_READONLY" };
          const thenable: any = {
            then: (resolve: any) => resolve({ data: null, error: err }),
            catch: () => thenable,
            finally: (cb: any) => { cb?.(); return thenable; },
            select: () => thenable,
            single: () => thenable,
            maybeSingle: () => thenable,
            eq: () => thenable,
            neq: () => thenable,
            in: () => thenable,
            match: () => thenable,
          };
          return thenable;
        }
        return original.apply(this, args);
      };
    }
  } catch { /* ignore */ }

  try {
    const ch: any = (supabase as any).channel("__probe__");
    const chProto = Object.getPrototypeOf(ch);
    const originalSend = chProto.send;
    if (typeof originalSend === "function") {
      chProto.send = function patchedSend(...args: any[]) {
        if (isGuestNow()) {
          openGuestGuard("Sign up to chat");
          return Promise.resolve("error");
        }
        return originalSend.apply(this, args);
      };
    }
    try { (supabase as any).removeChannel?.(ch); } catch { /* ignore */ }
  } catch { /* ignore */ }
}

export function GuestGuardProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const lastOpenAt = useRef(0);

  useEffect(() => {
    installGuestWritePatch();
    let mounted = true;
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const g = Boolean((data.user as any)?.is_anonymous);
      setIsGuest(g);
      (window as any).__isGuestUser = g;
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message?: string } | undefined;
      // debounce rapid triggers (e.g. burst of likes)
      const now = Date.now();
      if (now - lastOpenAt.current < 400) return;
      lastOpenAt.current = now;
      setMessage(detail?.message ?? "Sign up to unlock this");
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  const guard = useCallback(
    (msg?: string) => {
      if (!isGuest) return true;
      setMessage(msg ?? "Sign up to unlock this");
      setOpen(true);
      return false;
    },
    [isGuest],
  );

  const value = useMemo(() => ({ isGuest, guard }), [isGuest, guard]);

  return (
    <GuestGuardContext.Provider value={value}>
      {/* Persistent read-only indicator so guests instantly see why actions fail */}
      {isGuest && (
        <div className="pointer-events-none fixed bottom-3 left-1/2 z-[80] -translate-x-1/2">
          <Link
            to="/auth"
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-100/95 px-3 py-1.5 text-[11px] font-semibold text-amber-900 shadow-lg backdrop-blur hover:bg-amber-200 dark:bg-amber-900/80 dark:text-amber-100"
          >
            <Eye className="h-3 w-3" />
            Read-only Guest · Tap to sign up
          </Link>
        </div>
      )}
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-guard-title"
            aria-describedby="guest-guard-desc"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-t-2xl border border-border/60 bg-card p-6 shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 sm:rounded-2xl"
          >
            <button
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <h2 id="guest-guard-title" className="text-center text-lg font-semibold">{message}</h2>
            <p id="guest-guard-desc" className="mt-2 text-center text-sm text-muted-foreground">
              Guests can browse but can't chat, like, comment, follow, or post. It's not a glitch —
              create a free account to unlock everything.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li>💬 Live chat & DMs</li>
              <li>❤️ Like, comment & follow</li>
              <li>🔥 Streaks, certificates & leaderboard</li>
            </ul>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow hover:opacity-95"
              >
                <Sparkles className="h-4 w-4" /> Sign up — it's free
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm text-muted-foreground hover:bg-muted"
              >
                Keep browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </GuestGuardContext.Provider>
  );
}
