import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_TOKEN_URL =
  "https://oauth2.googleapis.com/token";

const GOOGLE_USERINFO_URL =
  "https://www.googleapis.com/oauth2/v2/userinfo";

const GOOGLE_CALENDAR_LIST_URL =
  "https://www.googleapis.com/calendar/v3/users/me/calendarList";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function env(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(
      `${name} environment variable is not configured.`,
    );
  }

  return value;
}

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

async function verifySignedState(
  state: string,
  secret: string,
) {
  const parts = state.split(".");

  if (parts.length !== 2) {
    throw new Error("Invalid OAuth state.");
  }

  const [
    encodedPayload,
    encodedSignature,
  ] = parts;

  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["verify"],
    );

  const valid =
    await crypto.subtle.verify(
      "HMAC",
      key,
      base64ToBuffer(
        encodedSignature,
      ),
      new TextEncoder().encode(
        encodedPayload,
      ),
    );

  if (!valid) {
    throw new Error(
      "OAuth state verification failed.",
    );
  }

  const payload = JSON.parse(
    new TextDecoder().decode(
      base64ToBuffer(
        encodedPayload,
      ),
    ),
  );

  if (
    !payload.userId ||
    !payload.createdAt
  ) {
    throw new Error(
      "OAuth state payload is invalid.",
    );
  }

  const age =
    Date.now() -
    Number(payload.createdAt);

  if (
    age < 0 ||
    age > 10 * 60 * 1000
  ) {
    throw new Error(
      "OAuth authorization expired.",
    );
  }

  return payload as {
    userId: string;
    createdAt: number;
  };
}

function htmlResponse(
  title: string,
  message: string,
  success = true,
) {
  const safeTitle = title
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const safeMessage = message
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return new Response(
    `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport"
content="width=device-width,initial-scale=1">
<title>${safeTitle}</title>
<style>
body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #09090b;
  color: #fafafa;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    sans-serif;
}
.card {
  width: min(420px, calc(100% - 32px));
  padding: 32px;
  border: 1px solid #27272a;
  border-radius: 24px;
  background: #18181b;
  text-align: center;
}
.icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 20px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${
    success ? "#16a34a" : "#dc2626"
  };
  font-size: 28px;
}
h1 {
  margin: 0 0 12px;
  font-size: 24px;
}
p {
  margin: 0;
  color: #a1a1aa;
  line-height: 1.6;
}
</style>
</head>
<body>
<main class="card">
<div class="icon">
${success ? "✓" : "!"}
</div>
<h1>${safeTitle}</h1>
<p>${safeMessage}</p>
</main>
<script>
setTimeout(() => {
  if (window.opener) {
    window.opener.postMessage(
      {
        type: "google-calendar-oauth",
        success: ${success}
      },
      "*"
    );
    window.close();
  }
}, 1200);
</script>
</body>
</html>`,
    {
      status: success ? 200 : 400,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "text/html; charset=utf-8",
      },
    },
  );
}

async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
) {
  const body =
    new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type:
        "authorization_code",
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
      "Google token exchange failed:",
      data,
    );

    throw new Error(
      "Google authorization failed.",
    );
  }

  return data;
}

async function googleGet(
  url: string,
  accessToken: string,
) {
  const response =
    await fetch(url, {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    });

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      `Google API request failed: ${response.status}`,
    );
  }

  return data;
}

async function deriveKey(
  secret: string,
) {
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
    ["encrypt"],
  );
}

function bytesToBase64(
  bytes: Uint8Array,
): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

async function encryptSecret(
  value: string,
  secret: string,
): Promise<string> {
  const key =
    await deriveKey(secret);

  const iv =
    crypto.getRandomValues(
      new Uint8Array(12),
    );

  const encrypted =
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      new TextEncoder().encode(value),
    );

  return [
    bytesToBase64(iv),
    bytesToBase64(
      new Uint8Array(encrypted),
    ),
  ].join(".");
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders,
      });
    }

    if (req.method !== "GET") {
      return htmlResponse(
        "Google Calendar",
        "Invalid callback request.",
        false,
      );
    }

    const url =
      new URL(req.url);

    const code =
      url.searchParams.get("code");

    const state =
      url.searchParams.get("state");

    const oauthError =
      url.searchParams.get("error");

    if (oauthError) {
      return htmlResponse(
        "Google Calendar not connected",
        "Google authorization was cancelled or denied.",
        false,
      );
    }

    if (!code || !state) {
      return htmlResponse(
        "Connection failed",
        "The Google authorization response was incomplete.",
        false,
      );
    }

    /* --------------------------------------------------------
     * VERIFY SIGNED STATE
     * -------------------------------------------------------- */

    const stateSecret =
      env(
        "GOOGLE_CALENDAR_STATE_SECRET",
      );

    const stateData =
      await verifySignedState(
        state,
        stateSecret,
      );

    /* --------------------------------------------------------
     * ENVIRONMENT
     * -------------------------------------------------------- */

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

    const redirectUri =
      `${supabaseUrl}/functions/v1/google-calendar-callback`;

    /* --------------------------------------------------------
     * GOOGLE TOKEN EXCHANGE
     * -------------------------------------------------------- */

    const tokens =
      await exchangeCode(
        code,
        clientId,
        clientSecret,
        redirectUri,
      );

    if (!tokens.access_token) {
      throw new Error(
        "Google did not return an access token.",
      );
    }

    if (!tokens.refresh_token) {
      return htmlResponse(
        "Connection incomplete",
        "Google did not return a refresh token. Please reconnect Google Calendar.",
        false,
      );
    }

    /* --------------------------------------------------------
     * GOOGLE ACCOUNT
     * -------------------------------------------------------- */

    const googleUser =
      await googleGet(
        GOOGLE_USERINFO_URL,
        tokens.access_token,
      );

    const calendarList =
      await googleGet(
        GOOGLE_CALENDAR_LIST_URL,
        tokens.access_token,
      );

    /* --------------------------------------------------------
     * ENCRYPT TOKENS
     * -------------------------------------------------------- */

    const encryptedAccessToken =
      await encryptSecret(
        tokens.access_token,
        encryptionSecret,
      );

    const encryptedRefreshToken =
      await encryptSecret(
        tokens.refresh_token,
        encryptionSecret,
      );

    const expiresAt =
      new Date(
        Date.now() +
          (tokens.expires_in ??
            3600) *
            1000,
      ).toISOString();

    /* --------------------------------------------------------
     * DATABASE
     * -------------------------------------------------------- */

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
      );

    const {
      error: connectionError,
    } =
      await supabase
        .from(
          "google_calendar_connections",
        )
        .upsert(
          {
            user_id:
              stateData.userId,

            google_account_email:
              googleUser.email ??
              null,

            google_user_id:
              googleUser.id ??
              null,

            is_connected:
              true,

            last_sync_at:
              new Date().toISOString(),

            connection_error:
              null,

            access_token_encrypted:
              encryptedAccessToken,

            refresh_token_encrypted:
              encryptedRefreshToken,

            token_expires_at:
              expiresAt,

            token_scopes:
              tokens.scope ?? null,

            token_updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "user_id",
          },
        );

    if (connectionError) {
      throw connectionError;
    }

    /* --------------------------------------------------------
     * IMPORT GOOGLE CALENDARS
     * -------------------------------------------------------- */

    const calendars =
      calendarList.items ??
      [];

    for (
      const calendar
      of calendars
    ) {
      if (!calendar.id) {
        continue;
      }

      await supabase
        .from(
          "smart_calendars",
        )
        .upsert(
          {
            user_id:
              stateData.userId,

            name:
              calendar.summary ??
              "Google Calendar",

            description:
              calendar.description ??
              null,

            color:
              calendar.backgroundColor ??
              "#4285F4",

            calendar_type:
              "google",

            is_visible:
              calendar.selected !==
              false,

            is_default:
              false,

            external_provider:
              "google",

            external_calendar_id:
              calendar.id,
          },
          {
            onConflict:
              "user_id,external_provider,external_calendar_id",
          },
        );
    }

    /* --------------------------------------------------------
     * LOG
     * -------------------------------------------------------- */

    await supabase
      .from(
        "smart_calendar_sync_log",
      )
      .insert({
        user_id:
          stateData.userId,

        provider:
          "google",

        operation:
          "full_sync",

        status:
          "success",

        message:
          `Google Calendar connected. Found ${calendars.length} calendar(s).`,
      });

    return htmlResponse(
      "Google Calendar connected",
      "Your Google Calendar has been securely connected to JEE Prep Hub.",
      true,
    );
  } catch (error) {
    console.error(
      "Google Calendar callback error:",
      error,
    );

    return htmlResponse(
      "Google Calendar connection failed",
      error instanceof Error
        ? error.message
        : "Something went wrong while connecting Google Calendar.",
      false,
    );
  }
});