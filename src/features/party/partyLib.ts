// src/features/party/partyLib.ts
// Futuristic Watch Party source engine.
// UI-agnostic: use Lucide/custom icons in the UI instead of emojis.

export type SourceType = "youtube" | "mp4" | "twitch" | "web";

export type ParsedSource = {
  type: SourceType;
  url: string;
  videoId: string | null;
  thumbnail: string | null;
  host: string;
  label: string;
};

export type SourceCapabilities = {
  canEmbed: boolean;
  canSeek: boolean;
  canSync: boolean;
  canChangeRate: boolean;
};

export type SourceInfo = ParsedSource & {
  capabilities: SourceCapabilities;
};

export const CATEGORIES = [
  { id: "youtube", label: "YouTube", icon: "play", emoji: "▶️" },
  { id: "movie", label: "Movie night", icon: "film", emoji: "🎬" },
  { id: "series", label: "Series & anime", icon: "tv", emoji: "📺" },
  { id: "cricket", label: "Cricket", icon: "cricket", emoji: "🏏" },
  { id: "football", label: "Football", icon: "football", emoji: "⚽" },
  { id: "sports", label: "Other sports", icon: "trophy", emoji: "🏆" },
  { id: "gaming", label: "Gaming", icon: "gamepad", emoji: "🎮" },
  { id: "music", label: "Music & vibes", icon: "music", emoji: "🎵" },
  { id: "study", label: "Study room", icon: "book", emoji: "📚" },
  { id: "podcast", label: "Podcasts", icon: "mic", emoji: "🎙️" },
  { id: "comedy", label: "Comedy", icon: "sparkles", emoji: "✨" },
  { id: "other", label: "Other", icon: "layers", emoji: "◈" },
] as const;

export function categoryOf(id: string | null | undefined) {
  return (
    CATEGORIES.find((category) => category.id === id) ??
    CATEGORIES[CATEGORIES.length - 1]
  );
}

/* -------------------------------------------------------------------------- */
/* URL utilities                                                              */
/* -------------------------------------------------------------------------- */

const DIRECT_VIDEO_EXTENSIONS =
  /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i;

function normalizeUrl(raw: string): URL | null {
  let value = String(raw ?? "").trim();

  if (!value) {
    return null;
  }

  // Allow users to enter:
  // youtube.com/watch?v=...
  // twitch.tv/channel
  // example.com/video.mp4
  if (!/^[a-z][a-z\d+\-.]*:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    // Always normalize HTTP sources to HTTPS.
    if (url.protocol === "http:") {
      url.protocol = "https:";
    }

    return url;
  } catch {
    return null;
  }
}

function cleanHost(hostname: string): string {
  return hostname
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/^m\./, "");
}

/* -------------------------------------------------------------------------- */
/* YouTube                                                                    */
/* -------------------------------------------------------------------------- */

function getYouTubeId(url: URL): string | null {
  const host = cleanHost(url.hostname);

  // https://youtu.be/VIDEO_ID
  if (host === "youtu.be") {
    return (
      url.pathname
        .split("/")
        .filter(Boolean)[0] ?? null
    );
  }

  if (
    host === "youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    // https://youtube.com/watch?v=VIDEO_ID
    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }

    // Supported:
    // /embed/VIDEO_ID
    // /shorts/VIDEO_ID
    // /live/VIDEO_ID
    // /v/VIDEO_ID
    const match = url.pathname.match(
      /^\/(?:embed|shorts|live|v)\/([^/?#]+)/
    );

    return match?.[1] ?? null;
  }

  return null;
}

function isValidYouTubeId(
  id: string | null
): id is string {
  return !!id && /^[A-Za-z0-9_-]{11}$/.test(id);
}

export function youtubeThumbnail(
  videoId: string,
  quality:
    | "default"
    | "hq"
    | "mq"
    | "maxres" = "hq"
): string {
  const suffix =
    quality === "maxres"
      ? "maxresdefault"
      : quality === "mq"
        ? "mqdefault"
        : quality === "default"
          ? "default"
          : "hqdefault";

  return `https://i.ytimg.com/vi/${encodeURIComponent(
    videoId
  )}/${suffix}.jpg`;
}

/* -------------------------------------------------------------------------- */
/* Source capabilities                                                        */
/* -------------------------------------------------------------------------- */

function capabilities(
  type: SourceType
): SourceCapabilities {
  switch (type) {
    case "youtube":
    case "mp4":
      return {
        canEmbed: true,
        canSeek: true,
        canSync: true,
        canChangeRate: true,
      };

    case "twitch":
      return {
        canEmbed: true,
        canSeek: false,
        canSync: false,
        canChangeRate: false,
      };

    default:
      return {
        canEmbed: false,
        canSeek: false,
        canSync: false,
        canChangeRate: false,
      };
  }
}

/* -------------------------------------------------------------------------- */
/* Source helpers                                                             */
/* -------------------------------------------------------------------------- */

export function sourceLabel(
  type: SourceType
): string {
  return SOURCE_LABEL[type];
}

export function isYouTubeSource(
  source: ParsedSource | null | undefined
): boolean {
  return source?.type === "youtube";
}

export function isTwitchSource(
  source: ParsedSource | null | undefined
): boolean {
  return source?.type === "twitch";
}

export function isDirectVideoSource(
  source: ParsedSource | null | undefined
): boolean {
  return source?.type === "mp4";
}

export function isSupportedSourceType(
  value: string
): value is SourceType {
  return (
    value === "youtube" ||
    value === "mp4" ||
    value === "twitch" ||
    value === "web"
  );
}

export function sourceHost(
  raw: string
): string | null {
  const url = normalizeUrl(raw);

  return url ? cleanHost(url.hostname) : null;
}

/* -------------------------------------------------------------------------- */
/* Source parser                                                              */
/* -------------------------------------------------------------------------- */

export function parseSource(
  raw: string
): ParsedSource | null {
  const url = normalizeUrl(raw);

  if (!url) {
    return null;
  }

  const host = cleanHost(url.hostname);

  /* ------------------------------ YouTube ------------------------------ */

  const youtubeId = getYouTubeId(url);

  if (isValidYouTubeId(youtubeId)) {
    return {
      type: "youtube",
      url: url.toString(),
      videoId: youtubeId,
      thumbnail: youtubeThumbnail(
        youtubeId,
        "hq"
      ),
      host,
      label: SOURCE_LABEL.youtube,
    };
  }

  /* ------------------------------- Twitch ------------------------------- */

  if (
    host === "twitch.tv" ||
    host === "player.twitch.tv"
  ) {
    return {
      type: "twitch",
      url: url.toString(),
      videoId: null,
      thumbnail: null,
      host,
      label: SOURCE_LABEL.twitch,
    };
  }

  /* ---------------------------- Direct video ---------------------------- */

  if (
    DIRECT_VIDEO_EXTENSIONS.test(
      url.pathname + url.search
    )
  ) {
    return {
      type: "mp4",
      url: url.toString(),
      videoId: null,
      thumbnail: null,
      host,
      label: SOURCE_LABEL.mp4,
    };
  }

  /* ------------------------------ Website ------------------------------- */

  return {
    type: "web",
    url: url.toString(),
    videoId: null,
    thumbnail: null,
    host,
    label: SOURCE_LABEL.web,
  };
}

/* -------------------------------------------------------------------------- */
/* Rich source parser                                                        */
/* -------------------------------------------------------------------------- */

export function parseSourceInfo(
  raw: string
): SourceInfo | null {
  const source = parseSource(raw);

  if (!source) {
    return null;
  }

  return {
    ...source,
    capabilities: capabilities(source.type),
  };
}

/* -------------------------------------------------------------------------- */
/* Twitch                                                                     */
/* -------------------------------------------------------------------------- */

export function twitchEmbedUrl(
  url: string,
  parentHost: string
): string | null {
  const source = normalizeUrl(url);

  if (!source) {
    return null;
  }

  const host = cleanHost(source.hostname);

  if (host !== "twitch.tv") {
    return null;
  }

  const parts = source.pathname
    .split("/")
    .filter(Boolean);

  if (!parts.length) {
    return null;
  }

  const parent = parentHost
    .trim()
    .replace(/^https?:\/\//i, "")
    .split("/")[0];

  if (!parent) {
    return null;
  }

  const base = "https://player.twitch.tv/";
  const params = new URLSearchParams();

  /* ------------------------------ VOD ---------------------------------- */

  if (
    parts[0] === "videos" &&
    parts[1]
  ) {
    const videoId = parts[1].replace(
      /^v/i,
      ""
    );

    if (!/^\d+$/.test(videoId)) {
      return null;
    }

    params.set(
      "video",
      `v${videoId}`
    );
  }

  /* ---------------------------- Channel -------------------------------- */

  else {
    const channel = parts[0].replace(
      /[^a-zA-Z0-9_]/g,
      ""
    );

    if (!channel) {
      return null;
    }

    params.set(
      "channel",
      channel
    );
  }

  params.set(
    "parent",
    parent
  );

  params.set(
    "autoplay",
    "false"
  );

  return `${base}?${params.toString()}`;
}

/* -------------------------------------------------------------------------- */
/* Time formatting                                                            */
/* -------------------------------------------------------------------------- */

export function fmtTime(
  total: number
): string {
  if (
    !Number.isFinite(total) ||
    total < 0
  ) {
    total = 0;
  }

  const seconds = Math.floor(
    total % 60
  );

  const minutes = Math.floor(
    (total / 60) % 60
  );

  const hours = Math.floor(
    total / 3600
  );

  const ss = String(seconds).padStart(
    2,
    "0"
  );

  if (hours > 0) {
    return `${hours}:${String(
      minutes
    ).padStart(2, "0")}:${ss}`;
  }

  return `${minutes}:${ss}`;
}

/* -------------------------------------------------------------------------- */
/* Display labels                                                             */
/* -------------------------------------------------------------------------- */

export const SOURCE_LABEL: Record<
  SourceType,
  string
> = {
  youtube: "YouTube",
  mp4: "Video file",
  twitch: "Twitch",
  web: "Website",
};
