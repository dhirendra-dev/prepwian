import { useState } from "react";
import { RefreshCw, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  fetchNtaUpdates,
  requestNtaManualFetch,
  processNtaManualFetches,
} from "@/lib/nta";

export default function NTASync() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetchNtaUpdates();

      setResult(response);

      toast.success("NTA sync completed successfully");
    } catch (error: any) {
      console.error("NTA sync error:", error);

      toast.error(error?.message || "NTA sync failed");

      setResult({
        error: error?.message || "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOnly() {
    setLoading(true);

    try {
      const response = await requestNtaManualFetch();

      setResult({
        request: response,
      });

      toast.success("NTA fetch requested");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Could not request NTA fetch");
    } finally {
      setLoading(false);
    }
  }

  async function handleProcessOnly() {
    setLoading(true);

    try {
      const response = await processNtaManualFetches();

      setResult({
        process: response,
      });

      toast.success("NTA fetch results processed");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Could not process NTA results");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold">
            NTA Sync Center
          </h1>

          <p className="text-sm text-muted-foreground">
            Manually fetch and process official JEE Main information from NTA.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Manual NTA Sync
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Official sources only
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              This sync reads official JEE Main/NTA pages and stores their
              metadata and official links in JEE Prep Hub.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleSync}
              disabled={loading}
              className="sm:flex-1"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />

              {loading ? "Syncing NTA…" : "Fetch Latest NTA Updates"}
            </Button>

            <Button
              variant="outline"
              onClick={handleRequestOnly}
              disabled={loading}
            >
              Request Fetch
            </Button>

            <Button
              variant="outline"
              onClick={handleProcessOnly}
              disabled={loading}
            >
              Process Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.error ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}

              Sync Result
            </CardTitle>
          </CardHeader>

          <CardContent>
            {result.error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {result.error}
              </div>
            ) : (
              <div className="space-y-3">
                {result.request && (
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="text-sm">Fetch request</span>

                    <Badge variant="secondary">
                      {typeof result.request === "object"
                        ? result.request.requested_sources ?? "Completed"
                        : "Completed"}
                    </Badge>
                  </div>
                )}

                {result.process && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="mb-2 text-sm font-medium">
                      Processing result
                    </p>

                    <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                      {JSON.stringify(result.process, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Important:</strong>{" "}
        NTA synchronization is manual. No new NTA cron job is used.
        Documents remain linked to their official NTA URLs.
      </div>
    </div>
  );
}