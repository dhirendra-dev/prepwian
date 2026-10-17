import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { LinkifiedText } from "@/components/LinkifiedText";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AdminBadge } from "@/components/AdminBadge";
import { isBadgeHidden } from "@/lib/hidden-badges";
import { haptic } from "@/lib/haptics";
import {
  Send,
  Trash2,
  MessageCircle,
  ShieldCheck,
  Pin,
  PinOff,
  CheckCircle2,
  Circle,
  ArrowDown,
  Smile,
  Users,
  SmilePlus,
} from "lucide-react";

type ChatMessage = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  pinned_at: string | null;
  pinned_by: string | null;
  marked_at: string | null;
  marked_by: string | null;
  marked_label: string | null;
};

type Profile = { id: string; full_name: string | null; avatar_url: string | null };

type SystemNotice = {
  id: string;
  kind: "admin_joined";
  user_id: string;
  name: string;
  created_at: string;
};

const MAX_LEN = 1000;
const PAGE = 100;
const QUICK_EMOJIS = ["👍", "🔥", "🎉", "💯", "🙏", "😂", "😍", "🤔", "👀", "✅"];
const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "🙏", "😮", "💯"];

type Reaction = { id: string; message_id: string; user_id: string; emoji: string };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === y.toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

export function CommunityChat() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [notices, setNotices] = useState<SystemNotice[]>([]);
  const [iAmAdmin, setIAmAdmin] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [unreadNew, setUnreadNew] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; at: number }>>({});
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [openReactionPicker, setOpenReactionPicker] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const seenAdminJoinsRef = useRef<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingIdsRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSentRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProfiles = async (ids: string[]) => {
    const missing = Array.from(new Set(ids)).filter((id) => id && !profiles[id]);
    if (missing.length === 0) return;
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url").in("id", missing),
      supabase.from("user_roles").select("user_id").eq("role", "admin").in("user_id", missing),
    ]);
    if (profs) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const p of profs) next[p.id] = p as Profile;
        return next;
      });
    }
    if (roles && roles.length) {
      setAdmins((prev) => {
        const next = new Set(prev);
        for (const r of roles) next.add(r.user_id as string);
        return next;
      });
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, user_id, body, created_at, pinned_at, pinned_by, marked_at, marked_by, marked_label")
        .order("created_at", { ascending: false })
        .limit(PAGE);
      if (!active) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const ordered = (data ?? []).slice().reverse() as ChatMessage[];
      setMessages(ordered);
      setLoading(false);
      await loadProfiles(ordered.map((m) => m.user_id));
      if (ordered.length) {
        const { data: rx } = await supabase
          .from("chat_message_reactions")
          .select("id, message_id, user_id, emoji")
          .in("message_id", ordered.map((m) => m.id));
        if (rx) setReactions(rx as Reaction[]);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) {
      setIAmAdmin(false);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (active && data) {
        setIAmAdmin(true);
        setAdmins((prev) => {
          const n = new Set(prev);
          n.add(user.id);
          return n;
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const channel = supabase
      .channel("chat_messages_room", {
        config: { presence: { key: user?.id ?? `guest-${Math.random().toString(36).slice(2, 8)}` } },
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as ChatMessage;
        setMessages((prev) => {
          if (prev.some((x) => x.id === m.id)) return prev;
          // Replace optimistic placeholder from same user with matching body, if any
          const idx = prev.findIndex((x) => x.id.startsWith("tmp-") && x.user_id === m.user_id && x.body === m.body);
          if (idx >= 0) {
            const next = prev.slice();
            next[idx] = m;
            return next;
          }
          return [...prev, m];
        });
        loadProfiles([m.user_id]);
        if (!stickToBottomRef.current && m.user_id !== user?.id) {
          setUnreadNew((c) => c + 1);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as ChatMessage;
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload) => {
        const old = payload.old as { id: string };
        setMessages((prev) => prev.filter((m) => m.id !== old.id));
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        // SECURITY: never trust `is_admin`/`name` from presence payloads — any
        // client can spoof them. Verify admin status server-side via user_roles
        // and read the display name from profiles.
        for (const pres of newPresences as Array<{ user_id?: string }>) {
          const uid = pres?.user_id;
          if (!uid || uid === "guest") continue;
          if (seenAdminJoinsRef.current.has(uid)) continue;
          seenAdminJoinsRef.current.add(uid);
          setTimeout(() => seenAdminJoinsRef.current.delete(uid), 60_000);
          (async () => {
            const { data: role } = await supabase
              .from("user_roles")
              .select("user_id")
              .eq("user_id", uid)
              .eq("role", "admin")
              .maybeSingle();
            if (!role) return;
            setAdmins((prev) => {
              if (prev.has(uid)) return prev;
              const n = new Set(prev);
              n.add(uid);
              return n;
            });
            const { data: prof } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .eq("id", uid)
              .maybeSingle();
            if (prof) {
              setProfiles((prev) => ({ ...prev, [prof.id as string]: prof as Profile }));
            }
            setNotices((prev) => [
              ...prev,
              {
                id: `${uid}:${Date.now() >> 14}`,
                kind: "admin_joined",
                user_id: uid,
                name: (prof?.full_name as string | undefined) ?? "An admin",
                created_at: new Date().toISOString(),
              },
            ]);
          })();
        }
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const p = payload as { user_id?: string; name?: string };
        if (!p?.user_id || p.user_id === user?.id) return;
        setTypingUsers((prev) => ({ ...prev, [p.user_id!]: { name: p.name ?? "Someone", at: Date.now() } }));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user?.id ?? "guest",
          });
        }
      });
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, iAmAdmin]);

  // Expire stale typing indicators
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const next: typeof prev = {};
        let changed = false;
        for (const [k, v] of Object.entries(prev)) {
          if (now - v.at < 4000) next[k] = v;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Realtime reactions
  useEffect(() => {
    const ch = supabase
      .channel("chat_reactions_room")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_message_reactions" }, (payload) => {
        const r = payload.new as Reaction;
        setReactions((prev) => (prev.some((x) => x.id === r.id) ? prev : [...prev, r]));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_message_reactions" }, (payload) => {
        const old = payload.old as { id: string };
        setReactions((prev) => prev.filter((x) => x.id !== old.id));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const reactionsByMessage = useMemo(() => {
    const map: Record<string, Reaction[]> = {};
    for (const r of reactions) {
      (map[r.message_id] ??= []).push(r);
    }
    return map;
  }, [reactions]);

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    setOpenReactionPicker(null);
    const existing = reactions.find((r) => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      const { error } = await supabase.from("chat_message_reactions").delete().eq("id", existing.id);
      if (error) {
        setReactions((prev) => [...prev, existing]);
        setError(error.message);
      }
    } else {
      const tempId = `tmp-rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const optimistic: Reaction = { id: tempId, message_id: messageId, user_id: user.id, emoji };
      setReactions((prev) => [...prev, optimistic]);
      const { data, error } = await supabase
        .from("chat_message_reactions")
        .insert({ message_id: messageId, user_id: user.id, emoji })
        .select("id, message_id, user_id, emoji")
        .maybeSingle();
      if (error) {
        setReactions((prev) => prev.filter((r) => r.id !== tempId));
        if (!error.message.includes("duplicate")) setError(error.message);
      } else if (data) {
        setReactions((prev) => prev.map((r) => (r.id === tempId ? (data as Reaction) : r)));
      }
    }
  };



  type TimelineItem =
    | { type: "msg"; at: string; data: ChatMessage }
    | { type: "notice"; at: string; data: SystemNotice };

  const timeline: TimelineItem[] = useMemo(
    () =>
      [
        ...messages.map((m) => ({ type: "msg" as const, at: m.created_at, data: m })),
        ...notices.map((n) => ({ type: "notice" as const, at: n.created_at, data: n })),
      ].sort((a, b) => a.at.localeCompare(b.at)),
    [messages, notices],
  );

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [timeline.length]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    stickToBottomRef.current = isAtBottom;
    setAtBottom((previous) => (previous === isAtBottom ? previous : isAtBottom));
    if (isAtBottom) setUnreadNew((previous) => (previous === 0 ? previous : 0));
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    stickToBottomRef.current = true;
    setAtBottom(true);
    setUnreadNew(0);
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const body = input.trim();
    if (!body || !user || sending) return;

    // Optimistic: clear input immediately, render placeholder bubble.
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    pendingIdsRef.current.add(tempId);
    const placeholder: ChatMessage = {
      id: tempId,
      user_id: user.id,
      body,
      created_at: new Date().toISOString(),
      pinned_at: null,
      pinned_by: null,
      marked_at: null,
      marked_by: null,
      marked_label: null,
    };
    setMessages((prev) => [...prev, placeholder]);
    setInput("");
    setShowEmoji(false);
    setError(null);
    stickToBottomRef.current = true;
    setAtBottom(true);
    setSending(true);

    const { error } = await supabase.from("chat_messages").insert({ user_id: user.id, body });
    setSending(false);
    pendingIdsRef.current.delete(tempId);
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(body);
      setError(error.message);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await supabase.from("chat_messages").delete().eq("id", id);
  };

  const onTogglePin = async (m: ChatMessage) => {
    if (!user) return;
    const patch = m.pinned_at
      ? { pinned_at: null, pinned_by: null }
      : { pinned_at: new Date().toISOString(), pinned_by: user.id };
    const { error } = await supabase.from("chat_messages").update(patch).eq("id", m.id);
    if (error) setError(error.message);
  };

  const onToggleMark = async (m: ChatMessage) => {
    if (!user) return;
    const patch = m.marked_at
      ? { marked_at: null, marked_by: null, marked_label: null }
      : { marked_at: new Date().toISOString(), marked_by: user.id, marked_label: "Reply" };
    const { error } = await supabase.from("chat_messages").update(patch).eq("id", m.id);
    if (error) setError(error.message);
  };

  const insertEmoji = (e: string) => {
    setInput((v) => (v + e).slice(0, MAX_LEN));
    textareaRef.current?.focus();
  };

  const pinned = messages.filter((m) => m.pinned_at).sort((a, b) => (a.pinned_at! < b.pinned_at! ? 1 : -1));

  // Compute grouped rendering metadata
  let lastDay = "";
  let lastSenderKey = "";
  let lastTs = 0;

  return (
    <div className="relative flex h-[78vh] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card via-card to-muted/30 shadow-soft dark:from-background dark:via-background dark:to-card/70 dark:border-slate-700/80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-md dark:bg-card/95 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-soft">
            <MessageCircle className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold leading-tight sm:text-base">
              Community Chat
              <span className="hidden items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600 sm:inline-flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" /> Live
              </span>
            </h2>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                {onlineCount} {onlineCount === 1 ? "person" : "people"} online
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Pinned strip */}
      {pinned.length > 0 && (
        <div className="border-b border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-400/5 px-4 py-2">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            <Pin className="h-3 w-3" /> Pinned {pinned.length > 1 ? `· ${pinned.length}` : ""}
          </div>
          <div className="space-y-1">
            {pinned.slice(0, 2).map((m) => {
              const p = profiles[m.user_id];
              return (
                <div key={`pin-${m.id}`} className="flex items-start gap-2 text-xs">
                  <span className="font-medium text-foreground/80">{p?.full_name ?? "Member"}:</span>
                  <span className="line-clamp-1 flex-1 text-muted-foreground"><LinkifiedText text={m.body} /></span>
                  {iAmAdmin && (
                    <button onClick={() => onTogglePin(m)} className="shrink-0 text-amber-600 hover:text-amber-800" title="Unpin">
                      <PinOff className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="community-chat-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
      >
        {loading && (
          <div className="flex flex-col items-center gap-2 py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">Loading messages…</p>
          </div>
        )}
        {!loading && timeline.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">👋</div>
            <p className="text-sm font-semibold">Be the first to say hi</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Introduce yourself, share a doubt, or drop a study tip. The room is live.
            </p>
          </div>
        )}

        <div className="space-y-1">
          {timeline.map((item, idx) => {
            const itemDay = dayKey(item.at);
            const showDay = itemDay !== lastDay;
            lastDay = itemDay;

            if (item.type === "notice") {
              lastSenderKey = "";
              const n = item.data;
              return (
                <div key={n.id}>
                  {showDay && <DayDivider label={dayLabel(item.at)} />}
                  <div className="my-2 flex justify-center">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                      <ShieldCheck className="h-3 w-3" />
                      <span>
                        <strong>{n.name}</strong> (Admin) joined the chat
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            const m = item.data;
            const p = profiles[m.user_id];
            const mine = user?.id === m.user_id;
            const isAdmin = admins.has(m.user_id);
            const isPinned = !!m.pinned_at;
            const isMarked = !!m.marked_at;
            const canModerate = iAmAdmin;
            const ts = new Date(m.created_at).getTime();
            const senderKey = `${m.user_id}:${mine ? "me" : "them"}`;
            const grouped = senderKey === lastSenderKey && ts - lastTs < 5 * 60 * 1000 && !showDay;
            lastSenderKey = senderKey;
            lastTs = ts;

            return (
              <div key={m.id}>
                {showDay && <DayDivider label={dayLabel(item.at)} />}
                <div
                  className={`flex gap-2 ${mine ? "flex-row-reverse" : ""} ${grouped ? "mt-0.5" : "mt-3"} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                >
                  <div className="w-8 shrink-0">
                    {!grouped ? (
                      <Link
                        to="/u/$userId"
                        params={{ userId: m.user_id }}
                        className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary transition hover:ring-2 hover:ring-primary/40 ${isAdmin && !isBadgeHidden(m.user_id) ? "ring-2 ring-amber-400/70" : ""}`}
                        aria-label={`View ${p?.full_name ?? "member"}'s profile`}
                      >
                        {p?.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials(p?.full_name)
                        )}
                      </Link>
                    ) : null}
                  </div>

                  <div className={`group flex max-w-[82%] flex-col sm:max-w-[70%] ${mine ? "items-end" : "items-start"}`}>
                    {!grouped && (
                      <div className="mb-1 flex flex-wrap items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                        <Link
                          to="/u/$userId"
                          params={{ userId: m.user_id }}
                          className="font-semibold text-foreground/85 hover:text-primary hover:underline"
                        >
                          {mine ? "You" : p?.full_name ?? "Member"}
                        </Link>
                        {isAdmin && <AdminBadge userId={m.user_id} />}
                        <span className="text-muted-foreground/70">·</span>
                        <span>{formatTime(m.created_at)}</span>
                      </div>
                    )}

                    <div className="relative">
                      <div
                        onContextMenu={(e) => {
                          if (!user || m.id.startsWith("tmp-")) return;
                          e.preventDefault();
                          setOpenReactionPicker(m.id);
                          haptic("medium");
                        }}
                        onTouchStart={() => {
                          if (!user || m.id.startsWith("tmp-")) return;
                          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = setTimeout(() => {
                            setOpenReactionPicker(m.id);
                            haptic("medium");
                          }, 450);
                        }}
                        onTouchEnd={() => {
                          if (longPressTimerRef.current) {
                            clearTimeout(longPressTimerRef.current);
                            longPressTimerRef.current = null;
                          }
                        }}
                        onTouchMove={() => {
                          if (longPressTimerRef.current) {
                            clearTimeout(longPressTimerRef.current);
                            longPressTimerRef.current = null;
                          }
                        }}
                        onTouchCancel={() => {
                          if (longPressTimerRef.current) {
                            clearTimeout(longPressTimerRef.current);
                            longPressTimerRef.current = null;
                          }
                        }}
                        className={`whitespace-pre-wrap break-words px-3.5 py-2 text-sm leading-relaxed shadow-soft transition select-none sm:select-text ${
                          mine
                            ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground"
                            : "bg-background text-foreground border border-border/60 dark:bg-slate-900/75 dark:border-slate-700/80"
                        } ${
                          mine
                            ? grouped
                              ? "rounded-2xl rounded-tr-md"
                              : "rounded-2xl rounded-tr-md"
                            : grouped
                              ? "rounded-2xl rounded-tl-md"
                              : "rounded-2xl rounded-tl-md"
                        } ${isPinned ? "ring-2 ring-amber-400/60" : ""} ${isMarked ? "ring-2 ring-emerald-400/60" : ""} ${openReactionPicker === m.id ? "ring-2 ring-primary/50" : ""}`}
                      >
                        <LinkifiedText text={m.body} />
                      </div>
                      {(isPinned || isMarked) && (
                        <div className={`mt-0.5 flex flex-wrap gap-1 px-1 ${mine ? "justify-end" : ""}`}>
                          {isPinned && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                              <Pin className="h-2.5 w-2.5" /> Pinned
                            </span>
                          )}
                          {isMarked && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-2.5 w-2.5" /> {m.marked_label ?? "Reply"}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Reaction picker trigger (hover on desktop) */}
                      {user && !m.id.startsWith("tmp-") && (
                        <div className={`absolute top-1/2 -translate-y-1/2 ${mine ? "-left-8" : "-right-8"} hidden opacity-0 transition group-hover:opacity-100 sm:block`}>
                          <button
                            type="button"
                            onClick={() => setOpenReactionPicker((cur) => (cur === m.id ? null : m.id))}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-soft hover:text-foreground"
                            title="Add reaction"
                          >
                            <SmilePlus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      {/* Reaction picker popover (shared by hover + long-press) */}
                      {openReactionPicker === m.id && (
                        <div
                          className={`absolute z-30 -top-12 ${mine ? "right-0" : "left-0"} flex gap-0.5 rounded-full border border-border bg-card p-1 shadow-lg animate-in fade-in zoom-in-95 duration-150`}
                        >
                          {REACTION_EMOJIS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => toggleReaction(m.id, e)}
                              className="rounded-full p-1.5 text-lg transition active:scale-90 hover:scale-125 hover:bg-muted"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>


                    {/* Reaction chips */}
                    {(() => {
                      const rxs = reactionsByMessage[m.id];
                      if (!rxs || rxs.length === 0) return null;
                      const grouped = new Map<string, Reaction[]>();
                      for (const r of rxs) {
                        const arr = grouped.get(r.emoji) ?? [];
                        arr.push(r);
                        grouped.set(r.emoji, arr);
                      }
                      return (
                        <div className={`mt-1 flex flex-wrap gap-1 px-1 ${mine ? "justify-end" : ""}`}>
                          {Array.from(grouped.entries()).map(([emoji, list]) => {
                            const mineReacted = !!user && list.some((r) => r.user_id === user.id);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => toggleReaction(m.id, emoji)}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition active:scale-90 ${
                                  mineReacted
                                    ? "border-primary/50 bg-primary/10 text-foreground"
                                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                                }`}
                              >
                                <span className="text-sm leading-none">{emoji}</span>
                                <span className="font-semibold tabular-nums">{list.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}


                    {(canModerate || mine) && (
                      <div
                        className={`mt-1 flex flex-wrap items-center gap-2 px-1 text-[10px] transition sm:opacity-0 sm:group-hover:opacity-100 ${mine ? "justify-end" : ""}`}
                      >
                        {canModerate && (
                          <>
                            <button
                              onClick={() => onTogglePin(m)}
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-amber-600"
                              title={isPinned ? "Unpin" : "Pin message"}
                            >
                              {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                              {isPinned ? "Unpin" : "Pin"}
                            </button>
                            <button
                              onClick={() => onToggleMark(m)}
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-emerald-600"
                              title={isMarked ? "Unmark" : "Mark as reply"}
                            >
                              {isMarked ? <Circle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                              {isMarked ? "Unmark" : "Mark reply"}
                            </button>
                          </>
                        )}
                        {(mine || canModerate) && (
                          <button
                            onClick={() => onDelete(m.id)}
                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */}
                {idx === -1 && null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll-to-bottom FAB */}
      {(!atBottom || unreadNew > 0) && timeline.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-[88px] right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-lg transition hover:scale-105 active:scale-95"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          {unreadNew > 0 ? `${unreadNew} new` : "Latest"}
        </button>
      )}

      {/* Composer */}
      <div className="border-t border-border bg-card/90 px-3 py-2.5 backdrop-blur-md dark:bg-card/95 sm:px-4 sm:py-3">
        <TypingIndicator users={Object.values(typingUsers).map((t) => t.name)} />
        {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
        {authLoading ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">Checking sign-in…</p>
        ) : user ? (
          <>
            {showEmoji && (
              <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-border bg-background p-2 shadow-soft">
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => insertEmoji(e)}
                    className="rounded-md p-1.5 text-lg transition hover:scale-110 hover:bg-muted"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground ${showEmoji ? "bg-muted text-foreground" : ""}`}
                title="Emoji"
              >
                <Smile className="h-5 w-5" />
              </button>
              <div className="relative flex flex-1 items-end rounded-2xl border border-border bg-background pl-3 pr-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value.slice(0, MAX_LEN));
                    const now = Date.now();
                    if (channelRef.current && user && now - lastTypingSentRef.current > 1500) {
                      lastTypingSentRef.current = now;
                      channelRef.current.send({
                        type: "broadcast",
                        event: "typing",
                        payload: {
                          user_id: user.id,
                          name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Someone",
                        },
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSubmit(e as unknown as FormEvent);
                    }
                  }}
                  placeholder="Message the community…"
                  rows={1}
                  className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
                />
                {input.length > MAX_LEN * 0.8 && (
                  <span className="self-end pb-1 pr-1 text-[10px] text-muted-foreground">
                    {input.length}/{MAX_LEN}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition enabled:hover:scale-105 enabled:active:scale-95 disabled:opacity-40"
                aria-label="Send"
              >
                {sending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
            <p className="text-sm text-muted-foreground">Sign in to join the conversation.</p>
            <Link to="/auth" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="rounded-full border border-border bg-card px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function TypingIndicator({ users }: { users: string[] }) {
  if (users.length === 0) return null;
  const label =
    users.length === 1
      ? `${users[0]} is typing`
      : users.length === 2
        ? `${users[0]} and ${users[1]} are typing`
        : `${users[0]} and ${users.length - 1} others are typing`;
  return (
    <div className="mb-1.5 flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
      </span>
      <span className="truncate">{label}…</span>
    </div>
  );
}
