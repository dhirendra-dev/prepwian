import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  RotateCcw,
  Trophy,
  Target,
  XCircle,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/pyq",
)({
  component: PYQPractice,
});

type Question = {
  id: string;
  exam: string;
  year: number;
  session: string | null;
  paper: string | null;
  subject: string;
  chapter_id: string | null;
  chapter_name: string | null;
  topic_id: string | null;
  topic_name: string | null;
  question_text: string;
  question_type: string;
  options: any[];
  correct_answer: any;
  explanation: string | null;
  difficulty: string | null;
  marks: number | null;
  negative_marks: number | null;
  source_url: string | null;
  source_label: string | null;
  is_attempted: boolean;
  is_correct: boolean | null;
  time_taken_seconds: number | null;
  is_bookmarked: boolean;
};

const SUBJECTS = [
  { value: "", label: "All Subjects" },
  { value: "PHYSICS", label: "Physics" },
  { value: "CHEMISTRY", label: "Chemistry" },
  { value: "MATHEMATICS", label: "Mathematics" },
];

const DIFFICULTIES = [
  { value: "", label: "All Difficulty" },
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

function PYQPractice() {
  const [exam, setExam] = React.useState("");
  const [year, setYear] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [difficulty, setDifficulty] =
    React.useState("");

  const [questions, setQuestions] =
    React.useState<Question[]>([]);

  const [currentIndex, setCurrentIndex] =
    React.useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    React.useState<any>(null);

  const [submitted, setSubmitted] =
    React.useState(false);

  const [loading, setLoading] =
    React.useState(false);

  const [saving, setSaving] =
    React.useState(false);

  const [error, setError] =
    React.useState<string | null>(null);

  const [startedAt, setStartedAt] =
    React.useState<number | null>(null);

  const [elapsedSeconds, setElapsedSeconds] =
    React.useState(0);

  const currentQuestion =
    questions[currentIndex] ?? null;

  const loadQuestions = React.useCallback(
    async () => {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } =
        await (supabase as any).rpc(
          "get_jee_pyq_questions",
          {
            _exam: exam || null,
            _year: year
              ? Number(year)
              : null,
            _subject: subject || null,
            _chapter_id: null,
            _topic_id: null,
            _difficulty:
              difficulty || null,
            _question_type: null,
            _bookmarked_only: false,
            _limit: 50,
          },
        );

      if (rpcError) {
        console.error(rpcError);
        setError(rpcError.message);
        setQuestions([]);
      } else {
        const normalized =
          (data ?? []).map((item: any) => ({
            ...item,
            options: Array.isArray(item.options)
              ? item.options
              : [],
            is_attempted:
              Boolean(item.is_attempted),
            is_bookmarked:
              Boolean(item.is_bookmarked),
          }));

        setQuestions(normalized);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setSubmitted(false);
      }

      setLoading(false);
    },
    [exam, year, subject, difficulty],
  );

  React.useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  React.useEffect(() => {
    if (!startedAt || submitted) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds(
        Math.floor(
          (Date.now() - startedAt) / 1000,
        ),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt, submitted]);

  React.useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    setSelectedAnswer(null);
    setSubmitted(false);
    setElapsedSeconds(
      currentQuestion.time_taken_seconds ?? 0,
    );
    setStartedAt(Date.now());
  }, [currentQuestion?.id]);

  const submitAnswer = async () => {
    if (
      !currentQuestion ||
      selectedAnswer === null ||
      saving
    ) {
      return;
    }

    setSaving(true);

    const correct = isAnswerCorrect(
      selectedAnswer,
      currentQuestion.correct_answer,
    );

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "save_jee_pyq_attempt",
        {
          _question_id:
            currentQuestion.id,
          _selected_answer:
            selectedAnswer,
          _is_correct: correct,
          _time_taken_seconds:
            elapsedSeconds,
        },
      );

    if (
      rpcError ||
      data?.success === false
    ) {
      setError(
        rpcError?.message ??
          data?.message ??
          "Unable to save your answer.",
      );
      setSaving(false);
      return;
    }

    setQuestions((items) =>
      items.map((item) =>
        item.id === currentQuestion.id
          ? {
              ...item,
              is_attempted: true,
              is_correct: correct,
              time_taken_seconds:
                elapsedSeconds,
            }
          : item,
      ),
    );

    setSubmitted(true);
    setSaving(false);
  };

  const toggleBookmark = async () => {
    if (!currentQuestion || saving) {
      return;
    }

    setSaving(true);

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "toggle_jee_pyq_bookmark",
        {
          _question_id:
            currentQuestion.id,
        },
      );

    if (
      rpcError ||
      data?.success === false
    ) {
      setError(
        rpcError?.message ??
          data?.message ??
          "Unable to update bookmark.",
      );
      setSaving(false);
      return;
    }

    setQuestions((items) =>
      items.map((item) =>
        item.id === currentQuestion.id
          ? {
              ...item,
              is_bookmarked:
                Boolean(data.bookmarked),
            }
          : item,
      ),
    );

    setSaving(false);
  };

  const nextQuestion = () => {
    if (
      currentIndex >=
      questions.length - 1
    ) {
      return;
    }

    setCurrentIndex(
      (index) => index + 1,
    );
  };

  const previousQuestion = () => {
    if (currentIndex <= 0) {
      return;
    }

    setCurrentIndex(
      (index) => index - 1,
    );
  };

  const resetFilters = () => {
    setExam("");
    setYear("");
    setSubject("");
    setDifficulty("");
  };

  const attemptedCount =
    questions.filter(
      (question) =>
        question.is_attempted,
    ).length;

  const correctCount =
    questions.filter(
      (question) =>
        question.is_correct === true,
    ).length;

  const accuracy =
    attemptedCount === 0
      ? 0
      : Math.round(
          (correctCount /
            attemptedCount) *
            100,
        );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            window.history.back()
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div>
          <Badge variant="outline">
            JEE Study System
          </Badge>

          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            JEE PYQ Practice
          </h1>

          <p className="mt-3 max-w-3xl text-muted-foreground">
            Practice previous-year JEE questions and
            track your accuracy, time and mistakes.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Practice Filters
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <select
                value={exam}
                onChange={(e) =>
                  setExam(e.target.value)
                }
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">
                  All Exams
                </option>
                <option value="JEE_MAIN">
                  JEE Main
                </option>
                <option value="JEE_ADVANCED">
                  JEE Advanced
                </option>
              </select>

              <select
                value={year}
                onChange={(e) =>
                  setYear(e.target.value)
                }
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">
                  All Years
                </option>
                {Array.from(
                  { length: 15 },
                  (_, index) =>
                    2026 - index,
                ).map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                {SUBJECTS.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ),
                )}
              </select>

              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(
                    e.target.value,
                  )
                }
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                {DIFFICULTIES.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            icon={
              <Target className="h-5 w-5" />
            }
            label="Questions Loaded"
            value={questions.length}
          />

          <Stat
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            label="Attempted"
            value={attemptedCount}
          />

          <Stat
            icon={
              <Trophy className="h-5 w-5" />
            }
            label="Accuracy"
            value={`${accuracy}%`}
          />
        </div>

        {error && (
          <Card>
            <CardContent className="p-5 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="flex min-h-52 items-center justify-center text-muted-foreground">
              Loading PYQs...
            </CardContent>
          </Card>
        )}

        {!loading &&
          !currentQuestion && (
            <Card>
              <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
                <Target className="h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No PYQs available
                </h2>

                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  No question records match the selected
                  filters. Import actual JEE PYQs into the
                  database to start practicing.
                </p>
              </CardContent>
            </Card>
          )}

        {!loading &&
          currentQuestion && (
            <>
              {/* Question progress */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Badge>
                        Question{" "}
                        {currentIndex + 1} /{" "}
                        {questions.length}
                      </Badge>

                      <Badge variant="outline">
                        {currentQuestion.exam ===
                        "JEE_ADVANCED"
                          ? "JEE Advanced"
                          : "JEE Main"}
                      </Badge>

                      <Badge variant="secondary">
                        {currentQuestion.subject}
                      </Badge>

                      {currentQuestion.difficulty && (
                        <Badge variant="outline">
                          {currentQuestion.difficulty}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock3 className="h-4 w-4" />
                      {formatTime(
                        elapsedSeconds,
                      )}
                    </div>
                  </div>

                  <Progress
                    className="mt-4"
                    value={
                      ((currentIndex + 1) /
                        questions.length) *
                      100
                    }
                  />
                </CardContent>
              </Card>

              {/* Question */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {currentQuestion.year && (
                          <Badge variant="outline">
                            {currentQuestion.year}
                          </Badge>
                        )}

                        {currentQuestion.session && (
                          <Badge variant="outline">
                            {currentQuestion.session}
                          </Badge>
                        )}
                      </div>

                      {currentQuestion.chapter_name && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          {currentQuestion.chapter_name}
                          {currentQuestion.topic_name
                            ? ` • ${currentQuestion.topic_name}`
                            : ""}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={saving}
                      onClick={
                        toggleBookmark
                      }
                    >
                      {currentQuestion.is_bookmarked ? (
                        <BookmarkCheck className="h-5 w-5" />
                      ) : (
                        <Bookmark className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-8">
                  <div className="rounded-xl border p-5">
                    <p className="whitespace-pre-wrap text-base leading-8">
                      {
                        currentQuestion.question_text
                      }
                    </p>
                  </div>

                  {/* Options */}
                  {currentQuestion.options
                    .length > 0 ? (
                    <div className="space-y-3">
                      {currentQuestion.options.map(
                        (
                          option: any,
                          index: number,
                        ) => {
                          const value =
                            getOptionValue(
                              option,
                              index,
                            );

                          const isSelected =
                            selectedAnswer ===
                            value;

                          const isCorrect =
                            submitted &&
                            isAnswerCorrect(
                              value,
                              currentQuestion.correct_answer,
                            );

                          const isWrongSelected =
                            submitted &&
                            isSelected &&
                            !isCorrect;

                          return (
                            <button
                              key={`${currentQuestion.id}-${index}`}
                              type="button"
                              disabled={submitted}
                              onClick={() =>
                                setSelectedAnswer(
                                  value,
                                )
                              }
                              className={`w-full rounded-xl border p-4 text-left transition ${
                                isCorrect
                                  ? "border-green-500 bg-green-500/10"
                                  : isWrongSelected
                                    ? "border-red-500 bg-red-500/10"
                                    : isSelected
                                      ? "border-primary bg-primary/10"
                                      : "hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex gap-3">
                                <span className="font-semibold">
                                  {String.fromCharCode(
                                    65 + index,
                                  )}
                                  .
                                </span>

                                <span className="whitespace-pre-wrap">
                                  {getOptionLabel(
                                    option,
                                  )}
                                </span>

                                {isCorrect && (
                                  <CheckCircle2 className="ml-auto h-5 w-5 shrink-0" />
                                )}

                                {isWrongSelected && (
                                  <XCircle className="ml-auto h-5 w-5 shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                  ) : null}

                  {!submitted && (
                    <Button
                      size="lg"
                      disabled={
                        selectedAnswer === null ||
                        saving ||
                        currentQuestion.options.length === 0
                      }
                      onClick={submitAnswer}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {saving
                        ? "Saving..."
                        : "Submit Answer"}
                    </Button>
                  )}

                  {submitted && (
                    <AnswerResult
                      question={currentQuestion}
                      selectedAnswer={selectedAnswer}
                    />
                  )}

                  <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-between">
                    <Button
                      variant="outline"
                      disabled={currentIndex === 0}
                      onClick={previousQuestion}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    <Button
                      disabled={
                        currentIndex >= questions.length - 1
                      }
                      onClick={nextQuestion}
                    >
                      Next Question
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
      </div>
    </div>
  );
}

function AnswerResult({
  question,
  selectedAnswer,
}: {
  question: Question;
  selectedAnswer: any;
}) {
  const correct = isAnswerCorrect(
    selectedAnswer,
    question.correct_answer,
  );

  return (
    <div
      className={`rounded-xl border p-5 ${
        correct
          ? "border-green-500/40 bg-green-500/10"
          : "border-red-500/40 bg-red-500/10"
      }`}
    >
      <div className="flex items-center gap-3">
        {correct ? (
          <CheckCircle2 className="h-6 w-6" />
        ) : (
          <XCircle className="h-6 w-6" />
        )}

        <div>
          <p className="font-semibold">
            {correct ? "Correct!" : "Incorrect"}
          </p>

          <p className="text-sm text-muted-foreground">
            Correct answer:{" "}
            {formatAnswer(question.correct_answer)}
          </p>
        </div>
      </div>

      {question.explanation && (
        <div className="mt-5 border-t pt-5">
          <p className="text-sm font-semibold">
            Explanation
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {question.explanation}
          </p>
        </div>
      )}

      {question.source_url && (
        <a
          href={question.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm underline"
        >
          {question.source_label ?? "View source"}
        </a>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="rounded-lg border p-2">
            {icon}
          </div>

          <span className="text-xl font-bold">
            {value}
          </span>
        </div>

        <p className="mt-3 text-sm font-medium">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

function getOptionValue(
  option: any,
  index: number,
) {
  if (
    option &&
    typeof option === "object"
  ) {
    if ("value" in option) {
      return option.value;
    }

    if ("id" in option) {
      return option.id;
    }

    if ("label" in option) {
      return option.label;
    }
  }

  return (
    option ??
    String.fromCharCode(65 + index)
  );
}

function getOptionLabel(option: any) {
  if (
    option &&
    typeof option === "object"
  ) {
    return (
      option.text ??
      option.label ??
      option.value ??
      JSON.stringify(option)
    );
  }

  return String(option);
}

function normalizeAnswer(answer: any) {
  if (
    answer &&
    typeof answer === "object"
  ) {
    if ("value" in answer) {
      return String(answer.value)
        .trim()
        .toLowerCase();
    }

    if ("answer" in answer) {
      return String(answer.answer)
        .trim()
        .toLowerCase();
    }

    if ("option" in answer) {
      return String(answer.option)
        .trim()
        .toLowerCase();
    }
  }

  return String(answer ?? "")
    .trim()
    .toLowerCase();
}

function isAnswerCorrect(
  selected: any,
  correct: any,
) {
  const selectedValue =
    normalizeAnswer(selected);

  if (Array.isArray(correct)) {
    return correct.some(
      (item) =>
        normalizeAnswer(item) ===
        selectedValue,
    );
  }

  return (
    normalizeAnswer(correct) ===
    selectedValue
  );
}

function formatAnswer(answer: any) {
  if (Array.isArray(answer)) {
    return answer
      .map((item) =>
        normalizeAnswer(item),
      )
      .join(", ");
  }

  return normalizeAnswer(answer);
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(
    secs,
  ).padStart(2, "0")}`;
}