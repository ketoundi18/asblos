"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
};

function isCacheCorruptionError(message: string): boolean {
  const hints = [
    "ENOENT",
    "routes-manifest",
    "pages-manifest",
    "is not a function",
    "Cannot find module",
    "webpack",
    "Server Action",
    "Loading chunk",
    "ChunkLoadError",
    "failed to fetch dynamically imported module",
  ];
  return hints.some((h) => message.includes(h));
}

function isReactVersionMismatch(message: string): boolean {
  return (
    message.includes("RSC payload") ||
    message.includes("development version of React") ||
    message.includes("Loading chunk") ||
    message.includes("ChunkLoadError")
  );
}

export function ErrorRecoveryPanel({
  error,
  reset,
  title = "Une erreur est survenue",
}: Props) {
  const [countdown, setCountdown] = useState(5);
  const autoRecover = isCacheCorruptionError(error.message ?? "");

  useEffect(() => {
    if (!autoRecover) return;

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          window.location.reload();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRecover]);

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="text-lg font-semibold text-destructive">{title}</h2>
      <p className="text-sm text-muted-foreground">
        {error.message || "Impossible d'afficher cette page."}
      </p>

      {autoRecover ? (
        <div className="rounded-md border border-warning-border bg-warning-muted px-3 py-2 text-sm text-warning-foreground">
          {isReactVersionMismatch(error.message ?? "") ? (
            <>
              Le navigateur a gardé une <strong>ancienne version</strong> de
              l&apos;app (souvent après un <code>npm run build</code> pendant
              que le serveur dev tourne). Rechargement dans{" "}
              <strong>{countdown}s</strong>…
              <br />
              <span className="mt-2 block text-xs">
                Si ça revient : Terminal → Ctrl+C →{" "}
                <code className="rounded bg-warning-muted px-1">npm run dev:reset</code>
                , puis Cmd+Shift+R dans le navigateur.
              </span>
            </>
          ) : (
            <>
              Cache temporairement corrompu — rechargement automatique dans{" "}
              <strong>{countdown}s</strong>. Le serveur se répare tout seul en
              arrière-plan.
            </>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Si le problème persiste : Terminal → Ctrl+C →{" "}
          <code className="rounded bg-muted px-1">npm run dev:reset</code>
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={reset} className="flex-1">
          Réessayer
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => window.location.reload()}
        >
          Recharger la page
        </Button>
      </div>
    </div>
  );
}
