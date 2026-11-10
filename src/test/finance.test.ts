import { describe, it, expect } from "vitest";
import { parseAmount, validateEntry, variationPct, filterExpenses, type Expense } from "@/lib/finance";
import { buildCSV } from "@/lib/export";

describe("parseAmount", () => {
  it("aceita formatos brasileiros e simples", () => {
    expect(parseAmount("1.234,56")).toBe(1234.56);
    expect(parseAmount("12,5")).toBe(12.5);
    expect(parseAmount("12.5")).toBe(12.5);
    expect(parseAmount("R$ 10")).toBe(10);
  });
  it("rejeita lixo", () => {
    expect(parseAmount("")).toBeNaN();
    expect(parseAmount("abc")).toBeNaN();
    expect(parseAmount("-5")).toBeNaN();
  });
});

describe("validateEntry", () => {
  it("valida descrição e valor", () => {
    expect(validateEntry("", NaN, "a descrição")).toEqual({
      description: "Informe a descrição",
      amount: "Informe um valor válido (ex.: 1.234,56)",
    });
    expect(validateEntry("Aluguel", 0, "x").amount).toBeDefined();
    expect(validateEntry("Aluguel", 10, "x")).toEqual({});
  });
});

describe("variationPct", () => {
  it("calcula variação e trata base zero", () => {
    expect(variationPct(150, 100)).toBe(50);
    expect(variationPct(50, 100)).toBe(-50);
    expect(variationPct(10, 0)).toBeNull();
  });
});

const exp = (description: string, category: Expense["category"]): Expense => ({
  id: description, description, amount: 10, category, createdAt: 0,
});

describe("filterExpenses", () => {
  const list = [exp("Mercado", "fixed"), exp("Café", "variable")];
  it("ignora acentos e maiúsculas", () => {
    expect(filterExpenses(list, { query: "cafe", category: "all" })).toHaveLength(1);
  });
  it("filtra por categoria", () => {
    expect(filterExpenses(list, { query: "", category: "fixed" })[0].description).toBe("Mercado");
  });
});

describe("buildCSV", () => {
  it("neutraliza fórmulas e usa vírgula decimal", () => {
    const csv = buildCSV([{ ...exp("=1+1", "fixed"), amount: 5.5 }], []);
    expect(csv).toContain(`"'=1+1"`);
    expect(csv).toContain(`"-5,50"`);
  });
});
