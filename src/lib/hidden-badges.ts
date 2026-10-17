/**
 * Visual-only badge suppression.
 *
 * User ids listed here keep FULL admin/moderator permissions (user_roles rows,
 * RLS access, admin console) — only the public-facing "Admin" tag / blue tick
 * that is derived from the admin role is hidden for them.
 */
export const HIDDEN_BADGE_USER_IDS: readonly string[] = [
  "cd70c40b-23cc-4dcd-bd32-538aecc03246",
];

export function isBadgeHidden(userId?: string | null): boolean {
  return !!userId && HIDDEN_BADGE_USER_IDS.includes(userId);
}
