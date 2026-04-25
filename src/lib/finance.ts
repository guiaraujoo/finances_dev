export type Category = "fixed" | "variable" | "investment";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: Category;
  createdAt: number;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  createdAt: number;
}

export type Rule = Record<Category, number>;

export const DEFAULT_RULE: Rule = { fixed: 50, variable: 30, investment: 20 };

export const CATEGORY_META: Record<Category, { label: string; color: string; description: string }> = {
  fixed: {
    label: "Custos Fixos",
    color: "hsl(210 80% 65%)",
    description: "Aluguel, contas, mercado",
  },
  variable: {
    label: "Custos Variáveis",
    color: "hsl(45 95% 60%)",
    description: "Lazer, compras, restaurantes",
  },
  investment: {
    label: "Investimentos",
    color: "hsl(320 75% 65%)",
    description: "Poupança, ações, reserva",
  },
};

export const formatRuleLabel = (rule: Rule) =>
  `${rule.fixed} · ${rule.variable} · ${rule.investment}`;

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function getStatus(actual: number, planned: number): "under" | "on" | "over" {
  if (planned === 0) return actual > 0 ? "over" : "on";
  const ratio = actual / planned;
  if (ratio > 1.05) return "over";
  if (ratio < 0.85) return "under";
  return "on";
}
