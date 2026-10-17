/* eslint-disable @typescript-eslint/no-explicit-any */
import { LinkifiedText } from "@/components/LinkifiedText";
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bug,
  Download,
  Inbox,
  Loader2,
  MonitorSmartphone,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useAdminAccess } from "@/hooks/use-auth";
import { requireFullAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import "@/styles/feedback-ultimate.css";

export const Route = createFileRoute("/_authenticated/admin/feedback")({
  beforeLoad: async ({ context }) => {
    await requireFullAdmin((context as any).user.id);
  },
  head: () => ({
    meta: [
      { title: "Feedback Console — PREPWIAN Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminFeedbackPage,
});
type Status =
  | "submitted"
  | "under_review"
  | "planned"
  | "in_progress"
  | "waiting_for_user"
  | "completed"
  | "declined";
type Priority = "low" | "normal" | "high" | "urgent";
type Item = {
  id: string;
  user_id: string;
  kind: "suggestion" | "bug" | "question";
  title: string;
  description: string;
  page_url: string | null;
  status: Status;
  priority: Priority;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  steps_to_reproduce?: string | null;
  expected_behavior?: string | null;
  actual_behavior?: string | null;
  severity?: string | null;
  technical_details?: Record<string, unknown> | null;
  attachments?: { name: string; path: string; size: number; type: string }[] | null;
};
const statusOptions: { value: Status; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_for_user", label: "Waiting for user" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
];
const priorities: Priority[] = ["low", "normal", "high", "urgent"];
function AdminFeedbackPage() {
  const { user, loading: authLoading } = useAuth();
  const access = useAdminAccess(user?.id);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [kindFilter, setKindFilter] = useState<"all" | Item["kind"]>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { status: Status; priority: Priority; response: string }>
  >({});
  const query = useQuery({
    queryKey: ["feedback-admin"],
    enabled: !!user && !authLoading && !access.loading && access.role === "admin",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feedback_submissions")
        .select(
          "id,user_id,kind,title,description,page_url,status,priority,admin_response,created_at,updated_at,steps_to_reproduce,expected_behavior,actual_behavior,severity,technical_details,attachments",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });
  const update = useMutation({
    mutationFn: async ({
      item,
      draft,
    }: {
      item: Item;
      draft: { status: Status; priority: Priority; response: string };
    }) => {
      const { error } = await (supabase as any)
        .from("feedback_submissions")
        .update({
          status: draft.status,
          priority: draft.priority,
          admin_response: draft.response.trim() || null,
          resolved_at: ["completed", "declined"].includes(draft.status)
            ? new Date().toISOString()
            : null,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["feedback-admin"] });
      await qc.invalidateQueries({ queryKey: ["feedback-submissions"] });
      toast.success("Review saved.");
    },
    onError: (e) => {
      console.error(e);
      toast.error("Couldn't save. Check migration and permissions.");
    },
  });
  const items = useMemo(() => query.data ?? [], [query.data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!q || `${i.title} ${i.description} ${i.user_id} ${i.kind}`.toLowerCase().includes(q)) &&
        (statusFilter === "all" || i.status === statusFilter) &&
        (kindFilter === "all" || i.kind === kindFilter),
    );
  }, [items, search, statusFilter, kindFilter]);
  function exportCSV() {
    const cols = [
      "id",
      "user_id",
      "kind",
      "title",
      "description",
      "status",
      "priority",
      "severity",
      "created_at",
      "page_url",
    ];
    const csv = [
      cols.join(","),
      ...filtered.map((i) =>
        cols
          .map((k) => {
            const v = (i as any)[k] ?? "";
            return `"${String(v).replaceAll('"', '""')}"`;
          })
          .join(","),
      ),
    ].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  if (authLoading || access.loading)
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="h-32 animate-pulse rounded-3xl bg-muted" />
      </main>
    );
  if (!user || access.role !== "admin")
    return (
      <main className="mx-auto flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
        <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only authorized administrators can access feedback reports.
        </p>
        <Button asChild className="mt-4 rounded-xl">
          <Link to="/">Return home</Link>
        </Button>
      </main>
    );
  return (
    <main className="feedback-admin-ultimate mx-auto w-full max-w-7xl px-3 pb-12 pt-4 sm:px-6 sm:pt-8">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="rounded-xl">
          <Link to="/feedback">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <ShieldCheck className="h-4 w-4" />
            Admin workspace
          </div>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Feedback control center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Triage, investigate, respond, and export reports.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Refresh inbox"
          onClick={() => void query.refetch()}
        >
          <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total reports", n: items.length },
          {
            label: "Needs review",
            n: items.filter((i) => ["submitted", "under_review"].includes(i.status)).length,
          },
          {
            label: "High impact",
            n: items.filter((i) => ["high", "urgent"].includes(i.severity ?? "")).length,
          },
          { label: "Completed", n: items.filter((i) => i.status === "completed").length },
        ].map((s) => (
          <div
            key={s.label}
            className="fb-admin-metric rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:p-5"
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold">{s.n}</p>
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/70 p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, details, or user ID…"
                className="rounded-xl pl-9"
              />
            </div>
            <select
              aria-label="Filter status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              {[{ value: "all", label: "All statuses" }, ...statusOptions].map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter type"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as typeof kindFilter)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              {[
                { value: "all", label: "All types" },
                { value: "suggestion", label: "Suggestions" },
                { value: "bug", label: "Bugs" },
                { value: "question", label: "Questions" },
              ].map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button variant="outline" className="rounded-xl" onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        {query.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading inbox…</div>
        ) : query.isError ? (
          <div className="p-8 text-center">
            <p className="font-semibold">Couldn't load inbox.</p>
            <Button
              className="mt-3 rounded-xl"
              variant="outline"
              onClick={() => void query.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">No matching reports</p>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {filtered.map((item) => {
              const draft = drafts[item.id] ?? {
                status: item.status,
                priority: item.priority,
                response: item.admin_response ?? "",
              };
              const open = selected === item.id;
              return (
                <article key={item.id} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.kind === "bug" ? "bg-rose-100 text-rose-700" : "bg-primary/10 text-primary"}`}
                    >
                      {item.kind === "bug" ? (
                        <Bug className="h-5 w-5" />
                      ) : item.kind === "suggestion" ? (
                        "✦"
                      ) : (
                        "?"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words font-bold">{item.title}</h2>
                        <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase">
                          {item.kind}
                        </span>
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                          {item.status.replaceAll("_", " ")}
                        </span>
                        {item.technical_details && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">
                            Diagnostics
                          </span>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        <LinkifiedText text={item.description} />
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        <span>
                          User: <code>{item.user_id}</code>
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                        {item.severity && <span>Impact: {item.severity}</span>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setSelected(open ? null : item.id)}
                    >
                      {open ? "Close" : "Review"}
                    </Button>
                  </div>
                  {open && (
                    <div className="mt-4 space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
                      {(item.steps_to_reproduce ||
                        item.expected_behavior ||
                        item.actual_behavior) && (
                        <div className="grid gap-3 sm:grid-cols-3">
                          {[
                            { label: "Steps", value: item.steps_to_reproduce },
                            { label: "Expected", value: item.expected_behavior },
                            { label: "Actual", value: item.actual_behavior },
                          ].map((x) => (
                            <div key={x.label} className="rounded-xl bg-background p-3">
                              <p className="text-xs font-bold">{x.label}</p>
                              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                                {x.value ? <LinkifiedText text={x.value} /> : "Not provided"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.technical_details && (
                        <div className="rounded-xl border border-border/70 bg-background p-3">
                          <div className="flex items-center gap-2 font-bold">
                            <MonitorSmartphone className="h-4 w-4 text-primary" />
                            Technical diagnostics
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            {Object.entries(item.technical_details).map(([k, v]) => (
                              <div key={k} className="rounded-lg bg-muted/50 p-2">
                                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                  {k}
                                </p>
                                <p className="mt-1 break-words text-xs">
                                  {v === null ? "Not available" : String(v)}
                                </p>
                              </div>
                            ))}
                          </div>
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs font-semibold text-primary">
                              Raw JSON
                            </summary>
                            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-[11px]">
                              {JSON.stringify(item.technical_details, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                      {(item.attachments?.length ?? 0) > 0 && (
                        <div className="rounded-xl bg-background p-3">
                          <p className="text-sm font-bold">Screenshots</p>
                          <div className="mt-2 space-y-2">
                            {(item.attachments ?? []).map((f) => (
                              <div key={f.path} className="flex items-center gap-2 text-xs">
                                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg"
                                  onClick={async () => {
                                    const { data, error } = await supabase.storage
                                      .from("feedback-attachments")
                                      .createSignedUrl(f.path, 60);
                                    if (error || !data?.signedUrl) {
                                      toast.error("Could not open private screenshot.");
                                      return;
                                    }
                                    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
                                  }}
                                >
                                  View securely
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`st-${item.id}`}>Status</Label>
                          <select
                            id={`st-${item.id}`}
                            value={draft.status}
                            onChange={(e) =>
                              setDrafts((old) => ({
                                ...old,
                                [item.id]: { ...draft, status: e.target.value as Status },
                              }))
                            }
                            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                          >
                            {statusOptions.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`pr-${item.id}`}>Priority</Label>
                          <select
                            id={`pr-${item.id}`}
                            value={draft.priority}
                            onChange={(e) =>
                              setDrafts((old) => ({
                                ...old,
                                [item.id]: { ...draft, priority: e.target.value as Priority },
                              }))
                            }
                            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                          >
                            {priorities.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`resp-${item.id}`}>Response to student</Label>
                        <Textarea
                          id={`resp-${item.id}`}
                          value={draft.response}
                          maxLength={3000}
                          onChange={(e) =>
                            setDrafts((old) => ({
                              ...old,
                              [item.id]: { ...draft, response: e.target.value },
                            }))
                          }
                          placeholder="Write an update…"
                          className="min-h-24 rounded-xl bg-background"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          className="rounded-xl"
                          disabled={update.isPending}
                          onClick={() => update.mutate({ item, draft })}
                        >
                          {update.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save review
                        </Button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
