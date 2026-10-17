import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LazyMathText } from "@/components/LazyMathText";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { gradeJeeHubPaper, getJeeHubPaper, listJeeHubPapers } from "@/lib/jee-hub-papers.functions";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tests/jee-hub")({
  validateSearch: (search: Record<string, unknown>): { paper?: string } => ({
    paper: typeof search.paper === "string" && search.paper ? search.paper : undefined,
  }),
  head: () => ({
    meta: [
      { property: "og:title", content: "JEEHub Paper Archive — Test Series | JEE Prep Hub" },
      { property: "og:description", content: "Practice repository-backed JEE, NEET, BITSAT, COMEDK, and MHT-CET question sets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "JEEHub Paper Archive — Test Series | JEE Prep Hub" },
      { name: "twitter:description", content: "Practice repository-backed JEE, NEET, BITSAT, COMEDK, and MHT-CET question sets." },

      { title: "JEEHub Paper Archive — Test Series | JEE Prep Hub" },
      {
        name: "description",
        content: "Practice repository-backed JEE, NEET, BITSAT, COMEDK, and MHT-CET question sets.",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: JeeHubPapersPage,
});

type Paper = {
  id: string;
  title: string;
  exam: string;
  year: number;
  shift: string | null;
  durationMinutes: number;
  isPartial: boolean;
  questionCount: number;
};
type Option = { label: string; text: string; imageUrl: string | null };
type Question = {
  id: string;
  questionNumber: number;
  type: "single" | "numerical";
  text: string;
  imageUrl: string | null;
  options: Option[];
};
type PaperData = {
  id: string;
  title: string;
  exam: string;
  year: number;
  durationMinutes: number;
  isPartial: boolean;
  questions: Question[];
};
type Grade = {
  paperId: string;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  details: Array<{
    questionId: string;
    isCorrect: boolean;
    correctAnswer: string | null;
    type: string;
  }>;
};

function JeeHubPapersPage() {
  const { paper: paperId } = Route.useSearch();
  const navigate = useNavigate();
  const listFn = useServerFn(listJeeHubPapers);
  const getPaperFn = useServerFn(getJeeHubPaper);
  const gradeFn = useServerFn(gradeJeeHubPaper);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState<Grade | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: papers, isLoading: papersLoading } = useQuery({
    queryKey: ["jee-hub-papers"],
    queryFn: () => listFn() as Promise<Paper[]>,
    staleTime: Infinity,
  });
  const {
    data: paper,
    isLoading: paperLoading,
    error: paperError,
  } = useQuery({
    queryKey: ["jee-hub-paper", paperId],
    queryFn: () => getPaperFn({ data: { paperId: paperId! } }) as Promise<PaperData>,
    enabled: !!paperId,
    staleTime: Infinity,
  });

  useEffect(() => {
    setStarted(false);
    setAnswers({});
    setQuestionIndex(0);
    setRemaining(0);
    setResult(null);
    setSubmitting(false);
  }, [paperId]);

  const questions = paper?.questions ?? [];
  const current = questions[questionIndex];
  const currentResult = useMemo(
    () => result?.details.find((detail) => detail.questionId === current?.id),
    [result, current?.id],
  );
  const answeredCount = Object.values(answers).filter(Boolean).length;

  const finishPaper = useCallback(async () => {
    if (!paperId || submitting || result) return;
    setSubmitting(true);
    try {
      const grade = (await gradeFn({ data: { paperId, answers } })) as Grade;
      setResult(grade);
      setStarted(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not check this paper");
    } finally {
      setSubmitting(false);
    }
  }, [paperId, submitting, result, gradeFn, answers]);

  useEffect(() => {
    if (!started || result) return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [started, result]);

  useEffect(() => {
    if (started && remaining === 0 && questions.length && !result && !submitting) {
      void finishPaper();
    }
  }, [started, remaining, questions.length, result, submitting, finishPaper]);

  const openPaper = (id: string) => navigate({ to: "/tests/jee-hub", search: { paper: id } });
  const backToList = () => navigate({ to: "/tests/jee-hub", search: {} });
  const startPaper = () => {
    if (!paper) return;
    setAnswers({});
    setQuestionIndex(0);
    setResult(null);
    setRemaining(paper.durationMinutes * 60);
    setStarted(true);
  };

  const timeText = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const paperList = (papers ?? []) as Paper[];

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-5xl space-y-4">
        <Link
          to="/tests"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Test Series
        </Link>

        {!paperId ? (
          <>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">JEEHub Paper Archive</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                15 repository-backed practice sets across JEE and other entrance exams.
              </p>
            </div>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex gap-3 p-4 text-sm">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-muted-foreground">
                  These source-repository datasets are shown with their actual question counts and
                  are not represented as complete official papers. The Advanced set is a
                  selected-question subset. Diagram and option images are loaded from the original
                  external image host. This practice mode runs from repository data and does not
                  save attempts to your account history.
                </p>
              </CardContent>
            </Card>
            {papersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {paperList.map((item) => (
                  <Card key={item.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        {item.isPartial && (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-amber-500 text-amber-700 dark:text-amber-300"
                          >
                            Source subset
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="mt-auto space-y-3">
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{item.exam}</Badge>
                        <span>{item.questionCount} available questions</span>
                        <span>{item.durationMinutes} min study timer</span>
                      </div>
                      <Button className="w-full" onClick={() => openPaper(item.id)}>
                        Open paper
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Source and MIT attribution:{" "}
              <a
                className="underline"
                href="https://github.com/dhruv-programmes/JeeHub"
                target="_blank"
                rel="noreferrer"
              >
                dhruv-programmes/JeeHub
              </a>
              .
            </p>
          </>
        ) : paperLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : paperError || !paper ? (
          <Card>
            <CardContent className="space-y-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">That paper could not be loaded.</p>
              <Button variant="outline" onClick={backToList}>
                Back to papers
              </Button>
            </CardContent>
          </Card>
        ) : !started && !result ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl">{paper.title}</CardTitle>
                {paper.isPartial && (
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-700 dark:text-amber-300"
                  >
                    Source subset
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {questions.length} available questions · {paper.durationMinutes}-minute timer ·
                answers checked on the server
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                This is a practice copy of the questions available in the upstream repository, not a
                guarantee of a complete official paper. Your answers and result stay in this browser
                session and are not added to Test Series history.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={startPaper}>Start practice</Button>
                <Button variant="outline" onClick={backToList}>
                  Back to papers
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : result ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Practice result
              </CardTitle>
              <p className="text-sm text-muted-foreground">{paper.title} · repository answer key</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ResultStat label="Correct" value={`${result.correct} / ${result.total}`} />
                <ResultStat label="Accuracy" value={`${result.accuracy}%`} />
                <ResultStat label="Incorrect" value={String(result.incorrect)} />
                <ResultStat label="Unanswered" value={String(result.unanswered)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Accuracy is calculated against questions in this source set; it is not an official
                exam score or rank.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={startPaper}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
                <Button variant="outline" onClick={backToList}>
                  All papers
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 border-t pt-4">
                {questions.map((question, i) => {
                  const detail = result.details.find((item) => item.questionId === question.id);
                  return (
                    <Button
                      key={question.id}
                      size="sm"
                      variant={
                        detail?.isCorrect
                          ? "default"
                          : answers[question.id]
                            ? "destructive"
                            : "outline"
                      }
                      className="h-8 min-w-8 px-2"
                      onClick={() => setQuestionIndex(i)}
                    >
                      {i + 1}
                    </Button>
                  );
                })}
              </div>
              {current && (
                <QuestionCard
                  question={current}
                  answer={answers[current.id] ?? ""}
                  result={currentResult ?? null}
                  onAnswer={() => {}}
                />
              )}
            </CardContent>
          </Card>
        ) : current ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3">
              <div className="min-w-0">
                <h1 className="truncate font-semibold">{paper.title}</h1>
                <p className="text-xs text-muted-foreground">
                  Question {questionIndex + 1} of {questions.length} · {answeredCount} answered
                </p>
              </div>
              <Badge
                variant={remaining <= 300 ? "destructive" : "secondary"}
                className="gap-1.5 tabular-nums"
              >
                <Clock3 className="h-3.5 w-3.5" /> {timeText}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1.5 rounded-xl border bg-card p-3">
              {questions.map((question, i) => (
                <Button
                  key={question.id}
                  size="sm"
                  variant={
                    questionIndex === i ? "default" : answers[question.id] ? "secondary" : "outline"
                  }
                  className="h-8 min-w-8 px-2"
                  aria-label={`Go to question ${i + 1}`}
                  onClick={() => setQuestionIndex(i)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>

            <QuestionCard
              question={current}
              answer={answers[current.id] ?? ""}
              result={null}
              onAnswer={(value) => setAnswers((previous) => ({ ...previous, [current.id]: value }))}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                disabled={questionIndex === 0}
                onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <div className="flex gap-2">
                {questionIndex < questions.length - 1 && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setQuestionIndex((index) => Math.min(questions.length - 1, index + 1))
                    }
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  disabled={submitting}
                  onClick={() => void finishPaper()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking…
                    </>
                  ) : (
                    "Submit paper"
                  )}
                </Button>
              </div>
            </div>
            {paper.isPartial && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Partial source set — the timer and accuracy are for practice only.
              </p>
            )}
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}

function QuestionCard({
  question,
  answer,
  result,
  onAnswer,
}: {
  question: Question;
  answer: string;
  result: { isCorrect: boolean; correctAnswer: string | null } | null;
  onAnswer: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Question {question.questionNumber}</CardTitle>
          <Badge variant="outline">
            {question.type === "numerical" ? "Numerical answer" : "Single choice"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {question.text && (
          <LazyMathText
            text={question.text}
            className="whitespace-pre-wrap text-sm leading-7 sm:text-base"
          />
        )}
        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt={`Diagram for question ${question.questionNumber}`}
            loading="lazy"
            className="max-h-[28rem] max-w-full rounded-md border object-contain"
          />
        )}
        {question.type === "numerical" ? (
          <div className="max-w-sm space-y-2">
            <label className="text-sm font-medium" htmlFor={`answer-${question.id}`}>
              Your answer
            </label>
            <Input
              id={`answer-${question.id}`}
              type="number"
              step="any"
              inputMode="decimal"
              value={answer}
              disabled={!!result}
              onChange={(event) => onAnswer(event.target.value)}
              placeholder="Enter a number"
            />
            {result && (
              <p
                className={
                  result.isCorrect
                    ? "text-sm font-medium text-emerald-600"
                    : "text-sm font-medium text-destructive"
                }
              >
                Correct answer: {result.correctAnswer ?? "Unavailable"}
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {question.options.map((option) => {
              const selected = answer === option.label;
              const correct = result?.correctAnswer === option.label;
              const wrongSelected = !!result && selected && !correct;
              const style = correct
                ? "border-emerald-500 bg-emerald-500/10"
                : wrongSelected
                  ? "border-destructive bg-destructive/10"
                  : selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50";
              return (
                <button
                  key={option.label}
                  type="button"
                  disabled={!!result}
                  onClick={() => onAnswer(option.label)}
                  className={`flex min-h-16 items-start gap-3 rounded-lg border p-3 text-left transition-colors ${style}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                    {option.label}
                  </span>
                  <span className="min-w-0 flex-1 space-y-2 text-sm">
                    {option.text && (
                      <LazyMathText text={option.text} className="whitespace-pre-wrap" />
                    )}
                    {option.imageUrl && (
                      <img
                        src={option.imageUrl}
                        alt={`Option ${option.label}`}
                        loading="lazy"
                        className="max-h-56 max-w-full object-contain"
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {result && (
          <p
            className={
              result.isCorrect
                ? "text-sm font-medium text-emerald-600"
                : "text-sm font-medium text-destructive"
            }
          >
            {result.isCorrect
              ? "Correct"
              : `Incorrect · correct answer: ${result.correctAnswer ?? "Unavailable"}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
