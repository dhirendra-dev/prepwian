import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  GripVertical,
  Trash2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/shortlist",
)({
  component: CollegeShortlist,
});

type ShortlistItem = {
  id: string;
  cutoff_id: string | null;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  program_name: string;
  program_code: string | null;
  year: number;
  counselling: string;
  category: string | null;
  quota: string | null;
  round: number | null;
  opening_rank: number | null;
  closing_rank: number | null;
  notes: string | null;
  priority: number | null;
  created_at: string;
};

function CollegeShortlist() {
  const queryClient = useQueryClient();

  const shortlist = useQuery({
    queryKey: ["jee-college-shortlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jee_college_shortlists")
        .select("*")
        .order("priority", {
          ascending: true,
          nullsFirst: false,
        })
        .order("created_at", {
          ascending: true,
        });

      if (error) throw error;

      return (data ?? []) as ShortlistItem[];
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("jee_college_shortlists")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["jee-college-shortlist"],
      });
    },
  });

  const updateNotes = useMutation({
    mutationFn: async ({
      id,
      notes,
    }: {
      id: string;
      notes: string;
    }) => {
      const { error } = await supabase
        .from("jee_college_shortlists")
        .update({
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["jee-college-shortlist"],
      });
    },
  });

  const items = shortlist.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 md:py-10">
        <Button asChild variant="ghost" size="sm">
          <Link to="/jee-predictor">
            <ArrowLeft className="mr-2 h-4 w-4" />
            JEE Predictor
          </Link>
        </Button>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <Bookmark className="h-4 w-4" />
            Personal workspace
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            My College Shortlist
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Save institutes and branches you want to compare while
            planning your JEE counselling choices.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Shortlisted"
            value={items.length}
          />

          <StatCard
            label="With rank data"
            value={
              items.filter(
                (item) =>
                  item.opening_rank !== null &&
                  item.closing_rank !== null,
              ).length
            }
          />

          <StatCard
            label="Institutes"
            value={
              new Set(
                items.map((item) => item.institute_name),
              ).size
            }
          />
        </div>

        {shortlist.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading your shortlist...
            </CardContent>
          </Card>
        )}

        {shortlist.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load your shortlist.
            </CardContent>
          </Card>
        )}

        {!shortlist.isLoading &&
          !shortlist.isError &&
          items.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <Bookmark className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  Your shortlist is empty
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Save colleges from the JEE prediction tools and
                  they will appear here.
                </p>

                <Button asChild className="mt-5">
                  <Link to="/jee-predictor/college">
                    Open College Predictor
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

        {items.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Your choices
                </h2>

                <p className="text-sm text-muted-foreground">
                  Drag-and-drop ordering can be added later.
                </p>
              </div>
            </div>

            {items.map((item, index) => (
              <ShortlistCard
                key={item.id}
                item={item}
                position={index + 1}
                onDelete={() =>
                  deleteItem.mutate(item.id)
                }
                onSaveNotes={(notes) =>
                  updateNotes.mutate({
                    id: item.id,
                    notes,
                  })
                }
                deleting={
                  deleteItem.isPending &&
                  deleteItem.variables === item.id
                }
              />
            ))}
          </div>
        )}

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Your shortlist is personal to your account. Historical
              cutoff information shown here does not guarantee future
              seat allocation or admission.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShortlistCard({
  item,
  position,
  onDelete,
  onSaveNotes,
  deleting,
}: {
  item: ShortlistItem;
  position: number;
  onDelete: () => void;
  onSaveNotes: (notes: string) => void;
  deleting: boolean;
}) {
  const [notes, setNotes] = React.useState(
    item.notes ?? "",
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold">
            {position}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              {item.institute_type && (
                <Badge variant="outline">
                  {item.institute_type}
                </Badge>
              )}

              {item.category && (
                <Badge variant="secondary">
                  {item.category}
                </Badge>
              )}

              {item.round && (
                <Badge variant="outline">
                  Round {item.round}
                </Badge>
              )}
            </div>

            <CardTitle className="mt-3">
              {item.institute_name}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {item.program_name}
            </p>
          </div>

          <GripVertical className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RankBox
            label="Opening rank"
            value={item.opening_rank}
          />

          <RankBox
            label="Closing rank"
            value={item.closing_rank}
          />

          <InfoBox
            label="Year"
            value={String(item.year)}
          />

          <InfoBox
            label="Counselling"
            value={item.counselling}
          />
        </div>

        {(item.city || item.state) && (
          <p className="text-sm text-muted-foreground">
            {[item.city, item.state]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">
            My notes
          </p>

          <Textarea
            placeholder="Add your own notes..."
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
          />

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onSaveNotes(notes)
            }
          >
            Save notes
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {item.cutoff_id && (
            <Badge variant="outline">
              Linked to cutoff record
            </Badge>
          )}

          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Removing..." : "Remove"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RankBox({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-bold">
        {value !== null
          ? `#${value.toLocaleString()}`
          : "—"}
      </p>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-bold">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 text-2xl font-bold">
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}