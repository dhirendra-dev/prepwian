import * as React from "react";
import { Bookmark, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

type ShortlistData = {
  cutoff_id?: string | null;
  institute_name: string;
  institute_type?: string | null;
  state?: string | null;
  city?: string | null;
  program_name: string;
  program_code?: string | null;
  year?: number;
  counselling?: string;
  category?: string | null;
  quota?: string | null;
  round?: number | null;
  opening_rank?: number | null;
  closing_rank?: number | null;
};

export function SaveToShortlistButton({
  item,
}: {
  item: ShortlistData;
}) {
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const { user } = useAuth();

  const save = async () => {
    if (!user || saving || saved) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("jee_college_shortlists")
        .insert({
          user_id: user.id,
          cutoff_id: item.cutoff_id ?? null,
          institute_name: item.institute_name,
          institute_type: item.institute_type ?? null,
          state: item.state ?? null,
          city: item.city ?? null,
          program_name: item.program_name,
          program_code: item.program_code ?? null,
          year: item.year ?? 2026,
          counselling: item.counselling ?? "JOSAA",
          category: item.category ?? null,
          quota: item.quota ?? null,
          round: item.round ?? null,
          opening_rank: item.opening_rank ?? null,
          closing_rank: item.closing_rank ?? null,
          priority: 9999,
        });

      if (error) {
        if (error.code === "23505") {
          setSaved(true);
          toast.info("Already in your shortlist");
          return;
        }

        throw error;
      }

      setSaved(true);
      toast.success("Added to your shortlist");
    } catch (error) {
      console.error(error);
      toast.error("Unable to save this college");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      variant={saved ? "secondary" : "outline"}
      size="sm"
      onClick={save}
      disabled={saving || saved}
    >
      {saving ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : saved ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Bookmark className="mr-2 h-4 w-4" />
      )}

      {saved ? "Shortlisted" : "Save to Shortlist"}
    </Button>
  );
}