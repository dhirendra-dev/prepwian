import * as React from "react";
import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  ShieldCheck,
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
  "/_authenticated/jee-predictor/choice-filling",
)({
  component: ChoiceFillingAssistant,
});

type Validation = {
  success: boolean;
  ready: boolean;
  total: number;
  valid: number;
  duplicate_shortlists: number;
  missing_program: number;
  missing_institute: number;
  missing_order: number;
  items: Choice[];
  error?: string;
};

type Choice = {
  id: string;
  preference_order: number;
  institute_name: string;
  program_name: string;
  category: string | null;
  quota: string | null;
  round: number | null;
  opening_rank: number | null;
  closing_rank: number | null;
};

function ChoiceFillingAssistant() {
  const [listId, setListId] =
    React.useState<string | null>(null);

  const lists = useQuery({
    queryKey: ["jee-choice-filling-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jee_preference_lists")
        .select("id,name,exam,year,counselling,status")
        .order("updated_at", {
          ascending: false,
        });

      if (error) throw error;

      return data ?? [];
    },
  });

  const selectedListId =
    listId ?? lists.data?.[0]?.id ?? null;

  const validation = useQuery({
    queryKey: [
      "jee-choice-filling-validation",
      selectedListId,
    ],
    enabled: !!selectedListId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_choice_filling_validation",
        {
          _preference_list_id: selectedListId,
        },
      );

      if (error) throw error;

      return data as Validation;
    },
  });

  if (lists.isLoading) {
    return <Loading />;
  }

  if (!lists.data?.length) {
    return (
      <Page>
        <EmptyState />
      </Page>
    );
  }

  const data = validation.data;

  return (
    <Page>
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
          <ListChecks className="h-4 w-4" />
          Counselling preparation
        </div>

        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
          Choice Filling Assistant
        </h1>

        <p className="max-w-3xl text-muted-foreground">
          Review your ordered JEE preferences and validate the
          list before using it for counselling.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select preference list</CardTitle>
        </CardHeader>

        <CardContent>
          <select
            value={selectedListId ?? ""}
            onChange={(e) =>
              setListId(e.target.value)
            }
            className="flex h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {lists.data.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name} · {list.exam} · {list.year}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {validation.isLoading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Validating your preference list...
          </CardContent>
        </Card>
      )}

      {validation.isError && (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Unable to validate this preference list.
          </CardContent>
        </Card>
      )}

      {data?.error && (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {data.error}
          </CardContent>
        </Card>
      )}

      {data && !data.error && (
        <>
          <ValidationCard data={data} />

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">
                Choice order
              </h2>

              <p className="text-sm text-muted-foreground">
                {data.total} choices in your list
              </p>
            </div>

            {data.items.map((choice) => (
              <ChoiceCard
                key={choice.id}
                choice={choice}
              />
            ))}
          </div>

          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />

              <p className="text-sm leading-6 text-muted-foreground">
                JEE Prep Hub only organizes and validates your
                personal choices. It does not submit choices to
                JoSAA and does not guarantee seat allocation.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </Page>
  );
}

function ValidationCard({
  data,
}: {
  data: Validation;
}) {
  const ready =
    data.ready &&
    data.total > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {ready ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}

          {ready
            ? "Preference list is ready for review"
            : "Review required"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ValidationStat
            label="Total"
            value={data.total}
          />

          <ValidationStat
            label="Valid"
            value={data.valid}
          />

          <ValidationStat
            label="Missing institute"
            value={data.missing_institute}
          />

          <ValidationStat
            label="Missing branch"
            value={data.missing_program}
          />

          <ValidationStat
            label="Duplicates"
            value={data.duplicate_shortlists}
          />
        </div>

        {data.missing_order > 0 && (
          <div className="rounded-xl border p-4 text-sm">
            {data.missing_order} choice(s) have no preference
            order.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChoiceCard({
  choice,
}: {
  choice: Choice;
}) {
  const [expanded, setExpanded] =
    React.useState(false);

  return (
    <Card>
      <CardContent className="p-4 md:p-5">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg font-bold">
            {choice.preference_order}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold">
                  {choice.institute_name}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {choice.program_name}
                </p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setExpanded(!expanded)
                }
              >
                {expanded ? (
                  <>
                    Hide details
                    <ChevronUp className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Details
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {choice.category && (
                <Badge variant="secondary">
                  {choice.category}
                </Badge>
              )}

              {choice.quota && (
                <Badge variant="outline">
                  {choice.quota}
                </Badge>
              )}

              {choice.round && (
                <Badge variant="outline">
                  Round {choice.round}
                </Badge>
              )}
            </div>

            {expanded && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <RankDetail
                  label="Opening rank"
                  value={choice.opening_rank}
                />

                <RankDetail
                  label="Closing rank"
                  value={choice.closing_rank}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ValidationStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function RankDetail({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value !== null
          ? `#${value.toLocaleString()}`
          : "Not available"}
      </p>
    </div>
  );
}

function Page({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 md:py-10">
        <Button asChild variant="ghost" size="sm">
          <Link to="/jee-predictor">
            <ArrowLeft className="mr-2 h-4 w-4" />
            JEE Predictor
          </Link>
        </Button>

        {children}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <Page>
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          Loading your preference lists...
        </CardContent>
      </Card>
    </Page>
  );
}

function EmptyState() {
  return (
    <>
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
          <ListChecks className="h-4 w-4" />
          Counselling preparation
        </div>

        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
          Choice Filling Assistant
        </h1>
      </div>

      <Card>
        <CardContent className="py-14 text-center">
          <ListChecks className="mx-auto h-10 w-10 text-muted-foreground" />

          <h2 className="mt-4 text-xl font-semibold">
            No preference list found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Build a preference list first, then return here to
            validate your choices.
          </p>

          <Button asChild className="mt-5">
            <Link to="/jee-predictor/preferences">
              Open Preference Builder
            </Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}