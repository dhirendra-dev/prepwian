import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Turnstile, useTurnstileToken } from "@/components/Turnstile";
import { submitContactMessage } from "@/lib/contact.functions";
import { toast } from "sonner";
import { Clock3, Loader2, Send } from "lucide-react";

export function DeveloperAccessRequestForm({ userEmail }: { userEmail?: string | null }) {
  const submitRequest = useServerFn(submitContactMessage);
  const captcha = useTurnstileToken();
  const [purpose, setPurpose] = useState("");
  const [duration, setDuration] = useState("1 day");
  const [details, setDetails] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanPurpose = purpose.trim();
    const cleanDetails = details.trim();
    if (cleanPurpose.length < 3 || cleanDetails.length < 10) {
      toast.error(
        "Please explain what you need access for and include at least 10 characters of detail.",
      );
      return;
    }
    setSending(true);
    try {
      await submitRequest({
        data: {
          subject: `[Developer Access Request] ${cleanPurpose}`.slice(0, 200),
          body: [
            `Requested duration: ${duration}`,
            `Purpose: ${cleanPurpose}`,
            "",
            cleanDetails,
            "",
            `Requested from: ${userEmail ?? "authenticated account"}`,
          ].join("\n"),
          token: captcha.token,
          honeypot,
        },
      });
      setPurpose("");
      setDetails("");
      setSubmitted(true);
      toast.success("Access request sent to the administrators.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your access request.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleRequest}
      className="rounded-2xl border border-border/80 bg-background/60 p-4 text-left sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-cyan-300">
          <Clock3 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-bold">Need temporary access?</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Tell an administrator what you need and how long access should remain active.
          </p>
        </div>
      </div>

      {submitted ? (
        <div
          className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-700 dark:text-emerald-300"
          role="status"
        >
          Your request is with the administrators. They will review it and contact you through your
          account.
        </div>
      ) : (
        <>
          <label className="mt-4 block text-xs font-semibold" htmlFor="developer-access-purpose">
            What do you need access for?
          </label>
          <input
            id="developer-access-purpose"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            maxLength={120}
            placeholder="For example: review a deployment issue"
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15"
            required
          />

          <label className="mt-3 block text-xs font-semibold" htmlFor="developer-access-duration">
            Requested duration
          </label>
          <select
            id="developer-access-duration"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15"
          >
            <option>1 hour</option>
            <option>1 day</option>
            <option>1 week</option>
            <option>Other / administrator discretion</option>
          </select>

          <label className="mt-3 block text-xs font-semibold" htmlFor="developer-access-details">
            Additional details
          </label>
          <textarea
            id="developer-access-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            maxLength={1200}
            rows={4}
            placeholder="Include the repository, task, or environment you need to work on."
            className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-5 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15"
            required
          />
          <input
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute h-0 w-0 overflow-hidden opacity-0"
          />
          <Turnstile action="developer-access" onToken={captcha.setToken} />
          <button
            type="submit"
            disabled={
              sending || !captcha.ready || purpose.trim().length < 3 || details.trim().length < 10
            }
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-bold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Sending request…" : "Request temporary access"}
          </button>
        </>
      )}
    </form>
  );
}
