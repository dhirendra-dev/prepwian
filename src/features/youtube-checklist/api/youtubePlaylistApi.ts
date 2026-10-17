// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

import {
  addYouTubeChecklistItems,
} from "./youtubeChecklistApi";

import type {
  YouTubeChecklistItem,
  YouTubePlaylistInput,
} from "../types";

type YouTubePlaylistVideo = {
  videoId: string;
  title: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
};

type PlaylistImportResponse = {
  playlistId: string;
  videos?: YouTubePlaylistVideo[];
};

export type ImportYouTubePlaylistResult = {
  playlistId: string;
  videos: YouTubePlaylistVideo[];
  items: YouTubeChecklistItem[];
};

async function fetchPlaylistFromBackend(
  playlistId: string,
): Promise<PlaylistImportResponse> {
  const { data, error } =
    await supabase.functions.invoke(
      "youtube-playlist-import",
      {
        body: {
          playlistId,
        },
      },
    );

  if (error) {
    // Surface the server's readable message instead of the generic
    // "Edge Function returned a non-2xx status code".
    let message = error.message || "Playlist import failed.";
    try {
      const ctx = (error as { context?: Response }).context;
      const payload = ctx && typeof ctx.json === "function" ? await ctx.json() : null;
      if (payload?.error) message = String(payload.error);
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  if (!data) {
    throw new Error(
      "The playlist importer returned no data.",
    );
  }

  const response =
    data as PlaylistImportResponse;

  if (!response.playlistId) {
    throw new Error(
      "Invalid playlist importer response.",
    );
  }

  return response;
}

export async function importYouTubePlaylist(
  input: YouTubePlaylistInput & {
    checklistId: string;
  },
): Promise<ImportYouTubePlaylistResult> {
  const response =
    await fetchPlaylistFromBackend(
      input.playlistId,
    );

  const videos =
    response.videos ?? input.videos ?? [];

  if (videos.length === 0) {
    throw new Error(
      "No videos were found in this playlist.",
    );
  }

  const items =
    await addYouTubeChecklistItems(
      videos.map((video, index) => ({
        checklistId: input.checklistId,

        youtubeVideoId:
          video.videoId,

        title: video.title,

        thumbnailUrl:
          video.thumbnailUrl ?? null,

        durationSeconds:
          video.durationSeconds ?? null,

        position: index,
      })),
    );

  return {
    playlistId: input.playlistId,
    videos,
    items,
  };
}