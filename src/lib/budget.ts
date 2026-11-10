import { tagOf } from "@/lib/categorize";
import type { Budgets, Expense, TagId } from "@/lib/finance";
import { TAG_IDS } from "@/lib/finance";

/** A partir de 80% do limite o usuário recebe aviso. */
export const NEAR_LIMIT = 0.8;

export type BudgetLevel = "ok" | "near" | "over";

export function budgetLevel(spent: number, limit: number): BudgetLevel {
  if (limit <= 0) return "ok";
  const ratio = spent / limit;
  if (ratio > 1) return "over";
  if (ratio >= NEAR_LIMIT) return "near";
  return "ok";
}

const RANK: Record<BudgetLevel, number> = { ok: 0, near: 1, over: 2 };

/** Nível atingido por um novo gasto, ou null se ele não piorou a situação (evita avisos repetidos). */
export function crossedLevel(before: number, after: number, limit: number): BudgetLevel | null {
  const from = budgetLevel(before, limit);
  const to = budgetLevel(after, limit);
  return RANK[to] > RANK[from] ? to : null;
}

export function spentByTag(expenses: Expense[]): Record<TagId, number> {
  const totals = Object.fromEntries(TAG_IDS.map((t) => [t, 0])) as Record<TagId, number>;
  for (const e of expenses) totals[tagOf(e)] += e.amount;
  return totals;
}

export interface BudgetStatus {
  tag: TagId;
  limit: number;
  spent: number;
  remaining: number;
  ratio: number;
  level: BudgetLevel;
  /** Quanto seria "normal" ter gasto até hoje, distribuindo o limite pelos dias do mês. */
  pace: number;
}

/** Fração do mês já percorrida (dia 15 de 30 → 0,5). */
export function monthElapsed(now = new Date()): number {
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return now.getDate() / days;
}

/**
 * Situação de cada categoria com limite, das mais críticas para as mais folgadas.
 * `monthExpenses` deve conter só despesas do mês em análise.
 */
export function budgetStatuses(monthExpenses: Expense[], budgets: Budgets, elapsed = monthElapsed()): BudgetStatus[] {
  const spent = spentByTag(monthExpenses);
  return (Object.entries(budgets) as [TagId, number][])
    .filter(([, limit]) => limit > 0)
    .map(([tag, limit]) => ({
      tag,
      limit,
      spent: spent[tag],
      remaining: limit - spent[tag],
      ratio: spent[tag] / limit,
      level: budgetLevel(spent[tag], limit),
      pace: limit * elapsed,
    }))
    .sort((a, b) => b.ratio - a.ratio);
}
