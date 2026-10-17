import { parsePlannerJson, type PlannerFile } from "@/lib/jee360/schema";

type ZodLike = { issues: { path: (string | number)[]; message: string }[] };

function isZodError(err: unknown): err is ZodLike {
  return !!err && typeof err === "object" && "issues" in err && Array.isArray((err as { issues?: unknown }).issues);
}

export function extractJsonText(raw: string): string {
  let text = raw.replace(/^\uFEFF/, "").trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found. Copy ChatGPT’s reply (fences are fine) and paste it here.");
  }
  return text.slice(start, end + 1);
}

export function formatImportError(err: unknown): string {
  if (isZodError(err)) {
    const lines = err.issues.slice(0, 6).map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    });
    const extra = err.issues.length > 6 ? `\n…${err.issues.length - 6} more` : "";
    return `JSON did not match the JEE 360 schema.\n${lines.join("\n")}${extra}`;
  }
  if (err instanceof SyntaxError) {
    return "That is not valid JSON. Remove commentary and keep a single object.";
  }
  if (err instanceof Error) return err.message;
  return "Could not read that planner.";
}

export function ingestPlannerText(raw: string): PlannerFile {
  return parsePlannerJson(JSON.parse(extractJsonText(raw)) as unknown);
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
