import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Plus, Tag } from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { todayKey, uid, updateFocusZone, useFocusZone } from "@/lib/focus-zone";

export const Route = createFileRoute("/focus/create")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Create a todo — Focus Zone" },
      { name: "twitter:description", content: "Add a todo with deadline, estimated time, group and tags." },
      { title: "Create a todo — Focus Zone" },
      {
        name: "description",
        content: "Add a study todo with a deadline, time estimate, group and tags so Focus Zone can time your deep work.",
      },
      { property: "og:title", content: "Create a todo — Focus Zone" },
      { property: "og:description", content: "Add a todo with deadline, estimated time, group and tags." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateTodoPage,
});

const FIELD = "mt-1 w-full rounded-xl border border-border/70 bg-background/50 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function CreateTodoPage() {
  const { state } = useFocusZone();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState(todayKey());
  const [hours, setHours] = useState(0);
  const [mins, setMins] = useState(25);
  const [groupId, setGroupId] = useState("");
  const [tagText, setTagText] = useState("");
  const [strict, setStrict] = useState(false);

  const estimate = hours * 60 + mins;
  const valid = title.trim().length > 1 && estimate > 0;

  const submit = () => {
    if (!valid) return;
    updateFocusZone((s) => ({
      ...s,
      todos: [
        {
          id: uid(),
          title: title.trim(),
          groupId: groupId || null,
          tags: tagText
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
          estimateMin: estimate,
          deadline,
          status: "paused",
          spentSec: 0,
          strict,
          createdAt: Date.now(),
        },
        ...s.todos,
      ],
    }));
    void navigate({ to: "/focus/todos" });
  };

  return (
    <div className="mx-auto max-w-xl">
      <GlassSurface className="p-4 sm:p-6">
        <h1 className="font-display text-xl font-bold">Create Todo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything stays in this browser — no account needed.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="fz-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </label>
            <input
              id="fz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Revise rotational motion problems"
              className={FIELD}
            />
          </div>

          <div>
            <label htmlFor="fz-deadline" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Deadline
            </label>
            <input id="fz-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={FIELD} />
          </div>

          <div>
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Estimated time
            </span>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="text-muted-foreground">Hours</span>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, Number(e.target.value) || 0))}
                  className={FIELD}
                />
              </label>
              <label className="text-sm">
                <span className="text-muted-foreground">Minutes</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={mins}
                  onChange={(e) => setMins(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                  className={FIELD}
                />
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="fz-group" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Group (optional)
            </label>
            <select id="fz-group" value={groupId} onChange={(e) => setGroupId(e.target.value)} className={FIELD}>
              <option value="">No group</option>
              {(state?.groups ?? []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fz-tags" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3.5 w-3.5" /> Tags
            </label>
            <input id="fz-tags" value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="physics, revision" className={FIELD} />
          </div>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-3 text-sm">
            <span>
              <span className="font-semibold">Strict mode</span>
              <span className="block text-xs text-muted-foreground">Keep the distraction blocker on while this runs</span>
            </span>
            <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} className="h-5 w-5 accent-primary" />
          </label>

          <button
            onClick={submit}
            disabled={!valid}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform active:scale-95 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Create todo
          </button>
        </div>
      </GlassSurface>
    </div>
  );
}
