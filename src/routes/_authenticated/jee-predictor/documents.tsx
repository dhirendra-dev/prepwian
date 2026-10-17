import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  FileCheck2,
  Info,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/documents",
)({
  component: DocumentsChecklist,
});

type DocumentItem = {
  id: string;
  document_key: string;
  document_name: string;
  description: string | null;
  required_when: string | null;
  status: "PENDING" | "READY" | "NOT_APPLICABLE";
  notes: string | null;
};

function DocumentsChecklist() {
  const { user } = Route.useRouteContext();
  const [year, setYear] = React.useState("2026");
  const [items, setItems] = React.useState<DocumentItem[]>([]);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [requiredWhen, setRequiredWhen] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const checklist = useQuery({
    queryKey: ["jee-document-checklist", year],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_document_checklist",
        {
          _year: Number(year),
          _counselling: "JOSAA",
        },
      );

      if (error) throw error;

      return data as {
        success: boolean;
        items: DocumentItem[];
      };
    },
  });

  React.useEffect(() => {
    if (checklist.data?.items) {
      setItems(checklist.data.items);
    }
  }, [checklist.data]);

  const addDocument = async () => {
    if (!name.trim()) return;

    setSaving(true);

    const key = `${name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")}_${Date.now()}`;

    const { data, error } = await supabase
      .from("jee_document_checklist")
      .insert({
        user_id: user.id,
        year: Number(year),
        counselling: "JOSAA",
        document_key: key,
        document_name: name.trim(),
        description: description.trim() || null,
        required_when: requiredWhen.trim() || null,
      })
      .select(
        "id, document_key, document_name, description, required_when, status, notes",
      )
      .single();

    setSaving(false);

    if (error) {
      console.error(error);
      return;
    }

    setItems((current) => [
      ...current,
      data as DocumentItem,
    ]);

    setName("");
    setDescription("");
    setRequiredWhen("");
  };

  const updateStatus = async (
    item: DocumentItem,
    status: DocumentItem["status"],
  ) => {
    const { error } = await supabase
      .from("jee_document_checklist")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      console.error(error);
      return;
    }

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, status }
          : entry,
      ),
    );
  };

  const updateNotes = async (
    item: DocumentItem,
    notes: string,
  ) => {
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, notes }
          : entry,
      ),
    );

    await supabase
      .from("jee_document_checklist")
      .update({
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  };

  const deleteDocument = async (id: string) => {
    const { error } = await supabase
      .from("jee_document_checklist")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setItems((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  const ready = items.filter(
    (item) => item.status === "READY",
  ).length;

  const pending = items.filter(
    (item) => item.status === "PENDING",
  ).length;

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
            <FileCheck2 className="h-4 w-4" />
            Counselling documents
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            JEE Documents Checklist
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Keep track of documents and certificates you may need
            during counselling.
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="2026">JEE 2026</option>
                <option value="2027">JEE 2027</option>
                <option value="2028">JEE 2028</option>
              </select>

              <Badge variant="secondary">
                {pending} pending
              </Badge>

              <Badge variant="outline">
                {ready} ready
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add document</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              placeholder="Document name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />

            <Input
              placeholder="Required when (optional)"
              value={requiredWhen}
              onChange={(e) =>
                setRequiredWhen(e.target.value)
              }
            />

            <Button
              onClick={addDocument}
              disabled={!name.trim() || saving}
            >
              <Plus className="mr-2 h-4 w-4" />
              {saving ? "Adding..." : "Add document"}
            </Button>
          </CardContent>
        </Card>

        {checklist.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading documents...
            </CardContent>
          </Card>
        )}

        {!checklist.isLoading && items.length === 0 && (
          <Card>
            <CardContent className="py-14 text-center">
              <FileCheck2 className="mx-auto h-10 w-10 text-muted-foreground" />

              <h2 className="mt-4 text-xl font-semibold">
                No documents added
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Add the documents you want to track above.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {items.map((item) => (
            <DocumentCard
              key={item.id}
              item={item}
              onStatusChange={updateStatus}
              onNotesChange={updateNotes}
              onDelete={deleteDocument}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

              <p className="text-sm leading-6 text-muted-foreground">
                Document requirements can vary by examination,
                category, institute and counselling authority.
                Always verify the current official requirements
                before submitting documents. This checklist does
                not replace official instructions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DocumentCard({
  item,
  onStatusChange,
  onNotesChange,
  onDelete,
}: {
  item: DocumentItem;
  onStatusChange: (
    item: DocumentItem,
    status: DocumentItem["status"],
  ) => void;
  onNotesChange: (
    item: DocumentItem,
    notes: string,
  ) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border">
            {item.status === "READY" ? (
              <Check className="h-5 w-5" />
            ) : (
              <FileCheck2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">
                {item.document_name}
              </h3>

              <Badge
                variant={
                  item.status === "READY"
                    ? "default"
                    : item.status ===
                        "NOT_APPLICABLE"
                      ? "secondary"
                      : "outline"
                }
              >
                {item.status === "READY"
                  ? "Ready"
                  : item.status ===
                      "NOT_APPLICABLE"
                    ? "Not applicable"
                    : "Pending"}
              </Badge>
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            )}

            {item.required_when && (
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">
                  Required when
                </p>

                <p className="mt-1 text-sm">
                  {item.required_when}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={
                  item.status === "READY"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  onStatusChange(
                    item,
                    item.status === "READY"
                      ? "PENDING"
                      : "READY",
                  )
                }
              >
                <Check className="mr-2 h-4 w-4" />
                {item.status === "READY"
                  ? "Mark pending"
                  : "Mark ready"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onStatusChange(
                    item,
                    item.status === "NOT_APPLICABLE"
                      ? "PENDING"
                      : "NOT_APPLICABLE",
                  )
                }
              >
                Not applicable
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Personal note..."
                value={item.notes ?? ""}
                onChange={(e) =>
                  onNotesChange(
                    item,
                    e.target.value,
                  )
                }
              />

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  onNotesChange(
                    item,
                    item.notes ?? "",
                  )
                }
                aria-label="Save note"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}