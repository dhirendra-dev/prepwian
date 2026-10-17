import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { CommunityLogo } from "@/components/CommunityLogo";
import { ToastPillProvider } from "@/components/community/ToastPill";
import { CommunityChatRoom } from "@/components/community/CommunityChatRoom";
import { DoubtsBoard } from "@/components/community/DoubtsBoard";
import { NoticesFeed } from "@/components/community/NoticesFeed";
import { OnlineDrawer } from "@/components/community/OnlineDrawer";
import { displayName, useProfileCache, usePresenceRoom } from "@/components/community/chat-core";
import { ArrowLeft, Megaphone, MessagesSquare, Search, Sparkles, Users, X } from "lucide-react";

export const Route = createFileRoute("/community")({
  validateSearch: z.object({
    tab: z.enum(["general", "doubts", "notices"]).optional(),
    message: z.string().optional(),
    notice: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Community Chat — JEE Prep Hub" },
      { name: "twitter:description", content: "Live chat, subject-wise doubt solving with AI, and official notices for JEE aspirants." },
      { title: "Community Chat — JEE Prep Hub" },
      {
        name: "description",
        content:
          "Live JEE community chat: talk to fellow aspirants, ask subject doubts with AI help, and read official notices — all in one room.",
      },
      { property: "og:title", content: "Community Chat — JEE Prep Hub" },
      {
        property: "og:description",
        content:
          "Live chat, subject-wise doubt solving with AI, and official notices for JEE aspirants.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityPage,
});

type Tab = "general" | "doubts" | "notices";

const TABS: { id: Tab; label: string; icon: typeof MessagesSquare }[] = [
  { id: "general", label: "General", icon: MessagesSquare },
  { id: "doubts", label: "Doubts", icon: Sparkles },
  { id: "notices", label: "Notices", icon: Megaphone },
];

function CommunityPage() {
  const searchParams = Route.useSearch();
  const { user } = useAuth();
  const iAmAdmin = useIsAdmin(user?.id);
  const { profiles, admins, ensure } = useProfileCache();
  const [tab, setTab] = useState<Tab>(searchParams.tab ?? "general");
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (searchParams.tab) setTab(searchParams.tab);
    else if (searchParams.message) setTab("general");
  }, [searchParams.message, searchParams.tab]);

  const myName = displayName(profiles[user?.id ?? ""]) || "Someone";
  const { onlineIds, typingNames, sendTyping } = usePresenceRoom(user?.id, myName);

  useEffect(() => {
    ensure([user?.id, ...onlineIds]);
  }, [user?.id, onlineIds, ensure]);

  const memberCount = onlineIds.filter((id) => id && !id.startsWith("guest")).length;

  return (
    <ToastPillProvider>
      <div className="community-live-shell relative flex h-[100dvh] flex-col overflow-hidden bg-background">
        <header className="border-b border-border bg-card/90 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-950/95">
          <div className="flex items-center gap-2 px-4 py-3 sm:px-6 lg:px-10 lg:py-4">
            {searching ? (
              <>
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages and members…"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearching(false);
                    setSearch("");
                  }}
                  aria-label="Close search"
                  className="rounded-full p-1.5 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  aria-label="Back to home"
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <CommunityLogo
                  size={40}
                  className="md:[transform:scale(1.15)] lg:[transform:scale(1.3)]"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-sm font-semibold leading-tight sm:text-base">
                    Community Live
                  </h1>
                  <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {memberCount} online
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearching(true)}
                  aria-label="Search"
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                >
                  <Search className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDrawer(true)}
                  aria-label="Online members"
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                >
                  <Users className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <nav className="flex gap-1 px-3 pb-2 sm:px-5 lg:px-9">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  tab === t.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </nav>
        </header>

        {tab === "general" && (
          <CommunityChatRoom
            search={search}
            profiles={profiles}
            admins={admins}
            ensureProfiles={ensure}
            onlineIds={onlineIds}
            typingNames={typingNames}
            sendTyping={sendTyping}
            iAmAdmin={iAmAdmin}
            initialMessageId={searchParams.message}
          />
        )}
        {tab === "doubts" && (
          <DoubtsBoard
            search={search}
            profiles={profiles}
            admins={admins}
            ensureProfiles={ensure}
            iAmAdmin={iAmAdmin}
            initialMessageId={searchParams.message}
          />
        )}
        {tab === "notices" && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NoticesFeed initialNoticeId={searchParams.notice} />
          </div>
        )}

        <OnlineDrawer
          open={drawer}
          onClose={() => setDrawer(false)}
          onlineIds={onlineIds}
          profiles={profiles}
          admins={admins}
        />
      </div>
    </ToastPillProvider>
  );
}
