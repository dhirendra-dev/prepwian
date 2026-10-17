import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Profile = { id: string; full_name: string | null; avatar_url: string | null; username: string | null };

export function FollowListDialog({
  open,
  onOpenChange,
  userId,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  mode: "followers" | "following";
}) {
  const list = useQuery({
    queryKey: ["follow-list", userId, mode, open],
    enabled: open,
    queryFn: async (): Promise<Profile[]> => {
      const col = mode === "followers" ? "follower_id" : "following_id";
      const otherCol = mode === "followers" ? "following_id" : "follower_id";
      const { data: rows } = await supabase.from("follows").select(`${col}`).eq(otherCol, userId);
      const ids = (rows ?? []).map((r: any) => r[col]).filter(Boolean);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, username")
        .in("id", ids);
      return (profs ?? []) as Profile[];
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">{mode}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-1 overflow-y-auto">
          {list.isLoading ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Loading…</p>
          ) : (list.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No {mode} yet.</p>
          ) : (
            list.data!.map((p) => (
              <Link
                key={p.id}
                to="/u/$userId"
                params={{ userId: p.id }}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
              >
                <Avatar className="h-9 w-9">
                  {p.avatar_url && <AvatarImage src={p.avatar_url} alt="" />}
                  <AvatarFallback>{(p.full_name ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.full_name ?? "Aspirant"}</div>
                  {p.username && <div className="truncate text-xs text-muted-foreground">@{p.username}</div>}
                </div>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
