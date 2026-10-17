import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

const GMAIL_SEND_SCOPE =
  "https://www.googleapis.com/auth/gmail.send";

const GOOGLE_AUTH_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

function getSupabaseAdmin() {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server configuration is missing");
  }

  return createClient(url, serviceRoleKey);
}

async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();

  if (!accessToken) {
    return null;
  }

  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return user;
}

export const Route = createFileRoute("/api/gmail/connect")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await getAuthenticatedUser(request);

          if (!user) {
            return Response.json(
              { success: false, error: "Unauthorized" },
              { status: 401 }
            );
          }

          const supabase = getSupabaseAdmin();

          const { data: role } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (!role) {
            return Response.json(
              { success: false, error: "Admin access required" },
              { status: 403 }
            );
          }

          const clientId = process.env["GOOGLE_CLIENT_ID"];
          const redirectUri =
            process.env["GMAIL_REDIRECT_URI"] ||
            "https://jeeprephub.co.in/api/gmail/callback";

          if (!clientId) {
            console.error("GOOGLE_CLIENT_ID is not configured");

            return Response.json(
              { success: false, error: "Google OAuth is not configured" },
              { status: 500 }
            );
          }

          await supabase.rpc("cleanup_expired_gmail_oauth_states");

          const state = crypto.randomBytes(32).toString("hex");

          const stateHash = crypto
            .createHash("sha256")
            .update(state)
            .digest("hex");

          const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
          ).toISOString();

          const { error: insertError } = await supabase
            .from("gmail_oauth_states")
            .insert({
              state_hash: stateHash,
              user_id: user.id,
              expires_at: expiresAt,
            });

          if (insertError) {
            console.error(
              "Failed to create Gmail OAuth state",
              insertError
            );

            return Response.json(
              { success: false, error: "Could not start Gmail connection" },
              { status: 500 }
            );
          }

          const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "code",
            scope: [
              GMAIL_SEND_SCOPE,
              "openid",
              "email",
            ].join(" "),
            access_type: "offline",
            prompt: "consent",
            include_granted_scopes: "true",
            state,
          });

          return Response.json({
            success: true,
            authorization_url: `${GOOGLE_AUTH_URL}?${params.toString()}`,
          });
        } catch (error) {
          console.error("Gmail connect error", error);

          return Response.json(
            {
              success: false,
              error: "Unable to start Gmail connection",
            },
            { status: 500 }
          );
        }
      },
    },
  },
});