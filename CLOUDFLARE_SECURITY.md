# Abuse protection — setup & Cloudflare configuration

## 1. Environment variables (secrets)

| Name | Where | Purpose |
| --- | --- | --- |
| `VITE_TURNSTILE_SITE_KEY` | frontend (public site key) | renders the Turnstile widget |
| `TURNSTILE_SECRET_KEY` | server only | Siteverify validation. **Never** in client code |
| `CRON_HOOK_SECRET` | server only | shared secret for `/api/public/hooks/*` |
| `SECURITY_IP_SALT` | server only (optional) | salt used to hash IPs in logs |

Get the Turnstile keys free at Cloudflare dashboard → Turnstile → Add site
(widget type: *Managed*). Add the domain `jeeprephub.co.in`,
`www.jeeprephub.co.in` and the Lovable preview/published hostnames.

If the keys are absent everything keeps working: Turnstile is simply skipped,
while rate limiting, server-side validation and the honeypot stay active.

## 2. Cloudflare dashboard settings (free plan)

Security → Bots:
- Bot Fight Mode: **On** (leaves verified search-engine crawlers alone).

Security → WAF → Rate limiting rules (free plan allows one rule; use it for
auth):
- `(http.request.uri.path contains "/auth") or (http.request.uri.path contains "/_serverFn")`
  → 20 requests / 10 seconds per IP → Block for 60 seconds.

Security → WAF → Custom rules:
- Managed Challenge when `http.request.uri.path contains "/materials"` and
  `cf.threat_score gt 20`.
- Block requests where `http.user_agent contains "curl"` /
  `"python-requests"` / `"scrapy"` / `"httrack"` and the path is not
  `/robots.txt` or `/sitemap.xml`.
- Do **not** block empty user agents from `cf.client.bot = true` (Googlebot,
  Bingbot must stay allowed).

Caching / Scrape Shield:
- Email address obfuscation: On.
- Hotlink protection: On.

SSL/TLS: Full (strict), Always Use HTTPS, HSTS enabled once the domain is
stable.

## 3. Cron endpoints

`/api/public/hooks/generate-scheduled-tests` and
`/api/public/hooks/sweep-guests` now require the header
`x-hook-secret: <CRON_HOOK_SECRET>`. Update the scheduled jobs to send that
header (both jobs are currently paused to save credits).

## 4. What is protected

| Action | Turnstile | Rate limit |
| --- | --- | --- |
| Sign in | yes | 20 / 10 min per IP + 8 / 10 min per email |
| Sign up | yes | 6 / hour per IP |
| Guest session | – | 6 / hour per IP |
| Contact / support form | yes | 3 / hour per user, 10 / hour per IP |
| Materials password unlock | – | 10 / 10 min per IP |
| Public cron hooks | – | 12 / hour per IP + shared secret |

## 5. Testing checklist

1. Sign in / sign up / guest still work normally (widget solves silently).
2. Attempt 10 wrong logins for the same email → “Too many requests…”.
3. Submit the contact form 4 times in an hour → 4th is rate limited.
4. Submit the contact form with the hidden `website` field filled (via
   devtools) → rejected.
5. Call a cron hook without the secret header → 401.
6. As a non-admin, `select * from server_security_events` → 0 rows.
7. Confirm no secret appears in the built client bundle:
   `rg -n "TURNSTILE_SECRET|SERVICE_ROLE" dist/ .output/`.
