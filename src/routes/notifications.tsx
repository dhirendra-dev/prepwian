import { useMemo, useState } from "react";
import { LinkifiedText } from "@/components/LinkifiedText";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  ExternalLink,
  FileText,
  Flame,
  MessageCircle,
  Search,
  ShieldAlert,
  Sparkles,
  UserRound,
  Users,
  RefreshCw,
  Inbox,
  CircleDot,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { format, isToday, isYesterday, startOfWeek } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [
      { property: "og:title", content: "Notifications — JEE Prep Hub" },
      { property: "og:description", content: "Read your JEE Prep Hub notifications and community updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Notifications — JEE Prep Hub" },
      { name: "twitter:description", content: "Read your JEE Prep Hub notifications and community updates." },
{ title: "Notifications — JEE Prep Hub" }, { name: "description", content: "Read your JEE Prep Hub notifications and community updates." }] }),

  component: NotificationsPage,
});

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  priority: string | null;
};

type Filter = "all" | "unread" | "read" | "jee";
const PAGE_SIZE = 25;

function categoryFor(item: NotificationItem) {
  const text = `${item.title} ${item.body ?? ""}`.toLowerCase();
  if (item.priority === "high" || /jee alert|deadline|urgent|important/.test(text)) return "jee";
  if (/follow|profile/.test(text)) return "follow";
  if (/community|chat|message|reply|comment/.test(text)) return "community";
  if (/test|quiz|mock|exam|announcement|update|achievement|certificate|notice/.test(text))
    return "update";
  return "general";
}

function iconFor(item: NotificationItem) {
  const category = categoryFor(item);
  if (category === "jee") return ShieldAlert;
  if (category === "follow") return UserRound;
  if (category === "community") return MessageCircle;
  if (category === "update") return FileText;
  return Bell;
}

function toneFor(item: NotificationItem) {
  const category = categoryFor(item);
  if (category === "jee")
    return "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300";
  if (category === "follow")
    return "bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300";
  if (category === "community")
    return "bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300";
  if (category === "update")
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300";
  return "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300";
}

function groupFor(value: string) {
  const date = new Date(value);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (date >= startOfWeek(new Date(), { weekStartsOn: 1 })) return "This week";
  return "Earlier";
}

const notificationsPageStyles = `
.notifications-page { animation: notifications-page-enter .28s ease-out both; }
.notifications-panel { background: hsl(var(--card)); }
.notifications-panel-header { position: relative; }
.notifications-panel-header::after {
  content: ""; position: absolute; inset: auto 0 0; height: 1px;
  background: linear-gradient(90deg, transparent, hsl(var(--primary) / .18), transparent);
  pointer-events: none;
}
.notification-filter { -webkit-tap-highlight-color: transparent; }
.notification-filter:active { transform: scale(.97); }
.notification-row { position: relative; }
.notification-row:hover { background-color: hsl(var(--accent) / .42); }
.notification-row:focus-within { background-color: hsl(var(--primary) / .045); }
.notification-row button { -webkit-tap-highlight-color: transparent; }
.notifications-panel input { transition: border-color .18s ease, box-shadow .18s ease, background .18s ease; }
.notifications-panel input:focus-visible { box-shadow: 0 0 0 3px hsl(var(--primary) / .12); }
@keyframes notifications-page-enter {
  from { opacity: 0; transform: translateY(7px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (max-width: 520px) {
  .notifications-page { padding-top: 12px; }
  .notifications-page-heading { margin-bottom: 16px; }
  .notifications-panel { border-radius: 23px; }
  .notifications-panel-header { padding: 14px; }
  .notification-row { padding: 14px 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .notifications-page { animation: none; }
  .notification-filter, .notifications-panel input { transition: none; }
}
`;

function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const notificationsQuery = useInfiniteQuery({
    queryKey: ["notifications", user?.id, "center"],
    enabled: !!user,
    initialPageParam: 0,
    staleTime: 30_000,
    getNextPageParam: (lastPage: NotificationItem[], allPages: NotificationItem[][]) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const from = pageParam * PAGE_SIZE;
      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,body,link,created_at,priority")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return (data ?? []) as NotificationItem[];
    },
  });

  const readsQuery = useQuery({
    queryKey: ["notification-reads", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((row) => row.notification_id as string);
    },
  });

  const items = useMemo(
    () => notificationsQuery.data?.pages.flat() ?? [],
    [notificationsQuery.data],
  );
  const readSet = useMemo(() => new Set(readsQuery.data ?? []), [readsQuery.data]);
  const unreadCount = items.filter((item) => !readSet.has(item.id)).length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const read = readSet.has(item.id);
      const category = categoryFor(item);
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !read) ||
        (filter === "read" && read) ||
        (filter === "jee" && category === "jee");
      const matchesSearch =
        !term || `${item.title} ${item.body ?? ""}`.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [items, readSet, filter, search]);

  const groups = useMemo(() => {
    const result: { title: string; items: NotificationItem[] }[] = [];
    for (const item of filtered) {
      const title = groupFor(item.created_at);
      let group = result.find((candidate) => candidate.title === title);
      if (!group) {
        group = { title, items: [] };
        result.push(group);
      }
      group.items.push(item);
    }
    return result;
  }, [filtered]);

  async function setRead(id: string, shouldRead: boolean) {
    if (!user) return;
    setBusyId(id);
    try {
      if (shouldRead) {
        const { error } = await supabase
          .from("notification_reads")
          .upsert(
            { notification_id: id, user_id: user.id },
            { onConflict: "notification_id,user_id" },
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_reads")
          .delete()
          .eq("notification_id", id)
          .eq("user_id", user.id);
        if (error) throw error;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notification-reads", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["notifications", user.id] }),
      ]);
      toast.success(shouldRead ? "Marked as read" : "Marked as unread");
    } catch (error) {
      console.error("Failed to update notification read status", error);
      toast.error("Couldn't update this notification. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    if (!user) return;
    setMarkingAll(true);
    try {
      const all: NotificationItem[] = [...items];
      let offset = all.length;
      while (true) {
        const { data, error } = await supabase
          .from("notifications")
          .select("id,title,body,link,created_at,priority")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);
        if (error) throw error;
        const batch = (data ?? []) as NotificationItem[];
        all.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        offset += batch.length;
      }
      const rows = all
        .filter((item) => !readSet.has(item.id))
        .map((item) => ({ notification_id: item.id, user_id: user.id }));
      for (let index = 0; index < rows.length; index += 100) {
        const { error } = await supabase
          .from("notification_reads")
          .upsert(rows.slice(index, index + 100), { onConflict: "notification_id,user_id" });
        if (error) throw error;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notification-reads", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["notifications", user.id] }),
      ]);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
      toast.error("Couldn't mark all notifications as read. Please try again.");
    } finally {
      setMarkingAll(false);
    }
  }

  async function openItem(item: NotificationItem) {
    if (item.link && /^https?:\/\//i.test(item.link)) {
      try {
        const url = new URL(item.link);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Invalid URL");
        window.open(url.href, "_blank", "noopener,noreferrer");
        if (!readSet.has(item.id)) void setRead(item.id, true);
      } catch {
        toast.error("This notification has an invalid link.");
      }
      return;
    }
    if (!item.link || !item.link.startsWith("/") || item.link.startsWith("//")) {
      if (!readSet.has(item.id)) void setRead(item.id, true);
      toast.info("This notification doesn't have a destination page yet.");
      return;
    }
    if (!readSet.has(item.id)) void setRead(item.id, true);
    try {
      await router.navigate({ to: item.link as never });
    } catch (error) {
      console.error("Notification navigation failed", error);
      toast.error("Couldn't open this page. It may have moved or been removed.");
    }
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Bell className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Your notifications</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to see your updates and community activity.
        </p>
        <Button asChild className="mt-5 rounded-full">
          <Link to="/auth">Sign in</Link>
        </Button>
      </main>
    );
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "read", label: "Read" },
    { id: "jee", label: "JEE alerts" },
  ];

  return (
    <>
      <style>{notificationsPageStyles}</style>
      <main className="notifications-page mx-auto w-full max-w-4xl px-3 pb-10 pt-4 sm:px-5 sm:pt-7">
        <div className="notifications-page-heading mb-5 flex items-center gap-3 sm:mb-7">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.history.back()}
            aria-label="Go back"
            className="h-10 w-10 shrink-0 rounded-2xl border-border/70 bg-card shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-primary">
              <Bell className="h-3.5 w-3.5" /> JEE Prep Hub
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread in the notifications loaded so far`
                : "You're all caught up. Here's your recent activity."}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh notifications"
            title="Refresh"
            className="h-10 w-10 shrink-0 rounded-2xl border-border/70 bg-card shadow-sm"
            onClick={() => {
              void notificationsQuery.refetch();
              void readsQuery.refetch();
            }}
          >
            <RefreshCw
              className={`h-4 w-4 ${notificationsQuery.isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        <section className="notifications-panel overflow-hidden rounded-[26px] border border-border/70 bg-card shadow-[0_18px_55px_-30px_rgba(15,23,42,.38)] sm:rounded-[30px]">
          <div className="notifications-panel-header border-b border-border/70 bg-gradient-to-br from-primary/[0.09] via-card to-sky-500/[0.045] p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-12 sm:w-12">
                {unreadCount > 0 ? (
                  <BellRing className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold">
                  {unreadCount ? "Stay in the loop" : "All caught up 🎉"}
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {items.length} loaded · Community, tests and study updates
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl"
                disabled={markingAll || unreadCount === 0}
                onClick={() => void markAllRead()}
              >
                {markingAll ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                <span className="hidden xs:inline">Mark all read</span>
                <span className="xs:hidden">Read all</span>
              </Button>
            </div>

            <div
              className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Filter notifications"
            >
              {filters.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === entry.id}
                  onClick={() => setFilter(entry.id)}
                  className={`notification-filter inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${filter === entry.id ? "is-active border-primary bg-primary text-primary-foreground shadow-sm" : "border-border/70 bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                >
                  {entry.id === "jee" && <Sparkles className="h-3.5 w-3.5" />}
                  {entry.label}
                  {entry.id === "unread" && unreadCount > 0 && (
                    <span className="rounded-full bg-background/20 px-1.5 py-0.5 text-[10px]">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notifications…"
                  className="h-11 rounded-2xl border-border/70 bg-background/80 pl-10 text-sm"
                />
                {search && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="hidden h-11 shrink-0 items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-3 text-xs text-muted-foreground sm:flex">
                <SlidersHorizontal className="h-4 w-4" /> Filter
              </div>
            </div>
          </div>

          {notificationsQuery.isLoading || readsQuery.isLoading ? (
            <div className="space-y-3 p-4 sm:p-6">
              {[0, 1, 2].map((value) => (
                <div
                  key={value}
                  className="flex animate-pulse gap-3 rounded-2xl border border-border/50 p-4"
                >
                  <div className="h-11 w-11 shrink-0 rounded-2xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-1/3 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : notificationsQuery.isError || readsQuery.isError ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <Inbox className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-bold">We couldn't load your notifications</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Check your connection and try again. Nothing has been deleted.
              </p>
              <Button
                className="mt-4 rounded-xl"
                onClick={() => {
                  void notificationsQuery.refetch();
                  void readsQuery.refetch();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Try again
              </Button>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center sm:py-16">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] border border-primary/10 bg-gradient-to-br from-primary/15 via-primary/5 to-sky-500/10 text-primary shadow-sm">
                <Bell className="h-9 w-9" />
                <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-4 border-card bg-emerald-500" />
              </div>
              <h3 className="mt-5 text-lg font-bold">
                {search
                  ? "No matching notifications"
                  : filter === "unread"
                    ? "You're all caught up!"
                    : filter === "read"
                      ? "No read notifications"
                      : filter === "jee"
                        ? "No JEE alerts yet"
                        : "No notifications yet"}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {search
                  ? "Try another search term or clear your search."
                  : "New community messages, test updates, achievements, and important notices will appear here."}
              </p>
              {(search || filter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
              {!search && filter === "all" && (
                <Button
                  className="mt-5 rounded-xl"
                  onClick={() => void router.navigate({ to: "/" as never })}
                >
                  Explore JEE Prep Hub <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div>
              {groups.map((group) => (
                <section key={group.title} aria-label={group.title}>
                  <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3 sm:px-6">
                    <h3 className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">
                      {group.title}
                    </h3>
                    {group.title === "Today" && unreadCount > 0 && (
                      <span className="text-[11px] font-semibold text-primary">
                        {unreadCount} unread loaded
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-border/60">
                    {group.items.map((item) => {
                      const isRead = readSet.has(item.id);
                      const Icon = iconFor(item);
                      const isPriority = categoryFor(item) === "jee";
                      return (
                        <article
                          key={item.id}
                          className={`group flex min-w-0 gap-3 px-3 py-4 transition-colors sm:gap-4 sm:px-6 ${!isRead ? "bg-primary/[0.025]" : ""} hover:bg-accent/30`}
                        >
                          <div
                            className={`relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12 ${toneFor(item)}`}
                          >
                            <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                            {!isRead && (
                              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => void openItem(item)}
                              className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <span
                                className={`block break-words text-sm leading-snug sm:text-[15px] ${isRead ? "font-medium text-foreground/90" : "font-bold text-foreground"}`}
                              >
                                {item.title}
                              </span>
                              {isPriority && (
                                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                                  <Flame className="h-3 w-3" /> JEE alert
                                </span>
                              )}
                              {item.body && (
                                <span className="mt-1.5 block break-words text-sm leading-relaxed text-muted-foreground">
                                  <LinkifiedText text={item.body} />
                                </span>
                              )}
                            </button>
                            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                              <time dateTime={item.created_at}>
                                {format(new Date(item.created_at), "MMM d · h:mm a")}
                              </time>
                              {item.link && (
                                <button
                                  type="button"
                                  onClick={() => void openItem(item)}
                                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                                >
                                  Open <ExternalLink className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            {!isRead && (
                              <span className="hidden rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary sm:inline-flex">
                                NEW
                              </span>
                            )}
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              title={isRead ? "Mark unread" : "Mark read"}
                              aria-label={
                                isRead ? "Mark notification unread" : "Mark notification read"
                              }
                              onClick={() => void setRead(item.id, !isRead)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-primary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              {busyId === item.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : isRead ? (
                                <CircleDot className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {notificationsQuery.hasNextPage && (
            <div className="border-t border-border/70 bg-muted/20 p-4 text-center sm:p-5">
              <Button
                variant="outline"
                className="w-full rounded-xl sm:w-auto"
                disabled={notificationsQuery.isFetchingNextPage}
                onClick={() => void notificationsQuery.fetchNextPage()}
              >
                {notificationsQuery.isFetchingNextPage ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading more…
                  </>
                ) : (
                  <>
                    Load more notifications <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </section>

        <p className="mx-auto mt-4 max-w-2xl px-3 text-center text-xs leading-relaxed text-muted-foreground">
          Notification links can stop working if their destination was removed or your access
          changed. Your notification history remains here.
        </p>
      </main>
    </>
  );
}
