import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { FocusTimerProvider } from "@/contexts/FocusTimerContext";
import { ModerationGate } from "@/components/ModerationGate";
import { ConsentGate } from "@/components/ConsentGate";
import { GuestBanner } from "@/components/GuestBanner";
import { GuestGuardProvider } from "@/components/GuestGuard";
import {
  installGuestLifecycle,
  teardownGuestLifecycle,
} from "@/lib/guest-lifecycle";
import { DailyStreakPopup } from "@/components/DailyStreakPopup";
import { XpRewardTracker } from "@/components/XpRewardTracker";
import { BirthdayCelebrationExperience } from "@/components/birthday/BirthdayCelebration";
import { BirthdaySetupGate } from "@/components/birthday/BirthdaySetupGate";

function AccountVerificationGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(true);

  const onVerifyPage = location.pathname === "/verify-account";

  // Navigation reuses the cached result — no re-check, no spinner.
  useEffect(() => {
    if (!loading && !verified && !onVerifyPage) {
      navigate({ to: "/verify-account", replace: true });
    }
  }, [loading, verified, onVerifyPage, navigate]);

  useEffect(() => {
    let alive = true;

    async function checkVerification() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      /*
       * Guests / anonymous users are not part of account verification.
       */
      if (!user || (user as any).is_anonymous) {
        if (alive) {
          setVerified(true);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await (supabase as any)
        .rpc("account_verification_is_complete", {
          _user_id: user.id,
        });

      if (!alive) return;

      if (error) {
        console.error("Account verification check failed:", error);

        /*
         * Fail closed for real accounts.
         * This prevents a database/RPC failure from accidentally
         * granting access to an unverified account.
         */
        setVerified(false);
        setLoading(false);
        return;
      }

      const isVerified = data === true;

      setVerified(isVerified);
      setLoading(false);
    }

    checkVerification();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (
          event === "SIGNED_IN" ||
          event === "SIGNED_OUT" ||
          event === "USER_UPDATED"
        ) {
          // Re-check after an identity change (e.g. code just verified).
          checkVerification();
        }
      },
    );

    const onVerified = () => {
      setVerified(true);
      checkVerification();
    };
    window.addEventListener("account-verified", onVerified);

    return () => {
      alive = false;
      window.removeEventListener("account-verified", onVerified);
      authListener.subscription.unsubscribe();
    };
  }, []);

  /*
   * Do not flash protected content while verification is being checked.
   */
  if (loading && !onVerifyPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Checking account verification…
          </p>
        </div>
      </div>
    );
  }

  /*
   * Pending accounts can only see the verification page.
   */
  if (!verified && location.pathname !== "/verify-account") {
    return null;
  }

  return <>{children}</>;
}

function AuthedShell() {
  useEffect(() => {
    installGuestLifecycle();

    return () => teardownGuestLifecycle();
  }, []);

  return (
    <GuestGuardProvider>
      <ModerationGate>
        <AccountVerificationGate>
          <BirthdaySetupGate>
            <ConsentGate>
              <FocusTimerProvider>
                <GuestBanner />
                <DailyStreakPopup />
                <XpRewardTracker />
                <BirthdayCelebrationExperience />
                <Outlet />
              </FocusTimerProvider>
            </ConsentGate>
          </BirthdaySetupGate>
        </AccountVerificationGate>
      </ModerationGate>
    </GuestGuardProvider>
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,

  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();

    const visitor = {
      id: "",
      email: "",
      app_metadata: {},
      user_metadata: {},
      aud: "",
      created_at: "",
    };

    return {
      user: (data.user ?? visitor) as NonNullable<typeof data.user>,
    };
  },

  component: AuthedShell,
});
