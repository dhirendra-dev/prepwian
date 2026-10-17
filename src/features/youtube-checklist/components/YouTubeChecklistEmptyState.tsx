// @ts-nocheck
type YouTubeChecklistEmptyStateProps = {
  onAdd: () => void;
};

export function YouTubeChecklistEmptyState({
  onAdd,
}: YouTubeChecklistEmptyStateProps) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
          ▶️
        </div>

        <h2 className="mt-5 text-xl font-bold">
          Turn YouTube into a Checklist
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Add a YouTube video or playlist, watch it in
          a floating player, and mark each video
          complete as you finish it.
        </p>

        <button
          type="button"
          onClick={onAdd}
          className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          + Add YouTube Video or Playlist
        </button>
      </div>
    </div>
  );
}