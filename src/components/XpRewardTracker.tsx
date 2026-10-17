import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { awardActionXp, claimLoginXp } from "@/lib/xp";
import { showXpRewardToast } from "@/lib/xp-toast";

function labelFor(target: Element) {
  const text = (target.textContent ?? "").replace(/\s+/g, " ").trim();
  return text.slice(0, 80) || target.getAttribute("aria-label") || "Completed an action";
}

export function XpRewardTracker() {
  const { user } = useAuth();
  const userId = user?.is_anonymous ? undefined : user?.id;

  useEffect(() => {
    if (!userId) return;
    void claimLoginXp()
      .then((reward) => {
        if (reward.awarded) showXpRewardToast(reward.amount, "Welcome back to JEE Prep Hub");
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const onClick = (event: MouseEvent) => {
      const target =
        event.target instanceof Element ? event.target.closest("button, a, [role='button']") : null;
      if (!target || target.closest("[data-xp-ignore='true']")) return;
      const sourceId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      void awardActionXp("ui_action", sourceId, labelFor(target))
        .then((reward) => {
          if (reward.awarded) showXpRewardToast(reward.amount, labelFor(target));
        })
        .catch(() => {});
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [userId]);

  return null;
}
