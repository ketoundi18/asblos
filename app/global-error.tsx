"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 rounded-xl border p-6 text-center">
          <h2 className="text-lg font-semibold">AsblOS — Erreur</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "Une erreur s'est produite."}
          </p>
          <p className="text-xs text-muted-foreground">
            Astuce : dans le Terminal, fais Ctrl+C puis{" "}
            <code className="rounded bg-muted px-1">npm run dev:clean</code>
          </p>
          <Button onClick={reset} className="w-full">
            Réessayer
          </Button>
        </div>
      </body>
    </html>
  );
}
