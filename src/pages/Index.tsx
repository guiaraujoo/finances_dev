import { useMemo, useState } from "react";
import { useFinance } from "@/hooks/useFinance";
import { SummaryCards, type Scope } from "@/components/finance/SummaryCards";
import { RuleBreakdown } from "@/components/finance/RuleBreakdown";
import { SpendingPie } from "@/components/finance/SpendingPie";
import { PlannedVsActualBar } from "@/components/finance/PlannedVsActualBar";
import { IncomeForm } from "@/components/finance/IncomeForm";
import { ExpenseForm } from "@/components/finance/ExpenseForm";
import { RuleEditor } from "@/components/finance/RuleEditor";
import { MonthlyHistory } from "@/components/finance/MonthlyHistory";
import { BudgetAlerts, BudgetPanel } from "@/components/finance/BudgetPanel";
import { Reports } from "@/components/finance/Reports";
import { Goals } from "@/components/finance/Goals";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotateCcw, LayoutDashboard, TrendingUp, History, Download, BarChart3, PiggyBank } from "lucide-react";
import { TAG_META, formatBRL, sumTotals, type Category, type TagId } from "@/lib/finance";
import { buildCSV, downloadCSV } from "@/lib/export";
import { currentMonthKey, monthKeyFromTimestamp, monthLabelFromKey } from "@/lib/history";
import { budgetStatuses, crossedLevel, monthElapsed, spentByTag } from "@/lib/budget";
import { tagOf } from "@/lib/categorize";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import Investments from "./Investments";

const Index = () => {
  const f = useFinance();
  const [scope, setScope] = useState<Scope>("month");
  const monthKey = currentMonthKey();

  // Lançamentos do mês corrente: base para limites, alertas e o resumo "Este mês".
  const month = useMemo(() => {
    const inMonth = <T extends { createdAt: number }>(x: T) => monthKeyFromTimestamp(x.createdAt) === monthKey;
    return { expenses: f.expenses.filter(inMonth), incomes: f.incomes.filter(inMonth) };
  }, [f.expenses, f.incomes, monthKey]);

  const monthTotals = useMemo(() => sumTotals(month.expenses, month.incomes), [month]);
  const totals =
    scope === "month"
      ? monthTotals
      : { totalIncome: f.totalIncome, totalExpenses: f.totalExpenses, totalsByCategory: f.totalsByCategory, balance: f.balance };

  const statuses = useMemo(() => budgetStatuses(month.expenses, f.budgets), [month.expenses, f.budgets]);

  const handleAddExpense = (description: string, amount: number, category: Category, tag?: TagId) => {
    const resolvedTag = tag ?? tagOf({ id: "", description, amount, category, createdAt: 0 });
    const limit = f.budgets[resolvedTag];
    f.addExpense(description, amount, category, tag);
    if (!limit) return;
    const before = spentByTag(month.expenses)[resolvedTag];
    const level = crossedLevel(before, before + amount, limit);
    const label = TAG_META[resolvedTag].label;
    if (level === "over") {
      toast.error(`${label} passou do limite do mês`, {
        description: `${formatBRL(before + amount)} de ${formatBRL(limit)}.`,
      });
    } else if (level === "near") {
      toast.warning(`${label} está perto do limite`, {
        description: `Restam ${formatBRL(limit - before - amount)} até o fim do mês.`,
      });
    }
  };

  const handleRemoveExpense = (id: string) => {
    const removed = f.expenses.find((e) => e.id === id);
    if (!removed) return;
    f.removeExpense(id);
    toast("Despesa removida", {
      description: removed.description,
      action: { label: "Desfazer", onClick: () => f.restoreExpense(removed) },
    });
  };

  const handleRemoveIncome = (id: string) => {
    const removed = f.incomes.find((i) => i.id === id);
    if (!removed) return;
    f.removeIncome(id);
    toast("Receita removida", {
      description: removed.source,
      action: { label: "Desfazer", onClick: () => f.restoreIncome(removed) },
    });
  };

  const hasData = f.incomes.length + f.expenses.length > 0;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Finances Dev</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Registre o que entra e o que sai, e acompanhe para onde vai cada parte da sua renda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              disabled={!hasData}
              onClick={() => downloadCSV("financas.csv", buildCSV(f.expenses, f.incomes))}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!hasData && f.goals.length === 0}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Apagar dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apagar todos os dados?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Receitas, despesas, limites, metas e a regra personalizada serão apagados deste navegador. Não dá
                    para desfazer. Se quiser guardar uma cópia, exporte antes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      f.reset();
                      toast.success("Dados apagados");
                    }}
                  >
                    Apagar dados
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        {f.saveFailed && (
          <p role="alert" className="mb-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
            O navegador não deixou salvar as últimas alterações (armazenamento cheio ou bloqueado). Exporte seus dados
            para não perdê-los.
          </p>
        )}

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6 flex h-auto w-full justify-start overflow-x-auto sm:w-fit">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" /> Painel
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Relatórios
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-1.5">
              <PiggyBank className="h-3.5 w-3.5" /> Metas
            </TabsTrigger>
            <TabsTrigger value="investments" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Investimentos
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-3.5 w-3.5" /> Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <SummaryCards
              income={totals.totalIncome}
              expenses={totals.totalExpenses}
              balance={totals.balance}
              totalsByCategory={totals.totalsByCategory}
              title={scope === "month" ? monthLabelFromKey(monthKey) : "Todo o período"}
              scope={scope}
              onScopeChange={setScope}
              elapsed={scope === "month" ? monthElapsed() : undefined}
            />
            <BudgetAlerts statuses={statuses} />

            <div className="grid gap-5 lg:grid-cols-2">
              <ExpenseForm expenses={f.expenses} onAdd={handleAddExpense} onRemove={handleRemoveExpense} />
              <IncomeForm incomes={f.incomes} onAdd={f.addIncome} onRemove={handleRemoveIncome} />
            </div>

            <RuleBreakdown totalIncome={totals.totalIncome} totalsByCategory={totals.totalsByCategory} rule={f.rule} />
            <div className="grid gap-5 lg:grid-cols-2">
              <BudgetPanel monthExpenses={month.expenses} budgets={f.budgets} statuses={statuses} onSave={f.setBudgets} />
              <SpendingPie totalsByCategory={totals.totalsByCategory} />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <RuleEditor rule={f.rule} onChange={f.setRule} onReset={f.resetRule} />
              <PlannedVsActualBar totalIncome={totals.totalIncome} totalsByCategory={totals.totalsByCategory} rule={f.rule} />
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <Reports expenses={f.expenses} incomes={f.incomes} />
          </TabsContent>

          <TabsContent value="goals">
            <Goals
              goals={f.goals}
              emergencySuggestion={monthTotals.totalsByCategory.fixed * 6}
              onAdd={f.addGoal}
              onMove={f.moveGoal}
              onRemove={(goal) => {
                f.removeGoal(goal.id);
                toast("Meta excluída", {
                  description: goal.name,
                  action: { label: "Desfazer", onClick: () => f.restoreGoal(goal) },
                });
              }}
              onRecordInvestment={(description, amount) => f.addExpense(description, amount, "investment", "investimentos")}
            />
          </TabsContent>

          <TabsContent value="investments">
            <Investments />
          </TabsContent>

          <TabsContent value="history">
            <MonthlyHistory expenses={f.expenses} incomes={f.incomes} />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          <p>Seus dados ficam só neste navegador e não são enviados para nenhum servidor.</p>
          <p className="mt-1">© 2026 Guilherme Araújo</p>
        </footer>
      </div>
    </main>
  );
};

export default Index;
