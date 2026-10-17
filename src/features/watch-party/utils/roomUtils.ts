import type { WatchRoom } from "../types";

/**
 * Returns true when the room is currently accepting participants.
 */
export function isRoomJoinable(room: WatchRoom): boolean {
  return room.status === "live";
}

/**
 * Returns true when the room is publicly discoverable.
 */
export function isRoomPublic(room: WatchRoom): boolean {
  return room.visibility === "public";
}

/**
 * Returns true when the supplied user is the room host.
 */
export function isRoomHostUser(
  room: WatchRoom,
  userId: string | null | undefined,
): boolean {
  return Boolean(userId && room.host_id === userId);
}