import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StreakFlame } from "@/components/StreakFlame";

type Claim = {
  streak: number;
  best: number;
  first_today: boolean;
  is_new: boolean;
  week: { date: string; done: boolean }[];
};

const MILESTONES = [3, 7, 14, 30, 50, 100, 365];
let lastClaimedUser = "";

function message(c: Claim) {
  if (c.is_new) return { title: "Welcome to PREPWIAN! 🎉", sub: "Your streak starts today. Come back tomorrow to grow it." };
  if (MILESTONES.includes(c.streak)) return { title: `🏆 ${c.streak}-day milestone!`, sub: "Incredible consistency. Keep going!" };
  if (c.streak <= 1) return { title: "Fresh start!", sub: "Day 1 is done. Show up tomorrow to build your streak." };
  return { title: `${c.streak} days in a row!`, sub: "Come back tomorrow to keep the flame alive." };
}

export function DailyStreakPopup() {
  const [claim, setClaim] = useState<Claim | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user || user.is_anonymous || lastClaimedUser === user.id) return;
      lastClaimedUser = user.id;
      const rpc = (supabase as unknown as {
        rpc: (fn: string) => Promise<{ data: Claim | null; error: unknown }>;
      }).rpc;
      const { data: res, error } = await rpc.call(supabase, "claim_daily_streak");
      if (error || !res?.first_today) return;
      setClaim(res);
    };
    run();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") run();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!claim) return null;
  const msg = message(claim);
  const close = () => setClaim(null);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={close} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="flex justify-center"><StreakFlame count={claim.streak} size="lg" label="day streak" /></div>
        <h2 className="mt-4 text-xl font-extrabold">{msg.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{msg.sub}</p>
        <div className="mt-5 flex justify-between gap-1">
          {claim.week.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground">
                {new Date(`${d.date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "narrow" })}
              </span>
              <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${d.done ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"}`}>
                {d.done ? "✓" : "·"}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Best streak: <strong>{claim.best}</strong> days</p>
        <button onClick={close} className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">
          Keep it going
        </button>
      </div>
    </div>
  );
}