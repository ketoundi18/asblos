import { describe, expect, it } from "vitest";
import { isAdminOnlyRoute } from "@/lib/auth/admin-routes";

describe("isAdminOnlyRoute", () => {
  it("bloque /administration et sous-pages", () => {
    expect(isAdminOnlyRoute("/administration")).toBe(true);
    expect(isAdminOnlyRoute("/administration/foo")).toBe(true);
  });

  it("bloque /equipe, /rapports et export API", () => {
    expect(isAdminOnlyRoute("/equipe/membres")).toBe(true);
    expect(isAdminOnlyRoute("/rapports")).toBe(true);
    expect(isAdminOnlyRoute("/api/equipe/rapport/export")).toBe(true);
  });

  it("laisse passer les routes staff courantes", () => {
    expect(isAdminOnlyRoute("/")).toBe(false);
    expect(isAdminOnlyRoute("/enfants")).toBe(false);
    expect(isAdminOnlyRoute("/mon-service")).toBe(false);
    expect(isAdminOnlyRoute("/soutien-scolaire")).toBe(false);
  });
});
