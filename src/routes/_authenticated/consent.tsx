import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  LockKeyhole,
  MapPin,
  Smartphone,
  Globe,
  User,
  Users,
  Check,
  Loader2,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/consent")({
  head: () => ({
    meta: [
      { name: "description", content: "Review verification requirements for your restricted account." },
      { property: "og:title", content: "Restricted Account Verification — JEE Prep Hub" },
      { property: "og:description", content: "Review verification requirements for your restricted account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Restricted Account Verification — JEE Prep Hub" },
      { name: "twitter:description", content: "Review verification requirements for your restricted account." },

      {
        title: "Restricted Account Verification — JEE Prep Hub",
      },
      {
        name: "robots",
        content: "noindex",
      },
    ],
  }),
  component: ConsentPage,
});
type RestrictionStatus = {
  restricted?: boolean;
  status?: "restricted" | "pending_review" | "cleared";
  restriction_type?: string;
  required_version?: string;
  reason?: string;
};

type Captured = {
  user_agent?: string;
  platform?: string;
  os?: string;
  browser?: string;
  language?: string;
  timezone?: string;
  screen_size?: string;
  device_pixel_ratio?: number;

  ip_address?: string;
  ip_city?: string;
  ip_region?: string;
  ip_country?: string;
  ip_isp?: string;

  gps_latitude?: number;
  gps_longitude?: number;
  gps_accuracy?: number;
};

function detectBrowser(ua: string) {
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "Unknown";
}

function detectOS(ua: string) {
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iOS/.test(ua)) return "iOS";
  if (/Mac OS/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
}

function ConsentPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [statusCheckAttempt, setStatusCheckAttempt] = useState(0);
  const [restricted, setRestricted] = useState(false);
const [restrictionStatus, setRestrictionStatus] =
  useState<"restricted" | "pending_review" | "cleared">("cleared");
const [requiredVersion, setRequiredVersion] = useState("");
  const [reason, setReason] = useState("");

  const [captured, setCaptured] = useState<Captured>({});

  const [deviceStatus, setDeviceStatus] =
    useState<"idle" | "ok">("idle");

  const [ipStatus, setIpStatus] =
    useState<"idle" | "loading" | "ok" | "error">("idle");

  const [gpsStatus, setGpsStatus] =
    useState<"idle" | "loading" | "ok" | "denied">("idle");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    dob: "",
    address_line: "",
    city: "",
    state: "",
    pincode: "",
    school: "",
    class_level: "",
    parent_name: "",
    parent_phone: "",
  });

  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  /*
   * Check whether this account is actually restricted.
   */
  useEffect(() => {
    let mounted = true;

    const checkRestriction = async () => {
      try {
        const { data, error } = await supabase.rpc(
          "get_account_restriction_status"
        );

        if (error) {
          console.error(error);
          toast.error(
            "Unable to verify your account restriction."
          );

          if (mounted) setLoading(false);
          return;
        }

        const status = (data || {}) as RestrictionStatus;

        setRestricted(status.restricted === true);
setRestrictionStatus(
  status.status ||
    (status.restricted === true
      ? "restricted"
      : "cleared")
);
setRequiredVersion(status.required_version || "");
setReason(status.reason || "");
setLoading(false);
        setReason(status.reason || "");
        setLoading(false);
      } catch (error) {
        console.error(error);

        if (mounted) {
          toast.error(
            "Something went wrong while checking your account."
          );
          setLoading(false);
        }
      }
    };

    checkRestriction();

    return () => {
      mounted = false;
    };
  }, [user.id, statusCheckAttempt]);

  /*
   * Capture browser/device information.
   *
   * This is shown to the user and is only used in the
   * restricted-account verification flow.
   */
  const captureDevice = () => {
    if (deviceStatus === "ok") return;

    const ua = navigator.userAgent;

    setCaptured((current) => ({
      ...current,

      user_agent: ua,
      platform: navigator.platform,
      os: detectOS(ua),
      browser: detectBrowser(ua),
      language: navigator.language,
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen_size: `${window.screen.width}x${window.screen.height}`,
      device_pixel_ratio: window.devicePixelRatio,
    }));

    setDeviceStatus("ok");
  };

  /*
   * Retrieve network information through external IP
   * geolocation providers.
   *
   * User must explicitly start this action.
   */
  const captureIp = async () => {
    if (ipStatus === "ok") return;

    setIpStatus("loading");

    const providers = [
      async () => {
        const response = await fetch("https://ipwho.is/");
        const data = await response.json();

        if (
          data?.success === false
        ) {
          throw new Error("IP lookup failed");
        }

        return {
          ip_address: data.ip,
          ip_city: data.city,
          ip_region: data.region,
          ip_country: data.country,
          ip_isp: data.connection?.isp,
        };
      },

      async () => {
        const response = await fetch(
          "https://ipapi.co/json/"
        );

        const data = await response.json();

        if (data?.error) {
          throw new Error(
            data.reason || "IP lookup failed"
          );
        }

        return {
          ip_address: data.ip,
          ip_city: data.city,
          ip_region: data.region,
          ip_country: data.country_name,
          ip_isp: data.org,
        };
      },

      async () => {
        const response = await fetch(
          "https://ipinfo.io/json"
        );

        const data = await response.json();

        return {
          ip_address: data.ip,
          ip_city: data.city,
          ip_region: data.region,
          ip_country: data.country,
          ip_isp: data.org,
        };
      },
    ];

    for (const provider of providers) {
      try {
        const result = await provider();

        if (result.ip_address) {
          setCaptured((current) => ({
            ...current,
            ...result,
          }));

          setIpStatus("ok");
          return;
        }
      } catch (error) {
        console.warn(
          "[RestrictedConsent] IP provider failed:",
          error
        );
      }
    }

    setIpStatus("error");

    toast.error(
      "Unable to retrieve network information."
    );
  };

  /*
   * Request precise browser GPS permission.
   */
  const captureGps = () =>
    new Promise<boolean>((resolve) => {
      if (gpsStatus === "ok") {
        resolve(true);
        return;
      }

      if (!navigator.geolocation) {
        setGpsStatus("denied");
        resolve(false);
        return;
      }

      setGpsStatus("loading");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCaptured((current) => ({
            ...current,
            gps_latitude:
              position.coords.latitude,
            gps_longitude:
              position.coords.longitude,
            gps_accuracy:
              position.coords.accuracy,
          }));

          setGpsStatus("ok");
          resolve(true);
        },

        () => {
          setGpsStatus("denied");
          resolve(false);
        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      );
    });

  const updateForm = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /*
   * Current restriction configuration requires the
   * complete verification package.
   */
  const verificationComplete =
    deviceStatus === "ok" &&
    ipStatus === "ok" &&
    gpsStatus === "ok";

  const save = async () => {
  if (!accepted) {
    toast.error(
      "Please read and accept the consent before continuing."
    );
    return;
  }

  if (!verificationComplete) {
    toast.error(
      "Please complete device, network and GPS verification first."
    );
    return;
  }

  const requiredFields = {
    "Full name": form.full_name,
    "Phone": form.phone,
    "Date of birth": form.dob,
    "Address": form.address_line,
    "City": form.city,
    "State": form.state,
    "Pincode": form.pincode,
    "School / coaching": form.school,
    "Class / grade": form.class_level,
    "Parent / guardian name": form.parent_name,
    "Parent / guardian phone": form.parent_phone,
  };

  const missing = Object.entries(requiredFields)
    .filter(([, value]) => !value.trim())
    .map(([name]) => name);

  if (missing.length > 0) {
    toast.error(
      `Please complete: ${missing.join(", ")}`
    );
    return;
  }

  /*
   * Make sure all required technical information
   * was actually captured before submitting.
   */
  if (
    !captured.user_agent ||
    !captured.platform ||
    !captured.os ||
    !captured.browser ||
    !captured.language ||
    !captured.timezone ||
    !captured.screen_size ||
    captured.device_pixel_ratio === undefined
  ) {
    toast.error(
      "Device information is incomplete. Please capture it again."
    );
    return;
  }

  if (
    !captured.ip_address ||
    !captured.ip_country
  ) {
    toast.error(
      "Network information is incomplete. Please collect it again."
    );
    return;
  }

  if (
    captured.gps_latitude === undefined ||
    captured.gps_longitude === undefined ||
    captured.gps_accuracy === undefined
  ) {
    toast.error(
      "GPS information is incomplete. Please allow precise location access."
    );
    return;
  }

  setSaving(true);

  try {
    const { data, error } = await supabase.rpc(
      "complete_account_restriction_consent",
      {
        _full_name: form.full_name.trim(),
        _dob: form.dob || "",
        _state: form.state.trim(),

        _phone: form.phone.trim(),
        _address_line: form.address_line.trim(),
        _city: form.city.trim(),
        _pincode: form.pincode.trim(),
        _school: form.school.trim(),
        _class_level: form.class_level.trim(),
        _parent_name: form.parent_name.trim(),
        _parent_phone: form.parent_phone.trim(),

        _user_agent: captured.user_agent,
        _platform: captured.platform,
        _os: captured.os,
        _browser: captured.browser,
        _language: captured.language,
        _timezone: captured.timezone,
        _screen_size: captured.screen_size,
        _device_pixel_ratio:
          captured.device_pixel_ratio,

        _ip_address: captured.ip_address,
        _ip_city: captured.ip_city || "",
        _ip_region: captured.ip_region || "",
        _ip_country: captured.ip_country,
        _ip_isp: captured.ip_isp || "",

        _gps_latitude:
          captured.gps_latitude,
        _gps_longitude:
          captured.gps_longitude,
        _gps_accuracy:
          captured.gps_accuracy,
      }
    );

    if (error) {
      console.error(
        "[RestrictedConsent] Submission failed:",
        error
      );

      toast.error(
        error.message ||
          "Unable to submit verification."
      );

      setSaving(false);
      return;
    }

    console.log(
      "[RestrictedConsent] Verification submitted:",
      data
    );

    /*
     * Verify the database actually cleared the
     * restriction before allowing access.
     */
    const {
      data: statusData,
      error: statusError,
    } = await supabase.rpc(
      "get_account_restriction_status"
    );

    if (statusError) {
      console.error(
        "[RestrictedConsent] Final status check failed:",
        statusError
      );

      toast.error(
        "Verification was submitted, but we could not verify the final account status."
      );

      setSaving(false);
      return;
    }

    const status =
      (statusData || {}) as RestrictionStatus;

    if (status.restricted === true) {
  setRestrictionStatus(
    status.status || "pending_review"
  );

  setRequiredVersion(
    status.required_version || requiredVersion
  );

  setReason(
    status.reason ||
      "Verification submitted. Your account is awaiting admin approval."
  );

  setSaving(false);
  return;
    }

    toast.success(
      "Verification completed. Your account access has been restored."
    );

    navigate({
      to: "/dashboard",
      replace: true,
    });
  } catch (error) {
    console.error(
      "[RestrictedConsent] Unexpected submission error:",
      error
    );

    toast.error(
      "Something went wrong while submitting verification."
    );

    setSaving(false);
  }
};

  const signOut = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />

            <p className="text-sm text-muted-foreground">
              Checking account restriction…
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  /*
   * This page should only be used for restricted accounts.
   */
 if (restrictionStatus === "pending_review") {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-4">
        <div className="w-full rounded-3xl border border-amber-500/20 bg-card p-6 text-center shadow-soft sm:p-10">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-amber-600">
            Verification Submitted
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Awaiting Admin Approval
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            Your verification information has been successfully
            submitted. Your account will remain restricted until an
            administrator reviews and approves your submission.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-left">
            <p className="text-sm font-semibold">
              🔒 Access is still restricted
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Submitting verification does not automatically restore
              account access.
            </p>
          </div>

          {requiredVersion && (
            <p className="mt-5 text-xs text-muted-foreground">
              Verification version:{" "}
              <span className="font-medium">
                {requiredVersion}
              </span>
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setStatusCheckAttempt((attempt) => attempt + 1);
            }}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:bg-muted"
          >
            Check Approval Status
          </button>

          <button
            type="button"
            onClick={signOut}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>

        </div>
      </div>
    </AppShell>
  );
 }
  if (!restricted) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center p-4">
          <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
            <Check className="mx-auto h-12 w-12 text-emerald-500" />

            <h1 className="mt-4 text-2xl font-bold">
              No Active Restriction
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              This account does not currently require restricted-account
              verification.
            </p>

            <button
              onClick={() =>
                navigate({
                  to: "/dashboard",
                  replace: true,
                })
              }
              className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5">

        {/* Header */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <LockKeyhole className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                Restricted Account
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                Account Verification Required
              </h1>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your account currently has restricted access.
                Complete the verification and consent process below
                to request restoration of normal access.
              </p>
            </div>
          </div>

          {reason && (
            <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                <div>
                  <p className="text-sm font-semibold">
                    Restriction reason
                  </p>

                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {reason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {requiredVersion && (
            <p className="mt-4 text-xs text-muted-foreground">
              Required verification version:{" "}
              <span className="font-medium">
                {requiredVersion}
              </span>
            </p>
          )}
        </section>

        {/* Device */}
        <VerificationSection
          icon={Smartphone}
          title="Device & Browser Information"
          description="Information about the browser and device being used for this verification."
          status={deviceStatus === "ok" ? "completed" : "pending"}
          onAction={captureDevice}
          actionLabel="Capture device information"
        />

        {/* Network */}
        <VerificationSection
          icon={Globe}
          title="Network Information"
          description="IP address and approximate network/location information."
          status={
            ipStatus === "ok"
              ? "completed"
              : ipStatus === "loading"
                ? "loading"
                : ipStatus === "error"
                  ? "error"
                  : "pending"
          }
          onAction={captureIp}
          actionLabel="Collect network information"
        />

        {/* GPS */}
        <VerificationSection
          icon={MapPin}
          title="Precise Location"
          description="Your browser will ask for permission to provide your current GPS location."
          status={
            gpsStatus === "ok"
              ? "completed"
              : gpsStatus === "loading"
                ? "loading"
                : gpsStatus === "denied"
                  ? "error"
                  : "pending"
          }
          onAction={captureGps}
          actionLabel="Allow precise location"
        />

        {/* Personal */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Personal & Student Information
              </h2>

              <p className="text-xs text-muted-foreground">
                Required for restricted-account verification.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            <Field
              label="Full name"
              value={form.full_name}
              onChange={(v) =>
                updateForm("full_name", v)
              }
              required
            />

            <Field
              label="Phone"
              value={form.phone}
              onChange={(v) =>
                updateForm("phone", v)
              }
              type="tel"
              required
            />

            <Field
              label="Date of birth"
              value={form.dob}
              onChange={(v) =>
                updateForm("dob", v)
              }
              type="date"
              required
            />

            <Field
              label="Class / grade"
              value={form.class_level}
              onChange={(v) =>
                updateForm("class_level", v)
              }
              placeholder="e.g. Class 11"
              required
            />

            <Field
              label="School / coaching"
              value={form.school}
              onChange={(v) =>
                updateForm("school", v)
              }
              required
            />

            <Field
              label="Pincode"
              value={form.pincode}
              onChange={(v) =>
                updateForm("pincode", v)
              }
              required
            />

            <Field
              label="City"
              value={form.city}
              onChange={(v) =>
                updateForm("city", v)
              }
              required
            />

            <Field
              label="State"
              value={form.state}
              onChange={(v) =>
                updateForm("state", v)
              }
              required
            />

            <Field
              label="Address"
              value={form.address_line}
              onChange={(v) =>
                updateForm("address_line", v)
              }
              full
              required
            />
          </div>
        </section>

        {/* Guardian */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Parent / Guardian Information
              </h2>

              <p className="text-xs text-muted-foreground">
                Used as part of restricted-account review.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            <Field
              label="Parent / guardian name"
              value={form.parent_name}
              onChange={(v) =>
                updateForm("parent_name", v)
              }
              required
            />

            <Field
              label="Parent / guardian phone"
              value={form.parent_phone}
              onChange={(v) =>
                updateForm("parent_phone", v)
              }
              type="tel"
              required
            />

          </div>
        </section>

        {/* Consent */}
        <section className="rounded-3xl border border-primary/30 bg-primary/5 p-5 shadow-soft sm:p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
                            checked={accepted}
              onChange={(event) =>
                setAccepted(event.target.checked)
              }
              className="mt-1 h-4 w-4 shrink-0 accent-primary"
            />

            <span className="text-sm leading-6">
              I understand that this is a restricted-account
              verification process. I have reviewed the information
              requested above and consent to JEE Prep Hub collecting
              and processing the submitted information for the stated
              account verification and moderation purpose.
            </span>
          </label>
        </section>

        {/* Submit */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <button
            type="button"
            disabled={
              saving ||
              !accepted ||
              !verificationComplete
            }
            onClick={save}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting verification…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Submit Verification & Consent
              </>
            )}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={signOut}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-3.5 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </section>

      </div>
    </AppShell>
  );
}

function VerificationSection({
  icon: Icon,
  title,
  description,
  status,
  onAction,
  actionLabel,
}: {
  icon: typeof Smartphone;
  title: string;
  description: string;
  status:
    | "pending"
    | "loading"
    | "completed"
    | "error";
  onAction: () => void | Promise<void | boolean>;
  actionLabel: string;
}) {
  const completed = status === "completed";
  const loading = status === "loading";

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">
              {title}
            </h2>

            {completed && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                Captured
              </span>
            )}

            {status === "error" && (
              <span className="text-xs font-semibold text-destructive">
                Failed / denied
              </span>
            )}
          </div>

          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>

          <button
            type="button"
            disabled={completed || loading}
            onClick={onAction}
            className="mt-4 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Collecting…
              </span>
            ) : completed ? (
              "Captured"
            ) : (
              actionLabel
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  full = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  full?: boolean;
  required?: boolean;
}) {
  return (
    <label
      className={`block ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <span className="text-sm font-medium">
        {label}
        {required && (
          <span className="ml-1 text-destructive">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
                             }
