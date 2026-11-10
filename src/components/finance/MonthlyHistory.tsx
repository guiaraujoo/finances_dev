import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CalendarDays, Download, TrendingDown, TrendingUp, Wallet, Inbox } from "lucide-react";
import { CATEGORY_META, TAG_META, formatBRL, formatDate, formatPct, toneClass, variationPct, type Expense, type Income } from "@/lib/finance";
import { tagOf } from "@/lib/categorize";
import { buildCSV, downloadCSV } from "@/lib/export";
import { buildMonthlySummaries } from "@/lib/history";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthlyHistoryProps {
  expenses: Expense[];
  incomes: Income[];
}


const currency = formatBRL;

// Variação em relação ao mês anterior; para gastos, subir é ruim (cor invertida).
function Variation({ value, inverse = false }: { value: number | null; inverse?: boolean }) {
  if (value === null) return <p className="mt-1 text-xs text-muted-foreground">Sem mês anterior para comparar</p>;
  const bad = inverse ? value > 0 : value < 0;
  return (
    <p className={`mt-1 text-xs ${value === 0 ? "text-muted-foreground" : bad ? "text-danger" : "text-primary"}`}>
      {formatPct(value)} vs. mês anterior
    </p>
  );
}

export function MonthlyHistory({ expenses, incomes }: MonthlyHistoryProps) {
  const summaries = useMemo(
    () => buildMonthlySummaries(expenses, incomes),
    [expenses, incomes],
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selected = summaries.find((s) => s.key === selectedKey) ?? summaries[0];
  // summaries vem do mais recente para o mais antigo: o anterior é o índice seguinte.
  const previous = selected ? summaries[summaries.indexOf(selected) + 1] : undefined;

  const handleExport = () => {
    if (!selected) return;
    downloadCSV(`financas-${selected.key}.csv`, buildCSV(selected.expenses, selected.incomes));
  };

  const chartData = useMemo(
    () =>
      [...summaries]
        .sort((a, b) => (a.key > b.key ? 1 : -1))
        .slice(-6)
        .map((s) => ({
          name: s.label.split(" de ")[0].slice(0, 3),
          gastos: s.totalExpenses,
          receitas: s.totalIncome,
        })),
    [summaries],
  );

  if (summaries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center text-sm text-muted-foreground">
          <Inbox className="h-8 w-8 opacity-50" />
          Nenhum gasto ou receita registrado ainda. Assim que você adicionar
          lançamentos, eles aparecerão aqui organizados por mês.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Seletor de mês */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Selecionar mês">
        {summaries.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={s.key === selected?.key}
            onClick={() => setSelectedKey(s.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              s.key === selected?.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary/60 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {s.label}
          </button>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={handleExport} className="ml-auto">
          <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar CSV
        </Button>
      </div>

      {selected && (
        <>
          {/* Cards de resumo do mês selecionado */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gasto no mês
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-outflow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {currency(selected.totalExpenses)}
                </div>
                <Variation value={previous ? variationPct(selected.totalExpenses, previous.totalExpenses) : null} inverse />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita no mês
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-inflow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {currency(selected.totalIncome)}
                </div>
                <Variation value={previous ? variationPct(selected.totalIncome, previous.totalIncome) : null} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saldo
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold tabular-nums ${toneClass(selected.balance)}`}
                >
                  {currency(selected.balance)}
                </div>
                <Variation value={previous ? variationPct(selected.balance, previous.balance) : null} />
              </CardContent>
            </Card>
          </div>

          {/* Detalhamento por categoria + lista de despesas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4" /> Detalhes de {selected.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(
                  Object.keys(selected.totalsByCategory) as Array<
                    keyof typeof selected.totalsByCategory
                  >
                ).map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {CATEGORY_META[cat].label}:{" "}
                    {currency(selected.totalsByCategory[cat])}
                  </Badge>
                ))}
              </div>

              <ScrollArea className="h-64 pr-3">
                <div className="space-y-2">
                  {selected.expenses.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Nenhuma despesa registrada neste mês.
                    </p>
                  ) : (
                    [...selected.expenses]
                      .sort((a, b) => b.createdAt - a.createdAt)
                      .map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">{e.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {TAG_META[tagOf(e)].label}, {formatDate(e.createdAt)}
                            </p>
                          </div>
                          <span className="font-semibold tabular-nums">−{currency(e.amount)}</span>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Comparativo dos últimos meses */}
          {chartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimos meses</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} width={40} />
                    <Tooltip
                      formatter={(value: number) => currency(value)}
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--inflow))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" name="Gastos" fill="hsl(var(--outflow))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}