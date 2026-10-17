import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminGetTest, adminUpdateTest, adminUpsertQuestion, adminDeleteQuestion, adminUploadTestImage } from "@/lib/tests.functions";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MathText } from "@/components/MathText";
import { Loader2, Save, Plus, Trash2, ShieldAlert, Edit, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/tests/$testId/")({
  head: () => ({ meta: [{ title: "Edit Test | JEE Prep Hub" }] }),
  component: EditTest,
});

function EditTest() {
  const { testId } = Route.useParams();
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const getFn = useServerFn(adminGetTest);
  const updateFn = useServerFn(adminUpdateTest);
  const upsertQFn = useServerFn(adminUpsertQuestion);
  const deleteQFn = useServerFn(adminDeleteQuestion);

  const { data, isLoading, refetch } = useQuery({ queryKey: ["admin-test", testId], queryFn: () => getFn({ data: { testId } }), enabled: isAdmin, staleTime: 0 });
  const [meta, setMeta] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setMeta({ ...(data as any).test }); }, [data]);

  if (!user) return null;
  if (!isAdmin) return <AppShell><div className="mx-auto max-w-md rounded-lg border p-6 text-center"><ShieldAlert className="mx-auto mb-2 h-8 w-8 text-red-500 dark:text-red-400" /><p className="text-sm">Admin only.</p></div></AppShell>;
  if (isLoading || !meta) return <AppShell><div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div></AppShell>;

  const test = meta as any;
  const questions = (data as any)?.questions ?? [];
  const options = (data as any)?.options ?? [];

  async function saveMeta() {
    setSaving(true);
    try {
      const patch: any = {
        name: test.name, description: test.description, exam_type: test.exam_type, subject: test.subject,
        difficulty: test.difficulty, duration_min: Number(test.duration_min), default_marks_per_question: Number(test.default_marks_per_question),
        default_negative_per_question: Number(test.default_negative_per_question), instructions: test.instructions,
        language: test.language, max_attempts: Number(test.max_attempts), is_premium: !!test.is_premium,
        visibility: test.visibility, status: test.status, mode: test.mode,
        starts_at: test.starts_at || null, ends_at: test.ends_at || null,
        chapters: Array.isArray(test.chapters) ? test.chapters : String(test.chapters || "").split(",").map((s: string) => s.trim()).filter(Boolean),
        solution_visibility: test.solution_visibility ?? "after_submit",
        navigation_mode: test.navigation_mode ?? "free",
      };
      await updateFn({ data: { testId, patch } });
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-test", testId] });
    } catch (e: any) { toast.error(e?.message ?? "Save failed"); }
    setSaving(false);
  }

  async function removeQuestion(id: string) {
    if (!confirm("Delete question?")) return;
    try { await deleteQFn({ data: { questionId: id } }); refetch(); toast.success("Deleted"); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/admin/tests" className="text-xs text-muted-foreground hover:underline">← All tests</Link>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/tests/$testId/import" params={{ testId }}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Import PDF via AI
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Test settings</CardTitle>
            <Badge className={test.status === "published" ? "bg-green-600" : test.status === "scheduled" ? "bg-blue-600" : test.status === "archived" ? "bg-slate-500" : "bg-amber-500"}>{test.status}</Badge>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Name"><Input value={test.name ?? ""} onChange={(e) => setMeta({ ...test, name: e.target.value })} /></Field>
            <Field label="Duration (min)"><Input type="number" value={test.duration_min ?? 60} onChange={(e) => setMeta({ ...test, duration_min: e.target.value })} /></Field>
            <Field label="Exam type">
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={test.exam_type} onChange={(e) => setMeta({ ...test, exam_type: e.target.value })}>
                {["jee_main", "jee_advanced", "neet", "chapter_test", "unit_test", "full_syllabus", "mock_test", "pyq"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Subject">
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={test.subject} onChange={(e) => setMeta({ ...test, subject: e.target.value })}>
                {["physics", "chemistry", "mathematics", "biology", "mixed"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Difficulty">
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={test.difficulty} onChange={(e) => setMeta({ ...test, difficulty: e.target.value })}>
                {["easy", "moderate", "hard"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Mode">
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={test.mode} onChange={(e) => setMeta({ ...test, mode: e.target.value })}>
                {["practice", "live", "challenge", "daily", "weekly", "monthly"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={test.status} onChange={(e) => setMeta({ ...test, status: e.target.value })}>
                {["draft", "published", "scheduled", "archived"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Visibility">
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={test.visibility} onChange={(e) => setMeta({ ...test, visibility: e.target.value })}>
                <option value="public">public</option><option value="private">private</option>
              </select>
            </Field>
            <Field label="Max attempts"><Input type="number" value={test.max_attempts ?? 3} onChange={(e) => setMeta({ ...test, max_attempts: e.target.value })} /></Field>
            <Field label="+Marks / question"><Input type="number" step="0.5" value={test.default_marks_per_question} onChange={(e) => setMeta({ ...test, default_marks_per_question: e.target.value })} /></Field>
            <Field label="−Marks / question"><Input type="number" step="0.5" value={test.default_negative_per_question} onChange={(e) => setMeta({ ...test, default_negative_per_question: e.target.value })} /></Field>
            <Field label="Starts at (schedule)"><Input type="datetime-local" value={toLocal(test.starts_at)} onChange={(e) => setMeta({ ...test, starts_at: fromLocal(e.target.value) })} /></Field>
            <Field label="Ends at"><Input type="datetime-local" value={toLocal(test.ends_at)} onChange={(e) => setMeta({ ...test, ends_at: fromLocal(e.target.value) })} /></Field>
            <Field label="Solution visibility">
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={test.solution_visibility ?? "after_submit"} onChange={(e) => setMeta({ ...test, solution_visibility: e.target.value })}>
                <option value="after_submit">After the student submits</option>
                <option value="after_end">After the test window ends</option>
                <option value="never">Never show solutions</option>
              </select>
            </Field>
            <Field label="Navigation">
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={test.navigation_mode ?? "free"} onChange={(e) => setMeta({ ...test, navigation_mode: e.target.value })}>
                <option value="free">Free (jump anywhere)</option>
                <option value="section_lock">Section lock</option>
              </select>
            </Field>
            <Field label="Chapters (comma-separated)" className="sm:col-span-2">
              <Input value={Array.isArray(test.chapters) ? test.chapters.join(", ") : test.chapters ?? ""} onChange={(e) => setMeta({ ...test, chapters: e.target.value })} />
            </Field>
            <Field label="Description" className="sm:col-span-2"><Textarea rows={2} value={test.description ?? ""} onChange={(e) => setMeta({ ...test, description: e.target.value })} /></Field>
            <Field label="Instructions" className="sm:col-span-2"><Textarea rows={3} value={test.instructions ?? ""} onChange={(e) => setMeta({ ...test, instructions: e.target.value })} /></Field>
            <div className="sm:col-span-2 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Total marks: <b>{Number(test.total_marks)}</b> · Questions: <b>{questions.length}</b></div>
              <Button onClick={saveMeta} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Questions ({questions.length})</CardTitle>
            <QuestionDialog testId={testId} order={questions.length + 1} onSaved={() => refetch()} upsertFn={upsertQFn} />
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            {questions.map((q: any, i: number) => {
              const qOpts = options.filter((o: any) => o.question_id === q.id);
              return (
                <div key={q.id} className="rounded-lg border bg-card p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <Badge variant="secondary">Q{i + 1}</Badge>
                        <Badge variant="outline" className="uppercase text-[10px]">{q.question_type}</Badge>
                        <span className="text-muted-foreground">+{Number(q.marks)}/−{Number(q.negative_marks)}</span>
                      </div>
                      <MathText text={q.question_text} className="mt-1 text-sm" />
                    </div>
                    <div className="flex gap-1">
                      <QuestionDialog testId={testId} order={q.order_no} existing={q} existingOptions={qOpts} onSaved={() => refetch()} upsertFn={upsertQFn} />
                      <Button size="sm" variant="ghost" className="text-red-600 dark:text-red-400" onClick={() => removeQuestion(q.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {questions.length === 0 && <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">No questions yet.</div>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function toLocal(iso?: string | null) {
  if (!iso) return ""; const d = new Date(iso); const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocal(v: string) { return v ? new Date(v).toISOString() : null; }

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><Label className="mb-1 block text-xs">{label}</Label>{children}</div>;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

function ImageUploadButton({ onUploaded, label }: { onUploaded: (path: string) => void; label: string }) {
  const uploadFn = useServerFn(adminUploadTestImage);
  const [busy, setBusy] = useState(false);
  return (
    <Button size="sm" variant="outline" disabled={busy} onClick={async (e) => {
      e.preventDefault();
      const input = document.createElement("input");
      input.type = "file"; input.accept = "image/png,image/jpeg,image/webp,image/gif";
      input.onchange = async () => {
        const f = input.files?.[0]; if (!f) return;
        if (f.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
        setBusy(true);
        try {
          const b64 = await fileToBase64(f);
          const res = await uploadFn({ data: { fileName: f.name, contentBase64: b64, contentType: (f.type as any) || "image/png" } });
          onUploaded(res.path);
          toast.success("Image uploaded");
        } catch (err: any) { toast.error(err?.message ?? "Upload failed"); }
        setBusy(false);
      };
      input.click();
    }}>
      {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} {label}
    </Button>
  );
}

function QuestionDialog({ testId, order, existing, existingOptions, onSaved, upsertFn }: any) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>(existing?.question_type ?? "single");
  const [text, setText] = useState(existing?.question_text ?? "");
  const [marks, setMarks] = useState(existing?.marks ?? 4);
  const [neg, setNeg] = useState(existing?.negative_marks ?? 1);
  const [chapter, setChapter] = useState(existing?.chapter ?? "");
  const [subject, setSubject] = useState(existing?.subject ?? "mixed");
  const [explanation, setExplanation] = useState(existing?.explanation ?? "");
  const [numAns, setNumAns] = useState(existing?.correct_numerical ?? "");
  const [numTol, setNumTol] = useState(existing?.numerical_tolerance ?? 0);
  // Test Series 2.0 fields
  const [topic, setTopic] = useState(existing?.topic ?? "");
  const [qDifficulty, setQDifficulty] = useState(existing?.difficulty ?? "");
  const [section, setSection] = useState(existing?.section ?? "");
  const [partialMarking, setPartialMarking] = useState(existing?.partial_marking ?? "none");
  const [unanswered, setUnanswered] = useState(existing?.unanswered_marks ?? 0);
  const [rangeMin, setRangeMin] = useState(existing?.range_min ?? "");
  const [rangeMax, setRangeMax] = useState(existing?.range_max ?? "");
  const [solution, setSolution] = useState(existing?.solution_content ?? "");
  const [images, setImages] = useState<any[]>(existing?.images ?? []);
  const [solutionImages, setSolutionImages] = useState<any[]>(existing?.solution_images ?? []);
  const [opts, setOpts] = useState<any[]>(() =>
    existingOptions?.length ? existingOptions.map((o: any) => ({ label: o.label, text: o.text, is_correct: o.is_correct, image_path: o.image_path ?? null })) :
    [{ label: "A", text: "", is_correct: false, image_path: null }, { label: "B", text: "", is_correct: false, image_path: null }, { label: "C", text: "", is_correct: false, image_path: null }, { label: "D", text: "", is_correct: false, image_path: null }]
  );
  const [busy, setBusy] = useState(false);

  const numeric = type === "integer" || type === "numerical" || type === "range";

  async function save() {
    if (!text.trim() && !images.length) { toast.error("Question text or an image is required"); return; }
    if (type === "range" && (rangeMin === "" || rangeMax === "")) { toast.error("Set the answer range min and max"); return; }
    if ((type === "integer" || type === "numerical") && numAns === "") { toast.error("Set the correct answer"); return; }
    if (!numeric && !opts.some((o) => o.is_correct)) { toast.error("Mark at least one correct option"); return; }
    setBusy(true);
    try {
      await upsertFn({ data: {
        id: existing?.id, test_id: testId, order_no: order,
        question_type: type, question_text: text, subject: subject || null, chapter: chapter || null,
        marks: Number(marks), negative_marks: Number(neg), explanation: explanation || null,
        correct_numerical: (type === "integer" || type === "numerical") && numAns !== "" ? Number(numAns) : null,
        numerical_tolerance: numeric ? Number(numTol || 0) : 0,
        options: numeric ? [] : opts.map((o, i) => ({ label: o.label || String.fromCharCode(65 + i), text: o.text, is_correct: !!o.is_correct, order_no: i, image_path: o.image_path || null })).filter((o) => o.text.trim() || o.image_path),
        images, solution_images: solutionImages,
        topic: topic || null, difficulty: qDifficulty || null, section: section || null,
        partial_marking: type === "multiple" ? partialMarking : "none",
        unanswered_marks: Number(unanswered || 0),
        range_min: type === "range" && rangeMin !== "" ? Number(rangeMin) : null,
        range_max: type === "range" && rangeMax !== "" ? Number(rangeMax) : null,
        solution_content: solution || null,
        archived: !!existing?.archived,
      } });
      toast.success("Saved");
      setOpen(false); onSaved?.();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    setBusy(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={existing ? "outline" : "default"}>{existing ? <Edit className="h-3.5 w-3.5" /> : <><Plus className="mr-1 h-3.5 w-3.5" /> Add</>}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{existing ? "Edit question" : "Add question"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type">
            <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="single">Single correct (MCQ)</option>
              <option value="multiple">Multiple correct</option>
              <option value="integer">Integer</option>
              <option value="numerical">Numerical (decimal + tolerance)</option>
              <option value="range">Integer range</option>
            </select>
          </Field>
          <Field label="Subject">
            <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {["physics", "chemistry", "mathematics", "biology", "mixed"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Chapter"><Input value={chapter} onChange={(e) => setChapter(e.target.value)} /></Field>
          <Field label="Topic"><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Rotational motion" /></Field>
          <Field label="Section"><Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. Section A" /></Field>
          <Field label="Difficulty">
            <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value)}>
              <option value="">—</option>
              {["easy", "moderate", "hard"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="+Marks"><Input type="number" step="0.5" value={marks} onChange={(e) => setMarks(e.target.value)} /></Field>
          <Field label="−Marks"><Input type="number" step="0.5" value={neg} onChange={(e) => setNeg(e.target.value)} /></Field>
          <Field label="Unanswered marks"><Input type="number" step="0.5" value={unanswered} onChange={(e) => setUnanswered(e.target.value)} /></Field>
          {type === "multiple" && (
            <Field label="Partial marking">
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={partialMarking} onChange={(e) => setPartialMarking(e.target.value)}>
                <option value="none">None (all-or-nothing)</option>
                <option value="jee_advanced">JEE Advanced (+1 per correct, no wrong)</option>
                <option value="proportional">Proportional to correct picks</option>
              </select>
            </Field>
          )}
          <Field label="Question text (LaTeX in $...$)" className="sm:col-span-2">
            <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Label className="mb-1 block text-xs">Question images</Label>
            <div className="flex flex-wrap items-center gap-2">
              {images.map((im, i) => (
                <span key={i} className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-muted-foreground">
                  {im.path.split("/").pop()}
                  <button className="text-red-600 dark:text-red-400" onClick={() => setImages(images.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></button>
                </span>
              ))}
              <ImageUploadButton label="Add image" onUploaded={(p) => setImages([...images, { path: p, size: "lg", align: "center" }])} />
            </div>
          </div>
          {type === "range" ? (
            <>
              <Field label="Range min"><Input type="number" step="any" value={rangeMin} onChange={(e) => setRangeMin(e.target.value)} /></Field>
              <Field label="Range max"><Input type="number" step="any" value={rangeMax} onChange={(e) => setRangeMax(e.target.value)} /></Field>
            </>
          ) : numeric ? (
            <>
              <Field label="Correct answer"><Input type="number" step="any" value={numAns} onChange={(e) => setNumAns(e.target.value)} /></Field>
              <Field label="Tolerance ±"><Input type="number" step="any" value={numTol} onChange={(e) => setNumTol(e.target.value)} /></Field>
            </>
          ) : (
            <div className="sm:col-span-2 space-y-2">
              <Label className="text-xs">Options (mark correct)</Label>
              {opts.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input className="w-14" value={o.label} onChange={(e) => setOpts(opts.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                  <Input value={o.text} onChange={(e) => setOpts(opts.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} placeholder="Option text" />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={o.is_correct} onChange={(e) => setOpts(opts.map((x, j) => j === i ? { ...x, is_correct: e.target.checked } : x))} /> correct
                  </label>
                  <ImageUploadButton label={o.image_path ? "Img ✓" : "Img"} onUploaded={(p) => setOpts(opts.map((x, j) => j === i ? { ...x, image_path: p } : x))} />
                  {o.image_path && <button className="text-xs text-red-600 dark:text-red-400" onClick={() => setOpts(opts.map((x, j) => j === i ? { ...x, image_path: null } : x))}>×</button>}
                  <Button size="sm" variant="ghost" onClick={() => setOpts(opts.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setOpts([...opts, { label: String.fromCharCode(65 + opts.length), text: "", is_correct: false, image_path: null }])}><Plus className="mr-1 h-3 w-3" /> Add option</Button>
            </div>
          )}
          <Field label="Solution (shown per test setting)" className="sm:col-span-2"><Textarea rows={3} value={solution} onChange={(e) => setSolution(e.target.value)} /></Field>
          <div className="sm:col-span-2">
            <Label className="mb-1 block text-xs">Solution images</Label>
            <div className="flex flex-wrap items-center gap-2">
              {solutionImages.map((im, i) => (
                <span key={i} className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-muted-foreground">
                  {im.path.split("/").pop()}
                  <button className="text-red-600 dark:text-red-400" onClick={() => setSolutionImages(solutionImages.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></button>
                </span>
              ))}
              <ImageUploadButton label="Add solution image" onUploaded={(p) => setSolutionImages([...solutionImages, { path: p, size: "lg", align: "center" }])} />
            </div>
          </div>
          <Field label="Short explanation (legacy)" className="sm:col-span-2"><Textarea rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save question</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
