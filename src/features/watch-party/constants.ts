// ============================================================
// JEE PREP HUB — WATCH PARTY
// Shared synchronization constants
// File: src/features/watch-party/constants.ts
// ============================================================

// Participant drift below this threshold does not require correction.
export const DRIFT_TOLERANCE_SECONDS = 1.5;

// Large drift should trigger an immediate hard resync.
export const HARD_RESYNC_SECONDS = 4;

// Host broadcasts authoritative playback state periodically.
export const STATE_BROADCAST_INTERVAL_MS = 2_000;

// Presence heartbeat.
export const HEARTBEAT_INTERVAL_MS = 5_000;

// Prevent rapid duplicate seek broadcasts.
export const SEEK_BROADCAST_DEBOUNCE_MS = 250;

// Realtime channel name prefix.
export const WATCH_PARTY_CHANNEL_PREFIX = "watch-party";

// Maximum chat message length.
// This mirrors the database constraint/design.
export const MAX_CHAT_MESSAGE_LENGTH = 1000;

// Maximum number of messages initially loaded by the client.
export const INITIAL_CHAT_MESSAGE_LIMIT = 100;

// Maximum queue items displayed/handled by the client.
export const MAX_QUEUE_ITEMS = 200;

// Playback rates exposed by the UI.
export const WATCH_PLAYBACK_RATES = [
  0.75,
  1,
  1.25,
  1.5,
  2,
] as const;

// YouTube player state values.
export const YOUTUBE_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

// Creates the room-scoped Supabase Realtime channel.
export function getWatchPartyChannelName(
  roomId: string,
): string {
  return `${WATCH_PARTY_CHANNEL_PREFIX}:${roomId}`;
}