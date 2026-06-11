import { describe, expect, it, vi } from "vitest";
import { createAdminCompatibleFetch, isSupabaseSecretApiKey } from "./admin-fetch";

describe("isSupabaseSecretApiKey", () => {
  it("detects sb_secret keys", () => {
    expect(isSupabaseSecretApiKey("sb_secret_abc")).toBe(true);
    expect(isSupabaseSecretApiKey("eyJhbGciOiJIUzI1NiIs")).toBe(false);
  });
});

describe("createAdminCompatibleFetch", () => {
  it("strips Bearer sb_secret on auth admin routes", async () => {
    const secret = "sb_secret_test_key";
    const nativeFetch = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", nativeFetch);

    const wrapped = createAdminCompatibleFetch(secret);
    await wrapped("https://proj.supabase.co/auth/v1/admin/users", {
      headers: {
        apikey: secret,
        Authorization: `Bearer ${secret}`,
      },
    });

    const [, init] = nativeFetch.mock.calls[0] as unknown as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("apikey")).toBe(secret);
    expect(headers.get("Authorization")).toBeNull();

    vi.unstubAllGlobals();
  });

  it("keeps Bearer JWT on auth routes", async () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
    const nativeFetch = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", nativeFetch);

    const wrapped = createAdminCompatibleFetch(jwt);
    await wrapped("https://proj.supabase.co/auth/v1/admin/users", {
      headers: {
        apikey: jwt,
        Authorization: `Bearer ${jwt}`,
      },
    });

    const [, init] = nativeFetch.mock.calls[0] as unknown as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${jwt}`);

    vi.unstubAllGlobals();
  });
});
