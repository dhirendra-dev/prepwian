import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminBadge } from "@/components/AdminBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ProRing } from "@/components/ProRing";
import { useProStatus } from "@/hooks/use-pro";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Clock, MessageSquare, User as UserIcon, UserPlus, UserCheck, MessageCircle, Loader2, Grid3x3, Pencil, Instagram, Youtube, Send as SendIcon, Globe, Crown, Compass } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";
import { OnlineDot } from "@/components/OnlineDot";
import { ProfilePosts } from "@/components/ProfilePosts";
import { FollowListDialog } from "@/components/FollowListDialog";
import { ExpandableText } from "@/components/ExpandableText";
import { publicCertificateCount } from "@/lib/certificates.functions";
import ProfileHeaderGlass, { glassBtnPrimary, glassBtnSoft } from "@/components/profile/ProfileHeaderGlass";
import type { HeaderThemeKey } from "@/lib/headerThemes";

const SITE_URL = "https://jeeprephub.co.in";

export const Route = createFileRoute("/u/$userId")({
  head: ({ params }) => ({
    meta: [
      { property: "og:title", content: "Member profile — PREPWIAN" },
      { property: "og:description", content: "View a PREPWIAN community member's profile, posts, study activity, and certificates." },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Member profile — PREPWIAN" },
      { name: "twitter:description", content: "View a PREPWIAN community member's profile, posts, study activity, and certificates." },

      { title: "Member profile — PREPWIAN" },
      { name: "description", content: "View a PREPWIAN community member's profile, posts, study activity, and certificates." },
      { property: "og:url", content: `${SITE_URL}/u/${params.userId}` },
      { property: "og:type", content: "profile" },
    ],
  }),
  component: PublicProfile,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-lg font-semibold">User not found</p>
        <Link to="/" className="mt-3 inline-block text-sm text-primary hover:underline">← Back home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }: { error: unknown }) => (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-destructive">{(error instanceof Error ? error.message : String(error))}</div>
    </div>
  ),
});

function classLabel(c: string | null | undefined) {
  if (c === "class_11") return "Class 11";
  if (c === "class_12") return "Class 12";
  if (c === "dropper") return "Dropper";
  return "Aspirant";
}

function PublicProfile() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [followListOpen, setFollowListOpen] = useState<null | "followers" | "following">(null);

  const profile = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, class_level, created_at, username, verified, instagram, youtube, telegram, website, header_theme")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
      const byUsername = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, class_level, created_at, username, verified, instagram, youtube, telegram, website, header_theme")
        .eq("username", userId)
        .maybeSingle();
      if (byUsername.error) throw byUsername.error;
      if (!byUsername.data) throw notFound();
      return byUsername.data;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const canonicalUserId = profile.data?.id ?? userId;
  const isSelf = user?.id === canonicalUserId;
  const { isPro: ownerIsPro } = useProStatus(canonicalUserId);

  const stats = useQuery({
    queryKey: ["public-profile-stats", canonicalUserId],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [{ data: totals }, certRes, { count: threadCount }, { count: postCount }, { count: followers }, { count: following }, { count: profilePosts }, { data: xpRow }] = await Promise.all([
        supabase.rpc("study_totals_since", { _since: since }),
        publicCertificateCount({ data: { userId: canonicalUserId } }),
        supabase.from("forum_threads").select("*", { count: "exact", head: true }).eq("user_id", canonicalUserId),
        supabase.from("feed_posts").select("*", { count: "exact", head: true }).eq("user_id", canonicalUserId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", canonicalUserId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", canonicalUserId),
        supabase.from("profile_posts").select("*", { count: "exact", head: true }).eq("user_id", canonicalUserId),
        supabase.from("user_xp").select("total_xp").eq("user_id", canonicalUserId).maybeSingle(),
      ]);
      const certCount = certRes?.count ?? 0;
      const row = ((totals ?? []) as Array<{ user_id: string; total_seconds: number }>).find((r) => r.user_id === canonicalUserId);
      const minutes = Math.round(Number(row?.total_seconds ?? 0) / 60);
      return {
        minutes,
        certCount: certCount ?? 0,
        threadCount: threadCount ?? 0,
        feedCount: postCount ?? 0,
        followers: followers ?? 0,
        following: following ?? 0,
        profilePosts: profilePosts ?? 0,
        xp: Number(xpRow?.total_xp ?? 0),
      };
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const isAdmin = useQuery({
    queryKey: ["public-profile-is-admin", canonicalUserId],
    queryFn: async () => {
      const { data } = await supabase.rpc("list_admin_ids");
      return (data ?? []).some((r: { user_id: string }) => r.user_id === canonicalUserId);
    },
  });

  const followState = useQuery({
    queryKey: ["follow-state", user?.id, canonicalUserId],
    enabled: !!user?.id && !isSelf,
    queryFn: async () => {
      const [{ count: following }, { count: followsMe }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user!.id).eq("following_id", canonicalUserId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", canonicalUserId).eq("following_id", user!.id),
      ]);
      return { isFollowing: (following ?? 0) > 0, followsMe: (followsMe ?? 0) > 0 };
    },
  });

  const consentDetails = useQuery({
    queryKey: ["my-consent-details", user?.id],
    enabled: !!user?.id && isSelf,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_my_consent_decrypted");
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) ?? null;
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Sign in to follow");
      const isFollowing = followState.data?.isFollowing;
      if (isFollowing) {
        const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", canonicalUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: canonicalUserId });
        if (error) throw error;
      }
      return !isFollowing;
    },
    onSuccess: (nowFollowing) => {
      haptic(nowFollowing ? "success" : "light");
      toast.success(nowFollowing ? `Following ${profile.data?.full_name ?? "user"}` : "Unfollowed");
      qc.invalidateQueries({ queryKey: ["follow-state", user?.id, canonicalUserId] });
      qc.invalidateQueries({ queryKey: ["public-profile-stats", canonicalUserId] });
    },
    onError: (e: any) => {
      haptic("error");
      toast.error(e?.message ?? "Could not update follow");
    },
  });

  const changeTheme = useMutation({
    mutationFn: async (key: HeaderThemeKey) => {
      if (!user?.id) throw new Error("Sign in first");
      const { error } = await (supabase as any).from("profiles").update({ header_theme: key }).eq("id", user.id);
      if (error) throw error;
      return key;
    },
    onSuccess: () => {
      haptic("success");
      toast.success("Profile theme updated");
      qc.invalidateQueries({ queryKey: ["public-profile", userId] });
    },
    onError: (e: any) => {
      haptic("error");
      toast.error(e?.message ?? "Could not change theme");
    },
  });

  const p = profile.data;
  const initials = (p?.full_name ?? "?").slice(0, 2).toUpperCase();
  const isFollowing = !!followState.data?.isFollowing;
  const followsMe = !!followState.data?.followsMe;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        {profile.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        ) : !p ? (
          <p className="text-sm text-muted-foreground">User not found.</p>
        ) : (
          <>
            <section className="pb-4">
              <ProfileHeaderGlass
                theme={(p as any).header_theme}
                isOwn={isSelf}
                onThemeChange={(k) => changeTheme.mutate(k)}
                avatar={
                  <div className="relative">
                    <ProRing userId={canonicalUserId} size="xl" showCrown>
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.full_name ?? ""} className="h-24 w-24 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 font-display text-3xl font-bold text-primary">{initials}</div>
                      )}
                    </ProRing>
                    <OnlineDot userId={p.id} className="absolute bottom-1 right-1 h-4 w-4" />
                  </div>
                }
                nameRow={
                  <>
                    <h1 className="truncate font-display text-xl font-extrabold sm:text-2xl">
                      {(p as any).username ? `@${(p as any).username}` : (p.full_name ?? "Aspirant")}
                    </h1>
                    {(p as any).verified && <VerifiedBadge />}
                    {isAdmin.data && <AdminBadge userId={canonicalUserId} />}
                    {ownerIsPro && (
                      <span className="inline-flex items-center gap-1 rounded-full pro-gradient-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black shadow">
                        <Crown className="h-3 w-3" strokeWidth={2.8} /> Pro
                      </span>
                    )}
                    {followsMe && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Follows you</span>
                    )}
                  </>
                }
                socials={
                  ((p as any).instagram || (p as any).youtube || (p as any).telegram || (p as any).website) ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {(p as any).instagram && <SocialIconLink href={socialUrl("instagram", (p as any).instagram)} icon={<Instagram className="h-4 w-4" />} label="Instagram" />}
                      {(p as any).youtube && <SocialIconLink href={socialUrl("youtube", (p as any).youtube)} icon={<Youtube className="h-4 w-4" />} label="YouTube" />}
                      {(p as any).telegram && <SocialIconLink href={socialUrl("telegram", (p as any).telegram)} icon={<SendIcon className="h-4 w-4" />} label="Telegram" />}
                      {(p as any).website && <SocialIconLink href={socialUrl("website", (p as any).website)} icon={<Globe className="h-4 w-4" />} label="Website" />}
                    </div>
                  ) : undefined
                }
                actions={
                  isSelf ? (
                    <>
                      <Link to="/profile" className={glassBtnPrimary}>
                        <Pencil className="h-4 w-4" /> Edit profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          try { sessionStorage.setItem("replay-tour", "1"); } catch { /* ignore */ }
                          navigate({ to: "/dashboard" });
                        }}
                        className={glassBtnSoft}
                      >
                        <Compass className="h-4 w-4" /> Take a tour
                      </button>
                    </>
                  ) : user ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleFollow.mutate()}
                        disabled={toggleFollow.isPending || followState.isLoading}
                        className={isFollowing ? glassBtnSoft : glassBtnPrimary}
                      >
                        {toggleFollow.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/messages/$peerId", params: { peerId: canonicalUserId } })}
                        className={glassBtnSoft}
                      >
                        <MessageCircle className="h-4 w-4" /> Message
                      </button>
                    </>
                  ) : (
                    <Link to="/auth" className={glassBtnPrimary}>
                      <UserPlus className="h-4 w-4" /> Sign in to follow
                    </Link>
                  )
                }
                posts={stats.data?.profilePosts ?? 0}
                followers={stats.data?.followers ?? 0}
                following={stats.data?.following ?? 0}
                xp={stats.data?.xp ?? 0}
                onFollowers={() =>
                  isSelf
                    ? setFollowListOpen("followers")
                    : toast.info("This list is private", { description: "Only this member can see who follows them." })
                }
                onFollowing={() =>
                  isSelf
                    ? setFollowListOpen("following")
                    : toast.info("This list is private", { description: "Only this member can see who they follow." })
                }
                classLabel={classLabel(p.class_level)}
                memberSince={p.created_at}
                bio={
                  p.bio ? (
                    <ExpandableText text={p.bio} chars={200} className="text-sm" />
                  ) : (
                    <p className="text-sm italic text-muted-foreground">No bio yet.</p>
                  )
                }
              />
            </section>

            {isSelf && (
              <FollowListDialog
                open={followListOpen !== null}
                onOpenChange={(o) => setFollowListOpen(o ? followListOpen : null)}
                userId={canonicalUserId}
                mode={followListOpen ?? "followers"}
              />
            )}

            <Tabs defaultValue="posts">
              <TabsList className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <TabsTrigger value="posts" className="flex-1 gap-1 rounded-xl"><Grid3x3 className="h-4 w-4" /> Posts</TabsTrigger>
                <TabsTrigger value="stats" className="flex-1 rounded-xl">Stats</TabsTrigger>
              </TabsList>
              <TabsContent value="posts">
                <ProfilePosts userId={canonicalUserId} isOwner={isSelf} />
              </TabsContent>
              <TabsContent value="stats">
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat icon={<Clock className="h-4 w-4" />} label="Last 30 days" value={`${stats.data?.minutes ?? 0} min`} />
                  <Stat icon={<Award className="h-4 w-4" />} label="Certificates" value={String(stats.data?.certCount ?? 0)} />
                  <Stat icon={<MessageSquare className="h-4 w-4" />} label="Forum threads" value={String(stats.data?.threadCount ?? 0)} />
                  <Stat icon={<UserIcon className="h-4 w-4" />} label="Feed posts" value={String(stats.data?.feedCount ?? 0)} />
                </div>

                {isSelf && consentDetails.data && (
                  <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-soft">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-display text-sm font-semibold">Your details</h3>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Private · only you</span>
                    </div>
                    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                      {[
                        ["School", consentDetails.data.school],
                        ["Class", classLabel(consentDetails.data.class_level)],
                        ["City", consentDetails.data.city],
                        ["State", consentDetails.data.state],
                        ["Phone", consentDetails.data.phone],
                        ["Parent", consentDetails.data.parent_name],
                      ].filter(([, v]) => !!v).map(([k, v]) => (
                        <div key={k as string}>
                          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</dt>
                          <dd className="font-medium">{v as string}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
    </div>
  );
}

function socialUrl(kind: "instagram" | "youtube" | "telegram" | "website", raw: string) {
  const v = raw.trim();
  if (!v) return "#";
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  if (kind === "instagram") return `https://instagram.com/${handle}`;
  if (kind === "youtube") return `https://youtube.com/@${handle}`;
  if (kind === "telegram") return `https://t.me/${handle}`;
  return `https://${v}`;
}

function SocialIconLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/50 hover:text-primary"
    >
      {icon}
    </a>
  );
}
