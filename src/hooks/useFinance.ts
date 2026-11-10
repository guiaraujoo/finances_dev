import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_RULE, sumTotals, type Category, type Expense, type Goal, type Income, type Rule, type TagId } from "@/lib/finance";
import { STORAGE_KEY, initialState, loadState, saveState, type FinanceState } from "@/lib/storage";

const SAVE_DELAY_MS = 250;

/** Insere mantendo a ordem cronológica (usado para desfazer remoções). */
function insertByDate<T extends { createdAt: number }>(list: T[], item: T): T[] {
  const at = list.findIndex((x) => x.createdAt > item.createdAt);
  return at === -1 ? [...list, item] : [...list.slice(0, at), item, ...list.slice(at)];
}

export function useFinance() {
  const [state, setState] = useState<FinanceState>(loadState);
  const [saveFailed, setSaveFailed] = useState(false);
  const latest = useRef(state);
  // Só há o que gravar depois de uma mudança; evita sobrescrever o armazenamento à toa.
  const dirty = useRef(false);
  const isFirstRender = useRef(true);

  // Grava com um pequeno atraso: várias mudanças seguidas viram uma única serialização.
  useEffect(() => {
    latest.current = state;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dirty.current = true;
    const t = setTimeout(() => {
      dirty.current = false;
      setSaveFailed(!saveState(state));
    }, SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    // Garante a gravação se a aba for fechada dentro da janela de atraso.
    const flush = () => {
      if (!dirty.current) return;
      dirty.current = false;
      saveState(latest.current);
    };
    // Outra aba alterou os dados: recarrega em vez de sobrescrever o que ela salvou.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(loadState());
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("storage", onStorage);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const addIncome = useCallback(
    (source: string, amount: number) =>
      setState((s) => ({
        ...s,
        incomes: [...s.incomes, { id: crypto.randomUUID(), source, amount, createdAt: Date.now() }],
      })),
    [],
  );

  const removeIncome = useCallback(
    (id: string) => setState((s) => ({ ...s, incomes: s.incomes.filter((i) => i.id !== id) })),
    [],
  );

  const restoreIncome = useCallback(
    (income: Income) =>
      setState((s) => (s.incomes.some((i) => i.id === income.id) ? s : { ...s, incomes: insertByDate(s.incomes, income) })),
    [],
  );

  // `tag` é opcional para manter compatível quem chama com 3 argumentos.
  const addExpense = useCallback(
    (description: string, amount: number, category: Category, tag?: TagId) =>
      setState((s) => ({
        ...s,
        expenses: [
          ...s.expenses,
          { id: crypto.randomUUID(), description, amount, category, createdAt: Date.now(), ...(tag ? { tag } : {}) },
        ],
      })),
    [],
  );

  const removeExpense = useCallback(
    (id: string) => setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) })),
    [],
  );

  const restoreExpense = useCallback(
    (expense: Expense) =>
      setState((s) =>
        s.expenses.some((e) => e.id === expense.id) ? s : { ...s, expenses: insertByDate(s.expenses, expense) },
      ),
    [],
  );

  const setRule = useCallback((rule: Rule) => setState((s) => ({ ...s, rule })), []);
  const resetRule = useCallback(() => setState((s) => ({ ...s, rule: { ...DEFAULT_RULE } })), []);

  /** Substitui todos os limites de uma vez (vem do diálogo de edição). */
  const setBudgets = useCallback(
    (budgets: FinanceState["budgets"]) => setState((s) => ({ ...s, budgets })),
    [],
  );

  const addGoal = useCallback(
    (name: string, target: number, deadline?: string) =>
      setState((s) => ({
        ...s,
        goals: [
          ...s.goals,
          { id: crypto.randomUUID(), name, target, saved: 0, createdAt: Date.now(), ...(deadline ? { deadline } : {}) },
        ],
      })),
    [],
  );

  /** Positivo guarda, negativo resgata. O saldo da meta nunca fica negativo. */
  const moveGoal = useCallback(
    (id: string, delta: number) =>
      setState((s) => ({
        ...s,
        goals: s.goals.map((g) => (g.id === id ? { ...g, saved: Math.max(0, +(g.saved + delta).toFixed(2)) } : g)),
      })),
    [],
  );

  const removeGoal = useCallback(
    (id: string) => setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),
    [],
  );

  const restoreGoal = useCallback(
    (goal: Goal) =>
      setState((s) => (s.goals.some((g) => g.id === goal.id) ? s : { ...s, goals: insertByDate(s.goals, goal) })),
    [],
  );

  const reset = useCallback(() => setState(initialState()), []);

  // Totais de todo o período (mantidos para compatibilidade com quem já os usa).
  const totals = useMemo(() => sumTotals(state.expenses, state.incomes), [state.expenses, state.incomes]);

  return {
    ...state,
    addIncome,
    removeIncome,
    restoreIncome,
    addExpense,
    removeExpense,
    restoreExpense,
    setRule,
    resetRule,
    setBudgets,
    addGoal,
    moveGoal,
    removeGoal,
    restoreGoal,
    reset,
    saveFailed,
    ...totals,
  };
}
