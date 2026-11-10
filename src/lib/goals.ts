import type { Goal } from "@/lib/finance";

export interface GoalProgress {
  ratio: number;
  remaining: number;
  done: boolean;
  /** Meses até o prazo, contando o atual. null = meta sem prazo; 0 = prazo encerrado. */
  monthsLeft: number | null;
  /** Quanto guardar por mês para chegar no prazo. null quando não se aplica. */
  monthlyNeeded: number | null;
}

const monthIndex = (y: number, m: number) => y * 12 + m;

export function goalProgress(goal: Goal, now = new Date()): GoalProgress {
  const remaining = Math.max(goal.target - goal.saved, 0);
  const done = remaining === 0;
  let monthsLeft: number | null = null;
  if (goal.deadline) {
    const [y, m] = goal.deadline.split("-").map(Number);
    monthsLeft = Math.max(monthIndex(y, m - 1) - monthIndex(now.getFullYear(), now.getMonth()) + 1, 0);
  }
  return {
    ratio: goal.target > 0 ? Math.min(goal.saved / goal.target, 1) : 0,
    remaining,
    done,
    monthsLeft,
    monthlyNeeded: !done && monthsLeft ? remaining / monthsLeft : null,
  };
}

export interface GoalErrors {
  name?: string;
  target?: string;
  deadline?: string;
}

/** `target` já vem convertido por parseAmount; `deadline` vem do campo type="month" ("" = sem prazo). */
export function validateGoal(name: string, target: number, deadline: string): GoalErrors {
  const errors: GoalErrors = {};
  if (!name.trim()) errors.name = "Dê um nome para a meta";
  if (Number.isNaN(target)) errors.target = "Informe um valor válido (ex.: 10.000,00)";
  else if (target <= 0) errors.target = "O valor deve ser maior que zero";
  else if (target > 1_000_000_000) errors.target = "Valor muito alto";
  if (deadline && !/^\d{4}-(0[1-9]|1[0-2])$/.test(deadline)) errors.deadline = "Escolha um mês válido";
  return errors;
}

export const formatMonthShort = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "");
};
