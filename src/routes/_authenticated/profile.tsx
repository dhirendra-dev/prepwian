import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { AdminBadge } from "@/components/AdminBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Camera, Pencil, Award, Clock, MessageSquare, X, Grid3x3, Instagram, Youtube, Send as SendIcon, Globe, Compass } from "lucide-react";
import { AvatarCropper } from "@/components/AvatarCropper";
import { ProfilePosts } from "@/components/ProfilePosts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProRing } from "@/components/ProRing";
import { ProStatusCard } from "@/components/ProStatusCard";
import { useProStatus } from "@/hooks/use-pro";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { UsernameField } from "@/components/UsernameField";
import { useUsernameCheck, USERNAME_RE, isUsernameTakenError } from "@/hooks/use-username-check";
import { Crown } from "lucide-react";
import { StreakMilestoneBadges } from "@/components/StreakMilestoneBadges";
import { BirthdaySettingsCard } from "@/components/birthday/BirthdaySettingsCard";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [
      { name: "description", content: "Manage your JEE Prep Hub member profile." },
      { property: "og:title", content: "Profile — JEE Prep Hub" },
      { property: "og:description", content: "Manage your JEE Prep Hub member profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Profile — JEE Prep Hub" },
      { name: "twitter:description", content: "Manage your JEE Prep Hub member profile." },
{ title: "Profile — JEE Prep Hub" }] }),
  component: ProfilePage,
});

type ClassLevel = "class_11" | "class_12" | "dropper";

function classLabel(c: ClassLevel) {
  return c === "class_11" ? "Class 11" : c === "class_12" ? "Class 12" : "Dropper";
}

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { isPro } = useProStatus(user.id);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [classLevel, setClassLevel] = useState<ClassLevel>("class_11");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pickedSrc, setPickedSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { status: usernameStatus } = useUsernameCheck(username, user.id);
  const usernameBlocked = usernameStatus.state === "taken" || usernameStatus.state === "invalid" || usernameStatus.state === "checking";

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!profile.data) return;
    const p = profile.data as any;
    setFullName(p.full_name ?? "");
    setUsername(p.username ?? "");
    setBio(p.bio ?? "");
    setAvatarUrl(p.avatar_url ?? "");
    setClassLevel((p.class_level as ClassLevel) ?? "class_11");
    setInstagram(p.instagram ?? "");
    setYoutube(p.youtube ?? "");
    setTelegram(p.telegram ?? "");
    setWebsite(p.website ?? "");
  }, [profile.data]);

  const stats = useQuery({
    queryKey: ["profile-stats", user.id],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [{ data: sessions }, { count: certCount }, { count: threadCount }, { count: postCount }, { count: followers }, { count: following }] = await Promise.all([
        supabase.from("study_sessions").select("duration_seconds").eq("user_id", user.id).gte("ended_at", since),
        supabase.from("user_certificates").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("forum_threads").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profile_posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);
      const minutes = Math.round((sessions ?? []).reduce((a, r) => a + (r.duration_seconds ?? 0), 0) / 60);
      return {
        minutes,
        certCount: certCount ?? 0,
        threadCount: threadCount ?? 0,
        postCount: postCount ?? 0,
        followers: followers ?? 0,
        following: following ?? 0,
      };
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const xpBalance = useQuery({
    queryKey: ["user-xp", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_xp").select("total_xp").eq("user_id", user.id).maybeSingle();
      return Number(data?.total_xp ?? 0);
    },
    staleTime: 30_000,
  });
  const todayXp = useQuery({
    queryKey: ["user-xp-today", user.id],
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const { data } = await supabase
        .from("xp_transactions")
        .select("amount, reason, source_type, created_at")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: false });
      const breakdown = { videos: 0, searches: 0, testSeries: 0 };
      const transactions = (data ?? []).map((item) => {
        const amount = Number(item.amount ?? 0);
        const sourceType = String(item.source_type ?? "").toLowerCase();
        if (sourceType === "video" || sourceType === "videos") breakdown.videos += amount;
        if (sourceType === "search" || sourceType === "searches") breakdown.searches += amount;
        if (sourceType === "test_series" || sourceType === "test" || sourceType === "tests") breakdown.testSeries += amount;
        return { amount };
      });
      return {
        total: transactions.reduce((sum, item) => sum + item.amount, 0),
        breakdown,
      };
    },
    staleTime: 30_000,
  });
  const isAdmin = useQuery({
    queryKey: ["profile-is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  function onPickFile(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Please pick an image");
    if (file.size > 8 * 1024 * 1024) return toast.error("Image must be under 8 MB");
    const reader = new FileReader();
    reader.onload = () => {
      setPickedSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  }

  async function uploadCropped(blob: Blob) {
    setUploading(true);
    try {
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const up = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const signed = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed.error) throw signed.error;
      const url = signed.data.signedUrl;
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (error) throw error;
      setAvatarUrl(url);
      toast.success("Photo updated");
      profile.refetch();
      setCropOpen(false);
      setPickedSrc(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (fullName.trim().length < 1) return toast.error("Name required");
    const un = username.trim().toLowerCase();
    if (un && !USERNAME_RE.test(un)) {
      return toast.error("3–20 characters: letters, numbers, underscore, or period only.");
    }
    if (un && usernameBlocked) {
      return toast.error(
        usernameStatus.state === "taken" ? "This username is already taken." : "Check your username first.",
      );
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        username: un || null,
        bio: bio.trim() || null,
        class_level: classLevel,
        instagram: instagram.trim() || null,
        youtube: youtube.trim() || null,
        telegram: telegram.trim() || null,
        website: website.trim() || null,
      } as any)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      return toast.error(isUsernameTakenError(error as any) ? "This username is already taken." : error.message);
    }
    toast.success("Profile updated");
    setEditing(false);
    profile.refetch();
  }

  const initials = (fullName || user.email || "U").slice(0, 2).toUpperCase();
  const displayName = fullName || (user.email?.split("@")[0] ?? "aspirant");
  const handle = username || (user.email?.split("@")[0] ?? "aspirant").toLowerCase();
  const verified = Boolean((profile.data as any)?.verified);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        {/* Instagram-style header */}
        <section
          className={
            isPro
              ? "relative rounded-b-3xl bg-gradient-to-br from-amber-500/10 via-yellow-400/5 to-transparent px-2 py-6 sm:px-6 sm:py-8"
              : "px-2 py-6 sm:px-6 sm:py-8"
          }
        >

          <div className="relative flex items-start gap-5 sm:gap-10">
            <div className="relative shrink-0">
              <ProRing userId={user.id} size="xl" showCrown>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-20 w-20 rounded-full object-cover sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary sm:h-32 sm:w-32 sm:text-4xl">
                    {initials}
                  </div>
                )}
              </ProRing>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Change photo"
                className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft ring-2 ring-background hover:opacity-90 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickFile(f);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-semibold sm:text-2xl">@{handle}</h1>
                {verified && <VerifiedBadge />}
                {isAdmin.data && <AdminBadge userId={user?.id} />}
                {isPro && (
                  <span className="inline-flex items-center gap-1 rounded-full pro-gradient-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black shadow">
                    <Crown className="h-3 w-3" strokeWidth={2.8} /> Pro
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing((e) => !e)}
                  className="gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {editing ? "Close" : "Edit profile"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    try { sessionStorage.setItem("replay-tour", "1"); } catch { /* ignore */ }
                    void navigate({ to: "/dashboard" });
                  }}
                  className="gap-1"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Take a tour
                </Button>
              </div>
              {/* Social links */}
              {(instagram || youtube || telegram || website) && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {instagram && <SocialIconLink href={socialUrl("instagram", instagram)} icon={<Instagram className="h-4 w-4" />} label="Instagram" />}
                  {youtube && <SocialIconLink href={socialUrl("youtube", youtube)} icon={<Youtube className="h-4 w-4" />} label="YouTube" />}
                  {telegram && <SocialIconLink href={socialUrl("telegram", telegram)} icon={<SendIcon className="h-4 w-4" />} label="Telegram" />}
                  {website && <SocialIconLink href={socialUrl("website", website)} icon={<Globe className="h-4 w-4" />} label="Website" />}
                </div>
              )}

              {/* Stat row — Instagram style */}
              <div className="mt-4 flex items-center gap-6 text-sm sm:gap-10">
                <StatInline label="posts" value={stats.data?.postCount ?? 0} />
                <StatInline label="followers" value={stats.data?.followers ?? 0} />
                <StatInline label="following" value={stats.data?.following ?? 0} />
              </div>

              <div className="mt-4 space-y-0.5">
                <div className="font-semibold">
                  {displayName}
                  {isPro && <span className="ml-1.5 pro-gradient-text text-xs font-bold uppercase tracking-wider">• Premium</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {classLabel(classLevel)}
                  {(profile.data as any)?.created_at && (
                    <> · Member since {new Date((profile.data as any).created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</>
                  )}
                </div>
                {bio ? (
                  <p className="pt-1 text-sm whitespace-pre-wrap">{bio}</p>
                ) : (
                  <p className="pt-1 text-sm italic text-muted-foreground">Add a bio to tell others about your JEE journey.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Pro status / upsell */}
        <div className="mx-2 mb-4 sm:mx-0">
          <ProStatusCard userId={user.id} />
        </div>
        <div className="mx-2 mb-6 sm:mx-0">
          <StreakMilestoneBadges userId={user.id} />
        </div>

        <BirthdaySettingsCard userId={user.id} />


        <section className="mx-2 mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft sm:mx-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today’s XP</h2>
              <p className="mt-1 text-2xl font-bold text-primary">+{todayXp.data?.total ?? 0} XP</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Activity breakdown</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["Videos", todayXp.data?.breakdown.videos ?? 0],
              ["Searches", todayXp.data?.breakdown.searches ?? 0],
              ["Test series", todayXp.data?.breakdown.testSeries ?? 0],
            ].map(([label, amount]) => (
              <div key={label} className="rounded-xl bg-muted/50 px-3 py-3 text-center">
                <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                <p className="mt-1 font-bold text-primary">+{amount} XP</p>
              </div>
            ))}
          </div>
          {!todayXp.data?.total && <p className="mt-3 text-sm text-muted-foreground">No XP earned today yet. Complete a test, watch a lecture, or search for a study resource.</p>}
        </section>

        {/* Edit panel — only visible when user chooses to edit */}
        {editing && (
          <section className="mx-2 mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft animate-fade-in sm:mx-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Edit profile</h2>
              <Button variant="ghost" size="icon" onClick={() => setEditing(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} />
              </div>
              <UsernameField value={username} onChange={setUsername} status={usernameStatus} />
              <div>
                <Label>Class</Label>
                <Select value={classLevel} onValueChange={(v) => setClassLevel(v as ClassLevel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class_11">Class 11</SelectItem>
                    <SelectItem value="class_12">Class 12</SelectItem>
                    <SelectItem value="dropper">Dropper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300} placeholder="A line about your JEE journey" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="flex items-center gap-1"><Instagram className="h-3.5 w-3.5" /> Instagram</Label>
                  <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="username" maxLength={60} />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Youtube className="h-3.5 w-3.5" /> YouTube</Label>
                  <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="@channel or URL" maxLength={100} />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><SendIcon className="h-3.5 w-3.5" /> Telegram</Label>
                  <Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="username" maxLength={60} />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" maxLength={120} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={save} disabled={saving || usernameBlocked} className="flex-1">
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Tip: tap the camera icon on your photo to change your profile picture.</p>
            </div>
          </section>
        )}

        {/* Tabs: Posts / Highlights */}
        <Tabs defaultValue="posts" className="mx-2 sm:mx-0">
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1 gap-1"><Grid3x3 className="h-4 w-4" /> Posts</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="posts">
            <ProfilePosts userId={user.id} isOwner={true} />
          </TabsContent>
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Highlight icon={<Clock className="h-4 w-4" />} label="30-day study" value={`${stats.data?.minutes ?? 0}m`} />
              <Highlight icon={<Award className="h-4 w-4" />} label="Certificates" value={String(stats.data?.certCount ?? 0)} />
              <Highlight icon={<MessageSquare className="h-4 w-4" />} label="Threads" value={String(stats.data?.threadCount ?? 0)} />
              <Highlight icon={<Award className="h-4 w-4" />} label="XP points" value={String(xpBalance.data ?? 0)} />
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Shortcuts</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/certificates" className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/40">Certificates</Link>
                <Link to="/timer" className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/40">Focus Timer</Link>
                <Link to="/forum" className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/40">Forum</Link>
                <Link to="/groups" className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/40">Study Squads</Link>
                <Link to="/feed" className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/40">Feed</Link>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <AvatarCropper
          open={cropOpen}
          imageSrc={pickedSrc}
          onCancel={() => { setCropOpen(false); setPickedSrc(null); }}
          onCropped={uploadCropped}
        />
      </div>
    </AppShell>
  );
}

function StatInline({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center sm:flex-row sm:gap-1">
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground sm:text-sm">{label}</span>
    </div>
  );
}

function Highlight({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center shadow-soft">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <div className="mt-1 font-display text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
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
