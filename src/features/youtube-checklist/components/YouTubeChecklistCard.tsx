// @ts-nocheck
import type {
  YouTubeChecklistCardProps,
} from "../types";

export function YouTubeChecklistCard({
  checklist,
  onClick,
}: YouTubeChecklistCardProps) {
  const percentage =
    checklist.totalItems > 0
      ? Math.round(
          (checklist.completedItems /
            checklist.totalItems) *
            100,
        )
      : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:bg-muted/40 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
          ▶️
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">
            {checklist.title}
          </h3>

          {checklist.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {checklist.description}
            </p>
          )}

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Progress
              </span>

              <span className="font-medium">
                {percentage}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {checklist.completedItems}/
              {checklist.totalItems} completed
            </span>

            <span>•</span>

            <span className="capitalize">
              {checklist.sourceType}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}