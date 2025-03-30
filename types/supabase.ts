export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_metadata: Json | null
          action_type: string
          id: string
          performed_by: string
          profile_id: string | null
          timestamp: string | null
        }
        Insert: {
          action_metadata?: Json | null
          action_type: string
          id?: string
          performed_by: string
          profile_id?: string | null
          timestamp?: string | null
        }
        Update: {
          action_metadata?: Json | null
          action_type?: string
          id?: string
          performed_by?: string
          profile_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bcc_logged: boolean | null
          email_body: string | null
          email_subject: string | null
          id: string
          profile_id: string | null
          sent_at: string | null
        }
        Insert: {
          bcc_logged?: boolean | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          profile_id?: string | null
          sent_at?: string | null
        }
        Update: {
          bcc_logged?: boolean | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          profile_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_edited_by_admin: boolean | null
          last_edited_at: string | null
          profile_id: string | null
          type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_edited_by_admin?: boolean | null
          last_edited_at?: string | null
          profile_id?: string | null
          type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_edited_by_admin?: boolean | null
          last_edited_at?: string | null
          profile_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      introductions: {
        Row: {
          created_at: string | null
          from_profile_id: string | null
          id: string
          intro_draft_id: string | null
          method: string | null
          sent_at: string | null
          status: string | null
          to_profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          from_profile_id?: string | null
          id?: string
          intro_draft_id?: string | null
          method?: string | null
          sent_at?: string | null
          status?: string | null
          to_profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          from_profile_id?: string | null
          id?: string
          intro_draft_id?: string | null
          method?: string | null
          sent_at?: string | null
          status?: string | null
          to_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "introductions_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "introductions_intro_draft_id_fkey"
            columns: ["intro_draft_id"]
            isOneToOne: false
            referencedRelation: "embeddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "introductions_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          additional_interests: string | null
          cofounders_context: string | null
          completed: boolean | null
          core_values: string | null
          credibility_score: number | null
          current_plan: string | null
          decision_style: string | null
          desired_introductions: string | null
          discomfort_trigger: string | null
          email: string | null
          failure_response: string | null
          final_notes: string | null
          focus_area: string | null
          full_name: string
          group_dynamics: string | null
          hypothetical_startup_idea: string | null
          id: string
          inspiring_companies: string | null
          job_search_preferences: string | null
          last_scraped_at: string | null
          linkedin: string | null
          location: string | null
          long_term_goal: string | null
          motivation_type: string | null
          new_start_behavior: string | null
          nomination: string | null
          phone: string | null
          profile_created_at: string | null
          profile_picture_url: string | null
          referral_source: string | null
          self_description: string | null
          sentiment: string | null
          skillset: string | null
          skillset_extra: string | null
          startup_differentiator: string | null
          startup_name: string | null
          startup_validation: string | null
          stress_response: string | null
          submitted_at: string | null
          summary: string | null
          timeline_to_start: string | null
          transcript: string | null
        }
        Insert: {
          additional_interests?: string | null
          cofounders_context?: string | null
          completed?: boolean | null
          core_values?: string | null
          credibility_score?: number | null
          current_plan?: string | null
          decision_style?: string | null
          desired_introductions?: string | null
          discomfort_trigger?: string | null
          email?: string | null
          failure_response?: string | null
          final_notes?: string | null
          focus_area?: string | null
          full_name: string
          group_dynamics?: string | null
          hypothetical_startup_idea?: string | null
          id?: string
          inspiring_companies?: string | null
          job_search_preferences?: string | null
          last_scraped_at?: string | null
          linkedin?: string | null
          location?: string | null
          long_term_goal?: string | null
          motivation_type?: string | null
          new_start_behavior?: string | null
          nomination?: string | null
          phone?: string | null
          profile_created_at?: string | null
          profile_picture_url?: string | null
          referral_source?: string | null
          self_description?: string | null
          sentiment?: string | null
          skillset?: string | null
          skillset_extra?: string | null
          startup_differentiator?: string | null
          startup_name?: string | null
          startup_validation?: string | null
          stress_response?: string | null
          submitted_at?: string | null
          summary?: string | null
          timeline_to_start?: string | null
          transcript?: string | null
        }
        Update: {
          additional_interests?: string | null
          cofounders_context?: string | null
          completed?: boolean | null
          core_values?: string | null
          credibility_score?: number | null
          current_plan?: string | null
          decision_style?: string | null
          desired_introductions?: string | null
          discomfort_trigger?: string | null
          email?: string | null
          failure_response?: string | null
          final_notes?: string | null
          focus_area?: string | null
          full_name?: string
          group_dynamics?: string | null
          hypothetical_startup_idea?: string | null
          id?: string
          inspiring_companies?: string | null
          job_search_preferences?: string | null
          last_scraped_at?: string | null
          linkedin?: string | null
          location?: string | null
          long_term_goal?: string | null
          motivation_type?: string | null
          new_start_behavior?: string | null
          nomination?: string | null
          phone?: string | null
          profile_created_at?: string | null
          profile_picture_url?: string | null
          referral_source?: string | null
          self_description?: string | null
          sentiment?: string | null
          skillset?: string | null
          skillset_extra?: string | null
          startup_differentiator?: string | null
          startup_name?: string | null
          startup_validation?: string | null
          stress_response?: string | null
          submitted_at?: string | null
          summary?: string | null
          timeline_to_start?: string | null
          transcript?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
