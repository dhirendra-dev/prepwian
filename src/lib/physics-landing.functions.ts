import { createServerFn } from "@tanstack/react-start";
import { isMaterialsUnlocked } from "@/lib/materials-gate.server";

export type PhysicsLandingMaterial = {
  id: string;
  title: string;
  topic: string | null;
  resource_type: string;
  drive_url: string;
  class_level: string | null;
  description: string | null;
};

export type PhysicsLandingData = {
  locked: boolean;
  advanced: PhysicsLandingMaterial[];
  mechanics: PhysicsLandingMaterial[];
  electromagnetism: PhysicsLandingMaterial[];
  modernPhysics: PhysicsLandingMaterial[];
  thermodynamics: PhysicsLandingMaterial[];
  pyqs: PhysicsLandingMaterial[];
  foundation: PhysicsLandingMaterial[];
  all: PhysicsLandingMaterial[];
};

function classify(materials: PhysicsLandingMaterial[]): PhysicsLandingData {
  const advanced: PhysicsLandingMaterial[] = [];
  const mechanics: PhysicsLandingMaterial[] = [];
  const electromagnetism: PhysicsLandingMaterial[] = [];
  const modernPhysics: PhysicsLandingMaterial[] = [];
  const thermodynamics: PhysicsLandingMaterial[] = [];
  const pyqs: PhysicsLandingMaterial[] = [];
  const foundation: PhysicsLandingMaterial[] = [];

  for (const m of materials) {
    const topic = (m.topic ?? "").toLowerCase();
    const type = (m.resource_type ?? "").toLowerCase();
    const title = (m.title ?? "").toLowerCase();

    if (type === "pyq" || topic === "pyq" || title.includes("pyq") || title.includes("previous year")) {
      pyqs.push(m);
    } else if (topic === "advanced" || title.includes("advanced") || title.includes("rank booster")) {
      advanced.push(m);
    } else if (
      topic === "mechanics" ||
      title.includes("mechanics") ||
      title.includes("kinematics") ||
      title.includes("rotation") ||
      title.includes("rotational") ||
      title.includes("laws of motion") ||
      title.includes("work energy") ||
      title.includes("hc verma")
    ) {
      mechanics.push(m);
    } else if (
      topic === "electromagnetism" ||
      title.includes("electrostat") ||
      title.includes("magnet") ||
      title.includes("current electricity") ||
      title.includes("electromagnetic") ||
      title.includes("capacitor") ||
      title.includes("dc pandey electricity")
    ) {
      electromagnetism.push(m);
    } else if (
      topic === "modern physics" ||
      title.includes("modern physics") ||
      title.includes("optics") ||
      title.includes("photoelectric") ||
      title.includes("atomic") ||
      title.includes("nuclear") ||
      title.includes("semiconductor")
    ) {
      modernPhysics.push(m);
    } else if (
      topic === "thermodynamics" ||
      topic === "heat" ||
      title.includes("thermodynamic") ||
      title.includes("heat") ||
      title.includes("waves") ||
      title.includes("shm") ||
      title.includes("oscillation") ||
      title.includes("sound")
    ) {
      thermodynamics.push(m);
    } else if (
      m.class_level === "class_11" ||
      m.class_level === "class_12" ||
      title.includes("class 11") ||
      title.includes("class 12") ||
      title.includes("ncert")
    ) {
      foundation.push(m);
    } else {
      // Broad or unknown topic — default to foundation alongside notes/books.
      foundation.push(m);
    }
  }

  return {
    locked: false,
    advanced,
    mechanics,
    electromagnetism,
    modernPhysics,
    thermodynamics,
    pyqs,
    foundation,
    all: materials,
  };
}

export const getPhysicsLandingData = createServerFn({ method: "GET" }).handler(async (): Promise<PhysicsLandingData> => {
  const unlocked = await isMaterialsUnlocked();
  if (!unlocked) return { ...classify([]), locked: true };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("materials")
    .select("id, title, topic, resource_type, drive_url, class_level, description")
    .eq("subject", "physics")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return classify(data ?? []);
});
