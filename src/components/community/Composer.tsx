import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ImagePlus, Loader2, Send, Smile, X } from "lucide-react";
import { MAX_LEN, QUICK_EMOJIS } from "./chat-core";

export type MentionCandidate = { id: string; name: string };

/**
 * Safe-area aware composer with @mentions, emoji tray and photo attachment.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  onTyping,
  sending,
  disabled,
  placeholder = "Message the community…",
  mentions = [],
  attachment,
  onAttach,
  onClearAttachment,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onTyping?: () => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  mentions?: MentionCandidate[];
  attachment?: File | null;
  onAttach?: (file: File) => void;
  onClearAttachment?: () => void;
  compact?: boolean;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, compact ? 100 : 150) + "px";
  }, [value, compact]);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return mentions.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionQuery, mentions]);

  const handleChange = (next: string) => {
    onChange(next.slice(0, MAX_LEN));
    onTyping?.();
    const upto = next.slice(0, textareaRef.current?.selectionStart ?? next.length);
    const match = /(?:^|\s)@([\w. ]{0,20})$/.exec(upto);
    setMentionQuery(match ? match[1]! : null);
  };

  const applyMention = (name: string) => {
    const ta = textareaRef.current;
    const caret = ta?.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@([\w. ]{0,20})$/, `@${name} `);
    onChange((before + value.slice(caret)).slice(0, MAX_LEN));
    setMentionQuery(null);
    ta?.focus();
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (disabled || sending) return;
    if (!value.trim() && !attachment) return;
    onSubmit();
    setShowEmoji(false);
    setMentionQuery(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <form
      onSubmit={submit}
      className="relative border-t border-border bg-card/95 px-3 pt-2.5 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-950/95"
      style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
    >
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {suggestions.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => applyMention(m.name)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span className="text-primary">@</span>
              {m.name}
            </button>
          ))}
        </div>
      )}

      {showEmoji && (
        <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-border bg-muted/50 p-2 dark:border-slate-700/80 dark:bg-slate-800/80">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onChange((value + e).slice(0, MAX_LEN));
                textareaRef.current?.focus();
              }}
              className="rounded-lg px-2 py-1 text-lg hover:bg-background"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {attachment && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs dark:border-slate-700/80 dark:bg-slate-800/80">
          <ImagePlus className="h-3.5 w-3.5 text-primary" />
          <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
          <button type="button" onClick={onClearAttachment} aria-label="Remove photo">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-1.5">
        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          aria-label="Emoji"
          className="mb-1 rounded-full p-2 text-muted-foreground hover:bg-muted"
        >
          <Smile className="h-5 w-5" />
        </button>
        {onAttach && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Attach photo"
              className="mb-1 rounded-full p-2 text-muted-foreground hover:bg-muted"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAttach(f);
                e.target.value = "";
              }}
            />
          </>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder={placeholder}
          className="max-h-36 min-h-[42px] flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/60"
        />
        <button
          type="submit"
          disabled={disabled || sending || (!value.trim() && !attachment)}
          aria-label="Send"
          className="mb-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition active:scale-95 disabled:opacity-40"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
    </form>
  );
}
