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

        // Para gastos, ficar abaixo é bom; para investimentos é o contrário (é uma meta, não um teto).
        const statusConfig =
          cat === "investment"
            ? {
                under: { label: "Abaixo da meta", icon: TrendingDown, color: "text-warning", bar: "bg-warning" },
                on: { label: "Na meta", icon: Check, color: "text-inflow", bar: "bg-inflow" },
                over: { label: "Acima da meta", icon: TrendingUp, color: "text-inflow", bar: "bg-inflow" },
              }[status]
            : {
                under: { label: "Abaixo do limite", icon: TrendingDown, color: "text-inflow", bar: "bg-inflow" },
                on: { label: "Dentro do plano", icon: Check, color: "text-inflow", bar: "bg-inflow" },
                over: { label: "Acima do recomendado", icon: TrendingUp, color: "text-danger", bar: "bg-danger" },
              }[status];

        const Icon = statusConfig.icon;

        return (
          <div
            key={cat}
            className="surface-card relative overflow-hidden rounded-2xl border border-border p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                  {meta.label}
                  <span className="font-normal text-muted-foreground">{rule[cat]}%</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium ${statusConfig.color}`}
              >
                <Icon className="h-3 w-3" />
                {statusConfig.label}
              </span>
            </div>

            <div className="mt-5">
              <p className="font-display text-3xl font-semibold tabular-nums tracking-tight">
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
