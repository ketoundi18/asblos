"use client";

import { Button } from "@/components/ui/button";

export default function EnfantsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="text-lg font-semibold text-destructive">
        Impossible d&apos;afficher les enfants
      </h2>
      <p className="text-sm text-muted-foreground">
        {error.message ||
          "Une erreur inattendue s'est produite. Réessaie dans un instant."}
      </p>
      <Button onClick={reset} className="w-full">
        Réessayer
      </Button>
    </div>
  );
}
