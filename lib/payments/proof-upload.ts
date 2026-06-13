/** Validation fichier preuve de virement (PDF, JPEG, PNG — max 5 Mo). */

export const PROOF_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export type ProofValidationResult =
  | { ok: true; mime: string; ext: string; safeBaseName: string }
  | { ok: false; error: string };

export function validateProofFile(file: File): ProofValidationResult {
  if (!file || file.size <= 0) {
    return { ok: false, error: "proof_missing" };
  }

  if (file.size > PROOF_MAX_BYTES) {
    return { ok: false, error: "proof_too_large" };
  }

  const mime = file.type || "";
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, error: "proof_type" };
  }

  const ext = MIME_TO_EXT[mime];
  const rawName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const safeBaseName = rawName.length > 0 ? rawName : `preuve.${ext}`;

  return { ok: true, mime, ext, safeBaseName };
}

export function buildProofStoragePath(paymentId: string, filename: string): string {
  return `${paymentId}/${filename}`;
}
