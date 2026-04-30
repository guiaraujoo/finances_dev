import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InvestmentInput,
  InvestmentType,
  PeriodMode,
  RateMode,
  INVESTMENT_TYPE_DEFAULTS,
  SCENARIOS,
  Scenario,
} from "@/utils/calculateInvestment";
import { Calculator, Zap } from "lucide-react";

interface Props {
  input: InvestmentInput;
  onChange: (input: InvestmentInput) => void;
  type: InvestmentType;
  onTypeChange: (t: InvestmentType) => void;
  onApplyScenario: (s: Scenario) => void;
}

export function InvestmentForm({ input, onChange, type, onTypeChange, onApplyScenario }: Props) {
  const set = <K extends keyof InvestmentInput>(k: K, v: InvestmentInput[K]) =>
    onChange({ ...input, [k]: v });

  const handleType = (t: InvestmentType) => {
    onTypeChange(t);
    if (t !== "custom") {
      onChange({ ...input, rate: INVESTMENT_TYPE_DEFAULTS[t].rate, rateMode: "yearly" });
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="rounded-md bg-primary/10 p-2">
          <Calculator className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">Calculadora</h3>
          <p className="text-xs text-muted-foreground">Simule o crescimento do seu patrimônio</p>
        </div>
      </div>

      <div className="mb-5">
        <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
          Tipo de investimento
        </Label>
        <Tabs value={type} onValueChange={(v) => handleType(v as InvestmentType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fixed">Renda Fixa</TabsTrigger>
            <TabsTrigger value="variable">Renda Variável</TabsTrigger>
            <TabsTrigger value="custom">Personalizado</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="mt-2 text-xs text-muted-foreground">
          {INVESTMENT_TYPE_DEFAULTS[type].description}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Valor inicial (R$)</Label>
          <Input
            type="number"
            min={0}
            value={input.initial || ""}
            onChange={(e) => set("initial", Number(e.target.value) || 0)}
            placeholder="1000"
          />
        </div>
        <div>
          <Label className="text-xs">Aporte mensal (R$)</Label>
          <Input
            type="number"
            min={0}
            value={input.monthly || ""}
            onChange={(e) => set("monthly", Number(e.target.value) || 0)}
            placeholder="500"
          />
        </div>

        <div>
          <Label className="text-xs">Taxa de juros (%)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={input.rate || ""}
              onChange={(e) => set("rate", Number(e.target.value) || 0)}
              disabled={type !== "custom"}
            />
            <Tabs
              value={input.rateMode}
              onValueChange={(v) => set("rateMode", v as RateMode)}
            >
              <TabsList className="h-10">
                <TabsTrigger value="yearly" className="text-xs" disabled={type !== "custom"}>
                  a.a.
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs" disabled={type !== "custom"}>
                  a.m.
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div>
          <Label className="text-xs">Período</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              value={input.period || ""}
              onChange={(e) => set("period", Number(e.target.value) || 0)}
            />
            <Tabs
              value={input.periodMode}
              onValueChange={(v) => set("periodMode", v as PeriodMode)}
            >
              <TabsList className="h-10">
                <TabsTrigger value="months" className="text-xs">
                  meses
                </TabsTrigger>
                <TabsTrigger value="years" className="text-xs">
                  anos
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Cenários rápidos
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(SCENARIOS) as Scenario[]).map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => onApplyScenario(s)}
              className="flex-col items-start gap-0.5 h-auto py-2"
            >
              <span className="font-semibold">{SCENARIOS[s].label}</span>
              <span className="text-[10px] text-muted-foreground">
                {SCENARIOS[s].rate}% a.a.
              </span>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
