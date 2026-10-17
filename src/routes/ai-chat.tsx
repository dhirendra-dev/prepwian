import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  Menu,
  Plus,
  Send,
  Settings,
  Sparkles,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { LazyMathText } from "@/components/LazyMathText";
import { aiChatCompletion } from "@/lib/ai-chat.functions";

export const Route = createFileRoute("/ai-chat")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "AI Study Chat — JEE Prep Hub" },
      { name: "twitter:description", content: "Your 24x7 AI tutor for JEE & NEET doubts, concepts and practice problems." },
      { title: "AI Study Chat — JEE Prep Hub" },
      {
        name: "description",
        content:
          "Ask an AI study tutor anything about JEE Main, JEE Advanced and NEET — concepts, derivations, doubts and practice questions, with step-by-step answers.",
      },
      { property: "og:title", content: "AI Study Chat — JEE Prep Hub" },
      {
        property: "og:description",
        content: "Your 24x7 AI tutor for JEE & NEET doubts, concepts and practice problems.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiChatPage,
});

type Msg = { id: string; role: "user" | "assistant" | "system"; content: string };
type Convo = { id: string; title: string; messages: Msg[]; updatedAt: number };
type Provider = "groq" | "gemini" | "openai" | "custom";
type KeyConfig = { provider: Provider; model: string; baseUrl: string };

const CONVOS_KEY = "aichat:convos:v1";
const ACTIVE_KEY = "aichat:active:v1";
const CONFIG_KEY = "aichat:config:v1";

const EXAMPLES = [
  "Explain electric flux simply",
  "JEE MCQ on rotational mechanics",
  "Derive the range of a projectile",
  "NEET: difference between mitosis and meiosis",
];

const PROVIDER_LABELS: Record<Provider, string> = {
  groq: "Groq",
  gemini: "Google Gemini",
  openai: "OpenAI",
  custom: "Custom OpenAI-compatible",
};

const MODEL_HINTS: Record<Provider, string> = {
  groq: "e.g. llama-3.3-70b-versatile",
  gemini: "e.g. gemini-2.5-flash",
  openai: "e.g. gpt-4o-mini",
  custom: "Model name your endpoint expects",
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const titleFrom = (text: string) => {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 40 ? `${t.slice(0, 40)}…` : t || "New chat";
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function AiChatPage() {
  const [hydrated, setHydrated] = useState(false);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [config, setConfig] = useState<KeyConfig | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setConvos(loadJson<Convo[]>(CONVOS_KEY, []));
    setActiveId(localStorage.getItem(ACTIVE_KEY));
    const oldConfig = loadJson<(KeyConfig & { apiKey?: string }) | null>(CONFIG_KEY, null);
    if (oldConfig) {
      const safeConfig: KeyConfig = { provider: oldConfig.provider, model: oldConfig.model, baseUrl: oldConfig.baseUrl };
      setConfig(safeConfig);
      localStorage.setItem(CONFIG_KEY, JSON.stringify(safeConfig));
    } else {
      setConfig(null);
      localStorage.removeItem(CONFIG_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CONVOS_KEY, JSON.stringify(convos));
  }, [convos, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    else localStorage.removeItem(ACTIVE_KEY);
  }, [activeId, hydrated]);

  const active = useMemo(() => convos.find((c) => c.id === activeId) ?? null, [convos, activeId]);
  const messages = active?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  const growTextarea = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  };
  useEffect(growTextarea, [input]);

  const saveConfig = (next: KeyConfig) => {
    setConfig(next);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
  };
  const removeConfig = () => {
    setConfig(null);
    localStorage.removeItem(CONFIG_KEY);
  };

  const newChat = () => {
    setActiveId(null);
    setInput("");
    setSidebarOpen(false);
  };

  const deleteConvo = (id: string) => {
    setConvos((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || sending) return;

      const userMsg: Msg = { id: uid(), role: "user", content: clean };
      let convoId = activeId;
      let history: Msg[] = [];

      if (convoId && convos.some((c) => c.id === convoId)) {
        const existing = convos.find((c) => c.id === convoId)!;
        history = [...existing.messages, userMsg];
        setConvos((prev) =>
          prev.map((c) => (c.id === convoId ? { ...c, messages: history, updatedAt: Date.now() } : c)),
        );
      } else {
        convoId = uid();
        history = [userMsg];
        const convo: Convo = { id: convoId, title: titleFrom(clean), messages: history, updatedAt: Date.now() };
        setConvos((prev) => [convo, ...prev]);
        setActiveId(convoId);
      }

      setInput("");
      setSending(true);
      const append = (msg: Msg) =>
        setConvos((prev) =>
          prev.map((c) => (c.id === convoId ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() } : c)),
        );

      try {
        const res = await aiChatCompletion({
          data: {
            messages: history
              .filter((m) => m.role !== "system")
              .slice(-24)
              .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
            provider: config?.provider ?? "gemini",
            model: config?.model,
            baseUrl: config?.baseUrl,
          },
        });
        if (res.ok) append({ id: uid(), role: "assistant", content: res.content });
        else {
          append({ id: uid(), role: "system", content: res.error });
          if (res.code === "auth" || res.code === "config" || res.code === "not_found") setSettingsOpen(true);
        }
      } catch {
        append({
          id: uid(),
          role: "system",
          content: "Network problem — the request never reached the AI. Check your connection and try again.",
        });
      } finally {
        setSending(false);
      }
    },
    [activeId, config, convos, sending],
  );

  const onExample = (prompt: string) => {
    void send(prompt);
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background md:h-[calc(100dvh-var(--site-global-header-height))]">
      {/* Sidebar */}
      {sidebarOpen && (
        <button
          aria-label="Close chat history"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm dark:bg-black/70 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="truncate font-display text-sm font-semibold">AI Study Chat</span>
          </Link>
          <button
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md hover:bg-muted md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={newChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New chat
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            History
          </div>
          {convos.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">No conversations yet.</p>
          ) : (
            <ul className="space-y-0.5">
              {[...convos]
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((c) => (
                  <li key={c.id} className="group flex items-center gap-1">
                    <button
                      onClick={() => {
                        setActiveId(c.id);
                        setSidebarOpen(false);
                      }}
                      className={`min-w-0 flex-1 truncate rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted ${
                        c.id === activeId ? "bg-muted font-medium" : ""
                      }`}
                    >
                      {c.title}
                    </button>
                    <button
                      aria-label={`Delete ${c.title}`}
                      onClick={() => deleteConvo(c.id)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${config ? "bg-emerald-500" : "bg-amber-500"}`}
              aria-hidden
            />
            <span className="truncate text-muted-foreground">
              {config ? `Platform key · ${PROVIDER_LABELS[config.provider]}` : "Platform AI · configure preferences"}
            </span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <Settings className="h-4 w-4" /> Settings
          </button>
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border bg-card/80 px-3 py-3 backdrop-blur">
          <button
            aria-label="Open chat history"
            onClick={() => setSidebarOpen(true)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md hover:bg-muted md:hidden"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
          <h1 className="min-w-0 flex-1 truncate font-display text-base font-semibold">
            {active?.title ?? "AI Study Chat"}
          </h1>
          <Link to="/dashboard" className="shrink-0 text-xs font-medium text-accent hover:underline">
            Dashboard
          </Link>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
          <div className="mx-auto w-full max-w-5xl space-y-5">
            {messages.length === 0 ? (
              <div className="py-8 text-center sm:py-16">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-7 w-7" />
                </span>
                <h2 className="mt-4 font-display text-xl font-bold sm:text-2xl">Ask me anything, aspirant 👋</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Concepts, derivations, doubts or practice questions for JEE Main, JEE Advanced and NEET — explained
                  step by step.
                </p>
                <div className="mx-auto mt-6 grid max-w-xl gap-2 sm:grid-cols-2">
                  {EXAMPLES.map((e) => (
                    <button
                      key={e}
                      onClick={() => onExample(e)}
                      className="rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm shadow-soft hover:bg-muted"
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="mt-5 text-xs font-medium text-accent hover:underline"
                >
                  Use your own API key instead →
                </button>
              </div>
            ) : (
              messages.map((m) =>
                m.role === "system" ? (
                  <div
                    key={m.id}
                    className="mx-auto max-w-xl rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-xs text-destructive"
                  >
                    {m.content}
                  </div>
                ) : (
                  <div key={m.id} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Bot className="h-4 w-4" />
                      </span>
                    )}
                    <div
                      className={`min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-soft ${
                        m.role === "user"
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md border border-border bg-card"
                      }`}
                    >
                      <LazyMathText text={m.content} />
                    </div>
                    {m.role === "user" && (
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                ),
              )
            )}

            {sending && (
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-card/80 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="mx-auto flex w-full max-w-5xl items-end gap-3"
          >
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask a doubt… (Enter to send, Shift+Enter for a new line)"
              className="max-h-42 min-h-11 w-full flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Send message"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </main>

      {settingsOpen && (
        <SettingsPanel
          config={config}
          onClose={() => setSettingsOpen(false)}
          onSave={(c) => {
            saveConfig(c);
            setSettingsOpen(false);
          }}
          onRemove={() => {
            removeConfig();
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SettingsPanel({
  config,
  onClose,
  onSave,
  onRemove,
}: {
  config: KeyConfig | null;
  onClose: () => void;
  onSave: (c: KeyConfig) => void;
  onRemove: () => void;
}) {
  const [provider, setProvider] = useState<Provider>(config?.provider ?? "gemini");
  const [model, setModel] = useState(config?.model ?? "");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm dark:bg-black/70 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl border border-border bg-card p-4 shadow-glow sm:rounded-2xl sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold">AI provider settings</h2>
          <button aria-label="Close settings" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          Choose a provider and model. The API credential is managed centrally by an administrator and is never stored in this browser.
        </p>

        <label className="block text-xs font-medium">Provider</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
            <option key={p} value={p}>
              {PROVIDER_LABELS[p]}
            </option>
          ))}
        </select>

        <>
            {provider === "custom" && (
              <>
                <label className="mt-3 block text-xs font-medium">Base URL</label>
                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://your-host/v1"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </>
            )}
            <label className="mt-3 block text-xs font-medium">Model</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={MODEL_HINTS[provider]}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <p className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">API credentials are managed centrally by an administrator in System Control Center. This page stores only provider/model preferences on this device.</p>
        </>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onSave({ provider, model: model.trim(), baseUrl: baseUrl.trim() })}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            <Check className="h-4 w-4" /> Save preferences
          </button>
          {config && (
            <button
              onClick={onRemove}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Reset preferences
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
