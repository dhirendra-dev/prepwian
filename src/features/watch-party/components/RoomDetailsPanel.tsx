// ============================================================
// JEE PREP HUB — WATCH PARTY
// Room details panel
// File: src/features/watch-party/components/RoomDetailsPanel.tsx
// ============================================================

import { useState } from "react";

import { updateWatchRoom } from "../api/watchPartyApi";

import type {
  WatchRoom,
  WatchRoomSubject,
  WatchRoomVisibility,
} from "../types";

type RoomDetailsPanelProps = {
  room: WatchRoom;

  isHost?: boolean;

  onRoomUpdated?: (
    room: WatchRoom,
  ) => void;
};

const SUBJECTS: WatchRoomSubject[] = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Mixed",
];

const VISIBILITIES: WatchRoomVisibility[] = [
  "public",
  "private",
  "unlisted",
];

export function RoomDetailsPanel({
  room,
  isHost = false,
  onRoomUpdated,
}: RoomDetailsPanelProps) {
  const [editing, setEditing] =
    useState(false);

  const [title, setTitle] =
    useState(room.title);

  const [description, setDescription] =
    useState(room.description ?? "");

  const [subject, setSubject] =
    useState<WatchRoomSubject>(
      room.subject,
    );

  const [visibility, setVisibility] =
    useState<WatchRoomVisibility>(
      room.visibility,
    );

  const [
    allowParticipantControl,
    setAllowParticipantControl,
  ] = useState(
    room.allow_participant_control,
  );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSave() {
    const trimmedTitle =
      title.trim();

    if (!trimmedTitle) {
      setError(
        "Room title cannot be empty.",
      );
      return;
    }

    if (trimmedTitle.length > 200) {
      setError(
        "Room title cannot exceed 200 characters.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated =
        await updateWatchRoom(
          room.id,
          {
            title: trimmedTitle,
            description:
              description.trim() ||
              null,
            subject,
            visibility,
            allowParticipantControl,
          },
        );

      onRoomUpdated?.(updated);
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update room.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setTitle(room.title);
    setDescription(
      room.description ?? "",
    );
    setSubject(room.subject);
    setVisibility(room.visibility);
    setAllowParticipantControl(
      room.allow_participant_control,
    );
    setError(null);
    setEditing(false);
  }

  if (editing && isHost) {
    return (
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Room Details
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update the watch party settings
            </p>
          </div>
        </header>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="watch-room-title"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Title
            </label>

            <input
              id="watch-room-title"
              value={title}
              maxLength={200}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="watch-room-description"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Description
            </label>

            <textarea
              id="watch-room-description"
              value={description}
              rows={4}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="watch-room-subject"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Subject
              </label>

              <select
                id="watch-room-subject"
                value={subject}
                onChange={(event) =>
                  setSubject(
                    event.target
                      .value as WatchRoomSubject,
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {SUBJECTS.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="watch-room-visibility"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Visibility
              </label>

              <select
                id="watch-room-visibility"
                value={visibility}
                onChange={(event) =>
                  setVisibility(
                    event.target
                      .value as WatchRoomVisibility,
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {VISIBILITIES.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item
                        .charAt(0)
                        .toUpperCase() +
                        item.slice(1)}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <input
              type="checkbox"
              checked={
                allowParticipantControl
              }
              onChange={(event) =>
                setAllowParticipantControl(
                  event.target.checked,
                )
              }
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />

            <span>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Allow participant control
              </span>

              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                Participants may control playback and queue actions when permitted by the room policy.
              </span>
            </span>
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={saving}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save changes"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {room.title}
          </h2>

          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Room details
          </p>
        </div>

        {isHost && (
          <button
            type="button"
            onClick={() =>
              setEditing(true)
            }
            className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Edit
          </button>
        )}
      </header>

      {room.description && (
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
          {room.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Subject
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {room.subject}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Visibility
          </p>

          <p className="mt-1 text-sm font-semibold capitalize text-slate-800 dark:text-slate-200">
            {room.visibility}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Status
          </p>

          <p className="mt-1 text-sm font-semibold capitalize text-slate-800 dark:text-slate-200">
            {room.status}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Playback
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {room.allow_participant_control
              ? "Shared control"
              : "Host controlled"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Room created
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {new Date(
            room.created_at,
          ).toLocaleString()}
        </p>
      </div>
    </section>
  );
}