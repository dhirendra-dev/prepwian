import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type PresenceState = {
  onlineIds: Set<string>;
  isOnline: (userId: string | null | undefined) => boolean;
};

const Ctx = createContext<PresenceState>({ onlineIds: new Set(), isOnline: () => false });

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setOnlineIds(new Set());
      return;
    }
    const channel = supabase.channel("global-presence", {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineIds(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        channel.track({ online_at: new Date().toISOString() }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value = useMemo<PresenceState>(
    () => ({ onlineIds, isOnline: (id) => !!id && onlineIds.has(id) }),
    [onlineIds],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePresence() {
  return useContext(Ctx);
}
