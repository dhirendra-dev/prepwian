import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, X } from "lucide-react";

/**
 * Persistent banner shown to anonymous (guest) users prompting sign-up.
 * Dismissible per session.
 */
export function GuestBanner() {
  const [isGuest, setIsGuest] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setIsGuest(Boolean((data.user as any)?.is_anonymous));
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    if (typeof window !== "undefined") {
      setDismissed(sessionStorage.getItem("guest_banner_dismissed") === "1");
    }
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!isGuest || dismissed) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-amber-400/40 bg-amber-100 px-3 py-2 text-amber-900 shadow-sm dark:bg-amber-900/30 dark:text-amber-100">
      <div className="mx-auto flex max-w-6xl items-center gap-2 text-xs sm:text-sm">
        <span className="inline-flex shrink-0 items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
          Guest
        </span>
        <span className="min-w-0 flex-1 truncate">
          You're browsing as a Guest — sign up to save your progress and unlock full features.
        </span>
        <Link
          to="/auth"
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700"
        >
          <UserPlus className="h-3 w-3" /> Sign up
        </Link>
        <button
          aria-label="Dismiss"
          onClick={() => {
            sessionStorage.setItem("guest_banner_dismissed", "1");
            setDismissed(true);
          }}
          className="shrink-0 rounded p-1 hover:bg-amber-500/20"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
