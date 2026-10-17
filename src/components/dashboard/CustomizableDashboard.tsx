import { Children, isValidElement, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Check, ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Maximize2, Minimize2, Palette, Pencil, RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type WidgetSpan = "full" | "half";
type WidgetDefinition = { id: string; title: string; defaultSpan: WidgetSpan };
type WidgetLayoutItem = WidgetDefinition & { visible: boolean; span: WidgetSpan; tint: string | null; tintStrength: number };
type DashboardWidgetProps = WidgetDefinition & { children: ReactNode };

const DEFAULT_LAYOUT: WidgetLayoutItem[] = [
  { id: "overview", title: "Welcome & study progress", defaultSpan: "full", visible: true, span: "full", tint: null, tintStrength: 16 },
  { id: "community", title: "Community", defaultSpan: "full", visible: true, span: "full", tint: null, tintStrength: 16 },
  { id: "practice", title: "Practice arena", defaultSpan: "full", visible: true, span: "full", tint: null, tintStrength: 16 },
  { id: "countdown", title: "Exam countdown", defaultSpan: "full", visible: true, span: "full", tint: null, tintStrength: 16 },
  { id: "shortcuts", title: "Quick actions", defaultSpan: "full", visible: true, span: "full", tint: null, tintStrength: 16 },
  { id: "workspace-hub", title: "Study workspaces", defaultSpan: "full", visible: true, span: "full", tint: null, tintStrength: 16 },
  { id: "watching", title: "Continue watching", defaultSpan: "half", visible: true, span: "half", tint: null, tintStrength: 16 },
  { id: "tests", title: "Recent tests", defaultSpan: "half", visible: true, span: "half", tint: null, tintStrength: 16 },
  { id: "materials", title: "Latest materials", defaultSpan: "half", visible: true, span: "half", tint: null, tintStrength: 16 },
  { id: "checklist", title: "Daily checklist", defaultSpan: "full", visible: true, span: "full", tint: null, tintStrength: 16 },
  { id: "analytics", title: "Study analytics", defaultSpan: "half", visible: true, span: "half", tint: null, tintStrength: 16 },
  { id: "streaks", title: "Study streaks", defaultSpan: "half", visible: true, span: "half", tint: null, tintStrength: 16 },
  { id: "membership", title: "Membership & plan", defaultSpan: "half", visible: true, span: "half", tint: null, tintStrength: 16 },
  { id: "focus", title: "Focus & study tools", defaultSpan: "half", visible: true, span: "half", tint: null, tintStrength: 16 },
  { id: "messages", title: "Messages", defaultSpan: "half", visible: true, span: "half", tint: null, tintStrength: 16 },
  { id: "planner", title: "Study planner & insights", defaultSpan: "full", visible: true, span: "full", tint: null, tintStrength: 16 },
];

const storageKey = (userId: string) => `jph-dashboard-layout:v1:${userId}`;

/** Marker component: CustomizableDashboard consumes its metadata and renders its children in the saved order. */
export function DashboardWidget({ children }: DashboardWidgetProps) {
  return <>{children}</>;
}

function moveItem(items: WidgetLayoutItem[], fromId: string, toId: string, insertAfter: boolean) {
  const from = items.findIndex((item) => item.id === fromId);
  const target = items.findIndex((item) => item.id === toId);
  if (from < 0 || target < 0 || from === target) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  let insertion = target + (insertAfter ? 1 : 0);
  if (from < insertion) insertion -= 1;
  next.splice(Math.max(0, Math.min(insertion, next.length)), 0, item);
  return next;
}

export function CustomizableDashboard({ userId, children }: { userId: string; children: ReactNode }) {
  const definitions = useMemo(() => {
    const collect = (nodes: ReactNode): Array<WidgetDefinition & { content: ReactNode }> => Children.toArray(nodes).flatMap((child) => {
      if (!isValidElement(child)) return [];
      const props = child.props as DashboardWidgetProps & { children?: ReactNode };
      if (child.type === DashboardWidget) {
        return [{ id: props.id, title: props.title, defaultSpan: props.defaultSpan, content: props.children }];
      }
      return collect(props.children);
    });
    return collect(children);
  }, [children]);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const activeDrag = useRef<{ id: string; lastTarget: string | null } | null>(null);
  const ordered = useMemo(() => [...layout].sort((a, b) => {
    const ids = new Map(layout.map((item, index) => [item.id, index]));
    return (ids.get(a.id) ?? 0) - (ids.get(b.id) ?? 0);
  }), [layout]);

  useEffect(() => {
    setReady(false);
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (!raw) {
        setLayout(DEFAULT_LAYOUT);
      } else {
        const saved = JSON.parse(raw) as Array<Partial<WidgetLayoutItem>>;
        const savedById = new Map(saved.filter((item) => typeof item.id === "string").map((item) => [item.id!, item]));
        const savedOrder = saved.flatMap((item) => typeof item.id === "string" ? [item.id] : []);
        const isLegacyLayout = !savedById.has("analytics");
        if (isLegacyLayout) {
          const checklistIndex = savedOrder.indexOf("checklist");
          savedOrder.splice(checklistIndex < 0 ? savedOrder.length : checklistIndex + 1, 0, "analytics");
        }
        const merged = DEFAULT_LAYOUT.map((base) => {
          const item = savedById.get(base.id);
          return {
            ...base,
            visible: typeof item?.visible === "boolean" ? item.visible : base.visible,
            span: base.id === "checklist" && isLegacyLayout
              ? base.defaultSpan
              : item?.span === "half" || item?.span === "full" ? item.span : base.defaultSpan,
            tint: typeof item?.tint === "string" && /^#[\da-f]{6}$/i.test(item.tint) ? item.tint : null,
            tintStrength: Number.isFinite(item?.tintStrength) ? Math.max(5, Math.min(35, Number(item?.tintStrength))) : base.tintStrength,
          };
        });
        merged.sort((a, b) => {
          const ai = savedOrder.indexOf(a.id);
          const bi = savedOrder.indexOf(b.id);
          return (ai < 0 ? DEFAULT_LAYOUT.findIndex((item) => item.id === a.id) + savedOrder.length : ai)
            - (bi < 0 ? DEFAULT_LAYOUT.findIndex((item) => item.id === b.id) + savedOrder.length : bi);
        });
        setLayout(merged);
      }
    } catch {
      setLayout(DEFAULT_LAYOUT);
    }
    setReady(true);
  }, [userId]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey(userId), JSON.stringify(layout)); } catch { /* Layout remains active for this visit. */ }
  }, [layout, ready, userId]);

  const beginDrag = (id: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    activeDrag.current = { id, lastTarget: null };
    setDraggingId(id);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = activeDrag.current;
    if (!current) return;
    const targetElement = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-dashboard-widget-id]");
    const targetId = targetElement?.dataset.dashboardWidgetId;
    if (!targetId || targetId === current.id || targetId === current.lastTarget) return;
    const rect = targetElement.getBoundingClientRect();
    const inLowerHalf = event.clientY > rect.top + rect.height / 2;
    const after = Math.abs(event.clientY - (rect.top + rect.height / 2)) < rect.height * 0.2
      ? event.clientX > rect.left + rect.width / 2
      : inLowerHalf;
    current.lastTarget = targetId;
    setLayout((items) => moveItem(items, current.id, targetId, after));
  };

  const endDrag = () => {
    activeDrag.current = null;
    setDraggingId(null);
  };

  const toggleVisible = (id: string) => setLayout((items) => items.map((item) => item.id === id ? { ...item, visible: !item.visible } : item));
  const toggleSpan = (id: string) => setLayout((items) => items.map((item) => item.id === id ? { ...item, span: item.span === "full" ? "half" : "full" } : item));
  const setTint = (id: string, tint: string | null) => setLayout((items) => items.map((item) => item.id === id ? { ...item, tint } : item));
  const setTintStrength = (id: string, tintStrength: number) => setLayout((items) => items.map((item) => item.id === id ? { ...item, tintStrength } : item));
  const bump = (id: string, direction: -1 | 1) => setLayout((items) => {
    const index = items.findIndex((item) => item.id === id);
    const nextIndex = Math.max(0, Math.min(items.length - 1, index + direction));
    if (index < 0 || nextIndex === index) return items;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    return next;
  });
  const restore = () => setLayout(DEFAULT_LAYOUT);

  return (
    <section className="space-y-3" aria-label="Customizable dashboard widgets">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card/80 p-3 shadow-sm">
        <div><p className="text-sm font-bold">Your dashboard</p><p className="text-[11px] text-muted-foreground">{editing ? "Drag cards to arrange; use the controls to hide or resize them." : "Your layout is saved on this device."}</p></div>
        <button type="button" onClick={() => setEditing((value) => !value)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background/70 px-3 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          {editing ? <Check className="h-4 w-4"/> : <Pencil className="h-4 w-4"/>}{editing ? "Done" : "Customize layout"}
        </button>
      </div>

      {editing && <div className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-bold">Widget controls</h2><p className="text-[11px] text-muted-foreground">Reorder, show or hide, and choose full or half width. Changes save automatically.</p></div><button type="button" onClick={restore} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background/70 px-2.5 text-[11px] font-semibold hover:bg-muted"><RotateCcw className="h-3.5 w-3.5"/>Reset layout</button></div>
        <div className="grid gap-2 sm:grid-cols-2">
          {ordered.map((item, index) => <div key={item.id} className="min-w-0 rounded-xl border border-border/80 bg-background/75 p-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <button type="button" aria-label={`Drag ${item.title} to reorder`} title="Drag to reorder" onPointerDown={(event) => beginDrag(item.id, event)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className={`touch-none grid h-8 w-8 shrink-0 place-items-center rounded-lg cursor-grab active:cursor-grabbing ${draggingId === item.id ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground"}`}><GripVertical className="h-4 w-4"/></button>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.title}</span>
              <div className="flex shrink-0 items-center gap-0.5">
                <button type="button" aria-label={`Move ${item.title} up`} disabled={index === 0} onClick={() => bump(item.id, -1)} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-35"><ChevronUp className="h-4 w-4"/></button>
                <button type="button" aria-label={`Move ${item.title} down`} disabled={index === ordered.length - 1} onClick={() => bump(item.id, 1)} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-35"><ChevronDown className="h-4 w-4"/></button>
                <button type="button" onClick={() => toggleSpan(item.id)} aria-label={`${item.span === "full" ? "Set half" : "Set full"} width for ${item.title}`} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted">{item.span === "full" ? <Minimize2 className="h-3.5 w-3.5"/> : <Maximize2 className="h-3.5 w-3.5"/>}</button>
                <button type="button" onClick={() => setTint(item.id, item.tint ? null : "#4f86e8")} aria-label={`${item.tint ? "Remove" : "Set"} ${item.title} color tint`} className={`grid h-7 w-7 place-items-center rounded-md ${item.tint ? "text-primary" : "text-muted-foreground hover:bg-muted"}`}><Palette className="h-4 w-4"/></button>
                <label className="grid h-7 w-7 cursor-pointer place-items-center overflow-hidden rounded-md border border-border/60" title={`Pick ${item.title} color`}><input type="color" aria-label={`Choose a color for ${item.title}`} value={item.tint ?? "#4f86e8"} onChange={(event) => setTint(item.id, event.target.value)} className="h-9 w-9 cursor-pointer border-0 bg-transparent p-0"/></label>
                <button type="button" onClick={() => toggleVisible(item.id)} aria-label={`${item.visible ? "Hide" : "Show"} ${item.title}`} aria-pressed={item.visible} className={`grid h-7 w-7 place-items-center rounded-md transition ${item.visible ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}>{item.visible ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}</button>
              </div>
            </div>
            {item.tint && <label className="mt-2 flex items-center gap-2 pl-10 text-[10px] text-muted-foreground"><span className="shrink-0">Tint intensity</span><input type="range" min="5" max="35" step="1" value={item.tintStrength} onChange={(event) => setTintStrength(item.id, Number(event.target.value))} aria-label={`${item.title} tint intensity`} className="min-w-0 flex-1 accent-primary"/><span className="w-8 text-right tabular-nums">{item.tintStrength}%</span></label>}
          </div>)}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground" aria-live="polite">{draggingId ? `Reordering ${ordered.find((item) => item.id === draggingId)?.title ?? "widget"}…` : "Tip: drag a handle or use the arrow buttons to reorder."}</p>
      </div>}

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {ordered.filter((item) => item.visible).map((item) => {
          const widget = definitions.find((candidate) => candidate.id === item.id);
          if (!widget) return null;
          return <motion.div key={item.id} layout={editing && !reduceMotion ? "position" : false} transition={{ type: "spring", stiffness: 420, damping: 36 }} data-dashboard-widget-id={item.id} className={`min-w-0 ${item.span === "full" ? "lg:col-span-2" : "lg:col-span-1"} ${draggingId === item.id ? "opacity-65" : ""}`}>
            {editing && <div className="mb-1 flex items-center justify-between gap-2 rounded-t-xl border border-b-0 border-dashed border-primary/30 bg-primary/[0.04] px-3 py-1.5 text-[10px] font-semibold text-primary"><span>{item.title} · {item.span} width</span><button type="button" aria-label={`Drag ${item.title} to reorder`} onPointerDown={(event) => beginDrag(item.id, event)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className="touch-none inline-flex cursor-grab items-center gap-1 rounded px-1 py-0.5 active:cursor-grabbing"><GripVertical className="h-3 w-3"/>Drag</button></div>}
            {item.tint ? <div className="dashboard-widget-tint" style={{ "--dashboard-widget-tint": item.tint, "--dashboard-widget-strength": `${item.tintStrength}%`, "--dashboard-widget-dark-strength": `${Math.max(2, Math.round(item.tintStrength * 0.35))}%` } as CSSProperties}>{widget.content}</div> : widget.content}
          </motion.div>;
        })}
      </div>
      {!ordered.some((item) => item.visible) && <div className="rounded-2xl border border-dashed border-border p-8 text-center"><p className="font-semibold">Your dashboard is empty</p><p className="mt-1 text-sm text-muted-foreground">Turn on widgets in Customize layout to bring your dashboard back.</p>{!editing && <button type="button" onClick={() => setEditing(true)} className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Customize layout</button>}</div>}
    </section>
  );
}
