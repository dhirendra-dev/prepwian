// ============================================================
// JEE PREP HUB — WATCH PARTY
// Realtime playback synchronization
// File: src/features/watch-party/hooks/useWatchPartySync.ts
// ============================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "@/integrations/supabase/client";

import {
  DRIFT_TOLERANCE_SECONDS,
  HARD_RESYNC_SECONDS,
  SEEK_BROADCAST_DEBOUNCE_MS,
  STATE_BROADCAST_INTERVAL_MS,
  getWatchPartyChannelName,
} from "../constants";

import {
  persistWatchPlayback,
} from "../api/watchPartyApi";

import type {
  WatchPlaybackEvent,
  WatchPlaybackState,
  WatchSyncStatus,
} from "../types";

import type {
  YoutubePlayer,
} from "./useYoutubeIframe";

// ============================================================
// Types
// ============================================================

type UseWatchPartySyncArgs = {
  roomId: string;
  userId: string;
  hostId: string;

  videoId: string;
  queueItemId: string | null;

  player: YoutubePlayer | null;
  isPlayerReady: boolean;

  initialState?: WatchPlaybackState;

  onStatePersist?: (
    state: WatchPlaybackState,
  ) => Promise<void>;
};

type PlaybackBroadcastPayload = {
  type: "playback";
  state: WatchPlaybackState;
};

type RequestStatePayload = {
  type: "request-state";
  requesterId: string;
};

type RoomEndedPayload = {
  type: "room-ended";
};

type BroadcastPayload =
  | PlaybackBroadcastPayload
  | RequestStatePayload
  | RoomEndedPayload;

// ============================================================
// Hook
// ============================================================

export function useWatchPartySync({
  roomId,
  userId,
  hostId,
  videoId,
  queueItemId,
  player,
  isPlayerReady,
  initialState,
  onStatePersist,
}: UseWatchPartySyncArgs) {
  const isHost =
    Boolean(userId) &&
    Boolean(hostId) &&
    userId === hostId;

  const channelRef =
    useRef<ReturnType<typeof supabase.channel> | null>(
      null,
    );

  const sequenceRef =
    useRef<number>(
      initialState?.sequence ?? 0,
    );

  const latestStateRef =
    useRef<WatchPlaybackState | null>(
      initialState ?? null,
    );

  const applyingRemoteStateRef =
    useRef(false);

  const seekDebounceRef =
    useRef<number | null>(null);

  const [syncStatus, setSyncStatus] =
    useState<WatchSyncStatus>("connecting");

  const [playbackState, setPlaybackState] =
    useState<WatchPlaybackState>(
      initialState ?? {
        videoId: videoId || null,
        queueItemId,
        isPlaying: false,
        positionSeconds: 0,
        playbackRate: 1,
        sequence: 0,
        updatedAt: null,
        updatedBy: null,
      },
    );

  // ==========================================================
  // Local state reader
  // ==========================================================

  const readLocalState =
    useCallback((): WatchPlaybackState | null => {
      if (!player || !isPlayerReady) {
        return null;
      }

      const nextSequence =
        sequenceRef.current + 1;

      sequenceRef.current = nextSequence;

      let positionSeconds = 0;
      let playbackRate = 1;
      let isPlaying = false;

      try {
        positionSeconds =
          Math.max(0, player.getCurrentTime());

        playbackRate =
          player.getPlaybackRate() || 1;

        isPlaying =
          player.getPlayerState() === 1;
      } catch {
        return null;
      }

      const state: WatchPlaybackState = {
        videoId: videoId || null,
        queueItemId,
        isPlaying,
        positionSeconds,
        playbackRate,
        sequence: nextSequence,
        updatedAt:
          new Date().toISOString(),
        updatedBy: userId,
      };

      latestStateRef.current = state;
      setPlaybackState(state);

      return state;
    }, [
      player,
      isPlayerReady,
      videoId,
      queueItemId,
      userId,
    ]);

  // ==========================================================
  // Publish
  // ==========================================================

  const publish =
    useCallback(
      async (payload: BroadcastPayload) => {
        const channel =
          channelRef.current;

        if (!channel) {
          return;
        }

        try {
          await channel.send({
            type: "broadcast",
            event: "watch-party",
            payload,
          });
        } catch {
          setSyncStatus("reconnecting");
        }
      },
      [],
    );

  // ==========================================================
  // Persist + broadcast authoritative host state
  // ==========================================================

  const broadcastLocalState =
    useCallback(async () => {
      if (
        !isHost ||
        !player ||
        !isPlayerReady
      ) {
        return;
      }

      const state =
        readLocalState();

      if (!state) {
        return;
      }

      setSyncStatus("synced");

      await publish({
        type: "playback",
        state,
      });

      try {
        if (onStatePersist) {
          await onStatePersist(state);
        } else {
          await persistWatchPlayback(
            roomId,
            state,
          );
        }
      } catch {
        // Realtime playback remains usable even
        // when persistence temporarily fails.
        setSyncStatus("reconnecting");
      }
    }, [
      isHost,
      player,
      isPlayerReady,
      readLocalState,
      publish,
      onStatePersist,
      roomId,
    ]);

  // ==========================================================
  // Apply remote authoritative state
  // ==========================================================

  const applyRemoteState =
    useCallback(
      async (
        remoteState: WatchPlaybackState,
      ) => {
        if (
          !player ||
          !isPlayerReady
        ) {
          return;
        }

        if (
          remoteState.updatedBy ===
          userId
        ) {
          return;
        }

        if (
          remoteState.sequence <
          sequenceRef.current
        ) {
          return;
        }

        sequenceRef.current =
          remoteState.sequence;

        latestStateRef.current =
          remoteState;

        setPlaybackState(
          remoteState,
        );

        setSyncStatus("syncing");

        applyingRemoteStateRef.current =
          true;

        try {
          if (
            remoteState.videoId &&
            remoteState.videoId !==
              videoId
          ) {
            player.loadVideoById(
              remoteState.videoId,
            );
          }

          const rate =
            remoteState.playbackRate ||
            1;

          player.setPlaybackRate(
            rate,
          );

          const localTime =
            player.getCurrentTime();

          const drift =
            remoteState.positionSeconds -
            localTime;

          if (
            Math.abs(drift) >=
            HARD_RESYNC_SECONDS
          ) {
            player.seekTo(
              remoteState.positionSeconds,
              true,
            );
          } else if (
            Math.abs(drift) >=
            DRIFT_TOLERANCE_SECONDS
          ) {
            player.seekTo(
              remoteState.positionSeconds,
              true,
            );
          }

          if (
            remoteState.isPlaying
          ) {
            try {
              player.playVideo();
            } catch {
              // Browser autoplay restrictions
              // may prevent automatic playback.
            }
          } else {
            player.pauseVideo();
          }

          setSyncStatus("synced");
        } finally {
          window.setTimeout(() => {
            applyingRemoteStateRef.current =
              false;
          }, 100);
        }
      },
      [
        player,
        isPlayerReady,
        userId,
        videoId,
      ],
    );

  // ==========================================================
  // Realtime channel
  // ==========================================================

  useEffect(() => {
    if (!roomId || !userId) {
      return;
    }

    let cancelled = false;

    const channel =
      supabase.channel(
        getWatchPartyChannelName(
          roomId,
        ),
        {
          config: {
            broadcast: {
              self: false,
            },
          },
        },
      );

    channelRef.current =
      channel;

    channel.on(
      "broadcast",
      {
        event: "watch-party",
      },
      async ({
        payload,
      }: {
        payload: BroadcastPayload;
      }) => {
        if (cancelled) {
          return;
        }

        if (
          payload.type ===
          "playback"
        ) {
          await applyRemoteState(
            payload.state,
          );

          return;
        }

        if (
          payload.type ===
          "request-state"
        ) {
          if (
            isHost &&
            isPlayerReady
          ) {
            await broadcastLocalState();
          }

          return;
        }

        if (
          payload.type ===
          "room-ended"
        ) {
          setSyncStatus("synced");
        }
      },
    );

    setSyncStatus("connecting");

    channel.subscribe(
      (status) => {
        if (cancelled) {
          return;
        }

        if (status === "SUBSCRIBED") {
          setSyncStatus(
            "connected",
          );

          if (
            isHost &&
            isPlayerReady
          ) {
            void broadcastLocalState();
          }
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          setSyncStatus(
            "error",
          );
        } else if (
          status === "CLOSED"
        ) {
          setSyncStatus(
            "disconnected",
          );
        }
      },
    );

    return () => {
      cancelled = true;

      if (
        seekDebounceRef.current !==
        null
      ) {
        window.clearTimeout(
          seekDebounceRef.current,
        );
      }

      if (
        channelRef.current ===
        channel
      ) {
        channelRef.current = null;
      }

      void supabase.removeChannel(
        channel,
      );
    };
  }, [
    roomId,
    userId,
    isHost,
    isPlayerReady,
    applyRemoteState,
    broadcastLocalState,
  ]);

  // ==========================================================
  // Periodic host broadcast
  // ==========================================================

  useEffect(() => {
    if (
      !isHost ||
      !isPlayerReady ||
      !player
    ) {
      return;
    }

    const interval =
      window.setInterval(() => {
        void broadcastLocalState();
      }, STATE_BROADCAST_INTERVAL_MS);

    return () =>
      window.clearInterval(
        interval,
      );
  }, [
    isHost,
    isPlayerReady,
    player,
    broadcastLocalState,
  ]);

  // ==========================================================
  // Host controls
  // ==========================================================

  const hostControls =
    useMemo(
      () => ({
        canControl: isHost,

        play: async () => {
          if (
            !isHost ||
            !player
          ) {
            return;
          }

          player.playVideo();

          await broadcastLocalState();
        },

        pause: async () => {
          if (
            !isHost ||
            !player
          ) {
            return;
          }

          player.pauseVideo();

          await broadcastLocalState();
        },

        seek: async (
          seconds: number,
        ) => {
          if (
            !isHost ||
            !player
          ) {
            return;
          }

          const safeSeconds =
            Math.max(
              0,
              seconds,
            );

          player.seekTo(
            safeSeconds,
            true,
          );

          if (
            seekDebounceRef.current !==
            null
          ) {
            window.clearTimeout(
              seekDebounceRef.current,
            );
          }

          seekDebounceRef.current =
            window.setTimeout(() => {
              void broadcastLocalState();
            }, SEEK_BROADCAST_DEBOUNCE_MS);
        },

        changeRate: async (
          rate: number,
        ) => {
          if (
            !isHost ||
            !player
          ) {
            return;
          }

          const safeRate =
            Math.min(
              2,
              Math.max(
                0.25,
                rate,
              ),
            );

          player.setPlaybackRate(
            safeRate,
          );

          await broadcastLocalState();
        },

        changeVideo: async (
          nextVideoId: string,
        ) => {
          if (
            !isHost ||
            !player ||
            !nextVideoId
          ) {
            return;
          }

          player.loadVideoById(
            nextVideoId,
          );

          await broadcastLocalState();
        },
      }),
      [
        isHost,
        player,
        broadcastLocalState,
      ],
    );

  // ==========================================================
  // Request current host state
  // ==========================================================

  const requestLatestState =
    useCallback(async () => {
      if (!userId) {
        return;
      }

      await publish({
        type: "request-state",
        requesterId: userId,
      });
    }, [
      userId,
      publish,
    ]);

  // ==========================================================
  // Public API
  // ==========================================================

  return {
    isHost,

    syncStatus,

    playbackState,

    hostControls,

    isApplyingRemoteState:
      applyingRemoteStateRef.current,

    requestLatestState,

    broadcastLocalState,
  };
}