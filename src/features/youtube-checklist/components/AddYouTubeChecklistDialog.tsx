import { useEffect, useState } from "react";

import {
  addYouTubeChecklistItem,
  createYouTubeChecklist,
  deleteYouTubeChecklist,
} from "../api/youtubeChecklistApi";
import { importYouTubePlaylist } from "../api/youtubePlaylistApi";
import {
  detectYouTubeSource,
  extractYouTubePlaylistId,
  extractYouTubeVideoId,
} from "../utils/youtubeChecklistUtils";

import type { CreateYouTubeChecklistInput } from "../types";

type AddYouTubeChecklistDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (checklistId: string) => void;
  initialUrl?: string;
};

export function AddYouTubeChecklistDialog({
  open,
  onClose,
  onCreated,
  initialUrl = "",
}: AddYouTubeChecklistDialogProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setError(null);
    }
  }, [open, initialUrl]);

  if (!open) {
    return null;
  }

  const resetForm = () => {
    setUrl("");
    setTitle("");
    setDescription("");
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Paste a YouTube video or playlist URL.");
      return;
    }

    const source = detectYouTubeSource(trimmedUrl);

    if (!source) {
      setError("Please enter a valid YouTube video or playlist URL.");
      return;
    }

    setIsSubmitting(true);

    let createdChecklistId: string | null = null;

    try {
      const checklistInput: CreateYouTubeChecklistInput = {
        title: title.trim() || (source.type === "playlist" ? "YouTube Playlist" : "YouTube Video"),
        description: description.trim() || null,
        sourceType: source.type,
        sourceUrl: trimmedUrl,
        youtubePlaylistId: source.type === "playlist" ? extractYouTubePlaylistId(trimmedUrl) : null,
      };

      const checklist = await createYouTubeChecklist(checklistInput);

      createdChecklistId = checklist.id;

      if (source.type === "video") {
        const videoId = extractYouTubeVideoId(trimmedUrl);

        if (!videoId) {
          throw new Error("Could not extract the YouTube video ID.");
        }

        await addYouTubeChecklistItem({
          checklistId: checklist.id,
          youtubeVideoId: videoId,
          title: title.trim() || "YouTube Video",
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          durationSeconds: null,
          position: 0,
        });
      } else {
        const playlistId = extractYouTubePlaylistId(trimmedUrl);

        if (!playlistId) {
          throw new Error("Could not extract the YouTube playlist ID.");
        }

        await importYouTubePlaylist({
          checklistId: checklist.id,
          playlistId,
          title: checklist.title,
          videos: [],
        });
      }

      resetForm();
      onCreated?.(checklist.id);
      onClose();
    } catch (submitError) {
      console.error("Failed to create YouTube checklist:", submitError);

      if (createdChecklistId) {
        try {
          await deleteYouTubeChecklist(createdChecklistId);
        } catch (cleanupError) {
          console.error("Failed to clean up checklist after import failure:", cleanupError);
        }
      }

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while creating the checklist.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="youtube-checklist-dialog-title"
    >
      <div className="my-3 max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-4 text-foreground shadow-2xl sm:my-0 sm:max-h-[calc(100dvh-3rem)] sm:p-6">
        <div className="mb-5">
          <h2 id="youtube-checklist-dialog-title" className="text-xl font-semibold">
            Create YouTube Checklist
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Paste a YouTube video or playlist and turn it into a study checklist.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="youtube-checklist-url" className="mb-1.5 block text-sm font-medium">
                YouTube URL
              </label>

              <input
                id="youtube-checklist-url"
                type="url"
                required
                autoFocus
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.youtube.com/playlist?list=..."
                disabled={isSubmitting}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="youtube-checklist-title" className="mb-1.5 block text-sm font-medium">
                Title
              </label>

              <input
                id="youtube-checklist-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Physics — Work, Power & Energy"
                disabled={isSubmitting}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="youtube-checklist-description"
                className="mb-1.5 block text-sm font-medium"
              >
                Description
              </label>

              <textarea
                id="youtube-checklist-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional description"
                rows={3}
                disabled={isSubmitting}
                className="w-full resize-none rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
              <strong>Playlist:</strong> videos will be imported automatically from YouTube.
              <br />
              <strong>Video:</strong> the individual video will be added as one checklist item.
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="min-h-11 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-11 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0"
            >
              {isSubmitting ? "Importing..." : "Create Checklist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
