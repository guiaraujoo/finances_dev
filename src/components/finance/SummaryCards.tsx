import { CATEGORIES, CATEGORY_META, formatBRL, type Category } from "@/lib/finance";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type Scope = "month" | "all";

interface Props {
  income: number;
  expenses: number;
  balance: number;
  totalsByCategory?: Record<Category, number>;
  /** Ex.: "Novembro de 2026" ou "Todo o período". */
  title?: string;
  scope?: Scope;
  onScopeChange?: (scope: Scope) => void;
  /** Fração do mês já percorrida (0–1); só faz sentido no escopo "mês". */
  elapsed?: number;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * Resumo do período: quanto sobrou, e uma faixa mostrando a renda sendo consumida pelas
 * fatias da regra. O marcador "hoje" permite comparar o ritmo de gasto com o calendário.
 */
export function SummaryCards({
  income,
  expenses,
  balance,
  totalsByCategory,
  title = "Resumo",
  scope,
  onScopeChange,
  elapsed,
}: Props) {
  const positive = balance >= 0;
  // Se as saídas passaram a renda, a faixa passa a representar as saídas (100% = total gasto).
  const base = Math.max(income, expenses);
  const used = income > 0 ? expenses / income : null;
  const showPace = elapsed !== undefined && used !== null && positive;

  let headline: string;
  if (income === 0 && expenses === 0) headline = "Registre uma receita e seus gastos para ver quanto sobra.";
  else if (income === 0) headline = "Há gastos, mas nenhuma receita registrada neste período.";
  else if (!positive) headline = `As saídas passaram as entradas em ${formatBRL(-balance)}.`;
  else if (showPace && used! > elapsed! + 0.1)
    headline = `Você já usou ${pct(used!)} da renda, com ${pct(elapsed!)} do mês percorrido. Segure o ritmo.`;
  else headline = `Você usou ${pct(used!)} do que entrou.`;

  return (
    <section aria-labelledby="summary-title" className="rounded-3xl bg-ink p-6 text-ink-foreground sm:p-8 dark:border dark:border-border">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="summary-title" className="text-base font-medium text-ink-muted">{title}</h2>
        {scope && onScopeChange && (
          <ToggleGroup
            type="single"
            value={scope}
            onValueChange={(v) => v && onScopeChange(v as Scope)}
            aria-label="Período do resumo"
            className="rounded-full bg-white/10 p-1"
          >
            {(
              [
                ["month", "Este mês"],
                ["all", "Tudo"],
              ] as const
            ).map(([value, label]) => (
              <ToggleGroupItem
                key={value}
                value={value}
                size="sm"
                className="h-7 rounded-full px-3 text-xs text-ink-muted hover:bg-white/10 hover:text-ink-foreground data-[state=on]:bg-ink-foreground data-[state=on]:text-ink"
              >
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>

      <p className="mt-6 text-sm text-ink-muted">{positive ? "Sobra" : "Falta"}</p>
      <p
        className={`font-display text-5xl font-semibold tracking-tight sm:text-6xl ${
          positive ? "text-ink-foreground" : "text-[hsl(358_85%_70%)]"
        }`}
      >
        {formatBRL(Math.abs(balance))}
      </p>
      <p className="mt-2 max-w-prose text-sm text-ink-muted" aria-live="polite">{headline}</p>

      {totalsByCategory && base > 0 && (
        <div className="mt-7">
          <div className="relative">
            <div
              className="flex h-3 overflow-hidden rounded-full bg-white/10"
              role="img"
              aria-label={`Uso da renda: ${CATEGORIES.map(
                (c) => `${CATEGORY_META[c].label} ${formatBRL(totalsByCategory[c])}`,
              ).join(", ")}`}
            >
              {CATEGORIES.map((c) => (
                <div
                  key={c}
                  className="h-full transition-[width] duration-500"
                  style={{ width: `${(totalsByCategory[c] / base) * 100}%`, background: CATEGORY_META[c].color }}
                />
              ))}
            </div>
            {showPace && (
              <div
                className="absolute -top-1.5 bottom-[-6px] w-0.5 rounded bg-ink-foreground"
                style={{ left: `calc(${elapsed! * 100}% - 1px)` }}
                aria-hidden="true"
              >
                <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[11px] text-ink-muted">
                  hoje
                </span>
              </div>
            )}
          </div>

          <ul className={`grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3 ${showPace ? "mt-7" : "mt-4"}`}>
            {CATEGORIES.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CATEGORY_META[c].color }} />
                <span className="text-ink-muted">{CATEGORY_META[c].label}</span>
                <span className="ml-auto tabular-nums sm:ml-0">{formatBRL(totalsByCategory[c])}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-ink-muted">Entradas</dt>
          <dd className="mt-0.5 text-lg font-medium tabular-nums text-[hsl(158_75%_60%)]">+{formatBRL(income)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Saídas</dt>
          <dd className="mt-0.5 text-lg font-medium tabular-nums">−{formatBRL(expenses)}</dd>
        </div>
        {used !== null && (
          <div>
            <dt className="text-xs text-ink-muted">Renda usada</dt>
            <dd className="mt-0.5 text-lg font-medium tabular-nums">{pct(used)}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
