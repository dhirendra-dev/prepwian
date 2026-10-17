/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import { supabase } from "@/integrations/supabase/client";
import {
  Reply,
  Copy,
  Pencil,
  SmilePlus,
  Trash2,
  Pin,
  PinOff,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";

/**
 * Shared WhatsApp-style tap / long-press action menu for every surface that
 * renders messages or posts (community chat, DMs, squad chat, forum, feed).
 *
 * Usage:
 *   const actions = useMessageActions();
 *   <div {...actions.bind({ id, body, canDelete, canModerate })}>…</div>
 *   <MessageActionSheet actions={actions} onReply={…} onReact={…} onDelete={…} />
 */

export type MessageActionTarget = {
  id: string;
  body: string;
  authorName?: string;
  /** Whether the current user may edit this message. */
  canEdit?: boolean;
  /** Own message, or current user is admin. */
  canDelete?: boolean;
  /** Admin-only extras (pin / mark). Omit where they don't exist. */
  canModerate?: boolean;
  isPinned?: boolean;
  isMarked?: boolean;
  markedLabel?: string | null;
};

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "🙏", "😮", "💯"];
export const MORE_REACTION_EMOJIS = ["😍", "👏", "😢", "🤔", "😡", "✅", "✨", "🚀"];

export type StoredMessageReaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
};
export type MessageReactionTable = "direct_message_reactions" | "study_group_message_reactions";

export function useStoredMessageReactions(
  table: MessageReactionTable,
  messageIds: string[],
  userId?: string | null,
) {
  const [reactions, setReactions] = useState<StoredMessageReaction[]>([]);
  const idsKey = messageIds.join(",");

  useEffect(() => {
    let active = true;
    const ids = idsKey ? idsKey.split(",") : [];
    if (!ids.length) {
      setReactions([]);
      return;
    }
    (supabase.from(table as any) as any)
      .select("id, message_id, user_id, emoji")
      .in("message_id", ids)
      .then(({ data, error }: any) => {
        if (active && !error) setReactions((data ?? []) as StoredMessageReaction[]);
      });
    return () => {
      active = false;
    };
  }, [table, idsKey]);

  const byMessage = useMemo(() => {
    const grouped: Record<string, StoredMessageReaction[]> = {};
    for (const reaction of reactions) (grouped[reaction.message_id] ??= []).push(reaction);
    return grouped;
  }, [reactions]);

  const toggle = useCallback(
    async (messageId: string, emoji: string) => {
      if (!userId) return;
      const existing = reactions.find(
        (reaction) =>
          reaction.message_id === messageId &&
          reaction.user_id === userId &&
          reaction.emoji === emoji,
      );
      if (existing) {
        setReactions((current) => current.filter((reaction) => reaction.id !== existing.id));
        const { error } = await (supabase.from(table as any) as any).delete().eq("id", existing.id);
        if (error) setReactions((current) => [...current, existing]);
        return;
      }
      const optimistic = { id: `tmp-${Date.now()}`, message_id: messageId, user_id: userId, emoji };
      setReactions((current) => [...current, optimistic]);
      const { data, error } = await (supabase.from(table as any) as any)
        .insert({ message_id: messageId, user_id: userId, emoji })
        .select("id, message_id, user_id, emoji")
        .single();
      if (error)
        setReactions((current) => current.filter((reaction) => reaction.id !== optimistic.id));
      else if (data)
        setReactions((current) =>
          current.map((reaction) => (reaction.id === optimistic.id ? data : reaction)),
        );
    },
    [reactions, table, userId],
  );

  return { byMessage, toggle };
}

export function MessageReactionChips({
  reactions,
  userId,
  onToggle,
}: {
  reactions: StoredMessageReaction[];
  userId?: string | null;
  onToggle: (emoji: string) => void;
}) {
  const grouped = new Map<string, StoredMessageReaction[]>();
  for (const reaction of reactions) {
    const list = grouped.get(reaction.emoji) ?? [];
    list.push(reaction);
    grouped.set(reaction.emoji, list);
  }
  if (!grouped.size) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {Array.from(grouped.entries()).map(([emoji, list]) => {
        const mine = !!userId && list.some((reaction) => reaction.user_id === userId);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(emoji)}
            aria-label={`${list.length} ${emoji} reaction${list.length === 1 ? "" : "s"}${mine ? ", remove yours" : ", add yours"}`}
            aria-pressed={mine}
            className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm transition hover:-translate-y-0.5 active:scale-95 ${mine ? "border-primary/50 bg-primary/10 text-primary ring-1 ring-primary/20" : "border-border/80 bg-card/90 hover:border-primary/40"}`}
          >
            <span className="text-base leading-none">{emoji}</span>
            <span>{list.length}</span>
          </button>
        );
      })}
    </div>
  );
}

export type MessageActionsController = ReturnType<typeof useMessageActions>;

export function useMessageActions() {
  const [target, setTarget] = useState<MessageActionTarget | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const open = useCallback((t: MessageActionTarget) => {
    haptic("medium");
    setTarget(t);
  }, []);

  const close = useCallback(() => {
    clear();
    setTarget(null);
  }, []);

  // Close on scroll anywhere.
  useEffect(() => {
    if (!target) return;
    const onScroll = () => setTarget(null);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [target]);

  const bind = useCallback(
    (t: MessageActionTarget) => ({
      onClick: (e: React.MouseEvent) => {
        // Let links / buttons inside the bubble keep working.
        if ((e.target as HTMLElement).closest("a,button,input,textarea")) return;
        open(t);
      },
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        open(t);
      },
      onTouchStart: () => {
        movedRef.current = false;
        clear();
        timerRef.current = setTimeout(() => open(t), 420);
      },
      onTouchMove: () => {
        movedRef.current = true;
        clear();
      },
      onTouchEnd: clear,
      onTouchCancel: clear,
    }),
    [open],
  );

  return { target, open, close, bind };
}

type SheetProps = {
  actions: MessageActionsController;
  onReply?: (t: MessageActionTarget) => void;
  onEdit?: (t: MessageActionTarget) => void;
  onReact?: (t: MessageActionTarget, emoji: string) => void;
  onDelete?: (t: MessageActionTarget) => void;
  onTogglePin?: (t: MessageActionTarget) => void;
  onToggleMark?: (t: MessageActionTarget) => void;
};

export function MessageActionSheet({
  actions,
  onReply,
  onEdit,
  onReact,
  onDelete,
  onTogglePin,
  onToggleMark,
}: SheetProps) {
  const t = actions.target;
  const [mounted, setMounted] = useState(false);
  const [showMoreReactions, setShowMoreReactions] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setShowMoreReactions(false), [t?.id]);
  if (!mounted || !t) return null;

  const run = (fn?: () => void) => {
    haptic("light");
    fn?.();
    actions.close();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(t.body ?? "");
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center">
      <button
        aria-label="Close menu"
        onClick={actions.close}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      />
      <div className="relative z-10 w-full max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-200 sm:slide-in-from-bottom-0">
        <div className="m-2 overflow-hidden rounded-2xl border border-card bg-card/85 shadow-xl backdrop-blur-2xl">
          <div className="flex items-start gap-2 border-b border-border/70 px-4 py-3">
            <p className="line-clamp-2 flex-1 text-xs text-muted-foreground">
              {t.authorName ? (
                <span className="font-semibold text-foreground">{t.authorName}: </span>
              ) : null}
              {t.body}
            </p>
            <button
              onClick={actions.close}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {onReact && (
            <div className="border-b border-border/70 px-3 py-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Quick reaction
                </span>
                <button
                  type="button"
                  onClick={() => setShowMoreReactions((v) => !v)}
                  className="rounded-full px-2 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary/10"
                >
                  {showMoreReactions ? "Less" : "More"}
                </button>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {[...REACTION_EMOJIS, ...(showMoreReactions ? MORE_REACTION_EMOJIS : [])].map(
                  (e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => run(() => onReact(t, e))}
                      className="flex h-10 items-center justify-center rounded-xl text-xl transition hover:bg-muted active:scale-90"
                      aria-label={`React ${e}`}
                    >
                      {e}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          <div className="p-1.5">
            {onReply && (
              <Row
                icon={<Reply className="h-4 w-4" />}
                label="Reply"
                onClick={() => run(() => onReply(t))}
              />
            )}
            {onEdit && (t.canEdit ?? t.canDelete) && (
              <Row
                icon={<Pencil className="h-4 w-4" />}
                label="Edit"
                onClick={() => run(() => onEdit(t))}
              />
            )}
            <Row icon={<Copy className="h-4 w-4" />} label="Copy" onClick={() => run(copy)} />
            {onReact && (
              <Row
                icon={<SmilePlus className="h-4 w-4" />}
                label="React"
                onClick={() => run(() => onReact(t, "👍"))}
              />
            )}
            {t.canModerate && onTogglePin && (
              <Row
                icon={t.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                label={t.isPinned ? "Unpin" : "Pin"}
                onClick={() => run(() => onTogglePin(t))}
              />
            )}
            {t.canModerate && onToggleMark && (
              <Row
                icon={
                  t.isMarked ? <Circle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />
                }
                label={t.isMarked ? "Unmark reply" : "Mark as reply"}
                onClick={() => run(() => onToggleMark(t))}
              />
            )}
            {t.canDelete && onDelete && (
              <Row
                icon={<Trash2 className="h-4 w-4" />}
                label="Delete"
                destructive
                onClick={() => run(() => onDelete(t))}
              />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Row({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition active:scale-[.98] hover:bg-muted ${
        destructive ? "text-destructive" : "text-foreground"
      }`}
    >
      <span className="opacity-80">{icon}</span>
      {label}
    </button>
  );
}

/** Shared "replying to" composer chip. */
export function ReplyBanner({
  authorName,
  body,
  onCancel,
}: {
  authorName?: string;
  body: string;
  onCancel: () => void;
}) {
  return (
    <div className="mx-1 mb-2 flex animate-fade-in items-start gap-2 rounded-xl border border-card border-l-4 border-l-primary bg-card/65 px-3 py-2.5 shadow-soft backdrop-blur-xl">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-primary">
          Replying to {authorName ?? "message"}
        </p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{body}</p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
        aria-label="Cancel reply"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Prepend a quoted reference to a new message/post body. */
export function withQuote(target: { body: string; authorName?: string } | null, body: string) {
  if (!target) return body;
  const quoted = (target.body ?? "")
    .split("\n")
    .slice(0, 4)
    .map((l) => `> ${l}`)
    .join("\n");
  const who = target.authorName ? `> ${target.authorName}:\n` : "";
  return `${who}${quoted}\n\n${body}`;
}
