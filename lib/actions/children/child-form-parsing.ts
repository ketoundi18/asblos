import { childFormSchema } from "@/lib/validations/child";
export { emptyToNull, mapFieldErrors } from "@/lib/utils/form-utils";

export function parseChildForm(formData: FormData) {
  return childFormSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    birth_date: formData.get("birth_date"),
    school_name: formData.get("school_name") || undefined,
    school_class: formData.get("school_class") || undefined,
    allergies: formData.get("allergies") || undefined,
    medical_notes: formData.get("medical_notes") || undefined,
    image_rights: formData.get("image_rights") === "on",
    image_rights_date: formData.get("image_rights_date") || undefined,
    outing_authorization: formData.get("outing_authorization") === "on",
    outing_auth_date: formData.get("outing_auth_date") || undefined,
    emergency_contact_name: formData.get("emergency_contact_name") || undefined,
    emergency_contact_phone:
      formData.get("emergency_contact_phone") || undefined,
    notes: formData.get("notes") || undefined,
    status: formData.get("status") || "ACTIF",
    guardian_relation: formData.get("guardian_relation"),
    guardian_first_name: formData.get("guardian_first_name"),
    guardian_last_name: formData.get("guardian_last_name"),
    guardian_email: formData.get("guardian_email") || "",
    guardian_phone: formData.get("guardian_phone"),
    guardian_can_pickup: formData.get("guardian_can_pickup") === "on",
  });
}
