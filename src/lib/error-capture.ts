// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

import { isClientDisconnect } from "./request-errors";

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

// Node's HTTP server reports a browser closing an in-flight navigation as an
// error before TanStack middleware can normalize the response. Keep that
// expected transport event out of runtime-error reporting without hiding any
// application, rendering, or data errors.
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (args.some(isClientDisconnect)) return;
  originalConsoleError(...args);
};

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
