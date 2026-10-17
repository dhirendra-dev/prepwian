import { Check, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { USERNAME_FORMAT_HINT, type UsernameStatus } from "@/hooks/use-username-check";

export function UsernameField({
  value,
  onChange,
  status,
  label = "Username",
}: {
  value: string;
  onChange: (v: string) => void;
  status: UsernameStatus;
  label?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/\s+/g, ""))}
          placeholder="e.g. arjun.jee"
          maxLength={20}
          autoComplete="off"
          aria-invalid={status.state === "taken" || status.state === "invalid"}
          className="pr-9"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {status.state === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {status.state === "available" && <Check className="h-4 w-4 text-emerald-500" />}
          {(status.state === "taken" || status.state === "invalid") && <X className="h-4 w-4 text-red-500" />}
        </span>
      </div>
      <p
        className={`mt-1 text-[11px] ${
          status.state === "available"
            ? "text-emerald-500"
            : status.state === "taken" || status.state === "invalid" || status.state === "error"
              ? "text-red-500"
              : "text-muted-foreground"
        }`}
      >
        {status.state === "available"
          ? "Username available."
          : status.state === "taken"
            ? "This username is already taken."
            : status.state === "invalid"
              ? status.message
              : status.state === "checking"
                ? "Checking availability…"
                : status.state === "error"
                  ? status.message
                  : `${USERNAME_FORMAT_HINT} Shown as @${value || "yourname"}.`}
      </p>
    </div>
  );
}
