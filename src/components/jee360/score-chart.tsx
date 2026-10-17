import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { scoredTests } from "@/lib/jee360/rank";
import type { TestItem } from "@/lib/jee360/types";

export function ScoreChart({ tests }: { tests: TestItem[] }) {
  const data = scoredTests(tests).map((t) => ({
    date: t.date.slice(5),
    score: t.score ?? 0,
    name: t.title,
  }));
  if (data.length < 2) return null;

  return (
    <div className="h-44 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--foreground)",
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
