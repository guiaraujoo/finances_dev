import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { formatBRL } from "@/lib/finance";

interface Props {
  income: number;
  expenses: number;
  balance: number;
}

export function SummaryCards({ income, expenses, balance }: Props) {
  const positive = balance >= 0;
  const cards = [
    {
      label: "Renda total",
      value: income,
      icon: ArrowUpRight,
      tone: "text-primary",
      ring: "ring-primary/20",
    },
    {
      label: "Saídas totais",
      value: expenses,
      icon: ArrowDownRight,
      tone: "text-accent",
      ring: "ring-accent/20",
    },
    {
      label: "Saldo",
      value: balance,
      icon: Wallet,
      tone: positive ? "text-primary" : "text-danger",
      ring: positive ? "ring-primary/20" : "ring-danger/20",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className={`surface-card rounded-2xl border border-border p-6 ring-1 ${c.ring}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</p>
            <c.icon className={`h-4 w-4 ${c.tone}`} />
          </div>
          <p className={`mt-3 font-display text-3xl font-semibold tracking-tight ${c.tone}`}>
            {formatBRL(c.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
