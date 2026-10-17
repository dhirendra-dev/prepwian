import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminUploadTestPdf,
  adminParseTestPdf,
  adminGetPdfUpload,
  adminListPdfUploads,
  adminImportParsedQuestions,
} from "@/lib/tests.functions";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MathText } from "@/components/MathText";
import {
  Loader2, ShieldAlert, Upload, Sparkles, FileText, CheckCircle2,
  AlertTriangle, Trash2, Save, ArrowRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/tests/$testId/import")({
  head: () => ({ meta: [{ title: "Import PDF — Admin | JEE Prep Hub" }] }),
  component: ImportPage,
});

function fileToBase64(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      res(s.split(",")[1] ?? "");
    };
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

function ImportPage() {
  const { testId } = Route.useParams();
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const uploadFn = useServerFn(adminUploadTestPdf);
  const parseFn = useServerFn(adminParseTestPdf);
  const getUpload = useServerFn(adminGetPdfUpload);
  const listUploads = useServerFn(adminListPdfUploads);
  const importFn = useServerFn(adminImportParsedQuestions);

  const { data: uploads, isLoading, refetch } = useQuery({
    queryKey: ["admin-pdf-uploads", testId],
    queryFn: () => listUploads({ data: { testId } }),
    enabled: isAdmin,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState<"questions" | "answer_key">("questions");
  const [file, setFile] = useState<File | null>(null);

  const { data: selected, refetch: refetchSelected } = useQuery({
    queryKey: ["admin-pdf-upload", selectedId],
    queryFn: () => getUpload({ data: { uploadId: selectedId! } }),
    enabled: !!selectedId,
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.status;
      return s === "parsing" ? 2500 : false;
    },
  });

  if (!user) return null;
  if (!isAdmin) return <AppShell><Denied /></AppShell>;

  async function doUpload() {
    if (!file) { toast.error("Choose a PDF first"); return; }
    if (file.size > 25 * 1024 * 1024) { toast.error("PDF larger than 25 MB"); return; }
    setUploading(true);
    try {
      const b64 = await fileToBase64(file);
      const r = await uploadFn({ data: { testId, fileName: file.name, contentBase64: b64, kind } });
      toast.success("Uploaded — starting AI parse…");
      setFile(null);
      setSelectedId(r.id);
      qc.invalidateQueries({ queryKey: ["admin-pdf-uploads", testId] });
      // auto-parse
      parseFn({ data: { uploadId: r.id } }).then(() => {
        refetchSelected(); refetch();
      }).catch((e) => toast.error(e?.message ?? "Parse failed"));
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    }
    setUploading(false);
  }

  async function reparse(id: string) {
    try { toast.info("Re-parsing…"); await parseFn({ data: { uploadId: id } }); refetchSelected(); refetch(); toast.success("Parsed"); }
    catch (e: any) { toast.error(e?.message ?? "Parse failed"); }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/tests/$testId" params={{ testId }} className="text-xs text-muted-foreground hover:underline">← Back to test editor</Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" /> AI PDF → CBT Importer
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Upload a JEE/NEET question paper PDF (and optionally the answer key). Our AI extracts every question, options, marks, and marks correct answers for review.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <Label className="mb-1 block text-xs">PDF type</Label>
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value as any)}>
                <option value="questions">Question paper</option>
                <option value="answer_key">Answer key / solutions</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Select PDF (max 25 MB)</Label>
              <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex items-end">
              <Button onClick={doUpload} disabled={uploading || !file}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload & Parse
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Uploads for this test</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? <div className="p-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div> :
              (((uploads as any) ?? []).length === 0) ? <div className="p-6 text-center text-sm text-muted-foreground">No PDF uploads yet.</div> :
              <div className="divide-y">
                {((uploads as any) ?? []).map((u: any) => (
                  <div key={u.id} className={`flex flex-wrap items-center gap-2 p-3 text-sm ${selectedId === u.id ? "bg-muted/50" : ""}`}>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <button className="flex-1 truncate text-left hover:underline" onClick={() => setSelectedId(u.id)}>{u.file_name}</button>
                    <Badge variant="outline" className="text-[10px] uppercase">{u.kind.replace(/_/g, " ")}</Badge>
                    <StatusBadge s={u.status} />
                    {u.question_count > 0 && <Badge variant="secondary" className="text-[10px]">{u.question_count} Q</Badge>}
                    <Button size="sm" variant="outline" onClick={() => reparse(u.id)}>Re-parse</Button>
                    <Button size="sm" onClick={() => setSelectedId(u.id)}>Review <ArrowRight className="ml-1 h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>

        {selected && (selected as any).status === "parsed" && (
          <ReviewPanel
            upload={selected as any}
            testId={testId}
            onImported={() => { refetch(); refetchSelected(); qc.invalidateQueries({ queryKey: ["admin-test", testId] }); }}
            importFn={importFn}
          />
        )}
        {selected && (selected as any).status === "parsing" && (
          <div className="rounded-lg border bg-card p-6 text-center text-sm">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
            AI is reading the PDF… this can take 30-90 seconds for large papers.
          </div>
        )}
        {selected && (selected as any).status === "failed" && (
          <div className="rounded-lg border border-red-500/40 bg-red-50 p-4 text-sm dark:bg-red-950/30">
            <div className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-300"><AlertTriangle className="h-4 w-4" /> Parse failed</div>
            <p className="mt-1 text-xs">{(selected as any).error || "The AI could not read this PDF. Try a cleaner scan or re-parse."}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = { uploaded: "bg-slate-500", parsing: "bg-blue-500", parsed: "bg-amber-500", imported: "bg-green-600", failed: "bg-red-600" };
  return <Badge className={`${map[s] || "bg-slate-500"} text-[10px] uppercase text-white`}>{s}</Badge>;
}

function Denied() {
  return <div className="mx-auto max-w-md rounded-lg border p-6 text-center"><ShieldAlert className="mx-auto mb-2 h-8 w-8 text-red-500 dark:text-red-400" /><p className="text-sm">Admin only.</p></div>;
}

function ReviewPanel({ upload, testId, onImported, importFn }: { upload: any; testId: string; onImported: () => void; importFn: any }) {
  const initial: any[] = useMemo(() => {
    const raw = upload?.parsed_json?.questions;
    if (!Array.isArray(raw)) return [];
    return raw.map((q: any, i: number) => ({
      order_no: q.order_no ?? i + 1,
      question_type: ["single", "multiple", "integer", "numerical"].includes(q.question_type) ? q.question_type : "single",
      question_text: String(q.question_text ?? ""),
      subject: q.subject ?? null,
      chapter: q.chapter ?? "",
      marks: Number(q.marks ?? 4),
      negative_marks: Number(q.negative_marks ?? 1),
      explanation: q.explanation ?? "",
      correct_numerical: q.correct_numerical ?? null,
      numerical_tolerance: q.numerical_tolerance ?? 0,
      options: Array.isArray(q.options) ? q.options.map((o: any, k: number) => ({
        label: o.label ?? String.fromCharCode(65 + k), text: String(o.text ?? ""), is_correct: !!o.is_correct,
      })) : [],
      _confidence: q.confidence ?? (Array.isArray(q.options) && q.options.some((o: any) => o.is_correct) ? 95 : 75),
    }));
  }, [upload]);

  const [items, setItems] = useState<any[]>(initial);
  const [importing, setImporting] = useState(false);
  const [filter, setFilter] = useState<"all" | "lowconf">("all");

  const shown = items.map((q, i) => ({ q, i })).filter((x) => filter === "all" || (x.q._confidence ?? 0) < 90);

  const update = (i: number, patch: any) => setItems((prev) => prev.map((q, j) => j === i ? { ...q, ...patch } : q));
  const updateOpt = (i: number, k: number, patch: any) => setItems((prev) => prev.map((q, j) => j === i ? { ...q, options: q.options.map((o: any, m: number) => m === k ? { ...o, ...patch } : o) } : q));
  const addOpt = (i: number) => setItems((prev) => prev.map((q, j) => j === i ? { ...q, options: [...q.options, { label: String.fromCharCode(65 + q.options.length), text: "", is_correct: false }] } : q));
  const removeOpt = (i: number, k: number) => setItems((prev) => prev.map((q, j) => j === i ? { ...q, options: q.options.filter((_: any, m: number) => m !== k) } : q));
  const removeQ = (i: number) => setItems((prev) => prev.filter((_, j) => j !== i));

  async function importAll() {
    if (!items.length) { toast.error("Nothing to import"); return; }
    setImporting(true);
    try {
      const r = await importFn({ data: { uploadId: upload.id, testId, questions: items } });
      toast.success(`Imported ${r.imported} questions`);
      onImported();
    } catch (e: any) { toast.error(e?.message ?? "Import failed"); }
    setImporting(false);
  }

  const lowConf = items.filter((q) => (q._confidence ?? 100) < 90).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Review parsed questions ({items.length})</CardTitle>
          <div className="flex items-center gap-2">
            {lowConf > 0 && <Badge className="bg-amber-500 text-white">{lowConf} low-confidence</Badge>}
            <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
            <Button size="sm" variant={filter === "lowconf" ? "default" : "outline"} onClick={() => setFilter("lowconf")}>Needs review</Button>
            <Button size="sm" onClick={importAll} disabled={importing}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Import all into test
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {shown.map(({ q, i }) => {
          const numeric = q.question_type === "integer" || q.question_type === "numerical";
          const conf = q._confidence ?? 100;
          return (
            <div key={i} className={`rounded-lg border p-3 ${conf < 90 ? "border-amber-500/60 bg-amber-50/40 dark:bg-amber-950/20" : "bg-card"}`}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary">Q{i + 1}</Badge>
                  <select className="h-7 rounded border bg-background px-1 text-xs" value={q.question_type} onChange={(e) => update(i, { question_type: e.target.value })}>
                    <option value="single">single</option><option value="multiple">multiple</option><option value="integer">integer</option><option value="numerical">numerical</option>
                  </select>
                  <select className="h-7 rounded border bg-background px-1 text-xs" value={q.subject ?? "mixed"} onChange={(e) => update(i, { subject: e.target.value === "mixed" ? null : e.target.value })}>
                    <option value="mixed">—</option><option value="physics">physics</option><option value="chemistry">chemistry</option><option value="mathematics">math</option><option value="biology">biology</option>
                  </select>
                  <Input className="h-7 w-32 text-xs" value={q.chapter ?? ""} onChange={(e) => update(i, { chapter: e.target.value })} placeholder="Chapter" />
                  <Input className="h-7 w-14 text-xs" type="number" step="0.5" value={q.marks} onChange={(e) => update(i, { marks: Number(e.target.value) })} title="Marks" />
                  <Input className="h-7 w-14 text-xs" type="number" step="0.5" value={q.negative_marks} onChange={(e) => update(i, { negative_marks: Number(e.target.value) })} title="Negative" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${conf >= 95 ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : conf >= 90 ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}>
                    {conf}% confidence
                  </span>
                  <Button size="sm" variant="ghost" className="text-red-600 dark:text-red-400" onClick={() => removeQ(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <Textarea rows={2} className="mb-2 text-sm" value={q.question_text} onChange={(e) => update(i, { question_text: e.target.value })} />
              <div className="mb-2 rounded-md border bg-muted/30 p-2 text-xs">
                <div className="mb-1 text-muted-foreground">Preview:</div>
                <MathText text={q.question_text} className="text-sm" />
              </div>
              {numeric ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><Label className="text-xs">Correct answer</Label><Input type="number" step="any" value={q.correct_numerical ?? ""} onChange={(e) => update(i, { correct_numerical: e.target.value === "" ? null : Number(e.target.value) })} /></div>
                  <div><Label className="text-xs">Tolerance ±</Label><Input type="number" step="any" value={q.numerical_tolerance} onChange={(e) => update(i, { numerical_tolerance: Number(e.target.value) })} /></div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {q.options.map((o: any, k: number) => (
                    <div key={k} className="flex items-center gap-2">
                      <Input className="h-8 w-12 text-xs" value={o.label} onChange={(e) => updateOpt(i, k, { label: e.target.value })} />
                      <Input className="h-8 flex-1 text-xs" value={o.text} onChange={(e) => updateOpt(i, k, { text: e.target.value })} />
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={o.is_correct} onChange={(e) => updateOpt(i, k, { is_correct: e.target.checked })} />
                        <CheckCircle2 className={`h-3.5 w-3.5 ${o.is_correct ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`} />
                      </label>
                      <Button size="sm" variant="ghost" onClick={() => removeOpt(i, k)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => addOpt(i)}>+ option</Button>
                </div>
              )}
              <div className="mt-2">
                <Label className="text-xs">Explanation</Label>
                <Textarea rows={2} className="text-xs" value={q.explanation ?? ""} onChange={(e) => update(i, { explanation: e.target.value })} />
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">No questions match this filter.</div>}
      </CardContent>
    </Card>
  );
}
