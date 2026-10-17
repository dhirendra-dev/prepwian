// @ts-nocheck -- depends on untyped certificate request responses
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getWhatsappChannelStatus,
  claimWhatsappChannelCertificate,
  WHATSAPP_CHANNEL_URL,
} from "@/lib/certificates.functions";
import { MessageCircle, Award, ExternalLink, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/follow-channel")({
  head: () => ({ meta: [
      { name: "description", content: "Follow the JEE Prep Hub WhatsApp channel for community updates." },
      { property: "og:title", content: "Follow WhatsApp Channel — JEE Prep Hub" },
      { property: "og:description", content: "Follow the JEE Prep Hub WhatsApp channel for community updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Follow WhatsApp Channel — JEE Prep Hub" },
      { name: "twitter:description", content: "Follow the JEE Prep Hub WhatsApp channel for community updates." },
{ title: "Follow WhatsApp Channel — JEE Prep Hub" }] }),
  component: FollowChannelPage,
});

function FollowChannelPage() {
  const fetchStatus = useServerFn(getWhatsappChannelStatus);
  const claim = useServerFn(claimWhatsappChannelCertificate);
  const qc = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);
  const [opened, setOpened] = useState(false);

  const q = useQuery({
    queryKey: ["whatsapp-channel-status"],
    queryFn: () => fetchStatus(),
  });

  const m = useMutation({
    mutationFn: () => claim({ data: { confirmed: true } }),
    onSuccess: (r) => {
      if (r.alreadyClaimed) toast.info("You've already claimed this certificate.");
      else if (r.alreadyRequested) toast.info("Your request is already awaiting review.");
      else
        toast.success("Request submitted. The team will review it before issuing a certificate.");
      qc.invalidateQueries({ queryKey: ["whatsapp-channel-status"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not claim certificate"),
  });

  const claimed = !!q.data?.claimed;
  const requested = !!q.data?.request;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="text-center">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 text-green-600">
            <MessageCircle className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Follow Our WhatsApp Channel
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Get instant updates, study tips, and motivation — plus earn an exclusive certificate for
            being part of our official channel.
          </p>
        </header>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-500/10 text-green-600 font-bold">
              1
            </span>
            <div className="flex-1">
              <h2 className="font-semibold">Open the channel & tap Follow</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tap the button below to open our official WhatsApp channel, then hit the{" "}
                <strong>Follow</strong> button at the top.
              </p>
              <a
                href={WHATSAPP_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpened(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" /> Open WhatsApp Channel{" "}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent font-bold">
              2
            </span>
            <div className="flex-1">
              <h2 className="font-semibold">Confirm & request certificate review</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                After following, submit a request for the <strong>WhatsApp Channel Follower</strong>
                certificate. An administrator verifies requests before any award is issued.
              </p>

              {claimed ? (
                <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Certificate already earned!</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Awarded{" "}
                    {q.data?.certificate?.awarded_at
                      ? new Date(q.data.certificate.awarded_at).toLocaleDateString()
                      : ""}
                  </p>
                  <Link
                    to="/certificates"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <Award className="h-4 w-4" /> View & download
                  </Link>
                </div>
              ) : requested ? (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="font-semibold">
                    Request {q.data?.request?.status === "rejected" ? "reviewed" : "received"}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {q.data?.request?.status === "rejected"
                      ? "This request was not approved. Contact the JEE Prep Hub team if you have new evidence."
                      : "Your request is awaiting staff verification. The certificate will appear only if approved."}
                  </p>
                </div>
              ) : (
                <>
                  <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <Checkbox
                      checked={confirmed}
                      onCheckedChange={(v) => setConfirmed(!!v)}
                      className="mt-0.5"
                    />
                    <span>
                      I confirm that I have followed the official JEE Prep Hub WhatsApp channel.
                    </span>
                  </label>
                  {!opened && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Tip: open the channel link above first, tap Follow, then return here.
                    </p>
                  )}
                  <Button
                    onClick={() => m.mutate()}
                    disabled={!confirmed || m.isPending || q.isLoading}
                    className="mt-3 w-full sm:w-auto"
                  >
                    <Sparkles className="mr-1 h-4 w-4" />
                    {m.isPending ? "Submitting request…" : "Request certificate review"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          Claims are requests, not awards. Only an authorized administrator can issue the
          certificate after verification.
        </div>
      </div>
    </AppShell>
  );
}
