type MasterDataRow = {
  id: string;
  code: string;
  name_en: string;
  name_th: string;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type MasterDataInsert = {
  id?: string;
  code: string;
  name_en: string;
  name_th: string;
  is_active?: boolean;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type MasterDataUpdate = Partial<MasterDataInsert>;

type MasterDataTable = {
  Row: MasterDataRow;
  Insert: MasterDataInsert;
  Update: MasterDataUpdate;
  Relationships: [];
};

export type WorkCategoryCode =
  "medical_device" | "medical_equipment" | "service_contract";
export type CaseStatus =
  "draft" | "active" | "on_hold" | "completed" | "cancelled";
export type CasePriority = "normal" | "urgent" | "critical";

type ProcurementCaseRow = {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  work_category_id: string;
  requesting_department_id: string;
  fiscal_year_id: string;
  budget_category_id: string;
  budget_source_id: string;
  estimated_value: number;
  final_value: number | null;
  procurement_type_id: string;
  priority: CasePriority;
  case_owner_id: string;
  current_responsible_user_id: string | null;
  current_responsible_department_id: string | null;
  current_stage_instance_id: string | null;
  target_completion_date: string | null;
  status: CaseStatus;
  hold_reason: string | null;
  cancellation_reason: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type ProcurementCaseInsert = Omit<
  ProcurementCaseRow,
  | "id"
  | "case_number"
  | "created_at"
  | "updated_at"
  | "completed_at"
  | "current_stage_instance_id"
> & {
  id?: string;
  case_number?: string;
  description?: string | null;
  final_value?: number | null;
  priority?: CasePriority;
  current_responsible_user_id?: string | null;
  current_responsible_department_id?: string | null;
  current_stage_instance_id?: string | null;
  target_completion_date?: string | null;
  status?: CaseStatus;
  hold_reason?: string | null;
  cancellation_reason?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          code:
            | "super_admin"
            | "procurement_manager"
            | "procurement_officer"
            | "viewer_auditor";
          name_en: string;
          name_th: string;
          description_en: string | null;
          description_th: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code:
            | "super_admin"
            | "procurement_manager"
            | "procurement_officer"
            | "viewer_auditor";
          name_en: string;
          name_th: string;
          description_en?: string | null;
          description_th?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
        Relationships: [];
      };
      departments: MasterDataTable;
      work_categories: MasterDataTable;
      budget_categories: MasterDataTable;
      budget_sources: MasterDataTable;
      procurement_types: MasterDataTable;
      fiscal_years: {
        Row: MasterDataRow & {
          year: number;
          starts_on: string;
          ends_on: string;
        };
        Insert: MasterDataInsert & {
          year: number;
          starts_on: string;
          ends_on: string;
        };
        Update: Partial<
          MasterDataInsert & {
            year: number;
            starts_on: string;
            ends_on: string;
          }
        >;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          employee_code: string | null;
          department_id: string | null;
          locale: "en" | "th";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          employee_code?: string | null;
          department_id?: string | null;
          locale?: "en" | "th";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role_id: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role_id: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      procurement_cases: {
        Row: ProcurementCaseRow;
        Insert: ProcurementCaseInsert;
        Update: Partial<ProcurementCaseInsert>;
        Relationships: [];
      };
      medical_device_case_details: {
        Row: {
          case_id: string;
          item_name: string;
          quantity: number;
          unit: string;
          estimated_unit_price: number;
          intended_use: string;
          device_classification: string;
          is_reusable: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          case_id: string;
          item_name: string;
          quantity: number;
          unit: string;
          estimated_unit_price: number;
          intended_use: string;
          device_classification: string;
          is_reusable: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["medical_device_case_details"]["Insert"]
        >;
        Relationships: [];
      };
      medical_equipment_case_details: {
        Row: {
          case_id: string;
          equipment_name: string;
          quantity: number;
          purchase_kind: "new_purchase" | "replacement";
          installation_location: string;
          replaced_asset_reference: string | null;
          expected_installation_date: string | null;
          warranty_required: boolean;
          maintenance_required: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          case_id: string;
          equipment_name: string;
          quantity: number;
          purchase_kind: "new_purchase" | "replacement";
          installation_location: string;
          replaced_asset_reference?: string | null;
          expected_installation_date?: string | null;
          warranty_required?: boolean;
          maintenance_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["medical_equipment_case_details"]["Insert"]
        >;
        Relationships: [];
      };
      service_contract_case_details: {
        Row: {
          case_id: string;
          scope_of_service: string;
          contract_start_date: string;
          contract_end_date: string;
          is_recurring: boolean;
          existing_contract_number: string | null;
          current_provider: string | null;
          renewal_notification_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          case_id: string;
          scope_of_service: string;
          contract_start_date: string;
          contract_end_date: string;
          is_recurring?: boolean;
          existing_contract_number?: string | null;
          current_provider?: string | null;
          renewal_notification_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["service_contract_case_details"]["Insert"]
        >;
        Relationships: [];
      };
      workflow_templates: {
        Row: {
          id: string;
          code: string;
          version: number;
          name_en: string;
          name_th: string;
          description_en: string | null;
          description_th: string | null;
          procurement_type_id: string;
          status: "draft" | "published" | "archived";
          published_at: string | null;
          archived_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          version: number;
          name_en: string;
          name_th: string;
          description_en?: string | null;
          description_th?: string | null;
          procurement_type_id: string;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          archived_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["workflow_templates"]["Insert"]
        >;
        Relationships: [];
      };
      workflow_template_steps: {
        Row: {
          id: string;
          template_id: string;
          step_key: string;
          name_en: string;
          name_th: string;
          description_en: string | null;
          description_th: string | null;
          sequence: number;
          default_responsible_role_id: string | null;
          default_responsible_department_id: string | null;
          target_days: number;
          required_document_behavior: "none" | "warn" | "block";
          can_skip: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          step_key: string;
          name_en: string;
          name_th: string;
          description_en?: string | null;
          description_th?: string | null;
          sequence: number;
          default_responsible_role_id?: string | null;
          default_responsible_department_id?: string | null;
          target_days?: number;
          required_document_behavior?: "none" | "warn" | "block";
          can_skip?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["workflow_template_steps"]["Insert"]
        >;
        Relationships: [];
      };
      case_workflows: {
        Row: {
          id: string;
          case_id: string;
          template_id: string;
          template_code: string;
          template_version: number;
          template_name_en: string;
          template_name_th: string;
          status: "active" | "completed" | "cancelled";
          started_by: string;
          started_at: string;
          completed_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["case_workflows"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["case_workflows"]["Insert"]
        >;
        Relationships: [];
      };
      case_stage_instances: {
        Row: {
          id: string;
          case_workflow_id: string;
          case_id: string;
          template_step_id: string | null;
          step_key: string;
          name_en: string;
          name_th: string;
          description_en: string | null;
          description_th: string | null;
          sequence: number;
          iteration: number;
          default_responsible_role_id: string | null;
          default_responsible_department_id: string | null;
          responsible_user_id: string | null;
          responsible_department_id: string | null;
          target_days: number;
          required_document_behavior: "none" | "warn" | "block";
          can_skip: boolean;
          status:
            | "pending"
            | "active"
            | "completed"
            | "returned"
            | "skipped"
            | "cancelled";
          entered_at: string | null;
          due_at: string | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["case_stage_instances"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["case_stage_instances"]["Insert"]
        >;
        Relationships: [];
      };
      workflow_transition_events: {
        Row: {
          id: string;
          case_id: string;
          case_workflow_id: string;
          from_stage_instance_id: string | null;
          to_stage_instance_id: string | null;
          action:
            | "start"
            | "complete"
            | "return"
            | "reassign"
            | "hold"
            | "resume"
            | "skip"
            | "cancel"
            | "complete_case";
          reason: string | null;
          performed_by: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["workflow_transition_events"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      case_assignments: {
        Row: {
          id: string;
          case_id: string;
          stage_instance_id: string;
          assigned_user_id: string | null;
          assigned_department_id: string | null;
          assignment_kind:
            "default" | "direct" | "delegated" | "returned" | "reassigned";
          reason: string | null;
          assigned_by: string;
          assigned_at: string;
          unassigned_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["case_assignments"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      case_responsibility_intervals: {
        Row: {
          id: string;
          case_id: string;
          stage_instance_id: string;
          responsible_user_id: string | null;
          responsible_department_id: string | null;
          started_at: string;
          ended_at: string | null;
          assignment_source:
            "default" | "direct" | "delegated" | "returned" | "reassigned";
          assignment_reason: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["case_responsibility_intervals"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      case_activity_events: {
        Row: {
          id: string;
          case_id: string;
          event_type: string;
          summary_key: string;
          actor_id: string | null;
          details: Record<string, unknown>;
          occurred_at: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["case_activity_events"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      document_types: MasterDataTable;
      workflow_step_document_requirements: {
        Row: {
          id: string;
          template_step_id: string;
          document_type_id: string;
          is_required: boolean;
          blocks_completion: boolean;
          description_en: string | null;
          description_th: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["workflow_step_document_requirements"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<
          Database["public"]["Tables"]["workflow_step_document_requirements"]["Insert"]
        >;
        Relationships: [];
      };
      case_stage_document_requirements: {
        Row: {
          id: string;
          stage_instance_id: string;
          case_id: string;
          document_type_id: string;
          document_type_code: string;
          document_type_name_en: string;
          document_type_name_th: string;
          is_required: boolean;
          blocks_completion: boolean;
          description_en: string | null;
          description_th: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      case_documents: {
        Row: {
          id: string;
          case_id: string;
          stage_instance_id: string | null;
          document_type_id: string;
          title: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      case_document_versions: {
        Row: {
          id: string;
          document_id: string;
          version_number: number;
          original_filename: string;
          storage_bucket: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          replaces_version_id: string | null;
          version_description: string | null;
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      case_comments: {
        Row: {
          id: string;
          case_id: string;
          stage_instance_id: string | null;
          body: string;
          author_id: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_user_id: string;
          case_id: string | null;
          notification_type:
            | "assignment"
            | "responsibility_change"
            | "returned_case"
            | "due_soon"
            | "overdue"
            | "hold"
            | "service_contract_renewal";
          title_key: string;
          body_data: Record<string, unknown>;
          source_key: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: never;
        Update: { read_at?: string | null };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          assignment_enabled: boolean;
          workflow_enabled: boolean;
          due_soon_enabled: boolean;
          overdue_enabled: boolean;
          renewal_enabled: boolean;
          due_soon_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["notification_preferences"]["Row"]
        > & { user_id: string };
        Update: Partial<
          Database["public"]["Tables"]["notification_preferences"]["Row"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_any_role: {
        Args: { required_codes: string[] };
        Returns: boolean;
      };
      import_master_data_batch: {
        Args: { target_table: string; import_rows: Record<string, unknown>[] };
        Returns: number;
      };
      is_active_user: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      can_view_procurement_case: {
        Args: { target_case_id: string };
        Returns: boolean;
      };
      can_edit_procurement_case: {
        Args: { target_case_id: string };
        Returns: boolean;
      };
      create_procurement_case: {
        Args: {
          case_data: Record<string, unknown>;
          detail_data: Record<string, unknown>;
        };
        Returns: string;
      };
      update_procurement_case: {
        Args: {
          target_case_id: string;
          case_data: Record<string, unknown>;
          detail_data: Record<string, unknown>;
        };
        Returns: string;
      };
      start_case_workflow: {
        Args: { target_case_id: string; selected_template_id: string };
        Returns: string;
      };
      transition_case_workflow: {
        Args: {
          target_case_id: string;
          transition_action: string;
          transition_reason?: string | null;
          target_user_id?: string | null;
          target_department_id?: string | null;
        };
        Returns: string;
      };
      duplicate_workflow_template: {
        Args: { source_template_id: string };
        Returns: string;
      };
      reorder_workflow_steps: {
        Args: { target_template_id: string; ordered_step_ids: string[] };
        Returns: undefined;
      };
      dashboard_report: {
        Args: Record<string, never>;
        Returns: Record<string, unknown>;
      };
      personnel_stage_kpi_report: {
        Args: {
          period_start?: string | null;
          period_end?: string | null;
          selected_user_id?: string | null;
          selected_step_key?: string | null;
        };
        Returns: {
          user_id: string;
          full_name: string;
          step_key: string;
          stage_name_en: string;
          stage_name_th: string;
          unique_cases: number;
          interval_count: number;
          minimum_days: number;
          maximum_days: number;
          average_days: number;
          median_days: number;
          total_days: number;
          completed_cases: number;
        }[];
      };
      work_status_report: {
        Args: {
          group_dimension: string;
          period_start?: string | null;
          period_end?: string | null;
        };
        Returns: {
          group_key: string;
          group_name_en: string;
          group_name_th: string;
          total: number;
          completed: number;
          active_remaining: number;
          on_hold: number;
          cancelled: number;
          completion_percentage: number;
          overdue_remaining: number;
        }[];
      };
      register_case_document_version: {
        Args: {
          target_case_id: string;
          target_stage_instance_id: string | null;
          target_document_id: string;
          target_version_id: string;
          target_document_type_id: string;
          target_title: string;
          target_description: string;
          target_original_filename: string;
          target_storage_path: string;
          target_mime_type: string;
          target_size_bytes: number;
          target_version_description?: string | null;
        };
        Returns: string;
      };
      add_case_comment: {
        Args: { target_case_id: string; comment_body: string };
        Returns: string;
      };
      generate_procurement_notifications: {
        Args: { reference_time?: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type RoleCode = Database["public"]["Tables"]["roles"]["Row"]["code"];
export type MasterDataRecord = MasterDataRow;
export type ProcurementCase = ProcurementCaseRow;
