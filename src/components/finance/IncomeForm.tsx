import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Inbox } from "lucide-react";
import { formatBRL, formatDate, parseAmount, validateEntry, type EntryErrors, type Income } from "@/lib/finance";
import { toast } from "sonner";

interface Props {
  incomes: Income[];
  onAdd: (source: string, amount: number) => void;
  onRemove: (id: string) => void;
}

export function IncomeForm({ incomes, onAdd, onRemove }: Props) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<EntryErrors>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseAmount(amount);
    const found = validateEntry(source, value, "a fonte da receita");
    setErrors(found);
    if (found.description || found.amount) return;
    onAdd(source.trim().slice(0, 60), value);
    setSource("");
    setAmount("");
    toast.success("Receita adicionada");
  };

  return (
    <div className="surface-card rounded-2xl border border-border p-6">
      <h3 className="font-display text-lg font-semibold">Receitas</h3>
      <p className="text-sm text-muted-foreground">Salário, freelas e outras fontes</p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_auto]">
        <div className="grid gap-1.5">
          <Label htmlFor="src" className="text-xs">Descrição</Label>
          <Input id="src" value={source} maxLength={60} placeholder="Salário"
            aria-invalid={!!errors.description} aria-describedby={errors.description ? "src-err" : undefined}
            onChange={(e) => setSource(e.target.value)} />
          {errors.description && <p id="src-err" role="alert" className="text-xs text-danger">{errors.description}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="amt" className="text-xs">Valor (R$)</Label>
          <Input id="amt" value={amount} type="text" inputMode="decimal" placeholder="0,00"
            aria-invalid={!!errors.amount} aria-describedby={errors.amount ? "amt-err" : undefined}
            onChange={(e) => setAmount(e.target.value)} />
          {errors.amount && <p id="amt-err" role="alert" className="text-xs text-danger">{errors.amount}</p>}
        </div>
        <Button type="submit" variant="outline" className="sm:self-start sm:mt-[1.375rem] border-inflow/40 text-inflow hover:bg-inflow/10 hover:text-inflow">
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </form>

      {incomes.length === 0 ? (
        <p className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          <Inbox className="h-4 w-4" /> Nenhuma receita ainda. Comece pelo seu salário do mês.
        </p>
      ) : (
        <ul className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
          {[...incomes].reverse().map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm">{i.source}</p>
                <span className="text-xs text-muted-foreground">{formatDate(i.createdAt)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium tabular-nums text-inflow">+{formatBRL(i.amount)}</span>
                <button
                  type="button"
                  aria-label={`Remover receita ${i.source}`}
                  onClick={() => onRemove(i.id)}
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
