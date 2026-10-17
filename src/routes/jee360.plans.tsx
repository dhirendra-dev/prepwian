import { createFileRoute } from "@tanstack/react-router";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { ChevronDown, BookOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/jee360/empty-state";
import { Badge } from "@/components/jee360/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/jee360/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatLongDate, todayISO } from "@/lib/jee360/dates";
import { SUBJECT_SHORT } from "@/lib/jee360/planner";
import { defaultPlanRange, useAppStore } from "@/lib/jee360/store";
import type { PlanDay, StudyPlan } from "@/lib/jee360/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jee360/plans")({
  head: () => ({ meta: [
      { property: "og:title", content: "Study Plans — JEE 360 | JEE Prep Hub" },
      { property: "og:description", content: "Organize JEE preparation with lecture and revision plans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Study Plans — JEE 360 | JEE Prep Hub" },
      { name: "twitter:description", content: "Organize JEE preparation with lecture and revision plans." },{ title: "Study Plans — JEE 360 | JEE Prep Hub" }, { name: "description", content: "Organize JEE preparation with lecture and revision plans." }] }),
 component: PlansPage });

const KIND_LABEL: Record<string, string> = {
  lecture: "Lecture",
  revision: "Revision",
  backlog: "Backlog",
  test: "Test",
  "test-prep": "Test prep",
  "self-study": "Self-study",
};

function PlansPage() {
  const plans = useAppStore((s) => s.plans);
  const lectures = useAppStore((s) => s.lectures);
  const generatePlan = useAppStore((s) => s.generatePlan);
  const deletePlan = useAppStore((s) => s.deletePlan);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const range = defaultPlanRange();
  const [startDate, setStartDate] = useState(range.startDate);
  const [endDate, setEndDate] = useState(range.endDate);
  const [dailyHours, setDailyHours] = useState(String(settings.dailyHours));
  const [includeBacklog, setIncludeBacklog] = useState(true);
  const [name, setName] = useState("");

  function create() {
    if (endDate < startDate) {
      toast.error("End date must be after start date.");
      return;
    }
    if (differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) > 31) {
      toast.error("Keep a plan to 31 days or fewer.");
      return;
    }
    const plan = generatePlan({
      startDate,
      endDate,
      dailyHours: Number(dailyHours) || 4,
      includeBacklog,
      name: name.trim() || undefined,
    });
    updateSettings({ dailyHours: Number(dailyHours) || 4 });
    toast.success(`${plan.name} ready`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Study plans</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Build the next stretch</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Lectures stay on the calendar. The day before a test is reserved. Remaining hours go to backlog,
          then revision.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>New plan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="p-name">Name (optional)</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Fourteen-day recovery" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-start">From</Label>
            <Input id="p-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-end">To</Label>
            <Input id="p-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-hours">Self-study hours / day</Label>
            <Input id="p-hours" inputMode="numeric" value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-exam">Exam date</Label>
            <Input
              id="p-exam"
              type="date"
              value={settings.examDate}
              onChange={(e) => updateSettings({ examDate: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Include backlog</p>
              <p className="text-xs text-muted-foreground">Open items fill morning and evening blocks first.</p>
            </div>
            <Switch checked={includeBacklog} onCheckedChange={setIncludeBacklog} />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button onClick={create}>Generate plan</Button>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate(todayISO());
                setEndDate(format(addDays(new Date(), 13), "yyyy-MM-dd"));
              }}
            >
              Next 14 days
            </Button>
          </div>
        </CardContent>
      </Card>

      {plans.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No plans yet"
          body={
            lectures.length === 0
              ? "Import a lecture planner first, then generate a 14-day stretch."
              : "Generate a 14-day plan from the lectures and backlog already on the calendar."
          }
          action={lectures.length === 0 ? undefined : { label: "Generate 14-day plan", onClick: create }}
        />
      ) : (
        plans.map((plan) => <PlanCard key={plan.id} plan={plan} onDelete={() => deletePlan(plan.id)} />)
      )}
    </div>
  );
}

function PlanCard({ plan, onDelete }: { plan: StudyPlan; onDelete: () => void }) {
  const today = todayISO();
  const initial = plan.days.find((d) => d.date === today)?.date ?? plan.days[0]?.date ?? "";
  const [expanded, setExpanded] = useState(initial);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{plan.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {plan.startDate} → {plan.endDate} · {plan.dailyHours}h self-study
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {plan.days.map((day) => (
          <DayRow
            key={day.date}
            day={day}
            open={expanded === day.date}
            onToggle={() => setExpanded((cur) => (cur === day.date ? "" : day.date))}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function DayRow({ day, open, onToggle }: { day: PlanDay; open: boolean; onToggle: () => void }) {
  const isToday = day.date === todayISO();
  return (
    <div className="border-t border-border pt-2 first:border-0 first:pt-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-2 text-left hover:bg-secondary/70"
      >
        <div className="min-w-0">
          <p className="font-medium">
            {formatLongDate(day.date)}
            {isToday ? (
              <Badge variant="primary" className="ml-2 align-middle">
                Today
              </Badge>
            ) : null}
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {day.blocks.length} blocks · {day.hours}h load
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--motion-quick)]",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <ul className="mt-1 flex flex-col gap-1.5 pb-2">
          {day.blocks.map((block) => (
            <li
              key={block.id}
              className="flex items-start justify-between gap-3 rounded-md bg-secondary px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{block.title}</p>
                <p className="text-xs text-muted-foreground">
                  {block.startTime}–{block.endTime}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {block.subject ? <Badge variant="outline">{SUBJECT_SHORT[block.subject]}</Badge> : null}
                <Badge variant="outline">{KIND_LABEL[block.kind] ?? block.kind}</Badge>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
