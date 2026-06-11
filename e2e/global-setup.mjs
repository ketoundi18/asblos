import { cleanupE2eTestData } from "../scripts/cleanup-e2e-data.mjs";

/** Nettoie les données E2E avant la suite Playwright (si Supabase configuré). */
export default async function globalSetup() {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasSupabase) {
    console.log("[e2e] Nettoyage ignoré — Supabase non configuré.");
    return;
  }

  try {
    const result = await cleanupE2eTestData();
    if (result.childrenDeleted > 0 || result.programsDeleted > 0) {
      console.log(
        `[e2e] Nettoyage : ${result.childrenDeleted} enfant(s), ${result.programsDeleted} programme(s).`
      );
    }
  } catch (err) {
    console.warn(`[e2e] Nettoyage E2E ignoré : ${err.message ?? err}`);
  }
}
