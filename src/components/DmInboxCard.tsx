import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OnlineDot } from "@/components/OnlineDot";
import { MessageSquare, ArrowUpRight, MoreVertical, CheckCheck, MailOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { haptic } from "@/lib/haptics";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

type Convo = {
  peer_id: string;
  last_message: string;
  last_at: string;
  last_sender: string;
  unread: number;
  profile?: { id: string; full_name: string | null; avatar_url: string | null };
};

export function DmInboxCard({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [me] = useState(userId);

  const convos = useQuery<Convo[]>({
    queryKey: ["dm-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_dm_conversations");
      if (error) throw error;
      const peerIds = (data ?? []).map((r: any) => r.peer_id);
      if (peerIds.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", peerIds);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((r: any) => ({ ...r, profile: map.get(r.peer_id) }));
    },
  });

  // Realtime: refresh on any new/updated DM involving me
  useEffect(() => {
    const ch = supabase
      .channel(`dm-inbox-card-${me}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        (payload) => {
          const row: any = payload.new ?? payload.old;
          if (!row) return;
          if (row.sender_id === me || row.recipient_id === me) {
            qc.invalidateQueries({ queryKey: ["dm-conversations"] });
            const isNew = payload.eventType === "INSERT" && row.recipient_id === me;
            if (isNew) haptic("light");
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [me, qc]);

  async function markRead(peerId: string) {
    haptic("light");
    // Optimistic
    qc.setQueryData<Convo[]>(["dm-conversations"], (old) =>
      (old ?? []).map((c) => (c.peer_id === peerId ? { ...c, unread: 0 } : c))
    );
    await supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", peerId)
      .eq("recipient_id", me)
      .is("read_at", null);
    qc.invalidateQueries({ queryKey: ["dm-conversations"] });
  }

  async function markUnread(peerId: string) {
    haptic("light");
    // Mark the most recent incoming message as unread
    const { data: latest } = await supabase
      .from("direct_messages")
      .select("id")
      .eq("sender_id", peerId)
      .eq("recipient_id", me)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latest) return;
    qc.setQueryData<Convo[]>(["dm-conversations"], (old) =>
      (old ?? []).map((c) => (c.peer_id === peerId ? { ...c, unread: Math.max(1, c.unread) } : c))
    );
    await supabase.from("direct_messages").update({ read_at: null }).eq("id", latest.id);
    qc.invalidateQueries({ queryKey: ["dm-conversations"] });
  }

  const list = (convos.data ?? []).slice(0, 5);
  const totalUnread = (convos.data ?? []).reduce((a, c) => a + (c.unread ?? 0), 0);

  return (
    <section className="max-w-full overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0 text-accent sm:h-5 sm:w-5" />
          <h2 className="truncate font-display text-base font-semibold sm:text-lg">Direct Messages</h2>
          {totalUnread > 0 && (
            <span className="inline-flex h-5 min-w-[20px] shrink-0 animate-pulse items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
              {totalUnread}
            </span>
          )}
        </div>
        <Link to="/messages" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:underline sm:text-sm">
          Inbox <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>

      {convos.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">No chats yet. Start a private conversation.</p>
          <Link to="/messages" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
            Find people to message <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </div>
      ) : (
        <ul className="mt-3 max-w-full divide-y divide-border overflow-hidden">
          {list.map((c) => (
            <li key={c.peer_id} className="flex min-w-0 items-center gap-1 overflow-hidden">
              <Link
                to="/messages/$peerId"
                params={{ peerId: c.peer_id }}
                className="flex min-w-0 flex-1 max-w-full items-center gap-3 overflow-hidden rounded-lg px-2 py-2.5 -mx-2 transition hover:bg-muted/50"
                onClick={() => {
                  // Optimistic clear when opening
                  qc.setQueryData<Convo[]>(["dm-conversations"], (old) =>
                    (old ?? []).map((x) => (x.peer_id === c.peer_id ? { ...x, unread: 0 } : x))
                  );
                }}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    {c.profile?.avatar_url ? <AvatarImage src={c.profile.avatar_url} /> : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {(c.profile?.full_name ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <OnlineDot userId={c.peer_id} className="absolute -bottom-0.5 -right-0.5" />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className={`min-w-0 truncate text-sm ${c.unread > 0 ? "font-bold" : "font-semibold"}`}>
                      {c.profile?.full_name ?? "Aspirant"}
                    </p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.last_at)}</span>
                  </div>
                  <p className={`truncate text-xs ${c.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {c.last_sender === me ? "You: " : ""}
                    {c.last_message}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                    {c.unread}
                  </span>
                )}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Conversation actions"
                >
                  <MoreVertical className="h-4 w-4 shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {c.unread > 0 ? (
                    <DropdownMenuItem onClick={() => markRead(c.peer_id)}>
                      <CheckCheck className="mr-2 h-4 w-4" /> Mark as read
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => markUnread(c.peer_id)} disabled={c.last_sender === me}>
                      <MailOpen className="mr-2 h-4 w-4" /> Mark as unread
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
