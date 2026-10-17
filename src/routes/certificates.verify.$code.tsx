import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { verifyCertificate } from "@/lib/certificates.functions";
import { generateCertificatePdf, downloadCertificate } from "@/lib/certificate-pdf";
import { toast } from "sonner";
import { Award, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/certificates/verify/$code")({
  loader: async ({ params }) => {
    const res = await verifyCertificate({ data: { code: params.code } });
    if (!res.found) throw notFound();
    return res;
  },
  head: ({ loaderData }) => ({
    meta: [
      { property: "og:title", content: `Certificate · ${loaderData?.type?.name ?? loaderData?.certificate?.custom_title ?? "Verified"} — JEE Prep Hub` },
      { property: "og:description", content: `Verified certificate awarded to ${loaderData?.recipientName ?? "JEE Aspirant"} by JEE Prep Hub.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: `Certificate · ${loaderData?.type?.name ?? loaderData?.certificate?.custom_title ?? "Verified"} — JEE Prep Hub` },
      { name: "twitter:description", content: `Verified certificate awarded to ${loaderData?.recipientName ?? "JEE Aspirant"} by JEE Prep Hub.` },
      {
        title: `Certificate · ${loaderData?.type?.name ?? loaderData?.certificate?.custom_title ?? "Verified"} — JEE Prep Hub`,
      },
      {
        name: "description",
        content: `Verified certificate awarded to ${loaderData?.recipientName ?? "JEE Aspirant"} by JEE Prep Hub.`,
      },
    ],
  }),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <p className="text-sm text-muted-foreground">Could not load this certificate.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">Certificate not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This verification code is invalid.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-accent hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  ),
  component: Verify,
});

function Verify() {
  const { certificate, type, recipientName, status } = Route.useLoaderData();
  const [loading, setLoading] = useState(false);
  const title =
    certificate.title_snapshot ?? type?.name ?? certificate.custom_title ?? "Certificate";
  const description =
    certificate.description_snapshot ?? type?.description ?? certificate.custom_description ?? "";
  const detailSnapshot =
    certificate.details_snapshot &&
    typeof certificate.details_snapshot === "object" &&
    !Array.isArray(certificate.details_snapshot)
      ? (certificate.details_snapshot as { fields?: unknown }).fields
      : undefined;
  const details = Array.isArray(detailSnapshot)
    ? detailSnapshot.filter(
        (value): value is { key: string; label: string; value: string } =>
          !!value &&
          typeof value === "object" &&
          typeof (value as { key?: unknown }).key === "string" &&
          typeof (value as { label?: unknown }).label === "string" &&
          typeof (value as { value?: unknown }).value === "string" &&
          !!(value as { value: string }).value.trim(),
      )
    : [];
  const verifyUrl = typeof window !== "undefined" ? window.location.href : "";

  async function download() {
    setLoading(true);
    try {
      const bytes = await generateCertificatePdf({
        recipientName,
        title,
        description,
        awardedAt: certificate.awarded_at,
        verificationCode: certificate.verification_code,
        verifyUrl,
        subtitle: certificate.subtitle_snapshot ?? type?.subtitle,
        category: certificate.category_snapshot ?? type?.category,
        templateKey: certificate.template_key_snapshot ?? type?.template_key,
        details,
        certificateKind: certificate.certificate_kind,
        examCategory: certificate.exam_category,
        testName: certificate.test_name,
        rankText: certificate.rank_text,
        score: certificate.score,
        maximumMarks: certificate.maximum_marks,
        issuerName: certificate.issuer_name,
        revoked: status === "revoked",
      });
      downloadCertificate(bytes, `${title.replace(/\s+/g, "_")}_certificate.pdf`);
    } catch (error) {
      console.error("[certificate-verify] PDF button failed", {
        verificationCode: certificate.verification_code,
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      });
      toast.error("Could not create or open the certificate PDF. Please try again.", {
        description: error instanceof Error ? error.message : "Unexpected PDF error.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4 sm:p-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <Logo className="h-8 w-8 rounded bg-sidebar-foreground p-1" />
          <span className="font-display text-lg font-bold">JEE Prep Hub</span>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
          <div
            className={`flex items-center gap-2 text-sm font-semibold ${status === "revoked" ? "text-destructive" : "text-emerald-600"}`}
          >
            {status === "revoked" ? (
              <Award className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            {status === "revoked"
              ? "REVOKED — this certificate is not valid"
              : "Verified certificate"}
          </div>
          <div className="mt-6 flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-accent/10 text-accent">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {certificate.certificate_kind ?? "Achievement"}
                {certificate.exam_category ? ` · ${certificate.exam_category}` : ""}
                {certificate.test_name ? ` · ${certificate.test_name}` : ""}
              </p>
            </div>
          </div>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Awarded to</dt>
              <dd className="mt-1 font-display text-lg font-semibold">{recipientName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Awarded on</dt>
              <dd className="mt-1 font-display text-lg font-semibold">
                {new Date(certificate.awarded_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
            {(certificate.rank_text || certificate.score != null) &&
              !details.some((detail) => ["rank", "score"].includes(detail.key)) && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Verified result
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {certificate.rank_text ? `Rank ${certificate.rank_text}` : ""}
                    {certificate.rank_text && certificate.score != null ? " · " : ""}
                    {certificate.score != null
                      ? `Score ${certificate.score}${certificate.maximum_marks == null ? "" : ` / ${certificate.maximum_marks}`}`
                      : ""}
                  </dd>
                </div>
              )}
            {details.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Award details
                </dt>
                <dd className="mt-2 grid gap-3 sm:grid-cols-2">
                  {details.map((detail) => (
                    <div key={detail.key}>
                      <dt className="text-xs text-muted-foreground">{detail.label}</dt>
                      <dd className="mt-0.5 font-semibold">{detail.value}</dd>
                    </div>
                  ))}
                </dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Verification code
              </dt>
              <dd className="mt-1 font-mono text-lg font-semibold tracking-wider">
                {certificate.verification_code}
              </dd>
            </div>
          </dl>
          <Button
            onClick={download}
            disabled={loading || status === "revoked"}
            className="mt-8 w-full"
          >
            <Download className="mr-2 h-4 w-4" /> Download PDF certificate
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Issued by {certificate.issuer_name ?? type?.issuer_name ?? "JEE Prep Hub"} ·{" "}
          <Link to="/" className="text-accent hover:underline">
            Join the community
          </Link>
        </p>
      </div>
    </div>
  );
}
