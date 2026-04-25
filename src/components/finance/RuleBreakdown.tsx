import { CATEGORY_META, formatBRL, getStatus, type Category, type Rule } from "@/lib/finance";
import { TrendingUp, TrendingDown, Check } from "lucide-react";

interface Props {
  totalIncome: number;
  totalsByCategory: Record<Category, number>;
  rule: Rule;
}

export function RuleBreakdown({ totalIncome, totalsByCategory, rule }: Props) {
  const cats: Category[] = ["fixed", "variable", "investment"];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cats.map((cat) => {
        const meta = CATEGORY_META[cat];
        const planned = totalIncome * (rule[cat] / 100);
        const actual = totalsByCategory[cat];
        const status = getStatus(actual, planned);
        const pct = planned > 0 ? Math.min((actual / planned) * 100, 150) : 0;

        const statusConfig = {
          under: { label: "Abaixo do limite", icon: TrendingDown, color: "text-primary", bar: "bg-primary" },
          on: { label: "Dentro do plano", icon: Check, color: "text-primary", bar: "bg-primary" },
          over: { label: "Acima do recomendado", icon: TrendingUp, color: "text-danger", bar: "bg-danger" },
        }[status];

        const Icon = statusConfig.icon;

        return (
          <div
            key={cat}
            className="surface-card relative overflow-hidden rounded-2xl border border-border p-6 transition-all duration-500 hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {rule[cat]}% • {meta.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">{meta.description}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium ${statusConfig.color}`}
              >
                <Icon className="h-3 w-3" />
                {statusConfig.label}
              </span>
            </div>

            <div className="mt-5">
              <p className="font-display text-3xl font-semibold tracking-tight">
                {formatBRL(actual)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                de {formatBRL(planned)} planejado
              </p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-700 ${statusConfig.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
