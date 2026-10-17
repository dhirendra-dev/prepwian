import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireFullAdmin } from "@/lib/admin-guard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Clock3, KeyRound, Loader2, Search, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/developer-access")({
  head: () => ({
    meta: [{ title: "Developer Access Requests — Admin" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async ({ context }) => {
    await requireFullAdmin(context.user.id);
  },
  component: AdminDeveloperAccess,
});

type RequestRow = {
  id: string;
  requester_id: string;
  requester_email: string | null;
  purpose: string;
  details: string;
  requested_duration: string;
  status: "pending" | "approved" | "rejected";
  approved_until: string | null;
  reviewer_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function expiryFor(duration: string) {
  const hours = duration === "1 hour" ? 1 : duration === "1 week" ? 24 * 7 : 24;
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function AdminDeveloperAccess() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const requests = useQuery({
    queryKey: ["admin-developer-access-requests"],
    queryFn: async () => {
      // This table is introduced by the accompanying migration; generated types may lag locally.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("developer_access_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RequestRow[];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: "approved" | "rejected" }) => {
      const row = requests.data?.find((request) => request.id === id);
      if (!row) throw new Error("Request is no longer available.");
      const reviewerNote = notes[id]?.trim() || null;
      // This table is introduced by the accompanying migration; generated types may lag locally.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedRequest, error } = await (supabase as any)
        .from("developer_access_requests")
        .update({
          status: decision,
          approved_until: decision === "approved" ? expiryFor(row.requested_duration) : null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_note: reviewerNote,
        })
        .eq("id", id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!updatedRequest) throw new Error("This request has already been reviewed.");
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.decision === "approved"
          ? "Temporary developer access approved."
          : "Access request rejected.",
      );
      queryClient.invalidateQueries({ queryKey: ["admin-developer-access-requests"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return requests.data ?? [];
    return (requests.data ?? []).filter((row) =>
      [row.requester_email, row.purpose, row.details, row.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [requests.data, search]);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-cyan-300">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-cyan-300">
                Administrator review
              </p>
              <h1 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-3xl">
                Developer Access Requests
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Approve or reject temporary access requests submitted by authenticated users.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
            <span className="font-semibold">
              {requests.data?.filter((row) => row.status === "pending").length ?? 0}
            </span>{" "}
            pending review
          </div>
        </header>

        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search requester, purpose, or details…"
            className="pl-9"
          />
        </div>

        {requests.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading access requests…
          </div>
        ) : requests.isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
            Could not load developer access requests. Refresh and try again.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
            <KeyRound className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">No access requests found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New temporary access requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((row) => {
              const pending = row.status === "pending";
              return (
                <article
                  key={row.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{row.purpose}</h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                            row.status === "pending"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : row.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          }`}
                        >
                          {row.status}
                        </span>
                      </div>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {row.requester_email ?? row.requester_id} · submitted{" "}
                        {formatDate(row.created_at)}
                      </p>
                    </div>
                    <div className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" /> {row.requested_duration}
                    </div>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap rounded-xl border border-border/70 bg-muted/20 p-4 text-sm leading-6">
                    {row.details}
                  </p>

                  {row.status === "approved" && (
                    <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Access expires {formatDate(row.approved_until)} · reviewed{" "}
                      {formatDate(row.reviewed_at)}
                    </p>
                  )}
                  {row.reviewer_note && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Reviewer note: {row.reviewer_note}
                    </p>
                  )}

                  {pending && (
                    <div className="mt-4 border-t border-border/70 pt-4">
                      <label
                        className="block text-xs font-semibold"
                        htmlFor={`review-note-${row.id}`}
                      >
                        Reviewer note{" "}
                        <span className="font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <Input
                        id={`review-note-${row.id}`}
                        value={notes[row.id] ?? ""}
                        onChange={(event) =>
                          setNotes((current) => ({ ...current, [row.id]: event.target.value }))
                        }
                        placeholder="Add context for the decision"
                        maxLength={500}
                        className="mt-1.5 max-w-2xl"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          onClick={() => review.mutate({ id: row.id, decision: "approved" })}
                          disabled={review.isPending}
                          className="bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          <Check className="mr-1.5 h-4 w-4" /> Approve access
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => review.mutate({ id: row.id, decision: "rejected" })}
                          disabled={review.isPending}
                          className="text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
                        >
                          <X className="mr-1.5 h-4 w-4" /> Reject request
                        </Button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
