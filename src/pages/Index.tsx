import { useFinance } from "@/hooks/useFinance";
import { SummaryCards } from "@/components/finance/SummaryCards";
import { RuleBreakdown } from "@/components/finance/RuleBreakdown";
import { SpendingPie } from "@/components/finance/SpendingPie";
import { PlannedVsActualBar } from "@/components/finance/PlannedVsActualBar";
import { IncomeForm } from "@/components/finance/IncomeForm";
import { ExpenseForm } from "@/components/finance/ExpenseForm";
import { RuleEditor } from "@/components/finance/RuleEditor";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw } from "lucide-react";
import { formatRuleLabel } from "@/lib/finance";

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
        </header>

        {/* Summary */}
        <section className="mb-6">
          <SummaryCards income={f.totalIncome} expenses={f.totalExpenses} balance={f.balance} />
        </section>

        {/* Rule breakdown */}
        <section className="mb-8">
          <RuleBreakdown totalIncome={f.totalIncome} totalsByCategory={f.totalsByCategory} rule={f.rule} />
        </section>

        {/* Rule editor + Pie */}
        <section className="mb-8 grid gap-5 lg:grid-cols-2">
          <RuleEditor rule={f.rule} onChange={f.setRule} onReset={f.resetRule} />
          <SpendingPie totalsByCategory={f.totalsByCategory} />
        </section>

        {/* Charts */}
        <section className="mb-8">
          <PlannedVsActualBar totalIncome={f.totalIncome} totalsByCategory={f.totalsByCategory} rule={f.rule} />
        </section>

        {/* Forms */}
        <section className="grid gap-5 lg:grid-cols-2">
          <IncomeForm incomes={f.incomes} onAdd={f.addIncome} onRemove={f.removeIncome} />
          <ExpenseForm expenses={f.expenses} onAdd={f.addExpense} onRemove={f.removeExpense} />
        </section>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          © 2026 Guilherme Araújo
        </footer>
      </div>
    </main>
  );
};

export default Index;
