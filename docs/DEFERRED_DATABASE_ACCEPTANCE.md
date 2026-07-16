# Database acceptance status

The application is implemented through Phase 5. On 16 July 2026, the repository was linked to the hosted Supabase project `ProcureFlow` (`rsnjvjfufftzduhwnihr`), all seven migrations were applied, and the production-safe baseline seed was loaded. The remote migration ledger matches the repository, every public business table has RLS enabled, and anonymous execution of `SECURITY DEFINER` functions is blocked.

Docker is not required for the hosted workflow. The local acceptance section remains optional and requires Docker or another compatible container runtime.

## Local acceptance

```bash
nvm use
npm install
npm run supabase:start
npm run supabase:status
cp .env.example .env.local
# Replace placeholders with values reported by supabase:status.
npm run db:reset
npm run db:lint
npm run test:db
npm run check
E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

Before Playwright, run `npm run dev` in another terminal and install Chromium once with `npm run test:e2e:install`.

Verify all migrations apply in order, the private `case-documents` bucket exists, all pgTAP files pass, all four seeded roles can sign in, document upload/download/versioning works, required documents block completion, cron notifications are idempotent, and both workbook totals reconcile.

## Hosted staging acceptance

1. The linked `ProcureFlow` project is designated as production. Never load `supabase/seed.sql` into it.
2. Public sign-up is disabled, and Auth URLs are configured for `https://procureflow-ivory.vercel.app`, Vercel previews, and localhost.
3. One confirmed, active first administrator has been bootstrapped with exactly the `super_admin` role.
4. The Vercel project and first hosted deployment are configured; complete administrator sign-in acceptance before creating approved master data or additional users.
5. Run behavioral RLS, Storage, role, locale, workbook, cron, and Playwright tests.
6. Capture query plans at production-like volumes and confirm the Phase 5 indexes are used where selective.
7. Re-run unauthorized download tests after signed URLs expire.

## Manual production decisions

- Hospital identity provider, MFA, SMTP, account recovery, session duration, and user-provisioning owner.
- Thai master-data and workflow wording approval.
- Fiscal-year and procurement-method configuration.
- Audit, document, log, and backup retention; data residency; RPO/RTO.
- Malware scanning/content inspection service for uploaded documents.
- Monitoring destinations, on-call ownership, maintenance windows, and incident process.
- Production Supabase/Vercel plan, custom domain, HTTPS, and recovery features.

Production is not accepted until the UAT checklist and restore drill are signed off by procurement, hospital IT/security, and the system owner.
