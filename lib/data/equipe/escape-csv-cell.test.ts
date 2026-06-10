import { describe, expect, it } from "vitest";
import { escapeCsvCell } from "@/lib/data/equipe/escape-csv-cell";

describe("escapeCsvCell", () => {
  it("neutralise une formule Excel (=)", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
  });

  it("échappe un point-virgule dans le nom", () => {
    expect(escapeCsvCell("Dupont; Marie")).toBe('"Dupont; Marie"');
  });

  it("échappe les guillemets doubles", () => {
    expect(escapeCsvCell('Nolan "Lu" cas')).toBe('"Nolan ""Lu"" cas"');
  });
});
