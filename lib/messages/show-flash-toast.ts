import { toast } from "sonner";
import type { FlashToast } from "@/lib/messages/flash-messages";
import { buildToastDedupeKey, claimToastDisplay } from "@/lib/messages/toast-dedupe";

export function showFlashToast(flash: FlashToast, dedupeKey?: string): void {
  const key = dedupeKey ?? buildToastDedupeKey([flash.type, flash.title, flash.description]);
  if (!claimToastDisplay(key)) return;

  if (flash.type === "success") {
    toast.success(flash.title, { description: flash.description, duration: 5000 });
  } else if (flash.type === "info") {
    toast.info(flash.title, { description: flash.description, duration: 5000 });
  } else {
    toast.error(flash.title, { description: flash.description, duration: 6000 });
  }
}
