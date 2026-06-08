/** Valide un chemin de redirection interne (évite open redirect). */
export function sanitizeRedirectPath(
  next: string | null | undefined,
  defaultPath = "/"
): string {
  if (!next || typeof next !== "string") {
    return defaultPath;
  }

  const trimmed = next.trim();

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("://") ||
    trimmed.includes("\\") ||
    trimmed.includes("\0")
  ) {
    return defaultPath;
  }

  return trimmed;
}
