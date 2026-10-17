import { supabase } from "@/integrations/supabase/client";

export type UserState = {
  userId: string;
  xp: number;
  streak: number;
  loginDays: unknown[];
  studySessions: unknown[];
  topicProgress: unknown[];
  dailyTargets: unknown[];
};

export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function loadUserState(
  userId: string,
): Promise<UserState> {
  const [
    xpResult,
    loginDaysResult,
    studySessionsResult,
    topicProgressResult,
    dailyTargetsResult,
  ] = await Promise.all([
    supabase
      .from("user_xp")
      .select("total_xp")
      .eq("user_id", userId)
      .maybeSingle(),

    supabase
      .from("user_login_days")
      .select("*")
      .eq("user_id", userId)
      .order("login_date", { ascending: false }),

    supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),

    supabase
      .from("topic_progress")
      .select("*")
      .eq("user_id", userId),

    supabase
      .from("user_daily_targets")
      .select("*")
      .eq("user_id", userId)
      .order("task_date", { ascending: false }),
  ]);

  if (xpResult.error) throw xpResult.error;
  if (loginDaysResult.error) throw loginDaysResult.error;
  if (studySessionsResult.error) throw studySessionsResult.error;
  if (topicProgressResult.error) throw topicProgressResult.error;
  if (dailyTargetsResult.error) throw dailyTargetsResult.error;

  const { data: streak } = await supabase.rpc(
    "get_study_streak",
    { p_user_id: userId },
  );

  return {
    userId,
    xp: xpResult.data?.total_xp ?? 0,
    streak: Number(streak ?? 0),
    loginDays: loginDaysResult.data ?? [],
    studySessions: studySessionsResult.data ?? [],
    topicProgress: topicProgressResult.data ?? [],
    dailyTargets: dailyTargetsResult.data ?? [],
  };
}