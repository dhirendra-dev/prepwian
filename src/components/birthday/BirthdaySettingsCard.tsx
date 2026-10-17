import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Cake, Globe2, LockKeyhole, Music2, Users } from "lucide-react";
import { toast } from "sonner";
import { birthdayRpc } from "@/lib/birthday-rpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BirthdaySettings = {
  birthday_month: number | null;
  birthday_day: number | null;
  visibility: "private" | "community" | "public";
  notifications_enabled: boolean;
  birthday_reminders_enabled: boolean;
  birthday_reminder_days_before: number;
  music_enabled: boolean;
};

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, index, 1)),
  ),
}));

function daysInMonth(month: number) {
  if (month === 2) return 29;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function BirthdaySettingsCard({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: ["birthday-settings", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await birthdayRpc<BirthdaySettings[]>("birthday_my_settings");
      if (error) throw error;
      return Array.isArray(data) ? (data[0] ?? null) : null;
    },
    staleTime: 0,
  });
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [visibility, setVisibility] = useState<BirthdaySettings["visibility"]>("private");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState("1");
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const row = settings.data;
    if (!row) return;
    setBirthMonth(row.birthday_month ? String(row.birthday_month) : "");
    setBirthDay(row.birthday_day ? String(row.birthday_day) : "");
    setVisibility(row.visibility ?? "private");
    setNotificationsEnabled(row.notifications_enabled ?? true);
    setRemindersEnabled(row.birthday_reminders_enabled ?? true);
    setReminderDaysBefore(String(row.birthday_reminder_days_before ?? 1));
    setMusicEnabled(row.music_enabled ?? true);
  }, [settings.data]);

  async function save() {
    const month = Number(birthMonth);
    const day = Number(birthDay);
    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(day) ||
      day < 1 ||
      day > daysInMonth(month)
    ) {
      toast.error("Choose a valid birthday month and day.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await birthdayRpc<boolean>("birthday_save_my_settings", {
        _birthday_month: month,
        _birthday_day: day,
        _visibility: visibility,
        _notifications_enabled: notificationsEnabled,
        _music_enabled: musicEnabled,
        _birthday_reminders_enabled: remindersEnabled,
        _birthday_reminder_days_before: Number(reminderDaysBefore),
      });
      if (error) {
        toast.error(error.message || "Couldn't save your birthday settings.");
        return;
      }
      if (data !== true) {
        toast.error("We couldn't confirm that your birthday was saved. Please retry.");
        return;
      }
      if (remindersEnabled) {
        void birthdayRpc<number>("birthday_generate_my_reminders")
          .then(({ data: created, error: reminderError }) => {
            if (!reminderError && typeof created === "number" && created > 0) {
              void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
            }
          })
          .catch(() => {});
      }
      toast.success("Birthday settings saved");
      await settings.refetch();
    } catch {
      toast.error("The birthday service is unavailable. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="mx-2 mb-6 overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-rose-50 shadow-[0_16px_44px_-32px_rgba(190,24,93,.4)] dark:border-amber-100/15 dark:from-amber-950/25 dark:via-card dark:to-rose-950/20 sm:mx-0"
      aria-labelledby="birthday-settings-title"
    >
      <div className="flex items-start gap-3 border-b border-amber-200/50 px-4 py-4 dark:border-white/10 sm:px-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-rose-300 text-rose-950 shadow-sm">
          <Cake className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="birthday-settings-title" className="font-display text-lg font-bold">
            Birthday & celebration
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            We ask only for month and day. New entries contain no birth year; any older birthday
            record remains private.
          </p>
        </div>
      </div>
      <div className="grid gap-5 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-5">
        <div className="space-y-2">
          <Label htmlFor="birthday-month">Birthday month</Label>
          <Select
            value={birthMonth}
            onValueChange={(value) => {
              setBirthMonth(value);
              if (birthDay && Number(birthDay) > daysInMonth(Number(value))) setBirthDay("");
            }}
          >
            <SelectTrigger id="birthday-month" className="h-11" aria-label="Birthday month">
              <SelectValue placeholder="Choose a month" />
            </SelectTrigger>
            <SelectContent position="popper">
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={String(month.value)}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthday-day">Birthday day</Label>
          <Select value={birthDay} onValueChange={setBirthDay} disabled={!birthMonth}>
            <SelectTrigger id="birthday-day" className="h-11" aria-label="Birthday day">
              <SelectValue placeholder={birthMonth ? "Choose a day" : "Select a month first"} />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-64">
              {birthMonth &&
                Array.from(
                  { length: daysInMonth(Number(birthMonth)) },
                  (_, index) => index + 1,
                ).map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {day}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <p className="-mt-2 text-[11px] leading-5 text-muted-foreground sm:col-span-2">
          Used to check your birthday in the JEE Prep Hub timezone (India Standard Time). February
          29 is supported.
        </p>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="birthday-privacy">Birthday visibility</Label>
          <Select
            value={visibility}
            onValueChange={(value) => setVisibility(value as BirthdaySettings["visibility"])}
          >
            <SelectTrigger id="birthday-privacy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">
                <span className="inline-flex items-center gap-2">
                  <LockKeyhole className="h-3.5 w-3.5" /> Private — only you
                </span>
              </SelectItem>
              <SelectItem value="community">
                <span className="inline-flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Community — signed-in members
                </span>
              </SelectItem>
              <SelectItem value="public">
                <span className="inline-flex items-center gap-2">
                  <Globe2 className="h-3.5 w-3.5" /> Public — discoverable on Birthday Hub
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] leading-5 text-muted-foreground">
            When visible, only the month and day appear; no year is shown.
          </p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-background/60 p-3.5 sm:col-span-2">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(event) => setNotificationsEnabled(event.target.checked)}
            className="mt-1 h-4 w-4 accent-primary"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Cake className="h-4 w-4 text-rose-500" aria-hidden="true" /> Birthday wish
              notifications
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              Allow an in-app notification when someone sends you a wish.
            </span>
          </span>
        </label>
        <div className="space-y-3 sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-background/60 p-3.5">
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={(event) => setRemindersEnabled(event.target.checked)}
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold">
                <BellRing className="h-4 w-4 text-violet-500" aria-hidden="true" /> Upcoming
                birthday reminders
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                When you use JEE Prep Hub, we check for upcoming birthdays shared with the community
                and add reminders to Notifications. Private birthdays are never included.
              </span>
            </span>
          </label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
            <div>
              <Label htmlFor="birthday-reminder-lead">Remind me</Label>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                One reminder per visible birthday, generated when you next use the platform.
              </p>
            </div>
            <Select
              value={reminderDaysBefore}
              onValueChange={setReminderDaysBefore}
              disabled={!remindersEnabled}
            >
              <SelectTrigger id="birthday-reminder-lead" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day before</SelectItem>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="7">1 week before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-background/60 p-3.5 sm:col-span-2">
          <input
            type="checkbox"
            checked={musicEnabled}
            onChange={(event) => setMusicEnabled(event.target.checked)}
            className="mt-1 h-4 w-4 accent-primary"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Music2 className="h-4 w-4 text-amber-500" aria-hidden="true" /> Enable birthday music
              player
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              Music never starts on its own. When enabled, use Play, seek, volume, and replay in the
              celebration.
            </span>
          </span>
        </label>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-amber-200/50 px-4 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-[11px] leading-5 text-muted-foreground">
          A birthday month and day are required to use your account.
        </p>
        <Button
          type="button"
          onClick={() => void save()}
          disabled={saving || settings.isLoading || !birthMonth || !birthDay}
          className="min-h-11 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 font-bold text-white hover:from-amber-600 hover:to-rose-600"
        >
          {saving ? "Saving…" : settings.isLoading ? "Loading…" : "Save birthday settings"}
        </Button>
      </div>
      {settings.isError && (
        <div className="px-5 pb-4 text-sm text-destructive" role="alert">
          Birthday settings could not be loaded. Please refresh and try again.
        </div>
      )}
    </section>
  );
}
