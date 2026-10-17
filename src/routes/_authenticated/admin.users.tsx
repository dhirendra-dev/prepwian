import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { requirePermission } from "@/lib/admin-guard";
import { AppShell } from "@/components/AppShell";
import { AdminSavedViews } from "@/components/AdminSavedViews";
import { useAdminAccess } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Ban,
  ShieldOff,
  ShieldAlert,
  RotateCcw,
  BookOpenCheck,
  Download,
} from "lucide-react";
import {
  adminListUsers,
  adminSetAdminRole,
  adminSetModeration,
  type AdminUserRow,
} from "@/lib/users.functions";
import { adminSetTrustedMaterialsAccess } from "@/lib/materials-gate.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Admin · Users — JEE Prep Hub" }] }),
  ssr: false,
  beforeLoad: async ({ context }) => {
    await requirePermission(context.user.id, "users");
    return { currentUserId: context.user.id };
  },
  component: AdminUsers,
});

function csvField(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function downloadUsersCsv(users: AdminUserRow[]) {
  const columns: (keyof AdminUserRow)[] = [
    "id",
    "email",
    "full_name",
    "created_at",
    "last_sign_in_at",
    "moderation_status",
    "moderation_reason",
    "is_admin",
    "is_materials_trusted",
  ];
  const csv = [
    columns.join(","),
    ...users.map((user) => columns.map((column) => csvField(user[column])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `jph-users-page-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function AdminUsers() {
  const qc = useQueryClient();
  const { currentUserId } = Route.useRouteContext();
  const { role } = useAdminAccess(currentUserId);
  const canManageAdminRoles = role === "admin";
  const canManageMaterialsTrust = role === "admin";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<"active" | "suspended" | "banned">("suspended");

  useEffect(() => setSelectedUsers(new Set()), [page, search]);

  const list = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: () => adminListUsers({ data: { search: search || undefined, page } }),
  });

  const setRole = useMutation({
    mutationFn: (input: { user_id: string; is_admin: boolean }) =>
      adminSetAdminRole({ data: input }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["is-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setModeration = useMutation({
    mutationFn: (input: {
      user_id: string;
      status: "active" | "suspended" | "banned";
      reason?: string;
    }) => adminSetModeration({ data: input }),
    onSuccess: (_r, vars) => {
      toast.success(
        vars.status === "active"
          ? "User unbanned"
          : vars.status === "banned"
            ? "User banned"
            : "User suspended",
      );
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkModerate = useMutation({
    mutationFn: async (input: {
      userIds: string[];
      status: "active" | "suspended" | "banned";
      reason?: string;
    }) => {
      const results = await Promise.allSettled(
        input.userIds.map((user_id) =>
          adminSetModeration({ data: { user_id, status: input.status, reason: input.reason } }),
        ),
      );
      return {
        updated: results.filter((result) => result.status === "fulfilled").length,
        failed: results.filter((result) => result.status === "rejected").length,
      };
    },
    onSuccess: ({ updated, failed }) => {
      setSelectedUsers(new Set());
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      if (failed) toast.warning(`${updated} users updated; ${failed} failed.`);
      else toast.success(`${updated} user${updated === 1 ? "" : "s"} updated.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setMaterialsTrust = useMutation({
    mutationFn: (input: { user_id: string; trusted: boolean }) =>
      adminSetTrustedMaterialsAccess({ data: input }),
    onSuccess: (_result, variables) => {
      toast.success(variables.trusted ? "Materials access granted" : "Materials access revoked");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = list.data?.rows ?? [];

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
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
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
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Security
        </Link>
      </div>

      <div className="mx-auto max-w-6xl">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">User management</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Manage admin roles, moderation, and trusted Study Materials access. Showing page{" "}
                {list.data?.page ?? page}.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="sm:w-72"
              />
            </div>
          </div>

          <div className="mt-4">
            <AdminSavedViews
              storageKey="users"
              filters={{ search }}
              onApply={(saved) => {
                setSearch(saved.search);
                setPage(1);
              }}
            />
          </div>

          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/25 p-2.5">
            <label className="flex min-h-9 items-center gap-2 px-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                aria-label="Select all users on this page"
                checked={rows.length > 0 && rows.every((user) => selectedUsers.has(user.id))}
                onChange={(event) =>
                  setSelectedUsers(
                    event.target.checked
                      ? new Set(
                          rows.filter((user) => user.id !== currentUserId).map((user) => user.id),
                        )
                      : new Set(),
                  )
                }
                className="h-4 w-4 accent-primary"
              />
              Select page
            </label>
            <Button
              size="sm"
              variant="outline"
              disabled={!canManageAdminRoles || !rows.length}
              onClick={() => downloadUsersCsv(rows)}
              title={
                canManageAdminRoles
                  ? "Export this page as CSV"
                  : "CSV export is available to full administrators"
              }
            >
              <Download className="h-3.5 w-3.5" /> Export page CSV
            </Button>
            {selectedUsers.size > 0 && (
              <>
                <span className="text-xs font-medium text-muted-foreground">
                  {selectedUsers.size} selected
                </span>
                <select
                  aria-label="Bulk moderation action"
                  value={bulkStatus}
                  onChange={(event) => setBulkStatus(event.target.value as typeof bulkStatus)}
                  className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
                >
                  <option value="suspended">Suspend</option>
                  <option value="banned">Ban</option>
                  <option value="active">Restore access</option>
                </select>
                <Button
                  size="sm"
                  variant={bulkStatus === "banned" ? "destructive" : "default"}
                  disabled={bulkModerate.isPending}
                  onClick={() => {
                    const count = selectedUsers.size;
                    if (
                      !window.confirm(
                        `Apply “${bulkStatus === "active" ? "restore access" : bulkStatus}” to ${count} selected user${count === 1 ? "" : "s"}? This cannot be undone automatically.`,
                      )
                    )
                      return;
                    const reason =
                      bulkStatus === "active"
                        ? undefined
                        : (window.prompt("Reason (optional):", "") ?? undefined);
                    bulkModerate.mutate({
                      userIds: Array.from(selectedUsers),
                      status: bulkStatus,
                      reason,
                    });
                  }}
                >
                  {bulkModerate.isPending ? "Applying…" : "Apply to selected"}
                </Button>
              </>
            )}
          </div>

          <div className="mt-5 space-y-2 sm:hidden">
            {list.isLoading && (
              <div className="rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
                Loading users…
              </div>
            )}
            {!list.isLoading && rows.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
                No users found.
              </div>
            )}
            {rows.map((u: AdminUserRow) => {
              const isMe = u.id === currentUserId;
              const banned = u.moderation_status === "banned";
              const suspended = u.moderation_status === "suspended";
              return (
                <article
                  key={`mobile-${u.id}`}
                  className={`rounded-xl border border-border bg-card p-3 shadow-sm ${banned ? "border-destructive/40 bg-destructive/5" : ""}`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${u.email ?? u.full_name ?? "user"}`}
                      checked={selectedUsers.has(u.id)}
                      disabled={isMe}
                      onChange={(event) =>
                        setSelectedUsers((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(u.id);
                          else next.delete(u.id);
                          return next;
                        })
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-primary"
                    />
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
                      <p className="truncate text-sm font-semibold">
                        {u.full_name ?? "—"}
                        {u.is_admin && (
                          <ShieldCheck
                            className="ml-1 inline h-3.5 w-3.5 text-accent"
                            aria-label="Admin"
                          />
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email ?? "no email"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{new Date(u.created_at).toLocaleDateString()}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${banned ? "bg-destructive/10 text-destructive" : suspended ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted"}`}
                        >
                          {banned ? "Banned" : suspended ? "Suspended" : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {(canManageAdminRoles || canManageMaterialsTrust) && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-2">
                      {canManageAdminRoles && (
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          Admin{" "}
                          <Switch
                            checked={u.is_admin}
                            disabled={setRole.isPending || isMe}
                            onCheckedChange={(v) => setRole.mutate({ user_id: u.id, is_admin: v })}
                            aria-label={`Toggle admin for ${u.email ?? u.id}`}
                          />
                        </label>
                      )}
                      {canManageMaterialsTrust && (
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          Trusted materials{" "}
                          <Switch
                            checked={u.is_materials_trusted}
                            disabled={setMaterialsTrust.isPending}
                            onCheckedChange={(trusted) =>
                              setMaterialsTrust.mutate({ user_id: u.id, trusted })
                            }
                            aria-label={`Toggle trusted materials access for ${u.email ?? u.id}`}
                          />
                        </label>
                      )}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-2">
                    {banned || suspended ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={setModeration.isPending || isMe}
                        onClick={() => setModeration.mutate({ user_id: u.id, status: "active" })}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Restore access
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isMe || setModeration.isPending}
                          onClick={() => {
                            const reason =
                              window.prompt("Suspend reason (optional):", "") ?? undefined;
                            setModeration.mutate({ user_id: u.id, status: "suspended", reason });
                          }}
                        >
                          <ShieldOff className="h-3.5 w-3.5" /> Suspend
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isMe || setModeration.isPending}
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Ban ${u.email ?? u.full_name ?? "user"}? They will lose access.`,
                              )
                            )
                              return;
                            const reason = window.prompt("Ban reason (optional):", "") ?? undefined;
                            setModeration.mutate({ user_id: u.id, status: "banned", reason });
                          }}
                        >
                          <Ban className="h-3.5 w-3.5" /> Ban
                        </Button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-2 pr-3 font-medium">User</th>
                  <th className="py-2 pr-3 font-medium">Joined</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  {canManageAdminRoles && (
                    <th className="py-2 pr-3 text-right font-medium">Admin</th>
                  )}
                  {canManageMaterialsTrust && (
                    <th className="py-2 pr-3 text-right font-medium">Materials</th>
                  )}
                  <th className="py-2 pr-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.isLoading && (
                  <tr>
                    <td
                      colSpan={5 + Number(canManageAdminRoles) + Number(canManageMaterialsTrust)}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Loading…
                    </td>
                  </tr>
                )}
                {!list.isLoading && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5 + Number(canManageAdminRoles) + Number(canManageMaterialsTrust)}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
                {rows.map((u: AdminUserRow) => {
                  const isMe = u.id === currentUserId;
                  const banned = u.moderation_status === "banned";
                  const suspended = u.moderation_status === "suspended";
                  return (
                    <tr key={u.id} className={banned ? "bg-destructive/5" : ""}>
                      <td className="py-3 pr-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${u.email ?? u.full_name ?? "user"}`}
                          checked={selectedUsers.has(u.id)}
                          disabled={isMe}
                          onChange={(event) =>
                            setSelectedUsers((current) => {
                              const next = new Set(current);
                              if (event.target.checked) next.add(u.id);
                              else next.delete(u.id);
                              return next;
                            })
                          }
                          className="h-4 w-4 accent-primary"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                              {(u.full_name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                              {u.full_name ?? "—"}
                              {u.is_admin && (
                                <ShieldCheck
                                  className="h-3.5 w-3.5 text-accent"
                                  aria-label="Admin"
                                />
                              )}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {u.email ?? "no email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-3 text-xs">
                        {banned ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
                            <Ban className="h-3 w-3" /> Banned
                          </span>
                        ) : suspended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 dark:bg-amber-400/15 px-2 py-0.5 font-medium text-amber-600 dark:text-amber-300">
                            <ShieldAlert className="h-3 w-3" /> Suspended
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Active</span>
                        )}
                      </td>
                      {canManageAdminRoles && (
                        <td className="py-3 pr-3">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={u.is_admin}
                              disabled={setRole.isPending || isMe}
                              onCheckedChange={(v) =>
                                setRole.mutate({ user_id: u.id, is_admin: v })
                              }
                              aria-label={`Toggle admin for ${u.email ?? u.id}`}
                            />
                          </div>
                        </td>
                      )}
                      {canManageMaterialsTrust && (
                        <td className="py-3 pr-3">
                          <div className="flex items-center justify-end gap-2">
                            {u.is_materials_trusted && (
                              <BookOpenCheck
                                className="h-3.5 w-3.5 text-accent"
                                aria-hidden="true"
                              />
                            )}
                            <Switch
                              checked={u.is_materials_trusted}
                              disabled={setMaterialsTrust.isPending}
                              onCheckedChange={(trusted) =>
                                setMaterialsTrust.mutate({ user_id: u.id, trusted })
                              }
                              aria-label={`Toggle trusted materials access for ${u.email ?? u.id}`}
                            />
                          </div>
                        </td>
                      )}
                      <td className="py-3 pr-3">
                        <div className="flex items-center justify-end gap-1">
                          {banned || suspended ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={setModeration.isPending}
                              onClick={() =>
                                setModeration.mutate({ user_id: u.id, status: "active" })
                              }
                            >
                              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Unban
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isMe || setModeration.isPending}
                                onClick={() => {
                                  const reason =
                                    window.prompt("Suspend reason (optional):", "") ?? undefined;
                                  setModeration.mutate({
                                    user_id: u.id,
                                    status: "suspended",
                                    reason,
                                  });
                                }}
                                title="Suspend"
                              >
                                <ShieldOff className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isMe || setModeration.isPending}
                                onClick={() => {
                                  if (
                                    !confirm(
                                      `Ban ${u.email ?? u.full_name ?? "user"}? They will lose access.`,
                                    )
                                  )
                                    return;
                                  const reason =
                                    window.prompt("Ban reason (optional):", "") ?? undefined;
                                  setModeration.mutate({ user_id: u.id, status: "banned", reason });
                                }}
                                title="Ban"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{rows.length} user(s) on this page</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || list.isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!list.data?.hasMore || list.isLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
