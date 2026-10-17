export type CertificateTemplateKey =
  | "ornate"
  | "membership"
  | "streak"
  | "academic"
  | "test-series"
  | "course"
  | "community"
  | "recognition";
export type CertificateKind = "achievement" | "participation" | "completion" | "appreciation";
export type EligibilityMetric =
  | "membership_days"
  | "verified_member"
  | "daily_streak_days"
  | "study_hours"
  | "pomodoro_sessions"
  | "pomodoro_streak_days"
  | "subject_mastery";
export type EligibilityConfig =
  | { mode: "manual" }
  | { mode: "automatic"; metric: EligibilityMetric; threshold: number; subject?: string };
export type CertificateDetailField = {
  key: string;
  label: string;
  order: number;
  visible: boolean;
  required: boolean;
};

export const CERTIFICATE_CATEGORIES = [
  { value: "membership", label: "Legacy Membership" },
  { value: "streak", label: "Legacy Study Streak" },
  { value: "hours", label: "Legacy Study Hours" },
  { value: "mastery", label: "Legacy Subject Mastery" },
  { value: "pomodoro", label: "Legacy Pomodoro" },
  { value: "social", label: "Legacy Social" },
  { value: "account_membership", label: "Account & Membership" },
  { value: "consistency", label: "Study Consistency & Focus" },
  { value: "academic", label: "Academic Achievement" },
  { value: "test_series", label: "Test Series & Examination" },
  { value: "jee_neet", label: "JEE & NEET Preparation" },
  { value: "community", label: "Community & Leadership" },
  { value: "courses_events", label: "Courses, Events & Challenges" },
  { value: "recognition", label: "Special Recognition" },
  { value: "custom", label: "Custom" },
] as const;

export const ELIGIBILITY_METRICS: { value: EligibilityMetric; label: string }[] = [
  { value: "membership_days", label: "Verified membership duration (days)" },
  { value: "verified_member", label: "Verified profile status" },
  { value: "daily_streak_days", label: "Completed daily-study streak (days)" },
  { value: "study_hours", label: "Logged study hours" },
  { value: "pomodoro_sessions", label: "Completed Pomodoro sessions" },
  { value: "pomodoro_streak_days", label: "Pomodoro streak (days)" },
  { value: "subject_mastery", label: "All tracked topics mastered for a subject" },
];

export const DETAIL_FIELD_CATALOG: { key: string; label: string }[] = [
  { key: "membership_type", label: "Membership Type" },
  { key: "member_since", label: "Member Since" },
  { key: "membership_duration", label: "Membership Duration" },
  { key: "join_date", label: "Join Date" },
  { key: "community_name", label: "Community Name" },
  { key: "consecutive_days", label: "Consecutive Days" },
  { key: "completed_pomodoro_sessions", label: "Completed Pomodoro Sessions" },
  { key: "achievement_period", label: "Achievement Period" },
  { key: "total_verified_study_hours", label: "Total Verified Study Hours" },
  { key: "sessions_completed", label: "Sessions Completed" },
  { key: "subject", label: "Subject" },
  { key: "achievement", label: "Achievement" },
  { key: "topics_completed", label: "Topics Completed" },
  { key: "topics_mastered", label: "Topics Mastered" },
  { key: "mastery_percentage", label: "Mastery Percentage" },
  { key: "test_name", label: "Test Name" },
  { key: "exam_category", label: "Exam Category" },
  { key: "score", label: "Score" },
  { key: "maximum_marks", label: "Maximum Marks" },
  { key: "percentage", label: "Percentage" },
  { key: "rank", label: "Rank" },
  { key: "competition_name", label: "Competition Name" },
  { key: "total_participants", label: "Total Participants" },
  { key: "course_name", label: "Course Name" },
  { key: "modules_completed", label: "Modules Completed" },
  { key: "completion_date", label: "Completion Date" },
  { key: "challenge_name", label: "Challenge Name" },
  { key: "duration", label: "Duration" },
  { key: "completion_rate", label: "Completion Rate" },
  { key: "contribution_type", label: "Contribution Type" },
  { key: "verified_contributions", label: "Verified Contributions" },
  { key: "recognition_reason", label: "Recognition Reason" },
  { key: "issuing_authority", label: "Issuing Authority" },
  { key: "chapter_name", label: "Chapter Name" },
  { key: "pyq_count", label: "PYQ Questions Practised" },
];

export type CertificatePreset = {
  code: string;
  name: string;
  category: (typeof CERTIFICATE_CATEGORIES)[number]["value"];
  description: string;
  subtitle: string;
  templateKey: CertificateTemplateKey;
  certificateKind: CertificateKind;
  icon: string;
  fields: string[];
  eligibility?: EligibilityConfig;
};

const manual: EligibilityConfig = { mode: "manual" };
const dayStreak = (threshold: number): EligibilityConfig => ({
  mode: "automatic",
  metric: "daily_streak_days",
  threshold,
});
const fieldMap = new Map(DETAIL_FIELD_CATALOG.map((f) => [f.key, f.label]));
const preset = (
  code: string,
  name: string,
  category: CertificatePreset["category"],
  description: string,
  fields: string[],
  templateKey: CertificateTemplateKey,
  certificateKind: CertificateKind,
  eligibility: EligibilityConfig = manual,
): CertificatePreset => ({
  code,
  name,
  category,
  description,
  subtitle: description,
  fields,
  templateKey,
  certificateKind,
  eligibility,
  icon: "Award",
});

export const CERTIFICATE_PRESETS: CertificatePreset[] = [
  ...[
    "Official Member",
    "Community Member",
    "Verified Member",
    "Founding Member",
    "Early Supporter",
    "Community Contributor",
    "Long-Term Member",
  ].map((name, i) =>
    preset(
      `membership_${["official", "community", "verified", "founding", "early_supporter", "contributor", "long_term"][i]}`,
      name,
      "account_membership",
      `${name} of the JEE Prep Hub community.`,
      ["membership_type", "member_since", "membership_duration", "join_date", "community_name"],
      "membership",
      i === 5 ? "appreciation" : "achievement",
      i === 2
        ? { mode: "automatic", metric: "verified_member", threshold: 1 }
        : i === 1
          ? { mode: "automatic", metric: "membership_days", threshold: 30 }
          : manual,
    ),
  ),
  ...[
    ["3-Day Focus Streak", 3],
    ["7-Day Focus Streak", 7],
    ["30-Day Focus Streak", 30],
    ["100-Day Focus Streak", 100],
    ["365-Day Focus Streak", 365],
  ].map(([name, days]) =>
    preset(
      `focus_streak_${days}`,
      String(name),
      "consistency",
      `Completed the JEE Prep Hub daily-study checklist for ${days} consecutive days.`,
      ["consecutive_days", "achievement_period"],
      "streak",
      "achievement",
      dayStreak(Number(days)),
    ),
  ),
  ...[
    "Pomodoro Milestones",
    "Study Hours Milestones",
    "Daily Discipline Award",
    "Consistency Champion",
    "Backlog Completion Award",
    "Study Goal Completion",
  ].map((name, i) =>
    preset(
      `consistency_${["pomodoro_milestone", "study_hours_milestone", "daily_discipline", "consistency_champion", "backlog_completion", "study_goal"][i]}`,
      name,
      "consistency",
      `${name} in recognition of documented study effort.`,
      i === 0
        ? ["completed_pomodoro_sessions", "achievement_period"]
        : i === 1
          ? ["total_verified_study_hours", "sessions_completed", "achievement_period"]
          : ["achievement", "achievement_period"],
      "streak",
      i === 4 ? "completion" : "achievement",
    ),
  ),
  ...[
    "Academic Excellence",
    "Subject Mastery",
    "Physics Excellence",
    "Chemistry Excellence",
    "Mathematics Excellence",
    "Biology Excellence",
    "Syllabus Completion",
    "Revision Champion",
    "Problem-Solving Excellence",
    "Personal Best Achievement",
  ].map((name, i) => {
    const subject = ["", "", "Physics", "Chemistry", "Mathematics", "Biology"][i];
    const eligible = subject
      ? ({
          mode: "automatic",
          metric: "subject_mastery",
          threshold: 1,
          subject,
        } as EligibilityConfig)
      : manual;
    return preset(
      `academic_${["excellence", "subject_mastery", "physics", "chemistry", "mathematics", "biology", "syllabus_completion", "revision_champion", "problem_solving", "personal_best"][i]}`,
      name,
      "academic",
      `${name} for demonstrated academic growth and verified learning.`,
      ["subject", "achievement", "topics_completed", "topics_mastered", "mastery_percentage"],
      "academic",
      i === 6 ? "completion" : "achievement",
      eligible,
    );
  }),
  ...[
    "Test Series Participant",
    "Mock Test Completion",
    "Weekly Test Champion",
    "Monthly Test Champion",
    "Highest Scorer",
    "Top Rank Achievement",
    "Subject Test Excellence",
    "Accuracy Champion",
    "Speed and Accuracy Award",
    "Improvement Champion",
    "Perfect Score Achievement",
    "Test Series Completion",
    "All-India Rank Achievement",
  ].map((name, i) =>
    preset(
      `test_${["participant", "mock_completion", "weekly_champion", "monthly_champion", "highest_scorer", "top_rank", "subject_excellence", "accuracy", "speed_accuracy", "improvement", "perfect_score", "series_completion", "all_india_rank"][i]}`,
      name,
      "test_series",
      `${name} in an administered test or examination.`,
      ["test_name", "exam_category", "score", "maximum_marks", "percentage", "rank"],
      "test-series",
      i === 0 ? "participation" : i === 1 || i === 11 ? "completion" : "achievement",
    ),
  ),
  ...[
    "JEE Main Preparation Milestone",
    "JEE Advanced Preparation Milestone",
    "NEET Preparation Milestone",
    "Chapter Completion",
    "PYQ Practice Milestone",
    "Full Syllabus Mock Completion",
    "Revision Marathon Completion",
    "Preparation Consistency Award",
  ].map((name, i) =>
    preset(
      `exam_prep_${["jee_main", "jee_advanced", "neet", "chapter_completion", "pyq_practice", "full_syllabus_mock", "revision_marathon", "consistency"][i]}`,
      name,
      "jee_neet",
      `${name}, based on completed and reviewed preparation work.`,
      i === 3
        ? ["chapter_name", "subject", "completion_date"]
        : i === 4
          ? ["subject", "pyq_count", "achievement_period"]
          : ["exam_category", "achievement", "achievement_period"],
      "academic",
      i === 3 || i === 5 || i === 6 ? "completion" : "achievement",
    ),
  ),
  ...[
    "Helpful Member",
    "Doubt Solver",
    "Peer Mentor",
    "Community Volunteer",
    "Discussion Contributor",
    "Resource Contributor",
    "Student Leader",
    "Community Champion",
  ].map((name, i) =>
    preset(
      `community_${["helpful_member", "doubt_solver", "peer_mentor", "volunteer", "discussion_contributor", "resource_contributor", "student_leader", "champion"][i]}`,
      name,
      "community",
      `${name} for a verified contribution to the JEE Prep Hub community.`,
      ["contribution_type", "verified_contributions", "community_name"],
      "community",
      i === 0 ? "appreciation" : "achievement",
    ),
  ),
  ...[
    "Course Completion",
    "Workshop Participation",
    "Webinar Participation",
    "Quiz Competition",
    "Study Challenge Completion",
    "7-Day Challenge",
    "30-Day Challenge",
    "Special Event Recognition",
  ].map((name, i) =>
    preset(
      `event_${["course_completion", "workshop_participation", "webinar_participation", "quiz_competition", "study_challenge", "7_day_challenge", "30_day_challenge", "special_event"][i]}`,
      name,
      "courses_events",
      `${name}, recorded by an authorized course or event administrator.`,
      i === 0
        ? ["course_name", "modules_completed", "completion_date"]
        : ["challenge_name", "duration", "completion_rate", "achievement_period"],
      i === 0 ? "course" : "community",
      i === 1 || i === 2 ? "participation" : "completion",
    ),
  ),
  ...[
    "Certificate of Appreciation",
    "Certificate of Participation",
    "Certificate of Completion",
    "Certificate of Excellence",
    "Outstanding Contribution",
    "Special Recognition Award",
    "Achievement of the Month",
  ].map((name, i) =>
    preset(
      `recognition_${["appreciation", "participation", "completion", "excellence", "outstanding_contribution", "special_award", "achievement_of_month"][i]}`,
      name,
      "recognition",
      `${name}, awarded by an authorized JEE Prep Hub administrator.`,
      ["recognition_reason", "issuing_authority"],
      "recognition",
      i === 1 ? "participation" : i === 2 ? "completion" : "appreciation",
    ),
  ),
];

export function fieldsForKeys(keys: string[]): CertificateDetailField[] {
  return keys.map((key, order) => ({
    key,
    label: fieldMap.get(key) ?? key.replaceAll("_", " "),
    order,
    visible: true,
    required: false,
  }));
}

export function isCertificateDetailField(value: unknown): value is CertificateDetailField {
  if (!value || typeof value !== "object") return false;
  const field = value as Partial<CertificateDetailField>;
  return (
    typeof field.key === "string" &&
    typeof field.label === "string" &&
    typeof field.order === "number" &&
    typeof field.visible === "boolean" &&
    typeof field.required === "boolean"
  );
}
