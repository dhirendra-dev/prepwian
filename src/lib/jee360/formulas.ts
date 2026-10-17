import type { Subject } from "@/lib/jee360/types";

export type FormulaCard = {
  id: string;
  subject: Subject;
  chapter: string;
  prompt: string;
  answer: string;
};

export const FORMULAS: FormulaCard[] = [
  { id: "p1", subject: "physics", chapter: "Rotational Motion", prompt: "Moment of inertia of a solid sphere about a diameter", answer: "I = (2/5) MR²" },
  { id: "p2", subject: "physics", chapter: "Rotational Motion", prompt: "Angular momentum of a rigid body", answer: "L = Iω" },
  { id: "p3", subject: "physics", chapter: "Gravitation", prompt: "Escape velocity from a planet", answer: "vₑ = √(2GM / R)" },
  { id: "p4", subject: "physics", chapter: "Gravitation", prompt: "Orbital velocity of a satellite", answer: "v₀ = √(GM / r)" },
  { id: "p5", subject: "physics", chapter: "SHM", prompt: "Time period of a simple pendulum", answer: "T = 2π √(L / g)" },
  { id: "p6", subject: "physics", chapter: "SHM", prompt: "Total energy in SHM", answer: "E = (1/2) k A²" },
  { id: "p7", subject: "physics", chapter: "Electrostatics", prompt: "Electric field of a point charge", answer: "E = kq / r²" },
  { id: "p8", subject: "physics", chapter: "Current Electricity", prompt: "Drift velocity", answer: "v_d = I / (n A e)" },
  { id: "p9", subject: "physics", chapter: "Magnetism", prompt: "Force on a current in a magnetic field", answer: "F = I ℓ × B" },
  { id: "p10", subject: "physics", chapter: "Optics", prompt: "Lens formula", answer: "1/v − 1/u = 1/f" },
  { id: "c1", subject: "chemistry", chapter: "Chemical Bonding", prompt: "Bond order from MOT", answer: "B.O. = (N_b − N_a) / 2" },
  { id: "c2", subject: "chemistry", chapter: "Thermodynamics", prompt: "First law of thermodynamics", answer: "ΔU = q + w" },
  { id: "c3", subject: "chemistry", chapter: "Thermodynamics", prompt: "Gibbs free energy", answer: "ΔG = ΔH − TΔS" },
  { id: "c4", subject: "chemistry", chapter: "Equilibrium", prompt: "Relation of Kp and Kc", answer: "Kp = Kc (RT)^Δn_g" },
  { id: "c5", subject: "chemistry", chapter: "Equilibrium", prompt: "pH of a buffer (Henderson)", answer: "pH = pKa + log([A⁻]/[HA])" },
  { id: "c6", subject: "chemistry", chapter: "Electrochemistry", prompt: "Nernst equation (298 K, n e⁻)", answer: "E = E° − (0.059/n) log Q" },
  { id: "c7", subject: "chemistry", chapter: "Chemical Kinetics", prompt: "First-order half life", answer: "t½ = 0.693 / k" },
  { id: "c8", subject: "chemistry", chapter: "Solutions", prompt: "Raoult’s law (vapour pressure)", answer: "p = p° · x" },
  { id: "c9", subject: "chemistry", chapter: "Atomic Structure", prompt: "de Broglie wavelength", answer: "λ = h / mv" },
  { id: "c10", subject: "chemistry", chapter: "Solid State", prompt: "Density of a cubic crystal", answer: "ρ = Z M / (N_A a³)" },
  { id: "m1", subject: "maths", chapter: "Sequences and Series", prompt: "Sum of first n naturals", answer: "n(n + 1) / 2" },
  { id: "m2", subject: "maths", chapter: "Sequences and Series", prompt: "Sum of infinite GP, |r| < 1", answer: "S∞ = a / (1 − r)" },
  { id: "m3", subject: "maths", chapter: "Straight Lines", prompt: "Slope of a line through two points", answer: "m = (y₂ − y₁) / (x₂ − x₁)" },
  { id: "m4", subject: "maths", chapter: "Circles", prompt: "Standard equation of a circle", answer: "(x − h)² + (y − k)² = r²" },
  { id: "m5", subject: "maths", chapter: "Conic Sections", prompt: "Standard parabola (right)", answer: "y² = 4ax" },
  { id: "m6", subject: "maths", chapter: "Conic Sections", prompt: "Eccentricity of an ellipse", answer: "e = √(1 − b²/a²), a > b" },
  { id: "m7", subject: "maths", chapter: "Limits", prompt: "lim x→0 (sin x) / x", answer: "1" },
  { id: "m8", subject: "maths", chapter: "Derivatives", prompt: "d/dx (sin x)", answer: "cos x" },
  { id: "m9", subject: "maths", chapter: "Integrals", prompt: "∫ dx / (x² + a²)", answer: "(1/a) tan⁻¹(x/a) + C" },
  { id: "m10", subject: "maths", chapter: "Probability", prompt: "P(A ∪ B)", answer: "P(A) + P(B) − P(A ∩ B)" },
];

export function pickSprint(subject: Subject | "mix", n = 8, seed = Date.now()): FormulaCard[] {
  const pool = subject === "mix" ? FORMULAS : FORMULAS.filter((f) => f.subject === subject);
  const copy = [...pool];
  let s = seed % 2147483647;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}
