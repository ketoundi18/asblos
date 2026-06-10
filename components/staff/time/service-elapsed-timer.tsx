"use client";

import { useEffect, useState } from "react";
import { formatElapsedSince } from "@/lib/data/staff-time/format-duration";

type Props = {
  startedAt: string;
};

/** Compte le temps écoulé depuis le début du service (rafraîchi chaque seconde). */
export function ServiceElapsedTimer({ startedAt }: Props) {
  const [label, setLabel] = useState(() => formatElapsedSince(startedAt));

  useEffect(() => {
    const tick = () => setLabel(formatElapsedSince(startedAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  return (
    <p
      className="font-heading text-5xl font-bold tabular-nums tracking-tight text-primary"
      aria-live="polite"
    >
      {label}
    </p>
  );
}
