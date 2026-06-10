export function staffDetail(
  detail: string | null | undefined,
  fallback: string
): string {
  if (!detail) return fallback;
  try {
    return `${fallback} Détail : ${decodeURIComponent(detail)}`;
  } catch {
    return `${fallback} Détail : ${detail}`;
  }
}
