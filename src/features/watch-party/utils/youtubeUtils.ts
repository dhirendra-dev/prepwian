// ============================================================
// JEE PREP HUB — WATCH PARTY
// YouTube URL utilities
// File: src/features/watch-party/utils/youtubeUtils.ts
// ============================================================

const YOUTUBE_VIDEO_ID_PATTERN =
  /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts a YouTube video ID from:
 *
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - A raw 11-character YouTube video ID
 *
 * Returns null for unsupported or invalid input.
 */
export function normalizeYoutubeVideoId(
  input: string | null | undefined,
): string | null {
  if (!input) {
    return null;
  }

  const value = input.trim();

  if (!value) {
    return null;
  }

  // Raw YouTube video ID.
  if (
    YOUTUBE_VIDEO_ID_PATTERN.test(value)
  ) {
    return value;
  }

  let url: URL;

  try {
    url = new URL(
      /^https?:\/\//i.test(value)
        ? value
        : `https://${value}`,
    );
  } catch {
    return null;
  }

  const hostname =
    url.hostname.toLowerCase();

  const isYoutubeHost =
    hostname === "youtube.com" ||
    hostname === "www.youtube.com" ||
    hostname === "m.youtube.com" ||
    hostname === "music.youtube.com";

  const isShortHost =
    hostname === "youtu.be" ||
    hostname === "www.youtu.be";

  if (isShortHost) {
    const id =
      url.pathname
        .split("/")
        .filter(Boolean)[0] ?? "";

    return YOUTUBE_VIDEO_ID_PATTERN.test(
      id,
    )
      ? id
      : null;
  }

  if (!isYoutubeHost) {
    return null;
  }

  // Standard watch URL.
  if (url.pathname === "/watch") {
    const id =
      url.searchParams.get("v");

    return id &&
      YOUTUBE_VIDEO_ID_PATTERN.test(id)
      ? id
      : null;
  }

  // Embedded, Shorts and legacy /v/ URLs.
  const parts =
    url.pathname
      .split("/")
      .filter(Boolean);

  const supportedPrefixes = new Set([
    "embed",
    "shorts",
    "v",
  ]);

  if (
    parts.length >= 2 &&
    supportedPrefixes.has(parts[0])
  ) {
    const id = parts[1];

    return YOUTUBE_VIDEO_ID_PATTERN.test(
      id,
    )
      ? id
      : null;
  }

  return null;
}

/**
 * Creates the canonical YouTube watch URL
 * for a valid video ID.
 */
export function createYoutubeWatchUrl(
  videoId: string,
): string | null {
  const normalized =
    normalizeYoutubeVideoId(videoId);

  if (!normalized) {
    return null;
  }

  return `https://www.youtube.com/watch?v=${normalized}`;
}

/**
 * Creates a YouTube thumbnail URL for a
 * normalized video ID.
 */
export function createYoutubeThumbnailUrl(
  videoId: string,
): string | null {
  const normalized =
    normalizeYoutubeVideoId(videoId);

  if (!normalized) {
    return null;
  }

  return `https://i.ytimg.com/vi/${normalized}/hqdefault.jpg`;
}