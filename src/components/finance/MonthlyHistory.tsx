import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, TrendingDown, TrendingUp, Wallet, Inbox } from "lucide-react";
import type { Expense, Income } from "@/lib/finance";
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

const CATEGORY_LABELS: Record<string, string> = {
  fixed: "Fixo",
  variable: "Variável",
  investment: "Investimento",
};

const currency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function MonthlyHistory({ expenses, incomes }: MonthlyHistoryProps) {
  const summaries = useMemo(
    () => buildMonthlySummaries(expenses, incomes),
    [expenses, incomes],
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selected = summaries.find((s) => s.key === selectedKey) ?? summaries[0];

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
      <div className="flex flex-wrap gap-2">
        {summaries.map((s) => (
          <button
            key={s.key}
            onClick={() => setSelectedKey(s.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              s.key === selected?.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary/60 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {s.label}
          </button>
        ))}
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
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currency(selected.totalExpenses)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita no mês
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currency(selected.totalIncome)}
                </div>
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
                  className={`text-2xl font-bold ${
                    selected.balance < 0 ? "text-destructive" : ""
                  }`}
                >
                  {currency(selected.balance)}
                </div>
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
                    {CATEGORY_LABELS[cat] ?? cat}:{" "}
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
                              {CATEGORY_LABELS[e.category] ?? e.category} •{" "}
                              {new Date(e.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <span className="font-semibold">{currency(e.amount)}</span>
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
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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