import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { requireFullAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarClock, CheckCircle2, Loader2, Pause, Play, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import {
  listScheduledRuns,
  retryScheduledRun,
  rescheduleRun,
  setRunStatus,
  deleteScheduledRun,
  createScheduledRun,
  getAiGenSettings,
  saveAiGenSettings,
  type ScheduledRun,
} from "@/lib/scheduled-tests.functions";

export const Route = createFileRoute("/_authenticated/admin/scheduled-tests")({
  beforeLoad: async ({ context }) => {
    await requireFullAdmin((context as { user: { id: string } }).user.id);
  },
  head: () => ({
    meta: [
      { title: "Scheduled Test Runs — Admin | JEE Prep Hub" },
      { name: "description", content: "Monitor automated AI test generation runs, inspect failures, retry, reschedule or pause upcoming CBT releases." },
      { property: "og:title", content: "Scheduled Test Runs — Admin" },
      { property: "og:description", content: "Success and failure details plus retry controls for auto-generated JEE tests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ScheduledTestsAdmin,
});

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-500/15 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/15 dark:bg-amber-400/15 text-amber-600 dark:text-amber-300",
  generating: "bg-sky-500/15 dark:bg-sky-400/15 text-sky-600 dark:text-sky-400",
  failed: "bg-destructive/15 text-destructive",
  paused: "bg-muted text-muted-foreground",
};

function ScheduledTestsAdmin() {
  const qc = useQueryClient();
  const runs = useQuery({ queryKey: ["scheduled-runs"], queryFn: () => listScheduledRuns(), refetchInterval: 60_000 });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["scheduled-runs"] });

  const retry = useMutation({
    mutationFn: (v: { id: string; runToday?: boolean }) => retryScheduledRun({ data: v }),
    onSuccess: () => { toast.success("Queued — the generator picks it up within 10 minutes"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const pause = useMutation({
    mutationFn: (v: { id: string; status: "pending" | "paused" }) => setRunStatus({ data: v }),
    onSuccess: () => { invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteScheduledRun({ data: { id } }),
    onSuccess: () => { toast.success("Removed"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const move = useMutation({
    mutationFn: (v: { id: string; date: string }) => rescheduleRun({ data: v }),
    onSuccess: () => { toast.success("Rescheduled"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = runs.data ?? [];
  const counts = list.reduce<Record<string, number>>((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {});

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold sm:text-2xl">Scheduled test runs</h1>
            <p className="text-sm text-muted-foreground">
              Tests are generated automatically every 10 minutes. Use the platform AI or your own API key below.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => runs.refetch()} disabled={runs.isFetching}>
            {runs.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["published", "pending", "failed", "paused"] as const).map((s) => (
            <Card key={s} className="p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s}</div>
              <div className="font-display text-2xl font-bold">{counts[s] ?? 0}</div>
            </Card>
          ))}
        </div>

        <AiKeyCard />

        <NewRunCard onDone={invalidate} />

        {runs.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : list.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">No scheduled tests yet.</Card>
        ) : (
          <div className="space-y-3">
            {list.map((r: ScheduledRun) => (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">#{r.test_number}</span>
                      <h2 className="truncate text-sm font-semibold">{r.test_name}</h2>
                      <Badge className={STATUS_STYLE[r.status] ?? "bg-muted"}>{r.status}</Badge>
                      {r.status === "published" && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                      {r.status === "failed" && <TriangleAlert className="h-4 w-4 text-destructive" />}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{r.scheduled_date}</span>
                      <span>{r.total_questions} planned</span>
                      {r.question_count !== undefined && <span>{r.question_count} generated</span>}
                      <span>{Object.keys(r.subjects ?? {}).join(", ")}</span>
                      <span>updated {new Date(r.updated_at).toLocaleString()}</span>
                    </p>
                    {r.error && (
                      <p className="mt-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">{r.error}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="date"
                      defaultValue={r.scheduled_date}
                      aria-label={`Reschedule test #${r.test_number}`}
                      className="h-8 w-[150px] text-xs"
                      onChange={(e) => { if (e.target.value) move.mutate({ id: r.id, date: e.target.value }); }}
                    />
                    {r.status !== "published" && (
                      <Button size="sm" variant="outline" onClick={() => retry.mutate({ id: r.id, runToday: true })}>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        {r.status === "failed" ? "Retry now" : "Generate now"}
                      </Button>
                    )}
                    {r.status === "paused" ? (
                      <Button size="sm" variant="ghost" onClick={() => pause.mutate({ id: r.id, status: "pending" })}>
                        <Play className="mr-1.5 h-3.5 w-3.5" /> Resume
                      </Button>
                    ) : r.status === "pending" ? (
                      <Button size="sm" variant="ghost" onClick={() => pause.mutate({ id: r.id, status: "paused" })}>
                        <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Delete scheduled run"
                      onClick={() => { if (confirm("Delete this scheduled run?")) remove.mutate(r.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function NewRunCard({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [total, setTotal] = useState(30);
  const [chapters, setChapters] = useState<Record<string, string>>({ physics: "", chemistry: "", mathematics: "" });

  const create = useMutation({
    mutationFn: () => {
      const subjects: Record<string, string[]> = {};
      for (const [s, raw] of Object.entries(chapters)) {
        const list = raw.split(",").map((c) => c.trim()).filter(Boolean);
        if (list.length) subjects[s] = list;
      }
      if (!Object.keys(subjects).length) throw new Error("Add at least one chapter");
      return createScheduledRun({ data: { testName: name.trim(), date, totalQuestions: total, subjects } });
    },
    onSuccess: () => { toast.success("Scheduled"); setName(""); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold">Schedule a new auto-generated test</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="sr-name" className="text-xs">Test name</Label>
          <Input id="sr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Weekly Mock #12" />
        </div>
        <div>
          <Label htmlFor="sr-date" className="text-xs">Release date</Label>
          <Input id="sr-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="sr-total" className="text-xs">Total questions</Label>
          <Input id="sr-total" type="number" min={5} max={180} value={total} onChange={(e) => setTotal(Number(e.target.value))} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.keys(chapters).map((s) => (
          <div key={s}>
            <Label htmlFor={`sr-${s}`} className="text-xs capitalize">{s} chapters (comma separated)</Label>
            <Input
              id={`sr-${s}`}
              value={chapters[s] ?? ""}
              onChange={(e) => setChapters((c) => ({ ...c, [s]: e.target.value }))}
              placeholder="Kinematics, Laws of Motion"
            />
          </div>
        ))}
      </div>
      <Button size="sm" disabled={create.isPending || name.trim().length < 3} onClick={() => create.mutate()}>
        {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Schedule test
      </Button>
    </Card>
  );
}

/** Lets a full admin run all auto-generated tests on their own AI key. */
function AiKeyCard() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["ai-gen-settings"], queryFn: () => getAiGenSettings() });
  const [useOwn, setUseOwn] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [key, setKey] = useState("");

  const on = useOwn ?? settings.data?.use_own_key ?? false;
  const prov = provider ?? settings.data?.provider ?? "gemini";

  const save = useMutation({
    mutationFn: () =>
      saveAiGenSettings({
        data: {
          useOwnKey: on,
          provider: prov as "gemini" | "openai" | "groq",
          ...(key.trim() ? { apiKey: key.trim() } : {}),
        },
      }),
    onSuccess: () => {
      toast.success("AI key settings saved");
      setKey("");
      qc.invalidateQueries({ queryKey: ["ai-gen-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="space-y-3 p-4">
      <div>
        <h2 className="text-sm font-semibold">Generation AI key</h2>
        <p className="text-xs text-muted-foreground">
          By default generation uses the built-in platform AI. Turn this on to run every scheduled test on your own key.
        </p>
      </div>

      <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
        <span>
          <span className="block text-sm font-medium">Use my own API key</span>
          <span className="block text-xs text-muted-foreground">
            {settings.data?.has_key ? "A key is saved (hidden for security)." : "No key saved yet."}
          </span>
        </span>
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={on}
          onChange={(e) => setUseOwn(e.target.checked)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div>
          <Label className="text-xs">Provider</Label>
          <select
            value={prov}
            onChange={(e) => setProvider(e.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="groq">Groq</option>
          </select>
        </div>
        <div>
          <Label className="text-xs" htmlFor="ai-key">API key</Label>
          <Input
            id="ai-key"
            type="password"
            autoComplete="off"
            placeholder={settings.data?.has_key ? "•••••••• (leave blank to keep)" : "Paste your API key"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-1 h-9 text-sm"
          />
        </div>
      </div>

      <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save AI settings
      </Button>
    </Card>
  );
}
