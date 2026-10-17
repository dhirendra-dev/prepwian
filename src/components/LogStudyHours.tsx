import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, CalendarDays, Loader2, Check } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Subject = "physics" | "chemistry" | "mathematics";

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function LogStudyHours() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [subject, setSubject] = useState<Subject>("physics");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [optimisticToday, setOptimisticToday] = useState<number | null>(null);

  const today = useQuery({
    queryKey: ["today-study-total", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const { data, error } = await supabase
        .from("study_sessions")
        .select("duration_seconds")
        .eq("user_id", user!.id)
        .gte("ended_at", start.toISOString())
        .lt("ended_at", end.toISOString());
      if (error) throw error;
      return (data ?? []).reduce((a, r) => a + (r.duration_seconds ?? 0), 0);
    },
  });

  const h = Number(hours) || 0;
  const m = Number(minutes) || 0;
  const totalSeconds = h * 3600 + m * 60;
  const isToday = date === todayISO();
  const canSubmit = totalSeconds >= 60 && totalSeconds <= 24 * 3600 && !!user;

  const log = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in first");
      if (totalSeconds < 60) throw new Error("Enter at least 1 minute");
      if (totalSeconds > 24 * 3600) throw new Error("Max 24 hours per entry");
      const ended = new Date(`${date}T12:00:00`);
      if (ended > new Date()) throw new Error("Date can't be in the future");
      const { error } = await supabase.from("study_sessions").insert({
        user_id: user.id,
        duration_seconds: totalSeconds,
        session_type: "manual",
        subject,
        note: note.trim() || null,
        ended_at: ended.toISOString(),
      });
      if (error) throw error;
    },
    onMutate: () => {
      // Optimistic today total bump
      if (isToday) {
        setOptimisticToday((today.data ?? 0) + totalSeconds);
      }
      haptic("light");
    },
    onSuccess: () => {
      haptic("success");
      toast.success(`Logged ${h ? `${h}h ` : ""}${m ? `${m}m` : ""}`.trim() || "Study time logged");
      setHours("");
      setMinutes("");
      setNote("");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
      qc.invalidateQueries({ queryKey: ["today-study-total"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["session-stats"] });
      qc.invalidateQueries({ queryKey: ["recent-sessions"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["leaderboard-all"] });
    },
    onError: (e: Error) => {
      haptic("error");
      setOptimisticToday(null);
      toast.error(e.message);
    },
    onSettled: () => {
      // Clear optimistic once real data refetches
      setTimeout(() => setOptimisticToday(null), 800);
    },
  });

  const totalToday = optimisticToday ?? today.data ?? 0;
  const th = Math.floor(totalToday / 3600);
  const tm = Math.floor((totalToday % 3600) / 60);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">Log study hours</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Add time studied outside the focus timer.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Today</div>
          <div className="font-display text-sm font-bold tabular-nums">
            {th}h {tm}m
          </div>
        </div>
      </div>

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          log.mutate();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="log-hours" className="text-xs">Hours</Label>
            <Input
              id="log-hours"
              type="number"
              min="0"
              max="24"
              step="1"
              inputMode="numeric"
              placeholder="2"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="log-minutes" className="text-xs">Minutes</Label>
            <Input
              id="log-minutes"
              type="number"
              min="0"
              max="59"
              step="5"
              inputMode="numeric"
              placeholder="30"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Subject</Label>
            <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="mathematics">Mathematics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="log-date" className="text-xs flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> Date
            </Label>
            <Input
              id="log-date"
              type="date"
              max={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="log-note" className="text-xs">Note (optional)</Label>
          <Textarea
            id="log-note"
            rows={2}
            maxLength={200}
            placeholder="What did you cover?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className={`w-full transition-colors ${justSaved ? "!bg-green-600 hover:!bg-green-600" : ""}`}
          disabled={log.isPending || !canSubmit}
        >
          {log.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          ) : justSaved ? (
            <><Check className="h-4 w-4" /> Logged!</>
          ) : (
            <><Plus className="h-4 w-4" /> {totalSeconds >= 60 ? `Add ${h ? `${h}h ` : ""}${m ? `${m}m` : ""}`.trim() : "Add to today"}</>
          )}
        </Button>
        {!canSubmit && (hours || minutes) && (
          <p className="text-[11px] text-muted-foreground text-center">Enter at least 1 minute to save.</p>
        )}
      </form>
    </section>
  );
}
