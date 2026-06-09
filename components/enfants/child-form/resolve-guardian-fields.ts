import type { ChildWithGuardians } from "@/types/child";
import type { GuardianDefaults, GuardianFieldValues } from "@/components/enfants/child-form/types";

export function resolveGuardianFields(
  child: ChildWithGuardians | undefined,
  guardianDefaults: GuardianDefaults | undefined
): GuardianFieldValues {
  const primaryGuardian =
    child?.guardians.find((g) => g.is_primary) ?? child?.guardians[0];

  return {
    relation: primaryGuardian?.relation ?? guardianDefaults?.relation ?? "MERE",
    firstName: primaryGuardian?.first_name ?? guardianDefaults?.first_name ?? "",
    lastName: primaryGuardian?.last_name ?? guardianDefaults?.last_name ?? "",
    email: primaryGuardian?.email ?? guardianDefaults?.email ?? "",
    phone: primaryGuardian?.phone ?? guardianDefaults?.phone ?? "",
    canPickup: primaryGuardian?.can_pickup ?? true,
  };
}
