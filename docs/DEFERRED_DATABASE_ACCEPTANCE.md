# Deferred database acceptance

The application is implemented through Phase 5, but live Supabase execution was explicitly deferred. Complete this checklist when Docker or a hosted non-production project is available.

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

1. Create a disposable Supabase project and disable public sign-up.
2. Link with `npx supabase link --project-ref <ref>` and apply with `npx supabase db push`.
3. Use demo seed data only in this disposable acceptance project, never production.
4. Deploy a Vercel Preview with staging environment values and Auth redirect URLs.
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
