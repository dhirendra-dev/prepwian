import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AdminBadge } from "@/components/AdminBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { LazyMathText } from "@/components/LazyMathText";
import { haptic } from "@/lib/haptics";
import { getCommunitySeenCount } from "@/lib/community-chat.functions";
import {
  ArrowDown,
  Check,
  CheckCheck,
  CornerUpLeft,
  Loader2,
  Pencil,
  Pin,
  Reply,
  SmilePlus,
  Trash2,
  X,
} from "lucide-react";
import {
  ChatImage,
  MAX_LEN,
  REACTION_EMOJIS,
  dayKey,
  dayLabel,
  displayName,
  formatTime,
  initials,
  uploadChatImage,
  useChatMessages,
  useReactions,
  type ChatRow,
  type Profile,
} from "./chat-core";
import { Composer } from "./Composer";
import { useMessageActions, MessageActionSheet } from "@/components/message-actions";
import { useToastPill } from "./ToastPill";
import { useLatestPinnedNotice } from "./NoticesFeed";

export function CommunityChatRoom({
  search,
  initialMessageId,
  profiles,
  admins,
  ensureProfiles,
  onlineIds,
  typingNames,
  sendTyping,
  iAmAdmin,
}: {
  search: string;
  initialMessageId?: string;
  profiles: Record<string, Profile>;
  admins: Set<string>;
  ensureProfiles: (ids: (string | null | undefined)[]) => void;
  onlineIds: string[];
  typingNames: string[];
  sendTyping: () => void;
  iAmAdmin: boolean;
}) {
  const { user } = useAuth();
  const toast = useToastPill();
  const pinnedNotice = useLatestPinnedNotice();
  const {
    messages,
    setMessages,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    newCount,
    setNewCount,
    stickRef,
  } = useChatMessages("general", "community_general_room", user?.id, initialMessageId);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<ChatRow | null>(null);
  const actions = useMessageActions();
  const [editing, setEditing] = useState<ChatRow | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [seenCount, setSeenCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ids = useMemo(() => messages.map((m) => m.id), [messages]);
  const { byMessage, toggle } = useReactions(ids, user?.id);

  useEffect(() => {
    ensureProfiles(messages.map((m) => m.user_id));
  }, [messages, ensureProfiles]);

  // Mark the room as read whenever we're looking at the newest messages.
  useEffect(() => {
    if (!user || !atBottom || !messages.length) return;
    supabase
      .from("chat_reads")
      .upsert(
        { user_id: user.id, last_read_at: new Date().toISOString() },
        { onConflict: "user_id" },
      )
      .then(() => {});
  }, [user, atBottom, messages.length]);

  // Read receipts for my most recent message.
  const myLast = useMemo(
    () => [...messages].reverse().find((m) => m.user_id === user?.id && !m.id.startsWith("tmp-")),
    [messages, user?.id],
  );
  useEffect(() => {
    if (!myLast) return;
    let active = true;
    getCommunitySeenCount({ data: { after: myLast.created_at } })
      .then((r) => {
        if (active) setSeenCount(r.seen);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [myLast?.id, myLast?.created_at]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.body.toLowerCase().includes(q) ||
        displayName(profiles[m.user_id]).toLowerCase().includes(q),
    );
  }, [messages, search, profiles]);

  useEffect(() => {
    if (!stickRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [visible.length, stickRef]);

  useEffect(() => {
    if (
      !initialMessageId ||
      loading ||
      !messages.some((message) => message.id === initialMessageId)
    )
      return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(`community-message-${initialMessageId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialMessageId, loading, messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    stickRef.current = bottom;
    setAtBottom(bottom);
    if (bottom) setNewCount(0);
    if (el.scrollTop < 80 && hasMore && !loadingMore) loadMore();
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    stickRef.current = true;
    setAtBottom(true);
    setNewCount(0);
  };

  const send = async () => {
    const body = input.trim();
    if (!user || sending || (!body && !attachment)) return;
    setSending(true);

    if (editing) {
      const patch = { body: body.slice(0, MAX_LEN), edited_at: new Date().toISOString() };
      setMessages((prev) => prev.map((m) => (m.id === editing.id ? { ...m, ...patch } : m)));
      const { error } = await supabase.from("chat_messages").update(patch).eq("id", editing.id);
      setSending(false);
      setEditing(null);
      setInput("");
      toast(error ? error.message : "Message edited");
      return;
    }

    let imagePath: string | null = null;
    if (attachment) {
      try {
        imagePath = await uploadChatImage(user.id, attachment);
      } catch (e) {
        setSending(false);
        toast(e instanceof Error ? e.message : "Photo upload failed");
        return;
      }
    }

    const tempId = `tmp-${Date.now()}`;
    const optimistic: ChatRow = {
      id: tempId,
      user_id: user.id,
      body,
      created_at: new Date().toISOString(),
      pinned_at: null,
      pinned_by: null,
      kind: "general",
      subject: null,
      topic: null,
      image_url: imagePath,
      parent_id: null,
      reply_to_id: replyTo?.id ?? null,
      is_ai: false,
      edited_at: null,
      solved_at: null,
      deleted_for_everyone: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setAttachment(null);
    setReplyTo(null);
    stickRef.current = true;
    setAtBottom(true);

    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      body,
      kind: "general",
      image_url: imagePath,
      reply_to_id: optimistic.reply_to_id,
    });
    setSending(false);
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(body);
      toast(error.message);
    }
  };

  const deleteForEveryone = async (m: ChatRow) => {
    const { error } = await supabase
      .from("chat_messages")
      .update({
        body: "This message was deleted",
        deleted_for_everyone: true,
        deleted_at: new Date().toISOString(),
        image_url: null,
      })
      .eq("id", m.id);
    toast(error ? error.message : "Deleted for everyone");
  };

  const togglePin = async (m: ChatRow) => {
    if (!user) return;
    const patch = m.pinned_at
      ? { pinned_at: null, pinned_by: null }
      : { pinned_at: new Date().toISOString(), pinned_by: user.id };
    const { error } = await supabase.from("chat_messages").update(patch).eq("id", m.id);
    toast(error ? error.message : m.pinned_at ? "Unpinned" : "Pinned to the top");
  };

  const mentionCandidates = useMemo(
    () =>
      onlineIds
        .filter((id) => profiles[id])
        .map((id) => ({ id, name: displayName(profiles[id]) }))
        .slice(0, 30),
    [onlineIds, profiles],
  );

  const pinnedMessages = messages.filter((m) => m.pinned_at && !m.deleted_for_everyone);

  let lastDay = "";
  let lastSender = "";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {(pinnedNotice || pinnedMessages.length > 0) && (
        <div className="border-b border-border bg-amber-500/10 px-4 py-2">
          <div className="flex items-start gap-2">
            <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 text-xs">
              <span className="font-semibold text-amber-700 dark:text-amber-300">
                {pinnedNotice ? pinnedNotice.title : "Pinned message"}
              </span>
              <p className="truncate text-muted-foreground">
                {pinnedNotice ? pinnedNotice.body : pinnedMessages[pinnedMessages.length - 1]!.body}
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="community-chat-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4"
      >
        {loading && (
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium">
              {search ? "No messages match your search" : "Be the first to say hi 👋"}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {search
                ? "Try another keyword."
                : "Share what you studied today or ask the room anything."}
            </p>
          </div>
        )}

        {visible.map((m) => {
          const mine = m.user_id === user?.id;
          const p = profiles[m.user_id];
          const isAdmin = admins.has(m.user_id);
          const dk = dayKey(m.created_at);
          const showDay = dk !== lastDay;
          if (showDay) {
            lastDay = dk;
            lastSender = "";
          }
          const grouped = lastSender === m.user_id;
          lastSender = m.user_id;
          const rx = byMessage[m.id] ?? [];
          const grouping: Record<string, { count: number; mine: boolean }> = {};
          for (const r of rx) {
            const g = (grouping[r.emoji] ??= { count: 0, mine: false });
            g.count += 1;
            if (r.user_id === user?.id) g.mine = true;
          }
          const replySource = m.reply_to_id ? messages.find((x) => x.id === m.reply_to_id) : null;

          return (
            <div
              key={m.id}
              id={`community-message-${m.id}`}
              className={`community-chat-message scroll-mt-6 ${m.id === initialMessageId ? "rounded-2xl ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`}
            >
              {showDay && (
                <div className="my-3 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {dayLabel(m.created_at)}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}

              <div
                className={`group flex items-end gap-2 ${grouped ? "mt-1" : "mt-3"} ${mine ? "flex-row-reverse" : ""}`}
              >
                {!mine && (
                  <span className="w-9 shrink-0">
                    {!grouped &&
                      (p?.avatar_url ? (
                        <Link to="/u/$userId" params={{ userId: m.user_id }}>
                          <img
                            src={p.avatar_url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        </Link>
                      ) : (
                        <Link
                          to="/u/$userId"
                          params={{ userId: m.user_id }}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
                        >
                          {initials(p?.full_name ?? p?.username)}
                        </Link>
                      ))}
                  </span>
                )}

                <div
                  className={`min-w-0 max-w-[82%] ${mine ? "items-end text-right" : ""} flex flex-col`}
                >
                  {!grouped && !mine && (
                    <span className="mb-1 flex items-center gap-1 px-1 text-[11px] font-semibold text-muted-foreground">
                      {displayName(p)}
                      {p?.verified && !isAdmin && <VerifiedBadge className="h-3.5 w-3.5" />}
                      {isAdmin && <AdminBadge userId={m.user_id} />}
                    </span>
                  )}

                  <div
                    {...actions.bind({
                      id: m.id,
                      body: m.body,
                      authorName: mine ? "You" : displayName(p),
                      canEdit: mine && !m.deleted_for_everyone,
                      canDelete: (mine || iAmAdmin) && !m.deleted_for_everyone,
                      canModerate: iAmAdmin,
                      isPinned: !!m.pinned_at,
                    })}
                    className={`relative cursor-pointer select-none rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                      mine
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border bg-card dark:border-slate-700/80 dark:bg-slate-900/75"
                    } ${m.deleted_for_everyone ? "italic opacity-60" : ""}`}
                  >
                    {replySource && (
                      <div
                        className={`mb-1.5 flex items-start gap-1 rounded-lg px-2 py-1 text-[11px] ${
                          mine ? "bg-primary-foreground/15" : "bg-muted dark:bg-slate-800/80"
                        }`}
                      >
                        <CornerUpLeft className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="line-clamp-2 text-left opacity-80">
                          {replySource.body}
                        </span>
                      </div>
                    )}
                    {m.image_url && (
                      <div className="mb-1.5">
                        <ChatImage path={m.image_url} />
                      </div>
                    )}
                    {m.body && <LazyMathText text={m.body} className="text-left" />}
                    <span
                      className={`mt-1 flex items-center gap-1 text-[10px] ${
                        mine ? "justify-end text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {m.edited_at && <span>edited ·</span>}
                      {formatTime(m.created_at)}
                      {mine &&
                        !m.id.startsWith("tmp-") &&
                        (myLast?.id === m.id && seenCount > 0 ? (
                          <CheckCheck className="h-3 w-3 text-sky-300" />
                        ) : (
                          <Check className="h-3 w-3" />
                        ))}
                    </span>

                    {pickerFor === m.id && (
                      <div className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-2xl border border-border bg-popover p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          React to message
                        </p>
                        <div className="grid grid-cols-4 gap-1">
                          {REACTION_EMOJIS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => {
                                toggle(m.id, e);
                                setPickerFor(null);
                                haptic();
                              }}
                              className="flex h-10 items-center justify-center rounded-xl text-xl transition hover:bg-muted active:scale-90"
                              aria-label={`React ${e}`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPickerFor(null)}
                          aria-label="Close"
                          className="absolute right-1.5 top-1.5 rounded-full p-1 text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {Object.keys(grouping).length > 0 && (
                    <div className={`mt-1 flex flex-wrap gap-1 ${mine ? "justify-end" : ""}`}>
                      {Object.entries(grouping).map(([emoji, g]) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggle(m.id, emoji)}
                          aria-label={`${g.count} ${emoji} reaction${g.count === 1 ? "" : "s"}${g.mine ? ", remove yours" : ", add yours"}`}
                          aria-pressed={g.mine}
                          className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
                            g.mine
                              ? "border-primary/50 bg-primary/10 text-primary ring-1 ring-primary/20"
                              : "border-border/80 bg-card/90 text-foreground hover:border-primary/40"
                          }`}
                        >
                          <span className="text-base leading-none">{emoji}</span>
                          <span>{g.count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`mt-0.5 flex gap-1 opacity-0 transition group-hover:opacity-100 ${
                      mine ? "justify-end" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setPickerFor(m.id)}
                      aria-label="React"
                      className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                    >
                      <SmilePlus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyTo(m)}
                      aria-label="Reply"
                      className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                    >
                      <Reply className="h-3.5 w-3.5" />
                    </button>
                    {mine && !m.deleted_for_everyone && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(m);
                          setInput(m.body);
                        }}
                        aria-label="Edit"
                        className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {(mine || iAmAdmin) && !m.deleted_for_everyone && (
                      <button
                        type="button"
                        onClick={() => deleteForEveryone(m)}
                        aria-label="Delete for everyone"
                        className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {iAmAdmin && (
                      <button
                        type="button"
                        onClick={() => togglePin(m)}
                        aria-label="Pin"
                        className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {typingNames.length > 0 && (
        <div className="px-4 pb-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="flex gap-0.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
            </span>
            {typingNames.slice(0, 2).join(", ")}
            {typingNames.length > 2 ? ` and ${typingNames.length - 2} more are` : " is"} typing…
          </span>
        </div>
      )}

      {(!atBottom || newCount > 0) && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-24 right-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-lg"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          {newCount > 0 ? `${newCount} new` : "Latest"}
        </button>
      )}

      {(replyTo || editing) && (
        <div className="flex items-center gap-2 border-t border-border bg-muted/50 px-4 py-2 text-xs dark:bg-slate-800/80">
          <CornerUpLeft className="h-3.5 w-3.5 text-primary" />
          <span className="min-w-0 flex-1 truncate">
            {editing
              ? "Editing your message"
              : `Replying to ${displayName(profiles[replyTo!.user_id])}`}
          </span>
          <button
            type="button"
            onClick={() => {
              setReplyTo(null);
              if (editing) setInput("");
              setEditing(null);
            }}
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <Composer
        value={input}
        onChange={setInput}
        onSubmit={send}
        onTyping={sendTyping}
        sending={sending}
        disabled={!user}
        placeholder={user ? "Message the community…" : "Sign in to chat"}
        mentions={mentionCandidates}
        attachment={attachment}
        onAttach={setAttachment}
        onClearAttachment={() => setAttachment(null)}
      />

      <MessageActionSheet
        actions={actions}
        onReply={(t) => {
          const m = messages.find((x) => x.id === t.id);
          if (m) setReplyTo(m);
        }}
        onEdit={(t) => {
          const m = messages.find((x) => x.id === t.id);
          if (m && m.user_id === user?.id) {
            setEditing(m);
            setInput(m.body);
          }
        }}
        onReact={(t, emoji) => toggle(t.id, emoji)}
        onDelete={(t) => {
          const m = messages.find((x) => x.id === t.id);
          if (m) deleteForEveryone(m);
        }}
        onTogglePin={(t) => {
          const m = messages.find((x) => x.id === t.id);
          if (m) togglePin(m);
        }}
      />
    </div>
  );
}
