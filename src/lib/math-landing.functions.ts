import { createServerFn } from "@tanstack/react-start";
import { isMaterialsUnlocked } from "@/lib/materials-gate.server";

export type MathLandingMaterial = {
  id: string;
  title: string;
  topic: string | null;
  resource_type: string;
  drive_url: string;
  class_level: string | null;
  description: string | null;
};

export type MathLandingData = {
  locked: boolean;
  advanced: MathLandingMaterial[];
  calculus: MathLandingMaterial[];
  coordinateGeometry: MathLandingMaterial[];
  functions: MathLandingMaterial[];
  pyqs: MathLandingMaterial[];
  foundation: MathLandingMaterial[];
  all: MathLandingMaterial[];
};

function classify(materials: MathLandingMaterial[]): MathLandingData {
  const advanced: MathLandingMaterial[] = [];
  const calculus: MathLandingMaterial[] = [];
  const coordinateGeometry: MathLandingMaterial[] = [];
  const functions: MathLandingMaterial[] = [];
  const pyqs: MathLandingMaterial[] = [];
  const foundation: MathLandingMaterial[] = [];

  for (const m of materials) {
    const topic = (m.topic ?? "").toLowerCase();
    const type = (m.resource_type ?? "").toLowerCase();
    const title = (m.title ?? "").toLowerCase();

    if (type === "pyq" || topic === "pyq" || title.includes("pyq") || title.includes("previous year")) {
      pyqs.push(m);
    } else if (topic === "advanced" || title.includes("advanced") || title.includes("rank booster")) {
      advanced.push(m);
    } else if (topic === "calculus" || title.includes("calculus") || title.includes("sameer bansal")) {
      calculus.push(m);
    } else if (topic === "coordinate geometry" || title.includes("coordinate geometry")) {
      coordinateGeometry.push(m);
    } else if (topic === "functions" || title.includes("graphs") || title.includes("functions")) {
      functions.push(m);
    } else if (m.class_level === "class_11" || m.class_level === "class_12" || title.includes("class 11") || title.includes("class 12") || title.includes("rd sharma")) {
      foundation.push(m);
    } else {
      // If topic is broad or unknown, keep in foundation or all; default to foundation if it looks like a book/notes
      foundation.push(m);
    }
  }

  return {
    locked: false,
    advanced,
    calculus,
    coordinateGeometry,
    functions,
    pyqs,
    foundation,
    all: materials,
  };
}

export const getMathLandingData = createServerFn({ method: "GET" }).handler(async (): Promise<MathLandingData> => {
  const unlocked = await isMaterialsUnlocked();
  if (!unlocked) return { ...classify([]), locked: true };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("materials")
    .select("id, title, topic, resource_type, drive_url, class_level, description")
    .eq("subject", "mathematics")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return classify(data ?? []);
});
