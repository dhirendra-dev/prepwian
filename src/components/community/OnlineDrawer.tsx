import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { OnlineDot } from "@/components/OnlineDot";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { isBadgeHidden } from "@/lib/hidden-badges";
import { displayName, initials, type Profile } from "./chat-core";

/** Slide-over list of members currently in the community room. */
export function OnlineDrawer({
  open,
  onClose,
  onlineIds,
  profiles,
  admins,
}: {
  open: boolean;
  onClose: () => void;
  onlineIds: string[];
  profiles: Record<string, Profile>;
  admins: Set<string>;
}) {
  if (!open) return null;
  const real = onlineIds.filter((id) => id && id !== "guest" && !id.startsWith("guest-"));
  const guests = onlineIds.length - real.length;

  return (
    <div className="absolute inset-0 z-40 flex">
      <button type="button" aria-label="Close" onClick={onClose} className="flex-1 bg-black/40 backdrop-blur-sm" />
      <aside className="flex h-full w-80 max-w-[85%] flex-col border-l border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Online now</h2>
            <p className="text-[11px] text-muted-foreground">
              {real.length} member{real.length === 1 ? "" : "s"}
              {guests > 0 && ` · ${guests} guest${guests === 1 ? "" : "s"}`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {real.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">Nobody else is here right now.</p>
          )}
          {real.map((id) => {
            const p = profiles[id];
            return (
              <Link
                key={id}
                to="/u/$userId"
                params={{ userId: id }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60"
              >
                <span className="relative">
                  {p?.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {initials(p?.full_name ?? p?.username)}
                    </span>
                  )}
                  <OnlineDot userId={id} className="absolute -bottom-0.5 -right-0.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 truncate text-sm font-medium">
                    {displayName(p)}
                    {p?.verified && <VerifiedBadge className="h-3.5 w-3.5" />}
                  </span>
                  {admins.has(id) && !isBadgeHidden(id) && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Admin
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
