# Operations and monitoring

`GET /api/health` is a liveness/configuration check. It returns `200` when required public configuration parses and `503` otherwise; it does not bypass RLS or query health data. Monitor it from outside Vercel.

Server logs are structured JSON with an event name, level, timestamp, and non-sensitive error code/status. They intentionally omit error messages and procurement content. Alert on sustained increases in:

- `health.configuration_invalid`
- `case.*_failed` and `workflow.*_failed`
- `document.storage_upload_failed`, `document.metadata_registration_failed`, or `document.orphan_cleanup_failed`
- `report.*_failed`
- `notifications.generation_failed` or absence of the expected daily `notifications.generated` event

Do not add case titles, comments, filenames, user-authored text, document content, or credentials to logs. Configure hosting log retention and access with hospital security.

The scheduled route requires `Authorization: Bearer <CRON_SECRET>` and uses the service-role key only on the server. Review scheduler execution daily and compare reminder counts after material workflow changes.

For incidents, preserve logs and audit events, rotate exposed secrets, disable affected users, avoid modifying historical records, and use the backup/recovery runbook. Record the deployed Git commit, Supabase migration state, affected case IDs, recovery boundary, and validation evidence without copying patient-sensitive content into the incident tracker.

Before expected growth, run `EXPLAIN (ANALYZE, BUFFERS)` in staging for the case list, My Work, dashboard RPC, personnel KPI RPC, grouped work-status RPC, required-document completion check, and notification generation. Use production-like row counts and retain the plans with the release evidence.
