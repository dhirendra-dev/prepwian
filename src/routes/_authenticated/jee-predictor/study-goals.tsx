import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Plus, RefreshCw, Target, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type Goal = {
  id: string;
  title: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  deadline: string | null;
  status: string;
  notes: string | null;
};

export default function StudyGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("10");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error: e } = await (supabase as any).rpc("get_jee_study_goals", { _status: null });
    if (e) setError(e.message);
    else setGoals((data?.goals ?? []) as Goal[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const active = goals.filter(g => g.status === "ACTIVE");
  const completed = goals.filter(g => g.status === "COMPLETED");

  const overall = useMemo(() => {
    if (!active.length) return 0;
    return Math.round(active.reduce((sum, g) =>
      sum + Math.min(100, (g.current_value / Math.max(1, g.target_value)) * 100), 0) / active.length);
  }, [active]);

  const addGoal = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    const { error: e } = await (supabase as any).rpc("add_jee_study_goal", {
      _title: title.trim(),
      _goal_type: "GENERAL",
      _target_value: Math.max(1, Number(target) || 1),
      _deadline: null,
      _notes: null,
    });
    if (e) setError(e.message);
    else {
      setTitle("");
      setTarget("10");
      await load();
    }
    setSaving(false);
  };

  const increment = async (goal: Goal) => {
    const next = Math.min(goal.target_value, goal.current_value + 1);
    const { error: e } = await (supabase as any).rpc("update_jee_study_goal", {
      _goal_id: goal.id,
      _current_value: next,
      _status: null,
      _title: null,
      _target_value: null,
      _deadline: null,
      _notes: null,
    });
    if (e) setError(e.message);
    else await load();
  };

  const remove = async (id: string) => {
    const { error: e } = await (supabase as any).rpc("delete_jee_study_goal", { _goal_id: id });
    if (e) setError(e.message);
    else await load();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/jee-predictor"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                <h1 className="text-2xl font-bold">Study Goals</h1>
              </div>
              <p className="text-sm text-muted-foreground">Set measurable targets and track them as you study.</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {error && <Card><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Active goals</p><p className="text-2xl font-bold">{active.length}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold">{completed.length}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Average progress</p><p className="text-2xl font-bold">{overall}%</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Create a study goal</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Complete 10 mock tests" />
            <Input className="sm:w-32" type="number" min="1" value={target} onChange={e => setTarget(e.target.value)} />
            <Button onClick={() => void addGoal()} disabled={saving || !title.trim()}>
              <Plus className="mr-2 h-4 w-4" /> Add Goal
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {goals.map(goal => {
            const progress = Math.min(100, (goal.current_value / Math.max(1, goal.target_value)) * 100);
            return (
              <Card key={goal.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{goal.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {goal.current_value} / {goal.target_value} completed
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={goal.status === "COMPLETED" ? "default" : "secondary"}>{goal.status}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => void remove(goal.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={progress} />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                    {goal.status !== "COMPLETED" && (
                      <Button size="sm" onClick={() => void increment(goal)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Mark +1
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!loading && goals.length === 0 && (
            <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">
              No study goals yet. Create your first measurable target above.
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
