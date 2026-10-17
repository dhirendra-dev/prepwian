import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ImgRef = { path: string; size?: "sm" | "md" | "lg" | "full"; align?: "left" | "center" | "right"; caption?: string };
export type Status = "answered" | "marked" | "answered_marked" | "visited" | "unvisited";

// Renders children directly under <body> so `fixed` always means "the phone screen",
// even if a parent layout uses transforms / filters.
export function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

// Simple solid-colour modal (no animations, no translucent backgrounds).
export function Modal({ open, onClose, title, children, actions }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; actions: ReactNode;
}) {
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={onClose}>
        <div role="dialog" className="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100" onClick={(e) => e.stopPropagation()}>
          <h2 className="flex items-center gap-2 text-lg font-semibold">{title}</h2>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{children}</div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
        </div>
      </div>
    </Portal>
  );
}

export function PlayerImage({ src, im, onZoom }: { src: string; im: ImgRef; onZoom: (s: string) => void }) {
  const w = { sm: "max-w-[200px]", md: "max-w-[320px]", lg: "max-w-[480px]", full: "w-full" }[im.size ?? "md"];
  const a = { left: "", center: "mx-auto", right: "ml-auto" }[im.align ?? "left"];
  return (
    <figure className={`mt-3 max-w-full ${w} ${a}`}>
      <img
        src={src}
        alt={im.caption ?? "Question image"}
        onClick={() => onZoom(src)}
        onError={(e) => (e.currentTarget.style.display = "none")}
        className="max-w-full cursor-zoom-in rounded-md border bg-white object-contain"
      />
      {im.caption && <figcaption className="mt-1 text-xs text-muted-foreground">{im.caption}</figcaption>}
    </figure>
  );
}

export function Stat({ n, label, cls }: { n: number; label: string; cls: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 px-1 py-1.5 text-center dark:bg-slate-800">
      <div className={`text-base font-bold leading-none ${cls}`}>{n}</div>
      <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-3.5 w-3.5 rounded ${color}`} /> {label}
    </div>
  );
}

const statusCls = (s: Status) =>
  s === "answered" ? "bg-green-600 text-white border-green-700"
  : s === "marked" ? "bg-purple-600 text-white border-purple-700"
  : s === "answered_marked" ? "bg-purple-600 text-white border-purple-700 ring-2 ring-green-500"
  : s === "visited" ? "bg-red-600 text-white border-red-700"
  : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100";

export type PaletteGroup = { name: string; items: { id: string; i: number }[] };

export function PaletteContent({ groups, counts, idx, statusOf, onGoto }: {
  groups: PaletteGroup[];
  counts: { answered: number; marked: number; notAnswered: number; unvisited: number };
  idx: number;
  statusOf: (id: string) => Status;
  onGoto: (i: number) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        <Stat n={counts.answered} label="Answered" cls="text-green-600 dark:text-green-400" />
        <Stat n={counts.notAnswered} label="Not ans." cls="text-red-600 dark:text-red-400" />
        <Stat n={counts.marked} label="Marked" cls="text-purple-600 dark:text-purple-400" />
        <Stat n={counts.unvisited} label="Not visited" cls="text-slate-500 dark:text-slate-300" />
      </div>
      <div className="mt-3 space-y-3">
        {groups.map((g) => (
          <div key={g.name || "all"}>
            {g.name && <div className="mb-1.5 text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">{g.name}</div>}
            <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
              {g.items.map(({ id, i }) => (
                <button
                  key={id}
                  onClick={() => onGoto(i)}
                  aria-label={`Question ${i + 1}`}
                  className={`aspect-square rounded-md border text-xs font-semibold ${statusCls(statusOf(id))} ${i === idx ? "ring-2 ring-blue-600 ring-offset-1" : ""}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
        <Legend color="bg-green-600" label="Answered" />
        <Legend color="bg-red-600" label="Not answered" />
        <Legend color="bg-purple-600" label="Marked for review" />
        <Legend color="bg-slate-200 border dark:bg-slate-600 dark:border-slate-500" label="Not visited" />
      </div>
    </>
  );
}
