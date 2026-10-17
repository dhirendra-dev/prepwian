import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;
export const USERNAME_FORMAT_HINT =
  "3–20 characters: letters, numbers, underscore, or period only.";

export type UsernameStatus =
  | { state: "idle" }
  | { state: "invalid"; message: string }
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken" }
  | { state: "error"; message: string };

/**
 * Live username availability check backed by public.check_username_availability.
 * Pass the current user's id when editing an existing username so their own
 * handle isn't flagged as taken. Debounced ~400ms.
 */
export function useUsernameCheck(raw: string, currentUserId?: string | null) {
  const value = raw.trim().toLowerCase();
  const [status, setStatus] = useState<UsernameStatus>({ state: "idle" });

  useEffect(() => {
    if (!value) {
      setStatus({ state: "idle" });
      return;
    }
    if (!USERNAME_RE.test(value)) {
      setStatus({ state: "invalid", message: USERNAME_FORMAT_HINT });
      return;
    }
    let cancelled = false;
    setStatus({ state: "checking" });
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("check_username_availability", {
        check_username: value,
        current_user_id: currentUserId ?? null,
      } as any);
      if (cancelled) return;
      if (error) setStatus({ state: "error", message: "Couldn't check right now. Try again." });
      else setStatus({ state: data === true ? "available" : "taken" });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value, currentUserId]);

  return { value, status, isAvailable: status.state === "available" };
}

/** Maps a unique-constraint failure on profiles.username to a friendly message. */
export function isUsernameTakenError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "23505" || /duplicate key|already taken|unique/i.test(error.message ?? "");
}
