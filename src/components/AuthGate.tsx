import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Open access: every route is browsable without an account. Nothing is
 * force-redirected to /auth any more — writes are still gated by the
 * database rules and the sign-in prompts inside each feature.
 */
function isPublicPath(_pathname: string) {
  return true;
}


export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;
    function evaluate(u: User | null) {
      if (!mounted) return;
      setUser(u);
      setChecked(true);
    }
    supabase.auth.getSession().then(({ data }) => evaluate(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      evaluate(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const authed = !!user;

  useEffect(() => {
    if (!checked) return;
    if (authed) return;
    if (isPublicPath(pathname)) return;
    const redirect = pathname + window.location.search;
    router.navigate({ to: "/auth", search: { redirect } as never, replace: true });
  }, [checked, authed, pathname, router]);

  if (!checked && !isPublicPath(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (checked && !authed && !isPublicPath(pathname)) {
    return null;
  }

  return <>{children}</>;
}
