import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2, Swords, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Subject } from "./ArenaHome";

type Friend = { id: string; full_name: string | null; avatar_url: string | null };

export function ChallengeFriendDialog({
  open,
  onOpenChange,
  userId,
  subject,
  onChallenge,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  subject: Subject;
  onChallenge: (seed: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const friends = useQuery({
    queryKey: ["quiz-challenge-friends", userId],
    enabled: open && Boolean(userId),
    staleTime: 30_000,
    queryFn: async (): Promise<Friend[]> => {
      const { data: follows, error: followError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);
      if (followError) throw followError;
      const ids = (follows ?? []).map((row) => row.following_id);
      if (!ids.length) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", ids)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const sendInvite = useMutation({
    mutationFn: async () => {
      const friend = friends.data?.find((item) => item.id === selectedId);
      if (!friend) throw new Error("Choose a friend to challenge.");
      const seed = crypto.randomUUID();
      const params = new URLSearchParams({ challenge: seed, subject });
      const url = `${window.location.origin}/quiz?${params.toString()}`;
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: userId,
        recipient_id: friend.id,
        body: `⚔️ Quiz Arena challenge! I picked a 15-question ${subject === "any" ? "mixed-subject" : subject} set for us. Open this link to take the same set and compare scores:\n${url}`,
      });
      if (error) throw error;
      return { seed, friend };
    },
    onSuccess: ({ seed, friend }) => {
      toast.success(
        `Challenge sent to ${friend.full_name || "your friend"}. Your round is starting.`,
      );
      setSelectedId(null);
      onOpenChange(false);
      onChallenge(seed);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not send the challenge."),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!sendInvite.isPending) onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-violet-500" /> Challenge a friend
          </DialogTitle>
          <DialogDescription>
            We’ll send a private message with the same 15-question set for both of you.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[52dvh] overflow-y-auto p-4">
          {friends.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading friends…
            </div>
          ) : friends.isError ? (
            <div className="py-8 text-center text-sm text-destructive">
              Could not load your following list. Please try again.
            </div>
          ) : friends.data?.length ? (
            <div className="space-y-2">
              {friends.data.map((friend) => {
                const chosen = selectedId === friend.id;
                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => setSelectedId(friend.id)}
                    aria-pressed={chosen}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 text-left transition-colors ${chosen ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60"}`}
                  >
                    <Avatar className="h-9 w-9">
                      {friend.avatar_url ? <AvatarImage src={friend.avatar_url} alt="" /> : null}
                      <AvatarFallback>
                        {(friend.full_name || "A").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {friend.full_name || "Aspirant"}
                    </span>
                    {chosen ? <Check className="h-4 w-4 text-primary" /> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <UserRoundPlus className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">No friends to challenge yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Follow someone first, then invite them to a shared quiz round.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => onOpenChange(false)}>
                Got it
              </Button>
            </div>
          )}
        </div>
        {friends.data?.length ? (
          <div className="flex justify-end gap-2 border-t p-4">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={sendInvite.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => sendInvite.mutate()}
              disabled={!selectedId || sendInvite.isPending}
            >
              {sendInvite.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Swords className="mr-2 h-4 w-4" />
              )}
              Send invite & play
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
