
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { OnlineDot } from "@/components/OnlineDot";
import {
  Search,
  MessageCircle,
  Users,
  Inbox,
  ChevronRight,
  Plus,
  UserRound,
  MoreHorizontal,
  MailOpen,
  Mail,
} from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";

export const Route = createFileRoute("/_authenticated/messages/")({
  head: () => ({
    meta: [
      { property: "og:description", content: "Your direct messages and joined study groups in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Squad — JEE Prep Hub" },
      { name: "twitter:description", content: "Your direct messages and joined study groups in one place." },

      { title: "Squad — JEE Prep Hub" },
      {
        name: "description",
        content: "Your direct messages and joined study groups in one place.",
      },
      {
        property: "og:title",
        content: "Squad — JEE Prep Hub",
      },
    ],
  }),
  component: SquadInbox,
  errorComponent: ({ error }: { error: unknown }) => (
    <div className="p-6 text-sm text-destructive">{(error instanceof Error ? error.message : String(error))}</div>
  ),
});

type Tab = "all" | "direct" | "groups" | "requests";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type DMConversation = {
  peer_id: string;
  last_message: string;
  last_at: string;
  last_sender: string;
  unread: number;
  profile?: Profile;
};

type GroupItem = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  privacy: string | null;
  communityName: string | null;
  unread: number;
  lastBody: string | null;
  lastSender: string | null;
  lastAt: string | null;
};function timeAgo(iso: string | null) {
  if (!iso) return "";

  const seconds = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 1000,
  );

  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;

  return `${Math.floor(seconds / 86400)}d`;
}

function initials(name: string | null | undefined) {
  if (!name) return "?";

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");
}

function groupInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");
}

function categoryStyle(category: string | null) {
  switch (category) {
    case "subject":
      return "from-sky-500 to-blue-600";

    case "goal":
      return "from-amber-500 to-orange-600";

    case "social":
      return "from-fuchsia-500 to-purple-600";

    case "batch":
      return "from-emerald-500 to-teal-600";

    default:
      return "from-primary to-primary/70";
  }
}

function SquadInbox() {
  const qc = useQueryClient();

  const [me, setMe] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMe(data.user?.id ?? null);
    });
  }, []);
  const conversations = useQuery({
    queryKey: ["squad-dm-conversations"],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_dm_conversations");

      if (error) throw error;

      const rows = data ?? [];
      const peerIds = rows.map((row: any) => row.peer_id);

      if (!peerIds.length) {
        return [] as DMConversation[];
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", peerIds);

      const profileMap = new Map(
        (profiles ?? []).map((profile) => [profile.id, profile]),
      );

      return rows.map((row: any) => ({
        ...row,
        profile: profileMap.get(row.peer_id),
      })) as DMConversation[];
    },
  });

  const groups = useQuery({
    queryKey: ["squad-joined-groups", me],
    enabled: !!me,
    queryFn: async () => {
      if (!me) return [] as GroupItem[];

      const { data: memberships, error: membershipError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", me);

      if (membershipError) throw membershipError;

      const groupIds = (memberships ?? []).map(
        (row) => row.group_id,
      );

      if (!groupIds.length) {
        return [] as GroupItem[];
      }

      const [
        { data: groupRows, error: groupError },
        { data: communities },
      ] = await Promise.all([
        supabase
          .from("groups")
          .select(
            "id, name, description, category, privacy, community_id",
          )
          .in("id", groupIds)
          .order("created_at", { ascending: false }),

        supabase
          .from("communities")
          .select("id, name"),
      ]);

      if (groupError) throw groupError;

      const communityMap = new Map(
        (communities ?? []).map((community) => [
          community.id,
          community.name,
        ]),
      );

      const { data: recentMessages } = await supabase
        .from("study_group_messages")
        .select(
          "group_id, user_id, body, created_at, attachment_name",
        )
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })
        .limit(400);

      const lastByGroup = new Map<string, any>();

      for (const message of recentMessages ?? []) {
        if (!lastByGroup.has(message.group_id)) {
          lastByGroup.set(message.group_id, message);
        }
      }

      const senderIds = [
        ...new Set(
          (recentMessages ?? []).map(
            (message) => message.user_id,
          ),
        ),
      ];

      const { data: senderProfiles } = senderIds.length
        ? await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", senderIds)
        : { data: [] };

      const senderMap = new Map(
        (senderProfiles ?? []).map((profile) => [
          profile.id,
          profile.full_name,
        ]),
      );

      const { data: unreadRows } = await supabase.rpc(
        "get_squad_unread_counts",
        {
          p_user_id: me,
        },
      );

      const unreadMap = new Map<string, number>();

      for (const row of unreadRows ?? []) {
        unreadMap.set(
          row.group_id,
          Number(row.unread_count),
        );
      }

      return (groupRows ?? []).map((group) => {
        const last = lastByGroup.get(group.id);

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          category: group.category,
          privacy: group.privacy,

          communityName: group.community_id
            ? communityMap.get(group.community_id) ?? null
            : null,

          unread: unreadMap.get(group.id) ?? 0,

          lastBody: last
            ? last.body ??
              (last.attachment_name
                ? `📎 ${last.attachment_name}`
                : null)
            : null,

          lastSender: last
            ? senderMap.get(last.user_id) ?? "Member"
            : null,

          lastAt: last?.created_at ?? null,
        } as GroupItem;
      });
    },
  });
  const conversationStates = useQuery({
    queryKey: ["squad-conversation-states", me],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("squad_conversation_states")
        .select("conversation_type, conversation_id, marked_unread")
        .eq("user_id", me);
      if (error) throw error;
      return (data ?? []) as Array<{
        conversation_type: "dm" | "group";
        conversation_id: string;
        marked_unread: boolean;
      }>;
    },
  });

  const search = useQuery({
    queryKey: ["squad-user-search", query],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const username = query
        .trim()
        .replace(/^@/, "")
        .toLowerCase();

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("username", username)
        .limit(5);

      return (data ?? []).filter(
        (profile) => profile.id !== me,
      );
    },
  });

  useEffect(() => {
    if (!me) return;

    const channel = supabase
      .channel(`squad-inbox-${me}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
        },
        () => {
          qc.invalidateQueries({
            queryKey: ["squad-dm-conversations"],
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_group_messages",
        },
        () => {
          qc.invalidateQueries({
            queryKey: ["squad-joined-groups", me],
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "squad_conversation_states",
          filter: `user_id=eq.${me}`,
        },
        () => {
          qc.invalidateQueries({
            queryKey: ["squad-conversation-states", me],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, qc]);
  const stateMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const state of conversationStates.data ?? []) {
      map.set(`${state.conversation_type}:${state.conversation_id}`, state.marked_unread);
    }
    return map;
  }, [conversationStates.data]);

  const direct = useMemo(
    () =>
      (conversations.data ?? []).map((conversation) => ({
        ...conversation,
        unread: stateMap.get(`dm:${conversation.peer_id}`)
          ? Math.max(1, conversation.unread ?? 0)
          : conversation.unread,
      })),
    [conversations.data, stateMap],
  );
  const joinedGroups = useMemo(
    () =>
      (groups.data ?? []).map((group) => ({
        ...group,
        unread: stateMap.get(`group:${group.id}`) ? Math.max(1, group.unread ?? 0) : group.unread,
      })),
    [groups.data, stateMap],
  );

  const changeConversationReadState = async (
    type: "dm" | "group",
    id: string,
    markUnread: boolean,
  ) => {
    if (!me) return;
    const stateKey = `${type}:${id}`;
    const previousStates = conversationStates.data ?? [];
    const previousDirect = conversations.data;
    const previousGroups = groups.data;

    const nextStates = markUnread
      ? [
          ...previousStates.filter(
            (state) => `${state.conversation_type}:${state.conversation_id}` !== stateKey,
          ),
          { conversation_type: type, conversation_id: id, marked_unread: true },
        ]
      : previousStates.filter(
          (state) => `${state.conversation_type}:${state.conversation_id}` !== stateKey,
        );
    qc.setQueryData(["squad-conversation-states", me], nextStates);

    if (type === "dm") {
      qc.setQueryData(
        ["squad-dm-conversations"],
        (previousDirect ?? []).map((conversation) =>
          conversation.peer_id === id
            ? { ...conversation, unread: markUnread ? Math.max(1, conversation.unread ?? 0) : 0 }
            : conversation,
        ),
      );
    } else {
      qc.setQueryData(
        ["squad-joined-groups", me],
        (previousGroups ?? []).map((group) =>
          group.id === id
            ? { ...group, unread: markUnread ? Math.max(1, group.unread ?? 0) : 0 }
            : group,
        ),
      );
    }

    try {
      const db = supabase as any;
      if (markUnread) {
        const { error } = await db.from("squad_conversation_states").upsert(
          {
            user_id: me,
            conversation_type: type,
            conversation_id: id,
            marked_unread: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,conversation_type,conversation_id" },
        );
        if (error) throw error;
      } else {
        if (type === "dm") {
          const { error } = await supabase
            .from("direct_messages")
            .update({ read_at: new Date().toISOString() })
            .eq("sender_id", id)
            .eq("recipient_id", me)
            .is("read_at", null);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("group_members")
            .update({ last_read_at: new Date().toISOString() })
            .eq("group_id", id)
            .eq("user_id", me);
          if (error) throw error;
        }
        const { error } = await db
          .from("squad_conversation_states")
          .delete()
          .eq("user_id", me)
          .eq("conversation_type", type)
          .eq("conversation_id", id);
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["squad-conversation-states", me] });
      qc.invalidateQueries({ queryKey: ["squad-dm-conversations"] });
      qc.invalidateQueries({ queryKey: ["squad-joined-groups", me] });
    } catch (error) {
      qc.invalidateQueries({ queryKey: ["squad-conversation-states", me] });
      qc.invalidateQueries({ queryKey: ["squad-dm-conversations"] });
      qc.invalidateQueries({ queryKey: ["squad-joined-groups", me] });
      console.error("Unable to update Squad read state", error);
    }
  };


  const requests = direct.filter(
    (conversation) =>
      conversation.last_sender !== me &&
      conversation.unread > 0,
  );

  const filteredDMs = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q || q.startsWith("@")) {
      return direct;
    }

    return direct.filter((conversation) =>
      conversation.profile?.full_name
        ?.toLowerCase()
        .includes(q),
    );
  }, [direct, query]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return joinedGroups;
    }

    return joinedGroups.filter(
      (group) =>
        group.name.toLowerCase().includes(q) ||
        group.communityName
          ?.toLowerCase()
          .includes(q),
    );
  }, [joinedGroups, query]);

  const totalUnread =
    direct.reduce(
      (sum, conversation) =>
        sum + (conversation.unread ?? 0),
      0,
    ) +
    joinedGroups.reduce(
      (sum, group) =>
        sum + (group.unread ?? 0),
      0,
    );
  return (
    <div className="dm-page min-h-screen bg-background">

      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-5 sm:px-7 sm:pt-8 lg:px-10">
        <GlassSurface className="overflow-hidden">
          {/* Header */}
          <div className="border-b border-border/60 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold tracking-tight">
                    Squad
                  </h1>

                  {totalUnread > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                      {totalUnread}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Your conversations and study groups in one place.
                </p>
              </div>

              <Link
                to="/friends"
                aria-label="Start a new conversation"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <Plus className="h-5 w-5" />
              </Link>
            </div>

            {/* Search */}
            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search people or groups..."
                className="pl-9"
              />
            </div>

            {/* Tabs */}
            <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1">
              {[
                {
                  id: "all" as const,
                  label: "All",
                  icon: Inbox,
                },
                {
                  id: "direct" as const,
                  label: "Direct",
                  icon: MessageCircle,
                },
                {
                  id: "groups" as const,
                  label: "Groups",
                  icon: Users,
                },
                {
                  id: "requests" as const,
                  label: "Requests",
                  icon: UserRound,
                },
              ].map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition sm:text-sm ${
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="divide-y divide-border/60">
            {query.trim().startsWith("@") &&
            search.data &&
            search.data.length > 0 ? (
              <div className="p-3">
                <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  People
                </div>

                {search.data.map((profile) => (
                  <PersonRow
                    key={profile.id}
                    profile={profile}
                  />
                ))}
              </div>
            ) : (
              <>
                {(tab === "all" || tab === "direct") && (
                  <ConversationSection
                    title="Direct Messages"
                    icon={<MessageCircle className="h-4 w-4" />}
                    count={filteredDMs.length}
                  >
                    {filteredDMs.length > 0 ? (
                      filteredDMs.map((conversation) => (
                        <DMRow
                          key={conversation.peer_id}
                          conversation={conversation}
                          onMarkReadState={(markUnread) => void changeConversationReadState("dm", conversation.peer_id, markUnread)}
                        />
                      ))
                    ) : (
                      <EmptyState message="No direct conversations yet." />
                    )}
                  </ConversationSection>
                )}

                {(tab === "all" || tab === "groups") && (
                  <ConversationSection
                    title="Joined Groups"
                    icon={<Users className="h-4 w-4" />}
                    count={filteredGroups.length}
                  >
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((group) => (
                        <GroupRow
                          key={group.id}
                          group={group}
                          onMarkReadState={(markUnread) => void changeConversationReadState("group", group.id, markUnread)}
                        />
                      ))
                    ) : (
                      <EmptyState message="You haven't joined any study groups yet." />
                    )}
                  </ConversationSection>
                )}

                {tab === "requests" && (
                  <ConversationSection
                    title="Requests"
                    icon={<UserRound className="h-4 w-4" />}
                    count={requests.length}
                  >
                    {requests.length > 0 ? (
                      requests.map((conversation) => (
                        <DMRow
                          key={conversation.peer_id}
                          conversation={conversation}
                          onMarkReadState={(markUnread) => void changeConversationReadState("dm", conversation.peer_id, markUnread)}
                        />
                      ))
                    ) : (
                      <EmptyState message="No pending message requests." />
                    )}
                  </ConversationSection>
                )}
              </>
            )}
          </div>
        </GlassSurface>
      </main>
    </div>
  );
}
function ConversationSection({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          <span>{title}</span>

          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {count}
          </span>
        </div>
      </div>

      <div>{children}</div>
    </section>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="px-6 py-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
function ConversationMenu({
  open,
  onOpenChange,
  unread,
  onMarkReadState,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unread: number;
  onMarkReadState: (markUnread: boolean) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [onOpenChange, open]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Conversation options"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          onOpenChange(!open);
        }}
        className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
          <button
            type="button"
            onClick={() => {
              onMarkReadState(unread === 0);
              onOpenChange(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition hover:bg-muted"
          >
            {unread > 0 ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
            {unread > 0 ? "Mark as read" : "Mark as unread"}
          </button>
        </div>
      )}
    </div>
  );
}

function useLongPress(onLongPress: () => void) {
  const timer = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const start = () => {
    timer.current = window.setTimeout(() => {
      suppressClick.current = true;
      onLongPress();
    }, 550);
  };
  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  const click = (event: React.MouseEvent) => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  };
  return { start, cancel, click };
}

function DMRow({
  conversation,
  onMarkReadState,
}: {
  conversation: DMConversation;
  onMarkReadState: (markUnread: boolean) => void;
}) {
  const profile = conversation.profile;
  const name = profile?.full_name || "Unknown user";
  const [menuOpen, setMenuOpen] = useState(false);
  const longPress = useLongPress(() => setMenuOpen(true));

  return (
    <div className="relative flex items-center gap-1 px-4 py-2 transition hover:bg-muted/50 sm:px-6">
      <Link
        to="/messages/$peerId"
        params={{ peerId: conversation.peer_id }}
        onPointerDown={longPress.start}
        onPointerUp={longPress.cancel}
        onPointerCancel={longPress.cancel}
        onClick={longPress.click}
        onContextMenu={(event) => {
          event.preventDefault();
          setMenuOpen(true);
        }}
        className={`flex min-w-0 flex-1 items-center gap-3 py-1 ${conversation.unread > 0 ? "font-semibold" : ""}`}
      >
        <div className="relative shrink-0">
          <Avatar className="h-11 w-11">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          <OnlineDot userId={conversation.peer_id} className="absolute bottom-0 right-0" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`truncate text-sm ${conversation.unread > 0 ? "font-bold text-foreground" : "font-semibold"}`}
            >
              {name}
            </p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {timeAgo(conversation.last_at)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p
              className={`truncate text-sm text-muted-foreground ${conversation.unread > 0 ? "font-semibold text-foreground" : ""}`}
            >
              {conversation.last_message || "Start a conversation"}
            </p>
            {conversation.unread > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {conversation.unread > 99 ? "99+" : conversation.unread}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
      </Link>
      <ConversationMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        unread={conversation.unread}
        onMarkReadState={onMarkReadState}
      />
    </div>
  );
}

function GroupRow({
  group,
  onMarkReadState,
}: {
  group: GroupItem;
  onMarkReadState: (markUnread: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const longPress = useLongPress(() => setMenuOpen(true));

  return (
    <div className="relative flex items-center gap-1 px-4 py-2 transition hover:bg-muted/50 sm:px-6">
      <Link
        to="/squad/$groupId"
        params={{ groupId: group.id }}
        onPointerDown={longPress.start}
        onPointerUp={longPress.cancel}
        onPointerCancel={longPress.cancel}
        onClick={longPress.click}
        onContextMenu={(event) => {
          event.preventDefault();
          setMenuOpen(true);
        }}
        className={`flex min-w-0 flex-1 items-center gap-3 py-1 ${group.unread > 0 ? "font-semibold" : ""}`}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${categoryStyle(group.category)} text-sm font-bold text-white shadow-sm`}
        >
          {groupInitials(group.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p
                className={`truncate text-sm ${group.unread > 0 ? "font-bold text-foreground" : "font-semibold"}`}
              >
                {group.name}
              </p>
              {group.communityName && (
                <p className="truncate text-[11px] text-muted-foreground">{group.communityName}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(group.lastAt)}</span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p
              className={`truncate text-sm text-muted-foreground ${group.unread > 0 ? "font-semibold text-foreground" : ""}`}
            >
              {group.lastBody
                ? group.lastSender
                  ? `${group.lastSender}: ${group.lastBody}`
                  : group.lastBody
                : group.description || "No messages yet"}
            </p>
            {group.unread > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {group.unread > 99 ? "99+" : group.unread}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
      </Link>
      <ConversationMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        unread={group.unread}
        onMarkReadState={onMarkReadState}
      />
    </div>
  );
}
function PersonRow({
  profile,
}: {
  profile: Profile;
}) {
  const name = profile.full_name || "Unknown user";

  return (
    <Link
      to="/messages/$peerId"
      params={{ peerId: profile.id }}
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-muted/50"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={profile.avatar_url ?? undefined} />
        <AvatarFallback>
          {initials(name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {name}
        </p>

        <p className="text-xs text-muted-foreground">
          Start a direct conversation
        </p>
      </div>

      <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}