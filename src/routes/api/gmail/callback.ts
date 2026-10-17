import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";
import { encryptGmailToken } from "@/lib/gmail-crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL =
  "https://openidconnect.googleapis.com/v1/userinfo";

function getSupabaseAdmin() {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server configuration is missing");
  }

  return createClient(url, serviceRoleKey);
}

function redirectToEmailCenter(
  request: Request,
  params: Record<string, string>
) {
  const url = new URL("/admin/email", request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return Response.redirect(url.toString(), 303);
}

export const Route = createFileRoute("/api/gmail/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);

        const code = requestUrl.searchParams.get("code");
        const state = requestUrl.searchParams.get("state");
        const oauthError = requestUrl.searchParams.get("error");

        if (oauthError) {
          return redirectToEmailCenter(request, {
            gmail: "error",
            reason: "google_denied",
          });
        }

        if (!code || !state) {
          return redirectToEmailCenter(request, {
            gmail: "error",
            reason: "missing_parameters",
          });
        }

        try {
          const supabase = getSupabaseAdmin();

          const stateHash = crypto
            .createHash("sha256")
            .update(state)
            .digest("hex");

          const { data: oauthState, error: stateError } =
            await supabase
              .from("gmail_oauth_states")
              .select("id, user_id, expires_at")
              .eq("state_hash", stateHash)
              .maybeSingle();

          if (stateError || !oauthState) {
            return redirectToEmailCenter(request, {
              gmail: "error",
              reason: "invalid_state",
            });
          }

          if (
            new Date(oauthState.expires_at).getTime() <= Date.now()
          ) {
            await supabase
              .from("gmail_oauth_states")
              .delete()
              .eq("id", oauthState.id);

            return redirectToEmailCenter(request, {
              gmail: "error",
              reason: "expired_state",
            });
          }

          // OAuth states are single-use.
          await supabase
            .from("gmail_oauth_states")
            .delete()
            .eq("id", oauthState.id);

          const clientId = process.env["GOOGLE_CLIENT_ID"];
          const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
          const redirectUri =
            process.env["GMAIL_REDIRECT_URI"] ||
            "https://jeeprephub.co.in/api/gmail/callback";

          if (!clientId || !clientSecret) {
            console.error(
              "Google OAuth credentials are not configured"
            );

            return redirectToEmailCenter(request, {
              gmail: "error",
              reason: "server_configuration",
            });
          }

          const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              grant_type: "authorization_code",
            }),
          });

          const tokenData = await tokenResponse.json();

          if (
            !tokenResponse.ok ||
            typeof tokenData.refresh_token !== "string"
          ) {
            console.error("Google token exchange failed", {
              status: tokenResponse.status,
              error: tokenData?.error,
              description: tokenData?.error_description,
            });

            return redirectToEmailCenter(request, {
              gmail: "error",
              reason: "token_exchange_failed",
            });
          }

          const accessToken = tokenData.access_token as string;
          const refreshToken = tokenData.refresh_token as string;

          if (!accessToken || !refreshToken) {
            return redirectToEmailCenter(request, {
              gmail: "error",
              reason: "missing_token",
            });
          }

          const userInfoResponse = await fetch(
            GOOGLE_USERINFO_URL,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const userInfo = await userInfoResponse.json();

          if (
            !userInfoResponse.ok ||
            typeof userInfo.email !== "string"
          ) {
            console.error(
              "Failed to retrieve Google account information",
              {
                status: userInfoResponse.status,
              }
            );

            return redirectToEmailCenter(request, {
              gmail: "error",
              reason: "userinfo_failed",
            });
          }

          const encryptedRefreshToken =
            encryptGmailToken(refreshToken);

          const { error: connectionError } = await supabase
            .from("gmail_connections")
            .upsert(
              {
                user_id: oauthState.user_id,
                gmail_email: userInfo.email,
                refresh_token_ciphertext: encryptedRefreshToken,
                scopes: [
                  "https://www.googleapis.com/auth/gmail.send",
                  "openid",
                  "email",
                ],
                connected_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "user_id",
              }
            );

          if (connectionError) {
            console.error(
              "Failed to save Gmail connection",
              connectionError
            );

            return redirectToEmailCenter(request, {
              gmail: "error",
              reason: "database_save_failed",
            });
          }

          return redirectToEmailCenter(request, {
            gmail: "connected",
            email: userInfo.email,
          });
        } catch (error) {
          console.error("Gmail OAuth callback error", error);

          return redirectToEmailCenter(request, {
            gmail: "error",
            reason: "unexpected_error",
          });
        }
      },
    },
  },
});