export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          owner_id: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          reference_no: string
          source_id: string
          source_type: string
          status: Database["public"]["Enums"]["action_status"]
          title: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          reference_no: string
          source_id: string
          source_type: string
          status?: Database["public"]["Enums"]["action_status"]
          title: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          reference_no?: string
          source_id?: string
          source_type?: string
          status?: Database["public"]["Enums"]["action_status"]
          title?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_identities: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          is_active: boolean
          role_code: Database["public"]["Enums"]["user_role_code"]
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          is_active?: boolean
          role_code?: Database["public"]["Enums"]["user_role_code"]
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          is_active?: boolean
          role_code?: Database["public"]["Enums"]["user_role_code"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          byte_size: number
          created_at: string
          id: string
          mime_type: string
          original_name: string
          storage_path: string
          uploaded_by: string | null
          uploaded_by_subject: string | null
        }
        Insert: {
          byte_size: number
          created_at?: string
          id?: string
          mime_type: string
          original_name: string
          storage_path: string
          uploaded_by?: string | null
          uploaded_by_subject?: string | null
        }
        Update: {
          byte_size?: number
          created_at?: string
          id?: string
          mime_type?: string
          original_name?: string
          storage_path?: string
          uploaded_by?: string | null
          uploaded_by_subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_subject_fkey"
            columns: ["uploaded_by_subject"]
            isOneToOne: false
            referencedRelation: "app_identities"
            referencedColumns: ["subject"]
          },
        ]
      }
      audit_logs: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          new_data: Json | null
          previous_data: Json | null
          request_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
          request_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          created_at: string
          id: string
          name: string
          site_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          site_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      capa: {
        Row: {
          action_id: string | null
          created_at: string
          effectiveness_review: string | null
          id: string
          ncr_id: string
          preventive_action: string | null
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          action_id?: string | null
          created_at?: string
          effectiveness_review?: string | null
          id?: string
          ncr_id: string
          preventive_action?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          action_id?: string | null
          created_at?: string
          effectiveness_review?: string | null
          id?: string
          ncr_id?: string
          preventive_action?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capa_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_ncr_id_fkey"
            columns: ["ncr_id"]
            isOneToOne: false
            referencedRelation: "ncr"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          archived_at: string | null
          code: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          approved_by: string | null
          contributing_factors: string | null
          created_at: string
          created_by: string | null
          description: string
          direct_cause: string | null
          id: string
          incident_type: string
          investigator_id: string | null
          lessons_learned: string | null
          occurred_at: string
          reference_no: string
          root_cause: string | null
          severity: Database["public"]["Enums"]["priority_level"]
          site_id: string | null
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          underlying_cause: string | null
          updated_at: string
          work_area_id: string | null
        }
        Insert: {
          approved_by?: string | null
          contributing_factors?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          direct_cause?: string | null
          id?: string
          incident_type: string
          investigator_id?: string | null
          lessons_learned?: string | null
          occurred_at: string
          reference_no: string
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["priority_level"]
          site_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          underlying_cause?: string | null
          updated_at?: string
          work_area_id?: string | null
        }
        Update: {
          approved_by?: string | null
          contributing_factors?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          direct_cause?: string | null
          id?: string
          incident_type?: string
          investigator_id?: string | null
          lessons_learned?: string | null
          occurred_at?: string
          reference_no?: string
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["priority_level"]
          site_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          underlying_cause?: string | null
          updated_at?: string
          work_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_investigator_id_fkey"
            columns: ["investigator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_work_area_id_fkey"
            columns: ["work_area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      ncr: {
        Row: {
          approved_by: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          due_date: string | null
          effectiveness: string | null
          id: string
          immediate_correction: string | null
          nonconformance: string
          owner_id: string | null
          reference_no: string
          requirement: string | null
          root_cause: string | null
          severity: Database["public"]["Enums"]["priority_level"]
          site_id: string | null
          source: string
          status: Database["public"]["Enums"]["ncr_status"]
          updated_at: string
          verification: string | null
        }
        Insert: {
          approved_by?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          due_date?: string | null
          effectiveness?: string | null
          id?: string
          immediate_correction?: string | null
          nonconformance: string
          owner_id?: string | null
          reference_no: string
          requirement?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["priority_level"]
          site_id?: string | null
          source: string
          status?: Database["public"]["Enums"]["ncr_status"]
          updated_at?: string
          verification?: string | null
        }
        Update: {
          approved_by?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          due_date?: string | null
          effectiveness?: string | null
          id?: string
          immediate_correction?: string | null
          nonconformance?: string
          owner_id?: string | null
          reference_no?: string
          requirement?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["priority_level"]
          site_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["ncr_status"]
          updated_at?: string
          verification?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncr_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncr_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncr_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncr_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncr_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          recipient_id: string
          severity: Database["public"]["Enums"]["priority_level"]
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          recipient_id: string
          severity?: Database["public"]["Enums"]["priority_level"]
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          recipient_id?: string
          severity?: Database["public"]["Enums"]["priority_level"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department_id: string | null
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean
          role_code: Database["public"]["Enums"]["user_role_code"]
          site_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          is_active?: boolean
          role_code?: Database["public"]["Enums"]["user_role_code"]
          site_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          role_code?: Database["public"]["Enums"]["user_role_code"]
          site_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      report_attachments: {
        Row: {
          attachment_id: string
          report_id: string
        }
        Insert: {
          attachment_id: string
          report_id: string
        }
        Update: {
          attachment_id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_attachments_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_attachments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          category: Database["public"]["Enums"]["report_category"]
          closed_at: string | null
          created_at: string
          department_id: string | null
          description: string
          due_date: string | null
          exact_area: string | null
          id: string
          immediate_action: string | null
          is_public_submission: boolean
          occurred_at: string
          priority: Database["public"]["Enums"]["priority_level"]
          recommended_action: string | null
          reference_no: string
          reporter_id: string | null
          reporter_name: string | null
          responsible_id: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
          work_area_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["report_category"]
          closed_at?: string | null
          created_at?: string
          department_id?: string | null
          description: string
          due_date?: string | null
          exact_area?: string | null
          id?: string
          immediate_action?: string | null
          is_public_submission?: boolean
          occurred_at?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          recommended_action?: string | null
          reference_no: string
          reporter_id?: string | null
          reporter_name?: string | null
          responsible_id?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
          work_area_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["report_category"]
          closed_at?: string | null
          created_at?: string
          department_id?: string | null
          description?: string
          due_date?: string | null
          exact_area?: string | null
          id?: string
          immediate_action?: string | null
          is_public_submission?: boolean
          occurred_at?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          recommended_action?: string | null
          reference_no?: string
          reporter_id?: string | null
          reporter_name?: string | null
          responsible_id?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
          work_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_work_area_id_fkey"
            columns: ["work_area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          activity: string
          approved_by: string | null
          created_at: string
          id: string
          owner_id: string | null
          reference_no: string
          site_id: string | null
          status: Database["public"]["Enums"]["risk_status"]
          title: string
          updated_at: string
          work_area_id: string | null
        }
        Insert: {
          activity: string
          approved_by?: string | null
          created_at?: string
          id?: string
          owner_id?: string | null
          reference_no: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["risk_status"]
          title: string
          updated_at?: string
          work_area_id?: string | null
        }
        Update: {
          activity?: string
          approved_by?: string | null
          created_at?: string
          id?: string
          owner_id?: string | null
          reference_no?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["risk_status"]
          title?: string
          updated_at?: string
          work_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_work_area_id_fkey"
            columns: ["work_area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_hazards: {
        Row: {
          additional_controls: string | null
          assessment_id: string
          consequence: string | null
          created_at: string
          due_date: string | null
          existing_controls: string | null
          hazard: string
          id: string
          likelihood: number
          persons_at_risk: string | null
          residual_likelihood: number | null
          residual_severity: number | null
          responsible_id: string | null
          severity: number
        }
        Insert: {
          additional_controls?: string | null
          assessment_id: string
          consequence?: string | null
          created_at?: string
          due_date?: string | null
          existing_controls?: string | null
          hazard: string
          id?: string
          likelihood: number
          persons_at_risk?: string | null
          residual_likelihood?: number | null
          residual_severity?: number | null
          responsible_id?: string | null
          severity: number
        }
        Update: {
          additional_controls?: string | null
          assessment_id?: string
          consequence?: string | null
          created_at?: string
          due_date?: string | null
          existing_controls?: string | null
          hazard?: string
          id?: string
          likelihood?: number
          persons_at_risk?: string | null
          residual_likelihood?: number | null
          residual_severity?: number | null
          responsible_id?: string | null
          severity?: number
        }
        Relationships: [
          {
            foreignKeyName: "risk_hazards_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "risk_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_hazards_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: Database["public"]["Enums"]["user_role_code"]
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: Database["public"]["Enums"]["user_role_code"]
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: Database["public"]["Enums"]["user_role_code"]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      safety_monthly_category_statistics: {
        Row: {
          category: Database["public"]["Enums"]["report_category"]
          closed_count: number
          created_at: string
          id: string
          monthly_statistic_id: string
          open_count: number
          report_count: number
        }
        Insert: {
          category: Database["public"]["Enums"]["report_category"]
          closed_count?: number
          created_at?: string
          id?: string
          monthly_statistic_id: string
          open_count?: number
          report_count?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["report_category"]
          closed_count?: number
          created_at?: string
          id?: string
          monthly_statistic_id?: string
          open_count?: number
          report_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "safety_monthly_category_statistics_monthly_statistic_id_fkey"
            columns: ["monthly_statistic_id"]
            isOneToOne: false
            referencedRelation: "safety_monthly_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_monthly_statistics: {
        Row: {
          actions_closed: number
          actions_created: number
          actions_open: number
          actions_overdue: number
          active_risks: number
          calculation_method: string
          created_at: string
          exposure_hours: number | null
          generated_at: string
          generated_by: string | null
          id: string
          incidents_open: number
          incidents_total: number
          lost_time_incidents: number
          month_start: string
          ncr_closed: number
          ncr_open: number
          near_misses: number
          notes: string | null
          positive_observations: number
          recordable_incidents: number
          reports_open: number
          reports_total: number
          risks_for_review: number
          site_id: string | null
          unsafe_conditions: number
          workforce_count: number | null
        }
        Insert: {
          actions_closed?: number
          actions_created?: number
          actions_open?: number
          actions_overdue?: number
          active_risks?: number
          calculation_method?: string
          created_at?: string
          exposure_hours?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          incidents_open?: number
          incidents_total?: number
          lost_time_incidents?: number
          month_start: string
          ncr_closed?: number
          ncr_open?: number
          near_misses?: number
          notes?: string | null
          positive_observations?: number
          recordable_incidents?: number
          reports_open?: number
          reports_total?: number
          risks_for_review?: number
          site_id?: string | null
          unsafe_conditions?: number
          workforce_count?: number | null
        }
        Update: {
          actions_closed?: number
          actions_created?: number
          actions_open?: number
          actions_overdue?: number
          active_risks?: number
          calculation_method?: string
          created_at?: string
          exposure_hours?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          incidents_open?: number
          incidents_total?: number
          lost_time_incidents?: number
          month_start?: string
          ncr_closed?: number
          ncr_open?: number
          near_misses?: number
          notes?: string | null
          positive_observations?: number
          recordable_incidents?: number
          reports_open?: number
          reports_total?: number
          risks_for_review?: number
          site_id?: string | null
          unsafe_conditions?: number
          workforce_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_monthly_statistics_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_monthly_statistics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          archived_at: string | null
          code: string | null
          created_at: string
          id: string
          name: string
          timezone: string
        }
        Insert: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name: string
          timezone?: string
        }
        Update: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_areas: {
        Row: {
          building_id: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_areas_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      action_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "pending_verification"
        | "closed"
        | "reopened"
      incident_status:
        | "reported"
        | "under_investigation"
        | "pending_approval"
        | "closed"
        | "reopened"
      ncr_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "pending_verification"
        | "closed"
        | "reopened"
      priority_level: "low" | "medium" | "high" | "critical"
      report_category:
        | "unsafe_act"
        | "unsafe_condition"
        | "hazard"
        | "near_miss"
        | "safety_observation"
        | "positive_observation"
        | "fire_observation"
        | "environmental_observation"
      report_status:
        | "submitted"
        | "triaged"
        | "assigned"
        | "in_progress"
        | "pending_verification"
        | "closed"
        | "reopened"
      risk_status:
        | "draft"
        | "review"
        | "approved"
        | "active"
        | "superseded"
        | "archived"
      user_role_code:
        | "super_admin"
        | "hse_manager"
        | "hse_leader"
        | "hse_supervisor"
        | "senior_safety_officer"
        | "safety_officer"
        | "department_manager"
        | "supervisor"
        | "employee"
        | "contractor"
        | "auditor"
        | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_status: [
        "open",
        "assigned",
        "in_progress",
        "pending_verification",
        "closed",
        "reopened",
      ],
      incident_status: [
        "reported",
        "under_investigation",
        "pending_approval",
        "closed",
        "reopened",
      ],
      ncr_status: [
        "open",
        "assigned",
        "in_progress",
        "pending_verification",
        "closed",
        "reopened",
      ],
      priority_level: ["low", "medium", "high", "critical"],
      report_category: [
        "unsafe_act",
        "unsafe_condition",
        "hazard",
        "near_miss",
        "safety_observation",
        "positive_observation",
        "fire_observation",
        "environmental_observation",
      ],
      report_status: [
        "submitted",
        "triaged",
        "assigned",
        "in_progress",
        "pending_verification",
        "closed",
        "reopened",
      ],
      risk_status: [
        "draft",
        "review",
        "approved",
        "active",
        "superseded",
        "archived",
      ],
      user_role_code: [
        "super_admin",
        "hse_manager",
        "hse_leader",
        "hse_supervisor",
        "senior_safety_officer",
        "safety_officer",
        "department_manager",
        "supervisor",
        "employee",
        "contractor",
        "auditor",
        "viewer",
      ],
    },
  },
} as const
