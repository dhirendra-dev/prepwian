import { supabase } from "@/integrations/supabase/client";

export type NtaDocument = {
  id: string;
  source_id: string;
  external_url: string;
  title: string;
  normalized_title: string | null;
  category: string | null;
  exam_year: number | null;
  session: string | null;
  paper: string | null;
  document_type: string | null;
  published_at: string | null;
  discovered_at: string;
  last_seen_at: string;
  is_active: boolean;
  official: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type NtaQuestionPaper = {
  id: string;
  document_id: string;
  year: number | null;
  session: string | null;
  exam_date: string | null;
  shift: string | null;
  paper_type: string | null;
  subject: string | null;
  title: string;
  official_url: string;
  answer_key_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type NtaAlert = {
  id: string;
  document_id: string | null;
  alert_type: string;
  priority: string;
  title: string;
  summary: string | null;
  published_at: string | null;
  official_url: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

/*
 * The NTA tables were added directly to Supabase and the generated
 * Supabase types have not been regenerated yet.
 *
 * Keep the runtime client unchanged and use a narrow untyped view here.
 */
const ntaDb = supabase as any;

/**
 * Get official NTA documents.
 */
export async function getNtaDocuments(options?: {
  category?: string;
  year?: number;
  session?: string;
  limit?: number;
}): Promise<NtaDocument[]> {
  let query = ntaDb
    .from("nta_documents")
    .select("*")
    .eq("is_active", true)
    .eq("official", true)
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.year) {
    query = query.eq("exam_year", options.year);
  }

  if (options?.session) {
    query = query.eq("session", options.session);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as NtaDocument[];
}

/**
 * Get official JEE Main question papers.
 */
export async function getNtaQuestionPapers(options?: {
  year?: number;
  session?: string;
  subject?: string;
  limit?: number;
}): Promise<NtaQuestionPaper[]> {
  let query = ntaDb
    .from("nta_question_papers")
    .select("*")
    .order("year", {
      ascending: false,
      nullsFirst: false,
    })
    .order("exam_date", {
      ascending: false,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (options?.year) {
    query = query.eq("year", options.year);
  }

  if (options?.session) {
    query = query.eq("session", options.session);
  }

  if (options?.subject) {
    query = query.eq("subject", options.subject);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as NtaQuestionPaper[];
}

/**
 * Get published NTA alerts.
 */
export async function getNtaAlerts(
  limit = 20,
): Promise<NtaAlert[]> {
  const { data, error } = await ntaDb
    .from("nta_alerts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as NtaAlert[];
}

/**
 * Request a manual fetch from the official NTA website.
 *
 * Admin-only RPC.
 * This does NOT create a cron job.
 */
export async function requestNtaManualFetch() {
  const { data, error } = await ntaDb.rpc(
    "request_nta_manual_fetch",
  );

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Process the manually fetched NTA pages.
 *
 * Admin-only RPC.
 */
export async function processNtaManualFetches() {
  const { data, error } = await ntaDb.rpc(
    "process_nta_manual_fetches",
  );

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Run the complete manual NTA update.
 *
 * 1. Request official NTA pages.
 * 2. Wait for pg_net responses.
 * 3. Process the returned pages.
 */
export async function fetchNtaUpdates() {
  const requestResult = await requestNtaManualFetch();

  /*
   * pg_net is asynchronous, so give the HTTP requests
   * a short amount of time to finish before processing.
   */
  await new Promise<void>((resolve) =>
    setTimeout(resolve, 2500),
  );

  const processResult = await processNtaManualFetches();

  return {
    request: requestResult,
    process: processResult,
  };
}