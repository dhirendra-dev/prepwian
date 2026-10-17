import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Ban, Mail, LogOut, Clock, Scale } from "lucide-react";

type ModRow = {
  status: string;
  reason: string | null;
  suspended_until: string | null;
};

const CONTACT_EMAIL = "jeeprephubofficial@gmail.com";

export function ModerationGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [mod, setMod] = useState<ModRow | null>(null);
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    async function check() {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) {
        if (alive) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_moderation")
        .select("status, reason, suspended_until")
        .eq("user_id", uid)
        .maybeSingle();
      if (!alive) return;
      if (data) {
        const isBanned = data.status === "banned";
        const isSuspended =
          data.status === "suspended" &&
          (!data.suspended_until || new Date(data.suspended_until) > new Date());
        if (isBanned || isSuspended) {
          setMod(data as ModRow);
        }
      }
      setLoading(false);
    }
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") check();
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <>{children}</>;
  if (!mod) return <>{children}</>;

  // Let banned/suspended users still reach the appeal page (and auth) so they can appeal or sign out.
  const path = loc.pathname;
  if (path.startsWith("/appeal") || path.startsWith("/auth")) {
    return <>{children}</>;
  }

  const isBanned = mod.status === "banned";
  const until = mod.suspended_until ? new Date(mod.suspended_until) : null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  };

  const subject = encodeURIComponent(
    isBanned ? "Account Ban Appeal" : "Account Suspension Appeal"
  );
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${subject}`;

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex justify-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              isBanned
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-500/10 text-amber-500"
            }`}
          >
            {isBanned ? (
              <Ban className="h-8 w-8" />
            ) : (
              <AlertTriangle className="h-8 w-8" />
            )}
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold text-foreground">
          {isBanned ? "Account Banned" : "Account Suspended"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {isBanned
            ? "Your access to JEE Prep Hub has been permanently revoked."
            : "Your account has been temporarily suspended."}
        </p>

        <div className="mt-5 space-y-3">
          {mod.reason && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Reason
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {mod.reason}
              </div>
            </div>
          )}

          {!isBanned && until && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Suspended until
                </div>
                <div className="text-foreground">
                  {until.toLocaleString()}
                </div>
              </div>
            </div>
          )}
          {!isBanned && !until && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Duration: until further review by admins.
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Believe this is a mistake?
            </div>
            <p className="mt-1 text-sm text-foreground">
              Contact the admin team for an appeal or clarification:
            </p>
            <a
              href={mailto}
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline break-all"
            >
              <Mail className="h-4 w-4 shrink-0" />
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button asChild variant="default" className="w-full">
            <a href="/appeal">
              <Scale className="mr-2 h-4 w-4" /> Appeal my account
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href={mailto}>
              <Mail className="mr-2 h-4 w-4" /> Email admin
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          JEE Prep Hub · Community Guidelines Enforcement
        </p>
      </div>
    </div>
  );
}
