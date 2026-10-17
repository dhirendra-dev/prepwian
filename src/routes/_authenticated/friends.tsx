import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, UserMinus, MessageSquare } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { OnlineDot } from "@/components/OnlineDot";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => ({ meta: [
      { name: "description", content: "Connect with fellow JEE aspirants and manage your study circle." },
      { property: "og:title", content: "Friends — JEE Prep Hub" },
      { property: "og:description", content: "Connect with fellow JEE aspirants and manage your study circle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Friends — JEE Prep Hub" },
      { name: "twitter:description", content: "Connect with fellow JEE aspirants and manage your study circle." },
{ title: "Friends — JEE Prep Hub" }] }),
  component: FriendsPage,
  errorComponent: ({ error }: { error: unknown }) => <div className="p-6 text-sm text-destructive">{error instanceof Error ? error.message : String(error)}</div>,
});

function FriendsPage() {
  const qc = useQueryClient();
  const [me, setMe] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const following = useQuery({
    queryKey: ["friends-following", me],
    enabled: !!me,
    queryFn: async () => {
      const { data: f } = await supabase.from("follows").select("following_id, created_at").eq("follower_id", me!);
      const ids = (f ?? []).map((r) => r.following_id);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase.from("profiles").select("id, full_name, avatar_url, bio").in("id", ids);
      return profs ?? [];
    },
  });

  const followers = useQuery({
    queryKey: ["friends-followers", me],
    enabled: !!me,
    queryFn: async () => {
      // Privacy: only the 10 most recent followers are shown.
      const { data: f } = await supabase
        .from("follows")
        .select("follower_id, created_at")
        .eq("following_id", me!)
        .order("created_at", { ascending: false })
        .limit(10);
      const ids = (f ?? []).map((r) => r.follower_id);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase.from("profiles").select("id, full_name, avatar_url, bio").in("id", ids);
      return profs ?? [];
    },
  });

  const followingSet = new Set((following.data ?? []).map((p) => p.id));

  const search = useQuery({
    queryKey: ["friends-search", q, me],
    enabled: !!me && q.trim().length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio")
        .eq("username", q.trim().toLowerCase())
        .limit(5);
      return (data ?? []).filter((p) => p.id !== me);
    },
  });


  async function toggleFollow(otherId: string, isFollowing: boolean) {
    if (!me) return;
    haptic("light");
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", me).eq("following_id", otherId);
    } else {
      await supabase.from("follows").insert({ follower_id: me, following_id: otherId });
      haptic("success");
    }
    qc.invalidateQueries({ queryKey: ["friends-following", me] });
    qc.invalidateQueries({ queryKey: ["friends-followers", me] });
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="font-display text-2xl font-bold">Friends</h1>
        <p className="text-sm text-muted-foreground">For privacy, aspirants are not browsable — search someone by their exact username.</p>

        <div className="relative my-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Enter an exact @username…" className="pl-9" />
        </div>

        {q.trim().length >= 2 && (
          <div className="mb-5 rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-2 text-xs font-semibold text-muted-foreground">Search</div>
            {(search.data ?? []).length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">{search.isLoading ? "Searching…" : "No aspirant with that username"}</div>
            ) : (
              (search.data ?? []).map((p) => (
                <Row key={p.id} p={p} isFollowing={followingSet.has(p.id)} onToggle={() => toggleFollow(p.id, followingSet.has(p.id))} />
              ))
            )}
          </div>
        )}

        <Tabs defaultValue="following">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="following">Following ({following.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="followers">Followers ({followers.data?.length ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="following" className="mt-3">
            <div className="rounded-xl border border-border bg-card">
              {(following.data ?? []).length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">You're not following anyone yet — search a username above.</div>
              ) : (
                (following.data ?? []).map((p) => (
                  <Row key={p.id} p={p} isFollowing={true} onToggle={() => toggleFollow(p.id, true)} />
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="followers" className="mt-3">
            <div className="rounded-xl border border-border bg-card">
              {(followers.data ?? []).length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">No followers yet.</div>
              ) : (
                (followers.data ?? []).map((p) => (
                  <Row key={p.id} p={p} isFollowing={followingSet.has(p.id)} onToggle={() => toggleFollow(p.id, followingSet.has(p.id))} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}

function Row({ p, isFollowing, onToggle }: { p: any; isFollowing: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <Link to="/u/$userId" params={{ userId: p.id }} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            {p.avatar_url ? <AvatarImage src={p.avatar_url} /> : null}
            <AvatarFallback className="bg-primary/10 text-primary">{(p.full_name ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <OnlineDot userId={p.id} className="absolute -bottom-0.5 -right-0.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{p.full_name ?? "Aspirant"}</p>
          {p.bio ? <p className="truncate text-xs text-muted-foreground">{p.bio}</p> : null}
        </div>
      </Link>
      <Link to="/messages/$peerId" params={{ peerId: p.id }}>
        <Button variant="outline" size="sm" className="gap-1">
          <MessageSquare className="h-3.5 w-3.5" /> Chat
        </Button>
      </Link>
      <Button variant={isFollowing ? "outline" : "default"} size="sm" className="gap-1" onClick={onToggle}>
        {isFollowing ? <><UserMinus className="h-3.5 w-3.5" /> Unfollow</> : <><UserPlus className="h-3.5 w-3.5" /> Follow</>}
      </Button>
    </div>
  );
}
