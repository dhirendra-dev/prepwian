import { Wrench } from "lucide-react";

type MaintenancePageProps = {
  title?: string | null;
  subtitle?: string | null;
  message?: string | null;
  buttonEnabled?: boolean;
  buttonText?: string | null;
  buttonUrl?: string | null;
};

export default function MaintenancePage({
  title,
  subtitle,
  message,
  buttonEnabled = false,
  buttonText,
  buttonUrl,
}: MaintenancePageProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-2xl text-center">

        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <Wrench className="h-10 w-10 text-primary" />
        </div>

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
          System temporarily offline
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {title || "JEE Prep Hub is taking a short study break"}
        </h1>

        <p className="mt-5 text-lg font-medium text-muted-foreground">
          {subtitle || "We're working behind the scenes."}
        </p>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          {message ||
            "The platform is temporarily unavailable while we make improvements. Your account and study data are safe. We'll be back shortly."}
        </p>

        {buttonEnabled && buttonUrl && (
          <a
            href={buttonUrl}
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {buttonText || "Visit JEE Prep Hub"}
          </a>
        )}

        <p className="mt-10 text-xs text-muted-foreground">
          © JEE Prep Hub
        </p>

      </div>
    </main>
  );
}