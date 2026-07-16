-- Phase 5 follow-up: Supabase projects grant function execution to API roles
-- through explicit default privileges. Remove those broad grants and restore
-- only the application RPCs and RLS helpers each role is intended to call.

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

revoke execute on all functions in schema public
  from public, anon, authenticated, service_role;

-- RLS helpers and signed-in application RPCs.
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.has_any_role(text[]) to authenticated;
grant execute on function public.can_view_procurement_case(uuid) to authenticated;
grant execute on function public.can_edit_procurement_case(uuid) to authenticated;
grant execute on function public.create_procurement_case(jsonb, jsonb) to authenticated;
grant execute on function public.update_procurement_case(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.start_case_workflow(uuid, uuid) to authenticated;
grant execute on function public.transition_case_workflow(uuid, text, text, uuid, uuid) to authenticated;
grant execute on function public.duplicate_workflow_template(uuid) to authenticated;
grant execute on function public.reorder_workflow_steps(uuid, uuid[]) to authenticated;
grant execute on function public.dashboard_report() to authenticated;
grant execute on function public.personnel_stage_kpi_report(timestamptz, timestamptz, uuid, text) to authenticated;
grant execute on function public.work_status_report(text, timestamptz, timestamptz) to authenticated;
grant execute on function public.register_case_document_version(
  uuid, uuid, uuid, uuid, uuid, text, text, text, text, text, bigint, text
) to authenticated;
grant execute on function public.add_case_comment(uuid, text) to authenticated;

-- Scheduled notification generation is server-only.
grant execute on function public.generate_procurement_notifications(timestamptz) to service_role;

