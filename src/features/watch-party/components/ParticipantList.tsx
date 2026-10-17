// ============================================================
// PREPWIAN — WATCH PARTY
// Participant list
// File: src/features/watch-party/components/ParticipantList.tsx
// ============================================================

import type { WatchParticipant } from "../types";

type ParticipantListProps = {
  participants: WatchParticipant[];
  currentUserId?: string | null;
};

function getParticipantName(
  participant: WatchParticipant,
) {
  return (
    participant.username ||
    participant.fullName ||
    "Student"
  );
}

function getInitials(
  participant: WatchParticipant,
) {
  const name = getParticipantName(participant)
    .trim();

  if (!name) {
    return "?";
  }

  const parts = name.split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

export function ParticipantList({
  participants,
  currentUserId,
}: ParticipantListProps) {
  const sortedParticipants = [...participants].sort(
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

      if (
        a.role === "moderator" &&
        b.role === "participant"
      ) {
        return -1;
      }

      if (
        b.role === "moderator" &&
        a.role === "participant"
      ) {
        return 1;
      }

      return a.joinedAt.localeCompare(
        b.joinedAt,
      );
    },
  );

  return (
    <section
      className="space-y-3"
      aria-label="Participants"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Participants
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {participants.length}{" "}
            {participants.length === 1
              ? "student"
              : "students"}{" "}
            online
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      {sortedParticipants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No participants are currently online.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedParticipants.map(
            (participant) => {
              const name =
                getParticipantName(
                  participant,
                );

              const isCurrentUser =
                participant.userId ===
                currentUserId;

              return (
                <div
                  key={participant.userId}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <div className="relative shrink-0">
                    {participant.avatarUrl ? (
                      <img
                        src={
                          participant.avatarUrl
                        }
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        {getInitials(
                          participant,
                        )}
                      </div>
                    )}

                    <span
                      className={[
                        "absolute -bottom-0.5 -right-0.5",
                        "h-2.5 w-2.5 rounded-full",
                        "border-2 border-white",
                        "dark:border-slate-900",
                        participant.online
                          ? "bg-emerald-500"
                          : "bg-slate-400",
                      ].join(" ")}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {name}
                      </p>

                      {isCurrentUser && (
                        <span className="shrink-0 text-[10px] font-medium text-slate-400">
                          You
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "text-[11px] font-medium",
                          participant.role ===
                          "host"
                            ? "text-amber-600 dark:text-amber-400"
                            : participant.role ===
                              "moderator"
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-500 dark:text-slate-400",
                        ].join(" ")}
                      >
                        {participant.role ===
                        "host"
                          ? "Host"
                          : participant.role ===
                            "moderator"
                          ? "Moderator"
                          : "Participant"}
                      </span>

                      {!participant.online && (
                        <span className="text-[11px] text-slate-400">
                          Offline
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}
