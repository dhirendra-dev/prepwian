import type { Reminder } from "@/lib/jee360/types";

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function canNotify(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notifyReminder(reminder: Reminder): void {
  if (typeof window === "undefined") return;
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("JEE 360", { body: reminder.title, tag: reminder.id });
    } catch {
      // Embedded previews may block the constructor.
    }
  }
}
