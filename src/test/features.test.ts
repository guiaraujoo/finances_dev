import { describe, it, expect, beforeEach } from "vitest";
import { matchTag, suggestCategory, buildCategoryMemory, tagOf } from "@/lib/categorize";
import { budgetLevel, budgetStatuses, crossedLevel } from "@/lib/budget";
import { buildReport } from "@/lib/reports";
import { goalProgress, validateGoal } from "@/lib/goals";
import { STORAGE_KEY, loadState, sanitizeState } from "@/lib/storage";
import type { Expense, Income } from "@/lib/finance";

const at = (y: number, m: number, d = 10) => new Date(y, m - 1, d, 12).getTime();
let seq = 0;
const exp = (description: string, amount: number, createdAt = at(2026, 11), extra: Partial<Expense> = {}): Expense => ({
  id: `e${++seq}`, description, amount, category: "variable", createdAt, ...extra,
});
const inc = (amount: number, createdAt = at(2026, 11)): Income => ({ id: `i${++seq}`, source: "Salário", amount, createdAt });

describe("categorização automática", () => {
  it("reconhece descrições comuns sem acento e sem diferenciar maiúsculas", () => {
    expect(matchTag("Supermercado Extra")).toBe("mercado");
    expect(matchTag("UBER *trip")).toBe("transporte");
    expect(matchTag("Farmácia São João")).toBe("saude");
    expect(matchTag("Netflix")).toBe("assinaturas");
  });
  it("prefere o termo mais específico e exige palavra inteira em termos curtos", () => {
    expect(matchTag("Compra Mercado Livre")).toBe("compras");
    expect(matchTag("Barbearia")).toBeNull();
    expect(matchTag("Bar do Zé")).toBe("alimentacao");
  });
  it("a escolha anterior do usuário vence a regra", () => {
    const memory = buildCategoryMemory([exp("Padaria", 10, at(2026, 11), { tag: "mercado", category: "fixed" })]);
    expect(suggestCategory("padaria", memory)).toEqual({ tag: "mercado", category: "fixed", source: "history" });
    expect(suggestCategory("Padaria Real", memory)?.source).toBe("rule");
    expect(suggestCategory("x", memory)).toBeNull();
  });
  it("infere a categoria de lançamentos antigos, sem tag", () => {
    expect(tagOf(exp("Aluguel", 1000))).toBe("moradia");
    expect(tagOf(exp("Coisa qualquer", 5, 0, { category: "investment" }))).toBe("investimentos");
    expect(tagOf(exp("Coisa qualquer", 5))).toBe("outros");
  });
});

describe("limites e alertas", () => {
  it("classifica o nível pelo percentual do limite", () => {
    expect(budgetLevel(79, 100)).toBe("ok");
    expect(budgetLevel(80, 100)).toBe("near");
    expect(budgetLevel(100, 100)).toBe("near");
    expect(budgetLevel(100.01, 100)).toBe("over");
  });
  it("só avisa quando o nível piora", () => {
    expect(crossedLevel(50, 85, 100)).toBe("near");
    expect(crossedLevel(85, 90, 100)).toBeNull();
    expect(crossedLevel(90, 120, 100)).toBe("over");
  });
  it("ordena das categorias mais críticas para as mais folgadas", () => {
    const list = [exp("Netflix", 50), exp("iFood", 190)];
    const s = budgetStatuses(list, { assinaturas: 100, alimentacao: 200 }, 0.5);
    expect(s.map((x) => x.tag)).toEqual(["alimentacao", "assinaturas"]);
    expect(s[0]).toMatchObject({ spent: 190, remaining: 10, level: "near", pace: 100 });
  });
});

describe("relatórios", () => {
  const now = at(2026, 11, 20);
  it("agrega por mês, preenche meses vazios e ignora o que está fora do período", () => {
    const r = buildReport(
      [exp("Mercado", 300, at(2026, 11)), exp("Cinema", 100, at(2026, 9)), exp("Antigo", 999, at(2025, 1))],
      [inc(2000, at(2026, 11))],
      3,
      now,
    );
    expect(r.months.map((m) => m.key)).toEqual(["2026-09", "2026-10", "2026-11"]);
    expect(r.months[1].expenses).toBe(0);
    expect(r.totalExpenses).toBe(400);
    expect(r.net).toBe(1600);
    expect(r.byTag[0]).toMatchObject({ tag: "mercado", amount: 300 });
    expect(r.topExpenses.map((e) => e.amount)).toEqual([300, 100]);
  });
  it("conta o que foi investido como dinheiro guardado", () => {
    const r = buildReport([exp("Tesouro", 500, at(2026, 11), { category: "investment" })], [inc(1000)], 3, now);
    expect(r.keptShare).toBe(1); // 500 de sobra + 500 investidos
  });
  it("aguenta grande volume sem travar", () => {
    const many = Array.from({ length: 50_000 }, (_, i) => exp(`Gasto ${i}`, (i % 97) + 1, at(2026, (i % 11) + 1)));
    const t = performance.now();
    const r = buildReport(many, [], "all", now);
    expect(performance.now() - t).toBeLessThan(500);
    expect(r.topExpenses).toHaveLength(5);
  });
});

describe("metas", () => {
  it("calcula quanto guardar por mês até o prazo", () => {
    const p = goalProgress({ id: "g", name: "Viagem", target: 1200, saved: 200, deadline: "2027-04", createdAt: 0 }, new Date(2026, 10, 9));
    expect(p.monthsLeft).toBe(6);
    expect(p.monthlyNeeded).toBeCloseTo(1000 / 6);
  });
  it("trata prazo vencido e meta concluída", () => {
    const now = new Date(2026, 10, 9);
    expect(goalProgress({ id: "g", name: "x", target: 100, saved: 10, deadline: "2026-01", createdAt: 0 }, now).monthsLeft).toBe(0);
    expect(goalProgress({ id: "g", name: "x", target: 100, saved: 150, createdAt: 0 }, now)).toMatchObject({ done: true, ratio: 1 });
  });
  it("valida os campos", () => {
    expect(validateGoal("", NaN, "13/2026")).toEqual({
      name: "Dê um nome para a meta",
      target: "Informe um valor válido (ex.: 10.000,00)",
      deadline: "Escolha um mês válido",
    });
    expect(validateGoal("Reserva", 1000, "")).toEqual({});
  });
});

describe("armazenamento", () => {
  beforeEach(() => localStorage.clear());

  it("lê dados da versão anterior sem perder nada", () => {
    const old = { incomes: [inc(1000)], expenses: [exp("Aluguel", 900, at(2026, 11), { category: "fixed" })], rule: { fixed: 50, variable: 30, investment: 20 } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(old));
    const s = loadState();
    expect(s.expenses).toEqual(old.expenses);
    expect(s.incomes).toEqual(old.incomes);
    expect(s.budgets).toEqual({});
    expect(s.goals).toEqual([]);
  });
  it("descarta só os itens inválidos e corrige campos adulterados", () => {
    const s = sanitizeState({
      expenses: [exp("ok", 10), { id: "x", description: "neg", amount: -5, category: "fixed", createdAt: 0 }, exp("tag ruim", 5, 0, { tag: "<script>" as never })],
      incomes: "não é lista",
      rule: { fixed: 90, variable: 30, investment: 20 },
      budgets: { lazer: 300, mercado: -1, inexistente: 50 },
    });
    expect(s.expenses.map((e) => e.description)).toEqual(["ok", "tag ruim"]);
    expect(s.expenses[1].tag).toBeUndefined();
    expect(s.incomes).toEqual([]);
    expect(s.rule).toEqual({ fixed: 50, variable: 30, investment: 20 });
    expect(s.budgets).toEqual({ lazer: 300 });
  });
  it("não quebra com JSON corrompido", () => {
    localStorage.setItem(STORAGE_KEY, "{oops");
    expect(loadState().expenses).toEqual([]);
  });
});
