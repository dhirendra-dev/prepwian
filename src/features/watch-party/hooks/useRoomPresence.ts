// ============================================================
// JEE PREP HUB — WATCH PARTY
// Realtime room presence
// File: src/features/watch-party/hooks/useRoomPresence.ts
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/integrations/supabase/client";

import type {
  WatchParticipant,
  WatchRoomMemberRole,
  WatchPresenceState,
} from "../types";

type PresenceUser = {
  userId: string;
  username?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  role: WatchRoomMemberRole;
  joinedAt: string;
};

type UseRoomPresenceArgs = {
  roomId: string;
  user: PresenceUser | null;
};

export function useRoomPresence({
  roomId,
  user,
}: UseRoomPresenceArgs): WatchPresenceState {
  const [participants, setParticipants] =
    useState<WatchParticipant[]>([]);

  useEffect(() => {
    if (!roomId || !user) {
      setParticipants([]);
      return;
    }

    let cancelled = false;

    const channel = supabase.channel(
      `watch-party:${roomId}:presence`,
      {
        config: {
          presence: {
            key: user.userId,
          },
        },
      },
    );

    const buildParticipants = (): WatchParticipant[] => {
      const state = channel.presenceState();

      const result: WatchParticipant[] = [];

      for (const entries of Object.values(state)) {
        const entry = entries?.[0] as
          | Record<string, unknown>
          | undefined;

        if (!entry) {
          continue;
        }

        const participant: WatchParticipant = {
          userId:
            String(
              entry.userId ??
                "",
            ),

          username:
            (entry.username as
              | string
              | null
              | undefined) ??
            null,

          fullName:
            (entry.fullName as
              | string
              | null
              | undefined) ??
            null,

          avatarUrl:
            (entry.avatarUrl as
              | string
              | null
              | undefined) ??
            null,

          role:
            (entry.role as WatchRoomMemberRole) ??
            "participant",

          joinedAt:
            String(
              entry.joinedAt ??
                new Date().toISOString(),
            ),

          online: true,
        };

        if (participant.userId) {
          result.push(participant);
        }
      }

      return result.sort(
        (a, b) => {
          if (
            a.role === "host" &&
            b.role !== "host"
          ) {
            return -1;
          }

          if (
            b.role === "host" &&
            a.role !== "host"
          ) {
            return 1;
          }

          return a.joinedAt.localeCompare(
            b.joinedAt,
          );
        },
      );
    };

    const updateParticipants = () => {
      if (cancelled) {
        return;
      }

      setParticipants(
        buildParticipants(),
      );
    };

    channel.on(
      "presence",
      {
        event: "sync",
      },
      updateParticipants,
    );

    channel.on(
      "presence",
      {
        event: "join",
      },
      updateParticipants,
    );

    channel.on(
      "presence",
      {
        event: "leave",
      },
      updateParticipants,
    );

    channel.subscribe(
      async (status) => {
        if (
          cancelled ||
          status !== "SUBSCRIBED"
        ) {
          return;
        }

        await channel.track({
          userId: user.userId,

          username:
            user.username ?? null,

          fullName:
            user.fullName ?? null,

          avatarUrl:
            user.avatarUrl ?? null,

          role: user.role,

          joinedAt:
            user.joinedAt,
        });

        updateParticipants();
      },
    );

    return () => {
      cancelled = true;

      void channel.untrack();

      void supabase.removeChannel(
        channel,
      );
    };
  }, [
    roomId,
    user?.userId,
    user?.username,
    user?.fullName,
    user?.avatarUrl,
    user?.role,
    user?.joinedAt,
  ]);

  return {
    roomId,
    participants,
    onlineCount:
      participants.length,
  };
}