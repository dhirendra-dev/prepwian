import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicTest, startAttempt, toggleBookmark, listMyBookmarks } from "@/lib/tests.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Award, ListChecks, AlertTriangle, Trophy, Loader2, Bookmark, BookmarkCheck, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/tests/$testId")({
  head: ({ params }) => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Test Details" },
      { name: "twitter:description", content: "Real-exam CBT interface." },

      { title: `Test Details — JEE Prep Hub` },
      { name: "description", content: "Full CBT test details, instructions, and start options." },
      { property: "og:title", content: "Test Details" },
      { property: "og:description", content: "Real-exam CBT interface." },
    ],
  }),
  component: TestDetail,
});

function TestDetail() {
  const { testId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const fetchTest = useServerFn(getPublicTest);
  const startFn = useServerFn(startAttempt);
  const bookmarkFn = useServerFn(toggleBookmark);
  const listBookmarksFn = useServerFn(listMyBookmarks);
  const [starting, setStarting] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [confirmedRules, setConfirmedRules] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["tests", "detail", testId],
    queryFn: () => fetchTest({ data: { testId } }),
  });
  const { data: bookmarks } = useQuery({
    queryKey: ["tests", "my-bookmarks"],
    queryFn: () => listBookmarksFn(),
    enabled: !!user,
  });
  const isBookmarked = ((bookmarks as any[] | undefined) ?? []).some((b) => b.id === testId);

  function openInstructions() {
    if (!user) {
      nav({ to: "/auth", search: { redirect: `/tests/${testId}` } as never });
      return;
    }
    if ((user as any).is_anonymous) {
      toast.error("Create a free account to attempt CBT tests and save scores.");
      nav({ to: "/auth", search: { redirect: `/tests/${testId}` } as never });
      return;
    }
    setShowInstructions(true);
  }

  async function handleStart() {
    if (!user) {
      nav({ to: "/auth", search: { redirect: `/tests/${testId}` } as never });
      return;
    }
    if ((user as any).is_anonymous) {
      toast.error("Create a free account to attempt CBT tests and save scores.");
      nav({ to: "/auth", search: { redirect: `/tests/${testId}` } as never });
      return;
    }
    if (!confirmedRules) {
      toast.error("Please confirm you have read and understood the instructions.");
      return;
    }
    setStarting(true);
    try {
      const res = await startFn({ data: { testId } });
      nav({ to: "/tests/attempt/$attemptId", params: { attemptId: res.attemptId } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start attempt");
      setStarting(false);
    }
  }

  async function handleBookmark() {
    if (!user) { toast.error("Sign in to bookmark"); return; }
    setBookmarking(true);
    try {
      const r = await bookmarkFn({ data: { testId } });
      toast.success(r.bookmarked ? "Bookmarked" : "Removed bookmark");
      qc.invalidateQueries({ queryKey: ["tests", "my-bookmarks"] });
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    setBookmarking(false);
  }

  if (isLoading) return <AppShell><div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AppShell>;
  if (error || !data) return <AppShell><div className="rounded-lg border bg-card p-6 text-center text-sm">Test not found. <Link to="/tests" className="underline">Back to list</Link></div></AppShell>;

  const t = data as any;
  const now = Date.now();
  const startsAt = t.starts_at ? new Date(t.starts_at).getTime() : null;
  const endsAt = t.ends_at ? new Date(t.ends_at).getTime() : null;
  const notStarted = Boolean(startsAt && startsAt > now);
  const ended = Boolean(endsAt && endsAt < now);
  const unavailable = (t.question_count ?? 0) === 0 || notStarted || ended;

  if (showInstructions) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg sm:text-xl">General Instructions</CardTitle>
              <p className="text-sm text-muted-foreground">{t.name}</p>
            </CardHeader>
            <CardContent className="space-y-5 pt-5 text-sm">
              <section className="grid gap-3 sm:grid-cols-3">
                <StatBox icon={<Clock className="h-4 w-4" />} label="Total duration" value={`${t.duration_min} min`} />
                <StatBox icon={<ListChecks className="h-4 w-4" />} label="Questions" value={String(t.question_count ?? 0)} />
                <StatBox icon={<Award className="h-4 w-4" />} label="Maximum marks" value={String(Number(t.total_marks))} />
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold">Marking scheme</h3>
                <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
                  <li>Correct answer: <b className="text-emerald-600">+{Number(t.default_marks_per_question)}</b> marks.</li>
                  <li>Incorrect answer: <b className="text-red-600">−{Number(t.default_negative_per_question)}</b> marks.</li>
                  <li>Unattempted question: <b>0</b> marks. Numerical answers allow a small tolerance.</li>
                </ul>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold">Question palette legend</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <LegendRow className="bg-muted text-muted-foreground border" text="Not visited yet" />
                  <LegendRow className="bg-red-500 text-white" text="Visited but not answered" />
                  <LegendRow className="bg-emerald-600 text-white" text="Answered" />
                  <LegendRow className="bg-purple-600 text-white" text="Marked for review" />
                  <LegendRow className="bg-purple-600 text-white" dot text="Answered & marked for review" />
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold">Navigating the test</h3>
                <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
                  <li><b>Save &amp; Next</b> — saves your answer and moves to the next question.</li>
                  <li><b>Mark &amp; Next</b> — flags the question for review and moves on; the answer is still saved.</li>
                  <li><b>Clear</b> — removes your response for the current question.</li>
                  <li>Use the palette to jump to any question at any time.</li>
                </ul>
              </section>

              <section className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-amber-600" /> Exam integrity</h3>
                <ul className="ml-4 list-disc space-y-1 text-xs text-amber-900 dark:text-amber-100">
                  <li>Tab switches are logged with your attempt and shown to admins.</li>
                  <li>Do not refresh or close the tab — the timer keeps running.</li>
                  <li>The test auto-submits when the timer reaches zero.</li>
                </ul>
                {t.instructions && <p className="mt-2 whitespace-pre-wrap text-xs">{t.instructions}</p>}
              </section>

              <label className="flex cursor-pointer items-start gap-2 rounded-md border bg-background p-3 text-xs font-medium">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-primary"
                  checked={confirmedRules}
                  onChange={(e) => setConfirmedRules(e.target.checked)}
                />
                <span>I have read and understood the instructions.</span>
              </label>

              <div className="flex flex-wrap gap-2">
                <Button size="lg" onClick={handleStart} disabled={!confirmedRules || starting || unavailable}>
                  {starting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…</> : "I am ready to begin"}
                </Button>
                <Button size="lg" variant="outline" onClick={() => setShowInstructions(false)} disabled={starting}>Back</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <Link to="/tests" className="text-xs text-muted-foreground hover:underline">← All tests</Link>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl sm:text-2xl">{t.name}</CardTitle>
                {t.description && <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>}
              </div>
              {t.is_premium && <Badge className="bg-amber-500 text-white">PRO</Badge>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="uppercase">{String(t.exam_type).replace(/_/g, " ")}</Badge>
              <Badge variant="outline" className="uppercase">{t.subject}</Badge>
              <Badge variant="outline" className="uppercase">{t.difficulty}</Badge>
              <Badge variant="outline" className="uppercase">{t.mode}</Badge>
              {t.status === "scheduled" && <Badge variant="outline" className="border-blue-500 text-blue-600">Scheduled</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox icon={<Clock className="h-4 w-4" />} label="Duration" value={`${t.duration_min} min`} />
              <StatBox icon={<Award className="h-4 w-4" />} label="Total marks" value={String(Number(t.total_marks))} />
              <StatBox icon={<ListChecks className="h-4 w-4" />} label="Questions" value={String(t.question_count ?? 0)} />
              <StatBox icon={<Trophy className="h-4 w-4" />} label="Attempts" value={`${t.max_attempts}`} />
            </div>

            <div className="rounded-lg border bg-muted/40 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> JEE CBT guidelines & rules</h3>
              <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
                <li>Timer starts the moment you click <b>Start Test</b> and auto-submits when it runs out.</li>
                <li>Correct answer: <b>+{Number(t.default_marks_per_question)}</b> · Wrong: <b>−{Number(t.default_negative_per_question)}</b> · Unattempted: 0.</li>
                <li>Use the question palette to jump between questions, mark for review, clear response, and revisit any time.</li>
                <li>Single-correct, multiple-correct, integer, and numerical-answer questions are supported.</li>
                <li>Do not refresh, switch tabs, or exit fullscreen during live tests — these events are recorded like a real CBT session.</li>
                <li>Submit only after reviewing the palette: answered, not answered, marked for review, and not visited.</li>
                <li>Numerical questions accept decimal answers with a small tolerance.</li>
                {t.instructions && <li className="whitespace-pre-wrap">{t.instructions}</li>}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">You will see the full NTA-style general instructions screen before the timer starts.</p>
            </div>


            {(notStarted || ended) && (
              <div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground"><AlertTriangle className="h-4 w-4 text-amber-500" /> Test timing</div>
                {notStarted && <p className="mt-1">This test opens at {new Date(startsAt as number).toLocaleString()}.</p>}
                {ended && <p className="mt-1">This test window has ended.</p>}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={openInstructions} disabled={starting || unavailable} className="flex-1 sm:flex-none">
                {user ? "Start Test" : "Sign in to Start"}
              </Button>
              <Button size="lg" variant="outline" onClick={handleBookmark} disabled={bookmarking}>
                {isBookmarked ? <><BookmarkCheck className="mr-1.5 h-4 w-4 text-primary" /> Bookmarked</> : <><Bookmark className="mr-1.5 h-4 w-4" /> Bookmark</>}
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/tests/leaderboard/$testId" params={{ testId }}><Trophy className="mr-1.5 h-4 w-4" /> Leaderboard</Link>
              </Button>
            </div>
            {(t.question_count ?? 0) === 0 && <p className="text-xs text-amber-600">This test has no questions yet.</p>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function LegendRow({ className, text, dot }: { className: string; text: string; dot?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`relative inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold ${className}`}>
        9
        {dot && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-background" />}
      </span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}
