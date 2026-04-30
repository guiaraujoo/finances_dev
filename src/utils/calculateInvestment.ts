export type RateMode = "yearly" | "monthly";
export type PeriodMode = "months" | "years";
export type InvestmentType = "fixed" | "variable" | "custom";
export type Scenario = "conservative" | "moderate" | "aggressive";

export interface InvestmentInput {
  initial: number;
  monthly: number;
  rate: number; // percent
  rateMode: RateMode;
  period: number;
  periodMode: PeriodMode;
}

export interface MonthPoint {
  month: number;
  invested: number;
  interest: number;
  total: number;
}

export interface InvestmentResult {
  series: MonthPoint[];
  totalInvested: number;
  totalInterest: number;
  finalAmount: number;
  monthlyRate: number;
  months: number;
}

export const SCENARIOS: Record<Scenario, { label: string; rate: number; description: string }> = {
  conservative: { label: "Conservador", rate: 8, description: "Tesouro Selic / CDB pós-fixado" },
  moderate: { label: "Moderado", rate: 12, description: "Mix renda fixa + multimercado" },
  aggressive: { label: "Agressivo", rate: 18, description: "Renda variável / ações" },
};

export const INVESTMENT_TYPE_DEFAULTS: Record<InvestmentType, { label: string; rate: number; description: string }> = {
  fixed: { label: "Renda Fixa", rate: 11.75, description: "CDI / Tesouro Selic (média atual)" },
  variable: { label: "Renda Variável", rate: 14, description: "Média histórica Ibovespa" },
  custom: { label: "Personalizado", rate: 10, description: "Defina sua própria taxa" },
};

export function toMonthlyRate(rate: number, mode: RateMode): number {
  const r = rate / 100;
  return mode === "monthly" ? r : Math.pow(1 + r, 1 / 12) - 1;
}

export function toMonths(period: number, mode: PeriodMode): number {
  return mode === "months" ? Math.round(period) : Math.round(period * 12);
}

export function calculateInvestment(input: InvestmentInput): InvestmentResult {
  const months = Math.max(0, toMonths(input.period, input.periodMode));
  const i = toMonthlyRate(input.rate, input.rateMode);
  const series: MonthPoint[] = [];

  let total = input.initial;
  let invested = input.initial;

  series.push({ month: 0, invested, interest: 0, total });

  for (let m = 1; m <= months; m++) {
    total = total * (1 + i) + input.monthly;
    invested += input.monthly;
    const interest = Math.max(0, total - invested);
    series.push({ month: m, invested, interest, total });
  }

  return {
    series,
    totalInvested: invested,
    totalInterest: Math.max(0, total - invested),
    finalAmount: total,
    monthlyRate: i,
    months,
  };
}
