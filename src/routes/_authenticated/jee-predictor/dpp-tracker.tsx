import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileCheck2, Plus, Search, CheckCircle2, PlayCircle, Clock3, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/jee-predictor/dpp-tracker")({
  component: DppTrackerPage,
});

type Subject = "PHYSICS" | "CHEMISTRY" | "MATHEMATICS";
type Status = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
type Dpp = {
  id: string; subject: Subject; title: string; dpp_url: string | null; source: string | null;
  planned_for: string | null; total_questions: number; attempted_questions: number;
  correct_questions: number; status: Status; time_spent_minutes: number; notes: string | null;
  chapter_id: string | null; topic_id: string | null; completed_at: string | null; created_at: string;
};
type Stats = {
  total: number; completed: number; in_progress: number; pending: number;
  total_questions: number; attempted_questions: number; correct_questions: number;
};

function DppTrackerPage() {
  const [dpps, setDpps] = useState<Dpp[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, in_progress: 0, pending: 0, total_questions: 0, attempted_questions: 0, correct_questions: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subject, setSubject] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState<Subject>("PHYSICS");
  const [newTitle, setNewTitle] = useState("");
  const [newQuestions, setNewQuestions] = useState("20");
  const [newSource, setNewSource] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newNotes, setNewNotes] = useState("");

  async function loadData() {
    setLoading(true);
    const [dppResult, statsResult] = await Promise.all([
      (supabase as any).rpc("get_jee_dpp_tracker", {
        _subject: subject === "ALL" ? null : subject,
        _status: status === "ALL" ? null : status,
        _search: search.trim() || null,
      }),
      (supabase as any).rpc("get_jee_dpp_stats"),
    ]);
    if (dppResult.error) {
      toast.error(dppResult.error.message || "Could not load DPPs");
      setDpps([]);
    } else setDpps((dppResult.data || []) as Dpp[]);
    if (!statsResult.error && statsResult.data) setStats(statsResult.data as Stats);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 250);
    return () => window.clearTimeout(timer);
  }, [subject, status, search]);

  async function addDpp() {
    if (!newTitle.trim()) return toast.error("Enter a DPP title");
    const questions = Number.parseInt(newQuestions, 10);
    if (!Number.isFinite(questions) || questions < 0) return toast.error("Enter a valid question count");
    setSaving(true);
    const { error } = await (supabase as any).rpc("add_jee_dpp", {
      _subject: newSubject, _title: newTitle.trim(), _total_questions: questions,
      _dpp_url: newUrl.trim() || null, _source: newSource.trim() || null,
      _chapter_id: null, _topic_id: null, _planned_for: newDate || null, _notes: newNotes.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message || "Could not add DPP");
    toast.success("DPP added");
    setNewTitle(""); setNewQuestions("20"); setNewSource(""); setNewUrl(""); setNewDate(""); setNewNotes("");
    setDialogOpen(false);
    await loadData();
  }

  async function updateDpp(dpp: Dpp, attempted: number, correct: number, statusOverride?: Status) {
    const safeAttempted = Math.max(0, Math.min(attempted, dpp.total_questions));
    const safeCorrect = Math.max(0, Math.min(correct, safeAttempted));
    const { error } = await (supabase as any).rpc("update_jee_dpp_progress", {
      _dpp_id: dpp.id, _attempted_questions: safeAttempted, _correct_questions: safeCorrect,
      _time_spent_minutes: dpp.time_spent_minutes, _status: statusOverride || null,
    });
    if (error) return toast.error(error.message || "Could not update DPP");
    setDpps((current) => current.map((item) => item.id === dpp.id ? {
      ...item, attempted_questions: safeAttempted, correct_questions: safeCorrect,
      status: statusOverride || (safeAttempted >= dpp.total_questions && dpp.total_questions > 0 ? "COMPLETED" : safeAttempted > 0 ? "IN_PROGRESS" : item.status),
    } : item));
    await loadData();
  }

  const accuracy = useMemo(() => stats.attempted_questions ? Math.round((stats.correct_questions / stats.attempted_questions) * 100) : 0, [stats]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary"><FileCheck2 className="h-5 w-5" /><span className="text-sm font-semibold">JEE Study System</span></div>
            <h1 className="text-3xl font-bold tracking-tight">DPP Tracker</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Track daily practice sheets, completion, accuracy and progress.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Add DPP</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add DPP</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Subject</Label><Select value={newSubject} onValueChange={(v) => setNewSubject(v as Subject)}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PHYSICS">Physics</SelectItem><SelectItem value="CHEMISTRY">Chemistry</SelectItem><SelectItem value="MATHEMATICS">Mathematics</SelectItem></SelectContent></Select></div>
                <div><Label htmlFor="dpp-title">DPP title</Label><Input id="dpp-title" className="mt-2" placeholder="e.g. Kinematics DPP 01" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="questions">Questions</Label><Input id="questions" type="number" min="0" className="mt-2" value={newQuestions} onChange={(e) => setNewQuestions(e.target.value)} /></div><div><Label htmlFor="date">Planned date</Label><Input id="date" type="date" className="mt-2" value={newDate} onChange={(e) => setNewDate(e.target.value)} /></div></div>
                <div><Label htmlFor="source">Source</Label><Input id="source" className="mt-2" placeholder="e.g. Physics Wallah" value={newSource} onChange={(e) => setNewSource(e.target.value)} /></div>
                <div><Label htmlFor="dpp-url">DPP URL <span className="text-muted-foreground">(optional)</span></Label><Input id="dpp-url" type="url" className="mt-2" placeholder="https://..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} /></div>
                <div><Label htmlFor="dpp-notes">Notes <span className="text-muted-foreground">(optional)</span></Label><Textarea id="dpp-notes" className="mt-2" placeholder="Topics or instructions..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} /></div>
                <Button className="w-full" onClick={addDpp} disabled={saving}>{saving ? "Saving..." : "Save DPP"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Total DPPs" value={stats.total} icon={<FileCheck2 className="h-5 w-5" />} />
          <Stat label="Completed" value={stats.completed} icon={<CheckCircle2 className="h-5 w-5" />} />
          <Stat label="In progress" value={stats.in_progress} icon={<PlayCircle className="h-5 w-5" />} />
          <Stat label="Accuracy" value={`${accuracy}%`} icon={<Clock3 className="h-5 w-5" />} />
        </div>

        <Card className="mb-6"><CardContent className="p-4"><div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search DPPs..." className="pl-9" /></div>
          <Select value={subject} onValueChange={setSubject}><SelectTrigger className="w-full lg:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All subjects</SelectItem><SelectItem value="PHYSICS">Physics</SelectItem><SelectItem value="CHEMISTRY">Chemistry</SelectItem><SelectItem value="MATHEMATICS">Mathematics</SelectItem></SelectContent></Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full lg:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="IN_PROGRESS">In progress</SelectItem><SelectItem value="COMPLETED">Completed</SelectItem><SelectItem value="SKIPPED">Skipped</SelectItem></SelectContent></Select>
          {(search || subject !== "ALL" || status !== "ALL") && <Button variant="ghost" onClick={() => { setSearch(""); setSubject("ALL"); setStatus("ALL"); }} className="gap-2"><X className="h-4 w-4" />Clear</Button>}
        </div></CardContent></Card>

        {loading ? <div className="rounded-2xl border p-10 text-center text-sm text-muted-foreground">Loading DPPs...</div> : dpps.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center"><div className="mb-4 rounded-full bg-muted p-4"><FileCheck2 className="h-7 w-7 text-muted-foreground" /></div><h2 className="text-lg font-semibold">No DPPs found</h2><p className="mt-1 text-sm text-muted-foreground">Add your first daily practice sheet to start tracking.</p><Button className="mt-5 gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" />Add DPP</Button></CardContent></Card>
        ) : (
          <div className="space-y-4">{dpps.map((dpp) => {
            const percent = dpp.total_questions ? Math.round((dpp.attempted_questions / dpp.total_questions) * 100) : 0;
            const acc = dpp.attempted_questions ? Math.round((dpp.correct_questions / dpp.attempted_questions) * 100) : 0;
            return <Card key={dpp.id}><CardContent className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full border bg-muted px-2.5 py-1 text-[11px] font-medium">{formatSubject(dpp.subject)}</span><span className="rounded-full border bg-muted px-2.5 py-1 text-[11px] font-medium">{formatStatus(dpp.status)}</span>{dpp.planned_for && <span className="text-xs text-muted-foreground">Planned: {dpp.planned_for}</span>}</div>
                <h2 className="text-lg font-semibold">{dpp.title}</h2>
                {dpp.source && <p className="mt-1 text-sm text-muted-foreground">{dpp.source}</p>}
                {dpp.notes && <p className="mt-2 text-sm text-muted-foreground">{dpp.notes}</p>}
                <div className="mt-4"><div className="mb-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">{dpp.attempted_questions} / {dpp.total_questions} attempted</span><span className="font-semibold">{percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div></div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span>Correct: <strong className="text-foreground">{dpp.correct_questions}</strong></span><span>Accuracy: <strong className="text-foreground">{acc}%</strong></span><span>Time: <strong className="text-foreground">{dpp.time_spent_minutes} min</strong></span></div>
              </div>
              <div className="flex flex-wrap gap-2">{dpp.dpp_url && <Button asChild variant="outline" size="sm"><a href={dpp.dpp_url} target="_blank" rel="noreferrer">Open DPP</a></Button>}{dpp.status !== "COMPLETED" && <><Button variant="outline" size="sm" onClick={() => updateDpp(dpp, Math.min(dpp.total_questions, dpp.attempted_questions + 5), dpp.correct_questions)}>+5 Q</Button><Button size="sm" onClick={() => updateDpp(dpp, dpp.total_questions, dpp.correct_questions, "COMPLETED")}>Complete</Button></>}</div>
            </div></CardContent></Card>;
          })}</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div><div className="rounded-xl bg-muted p-3">{icon}</div></CardContent></Card>;
}
function formatSubject(subject: Subject) { return subject === "PHYSICS" ? "Physics" : subject === "CHEMISTRY" ? "Chemistry" : "Mathematics"; }
function formatStatus(status: Status) { return status === "IN_PROGRESS" ? "In progress" : status.charAt(0) + status.slice(1).toLowerCase(); }
