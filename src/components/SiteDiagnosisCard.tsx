import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Monitor,
  RefreshCw,
  ServerCog,
  Wifi,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status = "good" | "warn" | "error";
type Check = { id: string; label: string; status: Status; detail: string };
type Result = { score: number; durationMs: number; checks: Check[] };
type Props = { advanced?: boolean };

type MemoryPerformance = Performance & {
  memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
};
type ConnectionNavigator = Navigator & {
  connection?: { effectiveType?: string; downlink?: number; rtt?: number };
};

export function SiteDiagnosisCard({ advanced = false }: Props) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  function start() {
    cleanupRef.current?.();
    const started = performance.now();
    let longTasks = 0;
    let errors = 0;
    let maxDelay = 0;
    let samples = 0;
    let last = performance.now();
    let apiMs: number | null = null;
    let apiError: string | null = null;
    const observer =
      "PerformanceObserver" in window
        ? new PerformanceObserver((list) => {
            longTasks += list.getEntries().length;
          })
        : null;
    try {
      observer?.observe({ type: "longtask", buffered: true });
    } catch {
      /* Browser does not support long-task entries. */
    }
    const onError = () => {
      errors += 1;
    };
    const onRejection = () => {
      errors += 1;
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    const timer = window.setInterval(() => {
      const now = performance.now();
      maxDelay = Math.max(maxDelay, Math.max(0, now - last - 1000));
      last = now;
      samples += 1;
      setSeconds(Math.min(60, Math.round((now - started) / 1000)));
    }, 1000);
    void (async () => {
      const requestStarted = performance.now();
      const { error } = await supabase.from("profiles").select("id").limit(1);
      apiMs = Math.round(performance.now() - requestStarted);
      apiError = error?.message ?? null;
    })();

    const finish = () => {
      observer?.disconnect();
      window.clearInterval(timer);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      const memory = (performance as MemoryPerformance).memory;
      const connection = (navigator as ConnectionNavigator).connection;
      const resources = performance.getEntriesByType("resource").length;
      const navigation = performance.getEntriesByType("navigation")[0] as
        PerformanceNavigationTiming | undefined;
      const checks: Check[] = [
        {
          id: "runtime",
          label: "Runtime stability",
          status: errors === 0 ? "good" : errors < 3 ? "warn" : "error",
          detail:
            errors === 0
              ? "No browser errors or rejected promises detected."
              : `${errors} runtime error${errors === 1 ? "" : "s"} detected during the scan.`,
        },
        {
          id: "ui",
          label: "UI responsiveness",
          status:
            longTasks === 0 && maxDelay < 150
              ? "good"
              : longTasks < 3 && maxDelay < 500
                ? "warn"
                : "error",
          detail: `${longTasks} long task${longTasks === 1 ? "" : "s"}; maximum event-loop delay ${Math.round(maxDelay)} ms across ${samples} samples.`,
        },
        {
          id: "api",
          label: "App API response",
          status: apiError ? "error" : apiMs !== null && apiMs < 800 ? "good" : "warn",
          detail: apiError
            ? `Profile health query failed: ${apiError}`
            : apiMs === null
              ? "Health query did not finish before the scan ended."
              : `Authenticated profile query completed in ${apiMs} ms.`,
        },
        {
          id: "network",
          label: "Network connection",
          status: navigator.onLine ? "good" : "error",
          detail: navigator.onLine
            ? `Online${connection?.effectiveType ? ` · ${connection.effectiveType}` : ""}${connection?.rtt ? ` · ${connection.rtt} ms RTT` : ""}.`
            : "Browser reports that it is offline.",
        },
      ];
      if (advanced) {
        checks.push(
          {
            id: "memory",
            label: "JavaScript memory",
            status: memory
              ? memory.usedJSHeapSize / memory.jsHeapSizeLimit < 0.75
                ? "good"
                : "warn"
              : "good",
            detail: memory
              ? `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB heap in use.`
              : "Detailed heap metrics are not exposed by this browser.",
          },
          {
            id: "page",
            label: "Page load profile",
            status:
              navigation && navigation.loadEventEnd - navigation.startTime < 3000 ? "good" : "warn",
            detail: navigation
              ? `Load completed in ${Math.round(navigation.loadEventEnd - navigation.startTime)} ms with ${resources} resource entries.`
              : `${resources} resource entries observed.`,
          },
          {
            id: "storage",
            label: "Local storage access",
            status: (() => {
              try {
                const key = "jph-diagnosis-probe";
                localStorage.setItem(key, "1");
                localStorage.removeItem(key);
                return "good" as Status;
              } catch {
                return "warn" as Status;
              }
            })(),
            detail: "Browser storage probe completed without changing user data.",
          },
        );
      }
      const score = Math.round(
        checks.reduce(
          (sum, check) => sum + (check.status === "good" ? 100 : check.status === "warn" ? 65 : 25),
          0,
        ) / checks.length,
      );
      setResult({ score, durationMs: Math.round(performance.now() - started), checks });
      setSeconds(60);
      setRunning(false);
      cleanupRef.current = null;
    };
    const timeout = window.setTimeout(finish, 60_000);
    cleanupRef.current = () => {
      window.clearTimeout(timeout);
      observer?.disconnect();
      window.clearInterval(timer);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      setRunning(false);
    };
    setResult(null);
    setSeconds(0);
    setRunning(true);
  }

  const statusIcon = (status: Status) =>
    status === "good" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    ) : status === "warn" ? (
      <AlertTriangle className="h-4 w-4 text-amber-600" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    );
  const scoreTone = !result
    ? "text-muted-foreground"
    : result.score >= 85
      ? "text-emerald-600"
      : result.score >= 65
        ? "text-amber-600"
        : "text-destructive";

  return (
    <section
      id={advanced ? "diagnosis-pro" : "site-diagnosis"}
      className="rounded-[30px] border border-primary/15 bg-card/70 p-5 shadow-[0_24px_80px_-40px_rgba(20,35,70,0.22)] backdrop-blur-2xl sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              {advanced ? "Diagnosis Pro" : "Website care"}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {advanced ? "Advanced site diagnosis" : "Run a website diagnosis"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {advanced
                ? "Admin-only diagnostics for runtime stability, API response, memory, page load, storage, and browser responsiveness."
                : "When the website feels slow, run this private one-minute check. It measures this browser session and does not change your account or study data."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={running ? () => cleanupRef.current?.() : start}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary/15 disabled:opacity-50"
        >
          {running ? (
            <>
              <X className="h-4 w-4" />
              Stop ({seconds}s)
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              {result ? "Run again" : "Run diagnosis"}
            </>
          )}
        </button>
      </div>
      {running && (
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 animate-pulse text-primary" />
              Checking the site…
            </span>
            <span>{seconds}/60 seconds</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-1000"
              style={{ width: `${(seconds / 60) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Keep this tab open while the browser samples performance.
          </p>
        </div>
      )}
      {result && !running && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-background/50 p-4">
            <div className={`text-4xl font-black ${scoreTone}`}>
              {result.score}
              <span className="text-base text-muted-foreground">/100</span>
            </div>
            <div>
              <p className="font-semibold">
                {result.score >= 85
                  ? "Everything looks healthy"
                  : result.score >= 65
                    ? "Some improvements are possible"
                    : "Performance issues detected"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Completed in {Math.round(result.durationMs / 1000)} seconds. Results are local to
                this browser.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {result.checks.map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-2 rounded-xl border border-border/70 bg-background/45 p-3"
              >
                <div className="mt-0.5">{statusIcon(check.status)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{check.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{check.detail}</p>
                </div>
              </div>
            ))}
          </div>
          {result.checks.some((check) => check.status !== "good") && (
            <p className="text-xs text-muted-foreground">
              Tip: close heavy tabs, switch to a stable connection, refresh once, and run the
              diagnosis again. Persistent API failures should be reported with this result.
            </p>
          )}
        </div>
      )}
      {!result && !running && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Mini icon={<Monitor className="h-4 w-4" />} text="Browser & UI" />
          <Mini icon={<Wifi className="h-4 w-4" />} text="Network & API" />
          <Mini
            icon={<ServerCog className="h-4 w-4" />}
            text={advanced ? "Memory, load & storage" : "No data changes"}
          />
        </div>
      )}
    </section>
  );
}
function Mini({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/45 px-3 py-2 text-xs font-medium text-muted-foreground">
      {icon}
      {text}
    </div>
  );
}
