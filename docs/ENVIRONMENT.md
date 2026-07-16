# Environment variables

Copy `.env.example` to `.env.local` for local development. Never commit `.env.local` or copy server secrets into variables prefixed with `NEXT_PUBLIC_`.

| Variable                        | Scope              | Required  | Purpose                                                                                                                                                                                         |
| ------------------------------- | ------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Browser and server | Yes       | Local or hosted Supabase API URL. The build also uses its origin in the Content Security Policy.                                                                                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server | Yes       | Browser-safe anonymous/publishable key; authorization still depends on Auth and RLS.                                                                                                            |
| `NEXT_PUBLIC_SITE_URL`          | Browser and server | Yes       | Canonical application origin, such as `https://procure.example.org`.                                                                                                                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only        | Cron only | Privileged key used solely by the scheduled reminder route. Prefer a modern `sb_secret_…` key; the variable retains its existing name for compatibility. Never expose it to a Client Component. |
| `CRON_SECRET`                   | Server only        | Cron only | Shared bearer secret for `/api/cron/notifications`. Use at least 32 random bytes.                                                                                                               |

Generate a cron secret locally with `openssl rand -base64 32`. Store production and preview values in the hosting provider's encrypted environment settings. Rotate `CRON_SECRET` and the Supabase secret key immediately after suspected disclosure.

The Content Security Policy is generated at build time from `NEXT_PUBLIC_SUPABASE_URL`; changing Supabase projects therefore requires a new deployment. Preview deployments should use a non-production Supabase project and distinct server secrets.

The browser acceptance suite additionally uses:

| Variable             | Purpose                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `E2E_BASE_URL`       | Enables Playwright and identifies the deployed/local application under test.                           |
| `E2E_ADMIN_EMAIL`    | Acceptance administrator account; defaults to the local seeded administrator.                          |
| `E2E_ADMIN_PASSWORD` | Acceptance account password; defaults to the local seed only. Store as a CI secret for hosted testing. |

Do not place patient identifiers, clinical content, document names, or case notes in environment variables.
