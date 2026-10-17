import { LinkifiedText } from "@/components/LinkifiedText";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Turnstile, useTurnstileToken } from "@/components/Turnstile";
import { submitContactMessage } from "@/lib/contact.functions";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileText,
  History,
  LifeBuoy,
  Mail,
  MessageCircle,
  MessageSquare,
  Paperclip,
  PencilLine,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Wrench,
  Zap,
} from "lucide-react";

const ADMIN_EMAIL = "jeeprephubofficial@gmail.com";

export const Route = createFileRoute("/_authenticated/contact")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Contact Admin — JEE Prep Hub" },
      { property: "og:description", content: "Get help from the JEE Prep Hub support team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Contact Admin — JEE Prep Hub" },
      { name: "twitter:description", content: "Get help from the JEE Prep Hub support team." },

      { title: "Contact Admin — JEE Prep Hub" },
      { name: "description", content: "Get help from the JEE Prep Hub support team." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: ContactAdminPage,
});

const categories = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "certificates", label: "Certificates", icon: Trophy },
  { id: "tests", label: "Tests", icon: FileText },
  { id: "technical", label: "Technical issue", icon: Wrench },
  { id: "feedback", label: "Feedback", icon: MessageCircle },
  { id: "other", label: "Other", icon: Settings2 },
] as const;
type Category = (typeof categories)[number]["id"];
type Priority = "low" | "normal" | "high";

function ContactAdminPage() {
  const { user } = Route.useRouteContext();
  const [category, setCategory] = useState<Category>("technical");
  const [priority, setPriority] = useState<Priority>("normal");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const captcha = useTurnstileToken();

  const {
    data: myMessages,
    isLoading: messagesLoading,
    isError: messagesError,
  } = useQuery({
    queryKey: ["my-contact-messages", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id,subject,body,status,admin_reply,replied_at,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Please add a subject and message.");
      return;
    }
    if (subject.trim().length < 3 || body.trim().length < 10) {
      toast.error("Add a clear subject and at least 10 characters of detail.");
      return;
    }
    setSending(true);
    try {
      // Keep compatibility with the existing contact_messages schema.
      // Category and priority are included in the subject instead of requiring a DB migration.
      const selectedCategory = categories.find((item) => item.id === category)?.label ?? "Other";
      await submitContactMessage({
        data: {
          subject: `[${selectedCategory} • ${priority.toUpperCase()}] ${subject.trim()}`.slice(
            0,
            200,
          ),
          body: body.trim(),
          token: captcha.token,
          honeypot,
        },
      });
      setSent(true);
      setSubject("");
      setBody("");
      toast.success("Message sent to the JEE Prep Hub team.");
    } catch (error) {
      const message =
        error instanceof Error && error.message && !error.message.includes("[object")
          ? error.message
          : "Could not send right now. Please try again in a moment.";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const mailtoBody = encodeURIComponent(
    `${body}\n\nCategory: ${categories.find((item) => item.id === category)?.label ?? "Other"}\nPriority: ${priority}\n\n— Sent from JEE Prep Hub\nUser ID: ${user.id}\nEmail: ${user.email ?? "n/a"}`,
  );
  const mailto = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
    subject || "Support request",
  )}&body=${mailtoBody}`;

  return (
    <AppShell>
      <main className="mx-auto w-full min-w-0 max-w-5xl space-y-4 overflow-x-clip px-3 py-3 [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)] sm:space-y-5 sm:px-5 sm:py-7 lg:px-8">
        <header className="relative min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:rounded-3xl sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> JEE Prep Hub Support
              </div>
              <h1 className="break-words font-display text-[1.7rem] font-bold leading-tight tracking-tight sm:text-4xl">
                How can we <span className="text-primary">help?</span>
              </h1>
              <p className="mt-2 max-w-xl break-words text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base">
                Tell us what’s going on. Our team will review your request and get back to you.
              </p>
            </div>
            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-3 sm:p-4 sm:min-w-52">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock3 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Typical response time</p>
                <p className="mt-0.5 font-semibold text-foreground">Within 24 hours</p>
              </div>
            </div>
          </div>
          <div className="relative mt-4 grid min-w-0 grid-cols-1 gap-2 sm:mt-6 sm:grid-cols-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3 sm:rounded-2xl sm:p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Support requests</p>
                <p className="text-xs text-muted-foreground">Tracked in your account</p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3 sm:rounded-2xl sm:p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Private by design</p>
                <p className="text-xs text-muted-foreground">
                  Only you and authorized support can access your request
                </p>
              </div>
            </div>
          </div>
        </header>

        {sent && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Your message has been submitted</p>
              <p className="mt-1 text-sm opacity-90">
                You can track replies and updates in “My previous requests” below.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSent(false)}>
              Dismiss
            </Button>
          </div>
        )}

        <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-5">
          <form
            onSubmit={submit}
            className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-border/80 bg-card p-3.5 shadow-soft sm:space-y-5 sm:rounded-3xl sm:p-6 lg:p-7"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Send us a message</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share your issue, feedback, or question.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your account</Label>
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {(user.email ?? "U").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="break-all text-sm font-semibold">
                    {user.email ?? "Signed-in account"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Signed in · Request linked to your account
                  </p>
                </div>
              </div>
            </div>

            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="contact-subject" className="h-12 rounded-xl bg-background/70">
                  <SelectValue placeholder="Select a subject or issue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Account or login issue">Account or login issue</SelectItem>
                  <SelectItem value="Certificate issue">Certificate issue</SelectItem>
                  <SelectItem value="Test series issue">Test series issue</SelectItem>
                  <SelectItem value="Website bug or error">Website bug or error</SelectItem>
                  <SelectItem value="Payment or subscription">Payment or subscription</SelectItem>
                  <SelectItem value="Feature request">Feature request</SelectItem>
                  <SelectItem value="Feedback or suggestion">Feedback or suggestion</SelectItem>
                  <SelectItem value="Other support request">Other support request</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the closest match, or describe the exact issue in your message.
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Category</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((item) => {
                  const Icon = item.icon;
                  const active = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategory(item.id)}
                      className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl border px-2.5 py-3 text-left text-xs font-medium transition-colors sm:px-3 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40" : "border-border bg-background/50 text-foreground hover:border-primary/50 hover:bg-muted/40"}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 break-words">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Priority</legend>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "low", label: "Low", dot: "bg-emerald-500" },
                    { value: "normal", label: "Normal", dot: "bg-sky-500" },
                    { value: "high", label: "High", dot: "bg-amber-500" },
                  ] as const
                ).map((item) => {
                  const active = priority === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPriority(item.value)}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-primary bg-primary/10 ring-1 ring-primary/40" : "border-border bg-background/50 hover:border-primary/40"}`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              {priority === "high" && (
                <p className="text-xs text-muted-foreground">
                  Use high priority only when the issue prevents you from using an important
                  feature.
                </p>
              )}
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="contact-message">Message</Label>
              <div className="relative">
                <PencilLine className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="contact-message"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe what happened, what you expected, and any steps to reproduce the issue…"
                  rows={6}
                  maxLength={5000}
                  required
                  className="min-h-32 resize-y rounded-xl bg-background/70 pl-10 text-base leading-6 sm:min-h-36"
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Never include your password or private credentials.</span>
                <span className="shrink-0 tabular-nums">{body.length}/5000</span>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
              <div className="flex items-start gap-2">
                <Paperclip className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  <strong className="text-foreground">Need to share a screenshot?</strong> For now,
                  describe the error and include any visible error code in your message. File
                  uploads will need to be connected to the project’s approved storage bucket before
                  they can be submitted securely.
                </p>
              </div>
            </div>

            <Turnstile action="contact" onToken={captcha.setToken} />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="submit"
                disabled={sending || !subject.trim() || body.trim().length < 10}
                className="h-12 w-full rounded-xl text-sm font-semibold"
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Sending request…" : "Send message"}
              </Button>
              <Button asChild type="button" variant="outline" className="h-12 w-full rounded-xl">
                <a href={mailto}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email support instead
                </a>
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              By sending, you agree to share this information with the JEE Prep Hub support team.
            </p>
          </form>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-border/80 bg-card p-4 shadow-soft sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Zap className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Quick help</h2>
                  <p className="text-xs text-muted-foreground">You may find an answer faster</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <QuickLink
                  icon={BookOpen}
                  title="Help Center"
                  description="Guides and resources"
                  href="/help"
                />
                <QuickLink
                  icon={CircleHelp}
                  title="FAQs"
                  description="Common questions"
                  href="/faq"
                />
                <QuickLink
                  icon={History}
                  title="My previous requests"
                  description="Track support replies"
                  href="#my-requests"
                  onClick={() =>
                    document
                      .getElementById("my-requests")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                />
              </div>
            </div>
            <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Contact details</h2>
                  <p className="text-xs text-muted-foreground">Reach our support team</p>
                </div>
              </div>
              <a
                href={`mailto:${ADMIN_EMAIL}`}
                className="mt-4 flex min-w-0 items-start gap-2 break-all text-sm text-primary hover:underline"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {ADMIN_EMAIL}
              </a>
              <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                We use your details only to respond to your request and provide support.
              </div>
            </div>
          </aside>
        </section>

        <section
          id="my-requests"
          className="scroll-mt-6 rounded-3xl border border-border/80 bg-card p-4 shadow-soft sm:p-6"
        >
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <History className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold">My previous requests</h2>
                <p className="text-sm text-muted-foreground">
                  Your support history and admin replies
                </p>
              </div>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {myMessages?.length ?? 0} requests
            </span>
          </div>
          <div className="mt-4">
            {messagesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
                ))}
              </div>
            ) : messagesError ? (
              <div className="rounded-2xl border border-border p-4 text-sm">
                <p>We couldn’t load your request history.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </Button>
              </div>
            ) : !myMessages?.length ? (
              <div className="rounded-2xl border border-dashed border-border p-7 text-center">
                <MessageSquare className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 font-semibold">No requests yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  When you contact support, your messages will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {myMessages.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-2xl border border-border bg-background/50 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold">{m.subject}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(m.created_at).toLocaleString(undefined, { hour12: true })}
                        </p>
                      </div>
                      <StatusPill status={m.status} />
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                      <LinkifiedText text={m.body} />
                    </p>
                    {m.admin_reply && (
                      <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-3.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          Admin reply
                          {m.replied_at
                            ? ` · ${new Date(m.replied_at).toLocaleString(undefined, { hour12: true })}`
                            : ""}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                          <LinkifiedText text={m.admin_reply} />
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function QuickLink({
  icon: Icon,
  title,
  description,
  href,
  onClick,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  href: string;
  onClick?: () => void;
}) {
  if (onClick)
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-background/50 p-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </button>
    );
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-3 transition hover:border-primary/40 hover:bg-primary/5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </a>
  );
}

function StatusPill({ status }: { status: string }) {
  const style =
    status === "resolved"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : status === "in_progress"
        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
        : "bg-muted text-muted-foreground";
  const label = status === "in_progress" ? "In progress" : status.replaceAll("_", " ");
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style}`}>
      {label}
    </span>
  );
}
