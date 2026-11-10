import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PiggyBank, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatBRL, parseAmount, toInputAmount, type Goal } from "@/lib/finance";
import { formatMonthShort, goalProgress, validateGoal, type GoalErrors } from "@/lib/goals";

interface Props {
  goals: Goal[];
  /** Sugestão de reserva de emergência (6× os custos fixos do mês); 0 quando não há dados. */
  emergencySuggestion: number;
  onAdd: (name: string, target: number, deadline?: string) => void;
  onMove: (id: string, delta: number) => void;
  onRemove: (goal: Goal) => void;
  /** Registra o valor guardado como despesa da fatia Investimentos. */
  onRecordInvestment: (description: string, amount: number) => void;
}

export function Goals({ goals, emergencySuggestion, onAdd, onMove, onRemove, onRecordInvestment }: Props) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [errors, setErrors] = useState<GoalErrors>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseAmount(target);
    const found = validateGoal(name, value, deadline);
    setErrors(found);
    if (Object.keys(found).length) return;
    onAdd(name.trim().slice(0, 60), value, deadline || undefined);
    setName("");
    setTarget("");
    setDeadline("");
    toast.success("Meta criada");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <form onSubmit={submit} className="surface-card h-fit space-y-4 rounded-2xl border border-border p-6" noValidate>
        <div>
          <h3 className="font-display text-lg font-semibold">Nova meta</h3>
          <p className="text-sm text-muted-foreground">Dê um nome, um valor e, se quiser, um prazo.</p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="g-name" className="text-xs">Nome</Label>
          <Input id="g-name" value={name} maxLength={60} placeholder="Ex.: Reserva de emergência" autoComplete="off"
            aria-invalid={!!errors.name} aria-describedby={errors.name ? "g-name-err" : undefined}
            onChange={(e) => setName(e.target.value)} />
          {errors.name && <p id="g-name-err" role="alert" className="text-xs text-danger">{errors.name}</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="g-target" className="text-xs">Valor alvo (R$)</Label>
            <Input id="g-target" value={target} inputMode="decimal" placeholder="0,00" autoComplete="off"
              aria-invalid={!!errors.target} aria-describedby={errors.target ? "g-target-err" : undefined}
              onChange={(e) => setTarget(e.target.value)} />
            {errors.target && <p id="g-target-err" role="alert" className="text-xs text-danger">{errors.target}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="g-deadline" className="text-xs">Prazo (opcional)</Label>
            <Input id="g-deadline" type="month" value={deadline}
              aria-invalid={!!errors.deadline} aria-describedby={errors.deadline ? "g-deadline-err" : undefined}
              onChange={(e) => setDeadline(e.target.value)} />
            {errors.deadline && <p id="g-deadline-err" role="alert" className="text-xs text-danger">{errors.deadline}</p>}
          </div>
        </div>
        {emergencySuggestion > 0 && !target && (
          <button
            type="button"
            onClick={() => {
              setTarget(toInputAmount(emergencySuggestion));
              if (!name) setName("Reserva de emergência");
            }}
            className="w-full rounded-lg border border-dashed border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sugestão: uma reserva de emergência de {formatBRL(emergencySuggestion)} cobre 6 meses dos seus custos fixos atuais. Usar esse valor.
          </button>
        )}
        <Button type="submit" className="w-full">Criar meta</Button>
      </form>

      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">
            <PiggyBank className="h-8 w-8 opacity-50" />
            <p className="max-w-sm">Nenhuma meta ainda. Uma boa primeira meta é a reserva de emergência: de 3 a 6 meses dos seus gastos fixos.</p>
          </div>
        ) : (
          goals.map((g) => (
            <GoalCard key={g.id} goal={g} onMove={onMove} onRemove={onRemove} onRecordInvestment={onRecordInvestment} />
          ))
        )}
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  onMove,
  onRemove,
  onRecordInvestment,
}: { goal: Goal } & Pick<Props, "onMove" | "onRemove" | "onRecordInvestment">) {
  const [amount, setAmount] = useState("");
  const [record, setRecord] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const p = goalProgress(goal);
  const inputId = `goal-${goal.id}`;

  const move = (direction: 1 | -1) => {
    const value = parseAmount(amount);
    if (Number.isNaN(value) || value <= 0) return setError("Informe um valor maior que zero");
    if (direction === -1 && value > goal.saved) return setError(`Você tem ${formatBRL(goal.saved)} nesta meta`);
    if (value > 1_000_000_000) return setError("Valor muito alto");
    setError(null);
    onMove(goal.id, direction * value);
    if (direction === 1 && record) onRecordInvestment(`Meta: ${goal.name}`, value);
    setAmount("");
    toast.success(direction === 1 ? `Guardado em “${goal.name}”` : `Resgatado de “${goal.name}”`, {
      description: formatBRL(value),
    });
  };

  let plan: string;
  if (p.done) plan = "Meta alcançada.";
  else if (p.monthsLeft === null) plan = `Faltam ${formatBRL(p.remaining)}.`;
  else if (p.monthsLeft === 0) plan = `O prazo terminou. Faltam ${formatBRL(p.remaining)}.`;
  else
    plan = `Guarde ${formatBRL(p.monthlyNeeded!)} por mês para chegar lá em ${formatMonthShort(goal.deadline!)} (${p.monthsLeft} ${p.monthsLeft === 1 ? "mês" : "meses"}).`;

  return (
    <article className="surface-card rounded-2xl border border-border p-6" aria-labelledby={`${inputId}-title`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`${inputId}-title`} className="flex items-center gap-2 truncate font-display text-lg font-semibold">
            {p.done && <CheckCircle2 className="h-4 w-4 shrink-0 text-inflow" aria-label="Concluída" />}
            {goal.name}
          </h3>
          <p className="text-sm tabular-nums">
            {formatBRL(goal.saved)} <span className="text-muted-foreground">de {formatBRL(goal.target)}</span>
          </p>
        </div>
        <button
          type="button"
          aria-label={`Excluir meta ${goal.name}`}
          onClick={() => onRemove(goal)}
          className="rounded p-1 text-muted-foreground transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div
        className="mt-3 h-2.5 rounded-full bg-secondary"
        role="progressbar"
        aria-label={`Progresso da meta ${goal.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(p.ratio * 100)}
      >
        <div className="h-full rounded-full bg-inflow transition-[width] duration-500" style={{ width: `${p.ratio * 100}%` }} />
      </div>
      <p className={`mt-2 text-sm ${p.monthsLeft === 0 && !p.done ? "text-warning" : "text-muted-foreground"}`}>{plan}</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="grid flex-1 gap-1">
          <Label htmlFor={inputId} className="sr-only">Valor para guardar ou resgatar</Label>
          <Input id={inputId} value={amount} inputMode="decimal" placeholder="Valor (R$)" autoComplete="off"
            aria-invalid={!!error} aria-describedby={error ? `${inputId}-err` : undefined}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && move(1)} />
          {error && <p id={`${inputId}-err`} role="alert" className="text-xs text-danger">{error}</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => move(1)} className="flex-1 sm:flex-none">Guardar</Button>
          <Button variant="outline" onClick={() => move(-1)} disabled={goal.saved === 0} className="flex-1 sm:flex-none">Resgatar</Button>
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Checkbox checked={record} onCheckedChange={(v) => setRecord(v === true)} />
        Ao guardar, registrar também como despesa de Investimentos (entra na regra do mês)
      </label>
    </article>
  );
}
