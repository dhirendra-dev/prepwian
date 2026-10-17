import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProSubscription = {
  id: string;
  plan: "weekly_winner";
  status: "active" | "expired" | "cancelled";
  started_at: string;
  expires_at: string | null;
};

function currentWeekStart() {
  const now = new Date();
  const day = now.getDay() || 7;
  now.setDate(now.getDate() - day + 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function useProStatus(userId: string | undefined) {
  const [sub, setSub] = useState<ProSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setSub(null); setLoading(false); return; }
    let cancelled = false;
    const fetchSub = async () => {
      const weekStart = currentWeekStart();
      const { data } = await supabase
        .from("leaderboard_weekly_totals")
        .select("user_id, total_seconds, week_start, updated_at")
        .eq("week_start", weekStart)
        .gt("total_seconds", 0)
        .order("total_seconds", { ascending: false })
        .order("updated_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const active: ProSubscription | null = data?.user_id === userId ? {
        id: `${data.week_start}:${data.user_id}`,
        plan: "weekly_winner",
        status: "active",
        started_at: data.week_start,
        expires_at: null,
      } : null;
      setSub(active);
      setLoading(false);
    };
    fetchSub();
    const ch = supabase
      .channel(`weekly-pro-${userId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "leaderboard_weekly_totals" }, fetchSub)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [userId]);

  return { sub, isPro: !!sub, loading };
}
