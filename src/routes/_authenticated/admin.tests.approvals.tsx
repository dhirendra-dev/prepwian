import { createFileRoute, Link } from "@tanstack/react-router";
import { requireFullAdmin } from "@/lib/admin-guard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListTests, adminReviewCreatedTest, adminListAiAccess, adminSetAiAccess } from "@/lib/tests.functions";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldAlert, Check, X, Eye, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/tests/approvals")({
  head: () => ({ meta: [{ title: "Admin — CBT Approvals | PREPWIAN" }, { name: "robots", content: "noindex" }] }),

  beforeLoad: async ({ context }) => {
    await requireFullAdmin(context.user.id);
  },

  component: AdminApprovals,
});

function AdminApprovals() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const listFn = useServerFn(adminListTests);
  const reviewFn = useServerFn(adminReviewCreatedTest);
  const aiListFn = useServerFn(adminListAiAccess);
  const aiSetFn = useServerFn(adminSetAiAccess);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-tests"], queryFn: () => listFn(), enabled: isAdmin });
  const { data: aiAccess } = useQuery({ queryKey: ["admin-tests-ai-access"], queryFn: () => aiListFn(), enabled: isAdmin });
  const exemptions = ((aiAccess as any[]) ?? []);
  const pendingAi = exemptions.filter((r) => r.status === "pending");
  const approvedAi = exemptions.filter((r) => r.status === "approved");
  const label = (r: any) => r.profile?.full_name ?? r.profile?.username ?? r.user_id;

  async function decideAi(userId: string, decision: "approved" | "rejected" | "revoked") {
    setBusy(`ai-${userId}`);
    try {
      await aiSetFn({ data: { user_id: userId, decision, note: (notes[`ai-${userId}`] ?? "").trim() || undefined } });
      toast.success(
        decision === "approved" ? "Site AI unlocked for this user"
        : decision === "rejected" ? "Request declined" : "Exemption revoked",
      );
      qc.invalidateQueries({ queryKey: ["admin-tests-ai-access"] });
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    setBusy(null);
  }

  if (!user) return null;
  if (!isAdmin) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md rounded-lg border bg-card p-6 text-center">
          <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-red-500 dark:text-red-400" />
          <p className="text-sm">Admin access required.</p>
        </div>
      </AppShell>
    );
  }

  const all = ((data as any[]) ?? []);
  const pending = all.filter((t) => t.approval_status === "pending");
  const decided = all.filter((t) => ["approved", "rejected"].includes(t.approval_status)).slice(0, 30);

  async function review(testId: string, decision: "approved" | "rejected") {
    if (decision === "rejected" && !(notes[testId] ?? "").trim()) { toast.error("Add a reason so the creator can fix it"); return; }
    setBusy(testId);
    try {
      await reviewFn({ data: { testId, decision, notes: (notes[testId] ?? "").trim() || undefined } });
      toast.success(decision === "approved" ? "Approved & published for all learners" : "Sent back to the creator");
      qc.invalidateQueries({ queryKey: ["admin-tests"] });
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    setBusy(null);
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">CBT approvals</h1>
          <p className="text-sm text-muted-foreground">Tests created by learners waiting to go live on the site.</p>
        </div>
        <Button asChild size="sm" variant="outline"><Link to="/admin/tests">Manage all tests</Link></Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pending ({pending.length})</h2>
            {pending.length === 0 && <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">Nothing waiting for review.</div>}
            {pending.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                    <Badge variant="outline" className="uppercase">{String(t.exam_type).replace(/_/g, " ")}</Badge>
                    <Badge variant="outline" className="uppercase">{t.subject}</Badge>
                    <Badge variant="outline">{t.duration_min} min</Badge>
                    <Badge className="bg-blue-600">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    placeholder="Review note (required when sending back)"
                    value={notes[t.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [t.id]: e.target.value }))}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => review(t.id, "approved")} disabled={busy === t.id}>
                      {busy === t.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />} Approve & publish
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 dark:text-red-400" onClick={() => review(t.id, "rejected")} disabled={busy === t.id}>
                      <X className="mr-1.5 h-4 w-4" /> Send back
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/admin/tests/$testId" params={{ testId: t.id }}><Eye className="mr-1.5 h-4 w-4" /> Review questions</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">AI key exemption requests ({pendingAi.length} pending)</h2>
            {pendingAi.length === 0 ? (
              <div className="rounded-lg border bg-card p-4 text-center text-xs text-muted-foreground">
                No pending requests. Users ask for this from the AI settings on “Create CBT”.
              </div>
            ) : (
              pendingAi.map((r) => (
                <Card key={r.user_id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{label(r)}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Requested {new Date(r.requested_at).toLocaleString()}{r.reason ? ` — “${r.reason}”` : ""}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      placeholder="Note to the user (required when declining)"
                      value={notes[`ai-${r.user_id}`] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [`ai-${r.user_id}`]: e.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => decideAi(r.user_id, "approved")} disabled={busy === `ai-${r.user_id}`}>
                        {busy === `ai-${r.user_id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />} Approve — use site AI
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 dark:text-red-400"
                        onClick={() => {
                          if (!(notes[`ai-${r.user_id}`] ?? "").trim()) { toast.error("Add a note so the user knows why"); return; }
                          decideAi(r.user_id, "rejected");
                        }}
                        disabled={busy === `ai-${r.user_id}`}
                      >
                        <X className="mr-1.5 h-4 w-4" /> Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Users approved for site AI (no API key)</h2>
            {approvedAi.length === 0 ? (
              <div className="rounded-lg border bg-card p-4 text-center text-xs text-muted-foreground">
                Nobody yet. Approving a request above lets that user convert PDFs without their own Gemini key.
              </div>
            ) : (
              approvedAi.map((r) => (
                <div key={r.user_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{label(r)}</span>
                  <Button size="sm" variant="ghost" className="text-red-600 dark:text-red-400" onClick={() => decideAi(r.user_id, "revoked")} disabled={busy === `ai-${r.user_id}`}>
                    <X className="mr-1.5 h-4 w-4" /> Revoke
                  </Button>
                </div>
              ))
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recently decided</h2>
            {decided.length === 0 && <div className="rounded-lg border bg-card p-4 text-center text-xs text-muted-foreground">No decisions yet.</div>}
            {decided.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{t.name}</span>
                <Badge className={t.approval_status === "approved" ? "bg-green-600" : "bg-red-600"}>{t.approval_status}</Badge>
              </div>
            ))}
          </section>
        </div>
      )}
    </AppShell>
  );
}
