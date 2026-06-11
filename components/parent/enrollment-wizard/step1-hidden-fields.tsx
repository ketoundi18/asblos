import type { Step1Draft } from "@/components/parent/enrollment-wizard/types";

type Props = {
  draft: Step1Draft;
};

/** Conserve les champs enfant quand l'étape 1 est démontée (étape 2 active). */
export function Step1HiddenFields({ draft }: Props) {
  return (
    <>
      <input type="hidden" name="first_name" value={draft.first_name} />
      <input type="hidden" name="last_name" value={draft.last_name} />
      <input type="hidden" name="birth_date" value={draft.birth_date} />
      {draft.school_name ? (
        <input type="hidden" name="school_name" value={draft.school_name} />
      ) : null}
      {draft.school_class ? (
        <input type="hidden" name="school_class" value={draft.school_class} />
      ) : null}
      {draft.allergies ? (
        <input type="hidden" name="allergies" value={draft.allergies} />
      ) : null}
      {draft.emergency_contact_name ? (
        <input
          type="hidden"
          name="emergency_contact_name"
          value={draft.emergency_contact_name}
        />
      ) : null}
      {draft.emergency_contact_phone ? (
        <input
          type="hidden"
          name="emergency_contact_phone"
          value={draft.emergency_contact_phone}
        />
      ) : null}
      {draft.image_rights ? (
        <input type="hidden" name="image_rights" value="on" />
      ) : null}
      {draft.outing_authorization ? (
        <input type="hidden" name="outing_authorization" value="on" />
      ) : null}
      <input type="hidden" name="status" value="ACTIF" />
    </>
  );
}
