// Trusted grading + image signing for the CBT engine. Server-only.

export type ImageRef = { path: string; size?: "sm" | "md" | "lg" | "full"; align?: "left" | "center" | "right"; caption?: string };
export const TEST_IMAGE_BUCKET = "test-images";

export const NUMERIC_TYPES = new Set(["integer", "numerical", "range"]);

export function gradeQuestion(q: any, r: any): { answered: boolean; awarded: number; isCorrect: boolean | null; partial: boolean } {
  const marks = Number(q.marks || 0);
  const neg = Number(q.negative_marks || 0);
  const unanswered = Number(q.unanswered_marks || 0);
  const numeric = NUMERIC_TYPES.has(q.question_type);
  const sel: string[] = r?.selected_option_ids ?? [];
  const ansRaw = r?.numerical_answer;
  const answered = !!r && (numeric ? ansRaw !== null && ansRaw !== undefined && Number.isFinite(Number(ansRaw)) : sel.length > 0);
  if (!answered) return { answered: false, awarded: unanswered, isCorrect: null, partial: false };

  if (numeric) {
    const ans = Number(ansRaw);
    let ok = false;
    if (q.question_type === "range") {
      const lo = Number(q.range_min), hi = Number(q.range_max);
      ok = Number.isFinite(lo) && Number.isFinite(hi) && ans >= Math.min(lo, hi) && ans <= Math.max(lo, hi);
    } else {
      const target = Number(q.correct_numerical);
      const tol = Number(q.numerical_tolerance || 0);
      ok = q.correct_numerical !== null && Number.isFinite(target) && Math.abs(ans - target) <= tol + 1e-9;
    }
    return { answered: true, awarded: ok ? marks : -neg, isCorrect: ok, partial: false };
  }

  const correctIds = new Set((q.test_options ?? []).filter((o: any) => o.is_correct).map((o: any) => o.id));
  const selSet = new Set(sel);
  const anyWrong = [...selSet].some((id) => !correctIds.has(id));
  const allRight = !anyWrong && selSet.size === correctIds.size && correctIds.size > 0;

  if (q.question_type === "single") {
    const ok = selSet.size === 1 && !anyWrong;
    return { answered: true, awarded: ok ? marks : -neg, isCorrect: ok, partial: false };
  }
  if (allRight) return { answered: true, awarded: marks, isCorrect: true, partial: false };
  if (anyWrong || correctIds.size === 0) return { answered: true, awarded: -neg, isCorrect: false, partial: false };
  // Only correct options chosen, but not all of them.
  const scheme = q.partial_marking ?? "none";
  if (scheme === "jee_advanced") return { answered: true, awarded: selSet.size, isCorrect: false, partial: true };
  if (scheme === "proportional") {
    const v = Math.round((marks * selSet.size / correctIds.size) * 100) / 100;
    return { answered: true, awarded: v, isCorrect: false, partial: true };
  }
  return { answered: true, awarded: -neg, isCorrect: false, partial: false };
}

/** Returns problems that block publishing. */
export function validateQuestion(q: any, opts: any[]): string[] {
  const p: string[] = [];
  if (!String(q.question_text ?? "").trim() && !(q.images?.length)) p.push("empty question");
  if (q.question_type === "single" || q.question_type === "multiple") {
    if (opts.length < 2) p.push("needs at least 2 options");
    const c = opts.filter((o) => o.is_correct).length;
    if (q.question_type === "single" && c !== 1) p.push("needs exactly 1 correct option");
    if (q.question_type === "multiple" && c < 1) p.push("needs at least 1 correct option");
    if (opts.some((o) => !String(o.text ?? "").trim() && !o.image_path)) p.push("an option is empty");
  } else if (q.question_type === "range") {
    if (q.range_min == null || q.range_max == null) p.push("needs answer range");
  } else if (q.correct_numerical == null) p.push("needs correct answer");
  return p;
}

export async function signPaths(admin: any, paths: string[]): Promise<Record<string, string>> {
  const uniq = [...new Set(paths.filter(Boolean))];
  if (!uniq.length) return {};
  const { data } = await admin.storage.from(TEST_IMAGE_BUCKET).createSignedUrls(uniq, 60 * 60 * 3);
  const out: Record<string, string> = {};
  for (const row of data ?? []) if (row?.path && row?.signedUrl) out[row.path] = row.signedUrl;
  return out;
}

export function collectPaths(questions: any[], options: any[], withSolutions: boolean): string[] {
  const paths: string[] = [];
  for (const q of questions) {
    for (const im of (q.images ?? []) as ImageRef[]) if (im?.path) paths.push(im.path);
    if (withSolutions) for (const im of (q.solution_images ?? []) as ImageRef[]) if (im?.path) paths.push(im.path);
  }
  for (const o of options) if (o.image_path) paths.push(o.image_path);
  return paths;
}
