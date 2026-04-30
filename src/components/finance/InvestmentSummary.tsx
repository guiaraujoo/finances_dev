import { Card } from "@/components/ui/card";
import { InvestmentResult } from "@/utils/calculateInvestment";
import { formatBRL } from "@/lib/finance";
import { ArrowUpRight, PiggyBank, Sparkles, Wallet } from "lucide-react";

interface Props {
  result: InvestmentResult;
}

export function InvestmentSummary({ result }: Props) {
  const { finalAmount, totalInvested, totalInterest, months } = result;
  const interestPct = finalAmount > 0 ? (totalInterest / finalAmount) * 100 : 0;
  const years = (months / 12).toFixed(months % 12 === 0 ? 0 : 1);

  const cards = [
    { label: "Valor final", value: formatBRL(finalAmount), icon: Wallet, accent: "text-primary", bg: "bg-primary/10" },
    { label: "Total investido", value: formatBRL(totalInvested), icon: PiggyBank, accent: "text-accent", bg: "bg-accent/10" },
    { label: "Juros ganhos", value: formatBRL(totalInterest), icon: ArrowUpRight, accent: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className={`mb-3 inline-flex rounded-md p-2 ${c.bg}`}>
              <c.icon className={`h-4 w-4 ${c.accent}`} />
            </div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{c.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1.5">
            <p className="text-sm">
              Com esse ritmo, você terá <strong className="text-primary">{formatBRL(finalAmount)}</strong> em{" "}
              <strong>{years} {Number(years) === 1 ? "ano" : "anos"}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Seu rendimento representa{" "}
              <strong className="text-warning">{interestPct.toFixed(1)}%</strong> do total acumulado
              — o resto é fruto da sua disciplina ao investir.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
