import { LinkifiedText } from "@/components/LinkifiedText";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Scale, Clock, CheckCircle2, XCircle, Send, FileText, Gavel } from "lucide-react";

export const Route = createFileRoute("/_authenticated/appeal")({
  head: () => ({ meta: [
      { name: "description", content: "Submit an appeal about your PREPWIAN account." },
      { property: "og:title", content: "Appeal My Account — PREPWIAN" },
      { property: "og:description", content: "Submit an appeal about your PREPWIAN account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Appeal My Account — PREPWIAN" },
      { name: "twitter:description", content: "Submit an appeal about your PREPWIAN account." },
{ title: "Appeal My Account — PREPWIAN" }, { name: "robots", content: "noindex" }] }),
  component: AppealPage,
});

type Appeal = {
  id: string;
  message: string;
  status: string;
  admin_response: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

function fmt(d?: string | null) {
  return d ? new Date(d).toLocaleString(undefined, { hour12: true }) : null;
}

function Timeline({ a }: { a: Appeal }) {
  const isDecided = a.status === "approved" || a.status === "rejected";
  const isRejected = a.status === "rejected";
  const steps = [
    {
      key: "submitted",
      icon: <FileText className="h-4 w-4" />,
      label: "Submitted",
      time: fmt(a.created_at),
      done: true,
      tone: "bg-primary text-primary-foreground",
    },
    {
      key: "review",
      icon: <Gavel className="h-4 w-4" />,
      label: isDecided ? "Reviewed by admin team" : "Under admin review",
      time: isDecided ? fmt(a.reviewed_at) : "In progress…",
      done: true,
      tone: isDecided ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white animate-pulse",
    },
    {
      key: "decision",
      icon: isDecided ? (isRejected ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />) : <Clock className="h-4 w-4" />,
      label: isDecided ? (isRejected ? "Appeal rejected" : "Appeal approved") : "Awaiting decision",
      time: isDecided ? fmt(a.reviewed_at) : "Pending",
      done: isDecided,
      tone: !isDecided
        ? "bg-muted text-muted-foreground"
        : isRejected
          ? "bg-destructive text-destructive-foreground"
          : "bg-green-600 text-white",
    },
  ];

  return (
    <ol className="relative mt-3 space-y-4 border-l border-border pl-6">
      {steps.map((s) => (
        <li key={s.key} className="relative">
          <span className={`absolute -left-[30px] flex h-6 w-6 items-center justify-center rounded-full ${s.tone}`}>
            {s.icon}
          </span>
          <div className="text-sm font-medium text-foreground">{s.label}</div>
          <div className="text-xs text-muted-foreground">{s.time}</div>
        </li>
      ))}
    </ol>
  );
}

function AppealPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: appeals, isLoading } = useQuery({
    queryKey: ["my-appeals", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moderation_appeals")
        .select("id,message,status,admin_response,reviewed_at,created_at,updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Appeal[];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const body = message.trim();
      if (body.length < 20) throw new Error("Please write at least 20 characters explaining your appeal.");
      const { error } = await supabase.from("moderation_appeals").insert({ user_id: user.id, message: body });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appeal submitted — admins have been notified.");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["my-appeals", user.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = appeals?.find((a) => a.status === "pending");

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Scale className="h-5 w-5 text-accent" />
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Appeal My Account</h1>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Submit a written appeal for account moderation or to request consent revocation. The admin team will review and respond, and you'll be notified in-app.
        </p>

        {!pending && (
          <form
            onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}
            className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
          >
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain the situation, what happened, and why the action should be reversed…"
              rows={6}
              maxLength={3000}
              required
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{message.length}/3000</span>
              <Button type="submit" disabled={submit.isPending}>
                <Send className="mr-2 h-4 w-4" /> {submit.isPending ? "Submitting…" : "Submit appeal"}
              </Button>
            </div>
          </form>
        )}

        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Your appeals</h2>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !appeals?.length ? (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            No appeals yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {appeals.map((a) => {
              const badge =
                a.status === "approved" ? { c: "bg-green-500/10 text-green-600", i: <CheckCircle2 className="h-3.5 w-3.5" /> }
                : a.status === "rejected" ? { c: "bg-destructive/10 text-destructive", i: <XCircle className="h-3.5 w-3.5" /> }
                : { c: "bg-amber-500/10 text-amber-600", i: <Clock className="h-3.5 w-3.5" /> };
              return (
                <li key={a.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      Filed {fmt(a.created_at)}
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.c}`}>
                      {badge.i} {a.status}
                    </span>
                  </div>

                  <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your message</div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground"><LinkifiedText text={a.message} /></p>
                  </div>

                  <div className="mt-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Timeline</div>
                    <Timeline a={a} />
                  </div>

                  {a.admin_response && (
                    <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                        Admin resolution {a.reviewed_at ? `· ${fmt(a.reviewed_at)}` : ""}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground"><LinkifiedText text={a.admin_response} /></p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
