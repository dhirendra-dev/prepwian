import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Crosshair } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/jee360/empty-state";
import { Badge } from "@/components/jee360/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/jee360/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBJECT_LABEL, SUBJECT_SHORT } from "@/lib/jee360/planner";
import { useAppStore } from "@/lib/jee360/store";
import type { MistakeKind, Subject } from "@/lib/jee360/types";

export const Route = createFileRoute("/jee360/errors")({
  head: () => ({ meta: [
      { property: "og:title", content: "Mistake Book — JEE 360 | JEE Prep Hub" },
      { property: "og:description", content: "Record practice mistakes and plan targeted JEE revision." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Mistake Book — JEE 360 | JEE Prep Hub" },
      { name: "twitter:description", content: "Record practice mistakes and plan targeted JEE revision." },{ title: "Mistake Book — JEE 360 | JEE Prep Hub" }, { name: "description", content: "Record practice mistakes and plan targeted JEE revision." }] }),
 component: ErrorsPage });

const KINDS: { value: MistakeKind; label: string }[] = [
  { value: "concept", label: "Concept" },
  { value: "calculation", label: "Calculation" },
  { value: "silly", label: "Silly" },
];

function ErrorsPage() {
  const mistakes = useAppStore((s) => s.mistakes);
  const addMistake = useAppStore((s) => s.addMistake);
  const updateMistake = useAppStore((s) => s.updateMistake);
  const open = mistakes.filter((m) => m.status === "open");
  const cleared = mistakes.filter((m) => m.status === "cleared");

  const [subject, setSubject] = useState<Subject>("physics");
  const [chapter, setChapter] = useState("");
  const [concept, setConcept] = useState("");
  const [kind, setKind] = useState<MistakeKind>("concept");

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Lab</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Error log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every wrong question from a mock lives here until you can re-attempt it cold.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Open</p>
            <p className="font-display text-3xl tabular-nums">{open.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Cleared</p>
            <p className="font-display text-3xl tabular-nums">{cleared.length}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Log a miss</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="maths">Maths</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as MistakeKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ch">Chapter</Label>
            <Input id="ch" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Gravitation" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="co">What went wrong</Label>
            <Input id="co" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Forgot escape vs orbital" />
          </div>
          <Button
            className="sm:col-span-2"
            onClick={() => {
              if (!chapter.trim() || !concept.trim()) return;
              addMistake({ subject, chapter: chapter.trim(), concept: concept.trim(), kind });
              setChapter("");
              setConcept("");
              toast.success("Logged");
            }}
          >
            Add to log
          </Button>
        </CardContent>
      </Card>

      {open.length === 0 && cleared.length === 0 ? (
        <EmptyState icon={Crosshair} title="Log is empty" body="After a mock, dump every miss here. Re-attempt until it clears." />
      ) : (
        <ul className="flex flex-col gap-2">
          {open.map((m) => (
            <li key={m.id} className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{SUBJECT_SHORT[m.subject]}</Badge>
                  <Badge variant={m.kind === "silly" ? "warning" : "outline"}>{m.kind}</Badge>
                </div>
                <p className="mt-1 text-sm font-medium">{m.chapter}</p>
                <p className="text-xs text-muted-foreground">
                  {m.concept}
                  {m.testTitle ? ` · ${m.testTitle}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  updateMistake(m.id, { status: "cleared" });
                  toast.success("Cleared");
                }}
              >
                Re-attempted
              </Button>
            </li>
          ))}
        </ul>
      )}

      {cleared.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {cleared.length} cleared · {cleared.map((m) => SUBJECT_LABEL[m.subject]).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
