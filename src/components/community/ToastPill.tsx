import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Pill = { id: number; text: string };

const Ctx = createContext<(text: string) => void>(() => {});

export function useToastPill() {
  return useContext(Ctx);
}

/** Dark pill confirmations, stacked bottom-center above the composer. */
export function ToastPillProvider({ children }: { children: ReactNode }) {
  const [pills, setPills] = useState<Pill[]>([]);

  const push = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setPills((prev) => [...prev.slice(-2), { id, text }]);
    setTimeout(() => setPills((prev) => prev.filter((p) => p.id !== id)), 2600);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        {pills.map((p) => (
          <div
            key={p.id}
            className="animate-in fade-in slide-in-from-bottom-2 rounded-full bg-neutral-900/95 px-4 py-2 text-xs font-medium text-white shadow-lg ring-1 ring-white/10 dark:bg-neutral-800/95"
          >
            {p.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
