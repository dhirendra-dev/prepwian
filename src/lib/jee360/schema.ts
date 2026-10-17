import { z } from "zod";

export const lectureInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  subject: z.enum(["physics", "chemistry", "maths"]),
  chapter: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be HH:mm").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "endTime must be HH:mm").optional(),
  durationMinutes: z.number().int().positive().optional(),
  faculty: z.string().optional(),
  type: z.enum(["lecture", "revision", "doubt", "dpp", "lab"]).optional(),
  notes: z.string().optional(),
});

export const testInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  subject: z.enum(["physics", "chemistry", "maths", "full"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be HH:mm").optional(),
  durationMinutes: z.number().int().positive().optional(),
  syllabus: z.array(z.string()).optional(),
  type: z.enum(["chapter", "part", "full", "mock", "pyq"]).optional(),
  maxScore: z.number().int().positive().optional(),
});

export const plannerFileSchema = z.object({
  name: z.string().min(1),
  source: z.string().optional(),
  batch: z.string().optional(),
  timezone: z.string().optional(),
  lectures: z.array(lectureInputSchema).min(1, "at least one lecture is required"),
  tests: z.array(testInputSchema).optional(),
});

export type PlannerFile = z.infer<typeof plannerFileSchema>;

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = Math.floor(wrapped / 60).toString().padStart(2, "0");
  const mm = (wrapped % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function parsePlannerJson(raw: unknown): PlannerFile {
  return plannerFileSchema.parse(raw);
}
