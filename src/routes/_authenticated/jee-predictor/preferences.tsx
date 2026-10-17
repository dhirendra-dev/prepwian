import * as React from "react";
import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  GripVertical,
  ListOrdered,
  Save,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/preferences",
)({
  component: PreferenceBuilder,
});

type ShortlistItem = {
  id: string;
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
};

type PreferenceItem = {
  id: string;
  preference_list_id: string;
  shortlist_id: string | null;
  preference_order: number;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  program_name: string;
  program_code: string | null;
  category: string | null;
  quota: string | null;
  round: number | null;
  opening_rank: number | null;
  closing_rank: number | null;
  notes: string | null;
};

function PreferenceBuilder() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const [name, setName] = React.useState(
    "My JEE Preference List",
  );

  const [listId, setListId] = React.useState<
    string | null
  >(null);

  const shortlist = useQuery({
    queryKey: ["jee-shortlist-for-preferences"],
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

  const lists = useQuery({
    queryKey: ["jee-preference-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jee_preference_lists")
        .select("*")
        .order("updated_at", {
          ascending: false,
        });

      if (error) throw error;

      return data ?? [];
    },
  });

  const createList = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("jee_preference_lists")
        .insert({
          user_id: user.id,
          name,
          exam: "JEE_MAIN",
          year: 2026,
          counselling: "JOSAA",
          status: "DRAFT",
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      setListId(data.id);

      queryClient.invalidateQueries({
        queryKey: ["jee-preference-lists"],
      });
    },
  });

  const selectedListId =
    listId ?? lists.data?.[0]?.id ?? null;

  const items = useQuery({
    queryKey: [
      "jee-preference-items",
      selectedListId,
    ],
    enabled: !!selectedListId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jee_preference_list_items")
        .select("*")
        .eq(
          "preference_list_id",
          selectedListId!,
        )
        .order("preference_order", {
          ascending: true,
        });

      if (error) throw error;

      return (data ?? []) as PreferenceItem[];
    },
  });

  const addItem = useMutation({
    mutationFn: async (item: ShortlistItem) => {
      if (!selectedListId) {
        throw new Error(
          "Create a preference list first.",
        );
      }

      const current = items.data ?? [];

      const { error } = await supabase
        .from("jee_preference_list_items")
        .insert({
          preference_list_id: selectedListId,
          shortlist_id: item.id,
          preference_order: current.length + 1,
          institute_name: item.institute_name,
          institute_type: item.institute_type,
          state: item.state,
          city: item.city,
          program_name: item.program_name,
          program_code: item.program_code,
          category: item.category,
          quota: item.quota,
          round: item.round,
          opening_rank: item.opening_rank,
          closing_rank: item.closing_rank,
          notes: item.notes,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "jee-preference-items",
          selectedListId,
        ],
      });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("jee_preference_list_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "jee-preference-items",
          selectedListId,
        ],
      });
    },
  });

  const moveItem = useMutation({
    mutationFn: async ({
      index,
      direction,
    }: {
      index: number;
      direction: "up" | "down";
    }) => {
      const current = [...(items.data ?? [])];

      const targetIndex =
        direction === "up"
          ? index - 1
          : index + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= current.length
      ) {
        return;
      }

      const first = current[index];
      const second = current[targetIndex];

      await supabase
        .from("jee_preference_list_items")
        .update({
          preference_order: second.preference_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", first.id);

      await supabase
        .from("jee_preference_list_items")
        .update({
          preference_order: first.preference_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", second.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "jee-preference-items",
          selectedListId,
        ],
      });
    },
  });

  const selectedIds = new Set(
    (items.data ?? [])
      .map((item) => item.shortlist_id)
      .filter(Boolean),
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6 md:py-10">
        <Button asChild variant="ghost" size="sm">
          <Link to="/jee-predictor">
            <ArrowLeft className="mr-2 h-4 w-4" />
            JEE Predictor
          </Link>
        </Button>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <ListOrdered className="h-4 w-4" />
            Counselling planner
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            JEE Preference List Builder
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Turn your shortlisted colleges and branches into an
            ordered counselling preference list.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Preference list</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="max-w-xl space-y-2">
              <Label htmlFor="list-name">
                List name
              </Label>

              <Input
                id="list-name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                disabled={!!selectedListId}
              />
            </div>

            {!selectedListId ? (
              <Button
                onClick={() =>
                  createList.mutate()
                }
                disabled={createList.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {createList.isPending
                  ? "Creating..."
                  : "Create preference list"}
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  JEE Main 2026
                </Badge>

                <Badge variant="outline">
                  JoSAA
                </Badge>

                <Badge variant="outline">
                  Draft
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedListId && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
            <Card>
              <CardHeader>
                <CardTitle>
                  Your shortlist
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {(shortlist.data ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Your shortlist is empty. Save colleges from
                    the predictor first.
                  </p>
                )}

                {(shortlist.data ?? []).map(
                  (item) => {
                    const alreadyAdded =
                      selectedIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border p-4"
                      >
                        <p className="font-medium">
                          {item.institute_name}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.program_name}
                        </p>

                        <Button
                          size="sm"
                          variant={
                            alreadyAdded
                              ? "secondary"
                              : "outline"
                          }
                          className="mt-3"
                          disabled={
                            alreadyAdded ||
                            addItem.isPending
                          }
                          onClick={() =>
                            addItem.mutate(item)
                          }
                        >
                          {alreadyAdded
                            ? "Added"
                            : "Add to preferences"}
                        </Button>
                      </div>
                    );
                  },
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Preference order
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {(items.data ?? []).length === 0 && (
                  <div className="rounded-xl border border-dashed p-10 text-center">
                    <ListOrdered className="mx-auto h-8 w-8 text-muted-foreground" />

                    <p className="mt-3 font-medium">
                      No preferences yet
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Add colleges from your shortlist.
                    </p>
                  </div>
                )}

                {(items.data ?? []).map(
                  (item, index) => (
                    <PreferenceCard
                      key={item.id}
                      item={item}
                      index={index}
                      total={
                        items.data?.length ?? 0
                      }
                      onMove={(direction) =>
                        moveItem.mutate({
                          index,
                          direction,
                        })
                      }
                      onRemove={() =>
                        removeItem.mutate(item.id)
                      }
                    />
                  ),
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              This builder only organizes your personal choices.
              It does not predict or guarantee which preference
              will receive a seat.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PreferenceCard({
  item,
  index,
  total,
  onMove,
  onRemove,
}: {
  item: PreferenceItem;
  index: number;
  total: number;
  onMove: (direction: "up" | "down") => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-bold">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {item.institute_name}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {item.program_name}
              </p>
            </div>

            <GripVertical className="hidden h-5 w-5 text-muted-foreground sm:block" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
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

            {item.closing_rank && (
              <Badge variant="outline">
                Closing #{item.closing_rank.toLocaleString()}
              </Badge>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={index === 0}
              onClick={() => onMove("up")}
            >
              <ArrowUp className="mr-1 h-4 w-4" />
              Move up
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={index === total - 1}
              onClick={() => onMove("down")}
            >
              <ArrowDown className="mr-1 h-4 w-4" />
              Move down
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={onRemove}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}