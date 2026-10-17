export const FOCUS_TIMER_KEY = (userId: string) => `jee-focus-timer-${userId}`;

export function clearFocusTimerStorage(userId?: string) {
  if (!userId) return;
  try {
    localStorage.removeItem(FOCUS_TIMER_KEY(userId));
  } catch {
    /* ignore storage errors */
  }
}
