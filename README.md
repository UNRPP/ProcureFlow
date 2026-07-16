# ProcureFlow

ProcureFlow is a bilingual hospital procurement work-management platform built as a modular monolith with Next.js and Supabase.

Phases 0 through 5 provide authenticated case management, immutable workflow
snapshots and responsibility history, private versioned documents, comments and
notifications, a live bilingual management dashboard, interval-based personnel
KPI reports, reconciled Excel exports, accessibility and security hardening,
operations/CI runbooks, RLS migrations, and local demo seed data.

## Stack

- Next.js App Router and strict TypeScript
- Tailwind CSS and shadcn/ui
- Supabase Auth, Postgres, Storage, and Row Level Security
- React Hook Form and Zod
- TanStack Table, Recharts, date-fns, and Lucide
- Vitest and pgTAP-compatible Supabase database tests

## Requirements

- Node.js 22 or newer
- npm
- Docker Desktop or another Docker-compatible runtime for local Supabase

The Supabase CLI is installed as a development dependency, so project commands do not depend on a global CLI installation.

## Local development

```bash
npm install
cp .env.example .env.local
npm run supabase:start
npm run db:reset
npm run dev
```

After `supabase:start`, copy the API URL and anonymous/publishable key reported by `npm run supabase:status` into `.env.local`.

Open [http://localhost:3000](http://localhost:3000). The seeded officer account is:

- Email: `officer@procureflow.local`
- Password: `ProcureFlow123!`

Additional role accounts and all seed records are documented in [docs/MANUAL_SETUP.md](docs/MANUAL_SETUP.md).

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:db
npm run test:e2e
```

`test:db` requires the local Supabase stack. The unit suite also statically
checks migrations, RLS declarations, workflow invariants, report metrics, and
workbook structure; behavioral RLS assertions live under
`supabase/tests/database`. Playwright is environment-gated until a seeded local
or staging database is connected; see the deferred acceptance guide.

## Repository guides

- [AGENTS.md](AGENTS.md) — permanent engineering and security rules
- [PHASES.md](PHASES.md) — phase boundaries and acceptance criteria
- [docs/MANUAL_SETUP.md](docs/MANUAL_SETUP.md) — manual Git, Supabase, and Vercel work
- [docs/PHASE_0_HANDOFF.md](docs/PHASE_0_HANDOFF.md) — completed scope, security, tests, and limitations
- [docs/PHASE_1_HANDOFF.md](docs/PHASE_1_HANDOFF.md) — core case scope, exports, RLS, tests, and limitations
- [docs/PHASE_2_HANDOFF.md](docs/PHASE_2_HANDOFF.md) — workflow snapshots, transitions, responsibility history, and deferred database checks
- [docs/PHASE_3_HANDOFF.md](docs/PHASE_3_HANDOFF.md) — live dashboard, workload, aging, reports, Excel reconciliation, and deferred database checks
- [docs/PHASE_4_HANDOFF.md](docs/PHASE_4_HANDOFF.md) — documents, comments, notifications, renewals, Storage policies, and deferred database checks
- [docs/PHASE_5_HANDOFF.md](docs/PHASE_5_HANDOFF.md) — security, accessibility, CI, operations, deployment, and deferred acceptance
- [docs/DEFERRED_DATABASE_ACCEPTANCE.md](docs/DEFERRED_DATABASE_ACCEPTANCE.md) — exact remaining database and hosted acceptance work
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — production Supabase/Vercel release guide
- [docs/ROLE_PERMISSION_MATRIX.md](docs/ROLE_PERMISSION_MATRIX.md) — application and RLS authorization model
- [docs/UAT_CHECKLIST.md](docs/UAT_CHECKLIST.md) — procurement and security acceptance checklist
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) — public, server-only, and acceptance environment variables
- [docs/MIGRATIONS.md](docs/MIGRATIONS.md) — migration, release, and recovery workflow
- [docs/BACKUP_AND_RESTORE.md](docs/BACKUP_AND_RESTORE.md) — database and private Storage recovery guide
- [docs/OPERATIONS.md](docs/OPERATIONS.md) — health, structured logs, monitoring, and incident guidance
- [docs/WORKFLOW_ADMINISTRATION.md](docs/WORKFLOW_ADMINISTRATION.md) — immutable workflow version administration

Never commit `.env.local`, a service-role key, or production credentials. Do not apply the demo-user seed to a production project.
