import { useEffect } from "react";
import { toast } from "sonner";
import { notifyReminder } from "@/lib/jee360/notifications";
import { dueReminders } from "@/lib/jee360/planner";
import { useAppStore } from "@/lib/jee360/store";

export function ReminderEngine() {
  const reminders = useAppStore((s) => s.reminders);
  const markRemindersFired = useAppStore((s) => s.markRemindersFired);
  const notificationsEnabled = useAppStore((s) => s.settings.notificationsEnabled);

  useEffect(() => {
    const tick = () => {
      const due = dueReminders(useAppStore.getState().reminders);
      if (due.length === 0) return;
      for (const reminder of due) {
        toast(reminder.type === "test" ? "Test coming up" : "Lecture reminder", {
          description: reminder.title,
        });
        if (notificationsEnabled) notifyReminder(reminder);
      }
      markRemindersFired(due.map((r) => r.id));
    };

    tick();
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, [reminders, markRemindersFired, notificationsEnabled]);

  return null;
}
