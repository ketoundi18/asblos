import { afterEach, describe, expect, it } from "vitest";
import { buildPasswordResetRedirectUrl } from "./password-reset-url";

describe("buildPasswordResetRedirectUrl", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("encode le next vers nouveau-mot-de-passe staff", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://monasbl.be";
    expect(buildPasswordResetRedirectUrl("staff")).toBe(
      "https://monasbl.be/auth/callback?next=%2Fauth%2Fnouveau-mot-de-passe%3Fchannel%3Dstaff"
    );
  });

  it("encode le next vers nouveau-mot-de-passe parent", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://monasbl.be";
    expect(buildPasswordResetRedirectUrl("parent")).toContain("channel%3Dparent");
  });
});
