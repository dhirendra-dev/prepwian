/**
 * Formats a playback timestamp as MM:SS or H:MM:SS.
 *
 * Examples:
 *   0       -> "0:00"
 *   65      -> "1:05"
 *   3661    -> "1:01:01"
 */
export function formatWatchTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

/**
 * Converts a timestamp into a short chat-friendly label.
 *
 * Example:
 *   125 -> "2:05"
 */
export function formatChatTimestamp(seconds: number): string {
  return formatWatchTimestamp(seconds);
}