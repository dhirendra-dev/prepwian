import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requireFullAdmin } from "@/lib/admin-guard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListTests, adminCreateTest, adminDeleteTest, adminUpdateTest } from "@/lib/tests.functions";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Eye, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/tests/")({
  head: () => ({ meta: [{ title: "Admin — Tests | PREPWIAN" }] }),

  beforeLoad: async ({ context }) => {
    await requireFullAdmin(context.user.id);
  },

  component: AdminTests,
});

function AdminTests() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const nav = useNavigate();
  const listFn = useServerFn(adminListTests);
  const createFn = useServerFn(adminCreateTest);
  const updateFn = useServerFn(adminUpdateTest);
  const deleteFn = useServerFn(adminDeleteTest);

  const { data, isLoading } = useQuery({ queryKey: ["admin-tests"], queryFn: () => listFn(), enabled: isAdmin });
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [scheduleFor, setScheduleFor] = useState<any>(null);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [scheduling, setScheduling] = useState(false);

  if (!user) return null;
  if (!isAdmin) return <AppShell><div className="mx-auto max-w-md rounded-lg border bg-card p-6 text-center"><ShieldAlert className="mx-auto mb-2 h-8 w-8 text-red-500 dark:text-red-400" /><p className="text-sm">Admin access required.</p></div></AppShell>;

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const r = await createFn({ data: { name: name.trim(), exam_type: "jee_main", subject: "mixed", chapters: [], difficulty: "moderate", duration_min: 60, default_marks_per_question: 4, default_negative_per_question: 1, language: "english", max_attempts: 3, mode: "practice", status: "draft", visibility: "private", is_premium: false } as any });
      toast.success("Test created");
      setOpen(false); setName("");
      nav({ to: "/admin/tests/$testId", params: { testId: r.id } });
    } catch (e: any) { toast.error(e?.message ?? "Create failed"); }
    setCreating(false);
  }

  async function quickStatus(id: string, status: string) {
    try {
      const r = await updateFn({ data: { testId: id, patch: { status: status as any } } });
      qc.invalidateQueries({ queryKey: ["admin-tests"] });
      qc.invalidateQueries({ queryKey: ["tests"] });
      toast.success(
        status === "published"
          ? `Published${r?.visibility === "public" ? " — live for all learners" : ""}`
          : "Updated",
      );
    }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  }

  function openSchedule(t: any) {
    setScheduleFor(t);
    setStartsAt(toLocalInput(t.starts_at));
    setEndsAt(toLocalInput(t.ends_at));
  }

  async function saveSchedule() {
    if (!scheduleFor) return;
    if (!startsAt) { toast.error("Pick a start date and time"); return; }
    if (endsAt && new Date(endsAt) <= new Date(startsAt)) { toast.error("End time must be after the start time"); return; }
    setScheduling(true);
    try {
      await updateFn({ data: { testId: scheduleFor.id, patch: {
        status: "scheduled" as any,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      } } });
      qc.invalidateQueries({ queryKey: ["admin-tests"] });
      qc.invalidateQueries({ queryKey: ["tests"] });
      toast.success("Scheduled — it goes live automatically at the start time");
      setScheduleFor(null);
    } catch (e: any) { toast.error(e?.message ?? "Could not schedule"); }
    setScheduling(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this test permanently?")) return;
    try { await deleteFn({ data: { testId: id } }); qc.invalidateQueries({ queryKey: ["admin-tests"] }); toast.success("Deleted"); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Tests</h1>
        <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline"><Link to="/admin/tests/approvals">Approvals & AI access</Link></Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Test</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create test draft</DialogTitle></DialogHeader>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Test name" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={create} disabled={creating}>{creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create draft</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <div className="grid gap-3">
          {((data as any) ?? []).map((t: any) => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                      <Badge variant="outline" className="uppercase">{t.exam_type.replace(/_/g, " ")}</Badge>
                      <Badge variant="outline" className="uppercase">{t.subject}</Badge>
                      <Badge className={
                        t.status === "published" ? "bg-green-600"
                        : t.status === "scheduled" ? "bg-blue-600"
                        : t.status === "archived" ? "bg-slate-500"
                        : "bg-amber-500"
                      }>{t.status}</Badge>
                      <Badge variant="outline">{t.visibility}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button asChild size="sm" variant="outline"><Link to="/admin/tests/$testId" params={{ testId: t.id }}><Edit className="h-3.5 w-3.5" /></Link></Button>
                    <Button asChild size="sm" variant="outline"><Link to="/tests/$testId" params={{ testId: t.id }}><Eye className="h-3.5 w-3.5" /></Link></Button>
                    <Button size="sm" variant="ghost" className="text-red-600 dark:text-red-400" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5 pt-0 text-xs">
                <Button size="sm" variant={t.status === "draft" ? "default" : "outline"} onClick={() => quickStatus(t.id, "draft")}>Draft</Button>
                <Button size="sm" variant={t.status === "published" ? "default" : "outline"} onClick={() => quickStatus(t.id, "published")}>Publish</Button>
                <Button size="sm" variant={t.status === "scheduled" ? "default" : "outline"} onClick={() => openSchedule(t)}>Schedule…</Button>
                <Button size="sm" variant={t.status === "archived" ? "default" : "outline"} onClick={() => quickStatus(t.id, "archived")}>Archive</Button>
              </CardContent>
            </Card>
          ))}
          {((data as any) ?? []).length === 0 && <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">No tests yet.</div>}
        </div>
      )}

      <Dialog open={!!scheduleFor} onOpenChange={(v) => !v && setScheduleFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule “{scheduleFor?.name}”</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Goes live at</div>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Closes at (optional)</div>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Students see it in the Test Series list, but can only start it inside this window.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleFor(null)}>Cancel</Button>
            <Button onClick={saveSchedule} disabled={scheduling}>{scheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
