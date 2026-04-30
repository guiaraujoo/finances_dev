import { useFinance } from "@/hooks/useFinance";
import { SummaryCards } from "@/components/finance/SummaryCards";
import { RuleBreakdown } from "@/components/finance/RuleBreakdown";
import { SpendingPie } from "@/components/finance/SpendingPie";
import { PlannedVsActualBar } from "@/components/finance/PlannedVsActualBar";
import { IncomeForm } from "@/components/finance/IncomeForm";
import { ExpenseForm } from "@/components/finance/ExpenseForm";
import { RuleEditor } from "@/components/finance/RuleEditor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, RotateCcw, LayoutDashboard, TrendingUp } from "lucide-react";
import { formatRuleLabel } from "@/lib/finance";
import { ThemeToggle } from "@/components/ThemeToggle";
import Investments from "./Investments";

const Index = () => {
  const f = useFinance();

  return (
    <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Sua vida financeira organizada
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Finances <span className="text-gradient">Dev</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Cadastre receitas, registre despesas e acompanhe em tempo real seu dinheiro sendo direcionado para funções diferentes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Limpar todos os dados?")) f.reset();
              }}
              className="shrink-0"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Resetar
            </Button>
          </div>
        </header>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="investments" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Investimentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            <SummaryCards income={f.totalIncome} expenses={f.totalExpenses} balance={f.balance} />
            <RuleBreakdown totalIncome={f.totalIncome} totalsByCategory={f.totalsByCategory} rule={f.rule} />
            <div className="grid gap-5 lg:grid-cols-2">
              <RuleEditor rule={f.rule} onChange={f.setRule} onReset={f.resetRule} />
              <SpendingPie totalsByCategory={f.totalsByCategory} />
            </div>
            <PlannedVsActualBar totalIncome={f.totalIncome} totalsByCategory={f.totalsByCategory} rule={f.rule} />
            <div className="grid gap-5 lg:grid-cols-2">
              <IncomeForm incomes={f.incomes} onAdd={f.addIncome} onRemove={f.removeIncome} />
              <ExpenseForm expenses={f.expenses} onAdd={f.addExpense} onRemove={f.removeExpense} />
            </div>
          </TabsContent>

          <TabsContent value="investments">
            <Investments />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          © 2026 Guilherme Araújo
        </footer>
      </div>
    </main>
  );
};

export default Index;
