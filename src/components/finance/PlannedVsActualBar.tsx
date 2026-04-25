import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import { CATEGORY_META, formatBRL, type Category, type Rule } from "@/lib/finance";

interface Props {
  totalIncome: number;
  totalsByCategory: Record<Category, number>;
  rule: Rule;
}

export function PlannedVsActualBar({ totalIncome, totalsByCategory, rule }: Props) {
  const data = (Object.keys(CATEGORY_META) as Category[]).map((cat) => ({
    name: `${rule[cat]}% ${CATEGORY_META[cat].label}`,
    Planejado: +(totalIncome * (rule[cat] / 100)).toFixed(2),
    Real: +totalsByCategory[cat].toFixed(2),
  }));

  return (
    <div className="surface-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Planejado vs Real</h3>
        <span className="text-xs text-muted-foreground"></span>
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--secondary))", opacity: 0.4 }}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number) => formatBRL(v)}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
            />
            <Bar dataKey="Planejado" fill="hsl(var(--muted-foreground))" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Real" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
