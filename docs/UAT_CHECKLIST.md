# User acceptance checklist

Record tester, date, environment, Git commit, database migration list, locale, evidence link, and pass/fail for each item.

## Access and roles

- [ ] Super admin can manage master data and draft workflows.
- [ ] Manager can manage cases but cannot manage templates or roles.
- [ ] Officer can create an own case and edit only owned/currently assigned work.
- [ ] Viewer/auditor is read-only and cannot comment, upload, or transition.
- [ ] Inactive and anonymous users cannot access protected routes or data.

## Case and workflow

- [ ] Create valid examples for all three work categories; invalid fields show localized, associated errors.
- [ ] Start a published workflow and confirm case-stage/document snapshots.
- [ ] Complete, return with reason, reassign, hold with reason, resume, skip with reason, cancel with reason, and complete a case.
- [ ] Confirm only one active stage and immutable completed/audit/responsibility history.
- [ ] Confirm owner and current responsibility remain distinct after reassignment.

## Documents, notifications, and renewals

- [ ] Upload each allowed file type and reject disallowed/oversized files.
- [ ] Download as an authorized user and deny an unauthorized/anonymous request.
- [ ] Upload a second version and confirm the first version remains downloadable.
- [ ] Block stage completion when a blocking requirement is missing.
- [ ] Add a comment and confirm it appears in activity history.
- [ ] Generate, read, and mark assignment/due/overdue/hold/renewal notifications.
- [ ] Confirm service-contract renewal dates appear in Calendar.

## Reports, language, and usability

- [ ] Dashboard, My Work, case list, calendar, reports, and settings load with real database values.
- [ ] Personnel KPI uses responsibility intervals and matches hand calculations, including reassignment.
- [ ] Grouped totals reconcile with overall totals for every supported dimension.
- [ ] English and Thai switching persists through reload/sign-out/sign-in; user-authored text is unchanged.
- [ ] Both Excel exports open as genuine `.xlsx` files with filters, typed dates/numbers, criteria, export time, and reconciled totals.
- [ ] Complete the critical flow using keyboard only; verify focus, labels, status text, contrast, reduced motion, and 200% zoom.
- [ ] Run `npm run test:e2e` and retain the Playwright/axe evidence.

## Operations

- [ ] Health and scheduler monitors are active.
- [ ] Backup and private Storage recovery are demonstrated in an isolated project.
- [ ] Domain, HTTPS, Auth redirects, SMTP, MFA/identity policy, retention, and incident ownership are approved.
