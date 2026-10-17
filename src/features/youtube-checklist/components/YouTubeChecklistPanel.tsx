// @ts-nocheck
import {
  CheckCircle2,
  ListVideo,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import type {
  YouTubeChecklist,
  YouTubeChecklistItem as YouTubeChecklistItemType,
} from "../types";

import {
  calculateChecklistProgress,
} from "../utils";

import { YouTubeChecklistItem } from "./YouTubeChecklistItem";

type YouTubeChecklistPanelProps = {
  checklist: YouTubeChecklist;
  items: YouTubeChecklistItemType[];

  selectedItemId: string | null;

  onSelectItem: (
    item: YouTubeChecklistItemType,
  ) => void;

  onToggleComplete: (
    item: YouTubeChecklistItemType,
    completed: boolean,
  ) => Promise<void>;
};

export function YouTubeChecklistPanel({
  checklist,
  items,
  selectedItemId,
  onSelectItem,
  onToggleComplete,
}: YouTubeChecklistPanelProps) {
  const [searchQuery, setSearchQuery] =
    useState("");

  const [showCompleted, setShowCompleted] =
    useState(true);

  const completedCount = items.filter(
    (item) => item.is_completed,
  ).length;

  const progress = calculateChecklistProgress(
    items.length,
    completedCount,
  );

  const filteredItems = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      if (
        !showCompleted &&
        item.is_completed
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return item.title
        .toLowerCase()
        .includes(query);
    });
  }, [
    items,
    searchQuery,
    showCompleted,
  ]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ListVideo className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold">
              {checklist.title}
            </h2>

            {checklist.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {checklist.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium">
              {completedCount} of {items.length} completed
            </span>

            <span className="font-semibold text-primary">
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="space-y-3 border-b border-border p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value,
              )
            }
            placeholder="Search videos..."
            className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="button"
          onClick={() =>
            setShowCompleted(
              (current) => !current,
            )
          }
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <span
            className={[
              "flex h-5 w-5 items-center justify-center rounded-md border transition",
              showCompleted
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40",
            ].join(" ")}
          >
            {showCompleted && (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
          </span>

          Show completed videos
        </button>
      </div>

      {/* Items */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {filteredItems.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ListVideo className="h-5 w-5 text-muted-foreground" />
            </div>

            <p className="text-sm font-medium">
              {searchQuery
                ? "No videos found"
                : "No videos to show"}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery
                ? "Try a different search."
                : "Add videos to this checklist to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <YouTubeChecklistItem
                key={item.id}
                item={item}
                isActive={
                  item.id === selectedItemId
                }
                onSelect={onSelectItem}
                onToggleComplete={
                  onToggleComplete
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}