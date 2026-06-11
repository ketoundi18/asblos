import { afterEach, describe, expect, it, vi } from "vitest";
import { createAuthUserAdmin } from "./auth-admin-create-user";

const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test_key",
};

describe("createAuthUserAdmin", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("envoie apikey sans Authorization Bearer pour sb_secret", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;

    const nativeFetch = vi.fn(async () =>
      Response.json({
        id: "user-1",
        email: "staff@test.invalid",
        app_metadata: { signup_source: "admin", role: "BENEVOLE" },
      })
    );
    vi.stubGlobal("fetch", nativeFetch);

    const result = await createAuthUserAdmin({
      email: "staff@test.invalid",
      password: "TestPass123!",
      appMetadata: { signup_source: "admin", role: "BENEVOLE", created_by: "asblos_admin" },
      userMetadata: { full_name: "Test Staff" },
    });

    expect(result.error).toBeNull();
    expect(result.user?.id).toBe("user-1");

    const [url, init] = nativeFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://proj.supabase.co/auth/v1/admin/users");
    const headers = new Headers(init.headers);
    expect(headers.get("apikey")).toBe(ENV.SUPABASE_SERVICE_ROLE_KEY);
    expect(headers.get("Authorization")).toBeNull();

    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.app_metadata).toEqual({
      signup_source: "admin",
      role: "BENEVOLE",
      created_by: "asblos_admin",
    });
  });

  it("mappe une erreur Auth", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJ.test.jwt";

    const nativeFetch = vi.fn(async () =>
      Response.json(
        { code: "bad_jwt", msg: "invalid JWT" },
        { status: 403 }
      )
    );
    vi.stubGlobal("fetch", nativeFetch);

    const result = await createAuthUserAdmin({
      email: "staff@test.invalid",
      password: "TestPass123!",
    });

    expect(result.user).toBeNull();
    expect(result.error?.code).toBe("bad_jwt");
    expect(result.error?.message).toContain("invalid JWT");
  });
});
