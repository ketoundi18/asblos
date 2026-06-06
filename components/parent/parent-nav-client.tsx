"use client";

import { usePathname } from "next/navigation";
import { ParentNav } from "@/components/parent/parent-nav";

export function ParentNavClient() {
  const pathname = usePathname();
  return <ParentNav pathname={pathname} />;
}
