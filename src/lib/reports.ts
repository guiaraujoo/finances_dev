import { tagOf } from "@/lib/categorize";
import { emptyTotals, type Category, type Expense, type Income, type TagId } from "@/lib/finance";
import { monthKeyFromTimestamp } from "@/lib/history";

export type ReportPeriod = 3 | 6 | 12 | "all";

export interface ReportMonth extends Record<Category, number> {
  key: string;
  label: string; // "nov/26"
  income: number;
  expenses: number;
  net: number;
}

export interface Report {
  months: ReportMonth[];
  totalIncome: number;
  totalExpenses: number;
  net: number;
  /** Parte da renda que não foi consumida: sobra + o que foi investido. null sem renda. */
  keptShare: number | null;
  totalsByCategory: Record<Category, number>;
  byTag: { tag: TagId; amount: number; share: number }[];
  topExpenses: Expense[];
  avgMonthlyExpense: number;
}

const SHORT_MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const toIndex = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return y * 12 + (m - 1);
};
const fromIndex = (i: number) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
const shortLabel = (key: string) => {
  const [y, m] = key.split("-");
  return `${SHORT_MONTHS[Number(m) - 1]}/${y.slice(2)}`;
};

const TOP_N = 5;

/**
 * Relatório do período em uma única passada pelos lançamentos (O(n)), para continuar
 * rápido com dezenas de milhares de registros. Meses sem lançamento aparecem zerados.
 */
export function buildReport(expenses: Expense[], incomes: Income[], period: ReportPeriod, now = Date.now()): Report {
  const lastIdx = toIndex(monthKeyFromTimestamp(now));
  let firstIdx: number;
  if (period === "all") {
    firstIdx = lastIdx;
    for (const e of expenses) firstIdx = Math.min(firstIdx, toIndex(monthKeyFromTimestamp(e.createdAt)));
    for (const i of incomes) firstIdx = Math.min(firstIdx, toIndex(monthKeyFromTimestamp(i.createdAt)));
  } else {
    firstIdx = lastIdx - period + 1;
  }

  const months: ReportMonth[] = [];
  for (let i = firstIdx; i <= lastIdx; i++) {
    const key = fromIndex(i);
    months.push({ key, label: shortLabel(key), income: 0, expenses: 0, net: 0, ...emptyTotals() });
  }

  const totalsByCategory = emptyTotals();
  const tagTotals = new Map<TagId, number>();
  const top: Expense[] = [];
  let totalExpenses = 0;
  let totalIncome = 0;

  for (const e of expenses) {
    const idx = toIndex(monthKeyFromTimestamp(e.createdAt)) - firstIdx;
    if (idx < 0 || idx >= months.length) continue;
    const m = months[idx];
    m[e.category] += e.amount;
    m.expenses += e.amount;
    totalsByCategory[e.category] += e.amount;
    totalExpenses += e.amount;
    const tag = tagOf(e);
    tagTotals.set(tag, (tagTotals.get(tag) ?? 0) + e.amount);
    // Mantém só as N maiores sem ordenar a lista inteira.
    if (top.length < TOP_N || e.amount > top[top.length - 1].amount) {
      top.push(e);
      top.sort((a, b) => b.amount - a.amount);
      if (top.length > TOP_N) top.pop();
    }
  }

  for (const i of incomes) {
    const idx = toIndex(monthKeyFromTimestamp(i.createdAt)) - firstIdx;
    if (idx < 0 || idx >= months.length) continue;
    months[idx].income += i.amount;
    totalIncome += i.amount;
  }

  for (const m of months) m.net = m.income - m.expenses;

  const net = totalIncome - totalExpenses;
  const byTag = [...tagTotals.entries()]
    .map(([tag, amount]) => ({ tag, amount, share: totalExpenses > 0 ? amount / totalExpenses : 0 }))
    .sort((a, b) => b.amount - a.amount);

  return {
    months,
    totalIncome,
    totalExpenses,
    net,
    keptShare: totalIncome > 0 ? (net + totalsByCategory.investment) / totalIncome : null,
    totalsByCategory,
    byTag,
    topExpenses: top,
    avgMonthlyExpense: totalExpenses / months.length,
  };
}
