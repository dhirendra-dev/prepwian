import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getWatchRoom,
  getWatchRoomMembers,
  getWatchRoomMessages,
  getWatchRoomQueue,
  leaveWatchRoom,
  persistWatchPlayback,
} from "../api/watchPartyApi";

import type {
  WatchRoom,
  WatchRoomMember,
  WatchRoomQueueItem,
  WatchRoomMessage,
} from "../types";

import {
  useWatchPartySync,
} from "../hooks/useWatchPartySync";

import type {
  YoutubePlayer,
} from "../hooks/useYoutubeIframe";

import {
  useRoomPresence,
} from "../hooks/useRoomPresence";

import { PartyHeader } from "./PartyHeader";
import { WatchPartyPlayer } from "./WatchPartyPlayer";
import { PartySidebar } from "./PartySidebar";
import {
  MobilePartyTabs,
  type MobilePartyTab,
} from "./MobilePartyTabs";

type WatchPartyPageProps = {
  roomId: string;
  currentUserId: string;
  onBack?: () => void;
};

export function WatchPartyPage({
  roomId,
  currentUserId,
  onBack,
}: WatchPartyPageProps) {
  const [room, setRoom] = useState<WatchRoom | null>(null);

  const [members, setMembers] = useState<WatchRoomMember[]>([]);

  const [queue, setQueue] = useState<WatchRoomQueueItem[]>([]);

  const [messages, setMessages] = useState<WatchRoomMessage[]>([]);

  const [player, setPlayer] =
    useState<YoutubePlayer | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [mobileTab, setMobileTab] =
    useState<MobilePartyTab>("chat");

  /*
   * Load the complete room snapshot.
   */
  const loadRoomData = useCallback(async () => {
    setError(null);

    try {
      const [
        roomData,
        memberData,
        queueData,
        messageData,
      ] = await Promise.all([
        getWatchRoom(roomId),
        getWatchRoomMembers(roomId),
        getWatchRoomQueue(roomId),
        getWatchRoomMessages(roomId),
      ]);

      if (!roomData) {
        throw new Error("Watch room could not be found.");
      }

      setRoom(roomData);
      setMembers(memberData);
      setQueue(queueData);
      setMessages(messageData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load watch room.",
      );
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void loadRoomData();
  }, [loadRoomData]);

  /*
   * Current user's persisted membership.
   */
  const currentMembership = useMemo(
    () =>
      members.find(
        (member) =>
          member.user_id === currentUserId,
      ),
    [members, currentUserId],
  );

  /*
   * Host status.
   *
   * The persisted membership role is used first,
   * with room.host_id as the authoritative fallback.
   */
  const isHost =
    currentMembership?.role === "host" ||
    room?.host_id === currentUserId;

  /*
   * Find the currently selected queue item.
   */
  const activeQueueItem = useMemo(() => {
    if (!room) {
      return queue[0] ?? null;
    }

    if (!room.current_queue_item_id) {
      return queue[0] ?? null;
    }

    return (
      queue.find(
        (item) =>
          item.id === room.current_queue_item_id,
      ) ??
      queue[0] ??
      null
    );
  }, [room, queue]);

  const videoId =
    activeQueueItem?.video_id ??
    room?.current_video_id ??
    "";

  /*
   * Active participants.
   */
  const participantIds = useMemo(
    () =>
      members.filter(
        (member) =>
          member.status === "active",
      ),
    [members],
  );

  /*
   * Presence is ephemeral. Persisted membership
   * remains the source of truth for authorization.
   */
  useRoomPresence({
    roomId,
    user: {
      userId: currentUserId,
      username:
        currentMembership?.user_id ??
        "Participant",
      role:
        currentMembership?.role ??
        "participant",
      joinedAt: new Date().toISOString(),
    },
  });

  /*
   * Authoritative playback synchronization.
   *
   * The host is the playback source of truth.
   */
  const sync = useWatchPartySync({
    roomId,
    userId: currentUserId,
    hostId: room?.host_id ?? "",
    videoId,
    queueItemId:
      activeQueueItem?.id ??
      room?.current_queue_item_id ??
      null,
    player,
    isPlayerReady: Boolean(player),
    initialState: room
      ? {
          videoId:
            room.current_video_id ??
            videoId,
          queueItemId:
            room.current_queue_item_id ??
            null,
          isPlaying:
            room.is_playing,
          positionSeconds:
            Number(room.position_seconds) || 0,
          playbackRate:
            Number(room.playback_rate) || 1,
          sequence:
            Number(room.playback_sequence) || 0,
          updatedAt:
            room.playback_updated_at ?? null,
          updatedBy:
            room.playback_updated_by ??
            room.host_id,
        }
      : undefined,
    onStatePersist: async (state) => {
      await persistWatchPlayback(roomId, state);
    },
  });

  /*
   * Send a chat message.
   *
   * The ChatPanel owns the message input UI.
   * The actual persistence is delegated to the API.
   */
  const handleSendMessage = useCallback(
    async (
      body: string,
      timestampSeconds?: number,
    ) => {
      const trimmed = body.trim();

      if (!trimmed) {
        return;
      }

      try {
        const { createWatchRoomMessage } =
          await import(
            "../api/watchPartyApi"
          );

        await createWatchRoomMessage({
          roomId,
          body: trimmed,
          timestampSeconds,
        });

        const updatedMessages =
          await getWatchRoomMessages(roomId);

        setMessages(updatedMessages);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to send message.",
        );
      }
    },
    [roomId],
  );

  /*
   * Host selecting a queue item changes playback.
   */
  const handleSelectQueueItem = useCallback(
    async (item: WatchRoomQueueItem) => {
      if (!isHost) {
        return;
      }

      await sync.hostControls.changeVideo(
        item.video_id,
      );

      await loadRoomData();
    },
    [
      isHost,
      sync.hostControls,
      loadRoomData,
    ],
  );

  /*
   * Leave the room.
   */
  const handleLeave = useCallback(async () => {
    try {
      await leaveWatchRoom(roomId);

      onBack?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to leave watch room.",
      );
    }
  }, [
    roomId,
    currentUserId,
    onBack,
  ]);

  /*
   * Timestamp button from the player opens Chat.
   */
  const handleTimestamp = useCallback(
    (_seconds: number) => {
      setMobileTab("chat");
    },
    [],
  );

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950">
        <div className="mx-auto max-w-[1600px]">
          <div className="h-12 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />

          <div className="mt-4 aspect-video animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </main>
    );
  }

  /*
   * Error / missing room state.
   */
  if (error || !room || !activeQueueItem) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            Watch Party unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {error ??
              "This watch room could not be loaded."}
          </p>

          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void loadRoomData()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Try again
            </button>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <PartyHeader
        room={room}
        role={currentMembership?.role}
        syncStatus={sync.syncStatus}
        participantCount={
          participantIds.length
        }
        onBack={onBack}
        onLeave={() => void handleLeave()}
      />

      <div className="mx-auto max-w-[1600px] p-3 sm:p-5">
        {/* Mobile navigation */}
        <MobilePartyTabs
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          participantCount={
            participantIds.length
          }
          queueCount={queue.length}
        />

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Main player column */}
          <div className="min-w-0 space-y-4">
            <WatchPartyPlayer
              videoId={videoId}
              title={
                activeQueueItem.title ??
                room.title
              }
              isHost={isHost}
              syncStatus={sync.syncStatus}
              onReady={setPlayer}
              onPlay={
                sync.hostControls.play
              }
              onPause={
                sync.hostControls.pause
              }
              onSeek={
                sync.hostControls.seek
              }
              onRateChange={
                sync.hostControls.changeRate
              }
              onTimestamp={handleTimestamp}
              onRequestSync={
                sync.requestLatestState
              }
            />

            {/* Room summary */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    {room.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {room.subject}
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {room.visibility}
                </span>
              </div>

              {room.description && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  {room.description}
                </p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div
            className={
              mobileTab
                ? "min-w-0"
                : "min-w-0"
            }
          >
            <PartySidebar
              room={room}
              activeTab={mobileTab}
              onTabChange={setMobileTab}
              messages={messages}
              participants={participantIds.map(
                (member) => ({
                  userId: member.user_id,
                  username: null,
                  fullName: null,
                  avatarUrl: null,
                  role: member.role,
                  joinedAt: member.joined_at,
                  online: true,
                }),
              )}
              queue={queue}
              currentUserId={currentUserId}
              isHost={isHost}
              onSendMessage={
                handleSendMessage
              }
              onSelectQueueItem={
                handleSelectQueueItem
              }
            />
          </div>
        </div>
      </div>
    </main>
  );
}