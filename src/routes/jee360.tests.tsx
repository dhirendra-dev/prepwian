import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/jee360/empty-state";
import { Badge } from "@/components/jee360/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/jee360/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { todayISO } from "@/lib/jee360/dates";
import { SUBJECT_LABEL } from "@/lib/jee360/planner";
import { useAppStore } from "@/lib/jee360/store";
import type { TestItem, TestSubject, TestType } from "@/lib/jee360/types";

export const Route = createFileRoute("/jee360/tests")({
  head: () => ({ meta: [
      { property: "og:title", content: "Mock Test Log — JEE 360 | JEE Prep Hub" },
      { property: "og:description", content: "Record mock tests and review your JEE 360 performance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Mock Test Log — JEE 360 | JEE Prep Hub" },
      { name: "twitter:description", content: "Record mock tests and review your JEE 360 performance." },{ title: "Mock Test Log — JEE 360 | JEE Prep Hub" }, { name: "description", content: "Record mock tests and review your JEE 360 performance." }] }),
 component: TestsPage });

function TestsPage() {
  const tests = useAppStore((s) => s.tests);
  const addTest = useAppStore((s) => s.addTest);
  const updateTest = useAppStore((s) => s.updateTest);
  const deleteTest = useAppStore((s) => s.deleteTest);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("09:00");
  const [subject, setSubject] = useState<TestSubject>("full");
  const [type, setType] = useState<TestType>("part");
  const [syllabus, setSyllabus] = useState("");
  const [maxScore, setMaxScore] = useState("300");

  const upcoming = tests.filter((t) => t.status === "upcoming");
  const done = tests.filter((t) => t.status !== "upcoming");

  function submit() {
    if (!title.trim()) return;
    addTest({
      title: title.trim(),
      date,
      startTime,
      subject,
      type,
      durationMinutes: 180,
      syllabus: syllabus
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      maxScore: Number(maxScore) || 300,
    });
    setTitle("");
    setSyllabus("");
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Assessment</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">Tests</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Weekly papers from your planner plus any extra mocks you add. Record score after you sit them.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add test</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New test</DialogTitle>
              <DialogDescription>A reminder is created automatically.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-title">Title</Label>
                <Input
                  id="t-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Part test — Mechanics"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="t-date">Date</Label>
                  <Input id="t-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="t-time">Start</Label>
                  <Input id="t-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Subject</Label>
                  <Select value={subject} onValueChange={(v) => setSubject(v as TestSubject)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full PCM</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="maths">Maths</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as TestType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chapter">Chapter</SelectItem>
                      <SelectItem value="part">Part</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="mock">Mock</SelectItem>
                      <SelectItem value="pyq">PYQ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-syl">Syllabus (comma separated)</Label>
                <Input
                  id="t-syl"
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  placeholder="Gravitation, Equilibrium"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-max">Max score</Label>
                <Input id="t-max" inputMode="numeric" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
              </div>
              <Button onClick={submit}>Save test</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="done">Completed ({done.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No upcoming tests"
              body="Import a planner with a tests array, or add a mock yourself."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map((test) => (
                <TestCard key={test.id} test={test} onUpdate={updateTest} onDelete={deleteTest} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="done">
          {done.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed papers yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {done.map((test) => (
                <TestCard key={test.id} test={test} onUpdate={updateTest} onDelete={deleteTest} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TestCard({
  test,
  onUpdate,
  onDelete,
}: {
  test: TestItem;
  onUpdate: (id: string, patch: Partial<TestItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [score, setScore] = useState(test.score?.toString() ?? "");
  const [rank, setRank] = useState(test.rank?.toString() ?? "");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">{SUBJECT_LABEL[test.subject]}</Badge>
              <Badge variant="outline">{test.type}</Badge>
              <Badge variant={test.status === "completed" ? "success" : "outline"}>{test.status}</Badge>
            </div>
            <p className="mt-2 font-display text-xl">{test.title}</p>
            <p className="text-sm text-muted-foreground">
              {test.date} · {test.startTime} · {test.durationMinutes} min
            </p>
            {test.syllabus.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">{test.syllabus.join(" · ")}</p>
            ) : null}
          </div>
          {test.score !== undefined ? (
            <p className="font-display text-3xl tabular-nums">
              {test.score}
              <span className="text-base text-muted-foreground">/{test.maxScore}</span>
            </p>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Score</Label>
            <Input inputMode="numeric" value={score} onChange={(e) => setScore(e.target.value)} placeholder="186" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Rank</Label>
            <Input inputMode="numeric" value={rank} onChange={(e) => setRank(e.target.value)} placeholder="142" />
          </div>
          <div className="flex items-end gap-2">
            <Button
              className="flex-1"
              variant="secondary"
              onClick={() =>
                onUpdate(test.id, {
                  score: score ? Number(score) : undefined,
                  rank: rank ? Number(rank) : undefined,
                  status: "completed",
                })
              }
            >
              Save result
            </Button>
            <Button variant="ghost" onClick={() => onDelete(test.id)}>
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
