import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_AUTH_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(
      `${name} environment variable is not configured.`,
    );
  }

  return value;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

async function createSignedState(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const encodedPayload =
    bytesToBase64(
      new TextEncoder().encode(
        JSON.stringify(payload),
      ),
    );

  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(
        encodedPayload,
      ),
    );

  return [
    encodedPayload,
    bytesToBase64(
      new Uint8Array(signature),
    ),
  ].join(".");
}

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse(
        {
          error:
            "Only POST requests are supported.",
        },
        405,
      );
    }

    const supabaseUrl =
      getRequiredEnv("SUPABASE_URL");

    const supabaseAnonKey =
      getRequiredEnv(
        "SUPABASE_ANON_KEY",
      );

    const googleClientId =
      getRequiredEnv(
        "GOOGLE_CALENDAR_CLIENT_ID",
      );

    const stateSecret =
      getRequiredEnv(
        "GOOGLE_CALENDAR_STATE_SECRET",
      );

    const authHeader =
      req.headers.get(
        "Authorization",
      );

    if (!authHeader) {
      return jsonResponse(
        {
          error:
            "Missing authorization.",
        },
        401,
      );
    }

    const supabase =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
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
      await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        {
          error:
            "You must be signed in.",
        },
        401,
      );
    }

    const redirectUri =
      `${supabaseUrl}/functions/v1/google-calendar-callback`;

    /*
     * Signed state prevents tampering with the
     * authenticated user ID during OAuth.
     */
    const state =
      await createSignedState(
        {
          userId: user.id,
          createdAt: Date.now(),
        },
        stateSecret,
      );

    const params =
      new URLSearchParams({
        client_id:
          googleClientId,

        redirect_uri:
          redirectUri,

        response_type:
          "code",

        access_type:
          "offline",

        prompt:
          "consent",

        scope:
          GOOGLE_SCOPES,

        state,
      });

    const authorizationUrl =
      `${GOOGLE_AUTH_URL}?${params.toString()}`;

    return jsonResponse({
      authorizationUrl,

      scopes:
        GOOGLE_SCOPES
          .split(" ")
          .filter(Boolean),
    });
  } catch (error) {
    console.error(
      "Google Calendar auth error:",
      error,
    );

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start Google Calendar authorization.",
      },
      500,
    );
  }
});