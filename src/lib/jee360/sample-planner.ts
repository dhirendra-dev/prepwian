import { addDays, format, getDay, startOfDay } from "date-fns";
import type { PlannerFile } from "@/lib/jee360/schema";

const PHYSICS: [string, string][] = [
  ["Rotational Motion", "Moment of Inertia of Rigid Bodies"],
  ["Rotational Motion", "Torque and Angular Momentum"],
  ["Gravitation", "Universal Law and Field"],
  ["Gravitation", "Satellites and Escape Velocity"],
  ["SHM", "Equation of Simple Harmonic Motion"],
  ["SHM", "Energy in SHM"],
];

const CHEMISTRY: [string, string][] = [
  ["Chemical Bonding", "VSEPR and Hybridisation"],
  ["Chemical Bonding", "MOT of Diatomic Molecules"],
  ["Thermodynamics", "First Law and Enthalpy"],
  ["Thermodynamics", "Second Law and Entropy"],
  ["Equilibrium", "Chemical Equilibrium and Kc / Kp"],
  ["Equilibrium", "Buffer Solutions and Solubility"],
];

const MATHS: [string, string][] = [
  ["Sequences and Series", "AP / GP and Sigma Notation"],
  ["Sequences and Series", "Special Series and Inequalities"],
  ["Straight Lines", "Slope Forms and Family of Lines"],
  ["Circles", "Standard Equation and Tangent"],
  ["Conic Sections", "Parabola — Standard Forms"],
  ["Conic Sections", "Ellipse — Auxiliary Circle"],
];

function isoFrom(origin: Date, offset: number): string {
  return format(addDays(startOfDay(origin), offset), "yyyy-MM-dd");
}

export function buildSamplePlanner(now = new Date()): PlannerFile {
  const lectures: PlannerFile["lectures"] = [];
  const tests: NonNullable<PlannerFile["tests"]> = [];
  let p = 0;
  let c = 0;
  let m = 0;

  for (let d = -5; d <= 10; d++) {
    const date = isoFrom(now, d);
    const dow = getDay(addDays(startOfDay(now), d));

    if (dow === 0) {
      const week = Math.floor((d + 5) / 7) + 18;
      tests.push({
        title: d > 6 ? "Fortnightly Mock" : `Weekly Test ${week}`,
        subject: "full",
        date,
        startTime: "09:00",
        durationMinutes: 180,
        syllabus: [
          PHYSICS[Math.min(p, PHYSICS.length - 1)][0],
          CHEMISTRY[Math.min(c, CHEMISTRY.length - 1)][0],
          MATHS[Math.min(m, MATHS.length - 1)][0],
        ],
        type: d > 6 ? "mock" : "part",
        maxScore: 300,
      });
      lectures.push({
        title: "Test analysis and error log",
        subject: "maths",
        chapter: "Test analysis",
        date,
        startTime: "16:00",
        endTime: "17:30",
        faculty: "Qureshi",
        type: "revision",
      });
      continue;
    }

    const phy = PHYSICS[p % PHYSICS.length];
    const chem = CHEMISTRY[c % CHEMISTRY.length];
    const maths = MATHS[m % MATHS.length];

    lectures.push({
      title: `${phy[0]} — ${phy[1]}`,
      subject: "physics",
      chapter: phy[0],
      date,
      startTime: "08:00",
      endTime: "09:30",
      faculty: "Mehta",
      type: d % 6 === 0 ? "doubt" : "lecture",
    });
    lectures.push({
      title: `${chem[0]} — ${chem[1]}`,
      subject: "chemistry",
      chapter: chem[0],
      date,
      startTime: "10:00",
      endTime: "11:30",
      faculty: "Banerjee",
      type: "lecture",
    });
    lectures.push({
      title: `${maths[0]} — ${maths[1]}`,
      subject: "maths",
      chapter: maths[0],
      date,
      startTime: "16:00",
      endTime: "17:30",
      faculty: "Qureshi",
      type: d % 5 === 0 ? "dpp" : "lecture",
    });
    p += 1;
    c += 1;
    m += 1;
  }

  return {
    name: "Orbit 2.0 — JEE 2027",
    source: "Demo planner",
    batch: "Morning batch",
    timezone: "Asia/Kolkata",
    lectures,
    tests,
  };
}

export const MINI_EXAMPLE: PlannerFile = {
  name: "Example week",
  source: "Any institute",
  batch: "JEE 2027",
  timezone: "Asia/Kolkata",
  lectures: [
    {
      title: "Rotational Motion — Moment of Inertia",
      subject: "physics",
      chapter: "Rotational Motion",
      date: "2026-09-08",
      startTime: "08:00",
      endTime: "09:30",
      faculty: "Mehta",
      type: "lecture",
    },
    {
      title: "Chemical Bonding — MOT",
      subject: "chemistry",
      chapter: "Chemical Bonding",
      date: "2026-09-08",
      startTime: "10:00",
      endTime: "11:30",
      faculty: "Banerjee",
      type: "lecture",
    },
  ],
  tests: [
    {
      title: "Weekly Test 18",
      subject: "full",
      date: "2026-09-13",
      startTime: "09:00",
      durationMinutes: 180,
      syllabus: ["Rotational Motion", "Chemical Bonding", "Sequences"],
      type: "part",
      maxScore: 300,
    },
  ],
};
