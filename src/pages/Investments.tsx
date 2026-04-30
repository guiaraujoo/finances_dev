import { useMemo, useState } from "react";
import { InvestmentForm } from "@/components/finance/InvestmentForm";
import { InvestmentChart } from "@/components/finance/InvestmentChart";
import { InvestmentSummary } from "@/components/finance/InvestmentSummary";
import {
  calculateInvestment,
  InvestmentInput,
  InvestmentType,
  Scenario,
  SCENARIOS,
} from "@/utils/calculateInvestment";

const DEFAULT_INPUT: InvestmentInput = {
  initial: 0,
  monthly: 0,
  rate: 11.75,
  rateMode: "yearly",
  period: 1,
  periodMode: "years",
};

export default function Investments() {
  const [input, setInput] = useState<InvestmentInput>(DEFAULT_INPUT);
  const [type, setType] = useState<InvestmentType>("fixed");

  const result = useMemo(() => calculateInvestment(input), [input]);

  const applyScenario = (s: Scenario) => {
    setType("custom");
    setInput((prev) => ({ ...prev, rate: SCENARIOS[s].rate, rateMode: "yearly" }));
  };

  return (
    <div className="space-y-6">
      <InvestmentSummary result={result} />

      <div className="grid gap-5 lg:grid-cols-2">
        <InvestmentForm
          input={input}
          onChange={setInput}
          type={type}
          onTypeChange={setType}
          onApplyScenario={applyScenario}
        />
        <InvestmentChart series={result.series} />
      </div>
    </div>
  );
}
