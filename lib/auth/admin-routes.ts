/** Routes réservées ADMIN — aligné sur layout staff et canManageUsers / canExportReports. */
export const ADMIN_ROUTE_PREFIXES = [
  "/administration",
  "/equipe",
  "/rapports",
  "/api/equipe",
] as const;

export function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isAdminRole(role: string): boolean {
  return role === "ADMIN";
}
