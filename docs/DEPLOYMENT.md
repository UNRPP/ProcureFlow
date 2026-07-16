# Production deployment guide

Deploy only after staging database, Storage, browser, workbook, backup, and restore acceptance is complete.

## 1. Create and secure Supabase

1. Create separate staging and production projects in the approved region.
2. Disable public and anonymous sign-up; require the hospital-approved password, MFA/identity, SMTP, session, and recovery policy.
3. Record and restrict the direct database connection credentials.
4. Enable the backup/recovery capability required by the approved RPO/RTO.
5. Link the reviewed repository and run `npx supabase db push` from the release commit.
6. Apply `supabase/production_seed.sql` through an approved direct database session. Do not apply `supabase/seed.sql`.
7. Create the first Auth user through the controlled administrator process, then run the versioned `supabase/bootstrap_super_admin.sql` with that email. Verify exactly one role assignment.
8. Create hospital departments, procurement methods, budget data, fiscal years, and published workflow versions through the application after procurement approval.

The Phase 4 migration creates the private `case-documents` bucket and policies. Verify it remains private and that the 25 MB/MIME restrictions match hospital policy.

## 2. Configure Vercel

1. Import the Git repository and use Node.js 22 or newer.
2. Add the variables in `ENVIRONMENT.md` separately for Preview and Production. Use different projects and secrets.
3. Deploy and confirm `/api/health` returns `200`.
4. Confirm the daily notification schedule in `vercel.json` is enabled and authorized with `CRON_SECRET`. Vercel cron invokes Production deployments; test Preview routes manually with the same bearer-header contract.
5. Configure log retention, alerting, deployment protection for Preview, and least-privilege project membership.

## 3. Domain, HTTPS, and Auth

1. Attach the approved custom domain and complete DNS verification.
2. Require HTTPS and verify the security headers, including HSTS on the production Vercel environment.
3. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin and redeploy so the Content Security Policy is rebuilt.
4. Set the Supabase Auth site URL and exact allowed callback URLs for the production domain. Remove obsolete preview callbacks.
5. Use `/forgot-password` to initiate password recovery. The application requests a recovery redirect through `/auth/callback?next=/reset-password`, which exchanges the one-time code before allowing a new password.
6. Verify sign-in, sign-out, session refresh, language persistence, password recovery, and inactive-user behavior.

## 4. Release gate

```bash
npm ci
npm run format:check
npm run check
npm audit
```

Then run pgTAP and Playwright against staging, complete `UAT_CHECKLIST.md`, test scheduled reminders, download both workbooks, verify grouped reconciliation and interval metrics, and complete an isolated restore drill.

Deploy production from an immutable reviewed commit. After release, verify health, logs, sign-in for each role, case/document/workflow operations, reports, cron, and backup status. Keep the previous compatible deployment available until the observation window closes.
