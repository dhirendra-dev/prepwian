import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ShieldCheck,
  MessageCircle,
  LogOut,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/verify-account")({
  head: () => ({
    meta: [
      { name: "description", content: "Complete your PREPWIAN account verification." },
      { property: "og:title", content: "Verify Account — PREPWIAN" },
      { property: "og:description", content: "Complete your PREPWIAN account verification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Verify Account — PREPWIAN" },
      { name: "twitter:description", content: "Complete your PREPWIAN account verification." },

      {
        title: "Verify Account — PREPWIAN",
      },
      {
        name: "robots",
        content: "noindex,nofollow",
      },
    ],
  }),
  component: VerifyAccountPage,
});

function setVerifiedFlag() {
  window.dispatchEvent(new Event("account-verified"));
}

function VerifyAccountPage() {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate({
          to: "/auth",
          replace: true,
        });
        return;
      }

      if (!alive) return;

      setEmail(user.email ?? "");
      setLoading(false);

      /*
       * If the account is already verified, don't leave the user
       * stuck on this page.
       */
      const { data } = await (supabase as any).rpc(
        "account_verification_is_complete",
        {
          _user_id: user.id,
        },
      );

      if (data === true && alive) {
        setVerifiedFlag();
        navigate({
          to: "/dashboard",
          replace: true,
        });
      }
    }

    loadUser();

    return () => {
      alive = false;
    };
  }, [navigate]);

  async function verifyCode() {
    const cleanCode = code.replace(/\D/g, "");

    if (cleanCode.length !== 6) {
      toast.error("Enter the 6-digit verification code.");
      return;
    }

    setVerifying(true);

    const { data, error } = await (supabase as any).rpc(
      "verify_account_with_code",
      {
        _code: cleanCode,
      },
    );

    setVerifying(false);

    if (error) {
      toast.error(error.message || "Verification failed.");
      return;
    }

    if (!data?.success) {
      toast.error(
        data?.message || "Invalid or expired verification code.",
      );
      return;
    }

    toast.success("Account verified successfully!");
    setVerifiedFlag();

    navigate({
      to: "/dashboard",
      replace: true,
    });
  }

  async function signOut() {
    await supabase.auth.signOut();

    await navigate({
      to: "/auth",
      replace: true,
    });
  }

  function contactAdmin() {
    const message = encodeURIComponent(
      `Hello PREPWIAN Admin,\n\nI need help verifying my account.\n\nMy registered email: ${email}\n\nPlease provide my account verification code.`,
    );

    window.open(`https://wa.me/?text=${message}`, "_blank");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-glow px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">

          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="font-display text-2xl font-bold">
              Verify your account
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Your PREPWIAN account is waiting for verification.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              Registered email
            </p>

            <p className="mt-1 break-all text-sm font-medium">
              {email}
            </p>
          </div>

          <div className="mt-5">
            <label
              htmlFor="verification-code"
              className="mb-2 block text-sm font-medium"
            >
              6-digit verification code
            </label>

            <Input
              id="verification-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(event) => {
                const value = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6);

                setCode(value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  verifyCode();
                }
              }}
              className="text-center text-2xl tracking-[0.5em]"
            />
          </div>

          <Button
            className="mt-4 w-full"
            onClick={verifyCode}
            disabled={verifying || code.length !== 6}
          >
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verify account
              </>
            )}
          </Button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">
              Need a code?
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={contactAdmin}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Contact Admin on WhatsApp
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            WhatsApp will open with a prepared message. You will still
            choose the recipient and press Send yourself.
          </p>

          <Button
            variant="ghost"
            className="mt-4 w-full text-muted-foreground"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            PREPWIAN · Account Verification
          </p>
        </div>
      </div>
    </div>
  );
}
