import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMaintenanceMode() {
  return useQuery({
    queryKey: ["maintenance-mode"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consent_settings")
        .select(`
          maintenance_mode,
          maintenance_title,
          maintenance_subtitle,
          maintenance_message,
          maintenance_button_enabled,
          maintenance_button_text,
          maintenance_button_url
        `)
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        console.error("Failed to load maintenance settings:", error);
        return {
          maintenance_mode: false,
          maintenance_title: "",
          maintenance_subtitle: "",
          maintenance_message: "",
          maintenance_button_enabled: false,
          maintenance_button_text: "",
          maintenance_button_url: "",
        };
      }

      return data;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}