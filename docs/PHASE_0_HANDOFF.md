# Phase 0 handoff

## Completed features

- Next.js App Router project with strict TypeScript, Tailwind CSS, shadcn/ui, ESLint, Prettier, and validated public environment variables.
- Supabase browser, server, and request-proxy clients using only the anonymous/publishable key.
- Email/password sign-in, sign-out, server-verified sessions, protected routes, profile loading, inactive-account handling, and translated authentication errors.
- Responsive deep-blue application shell modeled on the approved dashboard reference.
- Light/dark/system themes covering page, navigation, cards, forms, borders, tables, statuses, and overlays.
- English/Thai dictionaries, cookie fallback, profile persistence, language switcher, and locale-aware date/number/currency utilities.
- Live master-data counts on the dashboard and bilingual read-only master-data preview in Settings.
- Loading, empty, unavailable, and error states without fake case metrics.

## Migration

`supabase/migrations/20260714170000_phase0_foundation.sql` creates:

- `profiles`
- `roles`
- `user_roles`
- `departments`
- `work_categories`
- `budget_categories`
- `budget_sources`
- `procurement_types`
- `fiscal_years`

It also creates updated-at triggers, the Auth-to-profile trigger, role helper functions, supporting indexes, constraints, grants, and policies.

## Routes

- Public: `/`, `/sign-in`, `/account-inactive`, `/auth/callback`
- Protected: `/dashboard`, `/my-work`, `/cases`, `/calendar`, `/reports`, `/settings`

Only Dashboard and Settings expose Phase 0 data. The other protected routes intentionally show translated phase-aware empty states.

## Main components

- Application shell, desktop sidebar, mobile drawer, top header, user menu, language switcher, and theme switcher.
- Sign-in form with Zod server validation and safe post-auth redirect handling.
- Master-data stats and bilingual Settings list.
- Shared page headers, empty states, alerts, skeletons, and shadcn/ui primitives.

## RLS and security policies

- RLS enabled on every Phase 0 public table.
- Anonymous users receive no table privileges.
- Active authenticated users can read master data.
- Normal users can read their own profile and role membership.
- Managers and auditors can read profiles and memberships for oversight.
- Only super administrators can mutate master data and role memberships.
- A database trigger prevents normal users from changing profile accountability/security fields.
- Protected pages use both request-level session refresh/redirects and server-side user verification.
- No service-role key is referenced by application code.

## Tests

- Locale dictionary key parity and non-empty translations.
- English/Thai date, number, and currency formatting.
- Sign-in validation and open-redirect protection.
- Static verification that every Phase 0 table enables RLS and declares policies.
- pgTAP-compatible behavioral tests for anonymous, officer, and administrator access.

Run application checks with `npm run check`. Run database behavior tests with `npm run test:db` after local Supabase is running.

## Known limitations

- Docker was unavailable during implementation, so the migration, seed, and behavioral RLS suite could not be executed against a live local Postgres instance. Static migration tests are included and the live commands are documented.
- The local `.env.local` contains a non-secret placeholder key until `supabase status` can provide the real local anonymous/publishable key.
- Master-data editing, case forms, case tables, exports, and archive/reactivate actions belong to Phase 1.
- Workflow, historical responsibility, dashboard case metrics, reports, documents, and notifications are later phases.
- Production user provisioning, MFA, SMTP, retention policy, and remote Supabase/Vercel configuration require hospital decisions and account access.

## Recommended next action

Install/start Docker, run `npm run db:reset`, `npm run db:lint`, and `npm run test:db`, then manually verify all four seeded roles in both languages. Once Phase 0 acceptance is confirmed, authorize Phase 1 from `PHASES.md`.
