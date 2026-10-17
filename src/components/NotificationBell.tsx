import { useCallback, useEffect, useMemo, useState } from "react";
import { LinkifiedText } from "@/components/LinkifiedText";
import {
  Bell,
  BellRing,
  Cake,
  Check,
  CheckCheck,
  ChevronRight,
  ExternalLink,
  FileText,
  Flame,
  MessageCircle,
  MoreVertical,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { haptic } from "@/lib/haptics";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import "./notification-popup.css";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  priority: string | null;
};

type Filter = "all" | "mentions" | "community" | "updates" | "follows";
type Style = "reference" | "compact" | "classic";

const STYLE_KEY = "jph-notification-style";
const STYLE_EVENT = "jph-notification-style-change";
const PAGE_SIZE = 20;

function isBirthdayNotification(item: NotificationItem) {
  return /birthday/i.test(`${item.title} ${item.body ?? ""}`);
}

function readStyle(): Style {
  try {
    const saved = localStorage.getItem(STYLE_KEY);
    return saved === "classic" || saved === "compact" ? saved : "reference";
  } catch {
    return "reference";
  }
}

function getKind(item: NotificationItem): "mention" | "community" | "update" | "follow" | "other" {
  const text = `${item.title} ${item.body ?? ""}`.toLowerCase();
  if (isBirthdayNotification(item)) return "community";
  if (/@you|mentioned you|mention/.test(text)) return "mention";
  if (/follow|profile/.test(text)) return "follow";
  if (/community|chat|message|reply|comment/.test(text)) return "community";
  if (/announcement|update|test|quiz|exam|notice|achievement|certificate/.test(text))
    return "update";
  return "other";
}

function KindIcon({ item }: { item: NotificationItem }) {
  if (isBirthdayNotification(item)) return <Cake className="h-5 w-5" />;
  const kind = getKind(item);
  if (kind === "mention") return <MessageCircle className="h-5 w-5" />;
  if (kind === "community") return <MessageCircle className="h-5 w-5" />;
  if (kind === "follow") return <UserRound className="h-5 w-5" />;
  if (kind === "update") return <FileText className="h-5 w-5" />;
  return item.priority === "high" ? <Flame className="h-5 w-5" /> : <Bell className="h-5 w-5" />;
}

function kindClass(item: NotificationItem) {
  if (isBirthdayNotification(item)) return "notification-kind-amber";
  const kind = getKind(item);
  if (kind === "mention") return "notification-kind-purple";
  if (kind === "community") return "notification-kind-blue";
  if (kind === "follow") return "notification-kind-green";
  if (kind === "update") return "notification-kind-amber";
  if (item.priority === "high") return "notification-kind-red";
  return "notification-kind-blue";
}

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [style, setStyle] = useState<Style>(() => readStyle());
  const [menuId, setMenuId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setStyle(readStyle());
    window.addEventListener(STYLE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STYLE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const query = useInfiniteQuery<NotificationItem[]>({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    queryFn: async ({ pageParam }) => {
      const from = Number(pageParam) * PAGE_SIZE;
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

  const readQuery = useQuery({
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

  const notifications = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);
  const readSet = useMemo(() => new Set(readQuery.data ?? []), [readQuery.data]);
  const unreadCount = notifications.filter((item) => !readSet.has(item.id)).length;

  const filtered = useMemo(
    () =>
      notifications.filter((item) => {
        const kind = getKind(item);
        if (filter === "mentions") return kind === "mention";
        if (filter === "community") return kind === "community";
        if (filter === "updates") return kind === "update" || kind === "other";
        if (filter === "follows") return kind === "follow";
        return true;
      }),
    [notifications, filter],
  );

  const markRead = useCallback(
    async (id: string, read = true) => {
      if (!user) return;
      try {
        if (read) {
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
        await queryClient.invalidateQueries({ queryKey: ["notification-reads", user.id] });
        toast.success(read ? "Notification marked as read" : "Marked as unread");
      } catch (error) {
        console.error("Notification read state update failed", error);
        toast.error("Couldn't update this notification. Please try again.");
      }
    },
    [user, queryClient],
  );

  async function markAllRead() {
    if (!user) return;
    try {
      // Read every page visible under the user's existing RLS policy.
      const all: NotificationItem[] = [...notifications];
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
      for (let i = 0; i < rows.length; i += 100) {
        const { error } = await supabase
          .from("notification_reads")
          .upsert(rows.slice(i, i + 100), { onConflict: "notification_id,user_id" });
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["notification-reads", user.id] });
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Mark all read failed", error);
      toast.error("Couldn't mark all notifications as read.");
    }
  }

  async function openNotification(item: NotificationItem) {
    setMenuId(null);
    if (item.link && /^https?:\/\//i.test(item.link)) {
      try {
        const url = new URL(item.link);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid protocol");
        window.open(url.href, "_blank", "noopener,noreferrer");
        if (!readSet.has(item.id)) void markRead(item.id, true);
      } catch {
        toast.error("This notification has an invalid destination.");
      }
      return;
    }
    if (!item.link || !item.link.startsWith("/") || item.link.startsWith("//")) {
      if (!readSet.has(item.id)) void markRead(item.id, true);
      toast.info("This notification doesn't have a page link yet.");
      return;
    }
    setOpen(false);
    if (!readSet.has(item.id)) void markRead(item.id, true);
    try {
      await router.navigate({ to: item.link as never });
    } catch (error) {
      console.error("Notification navigation failed", error);
      toast.error("Couldn't open that page. It may have moved or been removed.");
    }
  }

  if (!user) return null;

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "mentions", label: "Mentions" },
    { id: "community", label: "Community" },
    { id: "updates", label: "Updates" },
    { id: "follows", label: "Follows" },
  ];

  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) haptic("selection");
      }}
    >
      <PopoverTrigger
        aria-label="Notifications"
        aria-expanded={open}
        className="nav-glass-btn relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-red-500" />
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={`notification-popup ${style === "reference" ? "notification-popup-reference" : style === "compact" ? "notification-popup-compact" : "notification-popup-classic"} w-[calc(100vw-1.5rem)] max-h-[68dvh] overflow-hidden p-0`}
      >
        <header className="notification-popup-header">
          <div className="notification-popup-title-row">
            <div className="notification-main-icon">
              <BellRing className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h2>Notifications</h2>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                  : "All caught up 🎉"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="notification-mark-all"
              onClick={() => void markAllRead()}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark all read</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close notifications"
              className="notification-close"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="notification-tabs" role="tablist" aria-label="Notification categories">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={`notification-tab ${filter === tab.id ? "is-active" : ""}`}
              >
                {tab.label}
                {tab.id === "all" && (
                  <span className="notification-tab-count">{notifications.length}</span>
                )}
              </button>
            ))}
          </div>
        </header>

        <div className="notification-popup-list">
          {query.isLoading || readQuery.isLoading ? (
            <div className="notification-state">Loading notifications…</div>
          ) : query.isError || readQuery.isError ? (
            <div className="notification-state">
              <Bell className="mb-2 h-7 w-7" />
              <strong>Couldn't load notifications</strong>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-full"
                onClick={() => {
                  void query.refetch();
                  void readQuery.refetch();
                }}
              >
                Try again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="notification-state">
              <Bell className="mb-2 h-7 w-7" />
              <strong>No notifications here</strong>
              <span>New activity will appear here.</span>
            </div>
          ) : (
            filtered.map((item) => {
              const isRead = readSet.has(item.id);
              return (
                <article
                  key={item.id}
                  className={`notification-item ${!isRead ? "is-unread" : ""}`}
                >
                  <div className={`notification-item-icon ${kindClass(item)}`}>
                    <KindIcon item={item} />
                  </div>
                  <div className="notification-item-content">
                    <button
                      type="button"
                      className="notification-item-open"
                      onClick={() => void openNotification(item)}
                    >
                      <span className="notification-item-title">{item.title}</span>
                      {item.body && (
                        <span className="notification-item-body">
                          <LinkifiedText text={item.body} />
                        </span>
                      )}
                    </button>
                    <div className="notification-item-meta">
                      <span>
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                      {item.link && (
                        <button
                          type="button"
                          onClick={() => void openNotification(item)}
                          className="notification-open-link"
                        >
                          Open <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="notification-item-actions">
                    {!isRead && <span className="notification-unread-dot" title="Unread" />}
                    <button
                      type="button"
                      aria-label="Notification options"
                      title="Notification options"
                      className="notification-more"
                      onClick={() => setMenuId(menuId === item.id ? null : item.id)}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {menuId === item.id && (
                      <div className="notification-action-menu">
                        <button
                          type="button"
                          onClick={() => {
                            void markRead(item.id, !isRead);
                            setMenuId(null);
                          }}
                        >
                          {isRead ? <Bell className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          Mark as {isRead ? "unread" : "read"}
                        </button>
                        {item.link && (
                          <button type="button" onClick={() => void openNotification(item)}>
                            <ExternalLink className="h-4 w-4" /> Open notification
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <footer className="notification-popup-footer">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void router.navigate({ to: "/notifications" as never });
            }}
            className="notification-view-all"
          >
            <span className="notification-view-all-icon">
              <Users className="h-5 w-5" />
            </span>
            <span>View all notifications</span>
            <ChevronRight className="ml-auto h-6 w-6" />
          </button>
          {query.hasNextPage && (
            <button
              type="button"
              className="notification-load-more"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? "Loading…" : "Load more in popup"}
            </button>
          )}
          <p className="notification-style-hint">
            Style: {style === "reference" ? "Modern" : style === "compact" ? "Compact" : "Classic"}{" "}
            · Change this in Settings
          </p>
        </footer>
      </PopoverContent>
    </Popover>
  );
}
