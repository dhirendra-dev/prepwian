import {
  addDays,
  addMinutes,
  differenceInCalendarDays,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";

export function todayISO(now = new Date()): string {
  return format(now, "yyyy-MM-dd");
}

export function combineDateTime(date: string, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = parseISO(date);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

export function formatLongDate(iso: string): string {
  return format(parseISO(iso), "EEEE, d MMMM");
}

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), "d MMM");
}

export function formatWeekday(iso: string): string {
  return format(parseISO(iso), "EEE");
}

export function formatCountdown(examDate: string, now = new Date()): string {
  const days = differenceInCalendarDays(startOfDay(parseISO(examDate)), startOfDay(now));
  if (days > 1) return `${days} days`;
  if (days === 1) return "Tomorrow";
  if (days === 0) return "Today";
  return `${Math.abs(days)} days ago`;
}

export function weekDates(anchor = new Date(), weekStartsOn: 0 | 1 = 1): string[] {
  const start = startOfWeek(anchor, { weekStartsOn });
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
}

export function isToday(iso: string, now = new Date()): boolean {
  return isSameDay(parseISO(iso), now);
}

export function reminderTime(date: string, startTime: string, leadMinutes: number): Date {
  return addMinutes(combineDateTime(date, startTime), -leadMinutes);
}

export function examInstant(examDate: string, now = new Date()) {
  const target = startOfDay(parseISO(examDate));
  target.setHours(9, 0, 0, 0);
  const ms = target.getTime() - now.getTime();
  const past = ms <= 0;
  const abs = Math.abs(ms);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const seconds = Math.floor((abs % 60_000) / 1000);
  return { past, days, hours, minutes, seconds, ms };
}

export function formatTMinus(examDate: string, now = new Date()): string {
  const t = examInstant(examDate, now);
  if (t.past) return "Window passed";
  return `${t.days}d ${String(t.hours).padStart(2, "0")}h ${String(t.minutes).padStart(2, "0")}m ${String(t.seconds).padStart(2, "0")}s`;
}
