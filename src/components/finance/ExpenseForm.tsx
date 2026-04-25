import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { CATEGORY_META, formatBRL, type Category, type Expense } from "@/lib/finance";
import { toast } from "sonner";

interface Props {
  expenses: Expense[];
  onAdd: (description: string, amount: number, category: Category) => void;
  onRemove: (id: string) => void;
}

export function ExpenseForm({ expenses, onAdd, onRemove }: Props) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("fixed");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = desc.trim().slice(0, 60);
    const value = parseFloat(amount.replace(",", "."));
    if (!trimmed) return toast.error("Informe a descrição");
    if (!value || value <= 0) return toast.error("Valor inválido");
    onAdd(trimmed, value, category);
    setDesc("");
    setAmount("");
    toast.success("Despesa registrada");
  };

  return (
    <div className="surface-card rounded-2xl border border-border p-6">
      <h3 className="font-display text-lg font-semibold">Despesas</h3>
      <p className="text-xs text-muted-foreground">Categorize seus gastos</p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="d" className="text-xs">Descrição</Label>
          <Input id="d" value={desc} maxLength={60} placeholder="Aluguel"
            onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="a" className="text-xs">Valor (R$)</Label>
          <Input id="a" value={amount} type="number" step="0.01" min="0" placeholder="0,00"
            onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label className="text-xs">Categoria</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_META[c].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="sm:col-span-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
          <Plus className="mr-1 h-4 w-4" /> Registrar despesa
        </Button>
      </form>

      {expenses.length > 0 && (
        <ul className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
          {[...expenses].reverse().map((e) => {
            const meta = CATEGORY_META[e.category];
            return (
              <li key={e.id} className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm">{e.description}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                    {meta.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatBRL(e.amount)}</span>
                  <button onClick={() => onRemove(e.id)} className="text-muted-foreground hover:text-danger transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
