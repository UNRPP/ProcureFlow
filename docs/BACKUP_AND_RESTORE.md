# Backup and restore guide

Hospital IT must approve retention, encryption, residency, and recovery objectives before production. Record both a recovery point objective (acceptable data loss) and recovery time objective (acceptable outage).

## Backup scope

- Supabase Postgres, including Auth, application schemas, migration history, and audit records.
- Private `case-documents` Storage objects. Database backups contain object metadata and policies, not the file bytes themselves.
- Vercel project configuration, environment-variable inventory, custom-domain configuration, and the exact deployed Git commit.
- The repository, migrations, production baseline seed, and operational documentation.

Use the backup and point-in-time recovery capability approved for the selected Supabase plan. For an additional encrypted logical backup, use PostgreSQL `pg_dump` against the direct database connection from an approved secure host. Never store a database password or exported health/procurement data in Git.

## Restore drill

1. Create an isolated recovery project with no production traffic.
2. Restore the database backup and verify migration history before connecting the app.
3. Restore private Storage objects while preserving bucket name and object paths.
4. configure new Auth URLs and fresh environment secrets;
5. deploy the recorded application commit;
6. run DB tests, RLS/Storage checks, workbook reconciliation, and the Playwright acceptance suite;
7. compare case, stage, interval, audit, document-version, and Storage-object counts;
8. obtain procurement and security approval before cutover.

Run and record a restore drill at the cadence required by hospital policy and after material schema or Storage changes. A backup is not accepted until restoration has been demonstrated.
