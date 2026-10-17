import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type TestPdfInput = {
  testName: string;
  examType?: string | null;
  subject?: string | null;
  studentName?: string | null;
  attemptedAt?: string | null;
  stats: { score: string; accuracy: string; correct: string; wrong: string; skipped: string; percentile?: string | null };
  items: Array<{
    pos: number;
    status: "correct" | "wrong" | "skipped";
    chapter?: string | null;
    questionText: string;
    numeric: boolean;
    yourAnswer?: string | null;
    correctAnswer?: string | null;
    options?: Array<{ label: string; text: string; correct: boolean; chosen: boolean }>;
    explanation?: string | null;
  }>;
  includeExplanations?: boolean;
};

const NAVY = rgb(0.067, 0.114, 0.247);
const INK = rgb(0.12, 0.15, 0.2);
const MUTED = rgb(0.42, 0.46, 0.53);
const BLUE = rgb(0.16, 0.42, 0.86);
const GREEN = rgb(0.11, 0.5, 0.25);
const RED = rgb(0.72, 0.15, 0.15);
const LINE = rgb(0.85, 0.88, 0.92);
const WASH = rgb(0.94, 0.965, 1);

const SITE = "jeeprephub.co.in";
const BRAND = "PREPWIAN";

/** Strip LaTeX-ish markup so text stays readable with standard PDF fonts. */
function clean(input: string | null | undefined): string {
  if (!input) return "";
  return String(input)
    .replace(/\$\$?/g, "")
    .replace(/\\(frac|dfrac)\{([^{}]*)\}\{([^{}]*)\}/g, "($2)/($3)")
    .replace(/\\(sqrt)\{([^{}]*)\}/g, "sqrt($2)")
    .replace(/\\(text|mathrm|mathbf|mathit)\{([^{}]*)\}/g, "$2")
    .replace(/\\left|\\right/g, "")
    .replace(/\^\{([^{}]*)\}/g, "^$1")
    .replace(/_\{([^{}]*)\}/g, "_$1")
    .replace(/\\[a-zA-Z]+/g, (m) => m.slice(1))
    .replace(/[{}]/g, "")
    // standard fonts are WinAnsi-only
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
      else {
        if (line) out.push(line);
        line = word;
        while (font.widthOfTextAtSize(line, size) > maxWidth && line.length > 1) {
          let cut = line.length;
          while (cut > 1 && font.widthOfTextAtSize(line.slice(0, cut), size) > maxWidth) cut--;
          out.push(line.slice(0, cut));
          line = line.slice(cut);
        }
      }
    }
    out.push(line);
  }
  return out.length ? out : [""];
}

export async function generateTestReportPdf(input: TestPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${input.testName} — Result Report`);
  doc.setAuthor(BRAND);
  doc.setCreator(BRAND);
  doc.setProducer(`${BRAND} (${SITE})`);

  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const W = 595.28;
  const H = 841.89;
  const M = 46;
  const CW = W - M * 2;
  const FOOT = 54;

  const pages: PDFPage[] = [];
  let page = doc.addPage([W, H]);
  pages.push(page);
  let y = H;

  const brandBar = (p: PDFPage) => {
    p.drawRectangle({ x: 0, y: H - 74, width: W, height: 74, color: NAVY });
    p.drawRectangle({ x: 0, y: H - 78, width: W, height: 4, color: BLUE });
    p.drawCircle({ x: M + 13, y: H - 37, size: 13, color: BLUE });
    p.drawText("J", { x: M + 8, y: H - 42, size: 15, font: bold, color: rgb(1, 1, 1) });
    p.drawText(BRAND, { x: M + 34, y: H - 34, size: 14, font: bold, color: rgb(1, 1, 1) });
    p.drawText(`Test Series Report  ·  ${SITE}`, {
      x: M + 34, y: H - 50, size: 8.5, font: sans, color: rgb(0.72, 0.79, 0.92),
    });
  };

  const newPage = () => {
    page = doc.addPage([W, H]);
    pages.push(page);
    brandBar(page);
    y = H - 100;
  };

  const need = (h: number) => {
    if (y - h < FOOT) newPage();
  };

  const text = (
    s: string,
    opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; x?: number; width?: number; gap?: number } = {},
  ) => {
    const size = opts.size ?? 10;
    const font = opts.font ?? sans;
    const x = opts.x ?? M;
    const width = opts.width ?? CW - (x - M);
    const lines = wrap(clean(s), font, size, width);
    for (const ln of lines) {
      need(size + 4);
      page.drawText(ln, { x, y: y - size, size, font, color: opts.color ?? INK });
      y -= size + 3.5;
    }
    y -= opts.gap ?? 0;
  };

  brandBar(page);
  y = H - 100;

  // Title block
  text(input.testName, { size: 18, font: bold, color: NAVY });
  y -= 2;
  const metaBits = [
    input.examType ? input.examType.replace(/_/g, " ").toUpperCase() : null,
    input.subject ? input.subject.toUpperCase() : null,
    input.studentName ? `Student: ${input.studentName}` : null,
    input.attemptedAt ? new Date(input.attemptedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : null,
  ].filter(Boolean).join("   |   ");
  text(metaBits, { size: 9, color: MUTED, gap: 8 });

  // Score strip
  const cells: Array<[string, string, ReturnType<typeof rgb>]> = [
    ["Score", input.stats.score, NAVY],
    ["Accuracy", input.stats.accuracy, NAVY],
    ["Correct", input.stats.correct, GREEN],
    ["Wrong", input.stats.wrong, RED],
    ["Skipped", input.stats.skipped, MUTED],
  ];
  need(70);
  const cellW = CW / cells.length;
  const boxTop = y;
  page.drawRectangle({ x: M, y: boxTop - 54, width: CW, height: 54, color: WASH, borderColor: LINE, borderWidth: 1 });
  cells.forEach(([label, value, color], i) => {
    const cx = M + i * cellW + 10;
    page.drawText(label.toUpperCase(), { x: cx, y: boxTop - 20, size: 7.5, font: bold, color: MUTED });
    const v = value.length > 14 ? value.slice(0, 14) : value;
    page.drawText(v, { x: cx, y: boxTop - 41, size: 12, font: bold, color });
    if (i > 0) page.drawLine({ start: { x: M + i * cellW, y: boxTop - 54 }, end: { x: M + i * cellW, y: boxTop }, color: LINE, thickness: 1 });
  });
  y = boxTop - 54 - 14;

  if (input.stats.percentile) {
    text(`Percentile: ${input.stats.percentile}`, { size: 10, font: bold, color: NAVY, gap: 6 });
  }

  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, color: LINE, thickness: 1 });
  y -= 16;
  text("Question-wise Review", { size: 13, font: bold, color: NAVY, gap: 6 });

  for (const it of input.items) {
    need(70);
    const badge = it.status === "correct" ? "CORRECT" : it.status === "wrong" ? "WRONG" : "SKIPPED";
    const badgeColor = it.status === "correct" ? GREEN : it.status === "wrong" ? RED : MUTED;

    const headTop = y;
    page.drawRectangle({ x: M, y: headTop - 18, width: CW, height: 18, color: rgb(0.965, 0.976, 0.99) });
    page.drawText(`Q${it.pos}`, { x: M + 8, y: headTop - 13, size: 9.5, font: bold, color: NAVY });
    page.drawText(badge, { x: M + 40, y: headTop - 13, size: 8, font: bold, color: badgeColor });
    if (it.chapter) {
      const ch = clean(it.chapter).slice(0, 60);
      page.drawText(ch, { x: M + 100, y: headTop - 13, size: 8, font: sans, color: MUTED });
    }
    y = headTop - 18 - 8;

    text(it.questionText, { size: 10, gap: 4 });

    if (it.numeric) {
      text(`Your answer: ${it.yourAnswer ?? "not attempted"}`, { size: 9.5, x: M + 10, color: it.status === "correct" ? GREEN : it.status === "skipped" ? MUTED : RED });
      text(`Correct answer: ${it.correctAnswer ?? "—"}`, { size: 9.5, x: M + 10, color: GREEN, gap: 4 });
    } else {
      for (const o of it.options ?? []) {
        const mark = o.correct ? "[correct]" : o.chosen ? "[your choice]" : "";
        const color = o.correct ? GREEN : o.chosen ? RED : INK;
        text(`(${o.label}) ${clean(o.text)} ${mark}`, { size: 9.5, x: M + 10, color });
      }
      y -= 4;
    }

    if (input.includeExplanations && it.explanation) {
      text(`Explanation: ${it.explanation}`, { size: 9, x: M + 10, font: oblique, color: MUTED, gap: 4 });
    }

    need(10);
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, color: LINE, thickness: 0.6 });
    y -= 12;
  }

  // Footers
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 40 }, end: { x: W - M, y: 40 }, color: LINE, thickness: 1 });
    p.drawText(`${BRAND} · ${SITE}`, { x: M, y: 27, size: 8, font: bold, color: NAVY });
    p.drawText("Practice smarter for JEE Main & Advanced", { x: M, y: 17, size: 7.5, font: sans, color: MUTED });
    const label = `Page ${i + 1} of ${pages.length}`;
    p.drawText(label, { x: W - M - bold.widthOfTextAtSize(label, 8), y: 27, size: 8, font: bold, color: MUTED });
  });

  return doc.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
