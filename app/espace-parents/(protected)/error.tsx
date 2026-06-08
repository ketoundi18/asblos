"use client";

import { ErrorRecoveryPanel } from "@/components/ui/error-recovery-panel";

export default function EspaceParentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorRecoveryPanel
      error={error}
      reset={reset}
      title="Oups — un petit souci technique"
    />
  );
}
