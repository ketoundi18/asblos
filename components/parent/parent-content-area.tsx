"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { shouldHideParentMobileChrome } from "@/lib/parent/parent-mobile-chrome";

export function ParentContentArea({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideMobileChrome = shouldHideParentMobileChrome(pathname);

  return (
    <main
      className={cn(
        "mx-auto w-full max-w-lg flex-1 px-4 py-6",
        hideMobileChrome
          ? "pb-6"
          : "pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-6"
      )}
    >
      {children}
    </main>
  );
}
