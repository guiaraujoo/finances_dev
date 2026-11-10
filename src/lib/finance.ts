export type Category = "fixed" | "variable" | "investment";

/** Categoria detalhada do gasto (Mercado, Transporte…). Cada uma conta em uma fatia da regra. */
export type TagId =
  | "moradia"
  | "mercado"
  | "transporte"
  | "saude"
  | "educacao"
  | "alimentacao"
  | "lazer"
  | "compras"
  | "assinaturas"
  | "investimentos"
  | "outros";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: Category;
  createdAt: number;
  /** Opcional: lançamentos antigos não têm; a categoria é inferida pela descrição (ver tagOf). */
  tag?: TagId;
}

/** Limite mensal por categoria detalhada. Ausente = sem limite. */
export type Budgets = Partial<Record<TagId, number>>;

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  /** Mês-alvo no formato "AAAA-MM". */
  deadline?: string;
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

export const TAG_META: Record<TagId, { label: string; bucket: Category }> = {
  moradia: { label: "Fatura", bucket: "fixed" },
  mercado: { label: "Dízimo/Oferta", bucket: "fixed" },
  transporte: { label: "Transporte", bucket: "fixed" },
  saude: { label: "Saúde", bucket: "fixed" },
  educacao: { label: "Educação", bucket: "fixed" },
  alimentacao: { label: "Comer fora", bucket: "variable" },
  lazer: { label: "Lazer", bucket: "variable" },
  compras: { label: "Compras", bucket: "variable" },
  assinaturas: { label: "Assinaturas", bucket: "variable" },
  investimentos: { label: "Investimentos", bucket: "investment" },
  outros: { label: "Outros", bucket: "variable" },
};

export const TAG_IDS = Object.keys(TAG_META) as TagId[];
export const CATEGORIES: Category[] = ["fixed", "variable", "investment"];

export const emptyTotals = (): Record<Category, number> => ({ fixed: 0, variable: 0, investment: 0 });

/** Totais de entradas, saídas por fatia e saldo de um conjunto de lançamentos (uma passada). */
export function sumTotals(expenses: Expense[], incomes: Income[]) {
  const totalsByCategory = emptyTotals();
  let totalExpenses = 0;
  for (const e of expenses) {
    totalsByCategory[e.category] += e.amount;
    totalExpenses += e.amount;
  }
  let totalIncome = 0;
  for (const i of incomes) totalIncome += i.amount;
  return { totalIncome, totalExpenses, totalsByCategory, balance: totalIncome - totalExpenses };
}

/** Valor para preencher um campo de texto (ex.: 1234.5 → "1234,50"). */
export const toInputAmount = (n: number) => n.toFixed(2).replace(".", ",");

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


export const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("pt-BR");

/** Valor com sinal explícito (+/−) para saldos e variações. */
export const formatSignedBRL = (n: number) => `${n > 0 ? "+" : ""}${formatBRL(n)}`;

/** Classe de cor para valores positivos/negativos (usa os tokens do tema). */
export const toneClass = (n: number) => (n < 0 ? "text-danger" : "text-primary");

/**
 * Converte texto digitado em número. Aceita "1234.56", "1234,56" e "1.234,56".
 * Retorna NaN quando o texto não é um número válido.
 */
export function parseAmount(raw: string): number {
  const text = raw.trim().replace(/^R\$\s*/, "");
  if (!text) return NaN;
  // Se há vírgula, ela é o separador decimal e os pontos são milhares.
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}

export interface EntryErrors {
  description?: string;
  amount?: string;
}

/** Valida descrição e valor de um lançamento; `amount` já vem convertido por parseAmount. */
export function validateEntry(description: string, amount: number, label: string): EntryErrors {
  const errors: EntryErrors = {};
  if (!description.trim()) errors.description = `Informe ${label}`;
  if (Number.isNaN(amount)) errors.amount = "Informe um valor válido (ex.: 1.234,56)";
  else if (amount <= 0) errors.amount = "O valor deve ser maior que zero";
  else if (amount > 1_000_000_000) errors.amount = "Valor muito alto";
  return errors;
}

/** Variação percentual de `current` em relação a `previous`; null quando não há base de comparação. */
export function variationPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export const formatPct = (n: number) =>
  `${n > 0 ? "+" : ""}${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export interface ExpenseFilter {
  query: string;
  category: Category | "all";
}

/** Filtra despesas por texto (sem acento/maiúsculas) e categoria. */
export function filterExpenses(expenses: Expense[], { query, category }: ExpenseFilter): Expense[] {
  const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const q = norm(query.trim());
  return expenses.filter(
    (e) => (category === "all" || e.category === category) && (!q || norm(e.description).includes(q)),
  );
}
