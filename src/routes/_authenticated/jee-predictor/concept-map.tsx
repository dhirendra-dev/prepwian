import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  RefreshCw,
  Network,
} from "lucide-react";
import {
  Link,
  createFileRoute,
} from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Dependency = {
  id: string;
  subject: string;
  strength: "CORE" | "HELPFUL";
  notes: string | null;
  prerequisite: {
    id: string;
    code: string | null;
    name: string;
    order: number;
  };
  dependent: {
    id: string;
    code: string | null;
    name: string;
    order: number;
  };
};

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/concept-map",
)({
  component: ConceptDependencyMapPage,
});

function ConceptDependencyMapPage() {
  const [exam, setExam] = useState<
    "JEE_MAIN" | "JEE_ADVANCED"
  >("JEE_MAIN");

  const [subject, setSubject] = useState<
    string | null
  >(null);

  const [dependencies, setDependencies] =
    useState<Dependency[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null,
  );

  const loadMap = async () => {
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await (
      supabase as any
    ).rpc("get_jee_concept_dependency_map", {
      _exam: exam,
      _subject: subject,
    });

    if (rpcError) {
      setError(rpcError.message);
      setDependencies([]);
      setLoading(false);
      return;
    }

    if (!data?.success) {
      setError(
        data?.message ??
          "Unable to load concept dependency map.",
      );
      setDependencies([]);
      setLoading(false);
      return;
    }

    setDependencies(data.dependencies ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadMap();
  }, [exam, subject]);

  const chapters = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        code: string | null;
        prerequisites: number;
        dependents: number;
      }
    >();

    dependencies.forEach((dependency) => {
      const prerequisite =
        dependency.prerequisite;

      const dependent =
        dependency.dependent;

      if (!map.has(prerequisite.id)) {
        map.set(prerequisite.id, {
          id: prerequisite.id,
          name: prerequisite.name,
          code: prerequisite.code,
          prerequisites: 0,
          dependents: 0,
        });
      }

      if (!map.has(dependent.id)) {
        map.set(dependent.id, {
          id: dependent.id,
          name: dependent.name,
          code: dependent.code,
          prerequisites: 0,
          dependents: 0,
        });
      }

      map.get(prerequisite.id)!.dependents += 1;
      map.get(dependent.id)!.prerequisites += 1;
    });

    return Array.from(map.values());
  }, [dependencies]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
            >
              <Link to="/jee-predictor">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>

            <div>
              <div className="flex items-center gap-2">
                <Network className="h-5 w-5" />

                <h1 className="text-2xl font-bold">
                  Concept Dependency Map
                </h1>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Understand which concepts should come
                before the next one.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={loadMap}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={
              exam === "JEE_MAIN"
                ? "default"
                : "outline"
            }
            onClick={() => setExam("JEE_MAIN")}
          >
            JEE Main
          </Button>

          <Button
            variant={
              exam === "JEE_ADVANCED"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setExam("JEE_ADVANCED")
            }
          >
            JEE Advanced
          </Button>

          {[
            ["PHYSICS", "Physics"],
            ["CHEMISTRY", "Chemistry"],
            ["MATHEMATICS", "Mathematics"],
          ].map(([value, label]) => (
            <Button
              key={value}
              variant={
                subject === value
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setSubject(
                  subject === value
                    ? null
                    : value,
                )
              }
            >
              {label}
            </Button>
          ))}
        </div>

        {error && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-destructive">
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Dependencies"
            value={dependencies.length}
          />

          <StatCard
            label="Concepts"
            value={chapters.length}
          />

          <StatCard
            label="Core Dependencies"
            value={
              dependencies.filter(
                (item) =>
                  item.strength === "CORE",
              ).length
            }
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Dependency Graph
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading concept relationships...
              </div>
            ) : dependencies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Network className="mb-3 h-10 w-10" />

                <h2 className="text-lg font-semibold">
                  No dependency data yet
                </h2>

                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Verified prerequisite relationships
                  have not been added for this exam or
                  subject yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dependencies.map((dependency) => (
                  <DependencyRow
                    key={dependency.id}
                    dependency={dependency}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              How to read the map
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Badge>Prerequisite</Badge>
                  <ChevronRight className="h-4 w-4" />
                  <Badge variant="secondary">
                    Next Concept
                  </Badge>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  The concept on the left is a
                  prerequisite for the concept on the
                  right.
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    CORE
                  </Badge>

                  <Badge variant="outline">
                    HELPFUL
                  </Badge>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  CORE means the prerequisite is directly
                  important. HELPFUL indicates supporting
                  prior knowledge.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DependencyRow({
  dependency,
}: {
  dependency: Dependency;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          {dependency.prerequisite.code && (
            <p className="text-xs text-muted-foreground">
              {dependency.prerequisite.code}
            </p>
          )}

          <h3 className="mt-1 font-semibold">
            {dependency.prerequisite.name}
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Prerequisite
          </p>
        </div>

        <div className="flex items-center justify-center">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          {dependency.dependent.code && (
            <p className="text-xs text-muted-foreground">
              {dependency.dependent.code}
            </p>
          )}

          <h3 className="mt-1 font-semibold">
            {dependency.dependent.name}
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Dependent concept
          </p>
        </div>

        <Badge
          variant={
            dependency.strength === "CORE"
              ? "default"
              : "outline"
          }
        >
          {dependency.strength}
        </Badge>
      </div>

      {dependency.notes && (
        <p className="mt-4 border-t pt-3 text-sm text-muted-foreground">
          {dependency.notes}
        </p>
      )}
    </div>
  );
}
function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
