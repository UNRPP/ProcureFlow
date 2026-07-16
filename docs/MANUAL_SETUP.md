# Manual setup and remaining work

This document separates completed repository setup from actions that require your machine, cloud account, or production decisions.

Install Node 22 or newer, then run `nvm use` in this repository. `.nvmrc` and `package.json` enforce that supported runtime because current Supabase JavaScript libraries require Node 22.

## Completed in the repository

- Git repository initialized on branch `main`; the Next.js scaffolder created baseline commit `c0ac71a`.
- Existing Git author configuration detected.
- `.gitignore` and `.gitattributes` configured for Next.js, environment files, Supabase local state, and binary artifacts.
- Supabase CLI installed locally in `devDependencies` and initialized at `supabase/config.toml`.
- Phase 0 through Phase 5 migrations, local and production-safe seed data, and database behavior tests added.
- `.env.example` added without privileged credentials.
- Git remote `origin` connected to `https://github.com/UNRPP/ProcureFlow.git`.
- Hosted Supabase project `ProcureFlow` (`rsnjvjfufftzduhwnihr`) linked at the repository root with the `procureflow` CLI profile.
- All seven migrations and the production-safe baseline seed applied on 16 July 2026.
- Local `.env.local` configured with the hosted browser-safe URL and publishable key; the file remains ignored by Git.
- Remote checks confirmed 4 roles, 3 work categories, 6 document types, RLS on every public business table, and no anonymously executable `SECURITY DEFINER` functions.
- Node.js 22.23.1 installed through nvm; lint, typecheck, 122 tests, and the production build pass on Node 22.
- Vercel project `poositrue-2373s-projects/procureflow` linked to GitHub with all five environment variables configured for Development, Preview, and Production.
- First Vercel deployment available at `https://procureflow-ivory.vercel.app`.
- Supabase Auth Site URL and redirect allow-list configured for the Vercel deployment, Vercel previews, and localhost; public sign-up is disabled.
- The linked Supabase project is designated as production. No demo users or fake case seed was applied; one confirmed, active first administrator was bootstrapped with exactly the `super_admin` role.

The new function-permission hardening migration and its tests remain uncommitted and unpushed pending an intentional Git review.

## 1. Select Node 22

```bash
nvm install 22
nvm use
npm install
```

Docker is optional and is not needed to use the linked hosted Supabase project. Install/start Docker Desktop only if you want the isolated local database workflow below.

For optional local acceptance, install and start Docker Desktop (or a compatible runtime), then run:

```bash
npm run supabase:start
npm run supabase:status
```

Copy the reported local API URL and anonymous/publishable key into `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<value reported by supabase status>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Apply migrations and seed data, then execute the RLS tests:

```bash
npm run db:reset
npm run db:lint
npm run test:db
```

`db:reset` loads nine procurement cases with category details in addition to
the demo users, workflows, collaboration history, reminders, and master data.

The hosted browser-safe values are now present in the ignored `.env.local`. Never commit this file.

## 2. Test accounts and seed data

Local seed password for every demo account: `ProcureFlow123!`

| Role                | Email                       | Preferred locale |
| ------------------- | --------------------------- | ---------------- |
| Super administrator | `admin@procureflow.local`   | English          |
| Procurement manager | `manager@procureflow.local` | Thai             |
| Procurement officer | `officer@procureflow.local` | English          |
| Viewer / auditor    | `auditor@procureflow.local` | Thai             |

The seed also creates:

- 3 work categories
- 6 departments
- 5 budget categories
- 4 budget sources
- 4 procurement types
- Fiscal years 2026 and 2027
- 9 procurement cases across all three work categories and all case statuses
- 4 published workflow templates with 7 stages each
- Seeded case workflow, stage, transition, assignment, and responsibility history
- 6 document types, required-document snapshots, comments, preferences, and reminder fixtures
- Dashboard/report functions and test fixtures for interval-based personnel KPI and grouped work-status reconciliation

Do not run `supabase/seed.sql` against production. Create real users through a controlled administrator process and keep public sign-up disabled unless the security model is deliberately changed.

## 3. Hosted Supabase next actions

The repository is already connected. When using the named account explicitly, run:

```bash
npx supabase projects list --profile procureflow
npx supabase migration list --profile procureflow
```

Supabase CLI 2.109.0 has a named-profile bug for some `db` subcommands. The project link is valid; upgrade the CLI after 2.109.1 or later is adopted, rather than logging out of the other Supabase account.

Before production use:

1. Confirm the remote Postgres major version matches `supabase/config.toml`.
2. Set the Auth site URL and allowed redirect URLs for the deployed Vercel domain.
3. Keep public sign-up disabled unless explicitly approved.
4. Apply migrations through the CLI; do not make production-only table or policy changes in the dashboard.
5. Create real users and role memberships without the demo seed.
6. Run behavioral RLS tests against a safe test environment.
7. Review password, MFA, SMTP, session-duration, and account-recovery policies with hospital IT/security.

The interactive application needs the three browser-safe values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or add it to a `NEXT_PUBLIC_` variable.

The scheduled notification route additionally requires server-only
`SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` values. See `ENVIRONMENT.md`.

## 4. Review and publish the connected Git repository

The remote exists and is currently empty. Review and publish when ready:

```bash
git add .
git status
git commit -m "fix(db): restrict hosted function execution"
git push -u origin main
```

Review `git status` before committing so generated local files or credentials are not included.

## 5. Validate the connected Vercel deployment

The project, GitHub connection, encrypted environment variables, hosted build, and Supabase Auth redirects are configured.

1. Sign in with the bootstrapped administrator and verify sign-out, English/Thai persistence, and dark/light mode.
2. Create approved production master data and additional named users through the controlled administrator process.
3. Configure a custom domain if required, then update both Vercel `NEXT_PUBLIC_SITE_URL` and Supabase Auth URLs.
4. Configure the Vercel cron schedule for `/api/cron/notifications` after the desired reminder frequency is approved.
5. Run RLS, Storage, Playwright, workbook, and restore tests against a non-production Supabase project before wider use.

## 6. Product decisions still required

- Hospital identity-provider and MFA requirements.
- Who can provision users and assign roles.
- Thai master-data wording review by procurement staff.
- Fiscal-year convention confirmation for the hospital.
- Data retention, audit retention, and privacy requirements.
- Local Phase 0 through Phase 5 migration, RLS, Storage, workflow, reporting, and browser acceptance after Docker is available.
- Uploaded-document malware scanning/content inspection provider.
- Backup retention, recovery objectives, monitoring owner, and production change window.

The complete remaining sequence is maintained in `DEFERRED_DATABASE_ACCEPTANCE.md`.
