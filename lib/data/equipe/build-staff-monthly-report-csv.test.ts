import { describe, expect, it } from "vitest";
import { buildStaffMonthlyReportCsv } from "@/lib/data/equipe/build-staff-monthly-report-csv";
import type { StaffMonthlyReportRow } from "@/lib/data/equipe/get-staff-monthly-report";

describe("buildStaffMonthlyReportCsv", () => {
  it("génère un CSV BE avec BOM et séparateur ;", () => {
    const rows: StaffMonthlyReportRow[] = [
      {
        userId: "u1",
        fullName: "Marie Dupont",
        role: "TRAVAILLEUR",
        workedMinutes: 90,
        sessionsCount: 2,
        balanceMinutes: 30,
        targetMinutesPerDay: 480,
      },
    ];

    const csv = buildStaffMonthlyReportCsv(rows, "juin 2026");

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Mois;Nom;Rôle");
    expect(csv).toContain("juin 2026;Marie Dupont");
    expect(csv).toContain("\r\n");
  });

  it("échappe un nom contenant ; sans casser les colonnes", () => {
    const rows: StaffMonthlyReportRow[] = [
      {
        userId: "u2",
        fullName: "Lucas; Nolan",
        role: "BENEVOLE",
        workedMinutes: 0,
        sessionsCount: 0,
        balanceMinutes: 0,
        targetMinutesPerDay: null,
      },
    ];

    const csv = buildStaffMonthlyReportCsv(rows, "juin 2026");
    const dataLine = csv.split("\r\n")[1];

    expect(dataLine).toContain('"Lucas; Nolan"');
    expect(dataLine?.split(";").length).toBeGreaterThanOrEqual(7);
  });
});
