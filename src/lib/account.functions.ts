import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export const signOutAllAccountSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({}).parse(input ?? {}))
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.signOut(context.userId, "global");
    if (error) throw new Error("Couldn't sign out all sessions. Please try again.");
    return { ok: true };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ confirmation: z.literal("DELETE") }).parse(input))
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("Account deletion failed. Please try again or contact support.");
    return { ok: true };
  });


const EXPORT_OWNERSHIP_TABLES = [
  ["profiles", "id"],
  ["account_consent_locks", "user_id"],
  ["account_restrictions", "user_id"],
  ["account_verifications", "user_id"],
  ["audit_logs", "actor_id"],
  ["audit_logs", "target_user_id"],
  ["article_author_subscriptions", "author_id"],
  ["article_bookmarks", "user_id"],
  ["article_comments", "author_id"],
  ["article_likes", "user_id"],
  ["article_views", "user_id"],
  ["articles", "author_id"],
  ["chat_message_reactions", "user_id"],
  ["chat_messages", "user_id"],
  ["chat_reads", "user_id"],
  ["communities", "created_by"],
  ["contact_messages", "user_id"],
  ["daily_tasks", "user_id"],
  ["dashboard_preferences", "user_id"],
  ["direct_messages", "sender_id"],
  ["direct_messages", "recipient_id"],
  ["feed_comment_votes", "user_id"],
  ["feed_comments", "user_id"],
  ["feed_likes", "user_id"],
  ["feed_post_votes", "user_id"],
  ["feed_posts", "user_id"],
  ["feed_stories", "user_id"],
  ["feedback_submissions", "user_id"],
  ["feedback_wall_likes", "user_id"],
  ["feedback_wall_posts", "user_id"],
  ["forum_replies", "user_id"],
  ["forum_threads", "user_id"],
  ["group_members", "user_id"],
  ["groups", "owner_id"],
  ["groups", "created_by"],
  ["jee_backlog_items", "user_id"],
  ["jee_college_shortlists", "user_id"],
  ["jee_counselling_tasks", "user_id"],
  ["jee_daily_practice_attempts", "user_id"],
  ["jee_daily_targets", "user_id"],
  ["jee_document_checklist", "user_id"],
  ["jee_dpp_tracker", "user_id"],
  ["jee_exam_milestones", "user_id"],
  ["jee_formula_vault", "user_id"],
  ["jee_lecture_tracker", "user_id"],
  ["jee_mistake_book", "user_id"],
  ["jee_preference_lists", "user_id"],
  ["jee_pyq_attempts", "user_id"],
  ["jee_pyq_bookmarks", "user_id"],
  ["jee_question_bookmarks", "user_id"],
  ["jee_revision_tasks", "user_id"],
  ["jee_study_goals", "user_id"],
  ["jee_study_plans", "user_id"],
  ["jee_study_tasks", "user_id"],
  ["jee_syllabus_progress", "user_id"],
  ["leaderboard_weekly_totals", "user_id"],
  ["live_session_participants", "user_id"],
  ["live_sessions", "host_id"],
  ["meeting_participants", "user_id"],
  ["meeting_rooms", "host_id"],
  ["moderation_appeals", "user_id"],
  ["notes_progress", "user_id"],
  ["notification_reads", "user_id"],
  ["poll_votes", "user_id"],
  ["profile_post_comments", "user_id"],
  ["profile_post_likes", "user_id"],
  ["profile_posts", "user_id"],
  ["protected_identities", "owner_id"],
  ["quiz_achievement_awards", "user_id"],
  ["quiz_battles", "created_by"],
  ["quiz_battle_players", "user_id"],
  ["quiz_battle_responses", "user_id"],
  ["quiz_daily_attempts", "user_id"],
  ["quiz_daily_responses", "user_id"],
  ["quiz_matchmaking_queue", "user_id"],
  ["quiz_mission_progress", "user_id"],
  ["quiz_practice_sessions", "user_id"],
  ["quiz_rating_history", "user_id"],
  ["quiz_security_events", "user_id"],
  ["quiz_stats", "user_id"],
  ["quiz_subject_stats", "user_id"],
  ["quiz_topic_stats", "user_id"],
  ["sahai_messages", "user_id"],
  ["server_security_events", "user_id"],
  ["squad_notification_prefs", "user_id"],
  ["streak_claims", "user_id"],
  ["streak_recoveries", "user_id"],
  ["study_activity_events", "user_id"],
  ["study_group_messages", "user_id"],
  ["study_planner_goals", "user_id"],
  ["study_planner_tasks", "user_id"],
  ["study_sessions", "user_id"],
  ["test_attempts", "user_id"],
  ["test_bookmarks", "user_id"],
  ["test_reports", "user_id"],
  ["topic_progress", "user_id"],
  ["user_certificates", "user_id"],
  ["user_consents", "user_id"],
  ["user_daily_targets", "user_id"],
  ["user_login_days", "user_id"],
  ["user_moderation", "user_id"],
  ["user_roles", "user_id"],
  ["user_security_events", "user_id"],
  ["user_xp", "user_id"],
  ["video_comments", "user_id"],
  ["video_likes", "user_id"],
  ["video_watch_progress", "user_id"],
  ["watch_room_completions", "user_id"],
  ["watch_room_members", "user_id"],
  ["watch_room_messages", "user_id"],
  ["watch_rooms", "host_id"],
  ["weekly_winners", "user_id"],
  ["xp_transactions", "user_id"],
  ["test_ai_access", "user_id"],
  ["feedback_forms", "created_by"],
  ["notices", "created_by"],
  ["notifications", "created_by"],
  ["polls", "created_by"],
  ["tests", "created_by"],
  ["toppers", "created_by"],
] as const;

/** Export data rows owned or authored by the authenticated user. */
export const exportMyAccountData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // The dynamic table names are restricted to the explicit allowlist below.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = supabaseAdmin as any;
    const tables: Record<string, Json[]> = {};
    const unavailable: string[] = [];
    const pageSize = 1000;

    for (let offset = 0; offset < EXPORT_OWNERSHIP_TABLES.length; offset += 6) {
      const batch = EXPORT_OWNERSHIP_TABLES.slice(offset, offset + 6);
      const results = await Promise.all(batch.map(async ([table, ownerColumn]) => {
        const rows: Json[] = [];
        try {
          for (let from = 0; ; from += pageSize) {
            const { data, error } = await admin
              .from(table)
              .select("*")
              .eq(ownerColumn, context.userId)
              .range(from, from + pageSize - 1);
            if (error) throw error;
            rows.push(...((data ?? []) as Json[]));
            if (!data || data.length < pageSize) break;
          }
          return { table, rows };
        } catch {
          return { table, rows: null };
        }
      }));
      for (const result of results) {
        if (result.rows === null) unavailable.push(result.table);
        else if (result.rows.length) {
          const previous = tables[result.table] ?? [];
          const merged = new Map<string, Json>();
          for (const row of [...previous, ...result.rows]) {
            const id = row && typeof row === "object" && "id" in row
              ? String((row as { id: Json }).id)
              : JSON.stringify(row);
            merged.set(id, row);
          }
          tables[result.table] = [...merged.values()];
        }
      }
    }

    return {
      exportedAt: new Date().toISOString(),
      accountId: context.userId,
      tables,
      tableCount: Object.keys(tables).length,
      recordCount: Object.values(tables).reduce((total, rows) => total + rows.length, 0),
      unavailableTables: unavailable,
      excludedData: [
        "Third-party integration credentials and OAuth tokens are not included.",
        "Private administrator notes and other users' private records are not included.",
        "The export includes records directly owned or authored by this account; shared records owned by other people are not copied.",
        "JEE 360 planner and browser-only preferences are stored on this device and are added by the Settings page during download.",
      ],
    };
  });
