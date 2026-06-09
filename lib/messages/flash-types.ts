export type FlashAudience = "parent" | "staff";

export type FlashToast = {
  type: "success" | "error" | "info";
  title: string;
  description?: string;
};

export const FLASH_PARAM_KEYS = [
  "success",
  "error",
  "payment",
  "detail",
  "created",
  "toggled",
  "warning",
] as const;

export type ResolveFlashInput = {
  success?: string | null;
  error?: string | null;
  payment?: string | null;
  detail?: string | null;
  created?: string | null;
  toggled?: string | null;
  warning?: string | null;
  audience: FlashAudience;
};
