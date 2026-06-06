export type ChildStatus = "ACTIF" | "INACTIF" | "ARCHIVE";
export type GuardianRelation = "MERE" | "PERE" | "TUTEUR" | "AUTRE";

export type Child = {
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
  status: ChildStatus;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  anonymized_at: string | null;
  created_via?: "STAFF" | "PARENT" | null;
  enrollment_status?:
    | "BROUILLON"
    | "EN_ATTENTE_PAIEMENT"
    | "PAYE_EN_ATTENTE_ASBL"
    | "VALIDE"
    | "REFUSE"
    | null;
  asbl_validated_at?: string | null;
};

export type Guardian = {
  id: string;
  child_id: string;
  relation: GuardianRelation;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  is_primary: boolean;
  can_pickup: boolean;
  created_at: string;
  updated_at: string;
};

export type ChildWithGuardians = Child & {
  guardians: Guardian[];
};

export function getChildFullName(child: Pick<Child, "first_name" | "last_name">) {
  return `${child.first_name} ${child.last_name}`;
}

export function formatBirthDate(date: string) {
  return new Intl.DateTimeFormat("fr-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function getChildAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
