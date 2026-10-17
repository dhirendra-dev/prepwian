import { createFileRoute } from "@tanstack/react-router";
import { LinkifiedText } from "@/components/LinkifiedText";
import { requirePermission } from "@/lib/admin-guard";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AdminSavedViews } from "@/components/AdminSavedViews";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Scale, CheckCircle2, XCircle, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/appeals")({
  head: () => ({ meta: [{ title: "Appeals — Admin" }, { name: "robots", content: "noindex" }] }),

  beforeLoad: async ({ context }) => {
    await requirePermission(context.user.id, "appeals");
  },

  component: AdminAppeals,
});

type Row = {
  id: string;
  user_id: string;
  message: string;
  status: string;
  admin_response: string | null;
  reviewed_at: string | null;
  created_at: string;
  full_name?: string | null;
};

function AdminAppeals() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-appeals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moderation_appeals")
        .select("id,user_id,message,status,admin_response,reviewed_at,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const rows = (data ?? []) as Row[];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ids);
        const map = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
        rows.forEach((r) => (r.full_name = map.get(r.user_id) ?? null));
      }
      return rows;
    },
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("admin-appeals-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "moderation_appeals" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-appeals"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const response = drafts[id]?.trim() || null;
      const { error } = await supabase
        .from("moderation_appeals")
        .update({
          status,
          admin_response: response,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appeal updated");
      qc.invalidateQueries({ queryKey: ["admin-appeals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    let rows = data ?? [];
    if (filter !== "all") rows = rows.filter((r) => r.status === filter);
    if (q.trim()) {
      const s = q.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.full_name ?? "").toLowerCase().includes(s) ||
          r.message.toLowerCase().includes(s) ||
          r.user_id.includes(s),
      );
    }
    return rows;
  }, [data, filter, q]);

  const counts = useMemo(() => {
    const c = { all: 0, pending: 0, approved: 0, rejected: 0 } as Record<string, number>;
    (data ?? []).forEach((r) => {
      c.all++;
      c[r.status] = (c[r.status] ?? 0) + 1;
    });
    return c;
  }, [data]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Scale className="h-5 w-5 text-accent" />
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Appeals</h1>
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{counts.all ?? 0}</span>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, message…"
              className="pl-8"
            />
          </div>
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}
            >
              {f} <span className="opacity-70">({counts[f] ?? 0})</span>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <AdminSavedViews
            storageKey="appeals"
            filters={{ search: q, status: filter }}
            onApply={(saved) => {
              setQ(saved.search);
              setFilter(saved.status);
            }}
          />
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load: {(error as Error).message}
          </div>
        ) : !filtered.length ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No appeals match.
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{a.full_name ?? a.user_id}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString(undefined, { hour12: true })}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      a.status === "approved"
                        ? "bg-green-500/10 dark:bg-green-400/15 text-green-600 dark:text-green-400"
                        : a.status === "rejected"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{a.message}</p>

                {a.status === "pending" ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Response to the user (optional but recommended)"
                      value={drafts[a.id] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
                      rows={3}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ id: a.id, status: "approved" })}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ id: a.id, status: "rejected" })}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  </div>
                ) : a.admin_response ? (
                  <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Response
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm"><LinkifiedText text={a.admin_response} /></p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
