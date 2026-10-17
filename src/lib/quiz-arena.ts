/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ArenaSubject = "all" | "physics" | "chemistry" | "mathematics" | "biology";
export type ArenaMode = "ranked" | "unranked";

const call = async (name: string, args?: Record<string, unknown>) => {
  const { data, error } = await (supabase as any).rpc(name, args ?? {});
  if (error) throw new Error(error.message || "The arena service is unavailable.");
  return data;
};

export const arenaError = (error: unknown) => {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const key = raw
    .toLowerCase()
    .match(
      /room_not_found|room_full|you_are_busy|inviter_busy|player_not_found|cannot_invite_self|too_many_invites|too_many_attempts|invite_not_found|not_member|invalid_parameters|not_finished/,
    )?.[0];
  return (
    (
      {
        room_not_found: "That room does not exist or has expired.",
        room_full: "That room already has two players.",
        you_are_busy: "Finish or leave your current battle before starting another.",
        inviter_busy: "That player is already in a battle.",
        player_not_found: "We could not find that player.",
        cannot_invite_self: "You cannot invite yourself.",
        too_many_invites: "You have reached the invite limit. Try again later.",
        too_many_attempts: "Too many attempts. Please wait a moment.",
        invite_not_found: "That invite is no longer available.",
        not_member: "You are not a member of this battle.",
        invalid_parameters: "Check the selected options and try again.",
        not_finished: "The battle is not finished yet.",
      } as Record<string, string>
    )[key ?? ""] ??
    (raw || "Something went wrong. Please try again.")
  );
};

export const arenaOverview = () => call("quiz_arena_overview");
export const queueJoin = (format: string, subject: ArenaSubject, ranked: boolean) =>
  call("quiz_queue_join", { _format: format, _subject: subject, _ranked: ranked });
export const queuePoll = () => call("quiz_queue_poll");
export const queueLeave = () => call("quiz_queue_leave");
export const roomCreate = (
  format: string,
  subject: ArenaSubject,
  chapter: string | null,
  mode: ArenaMode,
) =>
  call("quiz_room_create", { _format: format, _subject: subject, _chapter: chapter, _mode: mode });
export const roomJoin = (code: string) => call("quiz_room_join", { _code: code.toUpperCase() });
export const battleGet = (battleId: string) => call("quiz_battle_get", { _bid: battleId });
export const battleReady = (battleId: string, ready: boolean) =>
  call("quiz_battle_ready", { _bid: battleId, _ready: ready });
export const battleAnswer = (
  battleId: string,
  seq: number,
  selected: string[],
  numerical: number | null,
) =>
  call("quiz_battle_answer", {
    _bid: battleId,
    _seq: seq,
    _selected: selected,
    _numerical: numerical,
  });
export const battleLeave = (battleId: string) => call("quiz_battle_leave", { _bid: battleId });
export const battleReview = (battleId: string) => call("quiz_battle_review", { _bid: battleId });
export const searchPlayers = (query: string) => call("quiz_search_players", { _q: query });
export const inviteSend = (
  username: string,
  format: string,
  subject: ArenaSubject,
  chapter: string | null,
  mode: ArenaMode,
) =>
  call("quiz_invite_send", {
    _username: username,
    _format: format,
    _subject: subject,
    _chapter: chapter,
    _mode: mode,
  });
export const inviteRespond = (id: string, accept: boolean) =>
  call("quiz_invite_respond", { _id: id, _accept: accept });
export const inviteCancel = (id: string) => call("quiz_invite_cancel", { _id: id });
export const invitesList = () => call("quiz_invites_list");

const ImageInput = z.object({ kind: z.literal("battle"), id: z.string().uuid() });
export const signQuizImages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ImageInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase: userClient } = context as any;
    const { data: paths, error } = await userClient.rpc("quiz_image_paths", {
      _kind: data.kind,
      _id: data.id,
    });
    if (error) throw new Error(error.message);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = Array.isArray(paths) ? paths : paths ? [paths] : [];
    const result: Record<string, string> = {};
    for (const row of rows) {
      const path = typeof row === "string" ? row : row?.path;
      if (!path) continue;
      const { data: signed, error: signError } = await supabaseAdmin.storage
        .from("test-images")
        .createSignedUrl(path, 3600);
      if (!signError && signed?.signedUrl) result[path] = signed.signedUrl;
    }
    return result;
  });
