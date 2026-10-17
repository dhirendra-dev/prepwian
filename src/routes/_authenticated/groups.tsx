import { LinkifiedText } from "@/components/LinkifiedText";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import { Users, Plus, Globe, Lock, Megaphone, Sparkles, MessageCircle, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/groups")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Communities & Groups — PREPWIAN" },
      { name: "twitter:description", content: "Join subject, goal, batch and social groups with fellow JEE & NEET aspirants." },

      { title: "Communities & Groups — PREPWIAN" },
      {
        name: "description",
        content:
          "Every PREPWIAN community group in one place — subject rooms, goal squads, batch chats and social groups.",
      },
      { property: "og:title", content: "Communities & Groups — PREPWIAN" },
      {
        property: "og:description",
        content: "Join subject, goal, batch and social groups with fellow JEE & NEET aspirants.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroupsPage,
});

type Category = "subject" | "goal" | "social" | "batch";
type Privacy = "open" | "request";

type Community = { id: string; name: string; tagline: string | null; announcement: string | null };

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  invite_code: string;
  invite_slug: string | null;
  category: Category;
  privacy: Privacy;
  community_id: string | null;
  communityName: string | null;
  memberCount: number;
  joined: boolean;
  unread: number;
  lastBody: string | null;
  lastSender: string | null;
  lastAt: string | null;
};

const CATEGORY_TINT: Record<Category, string> = {
  subject: "from-sky-500 to-blue-600",
  goal: "from-amber-500 to-orange-600",
  social: "from-fuchsia-500 to-purple-600",
  batch: "from-emerald-500 to-teal-600",
};
const CATEGORY_LABEL: Record<Category, string> = {
  subject: "Subjects",
  goal: "Goals",
  social: "Social",
  batch: "Batch",
};

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "G";
}
function shortTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function GroupsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [communityFilter, setCommunityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [query, setQuery] = useState("");

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<Category>("subject");
  const [privacy, setPrivacy] = useState<Privacy>("open");
  const [communityId, setCommunityId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const communities = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("communities")
        .select("id, name, tagline, announcement")
        .order("created_at", { ascending: true });
      return (data ?? []) as Community[];
    },
  });

  const groups = useQuery({
    queryKey: ["all-groups", user.id],
    queryFn: async () => {
      const [{ data: g }, { data: members }, { data: comms }] = await Promise.all([
        supabase
          .from("groups")
          .select("id, name, description, owner_id, invite_code, invite_slug, category, privacy, community_id")
          .order("created_at", { ascending: false }),
        supabase.from("group_members").select("group_id, user_id, last_read_at"),
        supabase.from("communities").select("id, name"),
      ]);
      const commMap = new Map((comms ?? []).map((c) => [c.id, c.name]));

      const counts = new Map<string, number>();
      const mine = new Set<string>();
      const myLastRead = new Map<string, string>();
      (members ?? []).forEach((m) => {
        counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
        if (m.user_id === user.id) {
          mine.add(m.group_id);
          myLastRead.set(m.group_id, m.last_read_at as string);
        }
      });

      const ids = (g ?? []).map((x) => x.id);
      const { data: recent } = ids.length
        ? await supabase
            .from("study_group_messages")
            .select("group_id, user_id, body, created_at, attachment_name")
            .in("group_id", ids)
            .order("created_at", { ascending: false })
            .limit(400)
        : { data: [] as any[] };
      const lastByGroup = new Map<string, any>();
      (recent ?? []).forEach((r: any) => {
        if (!lastByGroup.has(r.group_id)) lastByGroup.set(r.group_id, r);
      });

      const senderIds = [...new Set((recent ?? []).map((r: any) => r.user_id))];
      const { data: profiles } = senderIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", senderIds)
        : { data: [] as any[] };
      const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name as string | null]));

      const unreadMap = new Map<string, number>();
      const { data: unreadRows } = await supabase.rpc("get_squad_unread_counts", { p_user_id: user.id });
      (unreadRows ?? []).forEach((r: any) => unreadMap.set(r.group_id, Number(r.unread_count)));

      return (g ?? []).map((x: any) => {
        const last = lastByGroup.get(x.id);
        return {
          ...x,
          communityName: x.community_id ? (commMap.get(x.community_id) ?? null) : null,
          memberCount: counts.get(x.id) ?? 0,
          joined: mine.has(x.id),
          unread: unreadMap.get(x.id) ?? 0,
          lastBody: last ? (last.body ?? (last.attachment_name ? `📎 ${last.attachment_name}` : null)) : null,
          lastSender: last ? (nameMap.get(last.user_id) ?? "Member") : null,
          lastAt: last?.created_at ?? null,
        } as GroupRow;
      });
    },
  });

  const announcement = useMemo(() => {
    const list = (communities.data ?? []).filter((c) => c.announcement?.trim());
    if (communityFilter !== "all") {
      const hit = list.find((c) => c.id === communityFilter);
      return hit ?? null;
    }
    return list[list.length - 1] ?? null;
  }, [communities.data, communityFilter]);

  const visible = useMemo(() => {
    let rows = groups.data ?? [];
    if (communityFilter !== "all") rows = rows.filter((r) => r.community_id === communityFilter);
    if (categoryFilter !== "all") rows = rows.filter((r) => r.category === categoryFilter);
    return rows;
  }, [groups.data, communityFilter, categoryFilter]);

  async function createGroup() {
    if (name.trim().length < 3) return toast.error("Name is too short");
    const cid = communityId || communities.data?.[0]?.id;
    if (!cid) return toast.error("No community available yet — ask an admin to create one.");
    setSaving(true);
    const { data, error } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        description: desc.trim() || null,
        owner_id: user.id,
        created_by: user.id,
        community_id: cid,
        category,
        privacy,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setOpen(false);
    setName("");
    setDesc("");
    toast.success("Group created!");
    qc.invalidateQueries({ queryKey: ["all-groups"] });
    navigate({ to: "/squad/$groupId", params: { groupId: data.id } });
  }

  async function join(groupId: string) {
    const { error } = await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id });
    if (error) return toast.error(error.message);
    haptic("success");
    toast.success("Joined group");
    qc.invalidateQueries({ queryKey: ["all-groups"] });
  }

  const q = query.trim().toLowerCase();
  const shown = visible.filter(
    (r) => !q || r.name.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q),
  );
  const mineRows = shown
    .filter((r) => r.joined)
    .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
  const discoverRows = shown.filter((r) => !r.joined);
  const totalUnread = mineRows.reduce((n, r) => n + r.unread, 0);
  const manyCommunities = (communities.data?.length ?? 0) > 1;
  const catCount = (c: "all" | Category) =>
    (groups.data ?? []).filter((r) => c === "all" || r.category === c).length;

  const openCreate = () => {
    haptic("light");
    setCommunityId(communities.data?.[0]?.id ?? "");
    setOpen(true);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4 pb-28">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold leading-tight">Groups</h1>
            <p className="text-xs text-muted-foreground">
              {mineRows.length} joined{totalUnread > 0 ? ` · ${totalUnread} unread` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/sahai"
              aria-label="Chat with SahAI"
              onClick={() => haptic("light")}
              className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-md transition active:scale-95"
            >
              <Sparkles className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md transition active:scale-95"
            >
              <Plus className="h-4 w-4" /> New
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="flex h-11 items-center gap-2 rounded-full border border-border/70 bg-card/90 px-4 shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search groups"
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Announcement */}
        {announcement?.announcement && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-primary/25 bg-card/90 p-3 shadow-sm">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Megaphone className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wide text-primary">
                {announcement.name}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground/90">
                <LinkifiedText text={announcement.announcement} />
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-2">
          {manyCommunities && (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {[{ id: "all", name: "All communities" }, ...(communities.data ?? [])].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCommunityFilter(c.id)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    communityFilter === c.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/70 bg-card/90"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {(["all", "subject", "goal", "social", "batch"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  categoryFilter === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-card/90"
                }`}
              >
                {c === "all" ? "All" : CATEGORY_LABEL[c]}
                <span className="ml-1.5 opacity-60">{catCount(c)}</span>
              </button>
            ))}
          </div>
        </div>

        {groups.isLoading ? (
          <ul className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="h-[76px] animate-pulse rounded-2xl border border-border bg-muted/40" />
            ))}
          </ul>
        ) : shown.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              {(groups.data?.length ?? 0) === 0
                ? "No groups yet — create the first one."
                : "No groups match your search."}
            </p>
          </div>
        ) : (
          <>
            {/* Your groups */}
            {mineRows.length > 0 && (
              <section>
                <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Your groups
                </h2>
                <ul className="space-y-2">
                  {mineRows.map((g) => (
                    <li key={g.id}>
                      <Link
                        to="/squad/$groupId"
                        params={{ groupId: g.id }}
                        onClick={() => haptic("selection")}
                        className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/90 p-3 shadow-sm transition active:scale-[0.99]"
                      >
                        <div
                          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${CATEGORY_TINT[g.category]} text-sm font-bold text-white shadow-sm`}
                        >
                          {initials(g.name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`truncate text-[15px] ${g.unread > 0 ? "font-bold" : "font-semibold"}`}>
                              {g.name}
                            </span>
                            {g.privacy === "request" && (
                              <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                            )}
                          </div>
                          <p
                            className={`truncate text-[13px] ${
                              g.unread > 0 ? "text-foreground/80" : "text-muted-foreground"
                            }`}
                          >
                            {g.lastBody ? (
                              <>
                                <span className="font-medium">{g.lastSender}:</span> {g.lastBody}
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> No messages yet
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {g.memberCount} member{g.memberCount === 1 ? "" : "s"} · {CATEGORY_LABEL[g.category]}
                            {manyCommunities && g.communityName ? ` · ${g.communityName}` : ""}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1.5 self-start pt-0.5">
                          <span className={`text-[11px] ${g.unread > 0 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                            {shortTime(g.lastAt)}
                          </span>
                          {g.unread > 0 && (
                            <span
                              key={g.unread}
                              className="animate-count-bump inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground"
                            >
                              {g.unread > 99 ? "99+" : g.unread}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Discover */}
            {discoverRows.length > 0 && (
              <section>
                <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Discover
                </h2>
                <ul className="space-y-2">
                  {discoverRows.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/90 p-3 shadow-sm"
                    >
                      <div
                        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${CATEGORY_TINT[g.category]} text-sm font-bold text-white shadow-sm`}
                      >
                        {initials(g.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[15px] font-semibold">{g.name}</span>
                          {g.privacy === "request" ? (
                            <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                          ) : (
                            <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                        <p className="line-clamp-1 text-[13px] text-muted-foreground">
                          {g.description?.trim() || `${CATEGORY_LABEL[g.category]} group`}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {g.memberCount} member{g.memberCount === 1 ? "" : "s"} · {CATEGORY_LABEL[g.category]}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => join(g.id)}
                className="h-9 shrink-0 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition active:scale-95"
                      >
                        {g.privacy === "request" ? "Request" : "Join"}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create a sub-group</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Community</Label>
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {(communities.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {(communities.data?.length ?? 0) === 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  No communities exist yet — an admin needs to create one first.
                </p>
              )}
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Physics — Rotational Motion"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="What's the focus / schedule?"
              />
            </div>
            <div>
              <Label>Category</Label>
              <div className="mt-1 flex gap-1 rounded-lg bg-muted p-1">
                {(["subject", "goal", "social", "batch"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${category === c ? "bg-background shadow-soft" : "text-muted-foreground"}`}
                  >
                    {CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Privacy</Label>
              <div className="mt-1 flex gap-1 rounded-lg bg-muted p-1">
                {(["open", "request"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrivacy(p)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${privacy === p ? "bg-background shadow-soft" : "text-muted-foreground"}`}
                  >
                    {p === "open" ? "Open" : "Request to join"}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={createGroup} disabled={saving} className="w-full">
              {saving ? "Creating…" : "Create group"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
                }
