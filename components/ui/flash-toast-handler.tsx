"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  hasFlashParams,
  resolveFlashToast,
  stripFlashParams,
  type FlashAudience,
} from "@/lib/messages/flash-messages";

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
      audience,
    });

    if (flash) {
      if (flash.type === "success") {
        toast.success(flash.title, { description: flash.description, duration: 5000 });
      } else if (flash.type === "info") {
        toast.info(flash.title, { description: flash.description, duration: 5000 });
      } else {
        toast.error(flash.title, { description: flash.description, duration: 6000 });
      }
    }

    const cleanUrl = stripFlashParams(pathname, search);
    router.replace(cleanUrl, { scroll: false });
  }, [search, pathname, router, searchParams]);

  return null;
}
