// ============================================================
// JEE PREP HUB — WATCH PARTY
// API layer
// File: src/features/watch-party/api/watchPartyApi.ts
// ============================================================

import { supabase } from "@/integrations/supabase/client";

import type {
  AddWatchQueueItemInput,
  CreateWatchRoomInput,
  CreateWatchRoomMessageInput,
  ReorderWatchQueueInput,
  UpdateWatchRoomInput,
  WatchPlaybackState,
  WatchRoom,
  WatchRoomCompletion,
  WatchRoomEvent,
  WatchRoomMember,
  WatchRoomMessage,
  WatchRoomQueueItem,
} from "../types";

// ============================================================
// Room
// ============================================================

export async function getWatchRoom(
  roomId: string,
): Promise<WatchRoom> {
  const { data, error } = await supabase
    .from("watch_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (error) {
    throw error;
  }

  return data as WatchRoom;
}

export async function listWatchRooms(options?: {
  status?: "live" | "ended" | "cancelled";
  subject?: "Physics" | "Chemistry" | "Mathematics" | "Mixed";
}) {
  let query = supabase
    .from("watch_rooms")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.subject) {
    query = query.eq("subject", options.subject);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as WatchRoom[];
}

export async function createWatchRoom(
  input: CreateWatchRoomInput,
): Promise<WatchRoom> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("watch_rooms")
    .insert({
      host_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      subject: input.subject,
      visibility: input.visibility,
      status: "live",
      current_video_id: input.currentVideoId ?? "",
      is_playing: false,
      position_seconds: 0,
      playback_rate: 1,
      playback_sequence: 0,
      allow_participant_control:
        input.allowParticipantControl ?? false,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as WatchRoom;
}

export async function updateWatchRoom(
  roomId: string,
  input: UpdateWatchRoomInput,
): Promise<WatchRoom> {
  const updatePayload: Record<string, unknown> = {};

  if (input.title !== undefined) {
    updatePayload.title = input.title.trim();
  }

  if (input.description !== undefined) {
    updatePayload.description =
      input.description?.trim() || null;
  }

  if (input.subject !== undefined) {
    updatePayload.subject = input.subject;
  }

  if (input.visibility !== undefined) {
    updatePayload.visibility = input.visibility;
  }

  if (input.allowParticipantControl !== undefined) {
    updatePayload.allow_participant_control =
      input.allowParticipantControl;
  }

  const { data, error } = await supabase
    .from("watch_rooms")
    .update(updatePayload as never)
    .eq("id", roomId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as WatchRoom;
}

export async function endWatchRoom(
  roomId: string,
): Promise<WatchRoom> {
  const { data, error } = await supabase.rpc(
    "end_watch_room",
    {
      _room_id: roomId,
    },
  );

  if (error) {
    throw error;
  }

  return data as WatchRoom;
}

// ============================================================
// Membership
// ============================================================

export async function getWatchRoomMembers(
  roomId: string,
): Promise<WatchRoomMember[]> {
  const { data, error } = await supabase
    .from("watch_room_members")
    .select("*")
    .eq("room_id", roomId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as WatchRoomMember[];
}

export async function getMyWatchRoomMembership(
  roomId: string,
): Promise<WatchRoomMember | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("watch_room_members")
    .select("*")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as WatchRoomMember | null;
}

export async function joinWatchRoom(
  roomId: string,
): Promise<WatchRoomMember> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("watch_room_members")
    .upsert(
      {
        room_id: roomId,
        user_id: user.id,
        role: "participant",
        status: "active",
        left_at: null,
      },
      {
        onConflict: "room_id,user_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as WatchRoomMember;
}

export async function leaveWatchRoom(
  roomId: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const { error } = await supabase
    .from("watch_room_members")
    .update({
      status: "removed",
      left_at: new Date().toISOString(),
    })
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}

export async function transferWatchRoomHost(
  roomId: string,
  newHostId: string,
): Promise<WatchRoom> {
  const { data, error } = await supabase.rpc(
    "transfer_watch_room_host",
    {
      _room_id: roomId,
      _new_host_id: newHostId,
    },
  );

  if (error) {
    throw error;
  }

  return data as WatchRoom;
}

// ============================================================
// Queue
// ============================================================

export async function getWatchRoomQueue(
  roomId: string,
): Promise<WatchRoomQueueItem[]> {
  const { data, error } = await supabase
    .from("watch_room_queue")
    .select("*")
    .eq("room_id", roomId)
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as WatchRoomQueueItem[];
}

export async function addWatchQueueItem(
  input: AddWatchQueueItemInput,
): Promise<WatchRoomQueueItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  let position = input.position;

  if (position === undefined) {
    const { data: lastItem, error: lastItemError } =
      await supabase
        .from("watch_room_queue")
        .select("position")
        .eq("room_id", input.roomId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (lastItemError) {
      throw lastItemError;
    }

    position = (lastItem?.position ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from("watch_room_queue")
    .insert({
      room_id: input.roomId,
      video_id: input.videoId,
      title: input.title.trim(),
      thumbnail_url: input.thumbnailUrl ?? null,
      duration_seconds: input.durationSeconds ?? null,
      position,
      added_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as WatchRoomQueueItem;
}

export async function removeWatchQueueItem(
  roomId: string,
  queueItemId: string,
): Promise<void> {
  const { error } = await supabase
    .from("watch_room_queue")
    .delete()
    .eq("room_id", roomId)
    .eq("id", queueItemId);

  if (error) {
    throw error;
  }
}

export async function reorderWatchQueueItem(
  input: ReorderWatchQueueInput,
): Promise<WatchRoomQueueItem> {
  const { data, error } = await supabase
    .from("watch_room_queue")
    .update({
      position: input.position,
    })
    .eq("room_id", input.roomId)
    .eq("id", input.queueItemId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as WatchRoomQueueItem;
}

// ============================================================
// Playback
// ============================================================

export async function persistWatchPlayback(
  roomId: string,
  playback: WatchPlaybackState,
): Promise<WatchRoom> {
  const { data, error } = await supabase.rpc(
    "persist_watch_room_playback",
    {
      _room_id: roomId,
      _video_id: playback.videoId as string,
      _queue_item_id: playback.queueItemId as string,
      _is_playing: playback.isPlaying,
      _position_seconds: playback.positionSeconds,
      _playback_rate: playback.playbackRate,
      _sequence: playback.sequence,
      _updated_at:
        playback.updatedAt ?? new Date().toISOString(),
    },
  );

  if (error) {
    throw error;
  }

  return data as WatchRoom;
}

// ============================================================
// Chat
// ============================================================

export async function getWatchRoomMessages(
  roomId: string,
  limit = 100,
): Promise<WatchRoomMessage[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 200);

  const { data, error } = await supabase
    .from("watch_room_messages")
    .select("*")
    .eq("room_id", roomId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as WatchRoomMessage[]).reverse();
}

export async function createWatchRoomMessage(
  input: CreateWatchRoomMessageInput,
): Promise<WatchRoomMessage> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const body = input.body.trim();

  if (!body) {
    throw new Error("Message cannot be empty");
  }

  if (body.length > 1000) {
    throw new Error("Message cannot exceed 1000 characters");
  }

  const { data, error } = await supabase
    .from("watch_room_messages")
    .insert({
      room_id: input.roomId,
      user_id: user.id,
      body,
      timestamp_seconds:
        input.timestampSeconds ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as WatchRoomMessage;
}

export async function deleteWatchRoomMessage(
  messageId: string,
): Promise<void> {
  const { error } = await supabase
    .from("watch_room_messages")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", messageId);

  if (error) {
    throw error;
  }
}

// ============================================================
// Events
// ============================================================

export async function getWatchRoomEvents(
  roomId: string,
  limit = 100,
): Promise<WatchRoomEvent[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 200);

  const { data, error } = await supabase
    .from("watch_room_events")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw error;
  }

  return (data ?? []).reverse() as WatchRoomEvent[];
}

export async function createWatchRoomEvent(
  roomId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<WatchRoomEvent> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("watch_room_events")
    .insert({
      room_id: roomId,
      actor_id: user.id,
      event_type: eventType,
      payload: payload as never,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as WatchRoomEvent;
}

// ============================================================
// Completions
// ============================================================

export async function markWatchVideoCompleted(
  roomId: string,
  queueItemId: string,
): Promise<WatchRoomCompletion> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("watch_room_completions")
    .upsert(
      {
        room_id: roomId,
        queue_item_id: queueItemId,
        user_id: user.id,
      },
      {
        onConflict:
          "room_id,queue_item_id,user_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as WatchRoomCompletion;
}

export async function getMyWatchRoomCompletions(
  roomId: string,
): Promise<WatchRoomCompletion[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("watch_room_completions")
    .select("*")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as WatchRoomCompletion[];
}