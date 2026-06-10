import type { FlashAudience, FlashToast } from "@/lib/messages/flash-types";
import {
  PARENT_ERROR_MESSAGES,
  PARENT_GENERIC,
} from "@/lib/messages/flash-errors/parent-errors";
import { buildStaffErrorMessages } from "@/lib/messages/flash-errors/staff-errors";
import { staffDetail } from "@/lib/messages/flash-errors/staff-detail";

export function resolveErrorFlashToast(
  code: string,
  detail: string | null | undefined,
  audience: FlashAudience
): FlashToast {
  if (audience === "parent") {
    if (code === "upgrade" && detail) {
      return PARENT_ERROR_MESSAGES.upgrade ?? PARENT_GENERIC;
    }
    return PARENT_ERROR_MESSAGES[code] ?? PARENT_GENERIC;
  }

  const staffMap = buildStaffErrorMessages(detail);
  return (
    staffMap[code] ?? {
      type: "error",
      title: "Action impossible",
      description: staffDetail(detail, "Réessaie ou vérifie la configuration."),
    }
  );
}
