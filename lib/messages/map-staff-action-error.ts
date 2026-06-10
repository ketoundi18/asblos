/** Messages staff opaques — jamais de error.message Postgres/SQL dans l'UI. */

import { reportError } from "@/lib/monitoring/report-error";

export function mapActivityInsertError(message: string | undefined): string {
  if (
    message?.includes("price_cents") ||
    message?.includes("parent_registration")
  ) {
    return "Applique 012_activity_parent_options.sql dans Supabase, puis réessaie.";
  }

  if (message) {
    void reportError(new Error(message), {
      surface: "activity-insert",
    });
  }

  return "Impossible de créer l'activité. Réessaie dans un instant.";
}
