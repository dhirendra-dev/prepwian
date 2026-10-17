import { createServerFn } from "@tanstack/react-start";
import { isMaterialsUnlocked } from "@/lib/materials-gate.server";

export type ChemistryLandingMaterial = {
  id: string;
  title: string;
  topic: string | null;
  resource_type: string;
  drive_url: string;
  class_level: string | null;
  description: string | null;
};

export type ChemistryLandingData = {
  locked: boolean;
  physical: ChemistryLandingMaterial[];
  organic: ChemistryLandingMaterial[];
  inorganic: ChemistryLandingMaterial[];
  advanced: ChemistryLandingMaterial[];
  pyqs: ChemistryLandingMaterial[];
  foundation: ChemistryLandingMaterial[];
  all: ChemistryLandingMaterial[];
};

function classify(materials: ChemistryLandingMaterial[]): ChemistryLandingData {
  const physical: ChemistryLandingMaterial[] = [];
  const organic: ChemistryLandingMaterial[] = [];
  const inorganic: ChemistryLandingMaterial[] = [];
  const advanced: ChemistryLandingMaterial[] = [];
  const pyqs: ChemistryLandingMaterial[] = [];
  const foundation: ChemistryLandingMaterial[] = [];

  for (const m of materials) {
    const topic = (m.topic ?? "").toLowerCase();
    const type = (m.resource_type ?? "").toLowerCase();
    const title = (m.title ?? "").toLowerCase();

    if (type === "pyq" || topic === "pyq" || title.includes("pyq") || title.includes("previous year")) {
      pyqs.push(m);
    } else if (topic === "advanced" || title.includes("advanced") || title.includes("rank booster")) {
      advanced.push(m);
    } else if (
      topic === "physical" ||
      topic === "physical chemistry" ||
      title.includes("physical chemistry") ||
      title.includes("thermodynamic") ||
      title.includes("equilibrium") ||
      title.includes("electrochem") ||
      title.includes("mole concept") ||
      title.includes("kinetics") ||
      title.includes("solution") ||
      title.includes("atomic structure")
    ) {
      physical.push(m);
    } else if (
      topic === "organic" ||
      topic === "organic chemistry" ||
      title.includes("organic") ||
      title.includes("hydrocarbon") ||
      title.includes("aldehyde") ||
      title.includes("alcohol") ||
      title.includes("amine") ||
      title.includes("biomolecule") ||
      title.includes("goc") ||
      title.includes("isomer") ||
      title.includes("reaction mechanism")
    ) {
      organic.push(m);
    } else if (
      topic === "inorganic" ||
      topic === "inorganic chemistry" ||
      title.includes("inorganic") ||
      title.includes("periodic") ||
      title.includes("coordination") ||
      title.includes("p-block") ||
      title.includes("d-block") ||
      title.includes("f-block") ||
      title.includes("s-block") ||
      title.includes("metallurgy") ||
      title.includes("qualitative analysis")
    ) {
      inorganic.push(m);
    } else {
      // Class-level, NCERT, broad or unknown topic — foundation shelf.
      foundation.push(m);
    }
  }

  return { locked: false, physical, organic, inorganic, advanced, pyqs, foundation, all: materials };
}

export const getChemistryLandingData = createServerFn({ method: "GET" }).handler(
  async (): Promise<ChemistryLandingData> => {
    const unlocked = await isMaterialsUnlocked();
    if (!unlocked) return { ...classify([]), locked: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("materials")
      .select("id, title, topic, resource_type, drive_url, class_level, description")
      .eq("subject", "chemistry")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return classify(data ?? []);
  },
);
