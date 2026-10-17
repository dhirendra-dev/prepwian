import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SignInSuccessOverlay } from "@/components/SignInSuccessOverlay";
import { scorePassword } from "@/components/PasswordStrength";
import { Turnstile, useTurnstileToken } from "@/components/Turnstile";
import { guardAuthAction } from "@/lib/security-guard.functions";
import { POLICY_VERSION } from "@/lib/legal/content";
import LiquidGlassAuthPage from "@/components/auth/AuthPage";
import { useTheme } from "@/lib/theme";
import {
  clearPostLoginChoice,
  markPostLoginChoice,
  OAUTH_RETURN_PATH_KEY,
} from "@/lib/post-login-destination";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Sign in to JEE Prep Hub" },
      { name: "twitter:description", content: "Create your free account and join thousands of JEE 2028 aspirants studying together." },
      {
        title: "Sign in to JEE Prep Hub — Join the JEE 2028 Community",
      },
      {
        name: "description",
        content:
          "Sign in or create your free JEE Prep Hub account to access curated study materials, focus timer, study squads, leaderboard and a community of Class 11 & 12 aspirants.",
      },
      {
        property: "og:title",
        content: "Sign in to JEE Prep Hub",
      },
      {
        property: "og:description",
        content:
          "Create your free account and join thousands of JEE 2028 aspirants studying together.",
      },
      {
        property: "og:url",
        content: "https://jeeprephub.co.in/auth",
      },
      {
        property: "og:type",
        content: "website",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://jeeprephub.co.in/auth",
      },
    ],
  }),
  component: AuthRoutePage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

const passwordSchema = z.string().min(6, "Min 6 characters").max(72);

const nameSchema = z.string().trim().min(1, "Name required").max(80);

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s\-()]{6,19}$/, "Enter a valid phone")
  .max(20);

function AuthRoutePage() {
  const navigate = useNavigate();
  const { theme, set: setTheme } = useTheme();

  const [success, setSuccess] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [signedInName, setSignedInName] = useState<string | undefined>(undefined);

  const signinCaptcha = useTurnstileToken();
  const signupCaptcha = useTurnstileToken();

  // Server-side guard: rate limiting + Turnstile verification + honeypot.
  async function runGuard(input: {
    action: "signin" | "signup" | "password_reset";
    token?: string;
    identity?: string;
    honeypot?: string;
  }) {
    try {
      await guardAuthAction({ data: input });
      return true;
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Too many requests. Please wait a moment and try again.";

      toast.error(
        message.includes("[object")
          ? "Too many requests. Please wait a moment and try again."
          : message,
      );

      return false;
    }
  }

  const getSafeRedirect = useCallback(() => {
    if (typeof window === "undefined") {
      return "/start";
    }

    let target = new URLSearchParams(window.location.search).get("redirect") || "/start";

    for (let i = 0; i < 2; i += 1) {
      try {
        const decoded = decodeURIComponent(target);

        if (decoded === target) break;

        target = decoded;
      } catch {
        break;
      }
    }

    if (!target.startsWith("/") || target.startsWith("//") || target.startsWith("/auth")) {
      return "/start";
    }

    return target;
  }, []);

  function hasValidRequestedRedirect() {
    if (typeof window === "undefined") return false;
    let target = new URLSearchParams(window.location.search).get("redirect");
    if (!target) return false;
    for (let i = 0; i < 2; i += 1) {
      try {
        const decoded = decodeURIComponent(target);
        if (decoded === target) break;
        target = decoded;
      } catch {
        return false;
      }
    }
    return target.startsWith("/") && !target.startsWith("//") && !target.startsWith("/auth");
  }

  const goAfterAuth = useCallback(
    (replace = true) => {
      navigate({
        to: getSafeRedirect(),
        replace,
      } as never);
    },
    [getSafeRedirect, navigate],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        goAfterAuth(true);
      }
    });
  }, [goAfterAuth]);

  async function handleSignIn(input: { email: string; password: string; honeypot?: string }) {
    const email = emailSchema.safeParse(input.email);
    const password = passwordSchema.safeParse(input.password);

    if (!email.success) {
      return toast.error(email.error.issues[0].message);
    }

    if (!password.success) {
      return toast.error(password.error.issues[0].message);
    }

    const guarded = await runGuard({
      action: "signin",
      token: signinCaptcha.token,
      identity: email.data,
      honeypot: input.honeypot ?? "",
    });

    if (!guarded) {
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.data,
      password: password.data,
    });

    if (error) {
      // best-effort failed-login log
      try {
        const { logSecurityEvent } = await import("@/lib/security.functions");

        logSecurityEvent({
          data: {
            event_type: "failed_login",
            metadata: {
              email: email.data,
            },
          },
        }).catch(() => {});
      } catch {
        // Security logging is best-effort and must not block sign-in feedback.
      }

      return toast.error(error.message);
    }

    const user = data.user ?? data.session?.user;

    const displayName =
      user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || undefined;

    try {
      const { logSecurityEvent } = await import("@/lib/security.functions");

      logSecurityEvent({
        data: {
          event_type: "login",
        },
      }).catch(() => {});
    } catch {
      // Security logging is best-effort and must not block sign-in feedback.
    }

    if (!hasValidRequestedRedirect()) markPostLoginChoice();
    setSignedInName(displayName);
    setSignedIn(true);

    setTimeout(() => {
      goAfterAuth(true);
    }, 1400);
  }

  async function handleSignUp(input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    acceptedTerms: boolean;
    honeypot?: string;
  }) {
    const name = nameSchema.safeParse(input.fullName);
    const email = emailSchema.safeParse(input.email);
    const password = passwordSchema.safeParse(input.password);

    if (!name.success) {
      return toast.error(name.error.issues[0].message);
    }

    if (!email.success) {
      return toast.error(email.error.issues[0].message);
    }

    if (!password.success) {
      return toast.error(password.error.issues[0].message);
    }

    const strength = scorePassword(password.data);

    if (strength.score < 2) {
      return toast.error(
        `Password is too weak. ${
          strength.tips.join(" · ") || "Use 8+ chars with mixed case, numbers & symbols."
        }`,
      );
    }

    if (!input.acceptedTerms) {
      return toast.error(
        "Please accept the Terms of Use, Community Guidelines and Privacy Policy to continue.",
      );
    }

    const phoneRaw = input.phone?.trim() ?? "";

    let phoneValue: string | undefined;

    if (phoneRaw.length > 0) {
      const phone = phoneSchema.safeParse(phoneRaw);

      if (!phone.success) {
        return toast.error(phone.error.issues[0].message);
      }

      phoneValue = phone.data;
    }

    const guardedSignup = await runGuard({
      action: "signup",
      token: signupCaptcha.token,
      identity: email.data,
      honeypot: input.honeypot ?? "",
    });

    if (!guardedSignup) {
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.data,
      password: password.data,
      options: {
        emailRedirectTo: window.location.origin,

        data: {
          full_name: name.data,

          ...(phoneValue ? { phone: phoneValue } : {}),

          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),

          terms_version: POLICY_VERSION,
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();

      if (msg.includes("weak") || msg.includes("pwned") || msg.includes("compromised")) {
        return toast.error(
          "This password has appeared in a public data breach. Please choose a stronger, unique password (mix letters, numbers, symbols).",
        );
      }

      if (msg.includes("already registered") || msg.includes("already exists")) {
        return toast.error("An account with this email already exists. Try signing in.");
      }

      return toast.error(error.message);
    }

    setSuccess(true);

    toast.success("Account created! Verification is required.");

    setTimeout(() => {
      navigate({
        to: "/verify-account",
        replace: true,
      });
    }, 2200);
  }

  async function handleGoogle() {
    try {
      const destination = getSafeRedirect();
      window.sessionStorage.setItem(OAUTH_RETURN_PATH_KEY, destination);
      if (!hasValidRequestedRedirect()) markPostLoginChoice();

      const { lovable } = await import("@/integrations/lovable/index");

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        clearPostLoginChoice();

        return toast.error(result.error.message || "Google sign-in failed");
      }

      if (result.redirected) return;

      window.sessionStorage.removeItem(OAUTH_RETURN_PATH_KEY);

      goAfterAuth(true);
    } catch {
      clearPostLoginChoice();

      toast.error("Google sign-in is unavailable right now");
    }
  }

  async function handleGuest() {
    if (
      !(await runGuard({
        action: "signup",
      }))
    ) {
      return;
    }

    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      return toast.error(error.message || "Could not start guest session");
    }

    toast.success("Signed in as Guest");

    goAfterAuth(true);
  }

  return (
    <>
      <LiquidGlassAuthPage
        theme={theme}
        onBackHome={() => {
          void navigate({ to: "/" });
        }}
        onSignIn={async (input) => {
          await handleSignIn(input);
        }}
        onSignUp={async (input) => {
          await handleSignUp(input);
        }}
        onGoogleSignIn={async () => {
          await handleGoogle();
        }}
        onContinueAsGuest={async () => {
          await handleGuest();
        }}
        onThemeChange={setTheme}
        signInSecurity={<Turnstile action="signin" onToken={signinCaptcha.setToken} />}
        signUpSecurity={<Turnstile action="signup" onToken={signupCaptcha.setToken} />}
        termsUrl="/legal/terms"
        guidelinesUrl="/legal/community-guidelines"
        privacyUrl="/legal/privacy"
      />
      <SignInSuccessOverlay open={signedIn} name={signedInName} />
      <SuccessOverlay
        open={success}
        onSkip={() => {
          navigate({ to: "/verify-account", replace: true });
        }}
      />
    </>
  );
}

function SuccessOverlay({ open, onSkip }: { open: boolean; onSkip: () => void }) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onSkip();
      }}
    >
      <DialogContent
        className="max-w-sm border-border bg-card text-center sm:rounded-3xl"
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onSkip();
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-5 py-2">
          <div className="relative" aria-hidden="true">
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />

            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <svg viewBox="0 0 52 52" className="h-12 w-12" role="presentation" focusable="false">
                <circle
                  cx="26"
                  cy="26"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.3"
                />

                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 27 l8 8 l16 -18"
                  style={{
                    strokeDasharray: 48,
                    strokeDashoffset: 48,
                    animation: "checkdraw 0.6s ease-out 0.15s forwards",
                  }}
                />
              </svg>
            </div>
          </div>

          <div>
            <DialogTitle className="font-display text-xl font-semibold">
              Account created
            </DialogTitle>

            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Your account has been created. You’ll now be taken to account verification.
            </DialogDescription>
          </div>

          <Button
            type="button"
            onClick={onSkip}
            autoFocus
            className="w-full"
            aria-label="Continue to account verification"
          >
            Verify account
          </Button>

          <p className="text-xs text-muted-foreground">Press Esc to skip</p>
        </div>
      </DialogContent>

      <style>{`
        @keyframes checkdraw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </Dialog>
  );
}
