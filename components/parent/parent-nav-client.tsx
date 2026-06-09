"use client";

import { usePathname } from "next/navigation";
import { ParentDesktopNav, ParentMobileNav } from "@/components/parent/parent-nav";

export function ParentNavClient() {
  const pathname = usePathname();
  return (
    <>
      <ParentDesktopNav pathname={pathname} />
      <ParentMobileNav pathname={pathname} />
    </>
  );
}
