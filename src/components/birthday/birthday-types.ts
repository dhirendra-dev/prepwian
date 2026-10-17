export const BIRTHDAY_PARTY_THEMES = [
  { id: "pastel", label: "Pastel dreamland", shortLabel: "Pastel", emoji: "🦋" },
  { id: "galaxy", label: "Midnight galaxy", shortLabel: "Galaxy", emoji: "🌌" },
  { id: "candy", label: "Candy party", shortLabel: "Candy", emoji: "🍬" },
  { id: "golden", label: "Golden celebration", shortLabel: "Golden", emoji: "✨" },
] as const;

export type BirthdayPartyTheme = (typeof BIRTHDAY_PARTY_THEMES)[number]["id"];

export type BirthdayActivity =
  | "balloon_pop"
  | "gift_open"
  | "cake_cut"
  | "fireworks"
  | "letter_open"
  | "capsule_open"
  | "magic_wand"
  | "grand_finale"
  | "memory_card_saved";

export function isBirthdayPartyTheme(value: unknown): value is BirthdayPartyTheme {
  return BIRTHDAY_PARTY_THEMES.some((theme) => theme.id === value);
}
