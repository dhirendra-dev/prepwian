// ============================================================
// PREPWIAN — WATCH PARTY
// Live room chat
// File: src/features/watch-party/components/ChatPanel.tsx
// ============================================================

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createWatchRoomMessage,
  deleteWatchRoomMessage,
} from "../api/watchPartyApi";

import {
  MAX_CHAT_MESSAGE_LENGTH,
} from "../constants";

import type {
  WatchChatMessage,
} from "../types";

type ChatPanelProps = {
  roomId: string;
  messages: WatchChatMessage[];

  currentUserId?: string | null;

  canModerate?: boolean;

  onMessageCreated?: (
    message: WatchChatMessage,
  ) => void;

  onMessageDeleted?: (
    messageId: string,
  ) => void;

  onTimestampClick?: (
    seconds: number,
  ) => void;
};

function formatTime(
  seconds: number,
) {
  const safe = Math.max(
    0,
    Math.floor(seconds),
  );

  const minutes = Math.floor(
    safe / 60,
  );

  const remainingSeconds =
    safe % 60;

  return `${minutes}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function getAuthorName(
  message: WatchChatMessage,
) {
  return (
    message.author?.username ||
    message.author?.fullName ||
    "Student"
  );
}

function getInitials(
  message: WatchChatMessage,
) {
  const name =
    getAuthorName(message).trim();

  if (!name) {
    return "?";
  }

  const parts =
    name.split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

export function ChatPanel({
  roomId,
  messages,
  currentUserId,
  canModerate = false,
  onMessageCreated,
  onMessageDeleted,
  onTimestampClick,
}: ChatPanelProps) {
  const [draft, setDraft] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const bottomRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const previousMessageCount =
    useRef(messages.length);

  const visibleMessages =
    useMemo(
      () =>
        messages.filter(
          (message) =>
            !message.deleted_at,
        ),
      [messages],
    );

  useEffect(() => {
    if (
      messages.length >
      previousMessageCount.current
    ) {
      bottomRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "nearest",
        },
      );
    }

    previousMessageCount.current =
      messages.length;
  }, [messages.length]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const body =
      draft.trim();

    if (!body || sending) {
      return;
    }

    if (
      body.length >
      MAX_CHAT_MESSAGE_LENGTH
    ) {
      setError(
        `Message cannot exceed ${MAX_CHAT_MESSAGE_LENGTH} characters.`,
      );
      return;
    }

    setSending(true);
    setError(null);

    try {
      const message =
        await createWatchRoomMessage(
          {
            roomId,
            body,
          },
        );

      setDraft("");

      onMessageCreated?.({
        ...message,
        author: undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send message.",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(
    messageId: string,
  ) {
    try {
      await deleteWatchRoomMessage(
        messageId,
      );

      onMessageDeleted?.(
        messageId,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete message.",
      );
    }
  }

  return (
    <section
      className="flex h-full min-h-[420px] flex-col"
      aria-label="Room chat"
    >
      <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Live Chat
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Talk with everyone in the room
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {visibleMessages.length}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {visibleMessages.length === 0 ? (
          <div className="flex min-h-[260px] items-center justify-center px-6 text-center">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No messages yet
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Start the conversation.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleMessages.map(
              (message) => {
                const isOwn =
                  message.user_id ===
                  currentUserId;

                const authorName =
                  getAuthorName(
                    message,
                  );

                return (
                  <article
                    key={message.id}
                    className="group flex gap-2.5"
                  >
                    <div className="shrink-0">
                      {message.author
                        ?.avatarUrl ? (
                        <img
                          src={
                            message.author
                              .avatarUrl
                          }
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          {getInitials(
                            message,
                          )}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {authorName}
                        </span>

                        <time
                          className="shrink-0 text-[10px] text-slate-400"
                          dateTime={
                            message.created_at
                          }
                        >
                          {new Date(
                            message.created_at,
                          ).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </time>
                      </div>

                      <div className="mt-1 flex items-start gap-2">
                        <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-700 dark:text-slate-300">
                          {message.body}
                        </p>

                        {canModerate && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(
                                message.id,
                              )
                            }
                            className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                            aria-label={`Delete message from ${authorName}`}
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      {message.timestamp_seconds !==
                        null &&
                        message.timestamp_seconds !==
                          undefined && (
                          <button
                            type="button"
                            onClick={() =>
                              onTimestampClick?.(
                                message.timestamp_seconds!,
                              )
                            }
                            className="mt-1 inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
                          >
                            {formatTime(
                              message.timestamp_seconds,
                            )}
                          </button>
                        )}
                    </div>
                  </article>
                );
              },
            )}

            <div
              ref={bottomRef}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 p-3 dark:border-slate-700"
      >
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="watch-party-message"
              className="sr-only"
            >
              Message
            </label>

            <textarea
              id="watch-party-message"
              value={draft}
              onChange={(event) =>
                setDraft(
                  event.target.value.slice(
                    0,
                    MAX_CHAT_MESSAGE_LENGTH,
                  ),
                )
              }
              placeholder="Send a message..."
              rows={2}
              maxLength={
                MAX_CHAT_MESSAGE_LENGTH
              }
              disabled={sending}
              className="block w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
            />

            <div className="mt-1 text-right text-[10px] text-slate-400">
              {draft.length}/
              {MAX_CHAT_MESSAGE_LENGTH}
            </div>
          </div>

          <button
            type="submit"
            disabled={
              sending ||
              !draft.trim()
            }
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending
              ? "Sending..."
              : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
