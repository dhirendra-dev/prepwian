import { useEffect, useState } from "react";
import { BookmarkPlus, BookmarkX, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type SavedView<T> = { id: string; name: string; filters: T };

export function AdminSavedViews<T extends Record<string, string>>({
  storageKey,
  filters,
  onApply,
}: {
  storageKey: string;
  filters: T;
  onApply: (filters: T) => void;
}) {
  const [views, setViews] = useState<SavedView<T>[]>([]);
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`jph-admin-saved-views:${storageKey}`);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setViews(
          parsed.filter(
            (view) =>
              view &&
              typeof view.id === "string" &&
              typeof view.name === "string" &&
              view.filters &&
              typeof view.filters === "object" &&
              !Array.isArray(view.filters),
          ) as SavedView<T>[],
        );
      }
    } catch {
      setViews([]);
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(`jph-admin-saved-views:${storageKey}`, JSON.stringify(views));
    } catch {
      // Saved views are a convenience; quota/private-mode failures should not block admin work.
    }
  }, [ready, storageKey, views]);

  const save = () => {
    const cleanName = name.trim().slice(0, 48);
    if (!cleanName) return;
    const view = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: cleanName,
      filters: { ...filters },
    };
    setViews((current) => [
      ...current.filter((item) => item.name.toLowerCase() !== cleanName.toLowerCase()),
      view,
    ]);
    setSelectedId(view.id);
    setName("");
  };

  const apply = (id: string) => {
    setSelectedId(id);
    const view = views.find((item) => item.id === id);
    if (view) onApply({ ...view.filters });
  };

  const remove = () => {
    if (!selectedId) return;
    setViews((current) => current.filter((item) => item.id !== selectedId));
    setSelectedId("");
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/65 p-2.5">
      <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <BookmarkPlus className="h-3.5 w-3.5" /> Saved views
      </span>
      <select
        aria-label="Apply saved admin view"
        value={selectedId}
        onChange={(event) => apply(event.target.value)}
        className="h-9 min-w-0 max-w-full flex-1 rounded-lg border border-input bg-background px-2 text-xs sm:max-w-56"
      >
        <option value="">Choose a saved view…</option>
        {views.map((view) => (
          <option key={view.id} value={view.id}>
            {view.name}
          </option>
        ))}
      </select>
      <input
        aria-label="Name for saved view"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") save();
        }}
        maxLength={48}
        placeholder="Name this view"
        className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-xs sm:max-w-44"
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!name.trim()}
        onClick={save}
        className="h-9"
      >
        <Save className="h-3.5 w-3.5" /> Save
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={!selectedId}
        onClick={remove}
        aria-label="Delete selected saved view"
        title="Delete selected view"
        className="h-9 w-9"
      >
        <BookmarkX className="h-4 w-4" />
      </Button>
    </div>
  );
}
