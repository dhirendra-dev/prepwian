import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CopyBlock } from "@/components/jee360/copy-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/jee360/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { downloadJson, formatImportError, ingestPlannerText } from "@/lib/jee360/json-import";
import { CHATGPT_PROMPT, JSON_SCHEMA_EXAMPLE, SAMPLE_TIMETABLE_TEXT } from "@/lib/jee360/prompt";
import { MINI_EXAMPLE } from "@/lib/jee360/sample-planner";
import { useAppStore } from "@/lib/jee360/store";

export const Route = createFileRoute("/jee360/upload")({
  head: () => ({ meta: [
      { property: "og:title", content: "Import Study Data — JEE 360 | PREPWIAN" },
      { property: "og:description", content: "Import your study records into your local JEE 360 workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Import Study Data — JEE 360 | PREPWIAN" },
      { name: "twitter:description", content: "Import your study records into your local JEE 360 workspace." },{ title: "Import Study Data — JEE 360 | PREPWIAN" }, { name: "description", content: "Import your study records into your local JEE 360 workspace." }] }),
 component: UploadPage });

function UploadPage() {
  const importPlanner = useAppStore((s) => s.importPlanner);
  const loadSample = useAppStore((s) => s.loadSample);
  const clearPlanner = useAppStore((s) => s.clearPlanner);
  const exportPlanner = useAppStore((s) => s.exportPlanner);
  const meta = useAppStore((s) => s.meta);
  const lectureCount = useAppStore((s) => s.lectures.length);
  const navigate = useNavigate();
  const [paste, setPaste] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"replace" | "merge">("replace");

  function ingest(raw: string) {
    try {
      const file = ingestPlannerText(raw);
      importPlanner(file, mode);
      setError(null);
      toast.success(`Imported ${file.lectures.length} lectures`, {
        action: { label: "Make a plan", onClick: () => void navigate({ to: "/jee360/plans" }) },
      });
      void navigate({ to: "/" });
    } catch (err) {
      setError(formatImportError(err));
      toast.error("Import failed");
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      ingest(await file.text());
    } catch {
      setError("The file could not be read.");
    }
  }

  async function openChatGPT() {
    try {
      await navigator.clipboard.writeText(CHATGPT_PROMPT);
      toast.success("Prompt copied. Paste it into ChatGPT, then your timetable.");
    } catch {
      toast.error("Copy the prompt below, then open ChatGPT.");
    }
    window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Import</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Bring your lecture planner</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Coaching PDFs and Excel sheets do not drop in raw. Convert them with ChatGPT using the prompt
          below, then upload the JSON here.
        </p>
      </header>

      <ol className="grid gap-3 md:grid-cols-3">
        {[
          { n: "01", t: "Copy the prompt", d: "Exact JEE 360 schema, slot times, repeating rows." },
          { n: "02", t: "Paste your planner", d: "PDF text, Excel dump, WhatsApp timetable, or a screenshot description." },
          { n: "03", t: "Upload the JSON", d: "Save ChatGPT’s reply as .json — or paste it. Markdown fences are fine." },
        ].map((step) => (
          <li key={step.n} className="rounded-xl border border-border bg-card p-4">
            <p className="font-display text-2xl text-muted-foreground">{step.n}</p>
            <p className="mt-2 font-medium">{step.t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{step.d}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void openChatGPT()}>
          Copy prompt and open ChatGPT
          <ExternalLink className="size-4" />
        </Button>
        <Button variant="outline" asChild>
          <a href="/sample-planner.json" download>
            Download sample JSON
          </a>
        </Button>
      </div>

      <CopyBlock text={CHATGPT_PROMPT} label="ChatGPT conversion prompt" />

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Example of what to paste into ChatGPT after the prompt
        </summary>
        <div className="mt-3">
          <CopyBlock text={SAMPLE_TIMETABLE_TEXT} label="Messy coaching timetable" />
        </div>
      </details>

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">JSON shape ChatGPT must return</summary>
        <div className="mt-3">
          <CopyBlock text={JSON_SCHEMA_EXAMPLE} label="Schema example" />
        </div>
      </details>

      <Card>
        <CardHeader>
          <CardTitle>Upload or paste</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {meta ? (
            <p className="text-sm text-muted-foreground">
              Current planner: {meta.name} · {lectureCount} lectures
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={mode === "replace" ? "default" : "outline"} onClick={() => setMode("replace")}>
              Replace current
            </Button>
            <Button size="sm" variant={mode === "merge" ? "default" : "outline"} onClick={() => setMode("merge")}>
              Merge with current
            </Button>
          </div>

          <label
            className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary px-4 py-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void onFile(e.dataTransfer.files[0]);
            }}
          >
            <input
              type="file"
              accept="application/json,.json,.txt"
              className="sr-only"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <span className="text-sm font-medium">Drop a .json file or click to browse</span>
            <span className="mt-1 text-xs text-muted-foreground">
              Allen, Aakash, PW, Unacademy, FIITJEE, Resonance — any timetable ChatGPT can read.
            </span>
          </label>

          <div className="flex flex-col gap-2">
            <Label htmlFor="paste">Or paste JSON (ChatGPT reply)</Label>
            <Textarea
              id="paste"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder='{"name": "...", "lectures": [...]}'
              className="font-mono text-xs"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => ingest(paste)}>Import pasted JSON</Button>
              <Button
                variant="outline"
                onClick={() => {
                  importPlanner(MINI_EXAMPLE, mode);
                  toast.success("Tiny example week imported");
                  void navigate({ to: "/" });
                }}
              >
                Load tiny example
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  loadSample();
                  toast.success("Demo planner loaded");
                  void navigate({ to: "/" });
                }}
              >
                Load demo planner
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  downloadJson("jee-360-planner.json", exportPlanner());
                  toast.success("Downloaded current planner");
                }}
              >
                Export JSON
              </Button>
              <Button variant="ghost" onClick={() => clearPlanner()}>
                Clear lectures
              </Button>
            </div>
          </div>

          {error ? (
            <p className="whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
