import type { TestItem } from "@/lib/jee360/types";

/** Piecewise JEE Main percentile curve — an estimate, not NTA data. */
const CURVE: [number, number][] = [
  [0, 0.5],
  [40, 18],
  [60, 38],
  [80, 54],
  [100, 70],
  [120, 81],
  [140, 88],
  [160, 92.4],
  [180, 95.2],
  [200, 97.4],
  [220, 98.7],
  [240, 99.35],
  [260, 99.72],
  [280, 99.91],
  [300, 99.995],
];

const CANDIDATES = 1_200_000;

export function percentileFromScore(score: number, maxScore = 300): number {
  const scaled = Math.max(0, Math.min(300, (score / Math.max(1, maxScore)) * 300));
  for (let i = 1; i < CURVE.length; i++) {
    const [x0, y0] = CURVE[i - 1];
    const [x1, y1] = CURVE[i];
    if (scaled <= x1) {
      const t = (scaled - x0) / (x1 - x0 || 1);
      return y0 + t * (y1 - y0);
    }
  }
  return 99.995;
}

export function rankFromPercentile(percentile: number): number {
  const rank = Math.round(((100 - percentile) / 100) * CANDIDATES);
  return Math.max(1, rank);
}

export function bandFromPercentile(percentile: number): string {
  if (percentile >= 99.5) return "Top 0.5%";
  if (percentile >= 99) return "Top 1%";
  if (percentile >= 97) return "Top 3%";
  if (percentile >= 95) return "Top 5%";
  if (percentile >= 90) return "Top 10%";
  if (percentile >= 80) return "Top 20%";
  if (percentile >= 60) return "Top 40%";
  return "Building";
}

export function scoredTests(tests: TestItem[]): TestItem[] {
  return tests
    .filter((t) => t.status === "completed" && typeof t.score === "number")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function currentProjection(tests: TestItem[]) {
  const scored = scoredTests(tests);
  if (scored.length === 0) {
    return { score: 0, maxScore: 300, percentile: 0, rank: CANDIDATES, band: "No mocks yet", n: 0 };
  }
  const maxScore = scored[scored.length - 1]?.maxScore ?? 300;
  const recent = scored.slice(-3);
  const avg = recent.reduce((s, t) => s + (t.score ?? 0), 0) / recent.length;
  const percentile = percentileFromScore(avg, maxScore);
  return {
    score: Math.round(avg * 10) / 10,
    maxScore,
    percentile,
    rank: rankFromPercentile(percentile),
    band: bandFromPercentile(percentile),
    n: scored.length,
  };
}

export function whatIfProjection(tests: TestItem[], remainingAvg: number) {
  const current = currentProjection(tests);
  const mix = current.n === 0 ? remainingAvg : current.score * 0.6 + remainingAvg * 0.4;
  const percentile = percentileFromScore(mix, current.maxScore || 300);
  return {
    score: Math.round(mix * 10) / 10,
    percentile,
    rank: rankFromPercentile(percentile),
    band: bandFromPercentile(percentile),
    deltaRank: current.n === 0 ? 0 : current.rank - rankFromPercentile(percentile),
  };
}

export function formatRank(rank: number): string {
  return rank.toLocaleString("en-IN");
}

export function formatPercentile(p: number): string {
  return p >= 99 ? p.toFixed(2) : p.toFixed(1);
}
