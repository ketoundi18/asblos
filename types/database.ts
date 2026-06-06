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
          role?: "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE";
          is_active?: boolean;
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
      asbl_settings: {
        Row: {
          id: string;
          school_year: string;
          enrollment_fee_cents: number;
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
        Relationships: [];
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
        };
        Insert: {
          id?: string;
          activity_id: string;
          child_id: string;
          registered_by?: string | null;
          registered_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          activity_id?: string;
          child_id?: string;
          registered_by?: string | null;
          registered_at?: string;
          cancelled_at?: string | null;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE" | "PARENT";
      };
      is_active_user: {
        Args: Record<string, never>;
        Returns: boolean;
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
      activity_status: "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";
    };
  };
};
