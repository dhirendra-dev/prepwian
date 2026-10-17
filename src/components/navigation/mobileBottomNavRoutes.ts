/**
 * Central visibility policy for the mobile bottom navigation.
 *
 * SAFE DEFAULT: visible unless a route is explicitly excluded.
 * Exclusions ALWAYS win.
 */

/** Full-screen / focus workflows where a fixed dock would get in the way. */
const ALWAYS_HIDDEN_PATTERNS: readonly RegExp[] = [
  /(?:^|\/)prep[-_/]?lab(?:\/|$)/i,
  // AI + live chat
  /(?:^|\/)ai[-_/]?study(?:[-_/]?chat)?(?:\/|$)/i,
  /(?:^|\/)ai[-_/]?chat(?:\/|$)/i,
  /(?:^|\/)sahai(?:\/|$)/i,
  /(?:^|\/)(?:community|community[-_/]?live)(?:\/|$)/i,
  /(?:^|\/)live(?:[-_/ ]?(?:chat|community|class))?(?:\/|$)/i,
  // Planner
  /(?:^|\/)jee[-_/]?360(?:[-_/][^/]*)?(?:\/|$)/i,
  // Tests, quizzes, exams (players + attempts + reviews)
  /(?:^|\/)(?:quiz|quizzes|test|tests)[-_/]?(?:arena|player|attempt|session|review|result)(?:\/|$)/i,
  /(?:^|\/)(?:exam|exams|mock|mocks)[-_/]?(?:interface|player|attempt|session|review|result)(?:\/|$)/i,
  /(?:^|\/)(?:attempt|battle|arena)(?:\/|$)/i,
  // Calls / meetings / watch party / focus mode
  /(?:^|\/)(?:meeting|meetings|call|room|watch|watch[-_/]?party|focus)(?:\/|$)/i,
  // Auth + onboarding
  /(?:^|\/)(?:auth|login|signup|sign-up|register|forgot-password|reset-password|verify(?:[-_/]?account)?|onboarding)(?:\/|$)/i,
  // Payments
  /(?:^|\/)(?:checkout|payment|billing)(?:\/|$)/i,
  // Staff
  /(?:^|\/)(?:admin|developer)(?:\/|$)/i,
  // Non-UI endpoints
  /^(?:\/api|\/sitemap\.xml)(?:\/|$)/i,
];

export function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0].split("#")[0] || "/";
  if (path === "/") return "/";
  return path.replace(/\/+$/, "") || "/";
}

export function shouldShowMobileBottomNav(pathname: string): boolean {
  const path = normalizePath(pathname);

  return !ALWAYS_HIDDEN_PATTERNS.some((pattern) => pattern.test(path));
}
