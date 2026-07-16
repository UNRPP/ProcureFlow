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

No Git remote was added. The implementation remains uncommitted because no commit authorization or remote URL was provided; only the scaffolder's generated baseline commit exists.

## 1. Select Node 22 and install Docker

```bash
nvm install 22
nvm use
npm install
```

Then install/start Docker Desktop and continue with local Supabase.

Live database execution was intentionally deferred. Install and start Docker Desktop (or a compatible runtime) when ready, then run:

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

The checked-in `.env.local` placeholder is ignored by Git and is only sufficient for static build verification. Replace it before signing in.

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

## 3. Connect a hosted Supabase project

Create a project in the Supabase dashboard, then authenticate and link the repository:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

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

## 4. Add a Git remote and create the first commit

When the remote repository exists:

```bash
git remote add origin <repository-url>
git add .
git status
git commit -m "feat: complete ProcureFlow procurement MVP"
git push -u origin main
```

Review `git status` before committing so generated local files or credentials are not included.

## 5. Configure Vercel after a hosted backend exists

1. Import the Git repository into Vercel.
2. Add the three public variables and the two server-only cron variables for Preview and Production.
3. Add each Vercel preview/production callback URL to Supabase Auth.
4. Run `npm run check` locally and confirm the Vercel build passes.
5. Verify sign-in, sign-out, English/Thai persistence, and dark/light mode in Preview.
6. Run RLS, Storage, Playwright, workbook, and restore tests against a non-production Supabase project before promotion.

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
