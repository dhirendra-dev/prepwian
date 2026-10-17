import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { LinkifiedText } from "@/components/LinkifiedText";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Ban,
  LogOut,
  UserX,
  StickyNote,
  Network,
  Trash2,
} from "lucide-react";
import {
  adminSecurityOverview,
  adminListUserEvents,
  adminSetModeration,
  adminForceLogout,
  adminDeleteUser,
  adminListBlockedIps,
  adminBlockIp,
  adminUnblockIp,
  adminAddNote,
  adminListNotes,
} from "@/lib/security.functions";
import { adminListUsers } from "@/lib/users.functions";

export const Route = createFileRoute("/_authenticated/admin/security")({
  head: () => ({ meta: [{ title: "Admin · Security — PREPWIAN" }] }),
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminSecurity,
});

function AdminSecurity() {
  const qc = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const overview = useQuery({
    queryKey: ["admin-security-overview"],
    queryFn: () => adminSecurityOverview(),
    refetchInterval: 30_000,
  });

  const users = useQuery({
    queryKey: ["admin-users-sec", search],
    queryFn: () => adminListUsers({ data: { search: search || undefined, page: 1 } }),
  });

  const blockedIps = useQuery({
    queryKey: ["admin-blocked-ips"],
    queryFn: () => adminListBlockedIps(),
  });

  const blockIp = useMutation({
    mutationFn: (input: { ip: string; reason?: string }) => adminBlockIp({ data: input }),
    onSuccess: () => {
      toast.success("IP blocked");
      qc.invalidateQueries({ queryKey: ["admin-blocked-ips"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unblockIp = useMutation({
    mutationFn: (id: string) => adminUnblockIp({ data: { id } }),
    onSuccess: () => {
      toast.success("IP unblocked");
      qc.invalidateQueries({ queryKey: ["admin-blocked-ips"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const o = overview.data;
  const userRows = users.data?.rows ?? [];

  return (
    <AppShell>
      <div className="mx-auto mb-6 flex max-w-6xl flex-wrap gap-2">
        <Link
          to="/admin/materials"
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Materials
        </Link>
        <Link
          to="/admin/community"
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Community
        </Link>
        <Link
          to="/admin/certificates"
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Certificates
        </Link>
        <Link
          to="/admin/users"
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Users
        </Link>
        <Link
          to="/admin/audit"
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Audit Log
        </Link>
        <Link
          to="/admin/security"
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
        >
          Security
        </Link>
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        {/* KPIs */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            icon={<Activity className="h-4 w-4" />}
            label="Events (24h)"
            value={o?.events24h ?? "—"}
          />
          <Kpi
            icon={<ShieldAlert className="h-4 w-4 text-rose-500 dark:text-rose-400" />}
            label="Failed logins (24h)"
            value={o?.failed24h ?? "—"}
          />
          <Kpi
            icon={<Ban className="h-4 w-4 text-rose-500 dark:text-rose-400" />}
            label="Banned users"
            value={o?.moderation.banned ?? "—"}
          />
          <Kpi
            icon={<ShieldCheck className="h-4 w-4 text-amber-500 dark:text-amber-300" />}
            label="Suspended"
            value={o?.moderation.suspended ?? "—"}
          />
        </section>

        {/* User moderation */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">User moderation</h2>
            <Input
              placeholder="Search by email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="mt-4 space-y-2">
            <div className="space-y-2 sm:hidden">
              {userRows.map((u) => (
                <article
                  key={`mobile-${u.id}`}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-background/60 p-3"
                >
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {(u.full_name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.full_name ?? "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.email ?? "no email"}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Joined {new Date(u.created_at).toLocaleDateString()} · Last seen{" "}
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedUserId(u.id)}>
                    Manage
                  </Button>
                </article>
              ))}
              {userRows.length === 0 && !users.isLoading && (
                <div className="rounded-xl border border-border p-5 text-center text-sm text-muted-foreground">
                  No users.
                </div>
              )}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3 font-medium">User</th>
                    <th className="py-2 pr-3 font-medium">Joined</th>
                    <th className="py-2 pr-3 font-medium">Last seen</th>
                    <th className="py-2 pr-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {userRows.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt=""
                              className="h-7 w-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                              {(u.full_name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{u.full_name ?? "—"}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {u.email ?? "no email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => setSelectedUserId(u.id)}>
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {userRows.length === 0 && !users.isLoading && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">
                        No users.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Recent security events */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Recent security events</h2>
          <div className="mt-3 max-h-96 space-y-2 overflow-y-auto sm:hidden">
            {(o?.recentEvents ?? []).map((event) => (
              <article
                key={`mobile-${event.id}`}
                className="min-w-0 rounded-xl border border-border bg-background/60 p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                    {event.event_type}
                  </span>
                  <time className="text-[10px] text-muted-foreground" dateTime={event.created_at}>
                    {new Date(event.created_at).toLocaleString(undefined, { hour12: true })}
                  </time>
                </div>
                <div className="mt-2 grid gap-1 text-[10px] text-muted-foreground">
                  <p className="font-mono">User ID: {event.user_id?.slice(0, 8) ?? "—"}</p>
                  <p className="font-mono">IP hash: {event.ip_hash?.slice(0, 12) ?? "—"}</p>
                  <p className="break-words">{event.user_agent ?? "—"}</p>
                </div>
              </article>
            ))}
            {(o?.recentEvents ?? []).length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No events yet.</p>
            )}
          </div>
          <div className="mt-3 hidden max-h-96 overflow-y-auto sm:block">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">IP (hashed)</th>
                  <th className="py-2 pr-3">User agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(o?.recentEvents ?? []).map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString(undefined, { hour12: true })}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="rounded bg-muted px-1.5 py-0.5">{e.event_type}</span>
                    </td>
                    <td className="py-2 pr-3 font-mono">{e.user_id?.slice(0, 8) ?? "—"}</td>
                    <td className="py-2 pr-3 font-mono">{e.ip_hash?.slice(0, 12) ?? "—"}</td>
                    <td className="py-2 pr-3 max-w-xs truncate">{e.user_agent ?? "—"}</td>
                  </tr>
                ))}
                {(o?.recentEvents ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      No events yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Blocked IPs */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Network className="h-4 w-4" /> Blocked IPs
            </h2>
          </div>
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const ip = String(fd.get("ip") ?? "").trim();
              const reason = String(fd.get("reason") ?? "").trim();
              if (!ip) return;
              blockIp.mutate({ ip, reason: reason || undefined });
              (e.currentTarget as HTMLFormElement).reset();
            }}
          >
            <Input
              name="ip"
              placeholder="IP address (e.g. 203.0.113.7)"
              className="max-w-xs"
              required
            />
            <Input name="reason" placeholder="Reason (optional)" className="max-w-xs" />
            <Button type="submit" disabled={blockIp.isPending}>
              Block
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            IPs are stored as a SHA-256 hash for privacy. Raw IPs are never written to the database.
          </p>
          <div className="mt-3 space-y-2">
            {(blockedIps.data ?? []).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-md border border-border p-2 text-xs"
              >
                <div>
                  <div className="font-mono">{b.ip_hash.slice(0, 16)}…</div>
                  <div className="text-muted-foreground">
                    {b.reason ?? "no reason"} ·{" "}
                    {new Date(b.created_at).toLocaleString(undefined, { hour12: true })}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => unblockIp.mutate(b.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {(blockedIps.data ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">No IPs blocked.</p>
            )}
          </div>
        </section>
      </div>

      {selectedUserId && (
        <ManageUserDialog userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </AppShell>
  );
}

function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function ManageUserDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const events = useQuery({
    queryKey: ["admin-user-events", userId],
    queryFn: () => adminListUserEvents({ data: { user_id: userId } }),
  });
  const notes = useQuery({
    queryKey: ["admin-user-notes", userId],
    queryFn: () => adminListNotes({ data: { user_id: userId } }),
  });

  const setMod = useMutation({
    mutationFn: (input: {
      status: "active" | "suspended" | "banned";
      reason?: string;
      can_post?: boolean;
      can_message?: boolean;
    }) => adminSetModeration({ data: { user_id: userId, ...input } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-security-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const forceLogout = useMutation({
    mutationFn: () => adminForceLogout({ data: { user_id: userId } }),
    onSuccess: () => toast.success("Signed out everywhere"),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => adminDeleteUser({ data: { user_id: userId } }),
    onSuccess: () => {
      toast.success("User deleted");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: (body: string) => adminAddNote({ data: { user_id: userId, body } }),
    onSuccess: () => {
      toast.success("Note added");
      qc.invalidateQueries({ queryKey: ["admin-user-notes", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage user</DialogTitle>
          <DialogDescription className="font-mono text-xs">{userId}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setMod.mutate({ status: "active" })}>
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const reason = prompt("Suspension reason?") ?? undefined;
                setMod.mutate({ status: "suspended", reason });
              }}
            >
              <Shield className="mr-1 h-3.5 w-3.5" /> Suspend
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                const reason = prompt("Ban reason?") ?? undefined;
                if (
                  confirm(
                    "Ban this user? They will be signed out and blocked from posting/messaging.",
                  )
                ) {
                  setMod.mutate({ status: "banned", reason, can_post: false, can_message: false });
                }
              }}
            >
              <Ban className="mr-1 h-3.5 w-3.5" /> Ban
            </Button>
            <Button size="sm" variant="outline" onClick={() => forceLogout.mutate()}>
              <LogOut className="mr-1 h-3.5 w-3.5" /> Force logout
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm("Permanently delete this user? This cannot be undone.")) del.mutate();
              }}
            >
              <UserX className="mr-1 h-3.5 w-3.5" /> Delete
            </Button>
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <StickyNote className="h-3.5 w-3.5" /> Admin notes
            </h3>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const body = String(fd.get("body") ?? "").trim();
                if (!body) return;
                addNote.mutate(body);
                (e.currentTarget as HTMLFormElement).reset();
              }}
            >
              <Textarea name="body" placeholder="Add an internal note…" className="min-h-[60px]" />
              <Button type="submit">Add</Button>
            </form>
            <div className="mt-2 space-y-1.5">
              {(notes.data ?? []).map((n) => (
                <div key={n.id} className="rounded-md border border-border p-2 text-xs">
                  <div className="text-muted-foreground">
                    {new Date(n.created_at).toLocaleString(undefined, { hour12: true })}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap"><LinkifiedText text={n.body} /></div>
                </div>
              ))}
              {(notes.data ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No notes.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Recent activity</h3>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {(events.data ?? []).map((e) => (
                <div key={e.id} className="rounded border border-border p-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium">{e.event_type}</span>
                    <span className="text-muted-foreground">
                      {new Date(e.created_at).toLocaleString(undefined, { hour12: true })}
                    </span>
                  </div>
                  {e.ip_hash && (
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {e.ip_hash.slice(0, 16)}…
                    </div>
                  )}
                </div>
              ))}
              {(events.data ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No security events.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
