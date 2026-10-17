import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AdminBadge } from "@/components/AdminBadge";
import { LazyMathText } from "@/components/LazyMathText";
import {
  askAiOnDoubt,
  getCommunityAiSettings,
  setCommunityAiSettings,
} from "@/lib/community-chat.functions";
import { Bot, CheckCircle2, Key, Loader2, MessageSquare, Sparkles } from "lucide-react";
import {
  ChatImage,
  SUBJECTS,
  displayName,
  initials,
  relativeTime,
  subjectMeta,
  uploadChatImage,
  useChatMessages,
  type ChatRow,
  type Profile,
} from "./chat-core";
import { Composer } from "./Composer";
import { useToastPill } from "./ToastPill";

export function DoubtsBoard({
  search,
  initialMessageId,
  profiles,
  admins,
  ensureProfiles,
  iAmAdmin,
}: {
  search: string;
  initialMessageId?: string;
  profiles: Record<string, Profile>;
  admins: Set<string>;
  ensureProfiles: (ids: (string | null | undefined)[]) => void;
  iAmAdmin: boolean;
}) {
  const { user } = useAuth();
  const toast = useToastPill();
  const { messages, setMessages, loading, hasMore, loadMore, loadingMore } = useChatMessages(
    "doubt",
    "community_doubts_room",
    user?.id,
    initialMessageId,
  );

  const [input, setInput] = useState("");
  const [subject, setSubject] = useState<string>("physics");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, ChatRow[]>>({});
  const [replyDraft, setReplyDraft] = useState("");
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [autoAnswer, setAutoAnswer] = useState(false);
  const initialThreadHandled = useRef<string | null>(null);

  useEffect(() => {
    // Remove legacy per-device Gemini credentials from older versions.
    localStorage.removeItem("jph:gemini-key");
  }, []);

  useEffect(() => {
    if (!user) return;
    getCommunityAiSettings()
      .then((s) => setAutoAnswer(s.autoAnswerDoubts))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    ensureProfiles(messages.map((m) => m.user_id));
  }, [messages, ensureProfiles]);

  const loadReplies = useCallback(
    async (doubtId: string) => {
      const { data } = await supabase
        .from("chat_messages")
        .select(
          "id, user_id, body, created_at, pinned_at, pinned_by, kind, subject, topic, image_url, parent_id, reply_to_id, is_ai, edited_at, solved_at, deleted_for_everyone",
        )
        .eq("parent_id", doubtId)
        .order("created_at", { ascending: true });
      const rows = (data ?? []) as unknown as ChatRow[];
      setReplies((prev) => ({ ...prev, [doubtId]: rows }));
      ensureProfiles(rows.map((r) => r.user_id));
    },
    [ensureProfiles],
  );

  useEffect(() => {
    if (
      !initialMessageId ||
      loading ||
      initialThreadHandled.current === initialMessageId ||
      !messages.some((message) => message.id === initialMessageId)
    )
      return;
    initialThreadHandled.current = initialMessageId;
    setOpenThread(initialMessageId);
    void loadReplies(initialMessageId);
    requestAnimationFrame(() => {
      document.getElementById(`community-doubt-${initialMessageId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [initialMessageId, loading, loadReplies, messages]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = [...messages].reverse();
    if (!q) return rows;
    return rows.filter(
      (m) => m.body.toLowerCase().includes(q) || (m.subject ?? "").toLowerCase().includes(q),
    );
  }, [messages, search]);

  const postDoubt = async () => {
    const body = input.trim();
    if (!user || sending || !body) return;
    setSending(true);
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
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, body, kind: "doubt", subject, image_url: imagePath })
      .select("id")
      .maybeSingle();
    setSending(false);
    if (error) {
      toast(error.message);
      return;
    }
    setInput("");
    setAttachment(null);
    toast("Doubt posted");
    if (autoAnswer && data?.id) {
      askAiOnDoubt({ data: { doubtId: data.id, auto: true } })
        .then((r) => {
          if (!r.skipped) {
            loadReplies(data.id);
            toast("AI answered your doubt");
          }
        })
        .catch(() => {});
    }
  };

  const askAi = async (doubt: ChatRow) => {
    if (!user) return;
    setAiBusy(doubt.id);
    try {
      const r = await askAiOnDoubt({ data: { doubtId: doubt.id } });
      if (r.skipped) toast("This doubt already has an AI answer");
      else {
        toast("AI answer posted");
        setOpenThread(doubt.id);
        await loadReplies(doubt.id);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ask AI failed");
    } finally {
      setAiBusy(null);
    }
  };

  const postReply = async (doubtId: string) => {
    const body = replyDraft.trim();
    if (!user || !body) return;
    const { error } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, body, kind: "doubt_reply", parent_id: doubtId });
    if (error) {
      toast(error.message);
      return;
    }
    setReplyDraft("");
    await loadReplies(doubtId);
  };

  const markSolved = async (m: ChatRow) => {
    const patch = { solved_at: m.solved_at ? null : new Date().toISOString() };
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("chat_messages").update(patch).eq("id", m.id);
    toast(error ? error.message : m.solved_at ? "Reopened" : "Marked as solved");
  };

  const toggleAuto = async () => {
    try {
      const r = await setCommunityAiSettings({ data: { autoAnswerDoubts: !autoAnswer } });
      setAutoAnswer(r.autoAnswerDoubts);
      toast(r.autoAnswerDoubts ? "AI will auto-answer new doubts" : "Auto-answer turned off");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update setting");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 sm:px-4">
        {SUBJECTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSubject(s.value)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
              subject === s.value ? s.chip : "border-border bg-card text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="flex-1" />
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          <Key className="h-3 w-3" /> Platform AI
        </span>
        {iAmAdmin && (
          <button
            type="button"
            onClick={toggleAuto}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              autoAnswer
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            <Bot className="h-3 w-3" /> Auto-answer {autoAnswer ? "on" : "off"}
          </button>
        )}
      </div>

      <div className="community-chat-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        {loading &&
          [0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}

        {!loading && visible.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No doubts yet</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Pick a subject below and ask anything — members and AI can answer.
            </p>
          </div>
        )}

        {visible.map((m) => {
          const meta = subjectMeta(m.subject);
          const p = profiles[m.user_id];
          const thread = replies[m.id] ?? [];
          const open = openThread === m.id;
          return (
            <article
              key={m.id}
              id={`community-doubt-${m.id}`}
              className={`community-doubt-card scroll-mt-6 rounded-2xl border bg-card p-4 shadow-soft ${meta.chip.split(" ").pop()} ${m.id === initialMessageId ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.chip}`}
                >
                  {meta.label}
                </span>
                {m.solved_at && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Solved
                  </span>
                )}
                <span className="flex-1" />
                <span className="text-[10px] text-muted-foreground">
                  {relativeTime(m.created_at)}
                </span>
              </div>

              <div className="mt-3 flex items-start gap-3">
                {p?.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                    {initials(p?.full_name ?? p?.username)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    to="/u/$userId"
                    params={{ userId: m.user_id }}
                    className="flex items-center gap-1 text-xs font-semibold hover:underline"
                  >
                    {displayName(p)}
                    {admins.has(m.user_id) && <AdminBadge userId={m.user_id} />}
                  </Link>
                  {m.image_url && (
                    <div className="mt-2">
                      <ChatImage path={m.image_url} />
                    </div>
                  )}
                  <LazyMathText text={m.body} className="mt-1.5 text-sm" />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenThread(open ? null : m.id);
                    if (!open) loadReplies(m.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {open ? "Hide answers" : "Answers"}
                </button>
                <button
                  type="button"
                  disabled={aiBusy === m.id}
                  onClick={() => askAi(m)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60 dark:from-violet-600 dark:to-indigo-700"
                >
                  {aiBusy === m.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Ask AI
                </button>
                {(m.user_id === user?.id || iAmAdmin) && (
                  <button
                    type="button"
                    onClick={() => markSolved(m)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {m.solved_at ? "Reopen" : "Mark solved"}
                  </button>
                )}
              </div>

              {open && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {thread.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No answers yet. Be the first to help.
                    </p>
                  )}
                  {thread.map((r) => {
                    const rp = profiles[r.user_id];
                    return (
                      <div
                        key={r.id}
                        className={`rounded-xl px-3 py-2 text-sm ${
                          r.is_ai
                            ? "border border-violet-500/40 bg-violet-500/10"
                            : "border border-border bg-muted/40"
                        }`}
                      >
                        <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
                          {r.is_ai ? (
                            <>
                              <Bot className="h-3.5 w-3.5 text-violet-500" />
                              <span className="text-violet-600 dark:text-violet-300">
                                AI Assistant
                              </span>
                            </>
                          ) : (
                            <>
                              {displayName(rp)}
                              {admins.has(r.user_id) && <AdminBadge userId={r.user_id} />}
                            </>
                          )}
                          <span className="font-normal text-muted-foreground">
                            · {relativeTime(r.created_at)}
                          </span>
                        </span>
                        <LazyMathText text={r.body} />
                      </div>
                    );
                  })}

                  {user && (
                    <div className="flex gap-2 pt-1">
                      <input
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") postReply(m.id);
                        }}
                        placeholder="Write an answer…"
                        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary/60"
                      />
                      <button
                        type="button"
                        onClick={() => postReply(m.id)}
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                      >
                        Answer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {hasMore && !loading && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            {loadingMore ? "Loading…" : "Load older doubts"}
          </button>
        )}
      </div>

      <Composer
        value={input}
        onChange={setInput}
        onSubmit={postDoubt}
        sending={sending}
        disabled={!user}
        placeholder={user ? `Ask a ${subjectMeta(subject).label} doubt…` : "Sign in to ask a doubt"}
        attachment={attachment}
        onAttach={setAttachment}
        onClearAttachment={() => setAttachment(null)}
      />
    </div>
  );
}
