import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_META, formatBRL, type Category } from "@/lib/finance";

interface Props {
  totalsByCategory: Record<Category, number>;
}

export function SpendingPie({ totalsByCategory }: Props) {
  const data = (Object.keys(CATEGORY_META) as Category[])
    .map((cat) => ({
      name: CATEGORY_META[cat].label,
      value: totalsByCategory[cat],
      color: CATEGORY_META[cat].color,
    }))
    .filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="surface-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Distribuição atual</h3>
        <span className="text-xs text-muted-foreground">Por categoria</span>
      </div>

      <div className="relative mt-4 h-72">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Adicione despesas para ver o gráfico
          </div>
        ) : (
          <>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={3}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(0, 0%, 66%)",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatBRL(v)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Total</span>
              <span className="font-display text-2xl font-semibold">{formatBRL(total)}</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {(Object.keys(CATEGORY_META) as Category[]).map((cat) => (
          <div key={cat} className="rounded-lg bg-secondary/50 p-2">
            <div className="flex items-center justify-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[cat].color }} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {CATEGORY_META[cat].label}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium">{formatBRL(totalsByCategory[cat])}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
