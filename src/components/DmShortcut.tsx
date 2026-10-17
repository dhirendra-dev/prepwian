import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function DmShortcut() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { count } = await supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .is("read_at", null);
      if (!cancelled) setUnread(count ?? 0);
    };
    load();
    const ch = supabase
      .channel(`dm-shortcut-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        load,
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  if (!user) return null;

  return (
    <Link
      to="/messages"
      aria-label="Direct messages"
      className="nav-glass-btn dm-shortcut relative z-10 mr-1 inline-flex h-9 w-9 items-center justify-center overflow-visible rounded-full"
    >
      <MessageSquare className="h-[18px] w-[18px]" />
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 z-20 inline-flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-red-500 px-1 text-[10px] font-semibold leading-none text-white shadow-sm">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
