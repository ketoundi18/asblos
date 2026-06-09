"use client";

import { useEffect, useState } from "react";
import { fontBody, fontVariables } from "@/lib/fonts";
import { Button } from "@/components/ui/button";
import "./globals.css";

function loginPathForCurrentArea(): string {
  if (typeof window === "undefined") return "/connexion";
  return window.location.pathname.startsWith("/espace-parents")
    ? "/espace-parents/connexion"
    : "/connexion";
}

function isReactVersionMismatch(message: string): boolean {
  return (
    message.includes("RSC payload") ||
    message.includes("development version of React") ||
    message.includes("Loading chunk") ||
    message.includes("ChunkLoadError")
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [countdown, setCountdown] = useState(5);
  const mismatch = isReactVersionMismatch(error.message ?? "");

  useEffect(() => {
    if (!mismatch) return;

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          window.location.href = loginPathForCurrentArea();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mismatch]);

  return (
    <html lang="fr" className={fontVariables}>
      <body
        className={`${fontBody.className} flex min-h-screen items-center justify-center bg-background p-4 text-foreground antialiased`}
      >
        <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold">AsblOS — Erreur</h2>
          <p className="text-sm text-muted-foreground">
            {mismatch
              ? "Le navigateur et le serveur ne sont plus synchronisés (cache mélangé)."
              : error.message || "Une erreur s'est produite."}
          </p>

          {mismatch ? (
            <div className="rounded-md border border-warning-border bg-warning-muted px-3 py-2 text-left text-sm text-warning-foreground">
              <p className="font-medium">Comment corriger :</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs">
                <li>
                  Terminal → <strong>Ctrl+C</strong>
                </li>
                <li>
                  Puis :{" "}
                  <code className="rounded bg-warning-muted px-1">npm run dev:clean</code>
                </li>
                <li>
                  Ferme <strong>tous</strong> les onglets localhost
                </li>
                <li>
                  Rouvre{" "}
                  <code className="rounded bg-warning-muted px-1">
                    http://localhost:3000
                  </code>
                </li>
                <li>
                  <strong>Cmd+Shift+R</strong> (rechargement forcé)
                </li>
              </ol>
              <p className="mt-2 text-xs">
                Redirection vers la connexion{" "}
                {typeof window !== "undefined" &&
                window.location.pathname.startsWith("/espace-parents")
                  ? "parent"
                  : "staff"}{" "}
                dans <strong>{countdown}s</strong>…
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Astuce : dans le Terminal, fais Ctrl+C puis{" "}
              <code className="rounded bg-muted px-1">npm run dev:clean</code>
            </p>
          )}

          <Button onClick={reset} className="w-full">
            Réessayer
          </Button>
        </div>
      </body>
    </html>
  );
}
