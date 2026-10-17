import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { LazyMathText } from "@/components/LazyMathText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { askSahai, getSahaiHistory, clearSahaiHistory } from "@/lib/sahai.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import { Sparkles, Send, Trash2, KeyRound, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sahai")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "SahAI — your AI study buddy" },
      { name: "twitter:description", content: "Ask doubts, plan revision and beat burnout with SahAI inside JEE Prep Hub." },

      { title: "SahAI — your AI study buddy | JEE Prep Hub" },
      { name: "description", content: "SahAI is the shared AI study buddy for every JEE Prep Hub student — doubts, revision plans and motivation, any time." },
      { property: "og:title", content: "SahAI — your AI study buddy" },
      { property: "og:description", content: "Ask doubts, plan revision and beat burnout with SahAI inside JEE Prep Hub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SahaiPage,
});

const EXAMPLES = [
  "Explain electric flux simply",
  "Make me a 7-day rotational motion revision plan",
  "I'm burnt out and can't focus — help",
  "Solve: integral of x·e^x dx",
];

type Msg = { id: string; role: "user" | "assistant"; content: string };

function SahaiPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const ask = useServerFn(askSahai);
  const loadHistory = useServerFn(getSahaiHistory);
  const clear = useServerFn(clearSahaiHistory);

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [optimistic, setOptimistic] = useState<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Remove the legacy per-device API key saved by older versions.
    localStorage.removeItem("jph:gemini-key");
  }, []);

  const history = useQuery({
    queryKey: ["sahai-history"],
    queryFn: () => loadHistory(),
  });

  const messages: Msg[] = [
    ...((history.data ?? []) as any[]).map((m) => ({ id: m.id, role: m.role, content: m.content })),
    ...optimistic,
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setInput("");
    setPending(true);
    haptic("light");
    setOptimistic([{ id: `tmp-${Date.now()}`, role: "user", content: message }]);
    const res = await ask({ data: { message } }).catch(() => null);
    setPending(false);
    setOptimistic([]);
    if (!res || !(res as any).ok) {
      toast.error((res as any)?.error ?? "SahAI couldn't reply just now. Try again in a moment 🙏");
    }
    qc.invalidateQueries({ queryKey: ["sahai-history"] });
  }

  async function reset() {
    if (!confirm("Clear your whole SahAI chat?")) return;
    await clear();
    qc.invalidateQueries({ queryKey: ["sahai-history"] });
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-6">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-soft dark:from-fuchsia-700 dark:to-purple-800">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold">SahAI</h1>
              <p className="text-xs text-muted-foreground">Your study buddy — doubts, plans and pep talks.</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={reset}>
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </header>

        <div className="min-h-[45vh] space-y-3 rounded-2xl border border-border bg-card p-3">
          {history.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-display text-base font-semibold">Kya doubt hai, champ? 👋</p>
              <p className="mt-1 text-sm text-muted-foreground">Ask anything — Physics, Chem, Maths, Bio, or just how to get back on track.</p>
              <div className="mt-4 grid gap-2">
                {EXAMPLES.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-left text-sm transition hover:border-primary/40 hover:bg-muted active:scale-[0.98]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "user" ? (
                  <Avatar className="h-7 w-7 shrink-0">
                    {user?.user_metadata?.avatar_url ? <AvatarImage src={user.user_metadata.avatar_url as string} alt="" /> : null}
                    <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">You</AvatarFallback>
                  </Avatar>
                ) : (
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white dark:from-fuchsia-700 dark:to-purple-800">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                )}
                <div
                  className={`max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground"
                      : "border border-border/60 bg-background"
                  }`}
                >
                  {m.role === "assistant" ? <LazyMathText text={m.content} /> : m.content}
                </div>
              </div>
            ))
          )}
          {pending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white dark:from-fuchsia-700 dark:to-purple-800">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              </span>
              SahAI is typing…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-end gap-2"
        >
          <div className="flex flex-1 items-end rounded-2xl border border-border bg-card px-3 py-2 shadow-soft focus-within:ring-2 focus-within:ring-primary/40">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 4000))}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              rows={1}
              placeholder="Ask SahAI anything…"
              className="max-h-32 min-h-[24px] w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button type="submit" disabled={!input.trim() || pending} className="h-11 w-11 shrink-0 rounded-full p-0" aria-label="Send">
            <Send className="h-5 w-5" />
          </Button>
        </form>

        <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground"><KeyRound className="h-3.5 w-3.5" /> Platform-managed AI</div>
          SahAI uses the centrally configured Gemini credential. API keys are not stored on this device. If AI is unavailable, contact a JEE Prep Hub administrator.
        </div>
      </div>
    </AppShell>
  );
}
