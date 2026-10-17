import { Loader2, RefreshCw, PlayCircle } from "lucide-react";

import type { WatchSyncStatus } from "../types";

type PlayerOverlayProps = {
  syncStatus: WatchSyncStatus;
  isPlaying: boolean;
  isHost: boolean;
  hasVideo: boolean;
  error?: string | null;
  onRequestSync: () => void;
};

export function PlayerOverlay({
  syncStatus,
  isPlaying,
  isHost,
  hasVideo,
  error,
  onRequestSync,
}: PlayerOverlayProps) {
  const showLoading =
    syncStatus === "connecting" ||
    syncStatus === "reconnecting" ||
    syncStatus === "syncing";

  if (error) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/90 p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <RefreshCw className="h-6 w-6" />
          </div>

          <h3 className="text-sm font-semibold text-white">
            Video unavailable
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            {error}
          </p>

          <button
            type="button"
            onClick={onRequestSync}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
            Sync again
          </button>
        </div>
      </div>
    );
  }

  if (!hasVideo) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <PlayCircle className="mx-auto h-10 w-10 text-slate-600" />

          <p className="mt-3 text-sm font-medium text-slate-300">
            No video selected
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Add a video to the room queue to start watching.
          </p>
        </div>
      </div>
    );
  }

  if (showLoading) {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-950/35">
        <div className="flex items-center gap-2 rounded-full bg-slate-950/80 px-4 py-2 text-xs font-medium text-white backdrop-blur">
          <Loader2 className="h-4 w-4 animate-spin" />

          {syncStatus === "reconnecting"
            ? "Reconnecting…"
            : syncStatus === "syncing"
              ? "Synchronizing…"
              : "Connecting…"}
        </div>
      </div>
    );
  }

  /*
   * A participant may have a locally paused player while the room
   * is supposed to be playing. The user gesture below helps with
   * browsers that block autoplay.
   */
  if (!isPlaying && !isHost) {
    return (
      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center p-4 pointer-events-none">
        <button
          type="button"
          onClick={onRequestSync}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-slate-950/85 px-4 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-slate-900"
        >
          <PlayCircle className="h-4 w-4" />
          Tap to sync playback
        </button>
      </div>
    );
  }

  return null;
}