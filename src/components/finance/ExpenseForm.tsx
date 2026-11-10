import { useDeferredValue, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Search, Trash2, Inbox, Wand2, History } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_META,
  TAG_IDS,
  TAG_META,
  filterExpenses,
  formatBRL,
  formatDate,
  parseAmount,
  validateEntry,
  type Category,
  type EntryErrors,
  type Expense,
  type TagId,
} from "@/lib/finance";
import { buildCategoryMemory, suggestCategory, tagOf } from "@/lib/categorize";
import { toast } from "sonner";

interface Props {
  expenses: Expense[];
  onAdd: (description: string, amount: number, category: Category, tag?: TagId) => void;
  onRemove: (id: string) => void;
}

// Renderiza a lista em blocos: com milhares de lançamentos o DOM continua leve.
const PAGE_SIZE = 50;

export function ExpenseForm({ expenses, onAdd, onRemove }: Props) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  // null = seguir a sugestão automática; preenchido = o usuário escolheu.
  const [tagChoice, setTagChoice] = useState<TagId | null>(null);
  const [categoryChoice, setCategoryChoice] = useState<Category | null>(null);
  const [errors, setErrors] = useState<EntryErrors>({});
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const memory = useMemo(() => buildCategoryMemory(expenses), [expenses]);
  const suggestion = useMemo(() => suggestCategory(desc, memory), [desc, memory]);
  const tag: TagId = tagChoice ?? suggestion?.tag ?? "outros";
  const category: Category =
    categoryChoice ?? (tagChoice ? TAG_META[tagChoice].bucket : suggestion?.category ?? TAG_META[tag].bucket);
  const isAuto = !tagChoice && !!suggestion;

  // A digitação na busca fica fluida; a filtragem acompanha logo em seguida.
  const deferredQuery = useDeferredValue(query);
  const visible = useMemo(
    () => filterExpenses([...expenses].reverse(), { query: deferredQuery, category: filterCategory }),
    [expenses, deferredQuery, filterCategory],
  );
  const visibleTotal = useMemo(() => visible.reduce((sum, e) => sum + e.amount, 0), [visible]);
  const isFiltering = query.trim() !== "" || filterCategory !== "all";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseAmount(amount);
    const found = validateEntry(desc, value, "a descrição");
    setErrors(found);
    if (found.description || found.amount) return;
    onAdd(desc.trim().slice(0, 60), value, category, tag);
    setDesc("");
    setAmount("");
    setTagChoice(null);
    setCategoryChoice(null);
    toast.success("Despesa registrada", { description: `${TAG_META[tag].label} · ${formatBRL(value)}` });
  };

  return (
    <div className="surface-card rounded-2xl border border-border p-6">
      <h3 className="font-display text-lg font-semibold">Despesas</h3>
      <p className="text-sm text-muted-foreground">Digite a descrição: a categoria é sugerida sozinha.</p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_210px]">
        <div className="grid gap-1.5">
          <Label htmlFor="d" className="text-xs">Descrição</Label>
          <Input id="d" value={desc} maxLength={60} placeholder="Ex.: Mercado, Uber, Netflix" autoComplete="off"
            aria-invalid={!!errors.description} aria-describedby={errors.description ? "d-err" : "d-hint"}
            onChange={(e) => setDesc(e.target.value)} />
          {errors.description && <p id="d-err" role="alert" className="text-xs text-danger">{errors.description}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="a" className="text-xs">Valor (R$)</Label>
          <Input id="a" value={amount} type="text" inputMode="decimal" placeholder="0,00" autoComplete="off"
            aria-invalid={!!errors.amount} aria-describedby={errors.amount ? "a-err" : undefined}
            onChange={(e) => setAmount(e.target.value)} />
          {errors.amount && <p id="a-err" role="alert" className="text-xs text-danger">{errors.amount}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="tag" className="text-xs">Categoria</Label>
          <Select
            value={tag}
            onValueChange={(v) => {
              setTagChoice(v as TagId);
              setCategoryChoice(null);
            }}
          >
            <SelectTrigger id="tag" aria-describedby="d-hint"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TAG_IDS.map((t) => (
                <SelectItem key={t} value={t}>{TAG_META[t].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <span id="bucket-label" className="text-xs font-medium">Conta como</span>
          <ToggleGroup
            type="single"
            value={category}
            onValueChange={(v) => v && setCategoryChoice(v as Category)}
            aria-labelledby="bucket-label"
            className="grid h-10 grid-cols-3 gap-0.5 rounded-md border border-input p-0.5"
          >
            {CATEGORIES.map((c) => (
              <ToggleGroupItem
                key={c}
                value={c}
                title={CATEGORY_META[c].label}
                aria-label={CATEGORY_META[c].label}
                className="h-full rounded px-0 text-xs data-[state=on]:bg-secondary data-[state=on]:text-foreground"
              >
                <span className="mr-1 h-2 w-2 rounded-full" style={{ background: CATEGORY_META[c].color }} />
                {c === "fixed" ? "Fixo" : c === "variable" ? "Variável" : "Invest."}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <p id="d-hint" className="-mt-1 flex min-h-4 items-center gap-1.5 text-xs text-muted-foreground sm:col-span-2" aria-live="polite">
          {isAuto && suggestion!.source === "history" && (
            <><History className="h-3 w-3" /> Mesma categoria da última vez que você registrou “{desc.trim()}”.</>
          )}
          {isAuto && suggestion!.source === "rule" && (
            <><Wand2 className="h-3 w-3" /> Categoria sugerida pela descrição. Troque se não for isso.</>
          )}
        </p>

        <Button type="submit" className="sm:col-span-2">
          <Plus className="mr-1 h-4 w-4" /> Registrar despesa
        </Button>
      </form>

      {expenses.length === 0 ? (
        <p className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          <Inbox className="h-4 w-4" /> Nenhuma despesa ainda. A primeira aparece aqui assim que você registrar.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar despesas"
                placeholder="Buscar descrição…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setLimit(PAGE_SIZE);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={filterCategory}
              onValueChange={(v) => {
                setFilterCategory(v as Category | "all");
                setLimit(PAGE_SIZE);
              }}
            >
              <SelectTrigger aria-label="Filtrar por fatia da regra" className="sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fatias</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isFiltering && (
            <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
              {visible.length} de {expenses.length} despesas, somando {formatBRL(visibleTotal)}
            </p>
          )}
          {visible.length === 0 ? (
            <p className="mt-3 py-4 text-center text-sm text-muted-foreground">
              Nada encontrado. Tente outra palavra ou limpe o filtro.
            </p>
          ) : (
            <ul className="mt-3 max-h-80 space-y-1.5 overflow-y-auto pr-1">
              {visible.slice(0, limit).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{e.description}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_META[e.category].color }} />
                      {TAG_META[tagOf(e)].label}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">−{formatBRL(e.amount)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remover despesa ${e.description}`}
                      onClick={() => onRemove(e.id)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
              {visible.length > limit && (
                <li>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                    Mostrar mais ({visible.length - limit} restantes)
                  </Button>
                </li>
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
