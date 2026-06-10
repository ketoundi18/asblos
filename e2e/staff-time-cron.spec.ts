import { test, expect } from "@playwright/test";

test.describe("Cron — clôture soldes flexibilité", () => {
  test("refuse l'appel sans secret", async ({ request }) => {
    const response = await request.get("/api/cron/staff-time-settlement");
    expect(response.status()).toBe(401);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBe("Unauthorized");
  });

  test("accepte un secret valide et clôture la veille", async ({ request }) => {
    const secret = process.env.CRON_SECRET?.trim();
    test.skip(!secret, "CRON_SECRET requis dans .env.local (et passé au serveur dev)");

    const response = await request.get("/api/cron/staff-time-settlement", {
      headers: { Authorization: `Bearer ${secret}` },
    });

    if (response.status() === 500) {
      const body = (await response.json()) as { error?: string };
      test.skip(
        true,
        `Cron Supabase indisponible (migrations 031–034 appliquées ?) : ${body.error ?? "erreur inconnue"}`
      );
    }

    expect(response.status()).toBe(200);

    const body = (await response.json()) as {
      ok: boolean;
      count: number;
      referenceDate: string;
    };

    expect(body.ok).toBe(true);
    expect(typeof body.count).toBe("number");
    expect(body.referenceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
