import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bell, ClipboardList, Inbox } from "lucide-react";
import { toast } from "sonner";
import { LectureRow } from "@/components/jee360/lecture-row";
import { OrbitHud } from "@/components/jee360/orbit-hud";
import { ProtocolList } from "@/components/jee360/protocol-list";
import { Heatmap } from "@/components/jee360/heatmap";
import { Badge } from "@/components/jee360/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/jee360/card";
import { Progress } from "@/components/ui/progress";
import { formatCountdown, formatLongDate, todayISO, weekDates } from "@/lib/jee360/dates";
import {
  lecturesOn,
  openBacklog,
  unmarkedPast,
  upcomingReminders,
  upcomingTests,
  weekStats,
} from "@/lib/jee360/planner";
import { heatmap } from "@/lib/jee360/intel";
import { defaultPlanRange, useAppStore } from "@/lib/jee360/store";

export const Route = createFileRoute("/jee360/")({
  head: () => ({ meta: [
      { property: "og:title", content: "Study Overview — JEE 360 | PREPWIAN" },
      { property: "og:description", content: "Review lectures, backlog and mock-test progress in your local JEE 360 workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Study Overview — JEE 360 | PREPWIAN" },
      { name: "twitter:description", content: "Review lectures, backlog and mock-test progress in your local JEE 360 workspace." },{ title: "Study Overview — JEE 360 | PREPWIAN" }, { name: "description", content: "Review lectures, backlog and mock-test progress in your local JEE 360 workspace." }] }),
 component: Home });

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="mt-1 font-display text-3xl tabular-nums tracking-tight">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function Home() {
  const lectures = useAppStore((s) => s.lectures);
  const tests = useAppStore((s) => s.tests);
  const backlog = useAppStore((s) => s.backlog);
  const reminders = useAppStore((s) => s.reminders);
  const plans = useAppStore((s) => s.plans);
  const settings = useAppStore((s) => s.settings);
  const meta = useAppStore((s) => s.meta);
  const isDemo = useAppStore((s) => s.isDemo);
  const dismissDemo = useAppStore((s) => s.dismissDemo);
  const setLectureStatus = useAppStore((s) => s.setLectureStatus);
  const generatePlan = useAppStore((s) => s.generatePlan);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const navigate = useNavigate();

  const today = todayISO();
  const week = weekDates();
  const stats = weekStats(lectures, week);
  const todayLectures = lecturesOn(lectures, today);
  const todayTests = tests.filter((t) => t.date === today);
  const backlogOpen = openBacklog(backlog);
  const nextTests = upcomingTests(tests).slice(0, 3);
  const toMark = unmarkedPast(lectures).slice(0, 4);
  const nextReminders = upcomingReminders(reminders).slice(0, 3);
  const pct = stats.total ? Math.round((stats.attended / stats.total) * 100) : 0;
  const latestPlan = plans[0];
  const todayBlocks = latestPlan?.days.find((d) => d.date === today)?.blocks ?? [];
  const mesh = heatmap({ lectures, focusSessions, days: 28 });

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Today</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">{formatLongDate(today)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta?.name ?? "No planner loaded"}
            {meta?.source ? ` · ${meta.source}` : ""}
          </p>
        </div>
        <Button asChild>
          <Link to="/jee360/upload">Import planner</Link>
        </Button>
      </header>

      {isDemo ? (
        <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-sm">
            Demo week is loaded so you can click around. Convert your coaching timetable with ChatGPT, then
            import the JSON.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={dismissDemo}>
              Dismiss
            </Button>
            <Button size="sm" asChild>
              <Link to="/jee360/upload">How to convert</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <OrbitHud />
      <ProtocolList />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Today" value={todayLectures.length} hint="lectures on the clock" />
        <Stat label="Backlog" value={backlogOpen.length} hint="chapters to recover" />
        <Stat label="This week" value={`${stats.attended}/${stats.total || 0}`} hint="attended" />
        <Stat label="Exam" value={formatCountdown(settings.examDate)} hint="JEE Main target" />
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Week completion</p>
          <p className="text-sm tabular-nums">{pct}%</p>
        </div>
        <Progress value={pct} />
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm text-muted-foreground">Activity mesh</p>
        <Heatmap cells={mesh} />
      </section>

      {plans.length === 0 && lectures.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">No study plan yet</p>
              <p className="text-sm text-muted-foreground">
                Lay the next 14 days: lectures, test prep, then backlog.
              </p>
            </div>
            <Button
              onClick={() => {
                generatePlan({ ...defaultPlanRange(), dailyHours: settings.dailyHours, includeBacklog: true });
                toast.success("14-day plan ready");
                void navigate({ to: "/jee360/plans" });
              }}
            >
              Generate 14-day plan
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {toMark.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Mark attendance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              These lectures already finished. Mark them attended or send them to backlog.
            </p>
            {toMark.map((lecture) => (
              <LectureRow
                key={lecture.id}
                lecture={lecture}
                onStatus={(status) => setLectureStatus(lecture.id, status)}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid min-w-0 gap-4 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-3">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <h2 className="font-display text-2xl">Today’s schedule</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/jee360/schedule">
                Full week <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          {todayTests.map((test) => (
            <div key={test.id} className="rounded-xl border border-primary/40 bg-card p-4">
              <Badge variant="primary">Test today</Badge>
              <p className="mt-2 font-display text-xl">{test.title}</p>
              <p className="text-sm text-muted-foreground">
                {test.startTime} · {test.durationMinutes} min · {test.syllabus.join(" · ") || "Full paper"}
              </p>
            </div>
          ))}
          {todayLectures.length === 0 && todayTests.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Nothing scheduled today. Use the extra hours on backlog or revision.
            </p>
          ) : (
            todayLectures.map((lecture) => (
              <LectureRow
                key={lecture.id}
                lecture={lecture}
                onStatus={(status) => setLectureStatus(lecture.id, status)}
              />
            ))
          )}

          {todayBlocks.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">From your plan</p>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/jee360/plans">Open plan</Link>
                </Button>
              </div>
              <ul className="flex flex-col gap-1.5">
                {todayBlocks
                  .filter((b) => b.kind !== "lecture" && b.kind !== "test")
                  .map((block) => (
                    <li key={block.id} className="flex justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{block.title}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {block.startTime}–{block.endTime}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          <Card>
            <CardHeader className="flex min-w-0 flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="size-4" /> Upcoming tests
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/jee360/tests">All</Link>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {nextTests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tests on the calendar.</p>
              ) : (
                nextTests.map((test) => (
                  <div key={test.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                    <p className="text-sm font-medium">{test.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {test.date} · {test.startTime}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex min-w-0 flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Inbox className="size-4" /> Backlog
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/jee360/backlog">Plan</Link>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {backlogOpen.length === 0 ? (
                <p className="text-sm text-muted-foreground">Clear. No missed lectures.</p>
              ) : (
                backlogOpen.slice(0, 3).map((item) => (
                  <div key={item.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.chapter} · {item.priority} priority
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex min-w-0 flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="size-4" /> Next reminders
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/jee360/reminders">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {nextReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming alerts.</p>
              ) : (
                nextReminders.map((item) => (
                  <div key={item.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.datetime).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
