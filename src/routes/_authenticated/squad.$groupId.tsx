/* eslint-disable @typescript-eslint/no-explicit-any */
import { LinkifiedText } from "@/components/LinkifiedText";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminBadge } from "@/components/AdminBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QrCodeDialog } from "@/components/QrCodeDialog";
import {
  ArrowLeft,
  Send,
  Trash2,
  Users,
  Crown,
  Paperclip,
  FileText,
  Download,
  Shield,
  ShieldOff,
  UserMinus,
  Link2,
  Settings,
  X,
  LogOut,
  Bell,
  BellOff,
  BellRing,
  QrCode,
  Info,
  Pencil,
  Save,
  MoreVertical,
  Camera,
  UserPlus,
  Search,
  Volume2,
  VolumeX,
  Share2,
  MessageCircle,
  UserRound,
  Check,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import {
  useMessageActions,
  MessageActionSheet,
  MessageReactionChips,
  ReplyBanner,
  useStoredMessageReactions,
  withQuote,
  type MessageActionTarget,
} from "@/components/message-actions";

export const Route = createFileRoute("/_authenticated/squad/$groupId")({
  head: () => ({ meta: [
      { name: "description", content: "Connect with your study squad in a shared group conversation." },
      { property: "og:title", content: "Squad Chat — JEE Prep Hub" },
      { property: "og:description", content: "Connect with your study squad in a shared group conversation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Squad Chat — JEE Prep Hub" },
      { name: "twitter:description", content: "Connect with your study squad in a shared group conversation." },
{ title: "Squad Chat — JEE Prep Hub" }] }),
  component: SquadChatPage,
});

type Msg = {
  id: string;
  user_id: string;
  body: string | null;
  created_at: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  type?: "text" | "system" | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  deleted_for_everyone?: boolean;
};
type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  verified?: boolean | null;
};
type Group = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  invite_code: string;
  invite_slug: string | null;
  privacy?: "open" | "request" | null;
  community_id?: string | null;
};
type GroupSettings = {
  disappearing_messages: boolean;
  disappearing_days: number;
  who_can_send: "everyone" | "admins";
  who_can_edit: "everyone" | "admins";
};
type SquadMember = {
  user_id: string;
  role: "member" | "admin" | "owner";
  profile: Profile | null;
  is_global_admin: boolean;
};

const PAGE = 200;
const MAX_LEN = 2000;
const MAX_FILE = 15 * 1024 * 1024; // 15 MB

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
    : d.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
}

function fileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SquadChatPage() {
  const { groupId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [myRole, setMyRole] = useState<"member" | "admin" | "owner">("member");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [editingMessage, setEditingMessage] = useState<Msg | null>(null);
  const actions = useMessageActions();
  const [replyTo, setReplyTo] = useState<MessageActionTarget | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoClosing, setInfoClosing] = useState(false);
  const [infoMenuOpen, setInfoMenuOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberMenuId, setMemberMenuId] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMode, setNotifyMode] = useState<"all" | "important" | "muted">("all");
  const [savingNotify, setSavingNotify] = useState(false);
  const squadMessageIds = useMemo(() => messages.map((message) => message.id), [messages]);
  const squadReactions = useStoredMessageReactions(
    "study_group_message_reactions",
    squadMessageIds,
    user.id,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stickRef = useRef(true);

  const isOwner = group?.owner_id === user.id;
  const isSquadAdmin = isOwner || myRole === "admin" || myRole === "owner";

  const loadProfiles = async (ids: string[]) => {
    const missing = Array.from(new Set(ids)).filter((id) => id && !profiles[id]);
    if (missing.length === 0) return;
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url, verified").in("id", missing),
      supabase.from("user_roles").select("user_id").eq("role", "admin").in("user_id", missing),
    ]);
    if (profs) {
      setProfiles((prev) => {
        const n = { ...prev };
        for (const p of profs) n[p.id] = p as Profile;
        return n;
      });
    }
    if (roles?.length) {
      setAdmins((prev) => {
        const n = new Set(prev);
        for (const r of roles) n.add(r.user_id as string);
        return n;
      });
    }
  };

  const refreshMembers = async () => {
    const { data: mem } = await supabase
      .from("group_members")
      .select("user_id, role")
      .eq("group_id", groupId);
    const ids = (mem ?? []).map((m) => m.user_id);
    if (ids.length === 0) {
      setSquadMembers([]);
      return;
    }
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url, verified").in("id", ids),
      supabase.from("user_roles").select("user_id").eq("role", "admin").in("user_id", ids),
    ]);
    const pmap = new Map((profs ?? []).map((p) => [p.id, p as Profile]));
    const aset = new Set((roles ?? []).map((r) => r.user_id as string));
    setSquadMembers(
      (mem ?? []).map((m) => ({
        user_id: m.user_id,
        role: (m.role ?? "member") as SquadMember["role"],
        profile: pmap.get(m.user_id) ?? null,
        is_global_admin: aset.has(m.user_id),
      })),
    );
  };

  const ensureSignedUrl = async (path: string) => {
    if (signedUrls[path]) return signedUrls[path];
    const { data } = await supabase.storage.from("squad-files").createSignedUrl(path, 60 * 60);
    if (data?.signedUrl) {
      setSignedUrls((prev) => ({ ...prev, [path]: data.signedUrl }));
      return data.signedUrl;
    }
    return null;
  };

  const markRead = async () => {
    await supabase
      .from("group_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("group_id", groupId)
      .eq("user_id", user.id);
    type DeleteQuery = {
      eq: (column: string, value: unknown) => DeleteQuery;
      then: Promise<unknown>["then"];
    };
    const conversationStates = supabase as unknown as {
      from: (table: string) => { delete: () => DeleteQuery };
    };
    await conversationStates
      .from("squad_conversation_states")
      .delete()
      .eq("user_id", user.id)
      .eq("conversation_type", "group")
      .eq("conversation_id", groupId);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [{ data: g }, { data: mine }] = await Promise.all([
        supabase
          .from("groups")
          .select(
            "id, name, description, owner_id, invite_code, invite_slug, privacy, community_id",
          )
          .eq("id", groupId)
          .maybeSingle(),
        supabase
          .from("group_members")
          .select("user_id, role")
          .eq("group_id", groupId)
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (!active) return;
      if (!g) {
        toast.error("Squad not found");
        navigate({ to: "/groups" });
        return;
      }
      setGroup(g as Group);
      const member = !!mine;
      setIsMember(member);
      setMyRole((mine?.role ?? "member") as "member" | "admin" | "owner");
      if (!member) {
        setLoading(false);
        return;
      }

      await refreshMembers();

      const { data: msgs, error: e } = await (supabase.from("study_group_messages") as any)
        .select(
          "id, user_id, body, created_at, attachment_path, attachment_name, attachment_type, attachment_size, type, edited_at, deleted_at, deleted_for_everyone",
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(PAGE);
      if (e) setError(e.message);
      const ordered = (msgs ?? []).slice().reverse() as Msg[];
      setMessages(ordered);
      setLoading(false);
      await loadProfiles([...ordered.map((m) => m.user_id), g.owner_id, user.id]);
      ordered.filter((m) => m.attachment_path).forEach((m) => ensureSignedUrl(m.attachment_path!));
      markRead();
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, user.id]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("squad_notification_prefs")
        .select("mode")
        .eq("user_id", user.id)
        .eq("group_id", groupId)
        .maybeSingle();
      if (!active) return;
      if (data?.mode) setNotifyMode(data.mode as "all" | "important" | "muted");
    })();
    return () => {
      active = false;
    };
  }, [groupId, user.id]);

  const [settings, setSettings] = useState<GroupSettings | null>(null);
  const [community, setCommunity] = useState<{ id: string; name: string } | null>(null);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("group_settings")
        .select("disappearing_messages, disappearing_days, who_can_send, who_can_edit")
        .eq("group_id", groupId)
        .maybeSingle();
      if (active && data) setSettings(data as GroupSettings);
    })();
    return () => {
      active = false;
    };
  }, [groupId]);

  useEffect(() => {
    let active = true;
    if (!group?.community_id) return;
    (async () => {
      const { data } = await supabase
        .from("communities")
        .select("id, name")
        .eq("id", group.community_id!)
        .maybeSingle();
      if (active && data) setCommunity(data as { id: string; name: string });
    })();
    return () => {
      active = false;
    };
  }, [group?.community_id]);

  const canSendMessages = settings?.who_can_send !== "admins" || isSquadAdmin;

  const patchSettings = async (patch: Partial<GroupSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    haptic("selection");
    const { error: e } = await supabase
      .from("group_settings")
      .upsert({ group_id: groupId, ...next }, { onConflict: "group_id" });
    if (e) {
      toast.error(e.message);
      setSettings(settings);
    }
  };

  const reportGroup = async () => {
    setReporting(true);
    const { error: e } = await supabase
      .from("group_reports")
      .insert({ group_id: groupId, reported_by: user.id });
    setReporting(false);
    if (e) return toast.error(e.message);
    toast.success("Reported to admins. Thanks for flagging it.");
  };

  const exitGroup = async () => {
    if (!confirm("Leave this group? You can rejoin with an invite link.")) return;
    const { error: e } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);
    if (e) return toast.error(e.message);
    toast.success("You left the group");
    navigate({ to: "/groups" });
  };

  const saveNotifyMode = async (mode: "all" | "important" | "muted") => {
    setSavingNotify(true);
    setNotifyMode(mode);
    haptic("selection");
    const { error: e } = await supabase
      .from("squad_notification_prefs")
      .upsert({ user_id: user.id, group_id: groupId, mode, updated_at: new Date().toISOString() });
    setSavingNotify(false);
    if (e) {
      toast.error("Couldn't save preference");
      haptic("error");
      return;
    }
    toast.success(
      mode === "muted"
        ? "Squad muted"
        : mode === "important"
          ? "Important only"
          : "All messages on",
    );
    haptic("success");
  };

  const saveDescription = async () => {
    if (!group) return;
    setSavingDesc(true);
    const trimmed = descDraft.trim().slice(0, 500);
    const { error: err } = await supabase
      .from("groups")
      .update({ description: trimmed || null })
      .eq("id", groupId);
    setSavingDesc(false);
    if (err) {
      toast.error(err.message);
      haptic("error");
      return;
    }
    setGroup({ ...group, description: trimmed || null });
    setEditingDesc(false);
    toast.success("Description updated");
    haptic("success");
  };

  useEffect(() => {
    if (!isMember) return;
    const channel = supabase
      .channel(`squad_chat_${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          loadProfiles([m.user_id]);
          if (m.attachment_path) ensureSignedUrl(m.attachment_path);
          if (document.visibilityState === "visible") markRead();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "study_group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, isMember]);

  useEffect(() => {
    if (!stickRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (isMember) markRead();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMember]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    if (editingMessage) {
      const editedAt = new Date().toISOString();
      const { error: editError } = await (supabase.from("study_group_messages") as any)
        .update({ body, edited_at: editedAt })
        .eq("id", editingMessage.id)
        .eq("user_id", user.id);
      setSending(false);
      if (editError) {
        setError(editError.message);
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === editingMessage.id ? { ...m, body, edited_at: editedAt } : m)),
      );
      setInput("");
      setEditingMessage(null);
      return;
    }
    const { error: err } = await supabase
      .from("study_group_messages")
      .insert({ group_id: groupId, user_id: user.id, body: withQuote(replyTo, body) });
    setSending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInput("");
    setReplyTo(null);
    stickRef.current = true;
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > MAX_FILE) {
      toast.error("File must be under 15 MB");
      return;
    }
    setUploading(true);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${groupId}/${user.id}-${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from("squad-files")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { error: msgErr } = await supabase.from("study_group_messages").insert({
      group_id: groupId,
      user_id: user.id,
      body: null,
      attachment_path: path,
      attachment_name: file.name,
      attachment_type: file.type || "application/octet-stream",
      attachment_size: file.size,
    });
    setUploading(false);
    if (msgErr) {
      toast.error(msgErr.message);
      return;
    }
    stickRef.current = true;
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const { error: err } = await (supabase.from("study_group_messages") as any)
      .update({
        body: "This message was deleted",
        deleted_for_everyone: true,
        deleted_at: new Date().toISOString(),
        attachment_path: null,
      })
      .eq("id", id);
    if (err) toast.error(err.message);
  };

  const joinSquad = async () => {
    const { error: err } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: user.id });
    if (err) return toast.error(err.message);
    toast.success("Joined squad");
    setIsMember(true);
    refreshMembers();
  };

  const copyInvite = async () => {
    if (!group) return;
    const url = `${window.location.origin}/squad/join/${group.invite_slug ?? group.invite_code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied!");
    } catch {
      toast.message(url);
    }
  };

  const closeInfo = () => {
    setInfoMenuOpen(false);
    setMemberMenuId(null);
    setInfoClosing(true);
    window.setTimeout(() => {
      setInfoOpen(false);
      setInfoClosing(false);
    }, 200);
  };

  const shareInvite = async () => {
    if (!group) return;
    const url = `${window.location.origin}/squad/join/${group.invite_slug ?? group.invite_code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${group.name}`,
          text: `Join ${group.name} on JEE Prep Hub`,
          url,
        });
        return;
      } catch {
        // The user may have dismissed the native share sheet; keep the action quiet.
        return;
      }
    }
    await copyInvite();
  };

  const setRole = async (userId: string, role: "member" | "admin") => {
    const { error: err } = await supabase
      .from("group_members")
      .update({ role })
      .eq("group_id", groupId)
      .eq("user_id", userId);
    if (err) return toast.error(err.message);
    toast.success(role === "admin" ? "Promoted to squad admin" : "Demoted to member");
    refreshMembers();
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Remove this member from the squad?")) return;
    const { error: err } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
    if (err) return toast.error(err.message);
    toast.success("Member removed");
    refreshMembers();
  };

  const leaveSquad = async () => {
    if (isOwner) {
      toast.error(
        "Owners can't leave their own squad. Transfer ownership or delete the squad first.",
      );
      return;
    }
    if (!confirm("Leave this squad? You'll stop receiving messages and need an invite to rejoin."))
      return;
    haptic("warning");
    const { error: err } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);
    if (err) return toast.error(err.message);
    toast.success("You left the squad");
    setManageOpen(false);
    navigate({ to: "/groups" });
  };

  // Group consecutive messages by same author within 5 min, insert date dividers.
  type Item =
    | { kind: "divider"; key: string; label: string }
    | { kind: "msg"; key: string; msg: Msg; showHeader: boolean; isLastOfGroup: boolean };
  const items: Item[] = [];
  let lastDate = "";
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]!;
    const d = new Date(m.created_at);
    const dayKey = d.toDateString();
    if (dayKey !== lastDate) {
      const today = new Date().toDateString();
      const yest = new Date(Date.now() - 86400000).toDateString();
      const label =
        dayKey === today
          ? "Today"
          : dayKey === yest
            ? "Yesterday"
            : d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
      items.push({ kind: "divider", key: `d-${dayKey}`, label });
      lastDate = dayKey;
    }
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const showHeader =
      !prev ||
      prev.user_id !== m.user_id ||
      new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000 ||
      new Date(prev.created_at).toDateString() !== dayKey;
    const isLastOfGroup =
      !next ||
      next.user_id !== m.user_id ||
      new Date(next.created_at).getTime() - new Date(m.created_at).getTime() > 5 * 60 * 1000 ||
      new Date(next.created_at).toDateString() !== dayKey;
    items.push({ kind: "msg", key: m.id, msg: m, showHeader, isLastOfGroup });
  }
  if (!group) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background md:h-[calc(100dvh-var(--site-global-header-height))]">
        <p className="text-sm text-muted-foreground">Loading squad…</p>
      </div>
    );
  }

  const displayedMembers = squadMembers
    .filter((member) =>
      (member.profile?.full_name ?? "Member")
        .toLowerCase()
        .includes(memberSearch.trim().toLowerCase()),
    )
    .sort((a, b) => {
      const aAdmin = a.role === "owner" || a.role === "admin" || a.is_global_admin;
      const bAdmin = b.role === "owner" || b.role === "admin" || b.is_global_admin;
      if (aAdmin !== bAdmin) return aAdmin ? -1 : 1;
      return (a.profile?.full_name ?? "Member").localeCompare(b.profile?.full_name ?? "Member");
    });

  if (isMember === false) {
    return (
      <div className="flex h-[100dvh] flex-col bg-hero-glow md:h-[calc(100dvh-var(--site-global-header-height))]">
        <header className="flex items-center gap-2 border-b border-border bg-background/80 px-3 py-3 backdrop-blur">
          <Link to="/groups" aria-label="Back" className="rounded-full p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="truncate font-display text-base font-semibold">{group.name}</h1>
        </header>

        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-glow">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-7 w-7" />
            </div>

            <h2 className="mt-4 font-display text-xl font-bold">{group.name}</h2>

            {group.description && (
              <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              Join this squad to read and send messages.
            </p>

            <Button onClick={joinSquad} className="mt-5 w-full">
              Join squad
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-background md:top-[var(--site-global-header-height)]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 0%, oklch(0.72 0.16 215 / 0.08), transparent 45%), radial-gradient(circle at 80% 100%, oklch(0.55 0.18 255 / 0.08), transparent 45%)",
      }}
    >
      {/* Top bar */}
      <header className="z-10 flex items-center gap-2 border-b border-border bg-background/85 px-2 py-2 backdrop-blur-md sm:px-4">
        <Link
          to="/groups"
          aria-label="Back"
          className="rounded-full p-2 transition hover:bg-muted active:scale-95"
          onClick={() => haptic("selection")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <button
          type="button"
          onClick={() => {
            haptic("selection");
            setDescDraft(group.description ?? "");
            setEditingDesc(false);
            setInfoOpen(true);
            refreshMembers();
          }}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-1 text-left transition hover:bg-muted/60 active:scale-[0.99]"
          aria-label="Open group info"
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-xs font-bold text-primary-foreground">
              {initials(group.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold leading-tight">{group.name}</h1>

            <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <Users className="h-3 w-3 shrink-0" />
              {squadMembers.length} member{squadMembers.length === 1 ? "" : "s"}
              {isOwner && (
                <span className="ml-1 inline-flex items-center gap-0.5 text-amber-600">
                  <Crown className="h-3 w-3" /> Owner
                </span>
              )}
              {!isOwner && myRole === "admin" && (
                <span className="ml-1 inline-flex items-center gap-0.5 text-blue-600">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </p>
          </div>
        </button>

        {infoOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="group-info-title"
            className={`fixed inset-0 z-[70] flex min-h-[100dvh] flex-col bg-background/98 text-foreground shadow-2xl backdrop-blur-xl transition-all duration-200 ease-out ${
              infoClosing ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100"
            }`}
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
              backgroundImage:
                "radial-gradient(circle at 12% 0%, oklch(0.72 0.16 215 / 0.12), transparent 42%), radial-gradient(circle at 92% 100%, oklch(0.55 0.18 255 / 0.1), transparent 44%)",
            }}
            onClick={() => {
              if (infoMenuOpen) setInfoMenuOpen(false);
              if (memberMenuId) setMemberMenuId(null);
            }}
          >
            <header className="sticky top-0 z-20 shrink-0 border-b border-border/70 bg-background/90 px-3 py-3 backdrop-blur-xl sm:px-5">
              <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
                <button
                  type="button"
                  aria-label="Close group info"
                  onClick={closeInfo}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition hover:bg-muted active:scale-95"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2
                  id="group-info-title"
                  className="min-w-0 flex-1 truncate font-display text-lg font-bold"
                >
                  Group info
                </h2>
                <div className="relative" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    aria-label="Group info menu"
                    aria-expanded={infoMenuOpen}
                    onClick={() => setInfoMenuOpen((open) => !open)}
                    className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-muted active:scale-95"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {infoMenuOpen && (
                    <div className="absolute right-0 top-12 z-30 w-52 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
                      {isSquadAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setDescDraft(group.description ?? "");
                            setEditingDesc(true);
                            setInfoMenuOpen(false);
                          }}
                          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4 text-primary" /> Edit group
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setInfoMenuOpen(false);
                          void shareInvite();
                        }}
                        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
                      >
                        <Share2 className="h-4 w-4 text-primary" /> Share invite link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
                {loading ? (
                  <div className="space-y-4" aria-label="Loading group information">
                    <div className="h-52 animate-pulse rounded-3xl bg-muted/60" />
                    <div className="h-28 animate-pulse rounded-2xl bg-muted/50" />
                    <div className="h-72 animate-pulse rounded-2xl bg-muted/50" />
                  </div>
                ) : (
                  <>
                    <section className="rounded-3xl border border-border/70 bg-card/75 p-6 text-center shadow-sm sm:p-8">
                      <div className="relative mx-auto w-fit">
                        <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-2xl font-bold text-primary-foreground">
                            {initials(group.name)}
                          </AvatarFallback>
                        </Avatar>
                        {isSquadAdmin && (
                          <button
                            type="button"
                            aria-label="Change group avatar"
                            onClick={() =>
                              toast.message(
                                "Group avatar uploads are not enabled for this group yet.",
                              )
                            }
                            className="absolute -bottom-1 -right-1 grid h-11 w-11 place-items-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-lg transition hover:brightness-110 active:scale-95"
                          >
                            <Camera className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <h1 className="mt-5 break-words font-display text-2xl font-black tracking-tight sm:text-3xl">
                        {group.name}
                      </h1>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Group · {squadMembers.length} member{squadMembers.length === 1 ? "" : "s"}
                      </p>
                      {community && (
                        <p className="mt-2 text-xs font-semibold text-primary">{community.name}</p>
                      )}
                    </section>

                    <section className="grid grid-cols-4 gap-2 rounded-2xl border border-border/70 bg-card/65 p-3 sm:gap-3 sm:p-4">
                      {[
                        {
                          label: "Add member",
                          icon: UserPlus,
                          action: () => void copyInvite(),
                          visible: isSquadAdmin,
                        },
                        {
                          label: "Search",
                          icon: Search,
                          action: () => document.getElementById("group-member-search")?.focus(),
                          visible: true,
                        },
                        {
                          label: notifyMode === "muted" ? "Unmute" : "Mute",
                          icon: notifyMode === "muted" ? VolumeX : Volume2,
                          action: () =>
                            void saveNotifyMode(notifyMode === "muted" ? "all" : "muted"),
                          visible: true,
                        },
                        {
                          label: "Share link",
                          icon: Share2,
                          action: () => void shareInvite(),
                          visible: true,
                        },
                      ]
                        .filter((action) => action.visible)
                        .map(({ label, icon: Icon, action }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={action}
                            className="flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-2xl px-1 text-center text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95 sm:text-xs"
                          >
                            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="max-w-full truncate">{label}</span>
                          </button>
                        ))}
                    </section>

                    <section className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold">Description</h3>
                        {isSquadAdmin && !editingDesc && (
                          <button
                            type="button"
                            onClick={() => {
                              setDescDraft(group.description ?? "");
                              setEditingDesc(true);
                            }}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                        )}
                      </div>
                      {editingDesc ? (
                        <div className="space-y-3">
                          <textarea
                            value={descDraft}
                            onChange={(event) => setDescDraft(event.target.value.slice(0, 500))}
                            rows={5}
                            maxLength={500}
                            placeholder="What's this squad about? Rules, goals, schedule…"
                            className="min-h-32 w-full resize-y rounded-2xl border border-border bg-background p-3 text-sm leading-6 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                          />
                          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                            <span>{descDraft.length}/500</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="min-h-10 rounded-xl"
                                onClick={() => {
                                  setEditingDesc(false);
                                  setDescDraft(group.description ?? "");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="min-h-10 gap-1.5 rounded-xl"
                                onClick={saveDescription}
                                disabled={savingDesc}
                              >
                                <Save className="h-3.5 w-3.5" />
                                {savingDesc ? "Saving…" : "Save"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p
                            className={`whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90 ${descriptionExpanded ? "" : "line-clamp-3"}`}
                          >
                            {group.description?.trim() || (
                              <span className="text-muted-foreground">
                                No description yet.{isSquadAdmin && " Tap Edit to add one."}
                              </span>
                            )}
                          </p>
                          {Boolean(group.description && group.description.length > 180) && (
                            <button
                              type="button"
                              onClick={() => setDescriptionExpanded((expanded) => !expanded)}
                              className="mt-2 min-h-11 text-xs font-semibold text-primary"
                            >
                              {descriptionExpanded ? "Show less" : "Read more"}
                            </button>
                          )}
                        </div>
                      )}
                    </section>

                    <section className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold">Invite members</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Share the invite link or QR code.
                          </p>
                        </div>
                        <QrCodeDialog
                          url={`${typeof window !== "undefined" ? window.location.origin : ""}/squad/join/${group.invite_slug ?? group.invite_code}`}
                          title={`Share "${group.name}"`}
                          description="Anyone with this QR can join the squad."
                          fileName={`squad-${group.name.toLowerCase().replace(/\s+/g, "-")}`}
                          trigger={
                            <button
                              type="button"
                              aria-label="Show invite QR code"
                              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-background hover:bg-muted"
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                          }
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyInvite()}
                        className="min-h-11 w-full break-all rounded-xl border border-border bg-background px-3 py-2 text-left text-xs text-primary hover:bg-muted"
                      >
                        {`${typeof window !== "undefined" ? window.location.origin : ""}/squad/join/${group.invite_slug ?? group.invite_code}`}
                      </button>
                    </section>

                    {settings && (
                      <section className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
                        <h3 className="mb-4 text-sm font-bold">Group settings</h3>
                        <div className="space-y-4">
                          <label className="flex min-h-11 items-center justify-between gap-4">
                            <span>
                              <span className="block text-sm font-medium">
                                Disappearing messages
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Older than {settings.disappearing_days} days are hidden
                              </span>
                            </span>
                            <input
                              type="checkbox"
                              className="h-5 w-5 shrink-0 accent-primary"
                              disabled={!isSquadAdmin}
                              checked={settings.disappearing_messages}
                              onChange={(event) =>
                                patchSettings({ disappearing_messages: event.target.checked })
                              }
                            />
                          </label>
                          {(["who_can_send", "who_can_edit"] as const).map((field) => (
                            <div key={field}>
                              <div className="mb-2 text-xs font-medium text-muted-foreground">
                                {field === "who_can_send"
                                  ? "Who can send messages"
                                  : "Who can edit group info"}
                              </div>
                              <div className="flex rounded-xl bg-muted p-1">
                                {(["everyone", "admins"] as const).map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    disabled={!isSquadAdmin}
                                    onClick={() =>
                                      patchSettings({ [field]: opt } as Partial<GroupSettings>)
                                    }
                                    className={`min-h-11 min-w-0 flex-1 rounded-lg px-2 text-xs font-medium transition ${settings[field] === opt ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                  >
                                    {opt === "admins" ? "Only admins" : "Everyone"}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold">{squadMembers.length} members</h3>
                        <span className="text-xs text-muted-foreground">Admins first</span>
                      </div>
                      <div className="relative mb-3">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="group-member-search"
                          value={memberSearch}
                          onChange={(event) => setMemberSearch(event.target.value)}
                          placeholder="Search members"
                          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <ul className="space-y-1.5">
                        {displayedMembers.length === 0 ? (
                          <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                            No members match that search.
                          </li>
                        ) : (
                          displayedMembers.map((m) => {
                            const isThisOwner = m.role === "owner" || m.user_id === group.owner_id;
                            const isAdmin = isThisOwner || m.role === "admin" || m.is_global_admin;
                            const canManage =
                              isSquadAdmin &&
                              m.user_id !== user.id &&
                              !isThisOwner &&
                              (!m.is_global_admin || isOwner);
                            return (
                              <li
                                key={m.user_id}
                                className="relative flex min-h-16 items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-2.5 transition hover:bg-muted/60"
                                onContextMenu={(event) => {
                                  event.preventDefault();
                                  setMemberMenuId(m.user_id);
                                }}
                              >
                                <Link
                                  to="/u/$userId"
                                  params={{ userId: m.user_id }}
                                  onClick={closeInfo}
                                  className="flex min-w-0 flex-1 items-center gap-3"
                                >
                                  <Avatar className="h-11 w-11 shrink-0">
                                    {m.profile?.avatar_url ? (
                                      <AvatarImage src={m.profile.avatar_url} alt="" />
                                    ) : null}
                                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                      {initials(m.profile?.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="min-w-0 flex-1">
                                    <span className="flex min-w-0 items-center gap-1.5">
                                      <span className="min-w-0 truncate text-sm font-semibold">
                                        {m.profile?.full_name ?? "Member"}
                                      </span>
                                      {m.profile?.verified && <VerifiedBadge className="h-4 w-4" />}
                                      {isAdmin && (
                                        <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                          Admin
                                        </span>
                                      )}
                                    </span>
                                    <span className="mt-0.5 block text-xs capitalize text-muted-foreground">
                                      {isThisOwner ? "Owner" : m.role}
                                    </span>
                                  </span>
                                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                </Link>
                                <button
                                  type="button"
                                  aria-label={`Actions for ${m.profile?.full_name ?? "member"}`}
                                  onClick={() =>
                                    setMemberMenuId((id) => (id === m.user_id ? null : m.user_id))
                                  }
                                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-muted"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                {memberMenuId === m.user_id && (
                                  <div
                                    className="absolute right-2 top-14 z-20 w-48 rounded-2xl border border-border bg-popover p-1.5 shadow-xl"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <Link
                                      to="/u/$userId"
                                      params={{ userId: m.user_id }}
                                      onClick={closeInfo}
                                      className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm hover:bg-muted"
                                    >
                                      <UserRound className="h-4 w-4" /> View profile
                                    </Link>
                                    {m.user_id !== user.id && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMemberMenuId(null);
                                          navigate({
                                            to: "/messages/$peerId",
                                            params: { peerId: m.user_id },
                                          });
                                        }}
                                        className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm hover:bg-muted"
                                      >
                                        <MessageCircle className="h-4 w-4" /> Message
                                      </button>
                                    )}
                                    {canManage && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMemberMenuId(null);
                                          void setRole(
                                            m.user_id,
                                            m.role === "admin" ? "member" : "admin",
                                          );
                                        }}
                                        className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm hover:bg-muted"
                                      >
                                        <Shield className="h-4 w-4" />{" "}
                                        {m.role === "admin" ? "Remove admin" : "Make admin"}
                                      </button>
                                    )}
                                    {canManage && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMemberMenuId(null);
                                          void removeMember(m.user_id);
                                        }}
                                        className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm text-destructive hover:bg-destructive/10"
                                      >
                                        <UserMinus className="h-4 w-4" /> Remove
                                      </button>
                                    )}
                                  </div>
                                )}
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </section>

                    <section className="space-y-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 sm:p-5">
                      <h3 className="text-sm font-bold text-destructive">Danger zone</h3>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 w-full justify-start gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={leaveSquad}
                        disabled={isOwner}
                      >
                        <LogOut className="h-4 w-4" />
                        {isOwner ? "Owners cannot exit the group" : "Exit group"}
                      </Button>
                      {isOwner && (
                        <p className="text-xs text-muted-foreground">
                          Transfer ownership before leaving this group.
                        </p>
                      )}
                    </section>

                    <div className="pb-4 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11 rounded-xl text-muted-foreground"
                        onClick={reportGroup}
                        disabled={reporting}
                      >
                        {reporting ? "Reporting…" : "Report group"}
                      </Button>
                    </div>
                  </>
                )}
              </main>
            </div>
          </div>
        )}
        <div className="flex items-center gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              haptic("light");
              copyInvite();
            }}
            className="h-9 gap-1 px-2 text-xs"
            aria-label="Invite"
          >
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Invite</span>
          </Button>

          <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 gap-1 px-2 text-xs"
                aria-label="Notification settings"
                title={
                  notifyMode === "muted"
                    ? "Muted"
                    : notifyMode === "important"
                      ? "Important only"
                      : "All messages"
                }
              >
                {notifyMode === "muted" ? (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                ) : notifyMode === "important" ? (
                  <BellRing className="h-4 w-4 text-amber-600" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Notifications</DialogTitle>
              </DialogHeader>

              <p className="text-xs text-muted-foreground">
                Choose which messages from{" "}
                <span className="font-medium text-foreground">{group.name}</span> notify you.
              </p>

              <div className="mt-2 space-y-2">
                {(
                  [
                    {
                      id: "all",
                      icon: <Bell className="h-4 w-4" />,
                      title: "All messages",
                      desc: "Get notified for every new message.",
                    },
                    {
                      id: "important",
                      icon: <BellRing className="h-4 w-4 text-amber-600" />,
                      title: "Important only",
                      desc: 'Only when messages contain "@everyone", "@important", or start with "!important".',
                    },
                    {
                      id: "muted",
                      icon: <BellOff className="h-4 w-4 text-muted-foreground" />,
                      title: "Mute squad",
                      desc: "No notifications. Messages still appear in chat.",
                    },
                  ] as const
                ).map((opt) => {
                  const active = notifyMode === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={savingNotify}
                      onClick={() => saveNotifyMode(opt.id)}
                      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                      }`}
                    >
                      <span className="mt-0.5">{opt.icon}</span>

                      <span className="flex-1">
                        <span className="block text-sm font-semibold">{opt.title}</span>
                        <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                      </span>

                      {active && (
                        <span className="text-[10px] font-bold uppercase text-primary">On</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

          {isSquadAdmin && (
            <Dialog
              open={manageOpen}
              onOpenChange={(o) => {
                setManageOpen(o);
                if (o) {
                  haptic("selection");
                  refreshMembers();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 gap-1 px-2 text-xs"
                  aria-label="Manage squad"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Manage</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Manage squad</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-foreground">Invite link</span>

                      <QrCodeDialog
                        url={`${typeof window !== "undefined" ? window.location.origin : ""}/squad/join/${group.invite_slug ?? group.invite_code}`}
                        title={`Share "${group.name}"`}
                        description="Anyone with this QR can join the squad."
                        fileName={`squad-${group.name.toLowerCase().replace(/\s+/g, "-")}`}
                        trigger={
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] hover:bg-muted"
                          >
                            <QrCode className="h-3 w-3" /> QR
                          </button>
                        }
                      />
                    </div>

                    <button
                      onClick={copyInvite}
                      className="w-full break-all text-left text-primary hover:underline"
                    >
                      {`${typeof window !== "undefined" ? window.location.origin : ""}/squad/join/${group.invite_slug ?? group.invite_code}`}
                    </button>
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-medium text-muted-foreground">
                      Members ({squadMembers.length})
                    </div>

                    <ul className="max-h-72 space-y-1.5 overflow-y-auto">
                      {squadMembers.map((m) => {
                        const isThisOwner = m.role === "owner" || m.user_id === group.owner_id;

                        const canManage = isOwner && m.user_id !== user.id && !isThisOwner;

                        return (
                          <li
                            key={m.user_id}
                            className="flex items-center gap-2 rounded-lg border border-border p-2"
                          >
                            <Avatar className="h-8 w-8">
                              {m.profile?.avatar_url ? (
                                <AvatarImage src={m.profile.avatar_url} alt="" />
                              ) : null}

                              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                                {initials(m.profile?.full_name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                                {m.profile?.full_name ?? "Member"}
                                {m.is_global_admin && <AdminBadge userId={m.user_id} />}
                              </div>

                              <div className="flex items-center gap-1 text-[10px] capitalize text-muted-foreground">
                                {isThisOwner && <Crown className="h-3 w-3 text-amber-500" />}

                                {m.role === "admin" && !isThisOwner && (
                                  <Shield className="h-3 w-3 text-blue-500" />
                                )}

                                {isThisOwner ? "owner" : m.role}
                              </div>
                            </div>

                            {canManage && (
                              <div className="flex gap-1">
                                {m.role === "admin" ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setRole(m.user_id, "member")}
                                    className="h-7 gap-1 px-2 text-[10px]"
                                  >
                                    <ShieldOff className="h-3 w-3" />
                                    Demote
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setRole(m.user_id, "admin")}
                                    className="h-7 gap-1 px-2 text-[10px]"
                                  >
                                    <Shield className="h-3 w-3" />
                                    Promote
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeMember(m.user_id)}
                                  className="h-7 gap-1 px-2 text-[10px] text-destructive hover:text-destructive"
                                >
                                  <UserMinus className="h-3 w-3" />
                                  Remove
                                </Button>
                              </div>
                            )}

                            {!canManage &&
                              isSquadAdmin &&
                              !isOwner &&
                              m.user_id !== user.id &&
                              !isThisOwner &&
                              m.role === "member" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeMember(m.user_id)}
                                  className="h-7 gap-1 px-2 text-[10px] text-destructive hover:text-destructive"
                                >
                                  <UserMinus className="h-3 w-3" />
                                  Remove
                                </Button>
                              )}
                          </li>
                        );
                      })}
                    </ul>

                    {!isOwner && (
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Only the owner can promote or demote admins.
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>
      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto overscroll-contain bg-muted/20 px-2 py-2 sm:px-4"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col pb-3">
          {loading && (
            <p className="py-8 text-center text-xs text-muted-foreground">Loading messages…</p>
          )}

          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-primary/10 text-primary">
                <Users className="h-8 w-8" />
              </div>
              <p className="mt-4 text-sm font-medium">It's quiet in here</p>
              <p className="mt-1 text-xs text-muted-foreground">Say hi to your squad 👋</p>
            </div>
          )}

          {items.map((it) => {
            if (it.kind === "divider") {
              return (
                <div key={it.key} className="sticky top-1 z-[5] my-3 flex justify-center">
                  <span className="rounded-full border border-border/60 bg-background/90 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
                    {it.label}
                  </span>
                </div>
              );
            }

            const m = it.msg;

            if (m.type === "system") {
              return (
                <div key={it.key} className="my-2 flex justify-center px-6">
                  <span className="rounded-full bg-muted px-3 py-1 text-center text-[11px] text-muted-foreground">
                    {m.body}
                  </span>
                </div>
              );
            }

            const p = profiles[m.user_id];
            const mine = m.user_id === user.id;
            const isGlobalAdmin = admins.has(m.user_id);
            const senderRole = squadMembers.find((x) => x.user_id === m.user_id)?.role;
            const canDelete = mine || isSquadAdmin;
            const attUrl = m.attachment_path ? signedUrls[m.attachment_path] : null;
            const { quote, text } = parseQuote(m.body);
            const time = new Date(m.created_at).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
            const authorName = mine ? "You" : (p?.full_name ?? "Member");

            return (
              <div
                key={it.key}
                className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""} ${
                  it.showHeader ? "mt-3" : "mt-0.5"
                }`}
              >
                <div className="w-8 shrink-0">
                  {!mine && it.isLastOfGroup ? (
                    <Link to="/u/$userId" params={{ userId: m.user_id }}>
                      <Avatar
                        className={`h-8 w-8 ${isGlobalAdmin ? "ring-2 ring-amber-400/70" : ""}`}
                      >
                        {p?.avatar_url ? <AvatarImage src={p.avatar_url} alt="" /> : null}
                        <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                          {initials(p?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  ) : null}
                </div>

                <div
                  className={`flex min-w-0 max-w-[92%] flex-col sm:max-w-[78%] lg:max-w-[70%] ${mine ? "items-end" : "items-start"}`}
                >
                  <div
                    {...actions.bind({
                      id: m.id,
                      body: text || m.attachment_name || "",
                      authorName,
                      canDelete,
                    })}
                    className={`relative min-w-[72px] max-w-full cursor-pointer select-none overflow-hidden rounded-2xl px-3 pb-1.5 pt-2 text-[14.5px] leading-snug shadow-sm ${
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/60 bg-card text-foreground"
                    } ${it.isLastOfGroup ? (mine ? "rounded-br-sm" : "rounded-bl-sm") : ""}`}
                  >
                    {it.showHeader && !mine && (
                      <div className="mb-0.5 flex flex-wrap items-center gap-1.5 text-[12px]">
                        <Link
                          to="/u/$userId"
                          params={{ userId: m.user_id }}
                          className={`font-semibold hover:underline ${nameColor(m.user_id)}`}
                        >
                          {p?.full_name ?? "Member"}
                        </Link>
                        {isGlobalAdmin && <AdminBadge userId={m.user_id} />}
                        {m.user_id === group.owner_id && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600">
                            <Crown className="h-3 w-3" /> Owner
                          </span>
                        )}
                        {senderRole === "admin" && m.user_id !== group.owner_id && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600">
                            <Shield className="h-3 w-3" /> Admin
                          </span>
                        )}
                      </div>
                    )}

                    {quote && (
                      <div
                        className={`mb-1.5 rounded-lg border-l-4 px-2 py-1 text-xs ${
                          mine ? "border-white/70 bg-white/15" : "border-primary bg-primary/5"
                        }`}
                      >
                        {quote.author && (
                          <p className={`font-semibold ${mine ? "" : "text-primary"}`}>
                            {quote.author}
                          </p>
                        )}
                        <p className="line-clamp-3 whitespace-pre-wrap break-words opacity-80">
                          <LinkifiedText text={quote.text} />
                        </p>
                      </div>
                    )}

                    <Attachment m={m} url={attUrl} mine={mine} />

                    {text && <p className="whitespace-pre-wrap break-words"><LinkifiedText text={text} /></p>}

                    <MessageReactionChips
                      reactions={squadReactions.byMessage[m.id] ?? []}
                      userId={user.id}
                      onToggle={(emoji) => squadReactions.toggle(m.id, emoji)}
                    />

                    <div className="mt-0.5 flex justify-end">
                      <span className="text-[10px] opacity-60">{time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border/60 bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:px-4">
        <div className="mx-auto w-full max-w-5xl">
          {error && <p className="mb-1.5 px-2 text-xs text-destructive">{error}</p>}

          {editingMessage && (
            <ReplyBanner
              authorName="your message"
              body={editingMessage.body ?? ""}
              onCancel={() => {
                setEditingMessage(null);
                setInput("");
              }}
            />
          )}
          {replyTo && (
            <ReplyBanner
              authorName={replyTo.authorName}
              body={replyTo.body}
              onCancel={() => setReplyTo(null)}
            />
          )}

          {uploading && (
            <p className="mb-1.5 px-2 text-xs text-muted-foreground">Uploading file…</p>
          )}

          {canSendMessages ? (
            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <input ref={fileRef} type="file" className="hidden" onChange={onFile} />

              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full border border-border bg-card pl-1 pr-4 shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
                <button
                  type="button"
                  aria-label="Attach file"
                  onClick={() => fileRef.current?.click()}
                  disabled={sending || uploading}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted active:scale-95 disabled:opacity-50"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message"
                  enterKeyHint="send"
                  maxLength={MAX_LEN}
                  disabled={sending}
                  className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                />
              </div>

              <button
                type="submit"
                aria-label="Send message"
                disabled={sending || uploading || !input.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition active:scale-95 disabled:opacity-40"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          ) : (
            <div className="rounded-full bg-muted px-4 py-3 text-center text-xs text-muted-foreground">
              Only admins can send messages in this squad.
            </div>
          )}
        </div>
      </div>

      <MessageActionSheet
        actions={actions}
        onReply={(t) => setReplyTo(t)}
        onReact={(t, emoji) => squadReactions.toggle(t.id, emoji)}
        onEdit={(t) => {
          const message = messages.find((m) => m.id === t.id);
          if (message && message.user_id === user.id && !message.deleted_for_everyone) {
            setEditingMessage(message);
            setInput(message.body ?? "");
            setReplyTo(null);
          }
        }}
        onDelete={(t) => onDelete(t.id)}
      />
    </div>
  );
}

const NAME_COLORS = [
  "text-sky-600",
  "text-emerald-600",
  "text-rose-600",
  "text-violet-600",
  "text-amber-600",
  "text-teal-600",
  "text-fuchsia-600",
  "text-orange-600",
];

function nameColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
}

function parseQuote(body: string | null): {
  quote: { author: string | null; text: string } | null;
  text: string;
} {
  if (!body || !body.startsWith(">")) return { quote: null, text: body ?? "" };
  const idx = body.indexOf("\n\n");
  if (idx === -1) return { quote: null, text: body };
  const head = body.slice(0, idx).split("\n");
  if (!head.every((l) => l.startsWith(">"))) return { quote: null, text: body };
  const lines = head.map((l) => l.replace(/^>\s?/, ""));
  let author: string | null = null;
  if (lines.length > 1 && lines[0]!.endsWith(":")) {
    author = lines.shift()!.slice(0, -1);
  }
  return { quote: { author, text: lines.join("\n") }, text: body.slice(idx + 2) };
}

function Attachment({ m, url, mine }: { m: Msg; url: string | null | undefined; mine: boolean }) {
  if (!m.attachment_path) return null;
  const isImage = m.attachment_type?.startsWith("image/");

  if (isImage && url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mb-1.5 block overflow-hidden rounded-xl"
      >
        <img
          src={url}
          alt={m.attachment_name ?? "image"}
          loading="lazy"
          className="max-h-72 w-full object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      download={m.attachment_name ?? undefined}
      className={`mb-1.5 flex items-center gap-2.5 rounded-xl p-2.5 ${mine ? "bg-white/15" : "bg-muted"}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-background/70 text-primary">
        <FileText className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{m.attachment_name ?? "File"}</span>
        <span className="block text-[11px] opacity-70">{fileSize(m.attachment_size)}</span>
      </span>
      <Download className="h-4 w-4 shrink-0 opacity-70" />
    </a>
  );
}
