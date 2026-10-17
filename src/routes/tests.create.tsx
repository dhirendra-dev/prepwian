import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createMyTestDraft,
  listMyCreatedTests,
  getMyCreatedTest,
  uploadMyTestPdf,
  convertMyPdfsToCbt,
  submitMyTestForApproval,
  getMyAiAccess,
  requestAiKeyExemption,
  adminGenerateAiQuestions,
  adminSaveAiTest,
} from "@/lib/tests.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, Sparkles, Send, KeyRound, ExternalLink, FileText, CheckCircle2, Clock, XCircle, Plus, ShieldCheck, Wand2 } from "lucide-react";

export const Route = createFileRoute("/tests/create")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Create a CBT Test" },
      { name: "twitter:description", content: "PDF to JEE-style CBT in minutes, reviewed by admins before publishing." },

      { title: "Create a CBT Test — PREPWIAN" },
      { name: "description", content: "Upload your coaching test paper and answer key PDFs and turn them into a JEE-style CBT test for the whole community." },
      { property: "og:title", content: "Create a CBT Test" },
      { property: "og:description", content: "PDF to JEE-style CBT in minutes, reviewed by admins before publishing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreateCbt,
});


function CreateCbt() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listMyCreatedTests);
  const createFn = useServerFn(createMyTestDraft);
  const aiAccessFn = useServerFn(getMyAiAccess);
  const requestFn = useServerFn(requestAiKeyExemption);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(180);
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // Remove the legacy per-device API key saved by older versions.
    localStorage.removeItem("jph:gemini-api-key");
  }, []);

  const { data: mine, isLoading } = useQuery({
    queryKey: ["tests", "mine"],
    queryFn: () => listFn(),
    enabled: !!user,
  });

  const { data: aiAccess } = useQuery({
    queryKey: ["tests", "ai-access"],
    queryFn: () => aiAccessFn(),
    enabled: !!user,
  });
  const siteAi = !!(aiAccess as any)?.allowed;
  const aiStatus = (aiAccess as any)?.status as "pending" | "approved" | "rejected" | null | undefined;
  const [requesting, setRequesting] = useState(false);

  async function requestExemption() {
    setRequesting(true);
    try {
      const r = await requestFn({ data: { reason: undefined } });
      toast.success(r.status === "approved" ? "You already have site AI access" : "Request sent — an admin will review it");
      qc.invalidateQueries({ queryKey: ["tests", "ai-access"] });
    } catch (e: any) { toast.error(e?.message ?? "Could not send request"); }
    setRequesting(false);
  }



  async function createDraft() {
    if (!name.trim()) { toast.error("Give your test a name"); return; }
    setCreating(true);
    try {
      const r = await createFn({ data: {
        name: name.trim(), exam_type: "jee_main", subject: "mixed", chapters: [], difficulty: "moderate",
        duration_min: Number(duration) || 180, default_marks_per_question: 4, default_negative_per_question: 1,
        language: "english", max_attempts: 3, mode: "practice",
      } as never });
      toast.success("Draft created — now upload your PDFs");
      setName("");
      setActiveId(r.id);
      qc.invalidateQueries({ queryKey: ["tests", "mine"] });
    } catch (e: any) { toast.error(e?.message ?? "Could not create draft"); }
    setCreating(false);
  }

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md rounded-lg border bg-card p-6 text-center">
          <p className="text-sm">Sign in to create CBT tests from your coaching PDFs.</p>
          <Button className="mt-3" onClick={() => nav({ to: "/auth" })}>Sign in</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">Create a CBT test</h1>
            <p className="text-sm text-muted-foreground">Upload a question paper PDF + answer key PDF → AI converts it into a JEE-style CBT → admin approves → live for everyone.</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/tests">All tests</Link></Button>
        </div>

        {siteAi ? (
          <Card className="border-emerald-500/40 bg-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Site AI unlocked — no API key needed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-emerald-900 dark:text-emerald-100">
                An admin approved your request, so PDF → CBT conversion runs on the site's built-in AI. Just upload both PDFs and tap <b>Convert</b>.
              </p>
              <p className="text-xs text-muted-foreground">Credentials are centrally managed by the platform. Nothing is saved in browser storage.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4 text-amber-600" /> Platform AI access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-amber-900 dark:text-amber-100">
                PDF → CBT conversion uses the centrally managed Gemini credential. Ask for site AI access below if your account has not been approved yet. API keys are never stored in this browser.
              </p>
              <div className="mt-3 rounded-md border bg-background/70 p-3">
                <p className="text-xs font-medium">Don't have a key?</p>
                {aiStatus === "pending" ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-blue-600" /> Your request to use AI without a personal key is awaiting admin review.
                  </p>
                ) : aiStatus === "rejected" ? (
                  <div className="mt-1 space-y-2">
                    <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <XCircle className="h-3.5 w-3.5 text-red-600" /> An admin declined your last request
                      {(aiAccess as any)?.admin_note ? ` — ${(aiAccess as any).admin_note}` : ""}.
                    </p>
                    <Button size="sm" variant="outline" className="h-auto w-full whitespace-normal py-2 text-left leading-snug sm:w-auto" onClick={requestExemption} disabled={requesting}>
                      {requesting ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" /> : <ShieldCheck className="mr-1.5 h-4 w-4 shrink-0" />} Request again
                    </Button>
                  </div>
                ) : (
                  <div className="mt-1 space-y-2">
                    <p className="text-xs text-muted-foreground">Ask an admin for permission to use the site's AI credits instead. Each request is reviewed individually.</p>
                    <Button size="sm" variant="outline" className="h-auto w-full whitespace-normal py-2 text-left leading-snug sm:w-auto" onClick={requestExemption} disabled={requesting}>
                      {requesting ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" /> : <ShieldCheck className="mr-1.5 h-4 w-4 shrink-0" />} Request permission to use AI without a personal key
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}


        {isAdmin && <AiTestGenerator siteAi={siteAi} />}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" /> New test draft</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <div>
                <Label className="text-xs">Test name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Allen Minor Test #4 — Physics" />
              </div>
              <div>
                <Label className="text-xs">Duration (min)</Label>
                <Input type="number" min={1} max={720} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              </div>
            </div>
            <Button onClick={createDraft} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create draft
            </Button>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">My tests</h2>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : ((mine as any[]) ?? []).length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">No tests yet. Create your first draft above.</div>
          ) : (
            <div className="space-y-3">
              {((mine as any[]) ?? []).map((t) => (
                <CreatorTestCard
                  key={t.id}
                  test={t}
                  siteAi={siteAi}
                  expanded={activeId === t.id}
                  onToggle={() => setActiveId(activeId === t.id ? null : t.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Approved & live</Badge>;
  if (status === "pending") return <Badge className="bg-blue-600"><Clock className="mr-1 h-3 w-3" /> Awaiting admin approval</Badge>;
  if (status === "rejected") return <Badge className="bg-red-600"><XCircle className="mr-1 h-3 w-3" /> Changes requested</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

function CreatorTestCard({ test, siteAi, expanded, onToggle }: { test: any; siteAi: boolean; expanded: boolean; onToggle: () => void }) {
  const qc = useQueryClient();
  const detailFn = useServerFn(getMyCreatedTest);
  const uploadFn = useServerFn(uploadMyTestPdf);
  const convertFn = useServerFn(convertMyPdfsToCbt);
  const submitFn = useServerFn(submitMyTestForApproval);
  const [busy, setBusy] = useState<string | null>(null);

  const { data: detail, refetch } = useQuery({
    queryKey: ["tests", "mine", test.id],
    queryFn: () => detailFn({ data: { testId: test.id } }),
    enabled: expanded,
  });

  const uploads: any[] = (detail as any)?.uploads ?? [];
  const questionCount = (detail as any)?.questionCount ?? 0;
  const hasQuestionPdf = uploads.some((u) => u.kind === "questions");
  const hasAnswerPdf = uploads.some((u) => u.kind === "answer_key");
  const locked = test.approval_status === "pending" || test.approval_status === "approved";

  async function upload(kind: "questions" | "answer_key", file: File) {
    if (file.size > 20 * 1024 * 1024) { toast.error("PDF must be under 20 MB"); return; }
    setBusy(kind);
    try {
      const buffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      await uploadFn({ data: { testId: test.id, fileName: file.name, contentBase64: btoa(binary), kind } });
      toast.success(kind === "questions" ? "Question paper uploaded" : "Answer key uploaded");
      refetch();
    } catch (e: any) { toast.error(e?.message ?? "Upload failed"); }
    setBusy(null);
  }

  async function convert() {
    if (!siteAi) { toast.error("Request site AI access below before converting PDFs"); return; }
    setBusy("convert");
    try {
      const r = await convertFn({ data: { testId: test.id } });
      toast.success(`${r.imported} questions converted into CBT`);
      refetch();
      qc.invalidateQueries({ queryKey: ["tests", "mine"] });
    } catch (e: any) { toast.error(e?.message ?? "Conversion failed"); }
    setBusy(null);
  }

  async function submitForApproval() {
    setBusy("submit");
    try {
      await submitFn({ data: { testId: test.id } });
      toast.success("Sent to admins for approval");
      qc.invalidateQueries({ queryKey: ["tests", "mine"] });
      refetch();
    } catch (e: any) { toast.error(e?.message ?? "Could not submit"); }
    setBusy(null);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">{test.name}</CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
              <StatusBadge status={test.approval_status} />
              <Badge variant="outline" className="uppercase">{String(test.exam_type).replace(/_/g, " ")}</Badge>
              <Badge variant="outline">{test.duration_min} min</Badge>
            </div>
            {test.review_notes && <p className="mt-2 text-xs text-red-600">Admin note: {test.review_notes}</p>}
          </div>
          <Button size="sm" variant="outline" onClick={onToggle}>{expanded ? "Hide" : "Open"}</Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-3 text-sm">
          {locked ? (
            <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              {test.approval_status === "pending"
                ? "This test is locked while an admin reviews it. You will see it live once approved."
                : "Approved and published — every learner can attempt it now."}
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <PdfSlot label="Question paper PDF" done={hasQuestionPdf} busy={busy === "questions"} onPick={(f) => upload("questions", f)} />
                <PdfSlot label="Answer key PDF" done={hasAnswerPdf} busy={busy === "answer_key"} onPick={(f) => upload("answer_key", f)} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={convert} disabled={!hasQuestionPdf || !hasAnswerPdf || busy === "convert"}>
                  {busy === "convert" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Converting…</> : <><Sparkles className="mr-1.5 h-4 w-4" /> Convert PDFs to CBT</>}
                </Button>
                <span className="text-xs text-muted-foreground">{questionCount} questions ready</span>
              </div>
              <Button size="sm" variant="secondary" onClick={submitForApproval} disabled={!questionCount || busy === "submit"}>
                {busy === "submit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />} Submit for admin approval
              </Button>
            </>
          )}
          {uploads.length > 0 && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {uploads.map((u) => (
                <li key={u.id} className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> {u.file_name} · {u.kind.replace("_", " ")} · {u.status}
                  {u.error && <span className="text-red-600">— {u.error}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function PdfSlot({ label, done, busy, onPick }: { label: string; done: boolean; busy: boolean; onPick: (f: File) => void }) {
  return (
    <label className="flex cursor-pointer flex-col gap-1 rounded-lg border border-dashed p-3 text-xs hover:bg-muted/50">
      <span className="flex items-center gap-1.5 font-medium">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Upload className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="text-muted-foreground">{done ? "Uploaded — tap to replace" : "Tap to select a PDF (max 20 MB)"}</span>
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.currentTarget.value = ""; }}
      />
    </label>
  );
}

const SUBJECTS = ["physics", "chemistry", "mathematics", "biology", "mixed"] as const;
const BATCH = 10;

function AiTestGenerator({ siteAi }: { siteAi: boolean }) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const genFn = useServerFn(adminGenerateAiQuestions);
  const saveFn = useServerFn(adminSaveAiTest);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("physics");
  const [chapter, setChapter] = useState("");
  const [topics, setTopics] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "moderate" | "hard" | "mixed">("moderate");
  const [count, setCount] = useState(20);
  const [duration, setDuration] = useState(30);
  const [marks, setMarks] = useState(4);
  const [negative, setNegative] = useState(1);
  const [publish, setPublish] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!chapter.trim()) { toast.error("Enter the chapter to generate from"); return; }
    if (!siteAi) { toast.error("Request site AI access before generating questions"); return; }
    const total = Math.max(1, Math.min(100, Number(count) || 10));
    setBusy(true);
    setProgress({ done: 0, total });
    const all: any[] = [];
    try {
      let batchIndex = 0;
      while (all.length < total) {
        const want = Math.min(BATCH, total - all.length);
        const r = await genFn({ data: {
          subject, chapter: chapter.trim(), topics: topics.trim() || undefined, difficulty,
          count: want, batchIndex,
          usedQuestions: all.slice(-25).map((q) => String(q.question_text).slice(0, 140)),
        } as never });
        const got = (r as any).questions ?? [];
        if (!got.length) break;
        all.push(...got);
        batchIndex++;
        setProgress({ done: Math.min(all.length, total), total });
      }
      if (!all.length) throw new Error("The AI did not return any questions");
      const saved = await saveFn({ data: {
        name: name.trim() || `${chapter.trim()} — AI practice test`,
        subject, chapter: chapter.trim(),
        difficulty: difficulty === "mixed" ? "moderate" : difficulty,
        duration_min: Math.max(1, Number(duration) || 30),
        marks: Number(marks) || 4, negative: Number(negative) || 0,
        publish, questions: all.slice(0, total),
      } as never });
      toast.success(`${(saved as any).imported} questions generated${publish ? " and published" : " as a draft"}`);
      qc.invalidateQueries({ queryKey: ["tests"] });
      qc.invalidateQueries({ queryKey: ["admin-tests"] });
      nav({ to: "/admin/tests/$testId", params: { testId: (saved as any).id } });
    } catch (e: any) {
      toast.error(e?.message ?? "AI generation failed");
    }
    setProgress(null);
    setBusy(false);
  }

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><Wand2 className="h-4 w-4 text-primary" /> Generate a test with AI (admin)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Pick a chapter and the AI writes fresh JEE-style MCQs with solutions in batches of {BATCH}, then saves them as a real CBT test.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Test name (optional)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rotational Motion — Practice 1" />
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={subject} onChange={(e) => setSubject(e.target.value as never)}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Chapter</Label>
            <Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Rotational Motion" />
          </div>
          <div>
            <Label className="text-xs">Topics (optional, comma separated)</Label>
            <Input value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="torque, moment of inertia" />
          </div>
          <div>
            <Label className="text-xs">Difficulty</Label>
            <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value as never)}>
              {["easy", "moderate", "hard", "mixed"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Questions</Label>
              <Input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Duration (min)</Label>
              <Input type="number" min={1} max={720} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">+Marks</Label>
              <Input type="number" step="0.5" value={marks} onChange={(e) => setMarks(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">−Marks</Label>
              <Input type="number" step="0.5" value={negative} onChange={(e) => setNegative(Number(e.target.value))} />
            </div>
          </div>
          <label className="flex items-center gap-2 self-end text-xs font-medium">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            Publish immediately for all learners
          </label>
        </div>
        <Button onClick={generate} disabled={busy} className="h-auto w-full whitespace-normal py-2 leading-snug sm:w-auto">
          {busy
            ? <><Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" /> Generating {progress ? `${progress.done}/${progress.total}` : ""}…</>
            : <><Sparkles className="mr-1.5 h-4 w-4 shrink-0" /> Generate test with AI</>}
        </Button>
      </CardContent>
    </Card>
  );
}
