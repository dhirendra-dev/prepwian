/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bug,
  Check,
  CheckCircle2,
  CircleHelp,
  Clipboard,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
  MonitorSmartphone,
  Paperclip,
  ImagePlus,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Clock3,
  Copy,
  Trash2,
  Eye,
  Info,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import "@/styles/feedback-ultimate.css";

export const Route = createFileRoute("/feedback")({
  head: () => ({ meta: [
      { property: "og:title", content: "Feedback Hub — JEE Prep Hub" },
      { property: "og:description", content: "Share suggestions, report bugs and send feedback about JEE Prep Hub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Feedback Hub — JEE Prep Hub" },
      { name: "twitter:description", content: "Share suggestions, report bugs and send feedback about JEE Prep Hub." },{ title: "Feedback Hub — JEE Prep Hub" }, { name: "description", content: "Share suggestions, report bugs and send feedback about JEE Prep Hub." }] }),
 component: FeedbackPage });

type Kind = "suggestion" | "bug" | "question";
type Status =
  | "submitted"
  | "under_review"
  | "planned"
  | "in_progress"
  | "waiting_for_user"
  | "completed"
  | "declined";
type Priority = "low" | "normal" | "high" | "urgent";
type Diagnostics = Record<string, string | number | boolean | null>;
type Attachment = { name: string; path: string; size: number; type: string };
type Item = {
  id: string;
  user_id: string;
  kind: Kind;
  title: string;
  description: string;
  page_url: string | null;
  status: Status;
  priority: Priority;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  steps_to_reproduce?: string | null;
  expected_behavior?: string | null;
  actual_behavior?: string | null;
  severity?: string | null;
  technical_details?: Diagnostics | null;
  attachments?: Attachment[] | null;
  public_id?: string | null;
  vote_count?: number;
  user_voted?: boolean;
};
const statuses: Record<Status, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  planned: "Planned",
  in_progress: "In progress",
  waiting_for_user: "Needs your reply",
  completed: "Completed",
  declined: "Declined",
};
const statusStyles: Record<Status, string> = {
  submitted: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  under_review: "bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
  planned: "bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
  waiting_for_user: "bg-orange-100 text-orange-800 dark:bg-orange-400/10 dark:text-orange-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  declined: "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
};
const kinds: Record<
  Kind,
  { label: string; title: string; detail: string; icon: typeof Lightbulb; tone: string }
> = {
  suggestion: {
    label: "Suggestion",
    title: "Suggest an improvement",
    detail: "Features, design, or workflow",
    icon: Lightbulb,
    tone: "bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
  },
  bug: {
    label: "Bug report",
    title: "Report a technical issue",
    detail: "Something is broken or unexpected",
    icon: Bug,
    tone: "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
  },
  question: {
    label: "Question",
    title: "Ask a question",
    detail: "Help with a JEE Prep Hub feature",
    icon: CircleHelp,
    tone: "bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300",
  },
};
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function collectDiagnostics(): Diagnostics {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
    connection?: { type?: string; effectiveType?: string };
  };
  const width = window.innerWidth;
  return {
    capturedAt: new Date().toISOString(),
    page: `${window.location.pathname}${window.location.search}`.slice(0, 500),
    referrerOrigin: document.referrer ? new URL(document.referrer).origin : null,
    userAgent: navigator.userAgent.slice(0, 600),
    browserLanguage: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: `${screen.width}x${screen.height}@${window.devicePixelRatio || 1}x`,
    deviceClass: width < 640 ? "mobile" : width < 1024 ? "tablet/small laptop" : "desktop",
    online: navigator.onLine,
    cookieEnabled: navigator.cookieEnabled,
    platform: navigator.platform || "unknown",
    connectionType: nav.connection?.type ?? null,
    effectiveConnectionType: nav.connection?.effectiveType ?? null,
    approximateMemoryGB: nav.deviceMemory ?? null,
    logicalCpuCores: nav.hardwareConcurrency ?? null,
  };
}

function FeedbackPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind>("suggestion");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [severity, setSeverity] = useState("normal");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const query = useQuery({
    queryKey: ["feedback-submissions", user?.id, isAdmin],
    enabled: !!user && !authLoading,
    staleTime: 20000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feedback_submissions")
        .select(
          "id,user_id,kind,title,description,page_url,status,priority,admin_response,created_at,updated_at,resolved_at,steps_to_reproduce,expected_behavior,actual_behavior,severity,technical_details,attachments,public_id",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in first.");
      const t = title.trim(),
        d = description.trim();
      if (t.length < 5 || t.length > 120) throw new Error("Title must be 5–120 characters.");
      if (d.length < 15 || d.length > 3000)
        throw new Error("Description must be 15–3,000 characters.");
      if (files.length > 3) throw new Error("Attach no more than 3 screenshots.");
      if (files.some((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_FILE_BYTES))
        throw new Error("Screenshots must be PNG, JPEG, or WebP and no larger than 5 MB each.");
      const uploaded: Attachment[] = [];
      // Uploads go to a private bucket. RLS on storage.objects must restrict each user to their own folder.
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
        const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage
          .from("feedback-attachments")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        uploaded.push({ name: safeName, path, size: file.size, type: file.type });
      }
      const payload = {
        user_id: user.id,
        kind,
        title: t,
        description: d,
        page_url: `${window.location.pathname}${window.location.search}`.slice(0, 500),
        steps_to_reproduce: kind === "bug" ? steps.trim().slice(0, 3000) || null : null,
        expected_behavior: kind === "bug" ? expected.trim().slice(0, 1500) || null : null,
        actual_behavior: kind === "bug" ? actual.trim().slice(0, 1500) || null : null,
        severity: kind === "bug" ? severity : "normal",
        technical_details: kind === "bug" && includeDiagnostics ? collectDiagnostics() : null,
        attachments: uploaded.length ? uploaded : null,
      };
      const { error } = await (supabase as any).from("feedback_submissions").insert(payload);
      if (error) {
        // Best-effort cleanup of uploaded private objects if row creation fails.
        if (uploaded.length)
          await supabase.storage.from("feedback-attachments").remove(uploaded.map((f) => f.path));
        throw error;
      }
    },
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setSteps("");
      setExpected("");
      setActual("");
      setSeverity("normal");
      setIncludeDiagnostics(false);
      setFiles([]);
      setShowForm(false);
      await qc.invalidateQueries({ queryKey: ["feedback-submissions", user?.id] });
      toast.success("Feedback submitted successfully.");
    },
    onError: (e) => {
      console.error("Feedback submission failed", e);
      toast.error(e instanceof Error ? e.message : "Couldn't submit feedback.");
    },
  });

  const submissions = useMemo(() => query.data ?? [], [query.data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter(
      (i) =>
        (filter === "all" ||
          (filter === "closed"
            ? ["completed", "declined"].includes(i.status)
            : !["completed", "declined"].includes(i.status))) &&
        (!q ||
          `${i.title} ${i.description} ${i.kind} ${statuses[i.status]}`.toLowerCase().includes(q)),
    );
  }, [submissions, filter, search]);

  async function copyDiagnostics() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(collectDiagnostics(), null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
      toast.success("Diagnostics copied.");
    } catch {
      toast.error("Clipboard access unavailable.");
    }
  }
  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)];
    if (next.length > 3) {
      toast.error("Maximum 3 screenshots.");
      return;
    }
    const invalid = next.find((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_FILE_BYTES);
    if (invalid) {
      toast.error("Use PNG, JPEG, or WebP screenshots under 5 MB each.");
      return;
    }
    setFiles(next);
  }

  if (authLoading)
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-36 animate-pulse rounded-3xl bg-muted" />
      </main>
    );
  if (!user)
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
        <MessageSquareText className="h-10 w-10 text-primary" />
        <h1 className="mt-4 text-2xl font-extrabold">Feedback & support</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to report issues and track your submissions.
        </p>
        <Button asChild className="mt-5 rounded-xl">
          <Link to="/auth">Sign in</Link>
        </Button>
      </main>
    );

  const active = submissions.filter((i) => !["completed", "declined"].includes(i.status)).length;
  const closed = submissions.filter((i) => ["completed", "declined"].includes(i.status)).length;

  return (
    <main className="feedback-ultimate mx-auto w-full max-w-5xl px-3 pb-12 pt-4 sm:px-6 sm:pt-8">
      <style>{`.feedback-ultimate{animation:fb-in .22s ease-out both}.fb-hero{background:radial-gradient(ellipse at 10% 0%,hsl(var(--primary)/.15),transparent 55%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted)/.4))}.fb-choice{transition:transform .15s,border-color .15s}.fb-choice:active{transform:scale(.985)}@keyframes fb-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.feedback-ultimate{animation:none}.fb-choice{transition:none}}`}</style>
      <div className="mb-5 flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          size="icon"
          aria-label="Back home"
          className="h-10 w-10 shrink-0 rounded-2xl"
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Help improve JEE Prep Hub
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Feedback & support
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Report problems, suggest features, and follow every update.
          </p>
        </div>
      </div>

      <section className="fb-hero rounded-[26px] border border-border/70 p-4 shadow-sm sm:rounded-[30px] sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold sm:text-xl">Your feedback matters</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Send an idea, report a bug with screenshots, or include optional device diagnostics to
              help us investigate.
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { n: submissions.length, l: "My reports" },
            { n: active, l: "Active" },
            { n: closed, l: "Closed" },
          ].map((x) => (
            <div key={x.l} className="rounded-2xl border border-border/60 bg-background/75 p-3">
              <div className="text-xl font-extrabold tabular-nums">{x.n}</div>
              <div className="mt-1 text-[11px] font-medium text-muted-foreground">{x.l}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => setShowForm((v) => !v)} className="h-11 rounded-xl">
            {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showForm ? "Close form" : "Create a report"}
          </Button>
          {isAdmin && (
            <Button asChild variant="outline" className="h-11 rounded-xl bg-background/80">
              <Link to="/admin/feedback">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Admin inbox
              </Link>
            </Button>
          )}
        </div>
      </section>

      {showForm && (
        <section className="mt-4 rounded-[24px] border border-border/70 bg-card p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold">New feedback</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Do not include passwords, OTPs, payment information, or private messages.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(Object.keys(kinds) as Kind[]).map((k) => {
              const m = kinds[k],
                Icon = m.icon,
                selected = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setKind(k)}
                  className={`fb-choice flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left ${selected ? "border-primary bg-primary/[.06] ring-1 ring-primary/20" : "border-border/70 bg-background hover:bg-accent/50"}`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{m.title}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {m.detail}
                    </span>
                  </span>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="fu-title">Title</Label>
              <Input
                id="fu-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={5}
                maxLength={120}
                placeholder="A short, clear summary"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fu-desc">Description</Label>
              <Textarea
                id="fu-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={15}
                maxLength={3000}
                placeholder="Explain the idea or problem…"
                className="min-h-28 rounded-xl"
              />
            </div>
            {kind === "bug" && (
              <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-3 sm:p-4">
                <div className="flex items-center gap-2 font-bold">
                  <Bug className="h-4 w-4 text-rose-500" />
                  Reproduction details
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="fu-steps">Steps to reproduce</Label>
                    <Textarea
                      id="fu-steps"
                      value={steps}
                      onChange={(e) => setSteps(e.target.value)}
                      maxLength={3000}
                      placeholder={"1. Open the page\n2. Tap the button\n3. Observe the issue"}
                      className="min-h-24 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fu-expected">Expected result</Label>
                    <Textarea
                      id="fu-expected"
                      value={expected}
                      onChange={(e) => setExpected(e.target.value)}
                      maxLength={1500}
                      className="min-h-20 rounded-xl"
                    />
                    <Label htmlFor="fu-actual">Actual result</Label>
                    <Textarea
                      id="fu-actual"
                      value={actual}
                      onChange={(e) => setActual(e.target.value)}
                      maxLength={1500}
                      className="min-h-20 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fu-severity">Impact level</Label>
                  <select
                    id="fu-severity"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="low">Low — minor issue</option>
                    <option value="normal">Normal — feature partly affected</option>
                    <option value="high">High — important feature blocked</option>
                    <option value="urgent">Urgent — critical failure</option>
                  </select>
                </div>
                <div className="rounded-xl border border-border/70 bg-background p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="fu-diagnostics"
                      checked={includeDiagnostics}
                      onCheckedChange={(v) => setIncludeDiagnostics(v === true)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="fu-diagnostics" className="cursor-pointer font-semibold">
                        Attach optional technical diagnostics
                      </Label>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Browser version string, device class, screen size, language, timezone,
                        online status, and available hardware/connection hints. No passwords, cookie
                        values, page text, or network traffic.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 rounded-lg"
                        onClick={() => void copyDiagnostics()}
                      >
                        <Clipboard className="mr-1.5 h-3.5 w-3.5" />
                        {copied ? "Copied" : "Copy diagnostics instead"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <Label htmlFor="fu-files">Screenshots (optional)</Label>
                <span className="text-xs text-muted-foreground">up to 3, 5 MB each</span>
              </div>
              <Input
                id="fu-files"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(e) => addFiles(e.target.files)}
                className="h-auto min-h-11 rounded-xl py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
              />
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-2 rounded-xl bg-muted/50 p-2 text-xs"
                    >
                      <ImagePlus className="h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate">{f.name}</span>
                      <span className="text-muted-foreground">
                        {(f.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={`Remove ${f.name}`}
                        onClick={() => setFiles((old) => old.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Only upload screenshots you are comfortable sharing with authorized support staff.
                Hide personal details first.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Your report is visible to you and authorized admins.
              </p>
              <Button type="submit" disabled={submit.isPending} className="h-11 rounded-xl px-5">
                {submit.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {submit.isPending ? "Submitting…" : "Submit report"}
              </Button>
            </div>
          </form>
        </section>
      )}

      <section className="mt-5 overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/70 p-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">My reports</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Track status, history, and staff responses.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search my reports…"
                className="rounded-xl pl-9"
              />
            </div>
            <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "active", label: "Active" },
                  { id: "closed", label: "Closed" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === f.id ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {query.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading your reports…</div>
        ) : query.isError ? (
          <div className="p-8 text-center">
            <p className="font-semibold">Couldn't load reports.</p>
            <Button
              variant="outline"
              className="mt-3 rounded-xl"
              onClick={() => void query.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <MessageSquareText className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-bold">No reports found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a report to start tracking feedback.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {filtered.map((item) => {
              const meta = kinds[item.kind],
                Icon = meta.icon;
              return (
                <article key={item.id} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-sm font-bold">{item.title}</h3>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusStyles[item.status]}`}
                        >
                          {statuses[item.status]}
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        <span>{meta.label}</span>
                        <span>·</span>
                        <time dateTime={item.created_at}>
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </time>
                        {item.attachments?.length ? (
                          <span>{item.attachments.length} attachment(s)</span>
                        ) : null}
                        {item.technical_details && <span>Diagnostics attached</span>}
                      </div>
                      {item.admin_response && (
                        <div className="mt-3 rounded-xl border border-primary/15 bg-primary/[.045] p-3">
                          <div className="text-xs font-bold text-primary">Team response</div>
                          <p className="mt-1.5 whitespace-pre-wrap text-sm">
                            {item.admin_response}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-center gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Private to you and authorized support staff
        </div>
      </section>
    </main>
  );
}
