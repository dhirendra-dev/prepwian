import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_VIDEOS = 5000;

class ImportError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type YouTubePlaylistItem = {
  snippet?: {
    title?: string;
    resourceId?: { videoId?: string };
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
  contentDetails?: { videoId?: string };
  status?: { privacyStatus?: string };
};

type YouTubePlaylistResponse = { nextPageToken?: string; items?: YouTubePlaylistItem[] };
type YouTubeVideoResponse = { items?: Array<{ id: string; contentDetails?: { duration?: string } }> };

type ImportedVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Accepts a raw playlist ID or a full YouTube URL containing ?list=. */
function normalizePlaylistId(raw: string): string {
  let value = raw.trim();
  try {
    const url = new URL(value);
    value = url.searchParams.get("list") ?? "";
  } catch {
    // plain ID
  }
  return /^[A-Za-z0-9_-]{10,64}$/.test(value) ? value : "";
}

function parseDuration(duration: string | undefined): number | null {
  if (!duration) return null;
  const match = duration.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  return (
    Number(match[1] ?? 0) * 86400 +
    Number(match[2] ?? 0) * 3600 +
    Number(match[3] ?? 0) * 60 +
    Number(match[4] ?? 0)
  );
}

function getThumbnail(item: YouTubePlaylistItem): string | null {
  const t = item.snippet?.thumbnails;
  return t?.high?.url ?? t?.medium?.url ?? t?.default?.url ?? null;
}

async function youtubeRequest<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (response.ok) return (await response.json()) as T;

  let reason = "";
  try {
    const body = await response.json();
    reason = body?.error?.errors?.[0]?.reason ?? "";
  } catch {
    // ignore
  }
  console.error("YouTube API error", response.status, reason);

  if (response.status === 404 || reason === "playlistNotFound") {
    throw new ImportError(404, "Playlist not found. Check the link and make sure the playlist is public or unlisted.");
  }
  if (reason === "playlistItemsNotAccessible" || reason === "playlistForbidden") {
    throw new ImportError(403, "This playlist is private and cannot be imported.");
  }
  if (["quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded", "userRateLimitExceeded"].includes(reason)) {
    throw new ImportError(429, "The YouTube import limit has been reached. Please try again later.");
  }
  if (["keyInvalid", "keyExpired", "accessNotConfigured", "ipRefererBlocked", "forbidden"].includes(reason) || response.status === 400 && reason === "badRequest") {
    throw new ImportError(500, "The server's YouTube API key is invalid or the YouTube Data API is not enabled for it.");
  }
  throw new ImportError(502, `YouTube API request failed (${response.status}${reason ? `: ${reason}` : ""}).`);
}

async function fetchPlaylistVideos(playlistId: string, apiKey: string): Promise<ImportedVideo[]> {
  const videos: ImportedVideo[] = [];
  let pageToken: string | null = null;

  do {
    const params = new URLSearchParams({
      part: "snippet,contentDetails,status",
      playlistId,
      maxResults: "50",
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await youtubeRequest<YouTubePlaylistResponse>(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`,
    );

    for (const item of data.items ?? []) {
      const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title ?? "YouTube Video";
      // Skip deleted / private entries that cannot be played.
      if (!videoId || title === "Deleted video" || title === "Private video" || item.status?.privacyStatus === "private") {
        continue;
      }
      videos.push({ videoId, title, thumbnailUrl: getThumbnail(item), durationSeconds: null });
    }

    if (videos.length > MAX_VIDEOS) {
      throw new ImportError(400, `Playlist is too large (over ${MAX_VIDEOS} videos).`);
    }
    pageToken = data.nextPageToken ?? null;
  } while (pageToken);

  for (let index = 0; index < videos.length; index += 50) {
    const batch = videos.slice(index, index + 50);
    const params = new URLSearchParams({
      part: "contentDetails",
      id: batch.map((v) => v.videoId).join(","),
      maxResults: "50",
      key: apiKey,
    });
    const data = await youtubeRequest<YouTubeVideoResponse>(
      `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
    );
    const durations = new Map<string, number | null>();
    for (const v of data.items ?? []) durations.set(v.id, parseDuration(v.contentDetails?.duration));
    for (const v of batch) v.durationSeconds = durations.get(v.videoId) ?? null;
  }

  return videos;
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    // 1. Authenticate the caller.
    const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) return json(500, { error: "Server auth configuration is missing." });
    if (!token || token.split(".").length !== 3) return json(401, { error: "Sign in to import playlists." });

    const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims?.sub || claims.claims.role !== "authenticated") {
      return json(401, { error: "Your session has expired. Please sign in again." });
    }

    // 2. Validate input.
    let body: { playlistId?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      return json(400, { error: "Invalid request body." });
    }
    const playlistId = typeof body.playlistId === "string" ? normalizePlaylistId(body.playlistId) : "";
    if (!playlistId) return json(400, { error: "A valid YouTube playlist ID or link is required." });

    // 3. Server-side API key only.
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) return json(500, { error: "YOUTUBE_API_KEY is not configured on the server." });

    const videos = await fetchPlaylistVideos(playlistId, apiKey);
    if (videos.length === 0) {
      return json(404, { error: "This playlist is empty or has no playable videos." });
    }

    return json(200, { playlistId, videos });
  } catch (error) {
    if (error instanceof ImportError) return json(error.status, { error: error.message });
    console.error("youtube-playlist-import failed", error);
    return json(500, { error: "Unable to import YouTube playlist." });
  }
}

serve(handleRequest);
