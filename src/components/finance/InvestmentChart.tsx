import { Card } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MonthPoint } from "@/utils/calculateInvestment";
import { formatBRL } from "@/lib/finance";
import { TrendingUp } from "lucide-react";

interface Props {
  series: MonthPoint[];
}

const compactBRL = (n: number) =>
  n >= 1000
    ? `R$ ${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`
    : `R$ ${n.toFixed(0)}`;

export function InvestmentChart({ series }: Props) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-md bg-accent/10 p-2">
          <TrendingUp className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">Evolução do patrimônio</h3>
          <p className="text-xs text-muted-foreground">
            Investido vs. rendimento ao longo do tempo
          </p>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.55} />
                <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={(m) => (m % Math.max(1, Math.floor(series.length / 8)) === 0 ? `${m}m` : "")}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={compactBRL}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name) => [formatBRL(value), name]}
              labelFormatter={(m) => `Mês ${m}`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="invested"
              name="Investido"
              stackId="1"
              stroke="hsl(var(--primary))"
              fill="url(#invGrad)"
            />
            <Area
              type="monotone"
              dataKey="interest"
              name="Rendimento"
              stackId="1"
              stroke="hsl(var(--warning))"
              fill="url(#intGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
