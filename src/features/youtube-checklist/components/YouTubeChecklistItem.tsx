// @ts-nocheck
import { Check, Clock3, Play } from "lucide-react";

import type { YouTubeChecklistItem as YouTubeChecklistItemType } from "../types";
import { formatYouTubeDuration } from "../utils";

type YouTubeChecklistItemProps = {
  item: YouTubeChecklistItemType;
  isActive?: boolean;

  onSelect: (
    item: YouTubeChecklistItemType,
  ) => void;

  onToggleComplete: (
    item: YouTubeChecklistItemType,
    completed: boolean,
  ) => Promise<void>;
};

export function YouTubeChecklistItem({
  item,
  isActive = false,
  onSelect,
  onToggleComplete,
}: YouTubeChecklistItemProps) {
  const handleToggle = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    await onToggleComplete(
      item,
      !item.is_completed,
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onSelect(item);
        }
      }}
      className={[
        "group flex cursor-pointer gap-3 rounded-xl border p-3 transition",
        isActive
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:bg-muted/50",
        item.is_completed
          ? "opacity-75"
          : "",
      ].join(" ")}
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt=""
            className={[
              "h-full w-full object-cover transition",
              item.is_completed
                ? "opacity-60"
                : "",
            ].join(" ")}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        {!item.is_completed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 opacity-0 shadow transition group-hover:opacity-100">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </div>
          </div>
        )}

        {item.duration_seconds !== null && (
          <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {formatYouTubeDuration(
              item.duration_seconds,
            )}
          </span>
        )}
      </div>

      {/* Information */}
      <div className="min-w-0 flex-1">
        <p
          className={[
            "line-clamp-2 text-sm font-medium leading-5",
            item.is_completed
              ? "text-muted-foreground line-through"
              : "",
          ].join(" ")}
        >
          {item.title}
        </p>

        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />

          <span>
            {item.duration_seconds !== null
              ? formatYouTubeDuration(
                  item.duration_seconds,
                )
              : "Video"}
          </span>

          {item.is_completed && (
            <>
              <span>•</span>
              <span className="text-primary">
                Completed
              </span>
            </>
          )}
        </div>
      </div>

      {/* Completion checkbox */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={
          item.is_completed
            ? "Mark video incomplete"
            : "Mark video complete"
        }
        title={
          item.is_completed
            ? "Mark incomplete"
            : "Mark complete"
        }
        className={[
          "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition",
          item.is_completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 text-transparent hover:border-primary hover:text-primary",
        ].join(" ")}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}