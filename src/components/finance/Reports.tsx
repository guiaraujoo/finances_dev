import { useDeferredValue, useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CATEGORIES,
  CATEGORY_META,
  TAG_META,
  formatBRL,
  formatDate,
  toneClass,
  type Expense,
  type Income,
} from "@/lib/finance";
import { buildReport, type ReportPeriod } from "@/lib/reports";
import { tagOf } from "@/lib/categorize";
import { buildCSV, downloadCSV } from "@/lib/export";
import { monthKeyFromTimestamp } from "@/lib/history";

interface Props {
  expenses: Expense[];
  incomes: Income[];
}

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses" },
  { value: "all", label: "Tudo" },
];

const compactBRL = (n: number) =>
  Math.abs(n) >= 1000 ? `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : n.toFixed(0);

const tooltipStyle = {
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
};

export function Reports({ expenses, incomes }: Props) {
  const [period, setPeriod] = useState<ReportPeriod>(6);
  // Trocar o período responde na hora; o recálculo roda em segundo plano (concurrent rendering)
  // e a tela antiga fica visível, esmaecida, até o novo relatório ficar pronto.
  const deferredPeriod = useDeferredValue(period);
  const deferredExpenses = useDeferredValue(expenses);
  const deferredIncomes = useDeferredValue(incomes);
  const stale = deferredPeriod !== period;

  const report = useMemo(
    () => buildReport(deferredExpenses, deferredIncomes, deferredPeriod),
    [deferredExpenses, deferredIncomes, deferredPeriod],
  );

  const handleExport = () => {
    const first = report.months[0].key;
    const inRange = <T extends { createdAt: number }>(list: T[]) =>
      list.filter((x) => monthKeyFromTimestamp(x.createdAt) >= first);
    downloadCSV(`relatorio-${first}-a-${report.months[report.months.length - 1].key}.csv`, buildCSV(inRange(expenses), inRange(incomes)));
  };

  if (expenses.length === 0 && incomes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
        <Inbox className="h-8 w-8 opacity-50" />
        <p className="max-w-sm">Os relatórios aparecem quando houver lançamentos. Registre receitas e despesas no Painel.</p>
      </div>
    );
  }

  const maxTag = report.byTag[0]?.amount ?? 0;
  const kept = report.keptShare;

  return (
    <div className={`space-y-6 transition-opacity ${stale ? "opacity-60" : ""}`} aria-busy={stale}>
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={String(period)}
          onValueChange={(v) => v && setPeriod(v === "all" ? "all" : (Number(v) as ReportPeriod))}
          aria-label="Período do relatório"
          className="rounded-lg border border-border p-1"
        >
          {PERIODS.map((p) => (
            <ToggleGroupItem key={p.label} value={String(p.value)} size="sm" className="h-8 px-3 text-xs data-[state=on]:bg-secondary data-[state=on]:text-foreground">
              {p.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button variant="outline" size="sm" onClick={handleExport} className="ml-auto">
          <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar período
        </Button>
      </div>

      <dl className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-4">
        <div>
          <dt className="text-sm text-muted-foreground">Entradas</dt>
          <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-inflow">{formatBRL(report.totalIncome)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Saídas</dt>
          <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{formatBRL(report.totalExpenses)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Resultado</dt>
          <dd className={`mt-1 font-display text-2xl font-semibold tabular-nums ${toneClass(report.net)}`}>{formatBRL(report.net)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Guardado ou investido</dt>
          <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">
            {kept === null ? "—" : `${Math.round(kept * 100)}%`}
          </dd>
          <dd className="text-xs text-muted-foreground">{kept === null ? "Sem receitas no período" : "da renda do período"}</dd>
        </div>
      </dl>

      <section className="rounded-2xl border border-border bg-card p-6" aria-labelledby="flow-title">
        <h3 id="flow-title" className="font-display text-lg font-semibold">Entradas e saídas por mês</h3>
        <p className="text-sm text-muted-foreground">
          Média de saídas: {formatBRL(report.avgMonthlyExpense)} por mês. A linha mostra o resultado de cada mês.
        </p>
        <div className="mt-4 h-72">
          <ResponsiveContainer>
            <ComposedChart data={report.months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={44} tickFormatter={compactBRL} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--secondary))", opacity: 0.5 }} formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="income" name="Entradas" fill="hsl(var(--inflow))" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              {CATEGORIES.map((c, i) => (
                <Bar
                  key={c}
                  dataKey={c}
                  name={CATEGORY_META[c].label}
                  stackId="out"
                  fill={CATEGORY_META[c].color}
                  radius={i === CATEGORIES.length - 1 ? [4, 4, 0, 0] : 0}
                  isAnimationActive={false}
                />
              ))}
              <Line dataKey="net" name="Resultado" type="monotone" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-inflow" /> Entradas</li>
          {CATEGORIES.map((c) => (
            <li key={c} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: CATEGORY_META[c].color }} /> {CATEGORY_META[c].label}
            </li>
          ))}
          <li className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-foreground" /> Resultado</li>
        </ul>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6" aria-labelledby="tags-title">
          <h3 id="tags-title" className="font-display text-lg font-semibold">Para onde foi o dinheiro</h3>
          {report.byTag.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sem despesas neste período.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {report.byTag.map((t) => (
                <li key={t.tag}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span>{TAG_META[t.tag].label}</span>
                    <span className="tabular-nums">
                      {formatBRL(t.amount)} <span className="text-muted-foreground">({Math.round(t.share * 100)}%)</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(t.amount / maxTag) * 100}%`, background: CATEGORY_META[TAG_META[t.tag].bucket].color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6" aria-labelledby="top-title">
          <h3 id="top-title" className="font-display text-lg font-semibold">Maiores despesas</h3>
          {report.topExpenses.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sem despesas neste período.</p>
          ) : (
            <ol className="mt-4 divide-y divide-border">
              {report.topExpenses.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{e.description}</p>
                    <p className="text-xs text-muted-foreground">{TAG_META[tagOf(e)].label}, {formatDate(e.createdAt)}</p>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums">−{formatBRL(e.amount)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
