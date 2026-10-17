import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { decryptGmailToken } from "@/lib/gmail-crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

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

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function escapeHeader(value: string): string {
  return value.replace(/[\r\n]/g, "");
}

export const Route = createFileRoute("/api/gmail/send")({
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

          const body = await request.json();

          const to =
            typeof body?.to === "string" ? body.to.trim() : "";
          const subject =
            typeof body?.subject === "string"
              ? body.subject.trim()
              : "";
          const message =
            typeof body?.body === "string" ? body.body : "";

          if (!to || !subject || !message) {
            return Response.json(
              {
                success: false,
                error: "Recipient, subject and message are required",
              },
              { status: 400 }
            );
          }

          if (to.length > 320) {
            return Response.json(
              { success: false, error: "Invalid recipient" },
              { status: 400 }
            );
          }

          if (subject.length > 200) {
            return Response.json(
              { success: false, error: "Subject is too long" },
              { status: 400 }
            );
          }

          if (message.length > 20000) {
            return Response.json(
              { success: false, error: "Message is too long" },
              { status: 400 }
            );
          }

          const { data: connection, error: connectionError } =
            await supabase
              .from("gmail_connections")
              .select(
                "gmail_email, refresh_token_ciphertext"
              )
              .eq("user_id", user.id)
              .maybeSingle();

          if (connectionError || !connection) {
            return Response.json(
              {
                success: false,
                error:
                  "No Gmail account is connected to this admin account",
              },
              { status: 400 }
            );
          }

          const clientId = process.env["GOOGLE_CLIENT_ID"];
          const clientSecret =
            process.env["GOOGLE_CLIENT_SECRET"];

          if (!clientId || !clientSecret) {
            console.error(
              "Google OAuth credentials are missing"
            );

            return Response.json(
              {
                success: false,
                error: "Google OAuth is not configured",
              },
              { status: 500 }
            );
          }

          const refreshToken = decryptGmailToken(
            connection.refresh_token_ciphertext
          );

          const tokenResponse = await fetch(
            GOOGLE_TOKEN_URL,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
              }),
            }
          );

          const tokenData = await tokenResponse.json();

          if (
            !tokenResponse.ok ||
            typeof tokenData.access_token !== "string"
          ) {
            console.error(
              "Failed to refresh Gmail access token",
              {
                status: tokenResponse.status,
                error: tokenData?.error,
              }
            );

            return Response.json(
              {
                success: false,
                error:
                  "Gmail authorization expired. Please reconnect Gmail.",
              },
              { status: 401 }
            );
          }

          const accessToken = tokenData.access_token as string;

          const cleanTo = escapeHeader(to);
          const cleanFrom = escapeHeader(
            connection.gmail_email
          );
          const cleanSubject = escapeHeader(subject);

          const mimeMessage = [
            `From: ${cleanFrom}`,
            `To: ${cleanTo}`,
            `Subject: ${cleanSubject}`,
            "MIME-Version: 1.0",
            "Content-Type: text/plain; charset=UTF-8",
            "Content-Transfer-Encoding: 8bit",
            "",
            message,
          ].join("\r\n");

          const encodedMessage =
            encodeBase64Url(mimeMessage);

          const sendResponse = await fetch(
            GMAIL_SEND_URL,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                raw: encodedMessage,
              }),
            }
          );

          const sendData = await sendResponse.json();

          if (!sendResponse.ok) {
            console.error(
              "Gmail send failed",
              {
                status: sendResponse.status,
                error: sendData?.error,
              }
            );

            return Response.json(
              {
                success: false,
                error:
                  sendData?.error?.message ||
                  "Gmail failed to send the message",
              },
              { status: sendResponse.status }
            );
          }

          return Response.json({
            success: true,
            messageId: sendData.id ?? null,
            threadId: sendData.threadId ?? null,
            from: connection.gmail_email,
            to: cleanTo,
          });
        } catch (error) {
          console.error("Gmail send error", error);

          return Response.json(
            {
              success: false,
              error: "Unable to send Gmail message",
            },
            { status: 500 }
          );
        }
      },
    },
  },
});