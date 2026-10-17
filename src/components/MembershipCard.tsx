import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProStatus } from "@/hooks/use-pro";
import { Logo } from "@/components/Logo";
import { BadgeCheck, Crown, Flame } from "lucide-react";

/**
 * The member's identity card — a glass "credit card" showing who they are on
 * JEE Prep Hub. Used on the profile page and in the welcome overlay.
 */
export function MembershipCard({ userId, className = "" }: { userId: string; className?: string }) {
  const { isPro } = useProStatus(userId);

  const card = useQuery({
    queryKey: ["membership-card", userId],
    queryFn: async () => {
      const [{ data: profile }, { count: certs }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, username, avatar_url, class_level, created_at, verified")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_certificates").select("*", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      return { profile: profile as any, certs: certs ?? 0 };
    },
    staleTime: 60_000,
  });

  const p = card.data?.profile;
  const name = p?.full_name ?? "JEE Aspirant";
  const handle = p?.username ? `@${p.username}` : "member";
  const memberSince = p?.created_at
    ? new Date(p.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "—";
  const level =
    p?.class_level === "class_12" ? "Class 12" : p?.class_level === "dropper" ? "Dropper" : "Class 11";
  const memberId = userId.replace(/-/g, "").slice(0, 12).toUpperCase().match(/.{1,4}/g)?.join(" ") ?? "";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 ${
        isPro
          ? "border-amber-300/60 bg-gradient-to-br from-amber-200/40 via-yellow-100/20 to-amber-400/25"
          : "border-white/40 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/25"
      } ${className}`}
    >
      <span className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/30 blur-3xl" />
      <span className="pointer-events-none absolute -left-10 top-1/2 h-32 w-40 -translate-y-1/2 rounded-full bg-white/20 blur-3xl" />
      <span className="pointer-events-none absolute -left-16 top-0 h-full w-24 bg-gradient-to-r from-transparent via-white/35 to-transparent motion-safe:lg-sheen-anim" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Logo className="h-8 w-8 shrink-0 md:h-10 md:w-10 lg:h-12 lg:w-12" />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              JEE Prep Hub
            </p>
            <p className="truncate text-[11px] font-semibold">
              {isPro ? "Premium membership" : "Member card"}
            </p>
          </div>
        </div>
        {isPro ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full pro-gradient-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black">
            <Crown className="h-3 w-3" strokeWidth={2.8} /> Pro
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Free
          </span>
        )}
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        {p?.avatar_url ? (
          <img src={p.avatar_url} alt={name} className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-white/60" />
        ) : (
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/20 font-display text-lg font-bold text-primary">
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate font-display text-lg font-bold">{name}</h3>
            {p?.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-sky-500" />}
          </div>
          <p className="truncate text-xs text-muted-foreground">{handle}</p>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2 text-[11px]">
        <Field label="Member ID" value={memberId} mono />
        <Field label="Level" value={level} />
        <Field label="Since" value={memberSince} />
      </div>

      <div className="relative mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
        <Flame className="h-3.5 w-3.5 text-orange-500" />
        {card.data?.certs ?? 0} certificate{(card.data?.certs ?? 0) === 1 ? "" : "s"} earned
      </div>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl bg-background/45 px-2 py-1.5">
      <div className="truncate text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`truncate text-[11px] font-bold ${mono ? "font-mono tracking-wider" : ""}`}>{value}</div>
    </div>
  );
}
