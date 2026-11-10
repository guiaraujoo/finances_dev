import { z } from "zod";
import { DEFAULT_RULE, TAG_IDS, type Budgets, type Expense, type Goal, type Income, type Rule } from "@/lib/finance";

// Mesma chave da versão anterior: os campos novos são opcionais, então dados antigos
// continuam válidos e uma versão antiga do app simplesmente ignora o que não conhece.
export const STORAGE_KEY = "finance-data-v1";

export interface FinanceState {
  incomes: Income[];
  expenses: Expense[];
  rule: Rule;
  budgets: Budgets;
  goals: Goal[];
}

export const initialState = (): FinanceState => ({
  incomes: [],
  expenses: [],
  rule: { ...DEFAULT_RULE },
  budgets: {},
  goals: [],
});

const MAX_AMOUNT = 1_000_000_000;
const amount = z.number().finite().positive().max(MAX_AMOUNT);
const id = z.string().min(1).max(64);
const text = z.string().max(200);
const timestamp = z.number().int().nonnegative();
const tagId = z.enum(TAG_IDS as [string, ...string[]]);

const expenseSchema = z.object({
  id,
  description: text,
  amount,
  category: z.enum(["fixed", "variable", "investment"]),
  createdAt: timestamp,
  // Uma categoria inválida não invalida o lançamento: só é descartada e volta a ser inferida.
  tag: tagId.optional().catch(undefined),
});

const incomeSchema = z.object({ id, source: text, amount, createdAt: timestamp });

const goalSchema = z.object({
  id,
  name: text,
  target: amount,
  saved: z.number().finite().min(0).max(MAX_AMOUNT),
  deadline: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional().catch(undefined),
  createdAt: timestamp,
});

const pct = z.number().int().min(0).max(100);
const ruleSchema = z
  .object({ fixed: pct, variable: pct, investment: pct })
  .refine((r) => r.fixed + r.variable + r.investment === 100);

/** Mantém os itens válidos e descarta só os corrompidos, em vez de perder a lista inteira. */
function validItems<T>(raw: unknown, schema: z.ZodType<T>): T[] {
  if (!Array.isArray(raw)) return [];
  const out: T[] = [];
  for (const item of raw) {
    const parsed = schema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

function validBudgets(raw: unknown): Budgets {
  if (!raw || typeof raw !== "object") return {};
  const out: Budgets = {};
  for (const tag of TAG_IDS) {
    const parsed = amount.safeParse((raw as Record<string, unknown>)[tag]);
    if (parsed.success) out[tag] = parsed.data;
  }
  return out;
}

/** Valida dados vindos do armazenamento: podem ter sido editados à mão, corrompidos ou vir de outra versão. */
export function sanitizeState(raw: unknown): FinanceState {
  if (!raw || typeof raw !== "object") return initialState();
  const r = raw as Record<string, unknown>;
  const rule = ruleSchema.safeParse(r.rule);
  return {
    incomes: validItems(r.incomes, incomeSchema) as Income[],
    expenses: validItems(r.expenses, expenseSchema) as Expense[],
    rule: rule.success ? (rule.data as Rule) : { ...DEFAULT_RULE },
    budgets: validBudgets(r.budgets),
    goals: validItems(r.goals, goalSchema) as Goal[],
  };
}

export function loadState(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : initialState();
  } catch {
    return initialState();
  }
}

/** Retorna false se o navegador recusar a gravação (cota cheia, modo privado restrito). */
export function saveState(state: FinanceState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
