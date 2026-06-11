/**
 * Supprime les données créées par les tests Playwright (enfants E2E*, programmes E2E Soutien*).
 * Usage : node scripts/cleanup-e2e-data.mjs
 * Prérequis : .env.local avec SUPABASE_SERVICE_ROLE_KEY + E2E_PARENT_EMAIL
 */
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  const file = resolve(root, ".env.local");
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const E2E_CHILD_LAST_NAME = "Playwright";
const E2E_CHILD_FIRST_PREFIX = "E2E";
const E2E_PROGRAM_TITLE_PREFIX = "E2E Soutien";

function isE2eChild(row) {
  const first = row.first_name?.trim() ?? "";
  const last = row.last_name?.trim() ?? "";
  return first.startsWith(E2E_CHILD_FIRST_PREFIX) && last === E2E_CHILD_LAST_NAME;
}

export async function cleanupE2eTestData(options = {}) {
  const dryRun = options.dryRun ?? false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const parentEmail = process.env.E2E_PARENT_EMAIL?.trim();

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis (.env.local)."
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let childIds = [];

  if (parentEmail) {
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, email")
      .eq("email", parentEmail)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Profil parent introuvable : ${profileError.message}`);
    }

    if (profile?.id) {
      const { data: links, error: linksError } = await admin
        .from("parent_child_links")
        .select("child_id")
        .eq("parent_id", profile.id);

      if (linksError) {
        throw new Error(`Liens parent-enfant : ${linksError.message}`);
      }

      const linkedIds = [...new Set((links ?? []).map((l) => l.child_id))];
      if (linkedIds.length > 0) {
        const { data: children, error: childrenError } = await admin
          .from("children")
          .select("id, first_name, last_name")
          .in("id", linkedIds)
          .is("deleted_at", null);

        if (childrenError) {
          throw new Error(`Lecture enfants : ${childrenError.message}`);
        }

        childIds = (children ?? []).filter(isE2eChild).map((c) => c.id);
      }
    }
  }

  // Orphelins E2E (anciens tests sans lien ou lien cassé)
  const { data: orphanChildren, error: orphanError } = await admin
    .from("children")
    .select("id, first_name, last_name")
    .is("deleted_at", null)
    .like("first_name", `${E2E_CHILD_FIRST_PREFIX}%`)
    .eq("last_name", E2E_CHILD_LAST_NAME);

  if (orphanError) {
    throw new Error(`Recherche orphelins E2E : ${orphanError.message}`);
  }

  for (const row of orphanChildren ?? []) {
    if (isE2eChild(row) && !childIds.includes(row.id)) {
      childIds.push(row.id);
    }
  }

  const { data: programs, error: programsError } = await admin
    .from("school_support_programs")
    .select("id, title")
    .like("title", `${E2E_PROGRAM_TITLE_PREFIX}%`);

  if (programsError) {
    throw new Error(`Programmes soutien : ${programsError.message}`);
  }

  const programIds = (programs ?? []).map((p) => p.id);

  if (dryRun) {
    return {
      dryRun: true,
      childrenDeleted: childIds.length,
      programsDeleted: programIds.length,
      childIds,
      programIds,
    };
  }

  for (const childId of childIds) {
    const { error } = await admin.from("children").delete().eq("id", childId);
    if (error) {
      throw new Error(`Suppression enfant ${childId} : ${error.message}`);
    }
  }

  for (const programId of programIds) {
    const { error } = await admin
      .from("school_support_programs")
      .delete()
      .eq("id", programId);
    if (error) {
      throw new Error(`Suppression programme ${programId} : ${error.message}`);
    }
  }

  return {
    dryRun: false,
    childrenDeleted: childIds.length,
    programsDeleted: programIds.length,
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const dryRun = process.argv.includes("--dry-run");
  cleanupE2eTestData({ dryRun })
    .then((result) => {
      const mode = result.dryRun ? "(simulation)" : "";
      console.log(
        `Nettoyage E2E ${mode} : ${result.childrenDeleted} enfant(s), ${result.programsDeleted} programme(s) soutien.`
      );
      if (result.dryRun && result.childIds?.length) {
        console.log(`Enfants ciblés : ${result.childIds.length}`);
      }
    })
    .catch((err) => {
      console.error(err.message ?? err);
      process.exit(1);
    });
}
