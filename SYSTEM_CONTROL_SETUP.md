# JEE Prep Hub — System Control Center setup

## What's included

- `/admin/system` page with centralized API credential management.
- AES-256-GCM encryption on the server before API credentials are written to Supabase.
- Server-only `getSystemSecret()` helper for existing trusted backend functions.
- Full-admin authorization checks on listing, saving, and deleting credentials.
- Database migration with RLS enabled and no browser/client policies.
- AI Study Chat, community doubt answers, SahAI, PDF-to-CBT conversion, and admin AI question generation switched away from per-device API-key storage.
- Legacy per-device keys are removed from browser storage when the relevant page loads.
- A link to System Control Center in the existing Admin Center.

## Manual deployment steps

1. Review the changed files in GitHub. Never commit `.env`, `.env.*` real files, `.lovable/`, service-role credentials, provider keys, or the encryption key. `.env.example` is safe to commit.
2. Apply `supabase/migrations/20261011090000_admin_system_secrets.sql` to the connected Supabase project using your normal migration workflow.
3. Generate a 32-byte encryption key locally: `openssl rand -base64 32`.
4. Add the generated value as the **server-only** `SYSTEM_SETTINGS_ENCRYPTION_KEY` environment variable in the deployment provider. Do not prefix it with `VITE_`.
5. Confirm the deployment environment already contains `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key must remain server-only.
6. Deploy and sign in with a full admin account. Open `/admin/system`.
7. Save a Gemini credential with provider `Google Gemini` and label `Primary key` to enable the Gemini-backed features. AI Study Chat can use its supported provider selection; the provider and label must match a saved integration.
8. Test a second signed-in device: it should see masked integration metadata and use the same server-side credential without entering it again.

## Important security notes

- The API secret is write-only in the UI; existing plaintext is never returned to the browser.
- Changing `SYSTEM_SETTINGS_ENCRYPTION_KEY` without decrypting/re-encrypting existing rows will make existing credentials unreadable. Back it up securely and rotate keys with a planned migration.
- The System Control Center only exposes metadata and deletion, not a raw SQL console.
- User deletion and broader database operations remain in existing admin workflows; this page does not pretend to implement destructive controls that have not been connected.
- The repository dependencies could not be installed in the build environment during preparation, so a full production build/test run has not been verified here. Run `npm install` and `npm run build` in your normal environment before deploying.
