import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2, Maximize2, Minimize2, Minus, Plus, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { StudyMarkdown } from "@/components/StudyMarkdown";
import { resolveResourceUrl, toEmbedUrl, type Resource } from "@/lib/notes";
import { toast } from "sonner";

export function NotesReader({ resource }: { resource: Resource }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(resource.file_kind !== "text");
  const [error, setError] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    setZoom(100);
    if (resource.file_kind === "text") {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    resolveResourceUrl(resource)
      .then((u) => alive && setUrl(u))
      .catch((e) => alive && setError(e.message ?? "Could not load this file"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [resource.id, resource.storage_path, resource.file_url, resource.file_kind]);

  // Lock page scroll while in full-screen reading mode.
  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [full]);

  const download = async () => {
    try {
      const u = await resolveResourceUrl(resource, true);
      window.open(u, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e.message ?? "Download failed");
    }
  };

  const isPdf = resource.file_kind === "pdf";
  const step = (d: number) => setZoom((z) => Math.min(300, Math.max(50, z + d)));

  let body: React.ReactNode = null;
  if (loading) {
    body = (
      <div className="grid h-64 place-items-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  } else if (error) {
    body = <p className="p-6 text-sm text-destructive">{error}</p>;
  } else if (resource.file_kind === "text") {
    body = (
      <div className="p-4 leading-relaxed" style={{ fontSize: `${zoom}%` }}>
        <StudyMarkdown content={resource.content_md ?? ""} />
      </div>
    );
  } else if (resource.file_kind === "image" && url) {
    body = (
      <div className="overflow-auto p-2">
        <img src={url} alt={resource.title} style={{ width: `${zoom}%`, maxWidth: "none" }} className="mx-auto block h-auto" />
      </div>
    );
  } else if (url) {
    // pdf or generic link: use the browser's native viewer via iframe.
    const isStorage = !!resource.storage_path;
    const src = isPdf && isStorage
      ? `${url}#page=${page}&zoom=${zoom}${resource.downloadable ? "" : "&toolbar=0"}`
      : toEmbedUrl(url);
    body = (
      <iframe
        key={`${src}`}
        src={src}
        title={resource.title}
        className={full ? "h-full w-full border-0" : "h-[70vh] w-full border-0"}
        allow="fullscreen"
      />
    );
  }

  const canZoom = resource.file_kind === "text" || resource.file_kind === "image" || (isPdf && !!resource.storage_path);
  const canPage = isPdf && !!resource.storage_path;

  return (
    <div className={full ? "fixed inset-0 z-50 flex flex-col bg-background" : "overflow-hidden rounded-2xl border border-border bg-card"}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{resource.title}</p>
          {resource.source === "ai_draft" && (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-600 dark:text-fuchsia-300">
              <Sparkles className="h-3 w-3" /> AI-generated draft
            </span>
          )}
        </div>
        {canPage && (
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="number"
              min={1}
              value={page}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
              className="h-8 w-14 rounded-md border border-border bg-background px-2 text-center text-xs"
              aria-label="Page number"
            />
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setPage((p) => p + 1)} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        {canZoom && (
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => step(-25)} aria-label="Zoom out">
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-10 text-center text-xs tabular-nums">{zoom}%</span>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => step(25)} aria-label="Zoom in">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
        {url && (
          <Button size="icon" variant="outline" className="h-8 w-8" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open in new tab">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
        {resource.downloadable && resource.file_kind !== "text" && (
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={download} aria-label="Download">
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setFull((f) => !f)} aria-label="Toggle full screen">
          {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
      <div className={full ? "min-h-0 flex-1 overflow-auto" : ""}>{body}</div>
      {resource.description && !full && <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">{resource.description}</p>}
    </div>
  );
}