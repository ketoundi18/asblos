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
          role: "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE";
          is_active: boolean;
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
    };
    Views: Record<string, never>;
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE";
      };
      is_active_user: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE";
      child_status: "ACTIF" | "INACTIF" | "ARCHIVE";
      guardian_relation: "MERE" | "PERE" | "TUTEUR" | "AUTRE";
    };
  };
};
