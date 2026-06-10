"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { FlashToast } from "@/lib/messages/flash-messages";
import { showFlashToast } from "@/lib/messages/show-flash-toast";
import { buildToastDedupeKey } from "@/lib/messages/toast-dedupe";

type Props = {
  flash: FlashToast | null | undefined;
};

/** Affiche une fois un toast Sonner pour un message serveur (erreur de chargement, info). */
export function ServerNoticeToast({ flash }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!flash) return;

    const key = buildToastDedupeKey([pathname, flash.type, flash.title, flash.description]);
    showFlashToast(flash, key);
  }, [flash, pathname]);

  return null;
}
