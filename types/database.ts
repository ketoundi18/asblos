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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_date: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          max_participants: number | null
          parent_registration_open: boolean
          price_cents: number
          start_time: string | null
          status: Database["public"]["Enums"]["activity_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity_date: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          max_participants?: number | null
          parent_registration_open?: boolean
          price_cents?: number
          start_time?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity_date?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          max_participants?: number | null
          parent_registration_open?: boolean
          price_cents?: number
          start_time?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_attendance: {
        Row: {
          activity_id: string
          child_id: string
          id: string
          is_present: boolean
          marked_at: string
          marked_by: string | null
          notes: string | null
        }
        Insert: {
          activity_id: string
          child_id: string
          id?: string
          is_present: boolean
          marked_at?: string
          marked_by?: string | null
          notes?: string | null
        }
        Update: {
          activity_id?: string
          child_id?: string
          id?: string
          is_present?: boolean
          marked_at?: string
          marked_by?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_attendance_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_attendance_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_registrations: {
        Row: {
          activity_id: string
          cancelled_at: string | null
          child_id: string
          id: string
          payment_status: Database["public"]["Enums"]["activity_registration_payment_status"]
          registered_at: string
          registered_by: string | null
        }
        Insert: {
          activity_id: string
          cancelled_at?: string | null
          child_id: string
          id?: string
          payment_status?: Database["public"]["Enums"]["activity_registration_payment_status"]
          registered_at?: string
          registered_by?: string | null
        }
        Update: {
          activity_id?: string
          cancelled_at?: string | null
          child_id?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["activity_registration_payment_status"]
          registered_at?: string
          registered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_registrations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_registrations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_registrations_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      asbl_settings: {
        Row: {
          created_at: string
          currency: string
          effective_from: string
          enrollment_fee_cents: number
          id: string
          school_support_fee_cents: number
          school_year: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          effective_from?: string
          enrollment_fee_cents?: number
          id?: string
          school_support_fee_cents?: number
          school_year: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          effective_from?: string
          enrollment_fee_cents?: number
          id?: string
          school_support_fee_cents?: number
          school_year?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asbl_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          allergies: string | null
          anonymized_at: string | null
          asbl_validated_at: string | null
          birth_date: string
          created_at: string
          created_by: string | null
          created_via: Database["public"]["Enums"]["child_created_via"]
          deleted_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          enrollment_status: Database["public"]["Enums"]["child_enrollment_status"]
          first_name: string
          id: string
          image_rights: boolean
          image_rights_date: string | null
          last_name: string
          medical_notes: string | null
          notes: string | null
          outing_auth_date: string | null
          outing_authorization: boolean
          school_class: string | null
          school_name: string | null
          status: Database["public"]["Enums"]["child_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allergies?: string | null
          anonymized_at?: string | null
          asbl_validated_at?: string | null
          birth_date: string
          created_at?: string
          created_by?: string | null
          created_via?: Database["public"]["Enums"]["child_created_via"]
          deleted_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          enrollment_status?: Database["public"]["Enums"]["child_enrollment_status"]
          first_name: string
          id?: string
          image_rights?: boolean
          image_rights_date?: string | null
          last_name: string
          medical_notes?: string | null
          notes?: string | null
          outing_auth_date?: string | null
          outing_authorization?: boolean
          school_class?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["child_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allergies?: string | null
          anonymized_at?: string | null
          asbl_validated_at?: string | null
          birth_date?: string
          created_at?: string
          created_by?: string | null
          created_via?: Database["public"]["Enums"]["child_created_via"]
          deleted_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          enrollment_status?: Database["public"]["Enums"]["child_enrollment_status"]
          first_name?: string
          id?: string
          image_rights?: boolean
          image_rights_date?: string | null
          last_name?: string
          medical_notes?: string | null
          notes?: string | null
          outing_auth_date?: string | null
          outing_authorization?: boolean
          school_class?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["child_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "children_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          can_pickup: boolean
          child_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_primary: boolean
          last_name: string
          phone: string
          relation: Database["public"]["Enums"]["guardian_relation"]
          updated_at: string
        }
        Insert: {
          can_pickup?: boolean
          child_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean
          last_name: string
          phone: string
          relation: Database["public"]["Enums"]["guardian_relation"]
          updated_at?: string
        }
        Update: {
          can_pickup?: boolean
          child_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean
          last_name?: string
          phone?: string
          relation?: Database["public"]["Enums"]["guardian_relation"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_audit: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_hash: string | null
          metadata: Json
          occurred_at: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          occurred_at?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_audit_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          asbl_validated_at: string | null
          child_id: string
          created_at: string
          fee_cents: number
          id: string
          parent_id: string
          plan: Database["public"]["Enums"]["membership_plan"]
          school_year: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
        }
        Insert: {
          asbl_validated_at?: string | null
          child_id: string
          created_at?: string
          fee_cents?: number
          id?: string
          parent_id: string
          plan?: Database["public"]["Enums"]["membership_plan"]
          school_year: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Update: {
          asbl_validated_at?: string | null
          child_id?: string
          created_at?: string
          fee_cents?: number
          id?: string
          parent_id?: string
          plan?: Database["public"]["Enums"]["membership_plan"]
          school_year?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_child_links: {
        Row: {
          child_id: string
          created_at: string
          guardian_id: string | null
          id: string
          parent_id: string
          verified_at: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          guardian_id?: string | null
          id?: string
          parent_id: string
          verified_at?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          guardian_id?: string | null
          id?: string
          parent_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_child_links_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_child_links_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_child_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          child_id: string
          created_at: string
          currency: string
          id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          paid_at: string | null
          parent_id: string
          provider: Database["public"]["Enums"]["payment_provider"] | null
          provider_payment_id: string | null
          purpose: Database["public"]["Enums"]["payment_purpose"] | null
          reference_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          child_id: string
          created_at?: string
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string | null
          parent_id: string
          provider?: Database["public"]["Enums"]["payment_provider"] | null
          provider_payment_id?: string | null
          purpose?: Database["public"]["Enums"]["payment_purpose"] | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          child_id?: string
          created_at?: string
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string | null
          parent_id?: string
          provider?: Database["public"]["Enums"]["payment_provider"] | null
          provider_payment_id?: string | null
          purpose?: Database["public"]["Enums"]["payment_purpose"] | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          signup_source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signup_source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signup_source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      school_support_enrollment_slots: {
        Row: {
          created_at: string
          enrollment_id: string
          id: string
          slot_id: string
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          id?: string
          slot_id: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          id?: string
          slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_support_enrollment_slots_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "school_support_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_support_enrollment_slots_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "school_support_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      school_support_enrollments: {
        Row: {
          cancelled_at: string | null
          child_id: string
          enrolled_at: string
          enrolled_by: string | null
          id: string
          membership_id: string | null
          parent_id: string
          program_id: string
          status: Database["public"]["Enums"]["school_support_enrollment_status"]
        }
        Insert: {
          cancelled_at?: string | null
          child_id: string
          enrolled_at?: string
          enrolled_by?: string | null
          id?: string
          membership_id?: string | null
          parent_id: string
          program_id: string
          status?: Database["public"]["Enums"]["school_support_enrollment_status"]
        }
        Update: {
          cancelled_at?: string | null
          child_id?: string
          enrolled_at?: string
          enrolled_by?: string | null
          id?: string
          membership_id?: string | null
          parent_id?: string
          program_id?: string
          status?: Database["public"]["Enums"]["school_support_enrollment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "school_support_enrollments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_support_enrollments_enrolled_by_fkey"
            columns: ["enrolled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_support_enrollments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_support_enrollments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_support_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "school_support_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      school_support_programs: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          max_participants: number | null
          parent_registration_open: boolean
          school_year: string
          status: Database["public"]["Enums"]["school_support_program_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          max_participants?: number | null
          parent_registration_open?: boolean
          school_year: string
          status?: Database["public"]["Enums"]["school_support_program_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          max_participants?: number | null
          parent_registration_open?: boolean
          school_year?: string
          status?: Database["public"]["Enums"]["school_support_program_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_support_programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_support_programs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      school_support_slots: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string | null
          id: string
          label: string | null
          location: string | null
          max_participants: number | null
          program_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time?: string | null
          id?: string
          label?: string | null
          location?: string | null
          max_participants?: number | null
          program_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string | null
          id?: string
          label?: string | null
          location?: string | null
          max_participants?: number | null
          program_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_support_slots_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "school_support_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_time_balances: {
        Row: {
          balance_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_time_contracts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          max_credit_minutes: number
          max_debit_minutes: number
          period_type: Database["public"]["Enums"]["staff_time_period"]
          target_minutes: number
          tolerance_minutes: number
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string | null
          work_days: number[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          max_credit_minutes?: number
          max_debit_minutes?: number
          period_type?: Database["public"]["Enums"]["staff_time_period"]
          target_minutes: number
          tolerance_minutes?: number
          updated_at?: string
          user_id: string
          valid_from?: string
          valid_until?: string | null
          work_days?: number[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          max_credit_minutes?: number
          max_debit_minutes?: number
          period_type?: Database["public"]["Enums"]["staff_time_period"]
          target_minutes?: number
          tolerance_minutes?: number
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
          work_days?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_time_contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_time_entries: {
        Row: {
          adjusted_at: string | null
          adjusted_by: string | null
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          note: string | null
          started_at: string
          status: Database["public"]["Enums"]["staff_time_entry_status"]
          user_id: string
        }
        Insert: {
          adjusted_at?: string | null
          adjusted_by?: string | null
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          note?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["staff_time_entry_status"]
          user_id: string
        }
        Update: {
          adjusted_at?: string | null
          adjusted_by?: string | null
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          note?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["staff_time_entry_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_entries_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_time_ledger: {
        Row: {
          balance_after: number
          contract_id: string | null
          created_at: string
          created_by: string | null
          delta_minutes: number
          entry_id: string | null
          id: string
          kind: Database["public"]["Enums"]["staff_time_ledger_kind"]
          label: string
          reference_date: string
          user_id: string
        }
        Insert: {
          balance_after: number
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          delta_minutes: number
          entry_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["staff_time_ledger_kind"]
          label: string
          reference_date: string
          user_id: string
        }
        Update: {
          balance_after?: number
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          delta_minutes?: number
          entry_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["staff_time_ledger_kind"]
          label?: string
          reference_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_ledger_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "staff_time_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_time_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_time_ledger_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "staff_time_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_time_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      staff_monthly_flex_report: {
        Row: {
          month_start: string | null
          sessions_count: number | null
          user_id: string | null
          worked_minutes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      anonymize_child: { Args: { p_child_id: string }; Returns: undefined }
      create_parent_enrollment_core: {
        Args: {
          p_allergies: string
          p_birth_date: string
          p_emergency_contact_name: string
          p_emergency_contact_phone: string
          p_first_name: string
          p_guardian_can_pickup: boolean
          p_guardian_email: string
          p_guardian_first_name: string
          p_guardian_last_name: string
          p_guardian_phone: string
          p_guardian_relation: Database["public"]["Enums"]["guardian_relation"]
          p_image_rights: boolean
          p_last_name: string
          p_membership_plan: Database["public"]["Enums"]["membership_plan"]
          p_outing_authorization: boolean
          p_school_class: string
          p_school_name: string
          p_school_year: string
        }
        Returns: Json
      }
      current_school_year: { Args: never; Returns: string }
      expected_membership_fee_cents: {
        Args: {
          p_plan: Database["public"]["Enums"]["membership_plan"]
          p_school_year: string
        }
        Returns: number
      }
      get_child_enrollment_state: {
        Args: { p_child_id: string; p_school_year?: string | null }
        Returns: Json
      }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_active_user: { Args: never; Returns: boolean }
      is_parent: { Args: never; Returns: boolean }
      is_staff_clockable: { Args: never; Returns: boolean }
      is_staff_full: { Args: never; Returns: boolean }
      is_staff_limited: { Args: never; Returns: boolean }
      is_staff_time_admin: { Args: never; Returns: boolean }
      my_editable_parent_enrollment_child_ids: {
        Args: never
        Returns: string[]
      }
      my_parent_child_ids: { Args: never; Returns: string[] }
      my_verified_child_ids: { Args: never; Returns: string[] }
      request_school_support_upgrade: {
        Args: { p_child_id: string }
        Returns: undefined
      }
      settle_staff_time_all_for_date: {
        Args: { p_reference_date?: string }
        Returns: number
      }
      settle_staff_time_day: {
        Args: { p_reference_date: string; p_user_id: string }
        Returns: string
      }
      sync_enrollment_paid: {
        Args: { p_child_id: string; p_membership_id?: string }
        Returns: undefined
      }
      upsert_staff_contract: {
        Args: {
          p_target_minutes: number
          p_user_id: string
          p_work_days: number[]
        }
        Returns: Json
      }
    }
    Enums: {
      activity_registration_payment_status:
        | "NOT_REQUIRED"
        | "PENDING"
        | "DEFERRED"
        | "PAID"
        | "WAIVED"
      activity_status: "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE"
      child_created_via: "STAFF" | "PARENT"
      child_enrollment_status:
        | "BROUILLON"
        | "EN_ATTENTE_PAIEMENT"
        | "PAYE_EN_ATTENTE_ASBL"
        | "VALIDE"
        | "REFUSE"
      child_status: "ACTIF" | "INACTIF" | "ARCHIVE"
      guardian_relation: "MERE" | "PERE" | "TUTEUR" | "AUTRE"
      membership_plan: "BASE" | "SCHOOL_SUPPORT"
      membership_status:
        | "AWAITING_PAYMENT"
        | "AWAITING_ASBL"
        | "ACTIVE"
        | "REJECTED"
        | "CANCELLED"
      payment_method: "BANCONTACT" | "CARD" | "OTHER"
      payment_provider: "MOLLIE" | "STRIPE"
      payment_purpose: "MEMBERSHIP" | "ACTIVITY"
      payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
      school_support_enrollment_status: "ACTIVE" | "CANCELLED" | "PENDING"
      school_support_program_status: "DRAFT" | "OPEN" | "CLOSED"
      staff_time_entry_status: "OPEN" | "CLOSED" | "ADJUSTED"
      staff_time_ledger_kind:
        | "DAILY_SETTLEMENT"
        | "WEEKLY_SETTLEMENT"
        | "MANUAL_ADJUSTMENT"
        | "RECOVERY_REQUEST"
        | "PERIOD_RESET"
      staff_time_period: "DAILY" | "WEEKLY"
      user_role: "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE" | "PARENT"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      activity_registration_payment_status: [
        "NOT_REQUIRED",
        "PENDING",
        "DEFERRED",
        "PAID",
        "WAIVED",
      ],
      activity_status: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"],
      child_created_via: ["STAFF", "PARENT"],
      child_enrollment_status: [
        "BROUILLON",
        "EN_ATTENTE_PAIEMENT",
        "PAYE_EN_ATTENTE_ASBL",
        "VALIDE",
        "REFUSE",
      ],
      child_status: ["ACTIF", "INACTIF", "ARCHIVE"],
      guardian_relation: ["MERE", "PERE", "TUTEUR", "AUTRE"],
      membership_plan: ["BASE", "SCHOOL_SUPPORT"],
      membership_status: [
        "AWAITING_PAYMENT",
        "AWAITING_ASBL",
        "ACTIVE",
        "REJECTED",
        "CANCELLED",
      ],
      payment_method: ["BANCONTACT", "CARD", "OTHER"],
      payment_provider: ["MOLLIE", "STRIPE"],
      payment_purpose: ["MEMBERSHIP", "ACTIVITY"],
      payment_status: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      school_support_enrollment_status: ["ACTIVE", "CANCELLED", "PENDING"],
      school_support_program_status: ["DRAFT", "OPEN", "CLOSED"],
      staff_time_entry_status: ["OPEN", "CLOSED", "ADJUSTED"],
      staff_time_ledger_kind: [
        "DAILY_SETTLEMENT",
        "WEEKLY_SETTLEMENT",
        "MANUAL_ADJUSTMENT",
        "RECOVERY_REQUEST",
        "PERIOD_RESET",
      ],
      staff_time_period: ["DAILY", "WEEKLY"],
      user_role: ["ADMIN", "TRAVAILLEUR", "STAGIAIRE", "BENEVOLE", "PARENT"],
    },
  },
} as const
