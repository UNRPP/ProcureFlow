# Workflow administration

Only a super administrator can manage workflow templates.

1. Create required departments, procurement types, roles, and document types under Settings.
2. Create a draft template for one procurement type.
3. Add ordered steps with stable machine keys, English/Thai names, target calendar days, default responsibility, skip behavior, and document behavior.
4. Add bilingual document requirements to draft steps and decide whether each missing item blocks completion.
5. Review the complete sequence and publish it. A published version is immutable.
6. To change a published workflow, duplicate it as a new draft version, edit the draft, and publish the new version.

Starting a case copies the selected published template, steps, and document requirements into case-specific snapshots. Existing cases never change when a template version changes.

Supported case actions are complete, return, reassign, hold, resume, skip, cancel, and complete case. Return, hold, skip, cancel, procurement-type change, and manager override require a reason. Every meaningful action creates immutable audit history; only one stage may be active at a time.

Before publishing, test the template in staging with user- and department-responsibility changes, required document blocking, a returned stage, a skipped optional stage, final completion, overdue aging, notifications, personnel interval attribution, and both locales.
