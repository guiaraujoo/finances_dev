import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, OctagonAlert, Target } from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORY_META,
  TAG_IDS,
  TAG_META,
  formatBRL,
  parseAmount,
  toInputAmount,
  type Budgets,
  type Expense,
  type TagId,
} from "@/lib/finance";
import { budgetStatuses, spentByTag, NEAR_LIMIT, type BudgetLevel, type BudgetStatus } from "@/lib/budget";

const LEVEL_STYLE: Record<BudgetLevel, { bar: string; text: string }> = {
  ok: { bar: "bg-inflow", text: "text-muted-foreground" },
  near: { bar: "bg-warning", text: "text-warning" },
  over: { bar: "bg-danger", text: "text-danger" },
};

function describe(s: BudgetStatus): string {
  if (s.level === "over") return `${formatBRL(-s.remaining)} acima do limite`;
  if (s.spent > s.pace && s.level === "ok") return `Restam ${formatBRL(s.remaining)}, gasto acima do ritmo do mês`;
  return `Restam ${formatBRL(s.remaining)}`;
}

/** Avisos que aparecem no topo do painel quando alguma categoria passa de 80% do limite. */
export function BudgetAlerts({ statuses }: { statuses: BudgetStatus[] }) {
  const alerts = statuses.filter((s) => s.level !== "ok");
  if (alerts.length === 0) return null;
  return (
    <ul className="grid gap-2 sm:grid-cols-2" aria-label="Alertas de limite">
      {alerts.map((s) => {
        const over = s.level === "over";
        const Icon = over ? OctagonAlert : AlertTriangle;
        return (
          <li
            key={s.tag}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              over ? "border-danger/40 bg-danger/10" : "border-warning/40 bg-warning/10"
            }`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${over ? "text-danger" : "text-warning"}`} aria-hidden="true" />
            <p>
              <strong className="font-medium">{TAG_META[s.tag].label}</strong>{" "}
              {over
                ? `passou do limite: ${formatBRL(s.spent)} de ${formatBRL(s.limit)}.`
                : `chegou a ${Math.round(s.ratio * 100)}% do limite. Restam ${formatBRL(s.remaining)} para o mês.`}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

interface Props {
  monthExpenses: Expense[];
  budgets: Budgets;
  statuses: BudgetStatus[];
  onSave: (budgets: Budgets) => void;
}

export function BudgetPanel({ monthExpenses, budgets, statuses, onSave }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="surface-card rounded-2xl border border-border p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Limites do mês</h3>
          <p className="text-sm text-muted-foreground">Avisamos quando uma categoria chega a {NEAR_LIMIT * 100}% do limite.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="shrink-0">
          {statuses.length ? "Editar limites" : "Definir limites"}
        </Button>
      </div>

      {statuses.length === 0 ? (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          <Target className="h-5 w-5" />
          <p>Escolha as categorias em que o dinheiro costuma escapar (comer fora, compras, lazer) e defina quanto pode ir para cada uma por mês.</p>
          <Button size="sm" onClick={() => setOpen(true)}>Definir limites</Button>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {statuses.map((s) => {
            const style = LEVEL_STYLE[s.level];
            return (
              <li key={s.tag}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[TAG_META[s.tag].bucket].color }} />
                    {TAG_META[s.tag].label}
                  </span>
                  <span className="tabular-nums">
                    {formatBRL(s.spent)} <span className="text-muted-foreground">de {formatBRL(s.limit)}</span>
                  </span>
                </div>
                <div
                  className="relative mt-1.5 h-2 rounded-full bg-secondary"
                  role="progressbar"
                  aria-label={`${TAG_META[s.tag].label}: ${Math.round(s.ratio * 100)}% do limite`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(Math.round(s.ratio * 100), 100)}
                >
                  <div className={`h-full rounded-full transition-[width] duration-500 ${style.bar}`} style={{ width: `${Math.min(s.ratio, 1) * 100}%` }} />
                  {/* Marca onde o gasto "deveria" estar hoje se fosse distribuído pelo mês. */}
                  <span
                    className="absolute -top-0.5 h-3 w-0.5 rounded bg-foreground/50"
                    style={{ left: `${Math.min(s.pace / s.limit, 1) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
                <p className={`mt-1 text-xs ${style.text}`}>{describe(s)}</p>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <BudgetDialog
          budgets={budgets}
          spent={spentByTag(monthExpenses)}
          onClose={() => setOpen(false)}
          onSave={(b) => {
            onSave(b);
            setOpen(false);
            toast.success("Limites salvos");
          }}
        />
      )}
    </div>
  );
}

function BudgetDialog({
  budgets,
  spent,
  onClose,
  onSave,
}: {
  budgets: Budgets;
  spent: Record<TagId, number>;
  onClose: () => void;
  onSave: (b: Budgets) => void;
}) {
  // Investimento não faz sentido como "limite de gasto"; ele é meta (aba Metas).
  const tags = useMemo(() => TAG_IDS.filter((t) => t !== "investimentos"), []);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(tags.map((t) => [t, budgets[t] ? toInputAmount(budgets[t]!) : ""])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Budgets = {};
    const found: Record<string, string> = {};
    for (const t of tags) {
      const raw = draft[t].trim();
      if (!raw) continue; // vazio = sem limite
      const value = parseAmount(raw);
      if (Number.isNaN(value) || value <= 0) found[t] = "Use um valor maior que zero, ou deixe vazio";
      else if (value > 1_000_000_000) found[t] = "Valor muito alto";
      else next[t] = value;
    }
    setErrors(found);
    if (Object.keys(found).length === 0) onSave(next);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Limites mensais por categoria</DialogTitle>
          <DialogDescription>Deixe em branco as categorias que não quer acompanhar.</DialogDescription>
        </DialogHeader>
        <form id="budget-form" onSubmit={submit} className="grid gap-3">
          {tags.map((t) => (
            <div key={t} className="grid grid-cols-[1fr_130px] items-center gap-x-3 gap-y-1">
              <Label htmlFor={`b-${t}`} className="text-sm font-normal">
                {TAG_META[t].label}
                <span className="block text-xs text-muted-foreground">Este mês: {formatBRL(spent[t])}</span>
              </Label>
              <Input
                id={`b-${t}`}
                inputMode="decimal"
                placeholder="Sem limite"
                autoComplete="off"
                value={draft[t]}
                aria-invalid={!!errors[t]}
                aria-describedby={errors[t] ? `b-${t}-err` : undefined}
                onChange={(e) => setDraft((d) => ({ ...d, [t]: e.target.value }))}
              />
              {errors[t] && (
                <p id={`b-${t}-err`} role="alert" className="col-span-2 text-xs text-danger">{errors[t]}</p>
              )}
            </div>
          ))}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="budget-form">Salvar limites</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
