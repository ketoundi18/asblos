"use client";

import { usePathname } from "next/navigation";
import {
  ParentDesktopNav,
  ParentMobileNav,
} from "@/components/parent/parent-nav";
import { ParentInscribeFab } from "@/components/parent/parent-inscribe-fab";
import { shouldHideParentMobileChrome } from "@/lib/parent/parent-mobile-chrome";

export function ParentNavClient() {
  const pathname = usePathname();
  const hideMobileChrome = shouldHideParentMobileChrome(pathname);

  return (
    <>
      <ParentDesktopNav pathname={pathname} />
      {!hideMobileChrome ? <ParentMobileNav pathname={pathname} /> : null}
      <ParentInscribeFab />
    </>
  );
}
