import { useEffect, useState } from "react";
import { DEFAULT_RULE, type Expense, type Income, type Category, type Rule } from "@/lib/finance";

const STORAGE_KEY = "finance-data-v1";

interface FinanceState {
  incomes: Income[];
  expenses: Expense[];
  rule: Rule;
}

const initial: FinanceState = { incomes: [], expenses: [], rule: { ...DEFAULT_RULE } };

function load(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<FinanceState>;
    return {
      incomes: parsed.incomes ?? [],
      expenses: parsed.expenses ?? [],
      rule: parsed.rule ?? { ...DEFAULT_RULE },
    };
  } catch {
    return initial;
  }
}

export function useFinance() {
  const [state, setState] = useState<FinanceState>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addIncome = (source: string, amount: number) =>
    setState((s) => ({
      ...s,
      incomes: [...s.incomes, { id: crypto.randomUUID(), source, amount, createdAt: Date.now() }],
    }));

  const removeIncome = (id: string) =>
    setState((s) => ({ ...s, incomes: s.incomes.filter((i) => i.id !== id) }));

  const addExpense = (description: string, amount: number, category: Category) =>
    setState((s) => ({
      ...s,
      expenses: [
        ...s.expenses,
        { id: crypto.randomUUID(), description, amount, category, createdAt: Date.now() },
      ],
    }));

  const removeExpense = (id: string) =>
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));

  const setRule = (rule: Rule) => setState((s) => ({ ...s, rule }));
  const resetRule = () => setState((s) => ({ ...s, rule: { ...DEFAULT_RULE } }));

  const reset = () => setState(initial);

  const totalIncome = state.incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalsByCategory = state.expenses.reduce(
    (acc, e) => {
      acc[e.category] += e.amount;
      return acc;
    },
    { fixed: 0, variable: 0, investment: 0 } as Record<Category, number>,
  );
  const totalExpenses =
    totalsByCategory.fixed + totalsByCategory.variable + totalsByCategory.investment;
  const balance = totalIncome - totalExpenses;

  return {
    ...state,
    addIncome,
    removeIncome,
    addExpense,
    removeExpense,
    setRule,
    resetRule,
    reset,
    totalIncome,
    totalExpenses,
    totalsByCategory,
    balance,
  };
}
