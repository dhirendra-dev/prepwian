import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_TOKEN_URL =
  "https://oauth2.googleapis.com/token";

const GOOGLE_CALENDAR_API =
  "https://www.googleapis.com/calendar/v3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

/* ============================================================
 * ENVIRONMENT
 * ============================================================ */

function env(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(
      `${name} environment variable is not configured.`,
    );
  }

  return value;
}

/* ============================================================
 * CRYPTO
 * ============================================================ */

function base64ToBuffer(
  value: string,
): ArrayBuffer {
  const binary = atob(value);

  const bytes = new Uint8Array(
    binary.length,
  );

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

async function deriveEncryptionKey(
  secret: string,
): Promise<CryptoKey> {
  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(secret),
    );

  return crypto.subtle.importKey(
    "raw",
    hash,
    {
      name: "AES-GCM",
    },
    false,
    ["decrypt"],
  );
}

async function decryptSecret(
  encrypted: string,
  encryptionSecret: string,
): Promise<string> {
  const [ivBase64, dataBase64] =
    encrypted.split(".");

  if (!ivBase64 || !dataBase64) {
    throw new Error(
      "Invalid encrypted credential.",
    );
  }

  const key =
    await deriveEncryptionKey(
      encryptionSecret,
    );

  const decrypted =
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToBuffer(ivBase64),
      },
      key,
      base64ToBuffer(dataBase64),
    );

  return new TextDecoder().decode(
    decrypted,
  );
}

/* ============================================================
 * GOOGLE TOKEN REFRESH
 * ============================================================ */

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
) {
  const body =
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

  const response =
    await fetch(
      GOOGLE_TOKEN_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body,
      },
    );

  const data =
    await response.json();

  if (!response.ok) {
    console.error(
      "Google token refresh failed:",
      data,
    );

    throw new Error(
      "Google access could not be refreshed.",
    );
  }

  return data as {
    access_token: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };
}

/* ============================================================
 * GOOGLE API REQUEST
 * ============================================================ */

async function googleRequest(
  accessToken: string,
  path: string,
  init: RequestInit = {},
) {
  const response =
    await fetch(
      `${GOOGLE_CALENDAR_API}${path}`,
      {
        ...init,
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
          ...(init.headers ?? {}),
        },
      },
    );

  const text =
    await response.text();

  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return {
    response,
    data,
  };
}

/* ============================================================
 * EVENT HELPERS
 * ============================================================ */

function getEventStart(
  event: any,
): string | null {
  if (event.start?.dateTime) {
    return event.start.dateTime;
  }

  if (event.start?.date) {
    return `${event.start.date}T00:00:00+00:00`;
  }

  return null;
}

function getEventEnd(
  event: any,
): string | null {
  if (event.end?.dateTime) {
    return event.end.dateTime;
  }

  if (event.end?.date) {
    return `${event.end.date}T00:00:00+00:00`;
  }

  return null;
}

function mapGoogleEventType(
  event: any,
): string {
  const summary =
    String(
      event.summary ?? "",
    ).toLowerCase();

  if (
    summary.includes("exam") ||
    summary.includes("jee") ||
    summary.includes("neet") ||
    summary.includes("ioqm")
  ) {
    return "exam";
  }

  if (
    summary.includes("test") ||
    summary.includes("mock")
  ) {
    return "test";
  }

  if (
    summary.includes("lecture") ||
    summary.includes("class")
  ) {
    return "lecture";
  }

  if (
    summary.includes("study") ||
    summary.includes("revision")
  ) {
    return "study";
  }

  return "event";
}

function getGoogleCalendarId(
  event: any,
): string | null {
  return (
    event.organizer?.email ??
    event.calendarId ??
    null
  );
}

/* ============================================================
 * CALENDAR IMPORT
 * ============================================================ */

async function ensureGoogleCalendar(
  supabase: any,
  userId: string,
  calendarId: string,
  calendarSummary: string,
  color: string | null,
) {
  const { data, error } =
    await supabase
      .from("smart_calendars")
      .upsert(
        {
          user_id: userId,

          name:
            calendarSummary ||
            "Google Calendar",

          description:
            "Imported from Google Calendar",

          color:
            color ??
            "#4285F4",

          calendar_type:
            "google",

          is_visible:
            true,

          is_default:
            false,

          external_provider:
            "google",

          external_calendar_id:
            calendarId,
        },
        {
          onConflict:
            "user_id,external_provider,external_calendar_id",
        },
      )
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data;
}

/* ============================================================
 * SYNC ONE GOOGLE CALENDAR
 * ============================================================ */

async function syncCalendar(
  supabase: any,
  userId: string,
  accessToken: string,
  calendar: any,
  existingSyncToken: string | null,
) {
  const calendarId =
    calendar.id;

  if (!calendarId) {
    return {
      imported: 0,
      updated: 0,
      deleted: 0,
      syncToken: existingSyncToken,
    };
  }

  const localCalendar =
    await ensureGoogleCalendar(
      supabase,
      userId,
      calendarId,
      calendar.summary,
      calendar.backgroundColor,
    );

  let pageToken:
    string | null = null;

  let nextSyncToken:
    string | null =
      existingSyncToken;

  let imported = 0;
  let updated = 0;
  let deleted = 0;

  /*
   * Incremental sync cannot use the same filtering
   * parameters as an initial time-range query.
   */
  const isIncremental =
    Boolean(existingSyncToken);

  do {
    const params =
      new URLSearchParams();

    params.set(
      "maxResults",
      "250",
    );

    params.set(
      "showDeleted",
      "true",
    );

    if (isIncremental) {
      params.set(
        "syncToken",
        existingSyncToken!,
      );
    } else {
      params.set(
        "singleEvents",
        "false",
      );
    }

    if (pageToken) {
      params.set(
        "pageToken",
        pageToken,
      );
    }

    const result =
      await googleRequest(
        accessToken,
        `/calendars/${encodeURIComponent(
          calendarId,
        )}/events?${params.toString()}`,
      );

    /*
     * A 410 means the incremental sync token is
     * no longer valid. Google requires a new full sync.
     */
    if (
      result.response.status === 410
    ) {
      throw new Error(
        "SYNC_TOKEN_EXPIRED",
      );
    }

    if (!result.response.ok) {
      console.error(
        "Google events.list error:",
        result.data,
      );

      throw new Error(
        `Google Calendar API returned ${result.response.status}.`,
      );
    }

    const events =
      result.data?.items ?? [];

    for (const event of events) {
      if (!event.id) {
        continue;
      }

      const startAt =
        getEventStart(event);

      const endAt =
        getEventEnd(event);

      /*
       * Some Google event resources do not have a
       * conventional start/end pair. Skip those rather
       * than corrupting the local calendar.
       */
      if (!startAt || !endAt) {
        continue;
      }

      if (
        event.status === "cancelled"
      ) {
        const { error } =
          await supabase
            .from(
              "smart_calendar_events",
            )
            .update({
              is_deleted: true,
              sync_status: "synced",
              last_synced_at:
                new Date().toISOString(),
            })
            .eq(
              "user_id",
              userId,
            )
            .eq(
              "external_provider",
              "google",
            )
            .eq(
              "external_event_id",
              event.id,
            );

        if (error) {
          console.error(
            "Unable to mark deleted event:",
            error,
          );
        }

        deleted++;
        continue;
      }

      const payload = {
        calendar_id:
          localCalendar.id,

        user_id:
          userId,

        title:
          event.summary ||
          "Untitled event",

        description:
          event.description ??
          null,

        location:
          event.location ??
          null,

        event_type:
          mapGoogleEventType(
            event,
          ),

        subject:
          null,

        start_at:
          startAt,

        end_at:
          endAt,

        all_day:
          Boolean(
            event.start?.date &&
              !event.start?.dateTime,
          ),

        timezone:
          event.start?.timeZone ??
          calendar.timeZone ??
          "Asia/Kolkata",

        color:
          calendar.backgroundColor ??
          null,

        external_provider:
          "google",

        external_event_id:
          event.id,

        external_etag:
          event.etag ??
          null,

        sync_status:
          "synced",

        last_synced_at:
          new Date().toISOString(),

        sync_error:
          null,

        is_deleted:
          false,
      };

      const {
        data: existing,
        error: lookupError,
      } = await supabase
        .from(
          "smart_calendar_events",
        )
        .select("id")
        .eq(
          "user_id",
          userId,
        )
        .eq(
          "external_provider",
          "google",
        )
        .eq(
          "external_event_id",
          event.id,
        )
        .maybeSingle();

      if (lookupError) {
        throw lookupError;
      }

      if (existing) {
        const { error } =
          await supabase
            .from(
              "smart_calendar_events",
            )
            .update(payload)
            .eq(
              "id",
              existing.id,
            );

        if (error) {
          throw error;
        }

        updated++;
      } else {
        const { error } =
          await supabase
            .from(
              "smart_calendar_events",
            )
            .insert(payload);

        if (error) {
          throw error;
        }

        imported++;
      }
    }

    pageToken =
      result.data?.nextPageToken ??
      null;

    if (
      result.data?.nextSyncToken
    ) {
      nextSyncToken =
        result.data.nextSyncToken;
    }
  } while (pageToken);

  return {
    imported,
    updated,
    deleted,
    syncToken: nextSyncToken,
  };
}

/* ============================================================
 * MAIN SYNC
 * ============================================================ */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error:
            "Only POST is supported.",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        },
      );
    }

    const supabaseUrl =
      env("SUPABASE_URL");

    const serviceRoleKey =
      env(
        "SUPABASE_SERVICE_ROLE_KEY",
      );

    const clientId =
      env(
        "GOOGLE_CALENDAR_CLIENT_ID",
      );

    const clientSecret =
      env(
        "GOOGLE_CALENDAR_CLIENT_SECRET",
      );

    const encryptionSecret =
      env(
        "GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY",
      );

    const authHeader =
      req.headers.get(
        "Authorization",
      );

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error:
            "Authentication required.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        },
      );
    }

    /*
     * Validate the caller with the user's JWT.
     */
    const userClient =
      createClient(
        supabaseUrl,
        Deno.env.get(
          "SUPABASE_ANON_KEY",
        )!,
        {
          global: {
            headers: {
              Authorization:
                authHeader,
            },
          },
        },
      );

    const {
      data: {
        user,
      },
      error: userError,
    } =
      await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid authentication.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        },
      );
    }

    /*
     * Service-role client for secure token access.
     */
    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
      );

    const {
      data: connection,
      error: connectionError,
    } =
      await supabase
        .from(
          "google_calendar_connections",
        )
        .select("*")
        .eq(
          "user_id",
          user.id,
        )
        .maybeSingle();

    if (connectionError) {
      throw connectionError;
    }

    if (
      !connection ||
      !connection.is_connected
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Google Calendar is not connected.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        },
      );
    }

    if (
      !connection.refresh_token_encrypted
    ) {
      throw new Error(
        "No Google refresh token is available.",
      );
    }

    /*
     * Decrypt refresh token.
     */
    const refreshToken =
      await decryptSecret(
        connection.refresh_token_encrypted,
        encryptionSecret,
      );

    /*
     * Always obtain a fresh access token for the
     * sync request. This keeps the sync reliable even
     * when the stored access token has expired.
     */
    const token =
      await refreshAccessToken(
        refreshToken,
        clientId,
        clientSecret,
      );

    const accessToken =
      token.access_token;

    /*
     * Store the newly encrypted access token.
     */
    const encryptedAccessToken =
      await (async () => {
        const iv =
          crypto.getRandomValues(
            new Uint8Array(12),
          );

        const hash =
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(
              encryptionSecret,
            ),
          );

        const key =
          await crypto.subtle.importKey(
            "raw",
            hash,
            {
              name: "AES-GCM",
            },
            false,
            ["encrypt"],
          );

        const encrypted =
          await crypto.subtle.encrypt(
            {
              name: "AES-GCM",
              iv,
            },
            key,
            new TextEncoder().encode(
              accessToken,
            ),
          );

        let ivBinary = "";

        for (
          const byte of iv
        ) {
          ivBinary += String.fromCharCode(
            byte,
          );
        }

        const encryptedBytes =
          new Uint8Array(
            encrypted,
          );

        let encryptedBinary =
          "";

        for (
          const byte of encryptedBytes
        ) {
          encryptedBinary += String.fromCharCode(
            byte,
          );
        }

        return [
          btoa(ivBinary),
          btoa(encryptedBinary),
        ].join(".");
      })();

    await supabase
      .from(
        "google_calendar_connections",
      )
      .update({
        access_token_encrypted:
          encryptedAccessToken,

        token_expires_at:
          new Date(
            Date.now() +
              (token.expires_in ??
                3600) *
                1000,
          ).toISOString(),

        token_updated_at:
          new Date().toISOString(),

        connection_error:
          null,
      })
      .eq(
        "user_id",
        user.id,
      );

    /*
     * Get all Google calendars.
     */
    const calendarList =
      await googleRequest(
        accessToken,
        "/users/me/calendarList?maxResults=250",
      );

    if (!calendarList.response.ok) {
      throw new Error(
        "Unable to retrieve Google calendars.",
      );
    }

    const calendars =
      calendarList.data?.items ??
      [];

    let imported = 0;
    let updated = 0;
    let deleted = 0;

    /*
     * We store one sync token on the connection for now.
     *
     * The first version performs a full sync of each
     * Google calendar. Subsequent architecture can move
     * to per-calendar sync tokens for more granular sync.
     */
    for (
      const calendar of calendars
    ) {
      const result =
        await syncCalendar(
          supabase,
          user.id,
          accessToken,
          calendar,
          null,
        );

      imported +=
        result.imported;

      updated +=
        result.updated;

      deleted +=
        result.deleted;
    }

    await supabase
      .from(
        "google_calendar_connections",
      )
      .update({
        last_sync_at:
          new Date().toISOString(),

        connection_error:
          null,
      })
      .eq(
        "user_id",
        user.id,
      );

    await supabase
      .from(
        "smart_calendar_sync_log",
      )
      .insert({
        user_id:
          user.id,

        provider:
          "google",

        operation:
          "full_sync",

        status:
          "success",

        message:
          `Imported ${imported}, updated ${updated}, deleted ${deleted} Google Calendar event(s).`,
      });

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        updated,
        deleted,
        calendars:
          calendars.length,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      },
    );
  } catch (error) {
    console.error(
  "Google Calendar sync error:",
  error,
);

return new Response(
  JSON.stringify({
    success: false,
    error:
      error instanceof Error
        ? error.message
        : "Google Calendar sync failed.",
  }),
  {
    status: 500,
    headers: {
      ...corsHeaders,
      "Content-Type":
        "application/json",
    },
  },
);
}
});