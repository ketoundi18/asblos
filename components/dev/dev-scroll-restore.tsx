"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SCROLL_PREFIX = "asblos-scroll:";

/** En dev, garde la position de scroll entre rechargements HMR / Fast Refresh. */
export function DevScrollRestore() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const key = SCROLL_PREFIX + pathname;
    const saved = sessionStorage.getItem(key);

    if (saved) {
      const y = Number(saved);
      if (!Number.isNaN(y) && y > 0) {
        requestAnimationFrame(() => {
          window.scrollTo(0, y);
        });
      }
    }

    let raf = 0;
    const persist = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        sessionStorage.setItem(key, String(window.scrollY));
      });
    };

    window.addEventListener("scroll", persist, { passive: true });
    persist();

    return () => {
      window.removeEventListener("scroll", persist);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
}
