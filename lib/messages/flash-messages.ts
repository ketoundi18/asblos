import {
  resolveErrorFlashToast,
  resolveWarningFlashToast,
} from "@/lib/messages/flash-error-messages";
import {
  friendlyLoadError,
  resolveCombinedLoadErrorToast,
  resolveLoadErrorToast,
} from "@/lib/messages/flash-load-errors";
import { resolveSuccessFlashToast } from "@/lib/messages/flash-success-messages";
import {
  FLASH_PARAM_KEYS,
  type FlashAudience,
  type FlashToast,
  type ResolveFlashInput,
} from "@/lib/messages/flash-types";

export type { FlashAudience, FlashToast };
export {
  friendlyLoadError,
  resolveCombinedLoadErrorToast,
  resolveLoadErrorToast,
};

export function resolveFlashToast(input: ResolveFlashInput): FlashToast | null {
  const { success, error, payment, detail, created, toggled, warning, audience } =
    input;

  if (error) {
    return resolveErrorFlashToast(error, detail, audience);
  }

  if (warning) {
    return resolveWarningFlashToast(warning);
  }

  if (success) {
    return resolveSuccessFlashToast(success, payment, audience);
  }

  if (created === "1") {
    return {
      type: "success",
      title: "Activité créée",
      description:
        audience === "staff"
          ? "Pensez à la publier aux parents si ce n'est pas déjà fait."
          : undefined,
    };
  }

  if (toggled === "parent") {
    return {
      type: "success",
      title: "Visibilité mise à jour",
      description: "L'espace parents affiche ou masque l'activité selon votre choix.",
    };
  }

  return null;
}

export function stripFlashParams(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  for (const key of FLASH_PARAM_KEYS) {
    params.delete(key);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function hasFlashParams(search: string): boolean {
  const params = new URLSearchParams(search);
  return FLASH_PARAM_KEYS.some((key) => params.has(key));
}
