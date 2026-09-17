import type { Expense, Income, Category } from "@/lib/finance";

export interface MonthlySummary {
  key: string; // ex: "2026-09"
  label: string; // ex: "Setembro de 2026"
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  totalsByCategory: Record<Category, number>;
  expenses: Expense[];
  incomes: Income[];
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function monthKeyFromTimestamp(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabelFromKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} de ${year}`;
}

export function currentMonthKey(): string {
  return monthKeyFromTimestamp(Date.now());
}

/**
 * Agrupa despesas e receitas por mês (baseado em createdAt) e calcula
 * totais/saldo de cada mês. Meses vêm ordenados do mais recente para o mais antigo.
 */
export function buildMonthlySummaries(
  expenses: Expense[],
  incomes: Income[],
): MonthlySummary[] {
  const map = new Map<string, MonthlySummary>();

  const ensure = (key: string): MonthlySummary => {
    let summary = map.get(key);
    if (!summary) {
      summary = {
        key,
        label: monthLabelFromKey(key),
        totalExpenses: 0,
        totalIncome: 0,
        balance: 0,
        totalsByCategory: { fixed: 0, variable: 0, investment: 0 },
        expenses: [],
        incomes: [],
      };
      map.set(key, summary);
    }
    return summary;
  };

  for (const expense of expenses) {
    const summary = ensure(monthKeyFromTimestamp(expense.createdAt));
    summary.expenses.push(expense);
    summary.totalExpenses += expense.amount;
    summary.totalsByCategory[expense.category] += expense.amount;
  }

  for (const income of incomes) {
    const summary = ensure(monthKeyFromTimestamp(income.createdAt));
    summary.incomes.push(income);
    summary.totalIncome += income.amount;
  }

  for (const summary of map.values()) {
    summary.balance = summary.totalIncome - summary.totalExpenses;
  }

  return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
}