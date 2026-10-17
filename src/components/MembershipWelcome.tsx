import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MembershipCard } from "@/components/MembershipCard";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";

const KEY_PREFIX = "jph-membership-last-shown:";
const DISPLAY_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;
const WELCOME_DELAY_MS = 2100;

/** Greets each signed-in member with their card at most once every 30 days. */
export function MembershipWelcome() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const key = `${KEY_PREFIX}${user.id}`;
    try {
      const lastShown = Number(localStorage.getItem(key) ?? 0);
      if (lastShown > 0 && Date.now() - lastShown < DISPLAY_INTERVAL_MS) return;
    } catch {
      // If persistence is unavailable, avoid repeatedly interrupting the user.
      return;
    }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, String(Date.now()));
      } catch {
        // Ignore storage errors; the dialog remains dismissible.
      }
      setOpen(true);
    }, WELCOME_DELAY_MS);
    return () => clearTimeout(t);
  }, [user?.id]);

  if (!user?.id) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Welcome back 👋</DialogTitle>
        </DialogHeader>
        <MembershipCard userId={user.id} className="motion-safe:animate-rise-in" />
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="rounded-xl bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-border px-3 py-2 text-sm font-semibold"
          >
            Continue
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
