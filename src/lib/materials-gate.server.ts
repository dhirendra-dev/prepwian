import { useSession } from "@tanstack/react-start/server";

/**
 * Shared server-only helpers for the study-material password gate.
 *
 * Both the materials library and the SEO landing pages (physics / mathematics)
 * read the same session flag, so one password unlocks every page that shows
 * copyrighted material.
 */

export type MaterialsGateSession = { materialsUnlocked?: boolean };

export function materialsSessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "jph-materials-gate",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export async function materialsSession() {
  return useSession<MaterialsGateSession>(materialsSessionConfig());
}

export async function isMaterialsUnlocked() {
  try {
    const session = await materialsSession();
    return session.data.materialsUnlocked === true;
  } catch {
    return false;
  }
}
