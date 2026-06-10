export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE" | "PARENT";
          is_active: boolean;
          phone: string | null;
          signup_source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE" | "PARENT";
          is_active?: boolean;
          phone?: string | null;
          signup_source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE" | "PARENT";
          is_active?: boolean;
          phone?: string | null;
          signup_source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          birth_date: string;
          school_name: string | null;
          school_class: string | null;
          allergies: string | null;
          medical_notes: string | null;
          image_rights: boolean;
          image_rights_date: string | null;
          outing_authorization: boolean;
          outing_auth_date: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          notes: string | null;
          status: "ACTIF" | "INACTIF" | "ARCHIVE";
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          anonymized_at: string | null;
          created_via: "STAFF" | "PARENT";
          enrollment_status:
            | "BROUILLON"
            | "EN_ATTENTE_PAIEMENT"
            | "PAYE_EN_ATTENTE_ASBL"
            | "VALIDE"
            | "REFUSE";
          asbl_validated_at: string | null;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          birth_date: string;
          school_name?: string | null;
          school_class?: string | null;
          allergies?: string | null;
          medical_notes?: string | null;
          image_rights?: boolean;
          image_rights_date?: string | null;
          outing_authorization?: boolean;
          outing_auth_date?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          notes?: string | null;
          status?: "ACTIF" | "INACTIF" | "ARCHIVE";
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          anonymized_at?: string | null;
          created_via?: "STAFF" | "PARENT";
          enrollment_status?:
            | "BROUILLON"
            | "EN_ATTENTE_PAIEMENT"
            | "PAYE_EN_ATTENTE_ASBL"
            | "VALIDE"
            | "REFUSE";
          asbl_validated_at?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          birth_date?: string;
          school_name?: string | null;
          school_class?: string | null;
          allergies?: string | null;
          medical_notes?: string | null;
          image_rights?: boolean;
          image_rights_date?: string | null;
          outing_authorization?: boolean;
          outing_auth_date?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          notes?: string | null;
          status?: "ACTIF" | "INACTIF" | "ARCHIVE";
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          anonymized_at?: string | null;
          created_via?: "STAFF" | "PARENT";
          enrollment_status?:
            | "BROUILLON"
            | "EN_ATTENTE_PAIEMENT"
            | "PAYE_EN_ATTENTE_ASBL"
            | "VALIDE"
            | "REFUSE";
          asbl_validated_at?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          child_id: string;
          parent_id: string;
          amount_cents: number;
          currency: string;
          provider: "MOLLIE" | "STRIPE" | null;
          provider_payment_id: string | null;
          method: "BANCONTACT" | "CARD" | "OTHER" | null;
          status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
          paid_at: string | null;
          purpose: "MEMBERSHIP" | "ACTIVITY" | null;
          reference_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          parent_id: string;
          amount_cents: number;
          currency?: string;
          provider?: "MOLLIE" | "STRIPE" | null;
          provider_payment_id?: string | null;
          method?: "BANCONTACT" | "CARD" | "OTHER" | null;
          status?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
          paid_at?: string | null;
          purpose?: "MEMBERSHIP" | "ACTIVITY" | null;
          reference_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          parent_id?: string;
          amount_cents?: number;
          currency?: string;
          provider?: "MOLLIE" | "STRIPE" | null;
          provider_payment_id?: string | null;
          method?: "BANCONTACT" | "CARD" | "OTHER" | null;
          status?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
          paid_at?: string | null;
          purpose?: "MEMBERSHIP" | "ACTIVITY" | null;
          reference_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      logs_audit: {
        Row: {
          id: string;
          occurred_at: string;
          actor_id: string | null;
          actor_role: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata: Json;
          ip_hash: string | null;
        };
        Insert: {
          id?: string;
          occurred_at?: string;
          actor_id?: string | null;
          actor_role?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata?: Json;
          ip_hash?: string | null;
        };
        Update: {
          id?: string;
          occurred_at?: string;
          actor_id?: string | null;
          actor_role?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          metadata?: Json;
          ip_hash?: string | null;
        };
        Relationships: [];
      };
      staff_time_contracts: {
        Row: {
          id: string;
          user_id: string;
          period_type: "DAILY" | "WEEKLY";
          target_minutes: number;
          work_days: number[];
          valid_from: string;
          valid_until: string | null;
          tolerance_minutes: number;
          max_credit_minutes: number;
          max_debit_minutes: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_type?: "DAILY" | "WEEKLY";
          target_minutes: number;
          work_days?: number[];
          valid_from?: string;
          valid_until?: string | null;
          tolerance_minutes?: number;
          max_credit_minutes?: number;
          max_debit_minutes?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_type?: "DAILY" | "WEEKLY";
          target_minutes?: number;
          work_days?: number[];
          valid_from?: string;
          valid_until?: string | null;
          tolerance_minutes?: number;
          max_credit_minutes?: number;
          max_debit_minutes?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_time_contracts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_time_entries: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          duration_minutes: number | null;
          status: "OPEN" | "CLOSED" | "ADJUSTED";
          note: string | null;
          adjusted_by: string | null;
          adjusted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          ended_at?: string | null;
          status?: "OPEN" | "CLOSED" | "ADJUSTED";
          note?: string | null;
          adjusted_by?: string | null;
          adjusted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          started_at?: string;
          ended_at?: string | null;
          status?: "OPEN" | "CLOSED" | "ADJUSTED";
          note?: string | null;
          adjusted_by?: string | null;
          adjusted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_time_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_time_balances: {
        Row: {
          user_id: string;
          balance_minutes: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance_minutes?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          balance_minutes?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_time_balances_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_time_ledger: {
        Row: {
          id: string;
          user_id: string;
          kind:
            | "DAILY_SETTLEMENT"
            | "WEEKLY_SETTLEMENT"
            | "MANUAL_ADJUSTMENT"
            | "RECOVERY_REQUEST"
            | "PERIOD_RESET";
          delta_minutes: number;
          balance_after: number;
          reference_date: string;
          entry_id: string | null;
          contract_id: string | null;
          label: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind:
            | "DAILY_SETTLEMENT"
            | "WEEKLY_SETTLEMENT"
            | "MANUAL_ADJUSTMENT"
            | "RECOVERY_REQUEST"
            | "PERIOD_RESET";
          delta_minutes: number;
          balance_after: number;
          reference_date: string;
          entry_id?: string | null;
          contract_id?: string | null;
          label: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?:
            | "DAILY_SETTLEMENT"
            | "WEEKLY_SETTLEMENT"
            | "MANUAL_ADJUSTMENT"
            | "RECOVERY_REQUEST"
            | "PERIOD_RESET";
          delta_minutes?: number;
          balance_after?: number;
          reference_date?: string;
          entry_id?: string | null;
          contract_id?: string | null;
          label?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_time_ledger_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      asbl_settings: {
        Row: {
          id: string;
          school_year: string;
          enrollment_fee_cents: number;
          school_support_fee_cents: number;
          currency: string;
          effective_from: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_year: string;
          enrollment_fee_cents?: number;
          school_support_fee_cents?: number;
          currency?: string;
          effective_from?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_year?: string;
          enrollment_fee_cents?: number;
          school_support_fee_cents?: number;
          currency?: string;
          effective_from?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          child_id: string;
          parent_id: string;
          school_year: string;
          plan: "BASE" | "SCHOOL_SUPPORT";
          fee_cents: number;
          status:
            | "AWAITING_PAYMENT"
            | "AWAITING_ASBL"
            | "ACTIVE"
            | "REJECTED"
            | "CANCELLED";
          asbl_validated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          parent_id: string;
          school_year: string;
          plan?: "BASE" | "SCHOOL_SUPPORT";
          fee_cents?: number;
          status:
            | "AWAITING_PAYMENT"
            | "AWAITING_ASBL"
            | "ACTIVE"
            | "REJECTED"
            | "CANCELLED";
          asbl_validated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          parent_id?: string;
          school_year?: string;
          plan?: "BASE" | "SCHOOL_SUPPORT";
          fee_cents?: number;
          status?:
            | "AWAITING_PAYMENT"
            | "AWAITING_ASBL"
            | "ACTIVE"
            | "REJECTED"
            | "CANCELLED";
          asbl_validated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guardians: {
        Row: {
          id: string;
          child_id: string;
          relation: "MERE" | "PERE" | "TUTEUR" | "AUTRE";
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string;
          is_primary: boolean;
          can_pickup: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          relation: "MERE" | "PERE" | "TUTEUR" | "AUTRE";
          first_name: string;
          last_name: string;
          email?: string | null;
          phone: string;
          is_primary?: boolean;
          can_pickup?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          relation?: "MERE" | "PERE" | "TUTEUR" | "AUTRE";
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string;
          is_primary?: boolean;
          can_pickup?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guardians_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
      activities: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          activity_date: string;
          start_time: string | null;
          end_time: string | null;
          location: string | null;
          max_participants: number | null;
          status: "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          price_cents: number;
          parent_registration_open: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          activity_date: string;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          max_participants?: number | null;
          status?: "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          price_cents?: number;
          parent_registration_open?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          activity_date?: string;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          max_participants?: number | null;
          status?: "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          price_cents?: number;
          parent_registration_open?: boolean;
        };
        Relationships: [];
      };
      activity_registrations: {
        Row: {
          id: string;
          activity_id: string;
          child_id: string;
          registered_by: string | null;
          registered_at: string;
          cancelled_at: string | null;
          payment_status:
            | "NOT_REQUIRED"
            | "PENDING"
            | "DEFERRED"
            | "PAID"
            | "WAIVED";
        };
        Insert: {
          id?: string;
          activity_id: string;
          child_id: string;
          registered_by?: string | null;
          registered_at?: string;
          cancelled_at?: string | null;
          payment_status?:
            | "NOT_REQUIRED"
            | "PENDING"
            | "DEFERRED"
            | "PAID"
            | "WAIVED";
        };
        Update: {
          id?: string;
          activity_id?: string;
          child_id?: string;
          registered_by?: string | null;
          registered_at?: string;
          cancelled_at?: string | null;
          payment_status?:
            | "NOT_REQUIRED"
            | "PENDING"
            | "DEFERRED"
            | "PAID"
            | "WAIVED";
        };
        Relationships: [
          {
            foreignKeyName: "activity_registrations_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_registrations_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_attendance: {
        Row: {
          id: string;
          activity_id: string;
          child_id: string;
          is_present: boolean;
          notes: string | null;
          marked_by: string | null;
          marked_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          child_id: string;
          is_present: boolean;
          notes?: string | null;
          marked_by?: string | null;
          marked_at?: string;
        };
        Update: {
          id?: string;
          activity_id?: string;
          child_id?: string;
          is_present?: boolean;
          notes?: string | null;
          marked_by?: string | null;
          marked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_attendance_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_attendance_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
      school_support_programs: {
        Row: {
          id: string;
          school_year: string;
          title: string;
          description: string | null;
          max_participants: number | null;
          status: "DRAFT" | "OPEN" | "CLOSED";
          parent_registration_open: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_year: string;
          title: string;
          description?: string | null;
          max_participants?: number | null;
          status?: "DRAFT" | "OPEN" | "CLOSED";
          parent_registration_open?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_year?: string;
          title?: string;
          description?: string | null;
          max_participants?: number | null;
          status?: "DRAFT" | "OPEN" | "CLOSED";
          parent_registration_open?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      school_support_slots: {
        Row: {
          id: string;
          program_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string | null;
          location: string | null;
          label: string | null;
          max_participants: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          day_of_week: number;
          start_time: string;
          end_time?: string | null;
          location?: string | null;
          label?: string | null;
          max_participants?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          program_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string | null;
          location?: string | null;
          label?: string | null;
          max_participants?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "school_support_slots_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "school_support_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      school_support_enrollments: {
        Row: {
          id: string;
          program_id: string;
          child_id: string;
          parent_id: string;
          membership_id: string | null;
          status: "PENDING" | "ACTIVE" | "CANCELLED";
          enrolled_by: string | null;
          enrolled_at: string;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          program_id: string;
          child_id: string;
          parent_id: string;
          membership_id?: string | null;
          status?: "PENDING" | "ACTIVE" | "CANCELLED";
          enrolled_by?: string | null;
          enrolled_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          program_id?: string;
          child_id?: string;
          parent_id?: string;
          membership_id?: string | null;
          status?: "PENDING" | "ACTIVE" | "CANCELLED";
          enrolled_by?: string | null;
          enrolled_at?: string;
          cancelled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "school_support_enrollments_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "school_support_programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_support_enrollments_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
      school_support_enrollment_slots: {
        Row: {
          id: string;
          enrollment_id: string;
          slot_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          slot_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          slot_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "school_support_enrollment_slots_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "school_support_enrollments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_support_enrollment_slots_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "school_support_slots";
            referencedColumns: ["id"];
          },
        ];
      };
      parent_child_links: {
        Row: {
          id: string;
          parent_id: string;
          child_id: string;
          guardian_id: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          child_id: string;
          guardian_id?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          child_id?: string;
          guardian_id?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "parent_child_links_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parent_child_links_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      staff_monthly_flex_report: {
        Row: {
          user_id: string | null;
          month_start: string | null;
          worked_minutes: number | null;
          sessions_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE" | "PARENT";
      };
      is_active_user: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      request_school_support_upgrade: {
        Args: { p_child_id: string };
        Returns: null;
      };
      create_parent_enrollment_core: {
        Args: {
          p_first_name: string;
          p_last_name: string;
          p_birth_date: string;
          p_school_name: string;
          p_school_class: string;
          p_allergies: string;
          p_image_rights: boolean;
          p_outing_authorization: boolean;
          p_emergency_contact_name: string;
          p_emergency_contact_phone: string;
          p_guardian_relation: "MERE" | "PERE" | "TUTEUR" | "AUTRE";
          p_guardian_first_name: string;
          p_guardian_last_name: string;
          p_guardian_email: string;
          p_guardian_phone: string;
          p_guardian_can_pickup: boolean;
          p_enrollment_status:
            | "BROUILLON"
            | "EN_ATTENTE_PAIEMENT"
            | "PAYE_EN_ATTENTE_ASBL"
            | "VALIDE"
            | "REFUSE";
          p_membership_plan: "BASE" | "SCHOOL_SUPPORT";
          p_fee_cents: number;
          p_membership_status:
            | "AWAITING_PAYMENT"
            | "AWAITING_ASBL"
            | "ACTIVE"
            | "REJECTED"
            | "CANCELLED";
          p_school_year: string;
        };
        Returns: Json;
      };
      anonymize_child: {
        Args: { p_child_id: string };
        Returns: null;
      };
      expected_membership_fee_cents: {
        Args: {
          p_plan: "BASE" | "SCHOOL_SUPPORT";
          p_school_year: string;
        };
        Returns: number;
      };
      is_staff_limited: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_staff_clockable: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_staff_time_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      settle_staff_time_day: {
        Args: {
          p_user_id: string;
          p_reference_date: string;
        };
        Returns: string | null;
      };
      settle_staff_time_all_for_date: {
        Args: {
          p_reference_date?: string;
        };
        Returns: number;
      };
      upsert_staff_contract: {
        Args: {
          p_user_id: string;
          p_target_minutes: number;
          p_work_days: number[];
        };
        Returns: Json;
      };
      sync_enrollment_paid: {
        Args: {
          p_child_id: string;
          p_membership_id?: string | null;
        };
        Returns: null;
      };
    };
    Enums: {
      user_role: "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE" | "PARENT";
      child_status: "ACTIF" | "INACTIF" | "ARCHIVE";
      child_created_via: "STAFF" | "PARENT";
      child_enrollment_status:
        | "BROUILLON"
        | "EN_ATTENTE_PAIEMENT"
        | "PAYE_EN_ATTENTE_ASBL"
        | "VALIDE"
        | "REFUSE";
      guardian_relation: "MERE" | "PERE" | "TUTEUR" | "AUTRE";
      payment_provider: "MOLLIE" | "STRIPE";
      payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
      payment_method: "BANCONTACT" | "CARD" | "OTHER";
      payment_purpose: "MEMBERSHIP" | "ACTIVITY";
      membership_status:
        | "AWAITING_PAYMENT"
        | "AWAITING_ASBL"
        | "ACTIVE"
        | "REJECTED"
        | "CANCELLED";
      membership_plan: "BASE" | "SCHOOL_SUPPORT";
      activity_status: "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";
      school_support_program_status: "DRAFT" | "OPEN" | "CLOSED";
      school_support_enrollment_status: "PENDING" | "ACTIVE" | "CANCELLED";
      registration_payment_status:
        | "NOT_REQUIRED"
        | "PENDING"
        | "DEFERRED"
        | "PAID"
        | "WAIVED";
      staff_time_period: "DAILY" | "WEEKLY";
      staff_time_entry_status: "OPEN" | "CLOSED" | "ADJUSTED";
      staff_time_ledger_kind:
        | "DAILY_SETTLEMENT"
        | "WEEKLY_SETTLEMENT"
        | "MANUAL_ADJUSTMENT"
        | "RECOVERY_REQUEST"
        | "PERIOD_RESET";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
