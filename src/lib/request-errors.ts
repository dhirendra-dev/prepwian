type ErrorWithCause = Error & {
  code?: string;
  cause?: unknown;
};

export function isClientDisconnect(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const candidate = error as ErrorWithCause;
  if (candidate.code === "ECONNRESET" || candidate.name === "AbortError") return true;

  const message = candidate.message.trim().toLowerCase();
  if (message === "aborted" || message === "request aborted") return true;

  return candidate.cause !== undefined && isClientDisconnect(candidate.cause);
}