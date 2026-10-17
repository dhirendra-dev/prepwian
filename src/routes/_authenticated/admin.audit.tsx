import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AdminSavedViews } from "@/components/AdminSavedViews";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogIn,
  UserPlus,
  LogOut,
  FileClock,
} from "lucide-react";
import { adminListAuditLogs, type AuditLogRow } from "@/lib/audit.functions";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({ meta: [{ title: "Admin · Audit Log — JEE Prep Hub" }] }),
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
  component: AdminAudit,
});

const ACTIONS = [
  { value: "", label: "All actions" },
  { value: "admin.role.grant", label: "Admin granted" },
  { value: "admin.role.revoke", label: "Admin revoked" },
  { value: "auth.sign_in", label: "Sign in" },
  { value: "auth.sign_up", label: "Sign up" },
  { value: "auth.sign_out", label: "Sign out" },
];

function actionIcon(action: string) {
  if (action.startsWith("admin.role")) return <ShieldCheck className="h-3.5 w-3.5" />;
  if (action === "auth.sign_in") return <LogIn className="h-3.5 w-3.5" />;
  if (action === "auth.sign_up") return <UserPlus className="h-3.5 w-3.5" />;
  if (action === "auth.sign_out") return <LogOut className="h-3.5 w-3.5" />;
  return <FileClock className="h-3.5 w-3.5" />;
}

function actionLabel(action: string) {
  const m = ACTIONS.find((a) => a.value === action);
  return m?.label ?? action;
}

function actionTone(action: string) {
  if (action === "admin.role.grant")
    return "bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-400";
  if (action === "admin.role.revoke")
    return "bg-rose-500/10 dark:bg-rose-400/15 text-rose-600 dark:text-rose-400";
  if (action === "auth.sign_in")
    return "bg-sky-500/10 dark:bg-sky-400/15 text-sky-600 dark:text-sky-400";
  if (action === "auth.sign_up")
    return "bg-violet-500/10 dark:bg-violet-400/15 text-violet-600 dark:text-violet-400";
  return "bg-muted text-foreground";
}

function auditCsvField(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function downloadAuditCsv(rows: AuditLogRow[]) {
  const columns = ["created_at", "action", "actor_email", "target_email", "metadata"] as const;
  const csv = [
    columns.join(","),
    ...rows.map((row) =>
      columns
        .map((column) =>
          auditCsvField(column === "metadata" ? JSON.stringify(row.metadata ?? {}) : row[column]),
        )
        .join(","),
    ),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `jph-audit-page-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function AdminAudit() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  const list = useQuery({
    queryKey: ["admin-audit", page, search, action],
    queryFn: () =>
      adminListAuditLogs({
        data: {
          search: search || undefined,
          action: action || undefined,
          page,
        },
      }),
  });

  const rows = list.data?.rows ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Audit log</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Tracks admin role changes and user sign-in events.{" "}
                {list.data ? `${list.data.total} total entries.` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                aria-label="Filter by action"
              >
                {ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Search by email or action…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="sm:w-64"
              />
            </div>
          </div>

          <div className="mb-3 mt-4">
            <AdminSavedViews
              storageKey="audit-log"
              filters={{ search, action }}
              onApply={(saved) => {
                setSearch(saved.search);
                setAction(saved.action);
                setPage(1);
              }}
            />
          </div>
          <div className="mb-3 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              disabled={!rows.length}
              onClick={() => downloadAuditCsv(rows)}
            >
              <Download className="h-3.5 w-3.5" /> Export current page CSV
            </Button>
          </div>
          <div className="mt-5 space-y-2 sm:hidden">
            {list.isLoading && (
              <div className="rounded-xl border border-border bg-muted/20 p-5 text-center text-sm text-muted-foreground">
                Loading audit events…
              </div>
            )}
            {!list.isLoading && rows.length === 0 && (
              <div className="rounded-xl border border-border bg-muted/20 p-5 text-center text-sm text-muted-foreground">
                No audit entries yet.
              </div>
            )}
            {rows.map((row: AuditLogRow) => (
              <article
                key={`mobile-${row.id}`}
                className="min-w-0 rounded-xl border border-border bg-background/60 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${actionTone(row.action)}`}
                  >
                    {actionIcon(row.action)}
                    {actionLabel(row.action)}
                  </span>
                  <time className="text-[11px] text-muted-foreground" dateTime={row.created_at}>
                    {new Date(row.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
                <div className="mt-2 grid gap-1 text-xs">
                  <p className="break-all">
                    <span className="text-muted-foreground">Actor: </span>
                    {row.actor_email ?? "System"}
                  </p>
                  <p className="break-all">
                    <span className="text-muted-foreground">Target: </span>
                    {row.target_email ?? "—"}
                  </p>
                  {row.metadata && Object.keys(row.metadata as object).length > 0 && (
                    <code className="mt-1 block break-all rounded-lg bg-muted p-2 text-[10px] text-muted-foreground">
                      {JSON.stringify(row.metadata)}
                    </code>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-5 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">When</th>
                  <th className="py-2 pr-3 font-medium">Action</th>
                  <th className="py-2 pr-3 font-medium">Actor</th>
                  <th className="py-2 pr-3 font-medium">Target</th>
                  <th className="py-2 pr-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.isLoading && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                )}
                {!list.isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      No audit entries yet.
                    </td>
                  </tr>
                )}
                {rows.map((r: AuditLogRow) => (
                  <tr key={r.id} className="align-top">
                    <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                        hour12: true,
                      })}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${actionTone(r.action)}`}
                      >
                        {actionIcon(r.action)}
                        {actionLabel(r.action)}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {r.actor_email ?? <span className="text-muted-foreground">system</span>}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {r.target_email ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {r.metadata && Object.keys(r.metadata as object).length > 0 ? (
                        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                          {JSON.stringify(r.metadata)}
                        </code>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Page {list.data?.page ?? page}</span>
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
