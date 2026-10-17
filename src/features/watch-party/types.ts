// ============================================================
// PREPWIAN — WATCH PARTY
// Shared frontend types
// File: src/features/watch-party/types.ts
// ============================================================

export type WatchRoomVisibility = "public" | "private" | "unlisted";

export type WatchRoomStatus = "live" | "ended" | "cancelled";

export type WatchRoomMemberRole =
  | "host"
  | "moderator"
  | "participant";

export type WatchRoomMemberStatus =
  | "active"
  | "removed"
  | "banned";

export type WatchRoomSubject =
  | "Physics"
  | "Chemistry"
  | "Mathematics"
  | "Mixed";

export interface WatchRoom {
  id: string;
  host_id: string;

  title: string;
  description: string | null;

  subject: WatchRoomSubject;
  visibility: WatchRoomVisibility;
  status: WatchRoomStatus;

  current_video_id: string | null;
  current_queue_item_id: string | null;

  is_playing: boolean;
  position_seconds: number;
  playback_rate: number;

  playback_sequence: number;
  playback_updated_at: string | null;
  playback_updated_by: string | null;

  allow_participant_control: boolean;

  created_at: string;
  updated_at: string;
}

export interface WatchRoomMember {
  room_id: string;
  user_id: string;

  role: WatchRoomMemberRole;
  status: WatchRoomMemberStatus;

  joined_at: string;
  left_at: string | null;
  updated_at: string;
}

export interface WatchRoomQueueItem {
  id: string;
  room_id: string;

  video_id: string;
  title: string;

  thumbnail_url: string | null;
  position: number;
  duration_seconds: number | null;

  added_by: string;

  created_at: string;
  updated_at: string;
}

export interface WatchRoomCompletion {
  room_id: string;
  queue_item_id: string;
  user_id: string;

  completed_at: string;
}

export interface WatchRoomEvent {
  id: number;
  room_id: string;
  actor_id: string | null;

  event_type: string;
  payload: Record<string, unknown>;

  created_at: string;
}

export interface WatchRoomMessage {
  id: string;
  room_id: string;
  user_id: string;

  body: string;
  timestamp_seconds: number | null;

  created_at: string;
  deleted_at: string | null;
}

// ============================================================
// Playback
// ============================================================

export interface WatchPlaybackState {
  videoId: string | null;
  queueItemId: string | null;

  isPlaying: boolean;
  positionSeconds: number;
  playbackRate: number;

  sequence: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

export type WatchPlaybackEventType =
  | "play"
  | "pause"
  | "seek"
  | "video_change"
  | "rate_change"
  | "state_request"
  | "state_response";

export interface WatchPlaybackEvent {
  roomId: string;
  type: WatchPlaybackEventType;

  videoId?: string | null;
  queueItemId?: string | null;

  isPlaying?: boolean;
  positionSeconds?: number;
  playbackRate?: number;

  sequence: number;
  sentAt: string;
  actorId: string;
}

// ============================================================
// Realtime / Sync
// ============================================================

export interface WatchSyncSnapshot {
  roomId: string;

  videoId: string | null;
  queueItemId: string | null;

  isPlaying: boolean;
  positionSeconds: number;
  playbackRate: number;

  sequence: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

export type WatchSyncStatus =
  | "connecting"
  | "connected"
  | "syncing"
  | "synced"
  | "reconnecting"
  | "disconnected"
  | "error";

export interface WatchSyncState {
  status: WatchSyncStatus;

  lastSequence: number;
  lastSyncedAt: string | null;

  driftSeconds: number;

  error: string | null;
}

// ============================================================
// Presence
// ============================================================

export interface WatchParticipant {
  userId: string;

  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;

  role: WatchRoomMemberRole;

  joinedAt: string;
  online: boolean;
}

export interface WatchPresenceState {
  roomId: string;

  participants: WatchParticipant[];

  onlineCount: number;
}

// ============================================================
// Chat
// ============================================================

export interface WatchChatMessage extends WatchRoomMessage {
  author?: {
    id: string;
    username: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface CreateWatchRoomMessageInput {
  roomId: string;
  body: string;
  timestampSeconds?: number | null;
}

// ============================================================
// Room creation / updates
// ============================================================

export interface CreateWatchRoomInput {
  title: string;
  description?: string;
  subject: WatchRoomSubject;

  visibility: WatchRoomVisibility;

  allowParticipantControl?: boolean;

  currentVideoId?: string | null;
}

export interface UpdateWatchRoomInput {
  title?: string;
  description?: string | null;
  subject?: WatchRoomSubject;
  visibility?: WatchRoomVisibility;

  allowParticipantControl?: boolean;
}

// ============================================================
// Queue
// ============================================================

export interface AddWatchQueueItemInput {
  roomId: string;

  videoId: string;
  title: string;

  thumbnailUrl?: string | null;
  durationSeconds?: number | null;

  position?: number;
}

export interface ReorderWatchQueueInput {
  roomId: string;

  queueItemId: string;
  position: number;
}

// ============================================================
// Permission helpers
// ============================================================

export interface WatchPermissionContext {
  role: WatchRoomMemberRole;
  allowParticipantControl: boolean;
}

export function canControlPlayback({
  role,
  allowParticipantControl,
}: WatchPermissionContext): boolean {
  return (
    role === "host" ||
    role === "moderator" ||
    allowParticipantControl
  );
}

export function canModerateRoom(
  role: WatchRoomMemberRole,
): boolean {
  return role === "host" || role === "moderator";
}

export function isRoomHost(
  role: WatchRoomMemberRole,
): boolean {
  return role === "host";
}

// ============================================================
// YouTube
// ============================================================

export interface YouTubeVideoInfo {
  videoId: string;

  title?: string;
  thumbnailUrl?: string;

  durationSeconds?: number | null;
}

export type YouTubePlayerState =
  | "unstarted"
  | "ended"
  | "playing"
  | "paused"
  | "buffering"
  | "cued"
  | "unknown";

// ============================================================
// Room page state
// ============================================================

export interface WatchPartyPageState {
  room: WatchRoom | null;

  currentUserId: string | null;
  currentMember: WatchRoomMember | null;

  queue: WatchRoomQueueItem[];
  participants: WatchParticipant[];
  messages: WatchChatMessage[];

  playback: WatchPlaybackState;
  sync: WatchSyncState;

  loading: boolean;
  error: string | null;
}

// ============================================================
// Room actions
// ============================================================

export type WatchRoomAction =
  | "play"
  | "pause"
  | "seek"
  | "change_video"
  | "change_rate"
  | "add_to_queue"
  | "remove_from_queue"
  | "reorder_queue"
  | "send_message"
  | "delete_message"
  | "complete_video"
  | "end_room"
  | "transfer_host";

// ============================================================
// Utility
// ============================================================

export interface TimestampedPlaybackState {
  positionSeconds: number;
  capturedAt: number;
  playbackRate: number;
  isPlaying: boolean;
}

export interface WatchDriftResult {
  expectedPosition: number;
  actualPosition: number;
  driftSeconds: number;
  shouldCorrect: boolean;
}