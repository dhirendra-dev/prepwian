import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { requireFullAdmin } from "@/lib/admin-guard";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Mail,
  Send,
  RefreshCw,
  Users,
  ShieldCheck,
  UserRound,
  AlertTriangle,
  ExternalLink,
  Unplug,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/email")({
  head: () => ({
    meta: [
      {
        title: "Admin · Email Center — JEE Prep Hub",
      },
      {
        name: "robots",
        content: "noindex,nofollow",
      },
    ],
  }),

  ssr: false,

  beforeLoad: async ({ context }) => {
    await requireFullAdmin(context.user.id);
  },

  component: AdminEmailCenter,
});

type Audience = "verified" | "all" | "user";

type CountResponse = {
  success?: boolean;
  audience?: string;
  count?: number;
};

type BroadcastResponse = {
  success?: boolean;
  queued?: number;
  skipped?: number;
  message?: string;
};

type GmailSendResponse = {
  success?: boolean;
  messageId?: string | null;
  threadId?: string | null;
  from?: string;
  to?: string;
  error?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return session.access_token;
}

function AdminEmailCenter() {
  const [audience, setAudience] =
    useState<Audience>("verified");

  const [targetUserId, setTargetUserId] =
    useState("");

  const [senderEmail, setSenderEmail] =
    useState("");

  const [senderDomain, setSenderDomain] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [body, setBody] =
    useState("");

  const [gmailTo, setGmailTo] =
    useState("");

  const [gmailSubject, setGmailSubject] =
    useState("");

  const [gmailBody, setGmailBody] =
    useState("");

  const [gmailStatus, setGmailStatus] =
    useState<"idle" | "connected" | "error">("idle");

  const [connectedGmail, setConnectedGmail] =
    useState("");

  const countEnabled =
    audience !== "user" ||
    isUuid(targetUserId);

  const countQuery = useQuery({
    queryKey: [
      "admin-email-recipient-count",
      audience,
      targetUserId,
    ],

    enabled: countEnabled,

    queryFn: async () => {
      const { data, error } =
        await (supabase as any).rpc(
          "admin_email_audience_count",
          {
            _audience: audience,
            _target_user_id:
              audience === "user"
                ? targetUserId.trim()
                : null,
          },
        );

      if (error) {
        throw new Error(
          error.message ||
            "Could not calculate recipient count.",
        );
      }

      return data as CountResponse;
    },

    staleTime: 5_000,
  });

  const connectGmail = useMutation({
    mutationFn: async () => {
      const accessToken = await getAccessToken();

      const response = await fetch(
        "/api/gmail/connect",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ||
            "Could not start Gmail connection.",
        );
      }

      return data as {
        success: boolean;
        authorization_url: string;
      };
    },

    onSuccess: (data) => {
      window.location.href =
        data.authorization_url;
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const gmailSend = useMutation({
    mutationFn: async () => {
      if (!gmailTo.trim()) {
        throw new Error("Recipient email is required.");
      }

      if (!gmailSubject.trim()) {
        throw new Error("Subject is required.");
      }

      if (!gmailBody.trim()) {
        throw new Error("Message is required.");
      }

      const confirmed = window.confirm(
        [
          "Send this Gmail message?",
          "",
          `To: ${gmailTo.trim()}`,
          `Subject: ${gmailSubject.trim()}`,
          "",
          "This will be sent from your connected Gmail account.",
        ].join("\n"),
      );

      if (!confirmed) {
        throw new Error("SEND_CANCELLED");
      }

      const accessToken = await getAccessToken();

      const response = await fetch(
        "/api/gmail/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            to: gmailTo.trim(),
            subject: gmailSubject.trim(),
            body: gmailBody,
          }),
        },
      );

      const data =
        (await response.json()) as GmailSendResponse;

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ||
            "Gmail failed to send the message.",
        );
      }

      return data;
    },

    onSuccess: (data) => {
      toast.success(
        `Email sent to ${data?.to || gmailTo.trim()}.`,
      );

      setGmailSubject("");
      setGmailBody("");
    },

    onError: (error: Error) => {
      if (error.message === "SEND_CANCELLED") {
        return;
      }

      setGmailStatus("error");
      toast.error(error.message);
    },
  });

  const broadcastEmail = useMutation({
    mutationFn: async () => {
      if (!subject.trim()) {
        throw new Error("Subject is required.");
      }

      if (!body.trim()) {
        throw new Error("Message is required.");
      }

      if (!senderEmail.trim()) {
        throw new Error(
          "Sender email address is required.",
        );
      }

      if (!senderDomain.trim()) {
        throw new Error(
          "Verified sender domain is required.",
        );
      }

      if (
        audience === "user" &&
        !isUuid(targetUserId)
      ) {
        throw new Error(
          "Enter a valid user UUID.",
        );
      }

      const recipientCount =
        countQuery.data?.count ?? 0;

      if (recipientCount <= 0) {
        throw new Error(
          "There are no eligible recipients.",
        );
      }

      const confirmed = window.confirm(
        [
          "Send this broadcast?",
          "",
          `Recipients: ${recipientCount}`,
          `Subject: ${subject.trim()}`,
          "",
          "The message will be added to the transactional email queue.",
        ].join("\n"),
      );

      if (!confirmed) {
        throw new Error("SEND_CANCELLED");
      }

      const { data, error } =
        await (supabase as any).rpc(
          "admin_queue_broadcast_email",
          {
            _audience: audience,
            _subject: subject.trim(),
            _body: body.trim(),
            _from_email: senderEmail.trim(),
            _sender_domain:
              senderDomain.trim(),
            _target_user_id:
              audience === "user"
                ? targetUserId.trim()
                : null,
          },
        );

      if (error) {
        throw new Error(
          error.message ||
            "Could not queue email.",
        );
      }

      return data as BroadcastResponse;
    },

    onSuccess: (data) => {
      toast.success(
        data?.message ||
          `${data?.queued ?? 0} email(s) queued.`,
      );

      setSubject("");
      setBody("");
    },

    onError: (error: Error) => {
      if (error.message === "SEND_CANCELLED") {
        return;
      }

      toast.error(error.message);
    },
  });

  const recipientCount =
    countQuery.data?.count ?? 0;

  // Read OAuth callback result from the URL.
  const params = new URLSearchParams(
    window.location.search,
  );

  const gmailResult =
    params.get("gmail");

  const gmailEmail =
    params.get("email");

  if (
    gmailResult === "connected" &&
    gmailEmail &&
    gmailStatus !== "connected"
  ) {
    setGmailStatus("connected");
    setConnectedGmail(gmailEmail);
  }  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />

              <h1 className="font-display text-2xl font-bold sm:text-3xl">
                Email Center
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Send individual Gmail messages or platform-wide
              JEE Prep Hub announcements.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => countQuery.refetch()}
            disabled={
              countQuery.isFetching ||
              !countEnabled
            }
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                countQuery.isFetching
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh count
          </Button>
        </div>

        {/* Gmail Connection */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />

            <div>
              <h2 className="font-semibold">
                Personal Gmail
              </h2>

              <p className="text-xs text-muted-foreground">
                Connect a Gmail account for individual admin emails.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
            {gmailStatus === "connected" &&
            connectedGmail ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Connected account
                  </p>

                  <p className="mt-1 font-semibold">
                    {connectedGmail}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Gmail is ready for individual messages.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-500/10 dark:bg-green-400/15 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                    Connected
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    No Gmail account connected
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Google will ask you to authorize Gmail sending.
                  </p>
                </div>

                <Button
                  onClick={() =>
                    connectGmail.mutate()
                  }
                  disabled={
                    connectGmail.isPending
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />

                  {connectGmail.isPending
                    ? "Opening Google..."
                    : "Connect Gmail"}
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-amber-500/30 dark:border-amber-300/30 bg-amber-500/5 dark:bg-amber-500/10 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

              <p className="text-xs text-muted-foreground">
                Your Gmail password is never stored by JEE Prep Hub.
                Google handles the authorization, while the server
                securely stores an encrypted refresh token.
              </p>
            </div>
          </div>
        </section>

        {/* Personal Gmail Composer */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-primary" />

            <div>
              <h2 className="font-semibold">
                Send individual Gmail
              </h2>

              <p className="text-xs text-muted-foreground">
                Send a message directly from the connected Gmail account.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="gmail-to"
                className="mb-2 block text-sm font-medium"
              >
                Recipient email
              </label>

              <Input
                id="gmail-to"
                type="email"
                value={gmailTo}
                onChange={(event) =>
                  setGmailTo(event.target.value)
                }
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="gmail-subject"
                className="mb-2 block text-sm font-medium"
              >
                Subject
              </label>

              <Input
                id="gmail-subject"
                value={gmailSubject}
                maxLength={200}
                onChange={(event) =>
                  setGmailSubject(
                    event.target.value,
                  )
                }
                placeholder="JEE Prep Hub"
              />

              <p className="mt-1 text-right text-xs text-muted-foreground">
                {gmailSubject.length}/200
              </p>
            </div>

            <div>
              <label
                htmlFor="gmail-body"
                className="mb-2 block text-sm font-medium"
              >
                Message
              </label>

              <Textarea
                id="gmail-body"
                value={gmailBody}
                maxLength={20000}
                onChange={(event) =>
                  setGmailBody(
                    event.target.value,
                  )
                }
                placeholder="Write your message..."
                rows={10}
              />

              <p className="mt-1 text-right text-xs text-muted-foreground">
                {gmailBody.length}/20000
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() =>
                  gmailSend.mutate()
                }
                disabled={
                  gmailSend.isPending ||
                  gmailStatus !== "connected" ||
                  !gmailTo.trim() ||
                  !gmailSubject.trim() ||
                  !gmailBody.trim()
                }
              >
                <Send className="mr-2 h-4 w-4" />

                {gmailSend.isPending
                  ? "Sending..."
                  : "Send with Gmail"}
              </Button>
            </div>
          </div>
        </section>

        {/* Existing Broadcast Email System */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />

            <div>
              <h2 className="font-semibold">
                JEE Prep Hub Email Broadcast
              </h2>

              <p className="text-xs text-muted-foreground">
                Use the existing transactional email infrastructure
                for announcements.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Audience
              </label>

              <Select
                value={audience}
                onValueChange={(value: Audience) =>
                  setAudience(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="verified">
                    All verified users
                  </SelectItem>

                  <SelectItem value="all">
                    All registered users
                  </SelectItem>

                  <SelectItem value="user">
                    Specific user
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {audience === "user" && (
              <div>
                <label
                  htmlFor="target-user"
                  className="mb-2 block text-sm font-medium"
                >
                  User ID
                </label>

                <Input
                  id="target-user"
                  value={targetUserId}
                  onChange={(event) =>
                    setTargetUserId(
                      event.target.value,
                    )
                  }
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Get the UUID from Admin → Users.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
              {countQuery.isLoading ||
              countQuery.isFetching ? (
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Users className="h-5 w-5 text-primary" />
              )}

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Eligible recipients
                </p>

                <p className="font-display text-2xl font-bold">
                  {countEnabled
                    ? recipientCount
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Sender */}
          <div className="mt-6 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />

              <div>
                <h3 className="font-semibold">
                  Sender
                </h3>

                <p className="text-xs text-muted-foreground">
                  Sender identity for the existing app email system.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="sender-email"
                  className="mb-2 block text-sm font-medium"
                >
                  Sender email
                </label>

                <Input
                  id="sender-email"
                  type="email"
                  value={senderEmail}
                  onChange={(event) =>
                    setSenderEmail(
                      event.target.value,
                    )
                  }
                  placeholder="noreply@your-domain.com"
                />
              </div>

              <div>
                <label
                  htmlFor="sender-domain"
                  className="mb-2 block text-sm font-medium"
                >
                  Verified sender domain
                </label>

                <Input
                  id="sender-domain"
                  value={senderDomain}
                  onChange={(event) =>
                    setSenderDomain(
                      event.target.value,
                    )
                  }
                  placeholder="notify.your-domain.com"
                />
              </div>
            </div>
          </div>

          {/* Broadcast composer */}
          <div className="mt-6 border-t border-border pt-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium"
                >
                  Subject
                </label>

                <Input
                  id="subject"
                  value={subject}
                  maxLength={200}
                  onChange={(event) =>
                    setSubject(
                      event.target.value,
                    )
                  }
                  placeholder="Important JEE Prep Hub announcement"
                />

                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {subject.length}/200
                </p>
              </div>

              <div>
                <label
                  htmlFor="body"
                  className="mb-2 block text-sm font-medium"
                >
                  Message
                </label>

                <Textarea
                  id="body"
                  value={body}
                  maxLength={20000}
                  onChange={(event) =>
                    setBody(event.target.value)
                  }
                  placeholder="Write your announcement here..."
                  rows={10}
                />

                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {body.length}/20000
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Broadcast send */}
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">
                Ready to send broadcast
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {recipientCount} eligible recipient
                {recipientCount === 1 ? "" : "s"} will
                receive this email.
              </p>
            </div>

            <Button
              size="lg"
              onClick={() =>
                broadcastEmail.mutate()
              }
              disabled={
                broadcastEmail.isPending ||
                !countEnabled ||
                recipientCount <= 0 ||
                !subject.trim() ||
                !body.trim() ||
                !senderEmail.trim() ||
                !senderDomain.trim()
              }
            >
              <Send className="mr-2 h-4 w-4" />

              {broadcastEmail.isPending
                ? "Queueing..."
                : "Send broadcast"}
            </Button>
          </div>
        </section>

        {broadcastEmail.data && (
          <section className="rounded-xl border border-green-500/30 dark:border-green-300/30 bg-green-500/5 dark:bg-green-500/10 dark:bg-green-400/15 p-4">
            <p className="font-semibold">
              Broadcast queued
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Queued:{" "}
              {broadcastEmail.data.queued ?? 0}
              {" · "}
              Skipped:{" "}
              {broadcastEmail.data.skipped ?? 0}
            </p>
          </section>
        )}

        {gmailSend.data && (
          <section className="rounded-xl border border-green-500/30 dark:border-green-300/30 bg-green-500/5 dark:bg-green-500/10 dark:bg-green-400/15 p-4">
            <p className="font-semibold">
              Gmail message sent
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              From:{" "}
              {gmailSend.data.from ?? "Connected Gmail"}
              {" · "}
              To:{" "}
              {gmailSend.data.to ?? gmailTo}
            </p>
          </section>
        )}

        {/* Security notice */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

            <div>
              <p className="font-medium">
                Security
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Gmail OAuth credentials and refresh tokens are
                handled server-side. They are never placed in
                browser code, email forms, or GitHub source files.
              </p>
            </div>
          </div>
        </section>

      </div>
    </AppShell>
  );
}