import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const paperIds = [
  "jee-main-2024-jan-27-shift-1",
  "jee-main-2024-jan-27-shift-2",
  "jee-main-2024-jan-29-shift-1",
  "jee-main-2024-jan-29-shift-2",
  "jee-main-2024-jan-30-shift-1",
  "jee-main-2024-jan-30-shift-2",
  "jee-main-2024-jan-31-shift-1",
  "jee-main-2024-jan-31-shift-2",
  "jee-main-2024-feb-01-shift-1",
  "jee-main-2024-feb-01-shift-2",
  "jee-advanced-2023-selected",
  "bitsat-2022",
  "neet-2022-may-7",
  "comedk-2023",
  "mht-cet-2023",
] as const;
const paperId = z.enum(paperIds);

export const listJeeHubPapers = createServerFn({ method: "GET" }).handler(async () => {
  const { listJeeHubPapers: list } = await import("./jee-hub-papers.server");
  return list();
});

export const getJeeHubPaper = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ paperId }).parse(input))
  .handler(async ({ data }) => {
    const { getJeeHubPaper: get } = await import("./jee-hub-papers.server");
    return get(data.paperId);
  });

export const gradeJeeHubPaper = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        paperId,
        answers: z.record(z.string(), z.string().max(100)).default({}),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { gradeJeeHubPaper: grade } = await import("./jee-hub-papers.server");
    return grade(data.paperId, data.answers);
  });
