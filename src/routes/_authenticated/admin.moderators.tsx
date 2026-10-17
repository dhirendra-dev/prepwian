import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { requireFullAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, UserCog, Trash2, ShieldCheck } from "lucide-react";
import { PERMISSION_KEYS, PERMISSION_LABELS, type PermissionKey } from "@/lib/permissions";
import {
  adminListModerators,
  adminCreateModerator,
  adminUpdateModeratorPermissions,
  adminRevokeModerator,
  type ModeratorRow,
} from "@/lib/moderators.functions";

export const Route = createFileRoute("/_authenticated/admin/moderators")({
  head: () => ({
    meta: [{ title: "Admin · Moderators — JEE Prep Hub" }, { name: "robots", content: "noindex" }],
  }),
  ssr: false,
  beforeLoad: async ({ context }) => {
    await requireFullAdmin(context.user.id);
  },
  component: AdminModerators,
});

const TABS = [
  { to: "/admin/users", label: "Users" },
  { to: "/admin/moderators", label: "Moderators" },
  { to: "/admin/materials", label: "Materials" },
  { to: "/admin/community", label: "Community" },
  { to: "/admin/certificates", label: "Certificates" },
  { to: "/admin/audit", label: "Audit Log" },
  { to: "/admin/security", label: "Security" },
] as const;

function PermissionGrid({
  value,
  onChange,
}: {
  value: PermissionKey[];
  onChange: (next: PermissionKey[]) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PERMISSION_KEYS.map((key) => {
        const checked = value.includes(key);
        return (
          <label
            key={key}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 text-xs hover:bg-muted"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) =>
                onChange(e.target.checked ? [...value, key] : value.filter((k) => k !== key))
              }
              className="h-4 w-4 accent-primary"
            />
            <span>{PERMISSION_LABELS[key]}</span>
          </label>
        );
      })}
    </div>
  );
}

function AdminModerators() {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [perms, setPerms] = useState<PermissionKey[]>([]);
  const [creds, setCreds] = useState<{ email: string; password: string; full_name: string } | null>(
    null,
  );
  const [editing, setEditing] = useState<ModeratorRow | null>(null);
  const [editPerms, setEditPerms] = useState<PermissionKey[]>([]);

  const list = useQuery({ queryKey: ["admin-moderators"], queryFn: () => adminListModerators() });

  const create = useMutation({
    mutationFn: () =>
      adminCreateModerator({
        data: { full_name: fullName.trim(), email: email.trim(), permissions: perms },
      }),
    onSuccess: (r) => {
      setCreds(r);
      setFullName("");
      setEmail("");
      setPerms([]);
      qc.invalidateQueries({ queryKey: ["admin-moderators"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (input: { user_id: string; permissions: PermissionKey[] }) =>
      adminUpdateModeratorPermissions({ data: input }),
    onSuccess: () => {
      toast.success("Permissions updated");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-moderators"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (user_id: string) => adminRevokeModerator({ data: { user_id } }),
    onSuccess: () => {
      toast.success("Access revoked");
      qc.invalidateQueries({ queryKey: ["admin-moderators"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const credentialText = creds
    ? `JEE Prep Hub — Admin Access\nName: ${creds.full_name}\nLogin email: ${creds.email}\nPassword: ${creds.password}\nLogin here: https://jeeprephub.co.in/auth\n\nKeep this confidential. Please change your password after first login.`
    : "";

  return (
    <AppShell>
      <div className="mx-auto mb-6 flex max-w-6xl flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className={
              t.to === "/admin/moderators"
                ? "rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
                : "rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mx-auto max-w-6xl space-y-5">
        {creds ? (
          <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 p-5">
            <h2 className="font-display text-lg font-semibold">
              Credentials — copy and send to them
            </h2>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              This password is shown once and can never be retrieved again.
            </p>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-xs">
              {credentialText}
            </pre>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(credentialText).then(
                    () => toast.success("Copied"),
                    () => toast.error("Could not copy"),
                  );
                }}
              >
                <Copy className="mr-1.5 h-4 w-4" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCreds(null)}>
                Done
              </Button>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Create moderator</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Limited-access admin. Moderators can never change roles, delete users, or open
              Security / Audit.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                placeholder="Login email (optional — auto-generated if blank)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Permissions
              </p>
              <PermissionGrid value={perms} onChange={setPerms} />
            </div>
            <Button
              className="mt-4"
              disabled={fullName.trim().length < 2 || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Creating…" : "Create account"}
            </Button>
          </section>
        )}

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Existing moderators</h2>
          {list.isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
          ) : (list.data?.rows ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No moderators yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              <div className="space-y-2 sm:hidden">
                {(list.data?.rows ?? []).map((m) => (
                  <article
                    key={`mobile-${m.user_id}`}
                    className="min-w-0 rounded-xl border border-border bg-background/60 p-3"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{m.full_name ?? "—"}</p>
                        <p className="break-all text-xs text-muted-foreground">{m.email ?? "—"}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.permissions.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No section access</span>
                      ) : (
                        m.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
                          >
                            {permission}
                          </span>
                        ))
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(m);
                          setEditPerms(m.permissions as PermissionKey[]);
                        }}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Edit access
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm(`Revoke admin access for ${m.full_name ?? m.email}?`))
                            revoke.mutate(m.user_id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Revoke
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Permissions</th>
                      <th className="pb-2">Created</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(list.data?.rows ?? []).map((m) => (
                      <tr key={m.user_id}>
                        <td className="py-2 font-medium">{m.full_name ?? "—"}</td>
                        <td className="py-2 text-xs text-muted-foreground">{m.email ?? "—"}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {m.permissions.length === 0 ? (
                              <span className="text-xs text-muted-foreground">none</span>
                            ) : (
                              m.permissions.map((p) => (
                                <span
                                  key={p}
                                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
                                >
                                  {p}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-2">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditing(m);
                                setEditPerms(m.permissions as PermissionKey[]);
                              }}
                            >
                              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Revoke admin access for ${m.full_name ?? m.email}?`,
                                  )
                                ) {
                                  revoke.mutate(m.user_id);
                                }
                              }}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Revoke
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {editing && (
          <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="font-display text-base font-semibold">
              Edit permissions — {editing.full_name ?? editing.email}
            </h3>
            <div className="mt-3">
              <PermissionGrid value={editPerms} onChange={setEditPerms} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                disabled={update.isPending}
                onClick={() => update.mutate({ user_id: editing.user_id, permissions: editPerms })}
              >
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
