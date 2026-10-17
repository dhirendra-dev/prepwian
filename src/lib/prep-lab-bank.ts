/**
 * PREPWIAN / JEE Prep Hub Prep Lab question bank.
 *
 * This module produces original, parameterized practice questions from transparent
 * educational templates. These are NOT official PYQs, answer keys, or expert-reviewed
 * exam papers. Review and validate any question before using it in a formal assessment.
 */
export type ExamTrack = "JEE Main" | "JEE Advanced" | "NEET UG";
export type PrepSubject = "Physics" | "Chemistry" | "Mathematics" | "Biology";
export type Difficulty = "Foundation" | "Standard" | "Advanced";

export type PrepQuestion = {
  id: string;
  subject: PrepSubject;
  chapter: string;
  topic: string;
  difficulty: Difficulty;
  exams: ExamTrack[];
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  source: "Original generated practice" | "User imported";
};

const JEE: ExamTrack[] = ["JEE Main", "JEE Advanced"];
const ALL_EXAMS: ExamTrack[] = ["JEE Main", "JEE Advanced", "NEET UG"];
const DIFFICULTIES: Difficulty[] = ["Foundation", "Standard", "Advanced"];

function examsFor(subject: PrepSubject): ExamTrack[] {
  if (subject === "Biology") return ["NEET UG"];
  if (subject === "Mathematics") return JEE;
  return ALL_EXAMS;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle<T>(items: T[], seedText: string): T[] {
  const out = [...items];
  let seed = hashString(seedText) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function formatAnswer(value: number, unit = ""): string {
  const formatted = formatNumber(value);
  if (!unit) return formatted;
  if (unit === "%") return `${formatted}%`;
  return `${formatted} ${unit}`;
}

type QuestionMeta = Omit<PrepQuestion, "options" | "answerIndex" | "source" | "explanation">;

function makeNumeric(
  meta: QuestionMeta,
  answer: number,
  explanation: string,
  unit = "",
  extras: number[] = [],
): PrepQuestion {
  const raw = [
    answer,
    ...extras,
    answer + 1,
    answer - 1,
    answer * 2,
    answer / 2,
    answer + 5,
    answer - 5,
    answer * 1.5,
    answer * 0.75,
  ];
  const values: number[] = [];
  const displayed = new Set<string>();
  for (const n of raw) {
    if (!Number.isFinite(n) || (answer >= 0 && n < 0)) continue;
    const key = formatAnswer(n, unit);
    if (!displayed.has(key)) {
      values.push(n);
      displayed.add(key);
    }
    if (values.length === 4) break;
  }
  while (values.length < 4) {
    const n = answer + values.length + 11;
    const key = formatAnswer(n, unit);
    if (!displayed.has(key)) {
      values.push(n);
      displayed.add(key);
    }
  }
  const options = seededShuffle(values.map((n) => formatAnswer(n, unit)), meta.id);
  return {
    ...meta,
    options,
    answerIndex: options.indexOf(formatAnswer(answer, unit)),
    explanation,
    source: "Original generated practice",
  };
}

function makeChoice(
  meta: QuestionMeta,
  answer: string,
  distractors: string[],
  explanation: string,
): PrepQuestion {
  const all = [answer, ...distractors].filter((item, i, arr) => item.trim() && arr.indexOf(item) === i).slice(0, 4);
  const options = seededShuffle(all, meta.id);
  return {
    ...meta,
    options,
    answerIndex: options.indexOf(answer),
    explanation,
    source: "Original generated practice",
  };
}

function meta(
  id: string,
  subject: PrepSubject,
  chapter: string,
  topic: string,
  variant: number,
  question: string,
): QuestionMeta {
  return {
    id,
    subject,
    chapter,
    topic,
    difficulty: DIFFICULTIES[(variant - 1) % DIFFICULTIES.length],
    exams: examsFor(subject),
    question,
  };
}

const bank: PrepQuestion[] = [];
const pad = (n: number) => String(n).padStart(3, "0");
const addN = (
  id: string,
  subject: PrepSubject,
  chapter: string,
  topic: string,
  i: number,
  prompt: string,
  answer: number,
  explanation: string,
  unit = "",
  distractors: number[] = [],
) => bank.push(makeNumeric(meta(id, subject, chapter, topic, i, prompt), answer, explanation, unit, distractors));

/* ------------------------------- PHYSICS ------------------------------- */
for (let i = 1; i <= 50; i++) {
  const mass = ((i - 1) % 10) + 1;
  const accel = Math.floor((i - 1) / 10) + 1;
  addN(`PHY-FORCE-${pad(i)}`, "Physics", "Mechanics", "Newton's second law", i,
    `A net force acts on a ${mass} kg object and produces an acceleration of ${accel} m/s². What is the net force?`,
    mass * accel, "Newton's second law gives F = ma. Multiply the mass by the acceleration.",
    "N", [mass + accel, mass * (accel + 1), Math.abs(mass - accel)]);
}
for (let i = 1; i <= 50; i++) {
  const u = ((i - 1) % 10) * 2;
  const t = Math.floor((i - 1) / 10) + 1;
  const a = 1 + ((i * 7) % 5);
  addN(`PHY-VELOCITY-${pad(i)}`, "Physics", "Kinematics", "Equations of motion", i,
    `A particle has initial velocity ${u} m/s and constant acceleration ${a} m/s². Find its velocity after ${t} s.`,
    u + a * t, "For constant acceleration, v = u + at. Substitute the given initial velocity, acceleration, and time.",
    "m/s", [u + a, u + a * t * 2, u + t]);
}
for (let i = 1; i <= 50; i++) {
  const u = ((i - 1) % 10) + 1;
  const t = Math.floor((i - 1) / 10) + 1;
  const a = 2 * (((i - 1) % 5) + 1);
  addN(`PHY-DISPLACEMENT-${pad(i)}`, "Physics", "Kinematics", "Displacement under constant acceleration", i,
    `A body has initial velocity ${u} m/s and acceleration ${a} m/s². How far does it travel in ${t} s?`,
    u * t + 0.5 * a * t * t, "Use s = ut + ½at². Keep the time squared in the acceleration term.",
    "m", [u * t + a * t, u * t + a * t * t, u + a * t]);
}
for (let i = 1; i <= 50; i++) {
  const mass = Math.floor((i - 1) / 10) + 1;
  const velocity = ((i - 1) % 10) + 2;
  addN(`PHY-MOMENTUM-${pad(i)}`, "Physics", "Mechanics", "Linear momentum", i,
    `A ${mass} kg object moves at ${velocity} m/s. What is the magnitude of its linear momentum?`,
    mass * velocity, "Linear momentum is p = mv. Multiply mass by velocity.",
    "kg·m/s", [mass + velocity, mass * velocity * 2, velocity / mass]);
}
for (let i = 1; i <= 50; i++) {
  const mass = 2 * (Math.floor((i - 1) / 10) + 1);
  const velocity = ((i - 1) % 10) + 1;
  addN(`PHY-KINETIC-${pad(i)}`, "Physics", "Work, Energy & Power", "Kinetic energy", i,
    `A ${mass} kg object moves at ${velocity} m/s. Calculate its kinetic energy.`,
    0.5 * mass * velocity * velocity, "Kinetic energy is K = ½mv². Square the speed before multiplying by half the mass.",
    "J", [mass * velocity, mass * velocity * velocity, 0.5 * mass * velocity]);
}
for (let i = 1; i <= 50; i++) {
  const mass = ((i - 1) % 10) + 1;
  const height = Math.floor((i - 1) / 10) + 1;
  addN(`PHY-POTENTIAL-${pad(i)}`, "Physics", "Work, Energy & Power", "Gravitational potential energy", i,
    `Near Earth's surface, take g = 10 m/s². What is the gravitational potential energy of a ${mass} kg object at a height of ${height} m?`,
    mass * 10 * height, "Gravitational potential energy relative to the reference level is U = mgh.",
    "J", [mass * height, mass * 10 + height, mass * 9.8 * height]);
}
for (let i = 1; i <= 50; i++) {
  const frequency = ((i - 1) % 10) + 1;
  const wavelength = Math.floor((i - 1) / 10) + 1;
  addN(`PHY-WAVE-${pad(i)}`, "Physics", "Waves & Oscillations", "Wave speed", i,
    `A wave has frequency ${frequency} Hz and wavelength ${wavelength} m. Find its speed.`,
    frequency * wavelength, "Wave speed is v = fλ. Multiply frequency by wavelength.",
    "m/s", [frequency + wavelength, frequency / wavelength, frequency * wavelength * 2]);
}
for (let i = 1; i <= 50; i++) {
  const density = Math.floor((i - 1) / 10) + 1;
  const volume = ((i - 1) % 10) + 1;
  addN(`PHY-DENSITY-${pad(i)}`, "Physics", "Properties of Matter", "Density", i,
    `A uniform sample has mass ${density * volume} kg and volume ${volume} m³. What is its density?`,
    density, "Density is mass divided by volume: ρ = m/V.",
    "kg/m³", [density * volume, density + volume, volume / (density || 1)]);
}
for (let i = 1; i <= 50; i++) {
  const voltage = 2 * (Math.floor((i - 1) / 10) + 1);
  const current = ((i - 1) % 10) + 1;
  addN(`PHY-POWER-${pad(i)}`, "Physics", "Electricity", "Electric power", i,
    `A component has a potential difference of ${voltage} V and carries ${current} A. What electrical power is delivered?`,
    voltage * current, "For a component with known voltage and current, P = VI.",
    "W", [voltage + current, voltage * current * 2, voltage / current]);
}
for (let i = 1; i <= 50; i++) {
  const force = 10 * (Math.floor((i - 1) / 10) + 1);
  const area = ((i - 1) % 10) + 1;
  addN(`PHY-PRESSURE-${pad(i)}`, "Physics", "Properties of Matter", "Pressure", i,
    `A perpendicular force of ${force} N acts uniformly on an area of ${area} m². What pressure is produced?`,
    force / area, "Pressure is normal force per unit area: P = F/A.",
    "Pa", [force * area, force + area, area / force]);
}

/* ------------------------------ CHEMISTRY ------------------------------ */
const molarMasses = [
  { name: "water (H₂O)", mass: 18 },
  { name: "carbon dioxide (CO₂)", mass: 44 },
  { name: "sodium chloride (NaCl)", mass: 58.5 },
  { name: "calcium carbonate (CaCO₃)", mass: 100 },
  { name: "oxygen gas (O₂)", mass: 32 },
];
for (let i = 1; i <= 50; i++) {
  const compound = molarMasses[Math.floor((i - 1) / 10)];
  const moles = ((i - 1) % 10) + 1;
  const mass = compound.mass * moles;
  addN(`CHE-MOLES-${pad(i)}`, "Chemistry", "Some Basic Concepts", "Mole concept", i,
    `A sample contains ${mass} g of ${compound.name}. Using molar mass ${compound.mass} g/mol, how many moles are present?`,
    moles, "Use n = m/M. Divide the given mass by the molar mass.",
    "mol", [mass, moles * 2, moles / 2]);
}
for (let i = 1; i <= 50; i++) {
  const concentration = Math.floor((i - 1) / 5) + 1;
  const volume = (((i - 1) % 5) + 1) * 0.5;
  const moles = concentration * volume;
  addN(`CHE-MOLARITY-${pad(i)}`, "Chemistry", "Solutions", "Molarity", i,
    `A solution contains ${moles} mol of solute in ${volume} L of solution. What is its molarity?`,
    concentration, "Molarity is moles of solute per litre of solution: M = n/V.",
    "mol/L", [moles, concentration * volume, concentration / volume]);
}
for (let i = 1; i <= 50; i++) {
  const stock = Math.floor((i - 1) / 5) + 1;
  const factor = ((i - 1) % 5) + 2;
  const initialVolume = 20;
  const finalVolume = initialVolume * factor;
  const finalConcentration = stock / factor;
  addN(`CHE-DILUTION-${pad(i)}`, "Chemistry", "Solutions", "Dilution", i,
    `What is the final molarity when ${initialVolume} mL of ${stock} M stock solution is diluted to ${finalVolume} mL?`,
    finalConcentration, "Use C₁V₁ = C₂V₂. Therefore C₂ = C₁V₁/V₂.",
    "M", [stock * factor, stock / (factor + 1), stock * initialVolume / (finalVolume - 10)]);
}
const ions = [
  ["hydrogen", "H⁺", 1, 1], ["lithium", "Li⁺", 3, 1], ["beryllium", "Be²⁺", 4, 2],
  ["boron", "B³⁺", 5, 3], ["carbon", "C⁴⁻", 6, -4], ["nitride", "N³⁻", 7, -3],
  ["oxide", "O²⁻", 8, -2], ["fluoride", "F⁻", 9, -1], ["sodium", "Na⁺", 11, 1],
  ["magnesium", "Mg²⁺", 12, 2], ["aluminium", "Al³⁺", 13, 3], ["silicon", "Si⁴⁺", 14, 4],
  ["phosphide", "P³⁻", 15, -3], ["sulfide", "S²⁻", 16, -2], ["chloride", "Cl⁻", 17, -1],
  ["potassium", "K⁺", 19, 1], ["calcium", "Ca²⁺", 20, 2], ["scandium", "Sc³⁺", 21, 3],
  ["titanium", "Ti⁴⁺", 22, 4], ["chromium(III)", "Cr³⁺", 24, 3], ["manganese(II)", "Mn²⁺", 25, 2],
  ["iron(II)", "Fe²⁺", 26, 2], ["iron(III)", "Fe³⁺", 26, 3], ["cobalt(II)", "Co²⁺", 27, 2],
  ["nickel(II)", "Ni²⁺", 28, 2], ["copper(I)", "Cu⁺", 29, 1], ["copper(II)", "Cu²⁺", 29, 2],
  ["zinc", "Zn²⁺", 30, 2], ["gallium", "Ga³⁺", 31, 3], ["silver", "Ag⁺", 47, 1],
  ["cadmium", "Cd²⁺", 48, 2], ["tin(II)", "Sn²⁺", 50, 2], ["tin(IV)", "Sn⁴⁺", 50, 4],
  ["iodide", "I⁻", 53, -1], ["barium", "Ba²⁺", 56, 2], ["platinum(II)", "Pt²⁺", 78, 2],
  ["gold(III)", "Au³⁺", 79, 3], ["mercury(II)", "Hg²⁺", 80, 2], ["lead(II)", "Pb²⁺", 82, 2],
  ["lead(IV)", "Pb⁴⁺", 82, 4], ["bromide", "Br⁻", 35, -1], ["selenide", "Se²⁻", 34, -2],
  ["rubidium", "Rb⁺", 37, 1], ["strontium", "Sr²⁺", 38, 2], ["yttrium", "Y³⁺", 39, 3],
  ["zirconium", "Zr⁴⁺", 40, 4], ["palladium(II)", "Pd²⁺", 46, 2], ["cesium", "Cs⁺", 55, 1],
  ["lanthanum", "La³⁺", 57, 3], ["bismuth(III)", "Bi³⁺", 83, 3],
] as const;
for (let i = 1; i <= 50; i++) {
  const [name, symbol, atomicNumber, charge] = ions[i - 1];
  const electrons = atomicNumber - charge;
  addN(`CHE-ELECTRONS-${pad(i)}`, "Chemistry", "Atomic Structure", "Electrons in ions", i,
    `How many electrons are present in a ${name} ion (${symbol})? Its atomic number is ${atomicNumber}.`,
    electrons, "For a cation, subtract the positive charge from Z; for an anion, add the magnitude of the negative charge.",
    "electrons", [atomicNumber, atomicNumber + charge, electrons + Math.abs(charge)]);
}
for (let i = 1; i <= 50; i++) {
  const moles = i;
  const volume = 22.4 * moles;
  addN(`CHE-STP-${pad(i)}`, "Chemistry", "States of Matter", "Molar volume at STP", i,
    `At STP, use the ideal-gas molar volume 22.4 L/mol. How many moles are present in ${formatNumber(volume)} L of an ideal gas?`,
    moles, "At the stated conditions, n = V/22.4 L mol⁻¹.",
    "mol", [volume, moles * 2, moles / 2]);
}
for (let i = 1; i <= 50; i++) {
  const theory = (Math.floor((i - 1) / 10) + 1) * 10;
  const yieldPercent = 50 + ((i - 1) % 10) * 5;
  const actual = theory * yieldPercent / 100;
  addN(`CHE-YIELD-${pad(i)}`, "Chemistry", "Chemical Reactions", "Percentage yield", i,
    `A reaction has a theoretical yield of ${theory} g and produces ${formatNumber(actual)} g of product. What is the percentage yield?`,
    yieldPercent, "Percentage yield = (actual yield ÷ theoretical yield) × 100%.",
    "%", [100 - yieldPercent, yieldPercent / 2, Math.min(100, yieldPercent + 10)]);
}
for (let i = 1; i <= 50; i++) {
  const pH = Math.round((1 + i * 0.1) * 10) / 10;
  const pOH = 14 - pH;
  addN(`CHE-POH-${pad(i)}`, "Chemistry", "Equilibrium", "pH and pOH", i,
    `At 25°C, a solution has pH ${formatNumber(pH)}. Assuming pH + pOH = 14.00, find its pOH.`,
    pOH, "At 25°C, pH + pOH = 14.00, so pOH = 14.00 − pH.",
    "", [14 + pH, pH, 14 - pH / 2]);
}
const reactions = [
  { equation: "2H₂ + O₂ → 2H₂O", input: "H₂", inCoeff: 2, output: "H₂O", outCoeff: 2 },
  { equation: "N₂ + 3H₂ → 2NH₃", input: "N₂", inCoeff: 1, output: "NH₃", outCoeff: 2 },
  { equation: "2KClO₃ → 2KCl + 3O₂", input: "KClO₃", inCoeff: 2, output: "O₂", outCoeff: 3 },
  { equation: "CaCO₃ → CaO + CO₂", input: "CaCO₃", inCoeff: 1, output: "CO₂", outCoeff: 1 },
  { equation: "CH₄ + 2O₂ → CO₂ + 2H₂O", input: "CH₄", inCoeff: 1, output: "CO₂", outCoeff: 1 },
  { equation: "4Fe + 3O₂ → 2Fe₂O₃", input: "Fe", inCoeff: 4, output: "Fe₂O₃", outCoeff: 2 },
  { equation: "2Na + Cl₂ → 2NaCl", input: "Na", inCoeff: 2, output: "NaCl", outCoeff: 2 },
  { equation: "2Al + 3Cl₂ → 2AlCl₃", input: "Al", inCoeff: 2, output: "AlCl₃", outCoeff: 2 },
  { equation: "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O", input: "C₃H₈", inCoeff: 1, output: "CO₂", outCoeff: 3 },
  { equation: "2H₂O₂ → 2H₂O + O₂", input: "H₂O₂", inCoeff: 2, output: "O₂", outCoeff: 1 },
] as const;
for (let i = 1; i <= 50; i++) {
  const reaction = reactions[Math.floor((i - 1) / 5)];
  const inputMoles = ((i - 1) % 5) + 1;
  const outputMoles = inputMoles * reaction.outCoeff / reaction.inCoeff;
  addN(`CHE-STOICH-${pad(i)}`, "Chemistry", "Chemical Reactions", "Mole ratios in balanced equations", i,
    `For the reaction ${reaction.equation}, how many moles of ${reaction.output} can form stoichiometrically from ${inputMoles} mol of ${reaction.input}, assuming excess of every other reactant?`,
    outputMoles, "Use the coefficients in the balanced equation as mole ratios. Product moles = reactant moles × (product coefficient/reactant coefficient).",
    "mol", [inputMoles, inputMoles * reaction.inCoeff, outputMoles * 2]);
}
for (let i = 1; i <= 50; i++) {
  const moles = i;
  addN(`CHE-AVOGADRO-${pad(i)}`, "Chemistry", "Some Basic Concepts", "Avogadro constant", i,
    `A sample contains ${moles} mol of molecules. Express the number of molecules as a multiple of the Avogadro constant Nₐ.`,
    moles, "The number of entities is N = nNₐ. The requested coefficient is the number of moles.",
    "Nₐ molecules", [moles * 2, moles / 2, moles + 1]);
}
for (let i = 1; i <= 50; i++) {
  const moles = i;
  const volume = 24.6 * moles;
  addN(`CHE-IDEAL-GAS-${pad(i)}`, "Chemistry", "States of Matter", "Ideal gas equation", i,
    `An ideal gas occupies ${formatNumber(volume)} L at 1 atm and 300 K. Use R = 0.082 L·atm·mol⁻¹·K⁻¹. How many moles are present?`,
    moles, "From PV = nRT, n = PV/(RT). Here RT = 0.082 × 300 = 24.6 L·atm/mol.",
    "mol", [volume, moles * 2, moles / 2]);
}

/* ----------------------------- MATHEMATICS ----------------------------- */
for (let i = 1; i <= 50; i++) {
  const slope = Math.floor((i - 1) / 10) + 1;
  const x = ((i - 1) % 10) + 1;
  const intercept = ((i - 1) % 7) + 1;
  const rhs = slope * x + intercept;
  addN(`MAT-LINEAR-${pad(i)}`, "Mathematics", "Algebra", "Linear equations", i,
    `Solve for x: ${slope}x + ${intercept} = ${rhs}.`,
    x, "Subtract the constant from both sides, then divide by the coefficient of x.",
    "", [rhs, rhs - intercept, x + slope]);
}
for (let i = 1; i <= 50; i++) {
  const first = ((i - 1) % 10) + 1;
  const difference = Math.floor((i - 1) / 10) + 1;
  const n = ((i - 1) % 10) + 5;
  addN(`MAT-AP-TERM-${pad(i)}`, "Mathematics", "Sequences & Series", "Arithmetic progression nth term", i,
    `An arithmetic progression has first term ${first} and common difference ${difference}. Find its ${n}th term.`,
    first + (n - 1) * difference, "The nth term is aₙ = a₁ + (n − 1)d.",
    "", [first + n * difference, first * n + difference, n * difference]);
}
for (let i = 1; i <= 50; i++) {
  const first = Math.floor((i - 1) / 10) + 1;
  const difference = ((i - 1) % 5) + 1;
  const n = ((i - 1) % 10) + 5;
  const sum = n * (2 * first + (n - 1) * difference) / 2;
  addN(`MAT-AP-SUM-${pad(i)}`, "Mathematics", "Sequences & Series", "Sum of an arithmetic progression", i,
    `Find the sum of the first ${n} terms of an AP with first term ${first} and common difference ${difference}.`,
    sum, "Use Sₙ = n/2 × [2a + (n − 1)d].",
    "", [sum + difference, sum - first, n * (first + difference)]);
}
for (let i = 1; i <= 50; i++) {
  const first = Math.floor((i - 1) / 10) + 1;
  const ratio = 2 + (Math.floor((i - 1) / 5) % 3);
  const n = ((i - 1) % 5) + 2;
  addN(`MAT-GP-${pad(i)}`, "Mathematics", "Sequences & Series", "Geometric progression", i,
    `A GP has first term ${first} and common ratio ${ratio}. What is its ${n}th term?`,
    first * ratio ** (n - 1), "The nth term of a GP is aₙ = arⁿ⁻¹.",
    "", [first * ratio ** n, first * ratio * (n - 1), first + ratio ** (n - 1)]);
}
for (let i = 1; i <= 50; i++) {
  const root1 = ((i - 1) % 10) + 1;
  const root2 = Math.floor((i - 1) / 10) + 2;
  const sum = root1 + root2;
  const product = root1 * root2;
  const leading = Math.floor((i - 1) / 10) + 1;
  const askLarger = i % 2 === 1;
  addN(`MAT-QUADRATIC-${pad(i)}`, "Mathematics", "Quadratic Equations", "Roots of a quadratic", i,
    `The equation ${leading}x² − ${leading * sum}x + ${leading * product} = 0 has two real roots. What is the ${askLarger ? "larger" : "smaller"} root?`,
    askLarger ? Math.max(root1, root2) : Math.min(root1, root2), "Factor the quadratic using the two numbers whose sum is the x coefficient divided by the leading coefficient and whose product is the constant term divided by the leading coefficient, then choose the requested root.",
    "", [Math.min(root1, root2), Math.max(root1, root2), sum, product]);
}
for (let i = 1; i <= 50; i++) {
  const coefficient = Math.floor((i - 1) / 10) + 1;
  const x = ((i - 1) % 10) + 1;
  const exponent = 2 + (Math.floor((i - 1) / 2) % 4);
  const value = coefficient * exponent * x ** (exponent - 1);
  addN(`MAT-DERIVATIVE-${pad(i)}`, "Mathematics", "Differential Calculus", "Power rule", i,
    `If f(x) = ${coefficient}x^${exponent}, what is f′(${x})?`,
    value, "By the power rule, d(axⁿ)/dx = anxⁿ⁻¹. Substitute the given x value.",
    "", [coefficient * x ** exponent, coefficient * exponent * x, value + coefficient]);
}
const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]] as const;
for (let i = 1; i <= 50; i++) {
  const [a, b, c] = triples[(i - 1) % triples.length];
  const scale = Math.floor((i - 1) / triples.length) + 1;
  addN(`MAT-DISTANCE-${pad(i)}`, "Mathematics", "Coordinate Geometry", "Distance formula", i,
    `Two points differ by ${a * scale} units horizontally and ${b * scale} units vertically. What is the distance between them?`,
    c * scale, "Apply the distance formula: d = √(Δx² + Δy²).",
    "units", [a * scale + b * scale, c * scale / 2, (a + b) * scale]);
}
for (let i = 1; i <= 50; i++) {
  const n = Math.floor((i - 1) / 5) + 6;
  const r = ((i - 1) % 5) + 2;
  let ways = 1;
  for (let k = 1; k <= r; k++) ways = ways * (n - k + 1) / k;
  addN(`MAT-COMBINATION-${pad(i)}`, "Mathematics", "Permutations & Combinations", "Combination formula", i,
    `How many ways can ${r} objects be selected from ${n} distinct objects when order does not matter?`,
    Math.round(ways), "Use the combination formula ⁿCᵣ = n!/[r!(n − r)!].",
    "ways", [n ** r, n * r, Math.round(ways) + n]);
}
for (let i = 1; i <= 50; i++) {
  const red = ((i - 1) % 10) + 1;
  const blue = Math.floor((i - 1) / 10) + 1;
  const p = Math.round((red / (red + blue)) * 10000) / 100;
  addN(`MAT-PROBABILITY-${pad(i)}`, "Mathematics", "Probability", "Simple probability", i,
    `A bag contains ${red} red balls and ${blue} blue balls. One ball is drawn at random. What is the probability of drawing a red ball, expressed as a percentage?`,
    p, "Probability = favourable outcomes ÷ total equally likely outcomes. Multiply the fraction by 100%.",
    "%", [100 - p, p / 2, Math.min(100, p + 15)]);
}
for (let i = 1; i <= 50; i++) {
  const a = ((i - 1) % 10) + 1;
  const b = Math.floor((i - 1) / 10) + 1;
  const angles = [0, 90, 180, 270, 360];
  const angle = angles[b - 1];
  const radians = angle * Math.PI / 180;
  const answer = Math.round((a * Math.sin(radians) + b * Math.cos(radians)) * 1000) / 1000;
  addN(`MAT-TRIG-${pad(i)}`, "Mathematics", "Trigonometry", "Sine and cosine at quadrantal angles", i,
    `Evaluate ${a} sin(${angle}°) + ${b} cos(${angle}°).`,
    answer, "Use sin and cos values at 0°, 90°, 180°, 270°, and 360°; one term is zero and the other is ± its coefficient.",
    "", [a + b, a - b, -answer]);
}

/* -------------------------------- BIOLOGY ------------------------------- */
for (let i = 1; i <= 50; i++) {
  const offspring = i * 4;
  const expected = offspring * 3 / 4;
  addN(`BIO-MONOHYBRID-${pad(i)}`, "Biology", "Genetics & Evolution", "Monohybrid inheritance", i,
    `In a simple Aa × Aa cross with complete dominance, ${offspring} offspring are produced. What is the expected number showing the dominant phenotype?`,
    expected, "The expected dominant phenotype ratio is 3:1, so three quarters of the offspring are expected to show the dominant phenotype.",
    "offspring", [offspring / 4, offspring / 2, offspring]);
}
for (let i = 1; i <= 50; i++) {
  const offspring = i * 16;
  const expected = offspring * 9 / 16;
  addN(`BIO-DIHYBRID-${pad(i)}`, "Biology", "Genetics & Evolution", "Dihybrid inheritance", i,
    `Under independent assortment with complete dominance, an AaBb × AaBb cross produces ${offspring} offspring. How many are expected to show both dominant phenotypes?`,
    expected, "The classic dihybrid phenotypic ratio is 9:3:3:1. The fraction showing both dominant phenotypes is 9/16.",
    "offspring", [offspring * 3 / 16, offspring / 2, offspring * 7 / 16]);
}
for (let i = 1; i <= 50; i++) {
  const q = i / 100;
  const recessive = Math.round(q * q * 10000) / 100;
  addN(`BIO-HW-HOMOZYGOUS-${pad(i)}`, "Biology", "Genetics & Evolution", "Hardy–Weinberg equilibrium", i,
    `In a population at Hardy–Weinberg equilibrium, the recessive allele frequency is q = ${formatNumber(q)}. What percentage of individuals are expected to be homozygous recessive (q²)?`,
    recessive, "Under Hardy–Weinberg equilibrium, the homozygous recessive genotype frequency is q². Convert the proportion to a percentage.",
    "%", [q * 100, Math.round((2 * q * (1 - q)) * 10000) / 100, Math.max(0, 100 - recessive)]);
}
for (let i = 1; i <= 50; i++) {
  const availableEnergy = i * 100;
  const nextEnergy = availableEnergy * 0.1;
  addN(`BIO-ENERGY-${pad(i)}`, "Biology", "Ecology & Environment", "Energy transfer between trophic levels", i,
    `A trophic level contains ${availableEnergy} kJ of energy. Using the 10% transfer rule as an idealised estimate, how much energy reaches the next trophic level?`,
    nextEnergy, "The 10% rule is an approximate ecological model: next-level energy = 0.10 × available energy.",
    "kJ", [availableEnergy * 0.9, availableEnergy / 2, availableEnergy * 0.01]);
}
for (let i = 1; i <= 50; i++) {
  const initial = Math.floor((i - 1) / 10) + 10;
  const generations = ((i - 1) % 10) + 1;
  const population = initial * 2 ** generations;
  addN(`BIO-POPULATION-${pad(i)}`, "Biology", "Ecology & Environment", "Population doubling", i,
    `A laboratory population begins with ${initial} cells and doubles every generation. How many cells are expected after ${generations} complete generations under this idealised model?`,
    population, "For repeated doubling, N = N₀ × 2ᵍ, where g is the number of generations.",
    "cells", [initial * generations * 2, initial * 2 ** (generations - 1), population + initial]);
}
for (let i = 1; i <= 50; i++) {
  const adeninePercent = 10 + (i - 1) * 0.5;
  const gcPercent = 100 - 2 * adeninePercent;
  addN(`BIO-CHARGAFF-${pad(i)}`, "Biology", "Molecular Biology", "Chargaff's rule", i,
    `In double-stranded DNA, adenine accounts for ${formatNumber(adeninePercent)}% of all nucleotides. What percentage of nucleotides are G + C combined?`,
    gcPercent, "Chargaff's rule gives A = T. Therefore A + T = 2A, and G + C = 100% − 2A.",
    "%", [adeninePercent * 2, 100 - adeninePercent, 2 * adeninePercent]);
}
for (let i = 1; i <= 50; i++) {
  const diploid = i + 10;
  addN(`BIO-MITOSIS-${pad(i)}`, "Biology", "Cell Biology", "Chromosome number after mitosis", i,
    `A diploid cell has ${diploid} chromosomes before mitosis. After one normal mitotic division, what is the total number of chromosomes across both daughter cells?`,
    diploid * 2, "Each daughter cell retains the parent's chromosome number. Across two daughter cells, the total is 2 × the original chromosome number.",
    "chromosomes", [diploid, diploid * 4, diploid + 2]);
}
for (let i = 1; i <= 50; i++) {
  addN(`BIO-MEIOSIS-${pad(i)}`, "Biology", "Cell Biology", "Products of spermatogenesis", i,
    `Assuming complete normal spermatogenesis, how many spermatids can be produced from ${i} primary spermatocytes?`,
    i * 4, "One primary spermatocyte undergoes meiosis to produce four haploid spermatids.",
    "spermatids", [i * 2, i, i * 8]);
}
for (let i = 1; i <= 50; i++) {
  const glucose = i;
  const co2 = glucose * 6;
  addN(`BIO-PHOTOSYNTHESIS-${pad(i)}`, "Biology", "Plant Physiology", "Photosynthesis stoichiometry", i,
    `Using the simplified balanced photosynthesis equation, how many moles of CO₂ are required to produce ${glucose} mol of glucose, assuming the reaction proceeds completely?`,
    co2, "The balanced overall equation uses 6 mol CO₂ per 1 mol glucose: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.",
    "mol CO₂", [glucose, glucose * 12, glucose * 3]);
}

const bioFacts = [
  ["Mitochondrion", "ATP production through aerobic respiration", "Mitochondria host key stages of aerobic cellular respiration and ATP synthesis."],
  ["Ribosome", "Protein synthesis (translation)", "Ribosomes translate the mRNA sequence into a polypeptide."],
  ["Rough endoplasmic reticulum", "Synthesis and processing of many secreted and membrane proteins", "Ribosomes attached to rough ER make many proteins entering the secretory pathway."],
  ["Smooth endoplasmic reticulum", "Lipid synthesis and detoxification in many cell types", "Smooth ER contributes to lipid metabolism and detoxification."],
  ["Golgi apparatus", "Modification, sorting, and packaging of many proteins and lipids", "The Golgi modifies and sorts material moving through the endomembrane system."],
  ["Lysosome", "Intracellular digestion using hydrolytic enzymes", "Lysosomes contain enzymes that digest macromolecules and worn cell components."],
  ["Peroxisome", "Breakdown of fatty acids and detoxification of hydrogen peroxide", "Peroxisomes carry out oxidative reactions and contain catalase."],
  ["Chloroplast", "Photosynthesis in plants and many algae", "Chloroplasts contain the photosynthetic machinery."],
  ["Thylakoid membrane", "Light-dependent reactions of photosynthesis", "Photosystems and the electron transport chain are embedded in thylakoid membranes."],
  ["Chloroplast stroma", "Many reactions of the Calvin cycle", "The Calvin cycle takes place in the stroma."],
  ["Nucleolus", "Production of rRNA and assembly of ribosomal subunits", "The nucleolus is a major site of ribosome biogenesis."],
  ["Nuclear pore complex", "Regulated transport between nucleus and cytoplasm", "Nuclear pore complexes regulate macromolecule traffic across the nuclear envelope."],
  ["Central vacuole in a plant cell", "Storage and maintenance of turgor pressure", "The large central vacuole stores materials and helps support plant tissues."],
  ["Plant cell wall", "Structural support and resistance to osmotic swelling", "The cellulose-rich plant cell wall provides shape and mechanical support."],
  ["Plasmodesmata", "Transport and communication between adjacent plant cells", "Plasmodesmata are channels connecting the cytoplasm of neighbouring plant cells."],
  ["Centrosome in many animal cells", "Organisation of microtubules during cell division", "The centrosome helps organise microtubules and the mitotic spindle."],
  ["Microtubules", "Formation of the mitotic spindle and tracks for intracellular transport", "Microtubules support spindle fibres, cilia, flagella, and cargo transport."],
  ["Actin microfilaments", "Cell shape changes, contraction, and many forms of cell movement", "Actin filaments participate in cell movement and the contractile ring."],
  ["Bacterial nucleoid", "Region containing most of the bacterial chromosome", "Prokaryotes lack a membrane-bound nucleus; their chromosome occupies the nucleoid."],
  ["Plasmid", "Small extrachromosomal DNA molecule common in many bacteria", "Plasmids replicate separately from the bacterial chromosome and can carry accessory genes."],
  ["Cell-surface membrane", "Selective barrier regulating movement into and out of a cell", "The plasma membrane selectively controls transport and participates in signalling."],
  ["Aquaporin", "Facilitated transport of water across a membrane", "Aquaporins are membrane channels that increase water permeability."],
  ["Sodium–potassium pump", "ATP-powered movement of Na⁺ out and K⁺ into many animal cells", "The Na⁺/K⁺ ATPase uses ATP to maintain important ion gradients."],
  ["DNA polymerase", "Synthesis of a new DNA strand using a template", "DNA polymerases add nucleotides during DNA replication and repair."],
  ["RNA polymerase", "Synthesis of RNA from a DNA template during transcription", "RNA polymerase catalyses RNA-chain formation from a DNA template."],
  ["Messenger RNA (mRNA)", "Carries coding information used during translation", "mRNA codons specify amino acids or translation stop signals."],
  ["Transfer RNA (tRNA)", "Delivery of amino acids to the ribosome during translation", "Each tRNA carries an amino acid and has an anticodon that pairs with an mRNA codon."],
  ["Ribosomal RNA (rRNA)", "Structural and catalytic component of ribosomes", "rRNA helps form ribosomes and catalyses peptide-bond formation."],
  ["DNA helicase", "Unwinding of the DNA double helix during replication", "Helicase separates the strands by disrupting base-pair interactions."],
  ["DNA ligase", "Joining DNA fragments by sealing breaks in the sugar-phosphate backbone", "DNA ligase seals nicks, including joins between Okazaki fragments."],
  ["Telomerase", "Extension of telomeric DNA in cells where it is active", "Telomerase uses an RNA template to extend chromosome ends."],
  ["Pancreatic beta cells", "Secretion of insulin", "Insulin-producing beta cells are located in the pancreatic islets."],
  ["Pancreatic alpha cells", "Secretion of glucagon", "Glucagon-producing alpha cells help raise blood glucose during fasting."],
  ["Thyroid gland", "Secretion of thyroxine (T₄) and other thyroid hormones", "Thyroid hormones influence metabolism, growth, and development."],
  ["Antidiuretic hormone (ADH)", "Increasing water reabsorption in the kidney collecting ducts", "ADH helps conserve body water by increasing collecting-duct water permeability."],
  ["Oxytocin", "Uterine contractions and milk ejection", "Oxytocin contributes to labour contractions and milk let-down."],
  ["Auxin", "Promotion of cell elongation in many plant shoots", "Auxin participates in differential growth responses such as phototropism."],
  ["Gibberellins", "Promotion of stem elongation and roles in seed germination", "Gibberellins influence growth and can promote germination in suitable conditions."],
  ["Abscisic acid (ABA)", "Promotion of seed dormancy and stomatal closure during water stress", "ABA participates in plant stress responses and dormancy."],
  ["Ethylene", "Promotion of fruit ripening in many plant species", "Ethylene is a gaseous plant hormone with important roles in fruit ripening."],
  ["Xylem", "Transport of water and mineral ions from roots toward aerial parts", "Xylem conducts water and minerals and contributes to mechanical support."],
  ["Phloem", "Translocation of sugars and other organic solutes", "Phloem distributes assimilates from sources to sinks."],
  ["Root hairs", "Increase in surface area for water and mineral absorption", "Root hairs are extensions of root epidermal cells that increase absorptive surface area."],
  ["Stomata", "Gas exchange between plant tissues and the atmosphere", "Stomatal pores permit CO₂ entry and water-vapour and oxygen exchange."],
  ["Guard cells", "Regulation of stomatal aperture", "Changes in guard-cell turgor open or close stomatal pores."],
  ["Mycorrhizae", "Mutualistic association that often improves plant mineral uptake", "Many mycorrhizal fungi increase plant access to soil nutrients, especially phosphorus."],
  ["Rhizobium in legume root nodules", "Symbiotic nitrogen fixation", "Rhizobium bacteria in suitable legume nodules fix atmospheric nitrogen into biologically usable forms."],
  ["ATP", "A widely used immediate energy-transfer molecule in cells", "ATP hydrolysis can be coupled to cellular processes that require energy."],
  ["Meiosis", "Reduction of chromosome number and generation of haploid cells", "Meiosis includes two divisions after one round of DNA replication."],
  ["Crossing over", "Exchange between non-sister chromatids of homologous chromosomes in prophase I", "Crossing over contributes to genetic recombination during meiosis."],
];
const factAnswers = bioFacts.map((fact) => fact[1]);
for (let i = 1; i <= bioFacts.length; i++) {
  const [term, answer, explanation] = bioFacts[i - 1];
  const distractors = seededShuffle(
    factAnswers.filter((a) => a !== answer),
    `BIO-CONCEPT-${i}`,
  ).slice(0, 3);
  const q = makeChoice(
    meta(`BIO-CONCEPT-${pad(i)}`, "Biology", "Cell Biology & Plant Physiology", "Core biology concepts", i,
      `Which statement best describes the primary role or function of ${term}?`),
    answer,
    distractors,
    explanation,
  );
  bank.push(q);
}

/** Generated once for consistent IDs and answer positions across client/server renders. */
export const prepQuestionBank: PrepQuestion[] = bank;
export const PREP_QUESTION_COUNT = prepQuestionBank.length;

export const PREP_SUBJECTS: PrepSubject[] = ["Physics", "Chemistry", "Mathematics", "Biology"];
export const PREP_EXAMS: ExamTrack[] = ["JEE Main", "JEE Advanced", "NEET UG"];
export const PREP_DIFFICULTIES: Difficulty[] = ["Foundation", "Standard", "Advanced"];

export const PREP_CHAPTERS: Record<PrepSubject, string[]> = {
  Physics: ["Mechanics", "Kinematics", "Work, Energy & Power", "Waves & Oscillations", "Properties of Matter", "Electricity"],
  Chemistry: ["Some Basic Concepts", "Solutions", "Atomic Structure", "States of Matter", "Chemical Reactions", "Equilibrium"],
  Mathematics: ["Algebra", "Sequences & Series", "Quadratic Equations", "Differential Calculus", "Coordinate Geometry", "Permutations & Combinations", "Probability", "Trigonometry"],
  Biology: ["Genetics & Evolution", "Ecology & Environment", "Molecular Biology", "Cell Biology", "Plant Physiology"],
};

export function validateImportedQuestion(value: unknown, index: number): PrepQuestion | null {
  if (!value || typeof value !== "object") return null;
  const q = value as Record<string, unknown>;
  const subjects: string[] = PREP_SUBJECTS;
  const exams: string[] = PREP_EXAMS;
  const difficulties: string[] = PREP_DIFFICULTIES;
  if (typeof q.question !== "string" || q.question.trim().length < 8 || q.question.length > 3000) return null;
  if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => typeof o !== "string" || o.length > 500) || new Set(q.options).size !== 4) return null;
  if (typeof q.answerIndex !== "number" || !Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) return null;
  if (typeof q.subject !== "string" || !subjects.includes(q.subject)) return null;
  if (!Array.isArray(q.exams) || q.exams.length === 0 || q.exams.some((e) => typeof e !== "string" || !exams.includes(e))) return null;
  if (typeof q.chapter !== "string" || typeof q.topic !== "string") return null;
  if (typeof q.explanation !== "string" || q.explanation.length > 4000) return null;
  const difficulty = typeof q.difficulty === "string" && difficulties.includes(q.difficulty) ? q.difficulty : "Standard";
  return {
    id: `CUSTOM-${Date.now()}-${index}`,
    subject: q.subject as PrepSubject,
    chapter: q.chapter.slice(0, 120),
    topic: q.topic.slice(0, 120),
    difficulty: difficulty as Difficulty,
    exams: (q.exams as ExamTrack[]).filter((e) => exams.includes(e)),
    question: q.question,
    options: (q.options as string[]).map((o) => o.trim()),
    answerIndex: q.answerIndex,
    explanation: q.explanation,
    source: "User imported",
  };
}
