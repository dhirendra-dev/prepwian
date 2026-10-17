import { AppShell } from "@/components/AppShell";
import { DeveloperAccessInfoPanel } from "@/components/developer/DeveloperAccessInfoPanel";
import { DeveloperAccessRequestForm } from "@/components/developer/DeveloperAccessRequestForm";

export function DeveloperAccessRestricted({ userEmail }: { userEmail?: string | null }) {
  return (
    <AppShell>
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(14,165,233,0.13),transparent_42%),linear-gradient(135deg,hsl(var(--background)),rgba(14,165,233,0.04))]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

        <section className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-sky-500/20 bg-card/95 p-5 shadow-[0_24px_80px_-38px_rgba(14,165,233,0.55)] backdrop-blur sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-300 to-blue-600" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-10">
            <DeveloperAccessInfoPanel />
            <DeveloperAccessRequestForm userEmail={userEmail} />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
