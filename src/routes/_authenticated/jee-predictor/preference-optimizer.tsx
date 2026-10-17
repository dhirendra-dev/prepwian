import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  GripVertical,
  Info,
  ListOrdered,
  RefreshCw,
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

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/preference-optimizer",
)({
  component: PreferenceOptimizer,
});

type PreferenceList = {
  id: string;
  name: string;
  exam: string;
  year: number;
  counselling: string;
  status: string;
};

type PreferenceItem = {
  id: string;
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
  historical_fit: string;
};

function PreferenceOptimizer() {
  const [selectedList, setSelectedList] =
    React.useState<string>("");

  const [items, setItems] = React.useState<PreferenceItem[]>(
    [],
  );

  const lists = useQuery({
    queryKey: ["jee-preference-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jee_preference_lists")
        .select(
          "id, name, exam, year, counselling, status",
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      return (data ?? []) as PreferenceList[];
    },
  });

  const optimizer = useQuery({
    queryKey: [
      "jee-preference-optimizer",
      selectedList,
    ],
    enabled: !!selectedList,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_preference_optimizer",
        {
          _preference_list_id: selectedList,
        },
      );

      if (error) throw error;

      return data as {
        success: boolean;
        item_count: number;
        items: PreferenceItem[];
        message: string;
      };
    },
  });

  React.useEffect(() => {
    if (optimizer.data?.items) {
      setItems(optimizer.data.items);
    }
  }, [optimizer.data]);

  React.useEffect(() => {
    if (!selectedList && lists.data?.length) {
      setSelectedList(lists.data[0].id);
    }
  }, [lists.data, selectedList]);

  const moveItem = (
    index: number,
    direction: "up" | "down",
  ) => {
    const target =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      target < 0 ||
      target >= items.length
    ) {
      return;
    }

    const next = [...items];

    [next[index], next[target]] = [
      next[target],
      next[index],
    ];

    setItems(
      next.map((item, position) => ({
        ...item,
        preference_order: position + 1,
      })),
    );
  };

  const removeItem = (id: string) => {
    setItems(
      items
        .filter((item) => item.id !== id)
        .map((item, index) => ({
          ...item,
          preference_order: index + 1,
        })),
    );
  };

  const saveOrder = async () => {
    if (!selectedList) return;

    const updates = items.map((item) =>
      supabase
        .from("jee_preference_list_items")
        .update({
          preference_order: item.preference_order,
        })
        .eq("id", item.id)
        .eq(
          "preference_list_id",
          selectedList,
        ),
    );

    await Promise.all(updates);

    optimizer.refetch();
  };

  const currentList = lists.data?.find(
    (list) => list.id === selectedList,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 md:px-6 md:py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <ListOrdered className="h-4 w-4" />
            Preference workspace
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            JEE Preference Optimizer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Review and organize your saved JEE college and
            branch choices into the order you want to use.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select preference list</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {lists.isLoading && (
              <p className="text-sm text-muted-foreground">
                Loading preference lists...
              </p>
            )}

            {lists.data?.length === 0 && (
              <div className="rounded-xl border p-5">
                <p className="font-medium">
                  No preference lists found
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Create a preference list first from the JEE
                  Preference List Builder.
                </p>
              </div>
            )}

            {lists.data && lists.data.length > 0 && (
              <select
                value={selectedList}
                onChange={(e) =>
                  setSelectedList(e.target.value)
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {lists.data.map((list) => (
                  <option
                    key={list.id}
                    value={list.id}
                  >
                    {list.name} · {list.year} ·{" "}
                    {list.status}
                  </option>
                ))}
              </select>
            )}
          </CardContent>
        </Card>

        {currentList && (
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {currentList.exam}
                </Badge>

                <Badge variant="outline">
                  {currentList.year}
                </Badge>

                <Badge variant="outline">
                  {currentList.counselling}
                </Badge>

                <Badge>
                  {currentList.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {optimizer.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading your preference order...
            </CardContent>
          </Card>
        )}

        {selectedList &&
          !optimizer.isLoading &&
          items.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <ListOrdered className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  Your list is empty
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Add choices from your saved shortlist first.
                </p>
              </CardContent>
            </Card>
          )}

        {items.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">
                  Preference order
                </h2>

                <p className="text-sm text-muted-foreground">
                  {items.length} choices
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    optimizer.refetch()
                  }
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload
                </Button>

                <Button
                  size="sm"
                  onClick={saveOrder}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save order
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <PreferenceCard
                  key={item.id}
                  item={item}
                  index={index}
                  total={items.length}
                  onUp={() =>
                    moveItem(index, "up")
                  }
                  onDown={() =>
                    moveItem(index, "down")
                  }
                  onRemove={() =>
                    removeItem(item.id)
                  }
                />
              ))}
            </div>
          </>
        )}

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

              <p className="text-sm leading-6 text-muted-foreground">
                The optimizer organizes your choices but does
                not decide your personal preference order. Review
                the official JoSAA rules and verify the final
                order yourself before submitting counselling
                choices.
              </p>
            </div>
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
  onUp,
  onDown,
  onRemove,
}: {
  item: PreferenceItem;
  index: number;
  total: number;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex gap-4">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold">
              {index + 1}
            </div>

            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
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
              </div>

              <h3 className="mt-2 font-semibold">
                {item.institute_name}
              </h3>

              <p className="text-sm text-muted-foreground">
                {item.program_name}
              </p>

              {(item.city || item.state) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {[item.city, item.state]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <InfoBox
                label="Opening"
                value={
                  item.opening_rank?.toLocaleString() ??
                  "—"
                }
              />

              <InfoBox
                label="Closing"
                value={
                  item.closing_rank?.toLocaleString() ??
                  "—"
                }
              />

              <InfoBox
                label="Round"
                value={
                  item.round?.toString() ?? "—"
                }
              />

              <InfoBox
                label="Data"
                value={item.historical_fit}
              />
            </div>

            {item.notes && (
              <p className="rounded-xl border p-3 text-sm text-muted-foreground">
                {item.notes}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={index === 0}
                onClick={onUp}
              >
                <ArrowUp className="mr-2 h-4 w-4" />
                Move up
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={index === total - 1}
                onClick={onDown}
              >
                <ArrowDown className="mr-2 h-4 w-4" />
                Move down
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
    <div className="rounded-xl border p-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}