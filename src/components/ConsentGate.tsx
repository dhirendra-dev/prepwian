import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, Lock, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ALLOWED_WHILE_RESTRICTED = [
  "/consent",
  "/auth",
  "/moderation",
  "/appeal",
  "/contact",
];

type RestrictionStatus = {
  restricted?: boolean;
  restriction_type?: string;
  required_version?: string;
  reason?: string;
};

export function ConsentGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [restricted, setRestricted] = useState(false);
  const [error, setError] = useState(false);

  const isAllowedPath = ALLOWED_WHILE_RESTRICTED.some((path) =>
    location.pathname.startsWith(path)
  );

  const allowedRef = useRef(isAllowedPath);
  allowedRef.current = isAllowedPath;

  // Route changes reuse the cached result; no new check or spinner.
  useEffect(() => {
    if (!checking && restricted && !isAllowedPath) {
      navigate({ to: "/consent", replace: true });
    }
  }, [checking, restricted, isAllowedPath, navigate]);

  useEffect(() => {
    let mounted = true;

    const checkRestriction = async (silent = false) => {
      if (!mounted) return;

      if (!silent) setChecking(true);
      setError(false);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (mounted) {
            setRestricted(false);
            setChecking(false);
          }
          return;
        }

        // Guest/anonymous accounts are not subject to restricted-account flow.
        if ((user as any).is_anonymous) {
          if (mounted) {
            setRestricted(false);
            setChecking(false);
          }
          return;
        }

        /*
         * DATABASE IS THE SOURCE OF TRUTH.
         *
         * This checks the reusable account_restrictions system.
         */
        const { data, error: restrictionError } =
          await supabase.rpc("get_account_restriction_status");

        if (restrictionError) {
          console.error(
            "[RestrictedAccount] Status check failed:",
            restrictionError
          );

          /*
           * Don't expose the normal application when the restriction
           * check itself fails.
           *
           * /consent remains available so the account isn't trapped.
           */
          if (mounted) {
            setError(true);
            setRestricted(true);
            setChecking(false);
          }

          return;
        }

        const status = (data || {}) as RestrictionStatus;
        const isRestricted = status.restricted === true;

        if (!mounted) return;

        setRestricted(isRestricted);
        setChecking(false);

        /*
         * Restricted account attempting to open any normal page:
         * send them directly to the restricted consent portal.
         */
        if (isRestricted && !allowedRef.current) {
          navigate({
            to: "/consent",
            replace: true,
          });
        }
      } catch (err) {
        console.error(
          "[RestrictedAccount] Unexpected restriction error:",
          err
        );

        if (mounted) {
          setError(true);
          setRestricted(true);
          setChecking(false);
        }
      }
    };

    checkRestriction();

    /*
     * Re-check after authentication changes.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        checkRestriction(event === "USER_UPDATED");
      }
    });

    /*
     * Re-check when returning to the browser/app.
     */
    const handleFocus = () => {
      checkRestriction(true);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Never briefly render the normal application while checking.
   */
  if (checking) {
    return (
      <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Checking account access…
          </p>
        </div>
      </div>
    );
  }

  /*
   * Normal users continue exactly as before.
   */
  if (!restricted) {
    return <>{children}</>;
  }

  /*
   * The restricted account is allowed to reach the consent page.
   */
  if (isAllowedPath) {
    return <>{children}</>;
  }

  /*
   * Fallback protection in case navigation hasn't completed yet.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="mt-5 text-center text-2xl font-bold">
          Account Access Restricted
        </h1>

        <p className="mt-3 text-center text-sm leading-6 text-muted-foreground">
          This account currently has restricted access. You must complete
          the required account consent before using JEE Prep Hub.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            We couldn't verify the current restriction status. Please try
            opening the consent page again.
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Button
            className="w-full"
            onClick={() =>
              navigate({
                to: "/consent",
              })
            }
          >
            <Lock className="mr-2 h-4 w-4" />
            Open Required Consent
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Access will automatically be restored after the required
          verification is successfully completed.
        </p>
      </div>
    </div>
  );
}
