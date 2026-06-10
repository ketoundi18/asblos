"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  hasFlashParams,
  resolveFlashToast,
  stripFlashParams,
  type FlashAudience,
} from "@/lib/messages/flash-messages";
import { showFlashToast } from "@/lib/messages/show-flash-toast";
import { buildToastDedupeKey } from "@/lib/messages/toast-dedupe";

export function FlashToastHandler() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const search = searchParams.toString();

  useEffect(() => {
    if (!hasFlashParams(search)) return;

    const audience: FlashAudience = pathname.startsWith("/espace-parents")
      ? "parent"
      : "staff";

    const flash = resolveFlashToast({
      success: searchParams.get("success"),
      error: searchParams.get("error"),
      payment: searchParams.get("payment"),
      detail: searchParams.get("detail"),
      created: searchParams.get("created"),
      toggled: searchParams.get("toggled"),
      warning: searchParams.get("warning"),
      audience,
    });

    if (flash) {
      const key = buildToastDedupeKey([
        pathname,
        search,
        flash.type,
        flash.title,
        flash.description,
      ]);
      showFlashToast(flash, key);
    }

    const cleanUrl = stripFlashParams(pathname, search);
    router.replace(cleanUrl, { scroll: false });
  }, [search, pathname, router, searchParams]);

  return null;
}
