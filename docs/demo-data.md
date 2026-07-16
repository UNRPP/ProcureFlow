# Demo acceptance data

Use **Settings → Demo acceptance data** as a super administrator to create the production-safe test dataset.

It creates eight idempotent cases whose numbers begin with `DEMO-2026-`, covering draft, active, on-hold, completed, and cancelled statuses across all three work categories. It also creates only clearly named `demo_` master-data records and a published `demo_standard` workflow.

Use **Clear demo cases** when testing is complete. It deletes only `DEMO-*` cases and related in-app records. It intentionally leaves the supporting master data and workflow so that no subsequently created record loses its historical references. Storage objects uploaded to a demo case must be deleted from the case document UI before cleanup; the application never removes storage files merely because a database record is deleted.

This is test data, not a scraping facility. No external websites, vendor systems, or real production records are read or changed.
