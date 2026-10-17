// ============================================================
// JEE PREP HUB — WATCH PARTY
// Sync status indicator
// File: src/features/watch-party/components/SyncStatusPill.tsx
// ============================================================

import type { WatchSyncStatus } from "../types";

type SyncStatusPillProps = {
  status: WatchSyncStatus;
};

const STATUS_CONFIG: Record<
  WatchSyncStatus,
  {
    label: string;
    dotClass: string;
    textClass: string;
  }
> = {
  connecting: {
    label: "Connecting",
    dotClass: "bg-amber-400",
    textClass: "text-amber-700 dark:text-amber-300",
  },

  connected: {
    label: "Connected",
    dotClass: "bg-blue-400",
    textClass: "text-blue-700 dark:text-blue-300",
  },

  syncing: {
    label: "Syncing",
    dotClass: "bg-indigo-400",
    textClass: "text-indigo-700 dark:text-indigo-300",
  },

  synced: {
    label: "In sync",
    dotClass: "bg-emerald-400",
    textClass: "text-emerald-700 dark:text-emerald-300",
  },

  reconnecting: {
    label: "Reconnecting",
    dotClass: "bg-amber-400",
    textClass: "text-amber-700 dark:text-amber-300",
  },

  disconnected: {
    label: "Disconnected",
    dotClass: "bg-red-400",
    textClass: "text-red-700 dark:text-red-300",
  },

  error: {
    label: "Sync error",
    dotClass: "bg-red-500",
    textClass: "text-red-700 dark:text-red-300",
  },
};

export function SyncStatusPill({
  status,
}: SyncStatusPillProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={[
        "inline-flex items-center gap-2",
        "rounded-full",
        "border border-slate-200",
        "bg-white/80",
        "px-2.5 py-1",
        "text-xs font-medium",
        "shadow-sm",
        "dark:border-slate-700",
        "dark:bg-slate-900/80",
        config.textClass,
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className={[
          "h-1.5 w-1.5 rounded-full",
          config.dotClass,
          status === "connecting" ||
          status === "syncing" ||
          status === "reconnecting"
            ? "animate-pulse"
            : "",
        ].join(" ")}
      />

      <span>{config.label}</span>
    </span>
  );
}