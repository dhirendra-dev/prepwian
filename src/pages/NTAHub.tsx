import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, KeyRound, Loader2, RefreshCw } from "lucide-react";

import {
  getNtaAlerts,
  getNtaDocuments,
  getNtaQuestionPapers,
  type NtaAlert,
  type NtaDocument,
  type NtaQuestionPaper,
} from "@/lib/nta";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function formatDate(value: string | null) {
  if (!value) return "Date not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function categoryLabel(category: string | null) {
  switch (category) {
    case "answer_key":
    case "answer_keys":
      return "Answer Key";

    case "question_paper":
    case "question_papers":
      return "Question Paper";

    case "information_bulletin":
    case "information_bulletins":
      return "Information Bulletin";

    case "admit_card":
    case "admit_cards":
      return "Admit Card";

    case "result":
    case "results":
      return "Result";

    case "advisory":
    case "advisories":
      return "Advisory";

    case "public_notice":
    case "public_notices":
      return "Public Notice";

    case "current_events":
    case "current_event":
      return "Current Event";

    case "faq":
    case "faqs":
      return "FAQ";

    case "syllabus":
      return "Syllabus";

    default:
      return "NTA Update";
  }
}

function DocumentCard({ document }: { document: NtaDocument }) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="secondary">
            {categoryLabel(document.category)}
          </Badge>

          <span className="text-xs text-muted-foreground">
            {formatDate(document.published_at ?? document.discovered_at)}
          </span>
        </div>

        <CardTitle className="text-base leading-6">
          {document.title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <a
            href={document.external_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Official NTA Document
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function AlertCard({ alert }: { alert: NtaAlert }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Official NTA</Badge>

            <span className="text-xs text-muted-foreground">
              {formatDate(alert.published_at ?? alert.created_at)}
            </span>
          </div>

          <h3 className="font-semibold">{alert.title}</h3>

          {alert.summary && (
            <p className="mt-1 text-sm text-muted-foreground">
              {alert.summary}
            </p>
          )}
        </div>

        <Button asChild variant="outline" className="shrink-0">
          <a
            href={alert.official_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function QuestionPaperCard({
  paper,
}: {
  paper: NtaQuestionPaper;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              {paper.year && (
                <Badge variant="secondary">{paper.year}</Badge>
              )}

              {paper.session && (
                <Badge variant="outline">{paper.session}</Badge>
              )}

              {paper.shift && (
                <Badge variant="outline">{paper.shift}</Badge>
              )}
            </div>

            <h3 className="mt-3 font-semibold">{paper.title}</h3>

            <div className="mt-1 text-sm text-muted-foreground">
              {paper.subject || "Subject not specified"}
              {paper.exam_date
                ? ` • ${formatDate(paper.exam_date)}`
                : ""}
            </div>
          </div>

          <Button asChild variant="outline" className="shrink-0">
            <a
              href={paper.official_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Paper
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NTAHub() {
  const [documents, setDocuments] = useState<NtaDocument[]>([]);
  const [alerts, setAlerts] = useState<NtaAlert[]>([]);
  const [questionPapers, setQuestionPapers] = useState<NtaQuestionPaper[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [docs, ntaAlerts, papers] = await Promise.all([
        getNtaDocuments({ limit: 100 }),
        getNtaAlerts(50),
        getNtaQuestionPapers({ limit: 100 }),
      ]);

      setDocuments(docs);
      setAlerts(ntaAlerts);
      setQuestionPapers(papers);
    } catch (err) {
      console.error("NTA data loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load NTA data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const publicNotices = useMemo(
  () =>
    documents.filter(
      (item) =>
        item.category === "public_notice" ||
        item.category === "public_notices",
    ),
  [documents],
);

const currentEvents = useMemo(
  () =>
    documents.filter(
      (item) =>
        item.category === "current_events" ||
        item.category === "current_event" ||
        item.category === "advisory" ||
        item.category === "result" ||
        item.category === "admit_card" ||
        item.category === "admit_cards",
    ),
  [documents],
);

const bulletins = useMemo(
  () =>
    documents.filter(
      (item) =>
        item.category === "information_bulletin" ||
        item.category === "information_bulletins",
    ),
  [documents],
);

const answerKeys = useMemo(
  () =>
    documents.filter(
      (item) =>
        item.category === "answer_key" ||
        item.category === "answer_keys",
    ),
  [documents],
);

const faqs = useMemo(
  () =>
    documents.filter(
      (item) =>
        item.category === "faq" ||
        item.category === "faqs",
    ),
  [documents],
);

const syllabi = useMemo(
  () =>
    documents.filter(
      (item) => item.category === "syllabus",
    ),
  [documents],
);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading official NTA updates...
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <section className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>

              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  NTA JEE Main
                </h1>

                <p className="text-sm text-muted-foreground">
                  Official JEE Main documents and updates
                </p>
              </div>
            </div>

            <p className="max-w-2xl text-sm text-muted-foreground">
              Access official JEE Main notices, bulletins, question
              papers and answer keys through JEE Prep Hub. Documents
              open directly from the official NTA website.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => void loadData()}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </section>

      {error && (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="p-5">
            <p className="font-medium text-destructive">
              Unable to load NTA data
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {error}
            </p>

            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void loadData()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Notices
            </p>
            <p className="mt-2 text-2xl font-bold">
              {publicNotices.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Question Papers
            </p>
            <p className="mt-2 text-2xl font-bold">
              {questionPapers.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Answer Keys
            </p>
            <p className="mt-2 text-2xl font-bold">
              {answerKeys.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Official Alerts
            </p>
            <p className="mt-2 text-2xl font-bold">
              {alerts.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs
  defaultValue="notices"
  className="w-full min-w-0"
>
        <TabsList className="mb-6 grid h-auto w-full min-w-0 grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="notices">
            Notices
          </TabsTrigger>

          <TabsTrigger value="events">
            Current Events
          </TabsTrigger>

          <TabsTrigger value="bulletins">
            Bulletins
          </TabsTrigger>

          <TabsTrigger value="papers">
            Question Papers
          </TabsTrigger>

          <TabsTrigger value="keys">
  Answer Keys
</TabsTrigger>
        </TabsList>
<TabsContent value="faqs">
  {faqs.length === 0 ? (
    <EmptyState text="No FAQs available yet." />
  ) : (
    <div className="grid gap-4 md:grid-cols-2">
      {faqs.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
        />
      ))}
    </div>
  )}
</TabsContent>

              <TabsContent
  value="notices"
  className="mt-0 w-full min-w-0"
>
  {publicNotices.length === 0 ? (
    <EmptyState text="No public notices available yet." />
  ) : (
    <div className="grid w-full min-w-0 gap-4 md:grid-cols-2">
      {publicNotices.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
        />
      ))}
    </div>
  )}
</TabsContent>

<TabsContent
  value="events"
  className="mt-0 w-full min-w-0"
>
  {currentEvents.length === 0 ? (
    <EmptyState text="No current events available yet." />
  ) : (
    <div className="grid w-full min-w-0 gap-4 md:grid-cols-2">
      {currentEvents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
        />
      ))}
    </div>
  )}
</TabsContent>

<TabsContent
  value="bulletins"
  className="mt-0 w-full min-w-0"
>
  {bulletins.length === 0 ? (
    <EmptyState text="No information bulletins available yet." />
  ) : (
    <div className="grid w-full min-w-0 gap-4 md:grid-cols-2">
      {bulletins.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
        />
      ))}
    </div>
  )}
</TabsContent>

<TabsContent
  value="papers"
  className="mt-0 w-full min-w-0"
>
  {questionPapers.length === 0 ? (
    <EmptyState text="No question papers available yet." />
  ) : (
    <div className="w-full min-w-0 space-y-4">
      {questionPapers.map((paper) => (
        <QuestionPaperCard
          key={paper.id}
          paper={paper}
        />
      ))}
    </div>
  )}
</TabsContent>

<TabsContent
  value="keys"
  className="mt-0 w-full min-w-0"
>
  {answerKeys.length === 0 ? (
    <EmptyState text="No answer keys available yet." />
  ) : (
    <div className="grid w-full min-w-0 gap-4 md:grid-cols-2">
      {answerKeys.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
        />
      ))}
    </div>
  )}
</TabsContent>

<TabsContent
  value="faqs"
  className="mt-0 w-full min-w-0"
>
  {faqs.length === 0 ? (
    <EmptyState text="No FAQs available yet." />
  ) : (
    <div className="grid w-full min-w-0 gap-4 md:grid-cols-2">
      {faqs.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
        />
      ))}
    </div>
  )}
</TabsContent>

<TabsContent
  value="syllabus"
  className="mt-0 w-full min-w-0"
>
  {syllabi.length === 0 ? (
    <EmptyState text="No syllabus documents available yet." />
  ) : (
    <div className="grid w-full min-w-0 gap-4 md:grid-cols-2">
      {syllabi.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
        />
      ))}
    </div>
  )}
</TabsContent>
      </Tabs>

      <div className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <KeyRound className="h-3.5 w-3.5" />
        Official documents are linked to NTA sources.
      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-40 items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {text}
      </CardContent>
    </Card>
  );
}