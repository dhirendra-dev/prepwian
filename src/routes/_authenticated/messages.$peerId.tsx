/* eslint-disable @typescript-eslint/no-explicit-any */
import { LinkifiedText } from "@/components/LinkifiedText";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MoreHorizontal, Reply, Send, UserRound } from "lucide-react";
import { haptic } from "@/lib/haptics";
import {
  useMessageActions,
  MessageActionSheet,
  MessageReactionChips,
  ReplyBanner,
  useStoredMessageReactions,
  type MessageActionTarget,
} from "@/components/message-actions";
import { OnlineDot } from "@/components/OnlineDot";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/messages/$peerId")({
  validateSearch: z.object({ message: z.string().optional() }),
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Private Chat — PREPWIAN" },
      { name: "twitter:description", content: "Private study conversations for PREPWIAN members." },

      { title: "Private Chat — PREPWIAN" },
      {
        name: "description",
        content: "Continue a private study conversation with another PREPWIAN member.",
      },
      { property: "og:title", content: "Private Chat — PREPWIAN" },
      {
        property: "og:description",
        content: "Private study conversations for PREPWIAN members.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DmThread,
  errorComponent: ({ error }: { error: unknown }) => (
    <div className="p-6 text-sm text-destructive">
      {error instanceof Error ? error.message : String(error)}
    </div>
  ),
});

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
function fmtDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const same = d.toDateString() === today.toDateString();
  if (same) return "Today";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function renderMessageLinks(text: string) {
  return <LinkifiedText text={text} />;
}

function DmThread() {
  const { peerId } = Route.useParams();
  const { message: initialMessageId } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [me, setMe] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const actions = useMessageActions();
  const [replyTo, setReplyTo] = useState<MessageActionTarget | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const peer = useQuery({
    queryKey: ["dm-peer", peerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", peerId)
        .maybeSingle();
      return data;
    },
  });

  const msgs = useQuery({
    queryKey: ["dm-thread", peerId, me, initialMessageId],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await (supabase.from("direct_messages") as any)
        .select(
          "id, sender_id, recipient_id, body, created_at, read_at, delivered_at, reply_to_id, edited_at, deleted_at, deleted_for_everyone",
        )
        .or(
          `and(sender_id.eq.${me},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${me})`,
        )
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      const rows = [...(data ?? [])];
      if (initialMessageId && !rows.some((message: any) => message.id === initialMessageId)) {
        const { data: target, error: targetError } = await (supabase.from("direct_messages") as any)
          .select(
            "id, sender_id, recipient_id, body, created_at, read_at, delivered_at, reply_to_id, edited_at, deleted_at, deleted_for_everyone",
          )
          .eq("id", initialMessageId)
          .or(
            `and(sender_id.eq.${me},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${me})`,
          )
          .maybeSingle();
        if (targetError) throw targetError;
        if (target) rows.push(target);
      }
      return rows.sort((a: any, b: any) => a.created_at.localeCompare(b.created_at));
    },
  });
  const dmMessageIds = useMemo(
    () => (msgs.data ?? []).map((message: any) => message.id),
    [msgs.data],
  );
  const dmReactions = useStoredMessageReactions("direct_message_reactions", dmMessageIds, me);

  // Realtime
  useEffect(() => {
    if (!me) return;
    const ch = supabase
      .channel(`dm-thread-${me}-${peerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        (payload) => {
          const row: any = payload.new ?? payload.old;
          if (!row) return;
          const involvesPair =
            (row.sender_id === me && row.recipient_id === peerId) ||
            (row.sender_id === peerId && row.recipient_id === me);
          if (involvesPair) qc.invalidateQueries({ queryKey: ["dm-thread", peerId, me] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [me, peerId, qc]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (initialMessageId && msgs.data?.some((message: any) => message.id === initialMessageId)) {
      requestAnimationFrame(() =>
        document
          .getElementById(`dm-message-${initialMessageId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [initialMessageId, msgs.data?.length]);

  // Mark incoming as read
  useEffect(() => {
    if (!me || !msgs.data) return;
    const unreadIds = (msgs.data as any[])
      .filter((m: any) => m.recipient_id === me && !m.read_at)
      .map((m: any) => m.id);
    const clearManualUnread = async () => {
      if (unreadIds.length > 0) {
        await supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadIds);
      }
      await (supabase as any)
        .from("squad_conversation_states")
        .delete()
        .eq("user_id", me)
        .eq("conversation_type", "dm")
        .eq("conversation_id", peerId);
      qc.invalidateQueries({ queryKey: ["squad-dm-conversations"] });
      qc.invalidateQueries({ queryKey: ["squad-conversation-states", me] });
    };
    void clearManualUnread();
  }, [me, msgs.data, peerId, qc]);

  async function send() {
    const txt = body.trim();
    if (!txt || !me || sending) return;
    setSending(true);
    haptic("light");
    if (editing) {
      const { error } = await (supabase.from("direct_messages") as any)
        .update({ body: txt, edited_at: new Date().toISOString() })
        .eq("id", editing.id)
        .eq("sender_id", me);
      setSending(false);
      if (error) {
        haptic("error");
        alert(error.message);
        return;
      }
      setBody("");
      setEditing(null);
      haptic("success");
      qc.invalidateQueries({ queryKey: ["dm-thread", peerId, me] });
      return;
    }
    const { error } = await supabase
      .from("direct_messages")
      .insert({ sender_id: me, recipient_id: peerId, body: txt, reply_to_id: replyTo?.id ?? null });
    setSending(false);
    if (error) {
      haptic("error");
      alert(error.message);
      return;
    }
    setBody("");
    setReplyTo(null);
    haptic("success");
    qc.invalidateQueries({ queryKey: ["dm-thread", peerId, me] });
  }

  const initials = (peer.data?.full_name ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="dm-page fixed inset-0 z-[60] flex h-[100dvh] flex-col overflow-hidden bg-background">
      <header className="relative z-20 flex items-center gap-3 border-b border-border/60 bg-card/55 px-3 py-3 backdrop-blur-2xl sm:px-5">
        <Button
          onClick={() => navigate({ to: "/messages" })}
          variant="ghost"
          size="icon"
          className="rounded-xl"
          aria-label="Back to messages"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Link
          to="/u/$userId"
          params={{ userId: peerId }}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="relative">
            <Avatar className="h-11 w-11 rounded-2xl border border-card shadow-soft">
              {peer.data?.avatar_url ? <AvatarImage src={peer.data.avatar_url} /> : null}
              <AvatarFallback className="rounded-2xl bg-primary/10 font-display text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <OnlineDot userId={peerId} className="absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-bold">
              {peer.data?.full_name ?? "Aspirant"}
            </p>
            <OnlineDot userId={peerId} showLabel className="mt-0.5" />
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="rounded-xl" asChild>
          <Link to="/u/$userId" params={{ userId: peerId }} aria-label="View profile">
            <UserRound className="h-5 w-5" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden rounded-xl sm:inline-flex"
          aria-label="Conversation options"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-3 py-5 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          {msgs.isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          ) : (msgs.data ?? []).length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No messages yet. Say hi 👋</p>
          ) : (
            <Bubbles
              me={me}
              rows={msgs.data ?? []}
              actions={actions}
              peerName={peer.data?.full_name ?? "Aspirant"}
              reactions={dmReactions.byMessage}
              onReact={dmReactions.toggle}
              initialMessageId={initialMessageId}
            />
          )}
          <div ref={endRef} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="relative z-20 border-t border-border/60 bg-card/55 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl sm:px-6 sm:pb-5"
      >
        <div className="mx-auto w-full max-w-5xl">
          {replyTo && (
            <ReplyBanner
              authorName={replyTo.authorName}
              body={replyTo.body}
              onCancel={() => setReplyTo(null)}
            />
          )}
          {editing && (
            <ReplyBanner
              authorName="your message"
              body={editing.body}
              onCancel={() => {
                setEditing(null);
                setBody("");
              }}
            />
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-card bg-card/80 p-2 shadow-soft backdrop-blur-xl focus-within:ring-2 focus-within:ring-ring/30">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type a message…"
              rows={1}
              className="min-h-10 max-h-28 resize-none border-0 bg-transparent px-2 py-2.5 shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl shadow-glow"
              disabled={sending || !body.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>

      <MessageActionSheet
        actions={actions}
        onReply={(t) => setReplyTo(t)}
        onReact={(t, emoji) => dmReactions.toggle(t.id, emoji)}
        onEdit={(t) => {
          setEditing((msgs.data ?? []).find((m: any) => m.id === t.id) ?? t);
          setBody(t.body);
          setReplyTo(null);
        }}
        onDelete={async (t) => {
          const { error } = await (supabase.from("direct_messages") as any)
            .update({
              body: "This message was deleted",
              deleted_for_everyone: true,
              deleted_at: new Date().toISOString(),
            })
            .eq("id", t.id)
            .eq("sender_id", me);
          if (error) return alert(error.message);
          qc.invalidateQueries({ queryKey: ["dm-thread", peerId, me] });
        }}
      />
    </div>
  );
}

function Bubbles({
  me,
  rows,
  actions,
  peerName,
  reactions,
  onReact,
  initialMessageId,
}: {
  me: string | null;
  rows: any[];
  actions: ReturnType<typeof useMessageActions>;
  peerName: string;
  reactions: Record<string, any[]>;
  onReact: (messageId: string, emoji: string) => void;
  initialMessageId?: string;
}) {
  const out: React.ReactElement[] = [];
  const byId = new Map(rows.map((row) => [row.id, row]));
  let lastDay = "";
  for (const m of rows) {
    const day = fmtDay(m.created_at);
    if (day !== lastDay) {
      lastDay = day;
      out.push(
        <div key={`d-${m.id}`} className="my-5 flex justify-center">
          <span className="rounded-full border border-border/60 bg-card/55 px-3 py-1 text-[10px] font-semibold uppercase text-muted-foreground backdrop-blur">
            {day}
          </span>
        </div>,
      );
    }
    const mine = m.sender_id === me;
    const parent = m.reply_to_id ? byId.get(m.reply_to_id) : undefined;
    // Legacy replies stored the quote inside the body as "> " lines.
    let text: string = m.body ?? "";
    let legacyName: string | null = null;
    let legacyQuote: string | null = null;
    if (!parent && text.startsWith(">")) {
      const lines = text.split("\n");
      const q: string[] = [];
      let i = 0;
      while (i < lines.length && lines[i].startsWith(">")) {
        q.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      const rest = lines.slice(i).join("\n").trim();
      if (rest) {
        if (q.length > 1 && q[0].trim().endsWith(":"))
          legacyName = q.shift()!.trim().replace(/:$/, "");
        legacyQuote = q.join(" ").trim();
        text = rest;
      }
    }
    const quoteName = parent ? (parent.sender_id === me ? "You" : peerName) : legacyName;
    const quoteBody = parent ? parent.body : legacyQuote;
    out.push(
      <div
        key={m.id}
        id={`dm-message-${m.id}`}
        className={`group mb-3 flex scroll-mt-6 animate-fade-in ${mine ? "justify-end" : "justify-start"}`}
      >
        <div
          {...actions.bind({
            id: m.id,
            body: text,
            authorName: mine ? "You" : peerName,
            canDelete: mine,
          })}
          className={`relative max-w-[92%] cursor-pointer select-none overflow-hidden rounded-2xl px-4 py-3.5 text-[15px] transition-transform active:scale-[.99] sm:max-w-[78%] lg:max-w-[72%] ${mine ? "rounded-tr-sm bg-primary text-primary-foreground shadow-glow" : "rounded-tl-sm border border-card bg-card/65 shadow-soft backdrop-blur-xl"}`}
        >
          {quoteBody ? (
            <div
              className={`mb-2 rounded-lg border-l-[3px] px-2.5 py-2 ${mine ? "border-primary-foreground/60 bg-primary-foreground/10" : "border-primary bg-primary/5"}`}
            >
              {quoteName ? (
                <p
                  className={`text-[10px] font-bold uppercase ${mine ? "text-primary-foreground/80" : "text-primary"}`}
                >
                  {quoteName}
                </p>
              ) : null}
              <p
                className={`mt-0.5 line-clamp-2 text-xs ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
              >
                {quoteBody}
              </p>
            </div>
          ) : null}
          <p
            className={`whitespace-pre-wrap break-words leading-relaxed ${m.deleted_for_everyone ? "italic opacity-70" : ""}`}
          >
            {m.deleted_for_everyone ? "This message was deleted" : renderMessageLinks(text)}
          </p>
          <MessageReactionChips
            reactions={reactions[m.id] ?? []}
            userId={me}
            onToggle={(emoji) => onReact(m.id, emoji)}
          />
          <div
            className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
          >
            <span>{fmtTime(m.created_at)}</span>
            {m.edited_at && !m.deleted_for_everyone ? <span>· edited</span> : null}
            {mine ? (
              <span aria-label={m.read_at ? "Read" : "Sent"}>{m.read_at ? "✓✓" : "✓"}</span>
            ) : null}
          </div>
          <span
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-70 ${mine ? "-left-7 text-foreground" : "-right-7 text-foreground"}`}
          >
            <Reply className="h-4 w-4" />
          </span>
        </div>
      </div>,
    );
  }
  return <>{out}</>;
}
