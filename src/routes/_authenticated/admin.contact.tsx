import { LinkifiedText } from "@/components/LinkifiedText";
import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/lib/admin-guard";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AdminSavedViews } from "@/components/AdminSavedViews";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Inbox,
  Send,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  BookTemplate,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/contact")({
  head: () => ({
    meta: [{ title: "Contact Inbox — Admin" }, { name: "robots", content: "noindex" }],
  }),

  beforeLoad: async ({ context }) => {
    await requirePermission(context.user.id, "contact");
  },

  component: AdminContactInbox,
});

type Row = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  subject: string;
  body: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
};

type Template = { id: string; name: string; body: string };
const TEMPLATE_KEY = "admin.contact.replyTemplates.v1";

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "ack",
    name: "Acknowledge receipt",
    body: "Hi {name},\n\nThanks for reaching out — we've received your message and will look into it shortly.\n\n— PREPWIAN Team",
  },
  {
    id: "resolved",
    name: "Issue resolved",
    body: "Hi {name},\n\nThe issue you reported has been fixed. Please refresh the app and let us know if it persists.\n\n— PREPWIAN Team",
  },
  {
    id: "need-info",
    name: "Need more info",
    body: "Hi {name},\n\nCould you share a few more details (screenshot, exact steps, device/browser)? That will help us reproduce and fix this faster.\n\n— PREPWIAN Team",
  },
];

function loadTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY);
    if (!raw) return DEFAULT_TEMPLATES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}
function saveTemplates(t: Template[]) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(t));
}

const PAGE_SIZE = 15;

function contactCsvField(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function downloadContactCsv(rows: Row[]) {
  const columns = [
    "created_at",
    "subject",
    "user_email",
    "user_id",
    "status",
    "body",
    "admin_reply",
  ] as const;
  const csv = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => contactCsvField(row[column])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `jph-contact-page-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function AdminContactInbox() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "new" | "in_progress" | "resolved" | "unread"
  >("all");
  const [page, setPage] = useState(0);
  const [templates, setTemplates] = useState<Template[]>(() => loadTemplates());
  const [showTplMgr, setShowTplMgr] = useState(false);
  const [newTpl, setNewTpl] = useState({ name: "", body: "" });

  useEffect(() => saveTemplates(templates), [templates]);
  useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id,user_id,user_email,subject,body,status,admin_reply,replied_at,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((m) => {
      if (statusFilter === "unread" && m.admin_reply) return false;
      if (statusFilter !== "all" && statusFilter !== "unread" && m.status !== statusFilter)
        return false;
      if (!q) return true;
      return (
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        (m.user_email ?? "").toLowerCase().includes(q) ||
        (m.user_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const counts = useMemo(() => {
    const c = { all: 0, new: 0, in_progress: 0, resolved: 0, unread: 0 };
    (data ?? []).forEach((m) => {
      c.all++;
      if (m.status === "new") c.new++;
      else if (m.status === "in_progress") c.in_progress++;
      else if (m.status === "resolved") c.resolved++;
      if (!m.admin_reply) c.unread++;
    });
    return c;
  }, [data]);

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-contact-messages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reply = useMutation({
    mutationFn: async (id: string) => {
      const text = drafts[id]?.trim();
      if (!text) throw new Error("Write a reply first.");
      const { error } = await supabase
        .from("contact_messages")
        .update({
          admin_reply: text,
          replied_at: new Date().toISOString(),
          replied_by: user.id,
          status: "resolved",
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, id) => {
      toast.success("Reply sent — user notified.");
      setDrafts((d) => ({ ...d, [id]: "" }));
      qc.invalidateQueries({ queryKey: ["admin-contact-messages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function applyTemplate(id: string, tpl: Template, row: Row) {
    const name = row.user_email?.split("@")[0] || "there";
    const body = tpl.body.replaceAll("{name}", name).replaceAll("{subject}", row.subject);
    setDrafts((d) => ({ ...d, [id]: (d[id] ? d[id] + "\n\n" : "") + body }));
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Inbox className="h-5 w-5 shrink-0 text-accent" />
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Contact Inbox</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!pageRows.length}
              onClick={() => downloadContactCsv(pageRows)}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export page CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowTplMgr((v) => !v)}>
              <BookTemplate className="mr-1.5 h-3.5 w-3.5" /> Templates
            </Button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, body, email…"
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "unread", "new", "in_progress", "resolved"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                  statusFilter === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.replace("_", " ")} · {counts[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <AdminSavedViews
            storageKey="contact-inbox"
            filters={{ search, statusFilter }}
            onApply={(saved) => {
              setSearch(saved.search);
              setStatusFilter(saved.statusFilter);
            }}
          />
        </div>

        {/* Template manager */}
        {showTplMgr && (
          <div className="mb-3 space-y-2 rounded-xl border border-border bg-card p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reply templates
            </div>
            <ul className="space-y-1.5">
              {templates.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{t.name}</div>
                    <div className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">
                      {t.body}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setTemplates((ts) => ts.filter((x) => x.id !== t.id))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <Input
                placeholder="Template name"
                value={newTpl.name}
                onChange={(e) => setNewTpl((v) => ({ ...v, name: e.target.value }))}
              />
              <Input
                placeholder="Body (supports {name}, {subject})"
                value={newTpl.body}
                onChange={(e) => setNewTpl((v) => ({ ...v, body: e.target.value }))}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (!newTpl.name.trim() || !newTpl.body.trim())
                    return toast.error("Name and body required");
                  setTemplates((ts) => [...ts, { id: crypto.randomUUID(), ...newTpl }]);
                  setNewTpl({ name: "", body: "" });
                }}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !pageRows.length ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No messages match.
          </div>
        ) : (
          <ul className="space-y-3">
            {pageRows.map((m) => (
              <li key={m.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{m.subject}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {m.user_email ?? m.user_id ?? "unknown"} ·{" "}
                      {new Date(m.created_at).toLocaleString(undefined, { hour12: true })}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      m.status === "new"
                        ? "bg-blue-500/10 dark:bg-blue-400/15 text-blue-600 dark:text-blue-400"
                        : m.status === "resolved"
                          ? "bg-green-500/10 dark:bg-green-400/15 text-green-600 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground"><LinkifiedText text={m.body} /></p>

                {m.admin_reply && (
                  <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                      Your reply{" "}
                      {m.replied_at
                        ? `· ${new Date(m.replied_at).toLocaleString(undefined, { hour12: true })}`
                        : ""}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm"><LinkifiedText text={m.admin_reply} /></p>
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  {templates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[11px] text-muted-foreground">Insert:</span>
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => applyTemplate(m.id, t, m)}
                          className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <Textarea
                    placeholder={
                      m.admin_reply
                        ? "Send a follow-up reply…"
                        : "Write a reply (user gets a notification)"
                    }
                    value={drafts[m.id] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                    rows={3}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => reply.mutate(m.id)} disabled={reply.isPending}>
                      <Send className="mr-1.5 h-3.5 w-3.5" /> Send reply
                    </Button>
                    {m.user_email && (
                      <Button asChild size="sm" variant="outline">
                        <a
                          href={`mailto:${m.user_email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                        >
                          <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
                        </a>
                      </Button>
                    )}
                    {m.status !== "in_progress" && m.status !== "resolved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus.mutate({ id: m.id, status: "in_progress" })}
                      >
                        Mark in progress
                      </Button>
                    )}
                    {m.status !== "resolved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus.mutate({ id: m.id, status: "resolved" })}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min(filtered.length, (page + 1) * PAGE_SIZE)} of{" "}
              {filtered.length}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
