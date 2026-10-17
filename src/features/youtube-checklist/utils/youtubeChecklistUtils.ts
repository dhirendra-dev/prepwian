// @ts-nocheck
// ============================================================
// PREPWIAN
// YouTube Checklist Utilities
// ============================================================

export type YouTubeSource =
  | {
      type: "video";
      videoId: string;
    }
  | {
      type: "playlist";
      playlistId: string;
    }
  | null;

const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function isValidVideoId(value: string): boolean {
  return YOUTUBE_VIDEO_ID_PATTERN.test(value);
}

function cleanValue(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/**
 * Extract a YouTube video ID from common YouTube URLs
 * or from a raw 11-character video ID.
 */
export function extractYouTubeVideoId(
  value: string | null | undefined,
): string | null {
  const input = cleanValue(value);

  if (!input) {
    return null;
  }

  if (isValidVideoId(input)) {
    return input;
  }

  try {
    const url = new URL(input);

    const hostname = url.hostname.toLowerCase();

    // youtube.com/watch?v=VIDEO_ID
    if (
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "m.youtube.com"
    ) {
      const videoId = url.searchParams.get("v");

      if (videoId && isValidVideoId(videoId)) {
        return videoId;
      }

      // youtube.com/embed/VIDEO_ID
      const embedMatch = url.pathname.match(
        /^\/embed\/([a-zA-Z0-9_-]{11})/,
      );

      if (embedMatch) {
        return embedMatch[1];
      }

      // youtube.com/shorts/VIDEO_ID
      const shortsMatch = url.pathname.match(
        /^\/shorts\/([a-zA-Z0-9_-]{11})/,
      );

      if (shortsMatch) {
        return shortsMatch[1];
      }
    }

    // youtu.be/VIDEO_ID
    if (hostname === "youtu.be") {
      const videoId = url.pathname
        .split("/")
        .filter(Boolean)[0];

      if (videoId && isValidVideoId(videoId)) {
        return videoId;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Extract a YouTube playlist ID from a playlist URL
 * or from a raw playlist ID.
 */
export function extractYouTubePlaylistId(
  value: string | null | undefined,
): string | null {
  const input = cleanValue(value);

  if (!input) {
    return null;
  }

  // Raw playlist IDs normally begin with PL, UU, OL, RD, etc.
  // Keep this intentionally permissive because YouTube uses
  // different playlist ID prefixes.
  if (
    /^[a-zA-Z0-9_-]{10,100}$/.test(input) &&
    !isValidVideoId(input)
  ) {
    return input;
  }

  try {
    const url = new URL(input);

    const hostname = url.hostname.toLowerCase();

    if (
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "youtu.be"
    ) {
      const playlistId = url.searchParams.get("list");

      if (playlistId) {
        return playlistId;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Detect whether the supplied URL is a YouTube playlist.
 */
export function isYouTubePlaylistUrl(
  value: string | null | undefined,
): boolean {
  return extractYouTubePlaylistId(value) !== null;
}

/**
 * Detect whether the supplied URL is a YouTube video.
 */
export function isYouTubeVideoUrl(
  value: string | null | undefined,
): boolean {
  return extractYouTubeVideoId(value) !== null;
}

/**
 * Convert a YouTube video ID into a watch URL.
 */
export function createYouTubeWatchUrl(
  videoId: string,
): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(
    videoId,
  )}`;
}

/**
 * Convert a YouTube video ID into an embed URL.
 */
export function createYouTubeEmbedUrl(
  videoId: string,
): string {
  return `https://www.youtube.com/embed/${encodeURIComponent(
    videoId,
  )}`;
}

/**
 * Generate the standard YouTube thumbnail URL.
 */
export function createYouTubeThumbnailUrl(
  videoId: string,
): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(
    videoId,
  )}/hqdefault.jpg`;
}

/**
 * Generate a playlist URL.
 */
export function createYouTubePlaylistUrl(
  playlistId: string,
): string {
  return `https://www.youtube.com/playlist?list=${encodeURIComponent(
    playlistId,
  )}`;
}

/**
 * Detect the source type of a pasted YouTube URL.
 *
 * If a URL contains both a video and playlist parameter,
 * it is treated as a playlist source when a playlist ID exists.
 */
export function detectYouTubeSource(
  value: string | null | undefined,
): YouTubeSource {
  const playlistId = extractYouTubePlaylistId(value);

  if (playlistId) {
    return {
      type: "playlist",
      playlistId,
    };
  }

  const videoId = extractYouTubeVideoId(value);

  if (videoId) {
    return {
      type: "video",
      videoId,
    };
  }

  return null;
}

/**
 * Format seconds into a readable duration.
 *
 * Examples:
 * 65 -> 1:05
 * 3665 -> 1:01:05
 */
export function formatYouTubeDuration(
  seconds: number | null | undefined,
): string {
  if (
    seconds === null ||
    seconds === undefined ||
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  );
  const remainingSeconds = totalSeconds % 60;

  const paddedSeconds = String(remainingSeconds).padStart(
    2,
    "0",
  );

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(
      2,
      "0",
    )}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}

/**
 * Calculate checklist completion percentage.
 */
export function calculateChecklistProgress(
  totalItems: number,
  completedItems: number,
): number {
  if (totalItems <= 0) {
    return 0;
  }

  const percentage =
    (completedItems / totalItems) * 100;

  return Math.min(
    100,
    Math.max(0, Math.round(percentage)),
  );
}

/**
 * Return only incomplete checklist items.
 */
export function getRemainingChecklistItems<
  T extends { is_completed: boolean },
>(items: T[]): T[] {
  return items.filter((item) => !item.is_completed);
}

/**
 * Return only completed checklist items.
 */
export function getCompletedChecklistItems<
  T extends { is_completed: boolean },
>(items: T[]): T[] {
  return items.filter((item) => item.is_completed);
}