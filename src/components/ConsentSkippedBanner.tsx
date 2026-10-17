import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ShieldOff, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shown when the admin has turned the consent & verification step off, so users
 * know nothing was collected and where they can change that decision later.
 */
export function ConsentSkippedBanner({ className }: { className?: string }) {
  const q = useQuery({
    queryKey: ["consent-skipped-banner"],
    staleTime: 60_000,
    queryFn: async () => {
      const [{ data: settings }, { data: auth }] = await Promise.all([
        supabase
  .from("consent_settings")
  .select("consent_enabled, show_consent_skipped_banner")
  .eq("id", 1)
  .maybeSingle(),
        supabase.auth.getUser(),
      ]);
      const enabled = (settings as any)?.consent_enabled ?? true;
const showBanner =
  (settings as any)?.show_consent_skipped_banner === true;

if (!showBanner || enabled || !auth.user) {
  return { show: false };
}
      const { data: mine } = await supabase
        .from("user_consents")
        .select("id")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      return { show: !mine };
    },
  });

  if (!q.data?.show) return null;

  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border border-emerald-500/40 bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
          <ShieldOff className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Verification skipped — nothing was collected</p>
          <p className="text-xs text-muted-foreground">
            Consent is currently optional, so we haven't stored your device, network, GPS or personal
            details. You can change this decision whenever you like.
          </p>
        </div>
      </div>
      <Link
        to="/consent"
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-accent hover:bg-muted sm:self-auto"
      >
        Manage consent <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
