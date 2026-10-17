/**
 * Permission keys used by the sub-admin (moderator) system.
 * These map 1:1 to admin sections. `security`, `audit` and moderator
 * management itself are full-admin only and have no key here.
 */
export const PERMISSION_KEYS = [
  "users",
  "materials",
  "notices",
  "notifications",
  "certificates",
  "community",
  "contact",
  "consents",
  "pro",
  "appeals",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  users: "Users (suspend/ban only)",
  materials: "Materials",
  notices: "Notices",
  notifications: "Notifications",
  certificates: "Certificates",
  community: "Community groups",
  contact: "Contact inbox",
  consents: "Consents (view only)",
  pro: "Pro members",
  appeals: "Appeals",
};

type RpcClient = { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown }> };

/** Throws "Forbidden" unless the user is a full admin or a moderator with `permission`. */
export async function assertPermission(sb: unknown, userId: string, permission: PermissionKey) {
  const { data } = await (sb as RpcClient).rpc("has_permission", {
    _user_id: userId,
    _permission: permission,
  });
  if (!data) throw new Error("Forbidden");
}
