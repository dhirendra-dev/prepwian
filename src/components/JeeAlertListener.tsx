import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { deliverHighPriorityDesktopAlert, playJeeAlertSound, readJeeAlertPreferences } from "@/lib/jee360/alert-preferences";

export function JeeAlertListener() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const handledIds = useRef(new Set<string>());

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`jee-high-priority-alerts:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
          const alert = payload.new as {
            id?: string;
            title?: string;
            body?: string | null;
            link?: string | null;
            priority?: string;
            audience?: string;
            target_user_id?: string | null;
          };
          if (!alert.id || alert.priority !== "high") return;
          if (alert.audience !== "all" && alert.target_user_id !== user.id) return;
          if (handledIds.current.has(alert.id)) return;
          handledIds.current.add(alert.id);
          if (handledIds.current.size > 100) {
            const oldestId = handledIds.current.values().next().value;
            if (oldestId) handledIds.current.delete(oldestId);
          }

          const preferences = readJeeAlertPreferences();
          if (preferences.soundEnabled) playJeeAlertSound(preferences.sound);
          if (preferences.desktopEnabled && alert.title) {
            deliverHighPriorityDesktopAlert(
              { id: alert.id, title: alert.title, body: alert.body, link: alert.link },
              () => {
                if (!alert.link) return;
                if (alert.link.startsWith("http")) window.open(alert.link, "_blank", "noopener,noreferrer");
                else void router.navigate({ to: alert.link as string });
              },
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, router, user]);

  return null;
}
