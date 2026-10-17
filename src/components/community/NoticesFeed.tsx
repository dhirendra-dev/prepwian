import { useEffect, useState } from "react";
import { LinkifiedText } from "@/components/LinkifiedText";
import { supabase } from "@/integrations/supabase/client";
import { ExpandableText } from "@/components/ExpandableText";
import { Megaphone, Pin, ExternalLink } from "lucide-react";
import { relativeTime } from "./chat-core";

type Notice = {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  link_url: string | null;
  link_label: string | null;
  created_at: string;
};

export function useLatestPinnedNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => {
    let active = true;
    supabase
      .from("notices")
      .select("id, title, body, category, pinned, link_url, link_label, created_at")
      .eq("pinned", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (active) setNotice(((data ?? [])[0] as Notice) ?? null);
      });
    return () => {
      active = false;
    };
  }, []);
  return notice;
}

/** Admin-only broadcast feed (read-only for everyone). */
export function NoticesFeed({ initialNoticeId }: { initialNoticeId?: string } = {}) {
  const [notices, setNotices] = useState<Notice[] | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [recent, target] = await Promise.all([
        supabase
          .from("notices")
          .select("id, title, body, category, pinned, link_url, link_label, created_at")
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(50),
        initialNoticeId
          ? supabase
              .from("notices")
              .select("id, title, body, category, pinned, link_url, link_label, created_at")
              .eq("id", initialNoticeId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (!active) return;
      const rows = [...((recent.data ?? []) as Notice[])];
      const targetNotice = target.data as Notice | null;
      if (targetNotice && !rows.some((notice) => notice.id === targetNotice.id)) {
        rows.push(targetNotice);
      }
      setNotices(rows);
    })();
    return () => {
      active = false;
    };
  }, [initialNoticeId]);

  useEffect(() => {
    if (!initialNoticeId || !notices?.some((notice) => notice.id === initialNoticeId)) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(`community-notice-${initialNoticeId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialNoticeId, notices]);

  if (notices === null) {
    return (
      <div className="space-y-3 p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!notices.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
        <Megaphone className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No notices yet. Admin updates will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 sm:p-4">
      {notices.map((n) => (
        <article
          key={n.id}
          id={`community-notice-${n.id}`}
          className={`scroll-mt-6 rounded-2xl border border-border bg-card p-4 shadow-soft ${n.id === initialNoticeId ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Megaphone className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold leading-snug">{n.title}</h3>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {n.category} · {relativeTime(n.created_at)}
                </span>
              </div>
            </div>
            {n.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            <ExpandableText text={n.body} chars={240} />
          </div>
          {n.link_url && (
            <a
              href={n.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              {n.link_label || "Open link"} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
