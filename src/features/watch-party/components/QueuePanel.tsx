// ============================================================
// JEE PREP HUB — WATCH PARTY
// Queue panel
// File: src/features/watch-party/components/QueuePanel.tsx
// ============================================================

import { useState } from "react";

import {
  addWatchQueueItem,
  removeWatchQueueItem,
  reorderWatchQueueItem,
} from "../api/watchPartyApi";

import type {
  WatchRoomQueueItem,
} from "../types";

type QueuePanelProps = {
  roomId: string;
  queue: WatchRoomQueueItem[];

  currentQueueItemId?: string | null;

  isHost?: boolean;
  canManageQueue?: boolean;

  onQueueChanged?: () => void;

  onSelectQueueItem?: (
    item: WatchRoomQueueItem,
  ) => void;
};

export function QueuePanel({
  roomId,
  queue,
  currentQueueItemId,
  isHost = false,
  canManageQueue = false,
  onQueueChanged,
  onSelectQueueItem,
}: QueuePanelProps) {
  const [videoUrl, setVideoUrl] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [adding, setAdding] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  function extractYoutubeVideoId(
    value: string,
  ): string | null {
    const input = value.trim();

    if (!input) {
      return null;
    }

    if (
      /^[a-zA-Z0-9_-]{11}$/.test(input)
    ) {
      return input;
    }

    try {
      const url = new URL(input);

      if (
        url.hostname ===
          "youtu.be" ||
        url.hostname.endsWith(
          ".youtu.be",
        )
      ) {
        return (
          url.pathname
            .replace("/", "")
            .slice(0, 11) || null
        );
      }

      if (
        url.hostname ===
          "youtube.com" ||
        url.hostname.endsWith(
          ".youtube.com",
        )
      ) {
        const queryId =
          url.searchParams.get("v");

        if (queryId) {
          return queryId.slice(
            0,
            11,
          );
        }

        const pathParts =
          url.pathname
            .split("/")
            .filter(Boolean);

        const index =
          pathParts.findIndex(
            (part) =>
              part === "shorts" ||
              part === "embed" ||
              part === "live",
          );

        if (
          index !== -1 &&
          pathParts[index + 1]
        ) {
          return pathParts[
            index + 1
          ].slice(0, 11);
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  async function handleAdd() {
    if (!canManageQueue) {
      return;
    }

    const videoId =
      extractYoutubeVideoId(
        videoUrl,
      );

    if (!videoId) {
      setError(
        "Enter a valid YouTube video URL or video ID.",
      );
      return;
    }

    if (!title.trim()) {
      setError(
        "Enter a title for this video.",
      );
      return;
    }

    setAdding(true);
    setError(null);

    try {
      await addWatchQueueItem({
        roomId,
        videoId,
        title: title.trim(),
        position: queue.length,
      });

      setVideoUrl("");
      setTitle("");

      onQueueChanged?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add video.",
      );
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(
    item: WatchRoomQueueItem,
  ) {
    if (!canManageQueue) {
      return;
    }

    try {
      await removeWatchQueueItem(
        roomId,
        item.id,
      );

      onQueueChanged?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove video.",
      );
    }
  }

  async function moveItem(
    item: WatchRoomQueueItem,
    direction: "up" | "down",
  ) {
    if (!canManageQueue) {
      return;
    }

    const currentIndex =
      queue.findIndex(
        (entry) =>
          entry.id === item.id,
      );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= queue.length
    ) {
      return;
    }

    const targetItem =
      queue[targetIndex];

    try {
      await reorderWatchQueueItem({
        roomId,
        queueItemId: item.id,
        position:
          targetItem.position,
      });

      await reorderWatchQueueItem({
        roomId,
        queueItemId:
          targetItem.id,
        position:
          item.position,
      });

      onQueueChanged?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reorder queue.",
      );
    }
  }

  return (
    <section
      className="space-y-4"
      aria-label="Watch queue"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Watch Queue
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {queue.length}{" "}
            {queue.length === 1
              ? "video"
              : "videos"}
          </p>
        </div>

        {isHost && (
          <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
            Host
          </span>
        )}
      </header>

      {canManageQueue && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <input
            value={videoUrl}
            onChange={(event) =>
              setVideoUrl(
                event.target.value,
              )
            }
            placeholder="YouTube URL or video ID"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />

          <input
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value,
              )
            }
            placeholder="Video title"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />

          <button
            type="button"
            onClick={() =>
              void handleAdd()
            }
            disabled={adding}
            className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding
              ? "Adding..."
              : "Add to queue"}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {queue.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Queue is empty
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Add a YouTube video to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map(
            (item, index) => {
              const isCurrent =
                item.id ===
                currentQueueItemId;

              return (
                <div
                  key={item.id}
                  className={[
                    "group flex gap-2 rounded-xl border p-2 transition",
                    isCurrent
                      ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onSelectQueueItem?.(
                        item,
                      )
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex gap-3">
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                        {item.thumbnail_url ? (
                          <img
                            src={
                              item.thumbnail_url
                            }
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] font-medium text-slate-500">
                            YouTube
                          </div>
                        )}

                        <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                          {index + 1}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                          {item.title}
                        </p>

                        {isCurrent && (
                          <span className="mt-1 inline-block text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">
                            Playing now
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {canManageQueue && (
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          void moveItem(
                            item,
                            "up",
                          )
                        }
                        disabled={
                          index === 0
                        }
                        className="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800"
                        aria-label="Move video up"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void moveItem(
                            item,
                            "down",
                          )
                        }
                        disabled={
                          index ===
                          queue.length - 1
                        }
                        className="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800"
                        aria-label="Move video down"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleRemove(
                            item,
                          )
                        }
                        className="rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        aria-label={`Remove ${item.title}`}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}
