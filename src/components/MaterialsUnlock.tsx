import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, LockOpen, Loader2 } from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { Input } from "@/components/ui/input";
import { unlockMaterials } from "@/lib/materials-gate.functions";

/**
 * The single lock screen used by every page that shows copyrighted study
 * material (library + subject landing pages).
 */
export function MaterialsUnlock({
  onUnlocked,
  title = "Study material is locked",
  description = "This section holds copyrighted study material, so it is protected. Enter the current access password shared by the JEE Prep Hub team to continue.",
}: {
  onUnlocked: () => void;
  title?: string;
  description?: string;
}) {
  const unlock = useServerFn(unlockMaterials);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError(false);
    try {
      const res = await unlock({ data: { password } });
      if (res.ok) onUnlocked();
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassSurface className="mx-auto max-w-md p-7 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-primary/10">
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mt-4 font-display text-xl font-bold sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <form onSubmit={submit} className="mt-5 space-y-3 text-left">
        <Input
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="Access password"
        />
        {error && <p className="text-xs font-medium text-destructive">That password is not correct.</p>}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockOpen className="h-4 w-4" />} Unlock material
        </button>
      </form>
      <p className="mt-4 text-[11px] text-muted-foreground">
        The password changes from time to time. Access stays open on this device for 12 hours.
      </p>
    </GlassSurface>
  );
}
