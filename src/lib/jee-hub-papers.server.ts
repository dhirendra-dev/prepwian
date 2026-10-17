import paper1s1 from "@/data/jee-hub/1s1.json";
import paper1s2 from "@/data/jee-hub/1s2.json";
import paper27s1 from "@/data/jee-hub/27s1.json";
import paper27s2 from "@/data/jee-hub/27s2.json";
import paper29s1 from "@/data/jee-hub/29s1.json";
import paper29s2 from "@/data/jee-hub/29s2.json";
import paper30s1 from "@/data/jee-hub/30s1.json";
import paper30s2 from "@/data/jee-hub/30s2.json";
import paper31s1 from "@/data/jee-hub/31s1.json";
import paper31s2 from "@/data/jee-hub/31s2.json";
import paperAdvanced2023 from "@/data/jee-hub/jee-advance-2023.json";
import paperBitsat2022 from "@/data/jee-hub/bitsat-2022.json";
import paperComedk2023 from "@/data/jee-hub/comedk-2023.json";
import paperMhtCet2023 from "@/data/jee-hub/mht-cet-2023.json";
import paperNeet2023 from "@/data/jee-hub/neet-2023.json";

type RawQuestion = {
  qid: string;
  question_number: number;
  question_value?: { text?: string | null; img_url?: string | null } | string | null;
  options?: Record<string, string | { text?: string | null; img_url?: string | null } | null>;
  type?: string | null;
  correct_answer?: number | string | null;
};

type PaperDefinition = {
  id: string;
  title: string;
  exam: string;
  year: number;
  shift?: string;
  durationMinutes: number;
  isPartial: boolean;
  sourceFile: string;
  questions: RawQuestion[];
};

const papers: PaperDefinition[] = [
  {
    id: "jee-main-2024-jan-27-shift-1",
    title: "JEE Main 2024 · 27 January · Shift 1",
    exam: "JEE Main",
    year: 2024,
    shift: "27 January · Shift 1",
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "27s1.json",
    questions: paper27s1 as RawQuestion[],
  },
  {
    id: "jee-main-2024-jan-27-shift-2",
    title: "JEE Main 2024 · 27 January · Shift 2",
    exam: "JEE Main",
    year: 2024,
    shift: "27 January · Shift 2",
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "27s2.json",
    questions: paper27s2 as RawQuestion[],
  },
  {
    id: "jee-main-2024-jan-29-shift-1",
    title: "JEE Main 2024 · 29 January · Shift 1",
    exam: "JEE Main",
    year: 2024,
    shift: "29 January · Shift 1",
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "29s1.json",
    questions: paper29s1 as RawQuestion[],
  },
  {
    id: "jee-main-2024-jan-29-shift-2",
    title: "JEE Main 2024 · 29 January · Shift 2",
    exam: "JEE Main",
    year: 2024,
    shift: "29 January · Shift 2",
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "29s2.json",
    questions: paper29s2 as RawQuestion[],
  },
  {
    id: "jee-main-2024-jan-30-shift-1",
    title: "JEE Main 2024 · 30 January · Shift 1",
    exam: "JEE Main",
    year: 2024,
    shift: "30 January · Shift 1",
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "30s1.json",
    questions: paper30s1 as RawQuestion[],
  },
  {
    id: "jee-main-2024-jan-30-shift-2",
    title: "JEE Main 2024 · 30 January · Shift 2",
    exam: "JEE Main",
    year: 2024,
    shift: "30 January · Shift 2",
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "30s2.json",
    questions: paper30s2 as RawQuestion[],
  },
  {
    id: "jee-main-2024-jan-31-shift-1",
    title: "JEE Main 2024 · 31 January · Shift 1",
    exam: "JEE Main",
    year: 2024,
    shift: "31 January · Shift 1",
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "31s1.json",
    questions: paper31s1 as RawQuestion[],
  },
  {
    id: "jee-main-2024-jan-31-shift-2",
    title: "JEE Main 2024 · 31 January · Shift 2",
    exam: "JEE Main",
    year: 2024,
    shift: "31 January · Shift 2",
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "31s2.json",
    questions: paper31s2 as RawQuestion[],
  },
  {
    id: "jee-main-2024-feb-01-shift-1",
    title: "JEE Main 2024 · 1 February · Shift 1",
    exam: "JEE Main",
    year: 2024,
    shift: "1 February · Shift 1",
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "1s1.json",
    questions: paper1s1 as RawQuestion[],
  },
  {
    id: "jee-main-2024-feb-01-shift-2",
    title: "JEE Main 2024 · 1 February · Shift 2",
    exam: "JEE Main",
    year: 2024,
    shift: "1 February · Shift 2",
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "1s2.json",
    questions: paper1s2 as RawQuestion[],
  },
  {
    id: "jee-advanced-2023-selected",
    title: "JEE Advanced 2023 · Selected Questions",
    exam: "JEE Advanced",
    year: 2023,
    durationMinutes: 90,
    isPartial: true,
    sourceFile: "jee-advance-2023.json",
    questions: paperAdvanced2023 as RawQuestion[],
  },
  {
    id: "bitsat-2022",
    title: "BITSAT 2022",
    exam: "BITSAT",
    year: 2022,
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "bitsat-2022.json",
    questions: paperBitsat2022 as RawQuestion[],
  },
  {
    id: "neet-2022-may-7",
    title: "NEET 2022 · 7 May",
    exam: "NEET",
    year: 2022,
    durationMinutes: 200,
    isPartial: true,
    sourceFile: "neet-2023.json",
    questions: paperNeet2023 as RawQuestion[],
  },
  {
    id: "comedk-2023",
    title: "COMEDK 2023",
    exam: "COMEDK",
    year: 2023,
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "comedk-2023.json",
    questions: paperComedk2023 as RawQuestion[],
  },
  {
    id: "mht-cet-2023",
    title: "MHT-CET 2023",
    exam: "MHT-CET",
    year: 2023,
    durationMinutes: 180,
    isPartial: true,
    sourceFile: "mht-cet-2023.json",
    questions: paperMhtCet2023 as RawQuestion[],
  },
];

function findPaper(id: string): PaperDefinition {
  const paper = papers.find((item) => item.id === id);
  if (!paper) throw new Error("Paper not found");
  return paper;
}

function readQuestionValue(value: RawQuestion["question_value"]) {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : { text: value };
    } catch {
      return { text: value };
    }
  }
  return value && typeof value === "object" ? value : {};
}

function optionRows(question: RawQuestion) {
  return Object.entries(question.options ?? {}).map(([label, option]) => {
    const value = typeof option === "string" ? { text: option } : (option ?? {});
    return {
      label,
      text: value.text ?? "",
      imageUrl: value.img_url ?? null,
    };
  });
}

export function listJeeHubPapers() {
  return papers.map(
    ({ id, title, exam, year, shift, durationMinutes, isPartial, sourceFile, questions }) => ({
      id,
      title,
      exam,
      year,
      shift: shift ?? null,
      durationMinutes,
      isPartial,
      sourceFile,
      questionCount: questions.length,
    }),
  );
}

export function getJeeHubPaper(id: string) {
  const paper = findPaper(id);
  return {
    id: paper.id,
    title: paper.title,
    exam: paper.exam,
    year: paper.year,
    durationMinutes: paper.durationMinutes,
    isPartial: paper.isPartial,
    questions: paper.questions.map((question) => {
      const value = readQuestionValue(question.question_value);
      const options = optionRows(question);
      const isNumerical = question.type === "numerical" || options.length === 0;
      return {
        id: question.qid,
        questionNumber: question.question_number,
        type: isNumerical ? "numerical" : "single",
        text: value.text ?? "",
        imageUrl: value.img_url ?? null,
        options: isNumerical ? [] : options,
      };
    }),
  };
}

export function gradeJeeHubPaper(id: string, answers: Record<string, string>) {
  const paper = findPaper(id);
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  const details = paper.questions.map((question) => {
    const rawAnswer = answers[question.qid]?.trim() ?? "";
    const options = optionRows(question);
    const isNumerical = question.type === "numerical" || options.length === 0;
    const answerValue = question.correct_answer;
    let correctAnswer: string | null = null;
    let isCorrect = false;
    if (isNumerical) {
      correctAnswer = answerValue == null ? null : String(answerValue);
      const submitted = rawAnswer === "" ? Number.NaN : Number(rawAnswer);
      const target = answerValue == null ? Number.NaN : Number(answerValue);
      isCorrect =
        Number.isFinite(submitted) &&
        Number.isFinite(target) &&
        Math.abs(submitted - target) <= 1e-3;
    } else {
      const correctIndex = Number(answerValue);
      correctAnswer = Number.isInteger(correctIndex)
        ? (options[correctIndex]?.label ?? null)
        : null;
      isCorrect = rawAnswer !== "" && correctAnswer !== null && rawAnswer === correctAnswer;
    }
    if (!rawAnswer) unanswered++;
    else if (isCorrect) correct++;
    else incorrect++;
    return {
      questionId: question.qid,
      isCorrect,
      correctAnswer,
      type: isNumerical ? "numerical" : "single",
    };
  });
  return {
    paperId: paper.id,
    total: paper.questions.length,
    correct,
    incorrect,
    unanswered,
    accuracy: paper.questions.length ? Math.round((correct / paper.questions.length) * 100) : 0,
    details,
  };
}
