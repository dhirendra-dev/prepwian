import { useEffect, useState, useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logUserEvent } from "@/lib/audit.functions";
import { clearFocusTimerStorage } from "@/lib/focus-timer-storage";

type AuthSnapshot = { session: Session | null; user: User | null; loading: boolean };
const initialSnapshot: AuthSnapshot = { session: null, user: null, loading: true };
let snapshot = initialSnapshot;
let started = false;
const listeners = new Set<() => void>();

function publish(next: AuthSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function startAuthStore() {
  if (started) return;
  started = true;
  void supabase.auth.getSession().then(({ data }) => {
    publish({ session: data.session, user: data.session?.user ?? null, loading: false });
  });
  supabase.auth.onAuthStateChange((event, session) => {
    const previousUser = snapshot.user;
    const user = session?.user ?? null;
    publish({ session, user, loading: false });
    if (event === "SIGNED_IN" && user) {
      try {
        const key = `audit:signin:${user.id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          logUserEvent({ data: { action: "auth.sign_in" } }).catch(() => {});
        }
      } catch {
        // Session storage may be unavailable in private browsing.
      }
    }
    if (event === "SIGNED_OUT") {
      try {
        clearFocusTimerStorage(previousUser?.id ?? user?.id);
        sessionStorage.removeItem(`audit:signin:${previousUser?.id ?? user?.id ?? ""}`);
      } catch {
        // Ignore storage errors; sign-out state is already published.
      }
    }
  });
}

function subscribe(listener: () => void) {
  startAuthStore();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuth() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => initialSnapshot,
  );
}

export function useIsAdmin(userId: string | undefined) {
  const { data } = useQuery({
    queryKey: ["is-admin", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!)
        .eq("role", "admin")
        .maybeSingle();
      return Boolean(data);
    },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
  return data ?? false;
}

export type AdminRole = "admin" | "moderator" | null;

/** Role + permission access for admin sections. Full admins implicitly have every permission. */
export function useAdminAccess(userId: string | undefined) {
  const [role, setRole] = useState<AdminRole>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "moderator"]);
      const list = (roles ?? []).map((r) => r.role as string);
      const nextRole: AdminRole = list.includes("admin")
        ? "admin"
        : list.includes("moderator")
          ? "moderator"
          : null;
      let perms: string[] = [];
      if (nextRole === "moderator") {
        // The generated Supabase Database type does not include this admin-only table.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("moderator_permissions")
          .select("permissions")
          .eq("user_id", userId)
          .maybeSingle();
        perms = (data?.permissions as string[] | undefined) ?? [];
      }
      if (cancelled) return;
      setRole(nextRole);
      setPermissions(perms);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    role,
    permissions,
    loading,
    hasPermission: (key: string) => role === "admin" || permissions.includes(key),
  };
}
