// ============================================================
// JEE PREP HUB — WATCH PARTY
// Synchronization utilities
// File: src/features/watch-party/utils/syncUtils.ts
// ============================================================

/**
 * Returns the expected playback position at the current time.
 *
 * updatedAt is expected to be a Unix timestamp in milliseconds.
 */
export function calculateExpectedPosition({
  positionSeconds,
  playbackRate,
  isPlaying,
  updatedAt,
  now = Date.now(),
}: {
  positionSeconds: number;
  playbackRate: number;
  isPlaying: boolean;
  updatedAt: number;
  now?: number;
}) {
  if (!isPlaying) {
    return Math.max(0, positionSeconds);
  }

  const elapsedSeconds =
    Math.max(0, now - updatedAt) / 1000;

  return Math.max(
    0,
    positionSeconds +
      elapsedSeconds * playbackRate,
  );
}

/**
 * Calculates how far the local player is from
 * the authoritative playback position.
 */
export function calculatePlaybackDrift({
  localPosition,
  expectedPosition,
}: {
  localPosition: number;
  expectedPosition: number;
}) {
  return localPosition - expectedPosition;
}

/**
 * Determines whether a playback update is newer
 * than the state currently known by the client.
 *
 * Equal and older sequences must not replace the
 * current authoritative state.
 */
export function isNewerPlaybackSequence(
  incomingSequence: number,
  currentSequence: number,
) {
  return (
    Number.isFinite(incomingSequence) &&
    incomingSequence > currentSequence
  );
}

/**
 * Returns true when the absolute playback drift
 * is greater than the supplied tolerance.
 */
export function exceedsDriftTolerance(
  driftSeconds: number,
  toleranceSeconds: number,
) {
  return (
    Math.abs(driftSeconds) >
    toleranceSeconds
  );
}