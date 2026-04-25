import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { formatBRL, type Income } from "@/lib/finance";
import { toast } from "sonner";

interface Props {
  incomes: Income[];
  onAdd: (source: string, amount: number) => void;
  onRemove: (id: string) => void;
}

export function IncomeForm({ incomes, onAdd, onRemove }: Props) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = source.trim().slice(0, 60);
    const value = parseFloat(amount.replace(",", "."));
    if (!trimmed) return toast.error("Informe a fonte da receita");
    if (!value || value <= 0) return toast.error("Valor inválido");
    onAdd(trimmed, value);
    setSource("");
    setAmount("");
    toast.success("Receita adicionada");
  };

  return (
    <div className="surface-card rounded-2xl border border-border p-6">
      <h3 className="font-display text-lg font-semibold">Receitas</h3>
      <p className="text-xs text-muted-foreground">Salário e outras fontes</p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_auto]">
        <div className="grid gap-1.5">
          <Label htmlFor="src" className="text-xs">Descrição</Label>
          <Input id="src" value={source} maxLength={60} placeholder="Salário"
            onChange={(e) => setSource(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="amt" className="text-xs">Valor (R$)</Label>
          <Input id="amt" value={amount} type="number" step="0.01" min="0" placeholder="0,00"
            onChange={(e) => setAmount(e.target.value)} />
        </div>
        <Button type="submit" className="self-end bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </form>

      {incomes.length > 0 && (
        <ul className="mt-5 space-y-2">
          {incomes.map((i) => (
            <li key={i.id} className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-2.5">
              <span className="text-sm">{i.source}</span>
              <div className="flex items-center gap-3">
                <span className="font-medium text-primary">{formatBRL(i.amount)}</span>
                <button onClick={() => onRemove(i.id)} className="text-muted-foreground hover:text-danger transition-colors">
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
