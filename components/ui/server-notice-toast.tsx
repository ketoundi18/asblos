"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { FlashToast } from "@/lib/messages/flash-messages";

type Props = {
  flash: FlashToast | null | undefined;
};

/** Affiche une fois un toast Sonner pour un message serveur (erreur de chargement, info). */
export function ServerNoticeToast({ flash }: Props) {
  const shown = useRef(false);

  useEffect(() => {
    if (!flash || shown.current) return;
    shown.current = true;

    if (flash.type === "success") {
      toast.success(flash.title, { description: flash.description, duration: 5000 });
    } else if (flash.type === "info") {
      toast.info(flash.title, { description: flash.description, duration: 5000 });
    } else {
      toast.error(flash.title, { description: flash.description, duration: 6000 });
    }
  }, [flash]);

  return null;
}
