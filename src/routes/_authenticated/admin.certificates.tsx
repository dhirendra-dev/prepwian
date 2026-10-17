import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { requirePermission } from "@/lib/admin-guard";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Award,
  Copy,
  ExternalLink,
  Eye,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  adminAwardCertificate,
  adminListAwardRequests,
  adminListCertificateTypes,
  adminListCustomCertificates,
  adminResolveAwardRequest,
  adminRevokeCertificate,
  adminSaveCertificateType,
  type CertificateType,
} from "@/lib/certificates.functions";
import {
  CERTIFICATE_CATEGORIES,
  CERTIFICATE_PRESETS,
  DETAIL_FIELD_CATALOG,
  ELIGIBILITY_METRICS,
  fieldsForKeys,
  type CertificateDetailField,
  type CertificateKind,
  type CertificateTemplateKey,
  type EligibilityMetric,
} from "@/lib/certificate-catalog";
import { generateCertificatePdf } from "@/lib/certificate-pdf";

export const Route = createFileRoute("/_authenticated/admin/certificates")({
  head: () => ({ meta: [{ title: "Admin · Certificates — PREPWIAN" }] }),
  ssr: false,
  beforeLoad: async ({ context }) => {
    await requirePermission(context.user.id, "certificates");
  },
  component: AdminCertificates,
});

type TypeForm = {
  id?: string;
  code: string;
  name: string;
  description: string;
  subtitle: string;
  category: string;
  icon: string;
  sort_order: string;
  template_key: CertificateTemplateKey;
  certificate_kind: CertificateKind;
  issuer_name: string;
  detail_fields: CertificateDetailField[];
  is_enabled: boolean;
  eligibility_mode: "manual" | "automatic";
  metric: EligibilityMetric;
  threshold: string;
  subject: string;
};
const blankType: TypeForm = {
  code: "",
  name: "",
  description: "",
  subtitle: "",
  category: "recognition",
  icon: "Award",
  sort_order: "100",
  template_key: "ornate",
  certificate_kind: "appreciation",
  issuer_name: "PREPWIAN Team",
  detail_fields: [],
  is_enabled: true,
  eligibility_mode: "manual",
  metric: "daily_streak_days",
  threshold: "7",
  subject: "",
};
type IssueForm = {
  user_email: string;
  certificate_type_id: string;
  title: string;
  description: string;
  category: string;
  template_key: CertificateTemplateKey;
  certificate_kind: CertificateKind;
  issuer_name: string;
  exam_category: string;
  test_name: string;
  rank_text: string;
  score: string;
  maximum_marks: string;
  award_reason: string;
  details: Record<string, string>;
};
const blankIssue: IssueForm = {
  user_email: "",
  certificate_type_id: "",
  title: "",
  description: "",
  category: "recognition",
  template_key: "ornate",
  certificate_kind: "appreciation",
  issuer_name: "PREPWIAN Team",
  exam_category: "",
  test_name: "",
  rank_text: "",
  score: "",
  maximum_marks: "",
  award_reason: "",
  details: {},
};
const templateOptions: { value: CertificateTemplateKey; label: string }[] = [
  { value: "ornate", label: "Ornate Navy & Gold" },
  { value: "membership", label: "Membership" },
  { value: "streak", label: "Focus & Streak" },
  { value: "academic", label: "Academic" },
  { value: "test-series", label: "Test Series" },
  { value: "course", label: "Course Completion" },
  { value: "community", label: "Community & Events" },
  { value: "recognition", label: "Special Recognition" },
];

function configToForm(type: CertificateType): TypeForm {
  const eligibility = type.eligibility_config;
  return {
    id: type.id,
    code: type.code,
    name: type.name,
    description: type.description,
    subtitle: type.subtitle ?? "",
    category: type.category,
    icon: type.icon ?? "Award",
    sort_order: String(type.sort_order),
    template_key: type.template_key ?? "ornate",
    certificate_kind: type.certificate_kind ?? "achievement",
    issuer_name: type.issuer_name ?? "PREPWIAN Team",
    detail_fields: Array.isArray(type.detail_fields) ? type.detail_fields : [],
    is_enabled: type.is_enabled !== false,
    eligibility_mode: eligibility?.mode ?? "manual",
    metric: eligibility?.mode === "automatic" ? eligibility.metric : "daily_streak_days",
    threshold:
      eligibility?.mode === "automatic"
        ? String(eligibility.threshold)
        : String(type.threshold ?? 7),
    subject: eligibility?.mode === "automatic" ? (eligibility.subject ?? "") : "",
  };
}
function presetToForm(preset: (typeof CERTIFICATE_PRESETS)[number]): TypeForm {
  return {
    ...blankType,
    code: preset.code,
    name: preset.name,
    description: preset.description,
    subtitle: preset.subtitle,
    category: preset.category,
    icon: preset.icon,
    template_key: preset.templateKey,
    certificate_kind: preset.certificateKind,
    detail_fields: fieldsForKeys(preset.fields),
    eligibility_mode: preset.eligibility?.mode ?? "manual",
    metric:
      preset.eligibility?.mode === "automatic" ? preset.eligibility.metric : "daily_streak_days",
    threshold:
      preset.eligibility?.mode === "automatic" ? String(preset.eligibility.threshold) : "7",
    subject: preset.eligibility?.mode === "automatic" ? (preset.eligibility.subject ?? "") : "",
    is_enabled: true,
  };
}
function sampleDetails(fields: CertificateDetailField[]) {
  const examples: Record<string, string> = {
    membership_type: "Community Member",
    member_since: "12 October 2026",
    membership_duration: "365 days",
    join_date: "12 October 2025",
    community_name: "PREPWIAN",
    consecutive_days: "30 days",
    completed_pomodoro_sessions: "120 sessions",
    achievement_period: "September–October 2026",
    total_verified_study_hours: "250 hours",
    total_study_hours: "250 hours",
    sessions_completed: "86 sessions",
    subject: "Physics",
    achievement: "Completed all tracked topics",
    topics_completed: "42 topics",
    topics_mastered: "42 topics",
    mastery_percentage: "100%",
    test_name: "JEE Advanced Mock 04",
    exam_category: "JEE Advanced",
    score: "285",
    maximum_marks: "300",
    percentage: "95%",
    rank: "AIR 12",
    competition_name: "National Mock Challenge",
    total_participants: "2,400",
    course_name: "Problem Solving Masterclass",
    modules_completed: "12 / 12",
    completion_date: "12 October 2026",
    challenge_name: "30-Day Revision Challenge",
    duration: "30 days",
    completion_rate: "100%",
    contribution_type: "Doubt solving",
    verified_contributions: "24",
    recognition_reason: "Outstanding community support",
    issuing_authority: "PREPWIAN Academic Team",
    chapter_name: "Electrostatics",
    pyq_count: "120 questions",
  };
  return fields
    .filter((field) => field.visible)
    .map((field) => ({
      key: field.key,
      label: field.label,
      value: examples[field.key] ?? "Sample detail",
    }));
}
function AdminCertificates() {
  const qc = useQueryClient();
  const listTypesFn = useServerFn(adminListCertificateTypes);
  const saveTypeFn = useServerFn(adminSaveCertificateType);
  const listFn = useServerFn(adminListCustomCertificates);
  const awardFn = useServerFn(adminAwardCertificate);
  const revokeFn = useServerFn(adminRevokeCertificate);
  const requestsFn = useServerFn(adminListAwardRequests);
  const resolveRequestFn = useServerFn(adminResolveAwardRequest);
  const types = useQuery({ queryKey: ["admin-certificate-types"], queryFn: () => listTypesFn() });
  const list = useQuery({ queryKey: ["admin-custom-certs"], queryFn: () => listFn() });
  const requests = useQuery({
    queryKey: ["admin-certificate-requests"],
    queryFn: () => requestsFn(),
  });
  const [typeForm, setTypeForm] = useState<TypeForm>(blankType);
  const [issueForm, setIssueForm] = useState<IssueForm>(blankIssue);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [requestReasons, setRequestReasons] = useState<Record<string, string>>({});
  const [requestDetails, setRequestDetails] = useState<Record<string, Record<string, string>>>({});
  const saveType = useMutation({
    mutationFn: () =>
      saveTypeFn({
        data: {
          id: typeForm.id,
          code: typeForm.code,
          name: typeForm.name,
          description: typeForm.description,
          subtitle: typeForm.subtitle,
          category: typeForm.category as never,
          threshold: typeForm.eligibility_mode === "automatic" ? Number(typeForm.threshold) : null,
          icon: typeForm.icon || null,
          sort_order: Number(typeForm.sort_order) || 0,
          template_key: typeForm.template_key,
          certificate_kind: typeForm.certificate_kind,
          issuer_name: typeForm.issuer_name,
          detail_fields: typeForm.detail_fields,
          eligibility_config:
            typeForm.eligibility_mode === "automatic"
              ? {
                  mode: "automatic" as const,
                  metric: typeForm.metric,
                  threshold: Number(typeForm.threshold),
                  ...(typeForm.subject ? { subject: typeForm.subject } : {}),
                }
              : { mode: "manual" as const },
          is_enabled: typeForm.is_enabled,
        },
      }),
    onSuccess: (row) => {
      toast.success(
        typeForm.id && row.id !== typeForm.id
          ? "New type version saved; existing certificates remain unchanged"
          : typeForm.id
            ? "Certificate type updated"
            : "Certificate type created",
      );
      setTypeForm(configToForm(row));
      qc.invalidateQueries({ queryKey: ["admin-certificate-types"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save type"),
  });
  const award = useMutation({
    mutationFn: () =>
      awardFn({
        data: {
          user_email: issueForm.user_email,
          certificate_type_id: issueForm.certificate_type_id || null,
          title: issueForm.title,
          description: issueForm.description,
          category: issueForm.category,
          template_key: issueForm.template_key,
          certificate_kind: issueForm.certificate_kind,
          issuer_name: issueForm.issuer_name,
          exam_category: issueForm.exam_category,
          test_name: issueForm.test_name,
          rank_text: issueForm.rank_text,
          score: issueForm.score ? Number(issueForm.score) : null,
          maximum_marks: issueForm.maximum_marks ? Number(issueForm.maximum_marks) : null,
          details: issueForm.details,
          award_reason: issueForm.award_reason,
        },
      }),
    onSuccess: () => {
      toast.success("Certificate issued; verification history saved");
      setIssueForm(blankIssue);
      qc.invalidateQueries({ queryKey: ["admin-custom-certs"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not issue certificate"),
  });
  const revoke = useMutation({
    mutationFn: (id: string) =>
      revokeFn({ data: { id, reason: "Revoked by certificate administrator" } }),
    onSuccess: () => {
      toast.success("Certificate revoked; verification history retained");
      qc.invalidateQueries({ queryKey: ["admin-custom-certs"] });
    },
    onError: () => toast.error("Could not revoke certificate"),
  });
  const resolveRequest = useMutation({
    mutationFn: (data: {
      id: string;
      decision: "approve" | "reject";
      reason: string;
      details: Record<string, string>;
    }) => resolveRequestFn({ data }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.decision === "approve" ? "Award approved and issued" : "Request rejected",
      );
      qc.invalidateQueries({ queryKey: ["admin-certificate-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-custom-certs"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not review request"),
  });
  const awardType = useMemo(
    () => types.data?.find((type) => type.id === issueForm.certificate_type_id),
    [types.data, issueForm.certificate_type_id],
  );
  const patchType = (patch: Partial<TypeForm>) =>
    setTypeForm((current) => ({ ...current, ...patch }));
  const patchIssue = (patch: Partial<IssueForm>) =>
    setIssueForm((current) => ({ ...current, ...patch }));
  const input = (key: keyof IssueForm, label: string, placeholder = "", type = "text") => (
    <div className="space-y-1.5" key={key}>
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={String(issueForm[key] ?? "")}
        onChange={(event) => patchIssue({ [key]: event.target.value } as Partial<IssueForm>)}
        placeholder={placeholder}
        maxLength={key === "user_email" ? undefined : 120}
      />
    </div>
  );
  const typePreview = {
    title: typeForm.name || "Certificate title",
    description: typeForm.description || "Certificate achievement details",
    subtitle: typeForm.subtitle,
    category:
      CERTIFICATE_CATEGORIES.find((category) => category.value === typeForm.category)?.label ??
      typeForm.category,
    template_key: typeForm.template_key,
    certificate_kind: typeForm.certificate_kind,
    issuer_name: typeForm.issuer_name,
    exam_category: "JEE Advanced",
    test_name: "Sample Test",
    rank_text: "",
    score: "",
    maximum_marks: "",
  };

  return (
    <AppShell>
      <nav className="mx-auto mb-6 flex max-w-6xl flex-wrap gap-2">
        <Link to="/admin/materials" className="rounded-md border border-border px-3 py-1.5 text-xs">
          Materials
        </Link>
        <Link to="/admin/community" className="rounded-md border border-border px-3 py-1.5 text-xs">
          Community
        </Link>
        <Link
          to="/admin/certificates"
          className="rounded-md bg-accent px-3 py-1.5 text-xs text-accent-foreground"
        >
          Certificates
        </Link>
        <Link to="/admin/users" className="rounded-md border border-border px-3 py-1.5 text-xs">
          Users
        </Link>
        <Link to="/admin/audit" className="rounded-md border border-border px-3 py-1.5 text-xs">
          Audit Log
        </Link>
      </nav>
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="font-display text-2xl font-bold">Certificate Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure reusable definitions and eligibility first; a definition alone never issues an
            award.
          </p>
        </header>

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Certificate type definitions</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose a preset to populate the editor; it is saved only when you press Save.
                Deactivate instead of deleting definitions with award history.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTypeForm(blankType);
                setSelectedPreset("");
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> New definition
            </Button>
          </div>
          <div className="mt-4 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start from category preset</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedPreset}
                    onChange={(event) => {
                      setSelectedPreset(event.target.value);
                      const row = CERTIFICATE_PRESETS.find(
                        (item) => item.code === event.target.value,
                      );
                      if (row) setTypeForm(presetToForm(row));
                    }}
                  >
                    <option value="">Choose a preset…</option>
                    {CERTIFICATE_CATEGORIES.filter((category) => category.value !== "custom").map(
                      (category) => (
                        <optgroup key={category.value} label={category.label}>
                          {CERTIFICATE_PRESETS.filter((row) => row.category === category.value).map(
                            (row) => (
                              <option key={row.code} value={row.code}>
                                {row.name}
                              </option>
                            ),
                          )}
                        </optgroup>
                      ),
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Edit saved definition</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={typeForm.id ?? ""}
                    onChange={(event) => {
                      const row = types.data?.find((item) => item.id === event.target.value);
                      if (row) {
                        setTypeForm(configToForm(row));
                        setSelectedPreset("");
                      } else if (!event.target.value) setTypeForm(blankType);
                    }}
                  >
                    <option value="">New definition</option>
                    {types.data?.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.is_enabled ? "●" : "○"} {row.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ConfigInput
                  label="Stable type code"
                  value={typeForm.code}
                  disabled={!!typeForm.id}
                  onChange={(value) =>
                    patchType({ code: value.toLowerCase().replace(/[^a-z0-9_]+/g, "_") })
                  }
                />
                <ConfigInput
                  label="Certificate title"
                  value={typeForm.name}
                  onChange={(name) => patchType({ name })}
                />
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    rows={2}
                    maxLength={500}
                    value={typeForm.description}
                    onChange={(event) => patchType({ description: event.target.value })}
                  />
                </div>
                <ConfigInput
                  label="Subtitle / award line"
                  value={typeForm.subtitle}
                  onChange={(subtitle) => patchType({ subtitle })}
                />
                <ConfigInput
                  label="Issuer name"
                  value={typeForm.issuer_name}
                  onChange={(issuer_name) => patchType({ issuer_name })}
                />
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={typeForm.category}
                    onChange={(event) => patchType({ category: event.target.value })}
                  >
                    {CERTIFICATE_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reusable layout</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={typeForm.template_key}
                    onChange={(event) =>
                      patchType({ template_key: event.target.value as CertificateTemplateKey })
                    }
                  >
                    {templateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Certificate tone</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={typeForm.certificate_kind}
                    onChange={(event) =>
                      patchType({ certificate_kind: event.target.value as CertificateKind })
                    }
                  >
                    {["achievement", "participation", "completion", "appreciation"].map((kind) => (
                      <option key={kind} value={kind}>
                        {kind}
                      </option>
                    ))}
                  </select>
                </div>
                <ConfigInput
                  label="Icon key"
                  value={typeForm.icon}
                  onChange={(icon) => patchType({ icon })}
                />
                <ConfigInput
                  label="Display order"
                  value={typeForm.sort_order}
                  type="number"
                  onChange={(sort_order) => patchType({ sort_order })}
                />
              </div>

              <fieldset className="rounded-lg border border-border p-3">
                <legend className="px-1 text-sm font-semibold">Award rules</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Issue method</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={typeForm.eligibility_mode}
                      onChange={(event) =>
                        patchType({
                          eligibility_mode: event.target.value as TypeForm["eligibility_mode"],
                        })
                      }
                    >
                      <option value="manual">Manual only — admin awards with reason</option>
                      <option value="automatic">Automatic — supported metric threshold</option>
                    </select>
                  </div>
                  {typeForm.eligibility_mode === "automatic" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Eligibility metric</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={typeForm.metric}
                          onChange={(event) =>
                            patchType({ metric: event.target.value as EligibilityMetric })
                          }
                        >
                          {ELIGIBILITY_METRICS.map((metric) => (
                            <option key={metric.value} value={metric.value}>
                              {metric.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {typeForm.metric !== "verified_member" &&
                        typeForm.metric !== "subject_mastery" && (
                          <ConfigInput
                            label="Required threshold"
                            value={typeForm.threshold}
                            type="number"
                            onChange={(threshold) => patchType({ threshold })}
                          />
                        )}
                      {typeForm.metric === "subject_mastery" && (
                        <ConfigInput
                          label="Subject key/name"
                          value={typeForm.subject}
                          placeholder="Physics"
                          onChange={(subject) => patchType({ subject })}
                        />
                      )}
                    </>
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={typeForm.is_enabled}
                      onChange={(event) => patchType({ is_enabled: event.target.checked })}
                    />
                    Enabled for new display/awards
                  </label>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Only listed metrics are evaluated automatically. Test scores, ranks,
                  contributions, events and claims stay manual unless backed by a verified source.
                </p>
              </fieldset>

              <fieldset className="rounded-lg border border-border p-3">
                <legend className="px-1 text-sm font-semibold">Visible detail fields</legend>
                <p className="mb-3 text-[11px] text-muted-foreground">
                  Only selected fields with nonblank values print on the certificate. Required
                  fields block issue if empty; saved awards keep a label/value snapshot.
                </p>
                <div className="mb-3 flex gap-2">
                  <select
                    id="add-certificate-field"
                    className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="">Add a field…</option>
                    {DETAIL_FIELD_CATALOG.filter(
                      (field) =>
                        !typeForm.detail_fields.some((current) => current.key === field.key),
                    ).map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const select = document.getElementById(
                        "add-certificate-field",
                      ) as HTMLSelectElement | null;
                      const found = DETAIL_FIELD_CATALOG.find(
                        (field) => field.key === select?.value,
                      );
                      if (found) {
                        patchType({
                          detail_fields: [
                            ...typeForm.detail_fields,
                            {
                              key: found.key,
                              label: found.label,
                              order: typeForm.detail_fields.length,
                              visible: true,
                              required: false,
                            },
                          ],
                        });
                        select!.value = "";
                      }
                    }}
                  >
                    Add field
                  </Button>
                </div>
                <div className="space-y-2">
                  {typeForm.detail_fields.map((field, index) => (
                    <div
                      key={`${field.key}-${index}`}
                      className="grid gap-2 rounded-md bg-muted/30 p-2 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:items-center"
                    >
                      <Input
                        value={field.label}
                        maxLength={60}
                        aria-label={`Label for ${field.key}`}
                        onChange={(event) =>
                          patchType({
                            detail_fields: typeForm.detail_fields.map((current, i) =>
                              i === index ? { ...current, label: event.target.value } : current,
                            ),
                          })
                        }
                      />
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={field.visible}
                          onChange={(event) =>
                            patchType({
                              detail_fields: typeForm.detail_fields.map((current, i) =>
                                i === index
                                  ? { ...current, visible: event.target.checked }
                                  : current,
                              ),
                            })
                          }
                        />
                        Show
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) =>
                            patchType({
                              detail_fields: typeForm.detail_fields.map((current, i) =>
                                i === index
                                  ? { ...current, required: event.target.checked }
                                  : current,
                              ),
                            })
                          }
                        />
                        Required
                      </label>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Move ${field.label} up`}
                          disabled={index === 0}
                          onClick={() => {
                            const next = [...typeForm.detail_fields];
                            [next[index - 1], next[index]] = [next[index], next[index - 1]];
                            patchType({
                              detail_fields: next.map((item, order) => ({ ...item, order })),
                            });
                          }}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Move ${field.label} down`}
                          disabled={index === typeForm.detail_fields.length - 1}
                          onClick={() => {
                            const next = [...typeForm.detail_fields];
                            [next[index + 1], next[index]] = [next[index], next[index + 1]];
                            patchType({
                              detail_fields: next.map((item, order) => ({ ...item, order })),
                            });
                          }}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove detail field"
                        onClick={() =>
                          patchType({
                            detail_fields: typeForm.detail_fields
                              .filter((_, i) => i !== index)
                              .map((item, i) => ({ ...item, order: i })),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => saveType.mutate()}
                  disabled={
                    saveType.isPending ||
                    !typeForm.code ||
                    typeForm.name.length < 2 ||
                    !typeForm.description ||
                    (typeForm.eligibility_mode === "automatic" && Number(typeForm.threshold) <= 0)
                  }
                >
                  <Save className="mr-1 h-4 w-4" />
                  {saveType.isPending
                    ? "Saving…"
                    : typeForm.id
                      ? "Save changes"
                      : "Create certificate type"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setTypeForm(blankType)}>
                  Reset editor
                </Button>
              </div>
            </div>
            <CertificatePreview
              form={typePreview}
              details={sampleDetails(typeForm.detail_fields)}
            />
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="text-sm font-semibold">Saved definitions ({types.data?.length ?? 0})</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {types.data?.map((type) => (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => {
                    setTypeForm(configToForm(type));
                    setSelectedPreset("");
                  }}
                  className="rounded-lg border border-border p-3 text-left hover:border-accent"
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                    <span className="truncate">{type.name}</span>
                    <span className={type.is_enabled ? "text-green-600" : "text-muted-foreground"}>
                      {type.is_enabled ? "Enabled" : "Disabled"}
                    </span>
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {CERTIFICATE_CATEGORIES.find((category) => category.value === type.category)
                      ?.label ?? type.category}{" "}
                    · {type.eligibility_config.mode === "automatic" ? "Automatic" : "Manual"} ·{" "}
                    {type.detail_fields.filter((field) => field.visible).length} fields
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {(requests.data?.length ?? 0) > 0 && (
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <h2 className="font-display text-lg font-semibold">
              Award requests awaiting review ({requests.data?.length})
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              A self-report is a request, not an award. Verify evidence and enter a decision reason
              before approval or rejection.
            </p>
            <div className="mt-3 divide-y divide-border">
              {requests.data?.map((request) => (
                <div key={request.id} className="grid gap-3 py-4 md:grid-cols-[1fr_1.4fr]">
                  <div>
                    <p className="text-sm font-semibold">
                      {request.recipient_name} · {request.type?.name ?? "Certificate"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested {new Date(request.created_at).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs">{request.type?.description}</p>
                  </div>
                  <div className="space-y-2">
                    {request.type?.detail_fields
                      .filter((field) => field.visible)
                      .map((field) => (
                        <div key={field.key}>
                          <Label className="text-[11px]">
                            {field.label}
                            {field.required ? " *" : ""}
                          </Label>
                          <Input
                            value={requestDetails[request.id]?.[field.key] ?? ""}
                            onChange={(event) =>
                              setRequestDetails((current) => ({
                                ...current,
                                [request.id]: {
                                  ...current[request.id],
                                  [field.key]: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      ))}
                    <Textarea
                      rows={2}
                      maxLength={300}
                      placeholder="Required review/award reason (min 5 characters)"
                      value={requestReasons[request.id] ?? ""}
                      onChange={(event) =>
                        setRequestReasons((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={
                          resolveRequest.isPending ||
                          (requestReasons[request.id]?.trim().length ?? 0) < 5 ||
                          !!request.type?.detail_fields.some(
                            (field) =>
                              field.visible &&
                              field.required &&
                              !requestDetails[request.id]?.[field.key]?.trim(),
                          )
                        }
                        onClick={() =>
                          resolveRequest.mutate({
                            id: request.id,
                            decision: "approve",
                            reason: requestReasons[request.id],
                            details: requestDetails[request.id] ?? {},
                          })
                        }
                      >
                        Approve & issue
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          resolveRequest.isPending ||
                          (requestReasons[request.id]?.trim().length ?? 0) < 5
                        }
                        onClick={() =>
                          resolveRequest.mutate({
                            id: request.id,
                            decision: "reject",
                            reason: requestReasons[request.id],
                            details: {},
                          })
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Issue a manual award</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Manual awards always require an authorized certificate administrator, a verified
              recipient name and a reason. Type settings and detail labels are snapshotted at issue
              time.
            </p>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                award.mutate();
              }}
            >
              {input("user_email", "Student account email", "student@example.com", "email")}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Saved certificate type (optional for a custom award)
                </Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={issueForm.certificate_type_id}
                  onChange={(event) => {
                    const selected = types.data?.find((row) => row.id === event.target.value);
                    patchIssue({
                      certificate_type_id: selected?.id ?? "",
                      title: selected?.name ?? "",
                      description: selected?.description ?? "",
                      category: selected?.category ?? "recognition",
                      template_key: selected?.template_key ?? "ornate",
                      certificate_kind: selected?.certificate_kind ?? "appreciation",
                      issuer_name: selected?.issuer_name ?? "PREPWIAN Team",
                      details: {},
                    });
                  }}
                >
                  <option value="">Custom award</option>
                  {types.data
                    ?.filter((type) => type.is_enabled)
                    .map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} · {type.category}
                      </option>
                    ))}
                </select>
              </div>
              {awardType ? (
                <div className="rounded-md bg-muted/30 p-3 text-sm">
                  <strong>{awardType.name}</strong>
                  <p className="mt-1 text-xs text-muted-foreground">{awardType.description}</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {input("title", "Award title", "Outstanding contribution")}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      required
                      maxLength={500}
                      rows={2}
                      value={issueForm.description}
                      onChange={(event) => patchIssue({ description: event.target.value })}
                    />
                  </div>
                </>
              )}
              {awardType?.detail_fields
                .filter((field) => field.visible)
                .map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs">
                      {field.label}
                      {field.required ? " *" : ""}
                    </Label>
                    <Input
                      value={issueForm.details[field.key] ?? ""}
                      onChange={(event) =>
                        patchIssue({
                          details: { ...issueForm.details, [field.key]: event.target.value },
                        })
                      }
                      required={field.required}
                      maxLength={300}
                      placeholder={field.label}
                    />
                  </div>
                ))}
              {!awardType && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {input("exam_category", "Exam category (optional)")}
                    {input("test_name", "Test name (optional)")}
                    {input("rank_text", "Rank (only if verified)")}
                    {input("score", "Score (only if verified)", "", "number")}
                    {input("maximum_marks", "Maximum marks", "", "number")}
                    {input("issuer_name", "Issuer", "PREPWIAN Team")}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Certificate tone</Label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={issueForm.certificate_kind}
                        onChange={(event) =>
                          patchIssue({ certificate_kind: event.target.value as CertificateKind })
                        }
                      >
                        {["achievement", "participation", "completion", "appreciation"].map(
                          (kind) => (
                            <option key={kind}>{kind}</option>
                          ),
                        )}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Template</Label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={issueForm.template_key}
                        onChange={(event) =>
                          patchIssue({ template_key: event.target.value as CertificateTemplateKey })
                        }
                      >
                        {templateOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Required award reason</Label>
                <Textarea
                  required
                  minLength={5}
                  maxLength={300}
                  rows={2}
                  value={issueForm.award_reason}
                  onChange={(event) => patchIssue({ award_reason: event.target.value })}
                  placeholder="Describe the verified achievement or why this recognition is being granted."
                />
              </div>
              <IssuePreview issue={issueForm} type={awardType} />
              <Button
                type="submit"
                disabled={
                  award.isPending ||
                  !issueForm.user_email ||
                  !issueForm.award_reason.trim() ||
                  (!awardType && (!issueForm.title || !issueForm.description)) ||
                  (!!awardType &&
                    awardType.detail_fields.some(
                      (field) =>
                        field.visible && field.required && !issueForm.details[field.key]?.trim(),
                    )) ||
                  (!!issueForm.score &&
                    !!issueForm.maximum_marks &&
                    Number(issueForm.score) > Number(issueForm.maximum_marks))
                }
                className="w-full"
              >
                <Award className="mr-2 h-4 w-4" />
                {award.isPending ? "Issuing…" : "Issue certificate"}
              </Button>
            </form>
          </section>
          <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-semibold">
              Issued certificates ({list.data?.length ?? 0})
            </h2>
            {list.isLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading certificate history…</p>
            ) : list.isError ? (
              <p className="mt-4 text-sm text-destructive">Could not load certificates.</p>
            ) : (
              <div className="mt-4 max-h-[75vh] divide-y divide-border overflow-y-auto">
                {list.data?.map((certificate) => {
                  const url =
                    typeof window !== "undefined"
                      ? `${window.location.origin}/certificates/verify/${certificate.verification_code}`
                      : `/certificates/verify/${certificate.verification_code}`;
                  return (
                    <div
                      key={certificate.id}
                      className="flex items-start justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {certificate.title_snapshot ?? certificate.custom_title ?? "Certificate"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          To: {certificate.recipient_name ?? certificate.user_id.slice(0, 8)} ·{" "}
                          {certificate.category_snapshot ??
                            certificate.certificate_kind ??
                            "achievement"}{" "}
                          · {new Date(certificate.awarded_at).toLocaleDateString()}
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {certificate.description_snapshot ?? certificate.custom_description}
                        </p>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
                        >
                          Verify <ExternalLink className="h-3 w-3" />
                        </a>
                        <button
                          onClick={() => {
                            void navigator.clipboard.writeText(url);
                            toast.success("Verification link copied");
                          }}
                          className="ml-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                        >
                          <Copy className="h-3 w-3" />
                          Copy link
                        </button>
                        {certificate.revoked_at && (
                          <p className="mt-1 text-xs font-semibold text-destructive">
                            REVOKED · {new Date(certificate.revoked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {!certificate.revoked_at && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={revoke.isPending}
                          onClick={() => revoke.mutate(certificate.id)}
                          title="Revoke"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                {list.data?.length === 0 && (
                  <p className="py-6 text-sm text-muted-foreground">No certificates issued yet.</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
function ConfigInput({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
function CertificatePreview({
  form,
  details,
}: {
  form: {
    title: string;
    description: string;
    subtitle: string;
    category: string;
    template_key: string;
    certificate_kind: CertificateKind;
    issuer_name: string;
    exam_category?: string;
    test_name?: string;
    rank_text?: string;
    score?: string;
    maximum_marks?: string;
  };
  details: { key: string; label: string; value: string }[];
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let nextUrl = "";
    const timer = window.setTimeout(async () => {
      try {
        const bytes = await generateCertificatePdf({
          recipientName: "Sample Student",
          title: form.title || "Certificate title",
          description: form.description || "Certificate achievement details",
          subtitle: form.subtitle || "In recognition of this achievement",
          category: form.category,
          templateKey: form.template_key,
          awardedAt: new Date().toISOString(),
          verificationCode: "PREVIEW-2026",
          verifyUrl: `${window.location.origin}/certificates/verify/PREVIEW-2026`,
          certificateKind: form.certificate_kind,
          examCategory: form.exam_category || null,
          testName: form.test_name || null,
          rankText: form.rank_text || null,
          score: form.score ? Number(form.score) : null,
          maximumMarks: form.maximum_marks ? Number(form.maximum_marks) : null,
          issuerName: form.issuer_name,
          details,
        });
        nextUrl = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
        if (!cancelled) {
          setError(false);
          setUrl(nextUrl);
        } else URL.revokeObjectURL(nextUrl);
      } catch (cause) {
        console.error("[certificate-admin] preview generation failed", cause);
        if (!cancelled) {
          setError(true);
          setUrl("");
        }
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form, details]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return (
    <div className="overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5">
      <div className="border-b border-amber-500/20 p-3 text-xs">
        <strong className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> Realistic sample preview
        </strong>
        <p className="mt-1 text-muted-foreground">
          Sample values are illustrative only; award data is populated at issue time.
        </p>
      </div>
      {url ? (
        <iframe
          title="Certificate PDF preview"
          src={url}
          className="h-64 w-full bg-white sm:h-80"
        />
      ) : (
        <div className="grid h-40 place-items-center p-4 text-center text-xs text-muted-foreground">
          {error
            ? "Preview failed. Check browser console for generator diagnostics."
            : "Generating preview…"}
        </div>
      )}
    </div>
  );
}
function IssuePreview({ issue, type }: { issue: IssueForm; type?: CertificateType }) {
  const displayForm = {
    title: type?.name ?? issue.title,
    description: type?.description ?? issue.description,
    subtitle: type?.subtitle ?? "",
    category: type?.category ?? issue.category,
    template_key: type?.template_key ?? issue.template_key,
    certificate_kind: type?.certificate_kind ?? issue.certificate_kind,
    issuer_name: issue.issuer_name || type?.issuer_name || "PREPWIAN Team",
    exam_category: issue.exam_category,
    test_name: issue.test_name,
    rank_text: issue.rank_text,
    score: issue.score,
    maximum_marks: issue.maximum_marks,
  };
  const details = type
    ? type.detail_fields
        .filter((field) => field.visible)
        .map((field) => ({
          key: field.key,
          label: field.label,
          value: issue.details[field.key] ?? "Sample value",
        }))
    : [];
  return <CertificatePreview form={displayForm} details={details} />;
}
