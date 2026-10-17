import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Trophy, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/toppers")({
  head: () => ({ meta: [{ title: "Admin · Toppers — JEE Prep Hub" }] }),
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminToppersPage,
});

function AdminToppersPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    exam: "jee_advanced" as
      "class_10" | "class_11" | "class_12" | "jee_advanced" | "jee_main" | "neet",
    rank: 1,
    name: "",
    city: "",
    state: "",
    marks: "",
    photo_url: "",
    source_url: "",
    notes: "",
  });

  const list = useQuery({
    queryKey: ["admin-toppers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("toppers")
        .select("*")
        .order("year", { ascending: false })
        .order("exam")
        .order("rank");
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Name is required");
      const { error } = await supabase.from("toppers").insert({
        year: Number(form.year),
        exam: form.exam,
        rank: Number(form.rank),
        name: form.name.trim(),
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        marks: form.marks.trim() || null,
        photo_url: form.photo_url.trim() || null,
        source_url: form.source_url.trim() || null,
        notes: form.notes.trim() || null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Topper added");
      setForm((f) => ({
        ...f,
        name: "",
        city: "",
        state: "",
        marks: "",
        photo_url: "",
        source_url: "",
        notes: "",
      }));
      qc.invalidateQueries({ queryKey: ["admin-toppers"] });
      qc.invalidateQueries({ queryKey: ["toppers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("toppers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-toppers"] });
      qc.invalidateQueries({ queryKey: ["toppers"] });
    },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <header className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black">Toppers</h1>
            <p className="text-xs text-muted-foreground">
              Manage Class 10–12, JEE and NEET achievers in the public Hall of Fame.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold">Add topper</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Year">
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              />
            </Field>
            <Field label="Exam">
              <Select
                value={form.exam}
                onValueChange={(v) => setForm({ ...form, exam: v as typeof form.exam })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class_10">Class 10</SelectItem>
                  <SelectItem value="class_11">Class 11</SelectItem>
                  <SelectItem value="class_12">Class 12</SelectItem>
                  <SelectItem value="jee_advanced">JEE Advanced</SelectItem>
                  <SelectItem value="jee_main">JEE Main</SelectItem>
                  <SelectItem value="neet">NEET</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={form.exam.startsWith("class_") ? "Rank" : "AIR"}>
              <Input
                type="number"
                value={form.rank}
                onChange={(e) => setForm({ ...form, rank: Number(e.target.value) })}
              />
            </Field>
            <Field label="Name *" className="sm:col-span-3">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="City">
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="State">
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </Field>
            <Field label="Marks / Score">
              <Input
                value={form.marks}
                onChange={(e) => setForm({ ...form, marks: e.target.value })}
                placeholder="355/360 or 98.5%"
              />
            </Field>
            <Field label="Photo URL" className="sm:col-span-3">
              <Input
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              />
            </Field>
            <Field label="Source URL" className="sm:col-span-3">
              <Input
                value={form.source_url}
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              />
            </Field>
            <Field label="Notes" className="sm:col-span-3">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              <Plus className="mr-2 h-4 w-4" /> {create.isPending ? "Adding…" : "Add topper"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold">All toppers ({list.data?.length ?? 0})</h2>
          <div className="space-y-2">
            {list.data?.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {t.name} · {String(t.exam).startsWith("class_") ? "Rank" : "AIR"} {t.rank}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.exam.replace("_", " ").toUpperCase()} · {t.year} · {t.city ?? "—"}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(t.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {list.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No toppers yet.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
