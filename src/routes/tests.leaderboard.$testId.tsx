import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTestLeaderboard } from "@/lib/tests.functions";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Loader2 } from "lucide-react";

export const Route = createFileRoute("/tests/leaderboard/$testId")({
  head: () => ({ meta: [
      { name: "description", content: "Compare scores, accuracy and standings for this CBT test." },
      { property: "og:title", content: "Test Leaderboard | PREPWIAN" },
      { property: "og:description", content: "Compare scores, accuracy and standings for this CBT test." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Test Leaderboard | PREPWIAN" },
      { name: "twitter:description", content: "Compare scores, accuracy and standings for this CBT test." },
{ title: "Test Leaderboard | PREPWIAN" }] }),
  component: LB,
});

function LB() {
  const { testId } = Route.useParams();
  const fn = useServerFn(getTestLeaderboard);
  const { data, isLoading } = useQuery({ queryKey: ["test-lb", testId], queryFn: () => fn({ data: { testId } }) });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /><h1 className="text-xl font-bold">Test Leaderboard</h1></div>
          <Link to="/tests/$testId" params={{ testId }} className="text-xs text-muted-foreground hover:underline">← Back</Link>
        </div>
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Top scorers</CardTitle><p className="text-xs text-muted-foreground">{(data as any)?.attemptCount ?? 0} student{((data as any)?.attemptCount ?? 0) === 1 ? "" : "s"} attempted · 4 marks per correct answer</p></CardHeader>
            <CardContent className="p-0">
              {((data as any)?.top ?? []).length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No submissions yet.</div>
              ) : (
                <ul className="divide-y">
                  {(data as any).top.map((row: any, i: number) => (
                    <li key={row.id} className="flex items-center gap-3 p-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white dark:bg-slate-600" : i === 2 ? "bg-orange-400 text-white" : "bg-muted"}`}>{i + 1}</div>
                      <Avatar className="h-9 w-9"><AvatarImage src={row.profiles?.avatar_url ?? undefined} /><AvatarFallback>{(row.profiles?.full_name ?? "U").charAt(0)}</AvatarFallback></Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{row.profiles?.full_name ?? row.profiles?.username ?? "User"}</div>
                        <div className="text-[11px] text-muted-foreground">Accuracy {Number(row.accuracy).toFixed(1)}% · {Math.floor((row.duration_sec ?? 0) / 60)}m</div>
                      </div>
                      <div className="text-right text-sm font-bold">{Number(row.score).toFixed(1)}</div>
                    </li>
                  ))}
                </ul>
              )}
              {(data as any)?.myRank && <div className="border-t p-3 text-xs text-muted-foreground">Your rank: <b>#{(data as any).myRank}</b></div>}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
