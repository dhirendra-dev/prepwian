import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { LectureRow } from "@/components/jee360/lecture-row";
import { WeekStrip } from "@/components/jee360/week-strip";
import { Badge } from "@/components/jee360/badge";
import { Button } from "@/components/ui/button";
import { formatLongDate, todayISO, weekDates } from "@/lib/jee360/dates";
import { lecturesOn, SUBJECT_LABEL, testsOn } from "@/lib/jee360/planner";
import { useAppStore } from "@/lib/jee360/store";
import type { Subject } from "@/lib/jee360/types";

export const Route = createFileRoute("/jee360/schedule")({
  head: () => ({ meta: [
      { property: "og:title", content: "Lecture Schedule — JEE 360 | PREPWIAN" },
      { property: "og:description", content: "Organize upcoming lectures and study sessions in JEE 360." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Lecture Schedule — JEE 360 | PREPWIAN" },
      { name: "twitter:description", content: "Organize upcoming lectures and study sessions in JEE 360." },{ title: "Lecture Schedule — JEE 360 | PREPWIAN" }, { name: "description", content: "Organize upcoming lectures and study sessions in JEE 360." }] }),
 component: SchedulePage });

function SchedulePage() {
  const lectures = useAppStore((s) => s.lectures);
  const tests = useAppStore((s) => s.tests);
  const setLectureStatus = useAppStore((s) => s.setLectureStatus);
  const [anchor, setAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState(todayISO());
  const [filter, setFilter] = useState<Subject | "all">("all");

  const dates = weekDates(anchor);
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const date of dates) {
      map[date] = lecturesOn(lectures, date).length + testsOn(tests, date).length;
    }
    return map;
  }, [dates, lectures, tests]);

  const dayLectures = lecturesOn(lectures, selected).filter(
    (l) => filter === "all" || l.subject === filter,
  );
  const dayTests = testsOn(tests, selected);

  function shiftWeek(dir: number) {
    const next = addDays(anchor, dir * 7);
    setAnchor(next);
    setSelected(weekDates(next)[0] ?? format(next, "yyyy-MM-dd"));
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Schedule</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">Everyday lectures</h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatLongDate(selected)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => shiftWeek(-1)}>
            Previous week
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const now = new Date();
              setAnchor(now);
              setSelected(todayISO(now));
            }}
          >
            Today
          </Button>
          <Button variant="outline" onClick={() => shiftWeek(1)}>
            Next week
          </Button>
        </div>
      </header>

      <WeekStrip dates={dates} selected={selected} counts={counts} onSelect={setSelected} />

      <div className="flex flex-wrap gap-2">
        {(["all", "physics", "chemistry", "maths"] as const).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "default" : "outline"}
            onClick={() => setFilter(key)}
          >
            {key === "all" ? "All subjects" : SUBJECT_LABEL[key]}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {dayTests.map((test) => (
          <div key={test.id} className="rounded-xl border border-primary/40 bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">Test</Badge>
              <Badge variant="outline">{test.startTime}</Badge>
              <Badge variant="outline">{test.durationMinutes} min</Badge>
            </div>
            <p className="mt-2 font-display text-xl">{test.title}</p>
            <p className="text-sm text-muted-foreground">{test.syllabus.join(" · ") || "Full paper"}</p>
          </div>
        ))}
        {dayLectures.map((lecture) => (
          <LectureRow
            key={lecture.id}
            lecture={lecture}
            onStatus={(status) => setLectureStatus(lecture.id, status)}
          />
        ))}
        {dayLectures.length === 0 && dayTests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No classes on {format(parseISO(selected), "EEEE")}. Park this day for backlog or a mock.
          </p>
        ) : null}
      </div>
    </div>
  );
}
