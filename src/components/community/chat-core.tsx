import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatKind = "general" | "doubt" | "doubt_reply";

export type ChatRow = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  pinned_at: string | null;
  pinned_by: string | null;
  kind: string;
  subject: string | null;
  topic: string | null;
  image_url: string | null;
  parent_id: string | null;
  reply_to_id: string | null;
  is_ai: boolean;
  edited_at: string | null;
  solved_at: string | null;
  deleted_for_everyone: boolean;
};

export type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  verified: boolean | null;
};

export type Reaction = { id: string; message_id: string; user_id: string; emoji: string };

export const CHAT_COLS =
  "id, user_id, body, created_at, pinned_at, pinned_by, kind, subject, topic, image_url, parent_id, reply_to_id, is_ai, edited_at, solved_at, deleted_for_everyone";

export const MAX_LEN = 9000;
export const PAGE_SIZE = 40;

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "🙏", "😮", "💯"];
export const QUICK_EMOJIS = ["👍", "🔥", "🎉", "💯", "🙏", "😂", "😍", "🤔", "👀", "✅"];

export const SUBJECTS = [
  {
    value: "physics",
    label: "Physics",
    chip: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  },
  {
    value: "chemistry",
    label: "Chemistry",
    chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    value: "mathematics",
    label: "Maths",
    chip: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  },
  {
    value: "general",
    label: "General",
    chip: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
] as const;

export function subjectMeta(value: string | null | undefined) {
  return SUBJECTS.find((s) => s.value === value) ?? SUBJECTS[3];
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

export function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

export function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function displayName(p: Profile | undefined) {
  return p?.full_name?.trim() || (p?.username ? `@${p.username}` : "Member");
}

/** Shared profile + admin-role cache with a stable `ensure` fetcher. */
export function useProfileCache() {
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const knownRef = useRef<Set<string>>(new Set());

  const ensure = useCallback(async (ids: (string | null | undefined)[]) => {
    const missing = Array.from(new Set(ids.filter((v): v is string => !!v))).filter(
      (id) => !knownRef.current.has(id),
    );
    if (!missing.length) return;
    for (const id of missing) knownRef.current.add(id);
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, verified")
        .in("id", missing),
      supabase.from("user_roles").select("user_id").eq("role", "admin").in("user_id", missing),
    ]);
    if (profs?.length) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const p of profs) next[p.id as string] = p as Profile;
        return next;
      });
    }
    if (roles?.length) {
      setAdmins((prev) => {
        const next = new Set(prev);
        for (const r of roles) next.add(r.user_id as string);
        return next;
      });
    }
  }, []);

  return { profiles, admins, ensure };
}

/**
 * Loads + live-syncs top-level messages of one `kind`, newest last.
 * Realtime rows of other kinds are ignored so tabs never bleed into each other.
 */
export function useChatMessages(
  kind: ChatKind,
  channelName: string,
  currentUserId: string | undefined,
  initialMessageId?: string,
) {
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCount, setNewCount] = useState(0);
  const stickRef = useRef(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(CHAT_COLS)
        .eq("kind", kind)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (!active) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      let rows = ((data ?? []) as unknown as ChatRow[]).slice().reverse();
      if (initialMessageId) {
        const { data: target } = await supabase
          .from("chat_messages")
          .select(CHAT_COLS)
          .eq("id", initialMessageId)
          .eq("kind", kind)
          .is("parent_id", null)
          .maybeSingle();
        if (target) {
          const targetRow = target as unknown as ChatRow;
          const halfPage = Math.floor(PAGE_SIZE / 2);
          const [before, after] = await Promise.all([
            supabase
              .from("chat_messages")
              .select(CHAT_COLS)
              .eq("kind", kind)
              .is("parent_id", null)
              .lt("created_at", targetRow.created_at)
              .order("created_at", { ascending: false })
              .limit(halfPage),
            supabase
              .from("chat_messages")
              .select(CHAT_COLS)
              .eq("kind", kind)
              .is("parent_id", null)
              .gt("created_at", targetRow.created_at)
              .order("created_at", { ascending: true })
              .limit(halfPage),
          ]);
          rows = [
            ...((before.data ?? []) as unknown as ChatRow[]).reverse(),
            targetRow,
            ...((after.data ?? []) as unknown as ChatRow[]),
          ];
          setHasMore((before.data?.length ?? 0) === halfPage);
          stickRef.current = false;
        } else {
          setHasMore((data?.length ?? 0) === PAGE_SIZE);
          stickRef.current = true;
        }
      } else {
        setHasMore((data?.length ?? 0) === PAGE_SIZE);
        stickRef.current = true;
      }
      setMessages(rows);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [kind, initialMessageId]);

  const loadMore = useCallback(async () => {
    const oldest = messages[0];
    if (!oldest || loadingMore) return;
    setLoadingMore(true);
    const { data } = await supabase
      .from("chat_messages")
      .select(CHAT_COLS)
      .eq("kind", kind)
      .is("parent_id", null)
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const rows = ((data ?? []) as unknown as ChatRow[]).slice().reverse();
    setMessages((prev) => [...rows, ...prev]);
    setHasMore((data?.length ?? 0) === PAGE_SIZE);
    setLoadingMore(false);
  }, [kind, messages, loadingMore]);

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const row = payload.new as ChatRow;
          if (row.kind !== kind || row.parent_id) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const idx = prev.findIndex(
              (m) => m.id.startsWith("tmp-") && m.user_id === row.user_id && m.body === row.body,
            );
            if (idx >= 0) {
              const next = prev.slice();
              next[idx] = row;
              return next;
            }
            return [...prev, row];
          });
          if (!stickRef.current && row.user_id !== currentUserId) setNewCount((c) => c + 1);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages" },
        (payload) => {
          const row = payload.new as ChatRow;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, kind, currentUserId]);

  return {
    messages,
    setMessages,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    setError,
    newCount,
    setNewCount,
    stickRef,
  };
}

/** Live reactions for the community room. */
export function useReactions(messageIds: string[], userId: string | undefined) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const loadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const missing = messageIds.filter(
      (id) => id && !id.startsWith("tmp-") && !loadedRef.current.has(id),
    );
    if (!missing.length) return;
    for (const id of missing) loadedRef.current.add(id);
    (async () => {
      const { data } = await supabase
        .from("chat_message_reactions")
        .select("id, message_id, user_id, emoji")
        .in("message_id", missing);
      if (data?.length) {
        setReactions((prev) => {
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...(data as Reaction[]).filter((r) => !seen.has(r.id))];
        });
      }
    })();
  }, [messageIds]);

  useEffect(() => {
    const ch = supabase
      .channel("community_reactions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_message_reactions" },
        (p) => {
          const r = p.new as Reaction;
          setReactions((prev) => (prev.some((x) => x.id === r.id) ? prev : [...prev, r]));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_message_reactions" },
        (p) => {
          const old = p.old as { id: string };
          setReactions((prev) => prev.filter((x) => x.id !== old.id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const byMessage = useMemo(() => {
    const map: Record<string, Reaction[]> = {};
    for (const r of reactions) (map[r.message_id] ??= []).push(r);
    return map;
  }, [reactions]);

  const toggle = useCallback(
    async (messageId: string, emoji: string) => {
      if (!userId) return;
      const existing = reactions.find(
        (r) => r.message_id === messageId && r.user_id === userId && r.emoji === emoji,
      );
      if (existing) {
        setReactions((prev) => prev.filter((r) => r.id !== existing.id));
        const { error } = await supabase
          .from("chat_message_reactions")
          .delete()
          .eq("id", existing.id);
        if (error) setReactions((prev) => [...prev, existing]);
        return;
      }
      const tmp = `tmp-rx-${Date.now()}`;
      setReactions((prev) => [...prev, { id: tmp, message_id: messageId, user_id: userId, emoji }]);
      const { data, error } = await supabase
        .from("chat_message_reactions")
        .insert({ message_id: messageId, user_id: userId, emoji })
        .select("id, message_id, user_id, emoji")
        .maybeSingle();
      if (error) setReactions((prev) => prev.filter((r) => r.id !== tmp));
      else if (data)
        setReactions((prev) => prev.map((r) => (r.id === tmp ? (data as Reaction) : r)));
    },
    [reactions, userId],
  );

  return { byMessage, toggle };
}

/** Presence + typing broadcast for the community room. */
export function usePresenceRoom(userId: string | undefined, name: string) {
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [typing, setTyping] = useState<Record<string, { name: string; at: number }>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    const channel = supabase.channel("community_room_presence", {
      config: { presence: { key: userId ?? `guest-${Math.random().toString(36).slice(2, 8)}` } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineIds(Object.keys(channel.presenceState()));
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const p = payload as { user_id?: string; name?: string };
        if (!p?.user_id || p.user_id === userId) return;
        setTyping((prev) => ({
          ...prev,
          [p.user_id!]: { name: p.name ?? "Someone", at: Date.now() },
        }));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ user_id: userId ?? "guest" });
      });
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setTyping((prev) => {
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

  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (!userId || now - lastSentRef.current < 1800) return;
    lastSentRef.current = now;
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: userId, name },
    });
  }, [userId, name]);

  const typingNames = useMemo(() => Object.values(typing).map((t) => t.name), [typing]);

  return { onlineIds, typingNames, sendTyping };
}

/** Uploads a chat photo to the private `chat-media` bucket and returns its path. */
export async function uploadChatImage(userId: string, file: File) {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("chat-media").upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

const signedCache = new Map<string, string>();

/** Renders a private chat-media object through a short-lived signed URL. */
export function ChatImage({ path, className }: { path: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(signedCache.get(path) ?? null);

  useEffect(() => {
    if (signedCache.has(path)) {
      setUrl(signedCache.get(path)!);
      return;
    }
    let active = true;
    supabase.storage
      .from("chat-media")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!active || !data?.signedUrl) return;
        signedCache.set(path, data.signedUrl);
        setUrl(data.signedUrl);
      });
    return () => {
      active = false;
    };
  }, [path]);

  if (!url)
    return <div className={`h-40 w-56 animate-pulse rounded-xl bg-muted ${className ?? ""}`} />;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block">
      <img
        src={url}
        alt="Shared in community chat"
        loading="lazy"
        className={`max-h-72 w-auto max-w-full rounded-xl border border-border object-cover ${className ?? ""}`}
      />
    </a>
  );
}
