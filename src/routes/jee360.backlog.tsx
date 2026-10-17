import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
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
import { todayISO } from "@/lib/jee360/dates";
import { SUBJECT_LABEL } from "@/lib/jee360/planner";
import { useAppStore } from "@/lib/jee360/store";
import type { BacklogStatus, Priority, Subject } from "@/lib/jee360/types";

export const Route = createFileRoute("/jee360/backlog")({
  head: () => ({ meta: [
      { property: "og:title", content: "Lecture Backlog — JEE 360 | JEE Prep Hub" },
      { property: "og:description", content: "Track pending lectures and organize your JEE study backlog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Lecture Backlog — JEE 360 | JEE Prep Hub" },
      { name: "twitter:description", content: "Track pending lectures and organize your JEE study backlog." },{ title: "Lecture Backlog — JEE 360 | JEE Prep Hub" }, { name: "description", content: "Track pending lectures and organize your JEE study backlog." }] }),
 component: BacklogPage });

const COLUMNS: { key: BacklogStatus; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "Catching up" },
  { key: "cleared", label: "Cleared" },
];

function BacklogPage() {
  const backlog = useAppStore((s) => s.backlog);
  const addBacklog = useAppStore((s) => s.addBacklog);
  const updateBacklog = useAppStore((s) => s.updateBacklog);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [chapter, setChapter] = useState("");
  const [subject, setSubject] = useState<Subject>("physics");
  const [priority, setPriority] = useState<Priority>("medium");

  function submit() {
    if (!title.trim() || !chapter.trim()) return;
    addBacklog({
      title: title.trim(),
      chapter: chapter.trim(),
      subject,
      priority,
      missedDate: todayISO(),
    });
    setTitle("");
    setChapter("");
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Recovery</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">Backlog planner</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Missed lectures land here automatically. Set a catch-up date, then generate a study plan to
            slot them into free hours.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add chapter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual backlog item</DialogTitle>
              <DialogDescription>Use this for older chapters not in the uploaded planner.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bl-title">Title</Label>
                <Input
                  id="bl-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Rotational Motion — rolling"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bl-chapter">Chapter</Label>
                <Input
                  id="bl-chapter"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="Rotational Motion"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={submit}>Add to backlog</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {backlog.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No backlog"
          body="Mark a lecture as missed on the schedule and it will appear here with high priority."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = backlog.filter((b) => b.status === col.key);
            return (
              <section key={col.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-medium">{col.label}</h2>
                  <span className="text-xs tabular-nums text-muted-foreground">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
                    Empty
                  </p>
                ) : (
                  items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="flex flex-col gap-3 p-4">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline">{SUBJECT_LABEL[item.subject]}</Badge>
                          <Badge
                            variant={
                              item.priority === "high"
                                ? "danger"
                                : item.priority === "medium"
                                  ? "warning"
                                  : "outline"
                            }
                          >
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Missed {item.missedDate}
                          {item.plannedCatchupDate ? ` · catch up ${item.plannedCatchupDate}` : ""}
                        </p>
                        <Label className="text-xs text-muted-foreground">Catch-up date</Label>
                        <Input
                          type="date"
                          value={item.plannedCatchupDate ?? ""}
                          onChange={(e) =>
                            updateBacklog(item.id, { plannedCatchupDate: e.target.value || undefined })
                          }
                        />
                        <div className="flex flex-wrap gap-1">
                          {COLUMNS.filter((c) => c.key !== item.status).map((c) => (
                            <Button
                              key={c.key}
                              size="sm"
                              variant="outline"
                              onClick={() => updateBacklog(item.id, { status: c.key })}
                            >
                              {c.label}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
