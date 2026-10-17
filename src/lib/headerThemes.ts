export type HeaderThemeKey = "default" | "violet" | "emerald" | "sunset" | "midnight";

export const HEADER_THEMES: Record<
  HeaderThemeKey,
  { label: string; accent: string; accent2: string; cover: string; orb1: string; orb2: string }
> = {
  default:  { label: "Default",  accent: "#2f7bff", accent2: "#1558e6", cover: "linear-gradient(160deg,#dbeafe,#93c5fd 55%,#3b82f6)", orb1: "59,130,246",  orb2: "168,85,247" },
  violet:   { label: "Violet",   accent: "#8b5cf6", accent2: "#6d28d9", cover: "linear-gradient(160deg,#ede9fe,#c4b5fd 55%,#8b5cf6)", orb1: "139,92,246",  orb2: "236,72,153" },
  emerald:  { label: "Emerald",  accent: "#10b981", accent2: "#047857", cover: "linear-gradient(160deg,#d1fae5,#6ee7b7 55%,#10b981)", orb1: "16,185,129",  orb2: "59,130,246" },
  sunset:   { label: "Sunset",   accent: "#f97316", accent2: "#c2410c", cover: "linear-gradient(160deg,#ffedd5,#fdba74 55%,#f97316)", orb1: "249,115,22",  orb2: "236,72,153" },
  midnight: { label: "Midnight", accent: "#475569", accent2: "#1e293b", cover: "linear-gradient(160deg,#cbd5e1,#64748b 55%,#1e293b)", orb1: "71,85,105",   orb2: "59,130,246" },
};

export function getHeaderTheme(key?: string | null) {
  return HEADER_THEMES[(key as HeaderThemeKey) in HEADER_THEMES ? (key as HeaderThemeKey) : "default"];
}