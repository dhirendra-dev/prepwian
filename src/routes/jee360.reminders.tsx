import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/jee360/empty-state";
import { Badge } from "@/components/jee360/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/jee360/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/jee360/theme-toggle";
import { todayISO } from "@/lib/jee360/dates";
import { canNotify, requestNotificationPermission } from "@/lib/jee360/notifications";
import { upcomingReminders } from "@/lib/jee360/planner";
import { useAppStore } from "@/lib/jee360/store";

export const Route = createFileRoute("/jee360/reminders")({
  head: () => ({ meta: [
      { property: "og:title", content: "Study Reminders — JEE 360 | JEE Prep Hub" },
      { property: "og:description", content: "Manage reminders for your JEE study plans and revision." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Study Reminders — JEE 360 | JEE Prep Hub" },
      { name: "twitter:description", content: "Manage reminders for your JEE study plans and revision." },{ title: "Study Reminders — JEE 360 | JEE Prep Hub" }, { name: "description", content: "Manage reminders for your JEE study plans and revision." }] }),
 component: RemindersPage });

function RemindersPage() {
  const reminders = useAppStore((s) => s.reminders);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const addReminder = useAppStore((s) => s.addReminder);
  const toggleReminder = useAppStore((s) => s.toggleReminder);
  const deleteReminder = useAppStore((s) => s.deleteReminder);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(`${todayISO()}T20:00`);

  const upcoming = upcomingReminders(reminders);
  const past = reminders
    .filter((r) => r.fired)
    .sort((a, b) => b.datetime.localeCompare(a.datetime))
    .slice(0, 12);

  async function enablePush() {
    if (!canNotify()) {
      toast.error("This browser cannot show notifications. In-app toasts still fire.");
      updateSettings({ notificationsEnabled: true });
      return;
    }
    const ok = await requestNotificationPermission();
    updateSettings({ notificationsEnabled: ok || true });
    toast.success(ok ? "Browser alerts on" : "In-app toasts on. Browser alerts were blocked.");
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Alerts</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Reminders</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Every upcoming lecture gets an alert {settings.reminderLeadMinutes} minutes before start. Tests get
          at least an hour. Keep this tab open for in-app toasts.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Notification settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Appearance</p>
              <p className="text-xs text-muted-foreground">
                {settings.theme === "dark" ? "Dark" : "Light"} · saved on this device
              </p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Alerts</p>
              <p className="text-xs text-muted-foreground">
                {settings.notificationsEnabled ? "On" : "Off"} · in-app always, browser if allowed
              </p>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) => {
                if (checked) void enablePush();
                else updateSettings({ notificationsEnabled: false });
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead">Minutes before a lecture</Label>
            <Input
              id="lead"
              inputMode="numeric"
              value={String(settings.reminderLeadMinutes)}
              onChange={(e) =>
                updateSettings({ reminderLeadMinutes: Math.max(5, Number(e.target.value) || 30) })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom reminder</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="r-title">Title</Label>
            <Input
              id="r-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Revise MOT flashcards"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="r-when">When</Label>
            <Input id="r-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                if (!title.trim() || !when) return;
                addReminder({
                  title: title.trim(),
                  datetime: new Date(when).toISOString(),
                  type: "custom",
                });
                setTitle("");
                toast.success("Reminder set");
              }}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-2xl">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Nothing queued"
            body="Import a planner or add a custom reminder. Auto alerts skip lectures that already started."
          />
        ) : (
          upcoming.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{item.type}</Badge>
                  <Badge variant="outline">{item.source}</Badge>
                </div>
                <p className="mt-1 text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.datetime).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={item.enabled} onCheckedChange={(checked) => toggleReminder(item.id, checked)} />
                {item.source === "manual" ? (
                  <Button variant="ghost" size="sm" onClick={() => deleteReminder(item.id)}>
                    Delete
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </section>

      {past.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-2xl">Already fired</h2>
          {past.map((item) => (
            <p key={item.id} className="text-sm text-muted-foreground">
              {item.title} · {new Date(item.datetime).toLocaleString()}
            </p>
          ))}
        </section>
      ) : null}
    </div>
  );
}
