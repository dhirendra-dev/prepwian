 import { createFileRoute } from "@tanstack/react-router";
import { requireFullAdmin } from "@/lib/admin-guard";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  ShieldCheck,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/consent-settings")({
  head: () => ({
    meta: [
      { title: "Consent Settings — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),

  beforeLoad: async ({ context }) => {
    await requireFullAdmin(context.user.id);
  },

  component: AdminConsentSettings,
});

type Settings = {
  consent_enabled: boolean;
  show_consent_skipped_banner: boolean;

  maintenance_mode: boolean;
  maintenance_title: string;
  maintenance_subtitle: string;
  maintenance_message: string;
  maintenance_button_enabled: boolean;
  maintenance_button_text: string;
  maintenance_button_url: string;

  require_device: boolean;
  require_network: boolean;
  require_gps: boolean;
  require_personal_details: boolean;
};
function AdminConsentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [s, setS] = useState<Settings>({
    consent_enabled: true,
    show_consent_skipped_banner: false,

    maintenance_mode: false,
    maintenance_title: "JEE Prep Hub is taking a short study break",
    maintenance_subtitle: "We're working behind the scenes.",
    maintenance_message:
      "The platform is temporarily unavailable while we make improvements. Your account and study data are safe. We'll be back shortly.",
    maintenance_button_enabled: false,
    maintenance_button_text: "Visit JEE Prep Hub",
    maintenance_button_url: "",

    require_device: true,
    require_network: true,
    require_gps: true,
    require_personal_details: false,
  });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("consent_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        console.error("Failed to load consent settings:", error);
        toast.error("Failed to load settings");
        setLoading(false);
        return;
      }

      if (data) {
        setS({
          consent_enabled: (data as any).consent_enabled ?? true,

          show_consent_skipped_banner:
            (data as any).show_consent_skipped_banner ?? false,

          maintenance_mode:
            (data as any).maintenance_mode ?? false,

          maintenance_title:
            (data as any).maintenance_title ??
            "JEE Prep Hub is taking a short study break",

          maintenance_subtitle:
            (data as any).maintenance_subtitle ??
            "We're working behind the scenes.",

          maintenance_message:
            (data as any).maintenance_message ??
            "The platform is temporarily unavailable while we make improvements. Your account and study data are safe. We'll be back shortly.",

          maintenance_button_enabled:
            (data as any).maintenance_button_enabled ?? false,

          maintenance_button_text:
            (data as any).maintenance_button_text ??
            "Visit JEE Prep Hub",

          maintenance_button_url:
            (data as any).maintenance_button_url ?? "",

          require_device: data.require_device ?? true,
          require_network: data.require_network ?? true,
          require_gps: data.require_gps ?? true,
          require_personal_details:
            data.require_personal_details ?? false,
        });
      }

      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);

    const { error } = await supabase
      .from("consent_settings")
      .update({
        ...s,
        maintenance_updated_at: s.maintenance_mode
          ? new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

        toast.success("Settings saved successfully");
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">

        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />

          <h1 className="font-display text-2xl font-bold">
            Consent & System Settings
          </h1>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Manage verification requirements and website availability.
        </p>

        {loading ? (
          <div className="text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <div className="space-y-6">

            {/* Consent Settings */}
            <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">

              <div>
                <h2 className="text-lg font-semibold">
                  Verification & Consent
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Control what verification information is requested from
                  users.
                </p>
              </div>

              <Toggle
                label="Consent form enabled"
                desc="When disabled, users are not asked for consent and may see the Verification skipped state."
                checked={s.consent_enabled}
                onChange={(v) =>
                  setS({
                    ...s,
                    consent_enabled: v,
                  })
                }
              />

              <Toggle
                label="Show Verification Skipped Banner"
                desc="When enabled, users can see the Verification skipped banner when consent is disabled."
                checked={s.show_consent_skipped_banner}
                onChange={(v) =>
                  setS({
                    ...s,
                    show_consent_skipped_banner: v,
                  })
                }
              />

              <div className="h-px bg-border" />

              <Toggle
                label="Require Device & Browser"
                desc="OS, browser, timezone and screen resolution."
                checked={s.require_device}
                onChange={(v) =>
                  setS({
                    ...s,
                    require_device: v,
                  })
                }
              />

              <Toggle
                label="Require Network / IP"
                desc="Approximate location through network/IP information."
                checked={s.require_network}
                onChange={(v) =>
                  setS({
                    ...s,
                    require_network: v,
                  })
                }
              />

              <Toggle
                label="Require Precise GPS"
                desc="Requests the browser's OS-level geolocation permission."
                checked={s.require_gps}
                onChange={(v) =>
                  setS({
                    ...s,
                    require_gps: v,
                  })
                }
              />

              <Toggle
                label="Require Personal Details (sensitive)"
                desc="Full name, phone, DOB, school, address and parent information."
                checked={s.require_personal_details}
                onChange={(v) =>
                  setS({
                    ...s,
                    require_personal_details: v,
                  })
                }
                sensitive
              />

            </section>

            {/* Maintenance Settings */}
            <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">

              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />

                <div>
                  <h2 className="text-lg font-semibold">
                    Website Maintenance
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Temporarily close the website for normal users while
                    administrators retain access.
                  </p>
                </div>
              </div>

              <Toggle
                label="Maintenance Mode"
                desc="Normal users will see the maintenance page. Administrators can continue accessing the website."
                checked={s.maintenance_mode}
                onChange={(v) =>
                  setS({
                    ...s,
                    maintenance_mode: v,
                  })
                }
              />

              <div className="h-px bg-border" />

              <TextField
                label="Maintenance Title"
                value={s.maintenance_title}
                onChange={(v) =>
                  setS({
                    ...s,
                    maintenance_title: v,
                  })
                }
                placeholder="JEE Prep Hub is taking a short study break"
              />

              <TextField
                label="Subtitle"
                value={s.maintenance_subtitle}
                onChange={(v) =>
                  setS({
                    ...s,
                    maintenance_subtitle: v,
                  })
                }
                placeholder="We're working behind the scenes."
              />

              <TextAreaField
                label="Maintenance Message"
                value={s.maintenance_message}
                onChange={(v) =>
                  setS({
                    ...s,
                    maintenance_message: v,
                  })
                }
                placeholder="Tell users why the website is temporarily unavailable..."
              />

              <Toggle
                label="Show Maintenance Button"
                desc="Display an optional button on the maintenance page."
                checked={s.maintenance_button_enabled}
                onChange={(v) =>
                  setS({
                    ...s,
                    maintenance_button_enabled: v,
                  })
                }
              />

              {s.maintenance_button_enabled && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">

                  <TextField
                    label="Button Text"
                    value={s.maintenance_button_text}
                    onChange={(v) =>
                      setS({
                        ...s,
                        maintenance_button_text: v,
                      })
                    }
                    placeholder="Visit JEE Prep Hub"
                  />

                  <TextField
                    label="Button URL"
                    value={s.maintenance_button_url}
                    onChange={(v) =>
                      setS({
                        ...s,
                        maintenance_button_url: v,
                      })
                    }
                    placeholder="https://jeeprephub.co.in"
                  />

                </div>
              )}

            </section>

            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving ? "Saving..." : "Save Settings"}
            </button>

          </div>
        )}
      </div>
    </AppShell>
    );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
  sensitive,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  sensitive?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium">
          {label}

          {sensitive && (
            <span className="rounded-full bg-amber-500/20 dark:bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
              Sensitive
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {desc}
        </div>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4"
      />
    </label>
  );
}function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
