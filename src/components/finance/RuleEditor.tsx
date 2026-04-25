import { useState } from "react";
import { CATEGORY_META, DEFAULT_RULE, type Category, type Rule } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sliders, RotateCcw, AlertCircle, Check } from "lucide-react";

interface Props {
  rule: Rule;
  onChange: (rule: Rule) => void;
  onReset: () => void;
}

const PRESETS: { name: string; rule: Rule }[] = [
  { name: "Clássico 50·30·20", rule: { fixed: 50, variable: 30, investment: 20 } },
  { name: "Investidor 40·20·40", rule: { fixed: 40, variable: 20, investment: 40 } },
  { name: "Equilibrado 60·20·20", rule: { fixed: 60, variable: 20, investment: 20 } },
  { name: "Econômico 70·10·20", rule: { fixed: 70, variable: 10, investment: 20 } },
];

export function RuleEditor({ rule, onChange, onReset }: Props) {
  const [draft, setDraft] = useState<Rule>(rule);

  const total = draft.fixed + draft.variable + draft.investment;
  const valid = total === 100;

  const update = (cat: Category, value: number) => {
    const v = Math.max(0, Math.min(100, Math.round(value)));
    setDraft((d) => ({ ...d, [cat]: v }));
  };

  const apply = () => {
    if (valid) onChange(draft);
  };

  const reset = () => {
    setDraft({ ...DEFAULT_RULE });
    onReset();
  };

  const cats: Category[] = ["fixed", "variable", "investment"];

  return (
    <div className="surface-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-semibold">Personalize sua regra</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
            valid ? "bg-secondary text-primary" : "bg-secondary text-danger"
          }`}
        >
          {valid ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          Total: {total}%
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Ajuste os percentuais conforme seu perfil. A soma deve ser 100%.
      </p>

      <div className="mt-5 space-y-5">
        {cats.map((cat) => (
          <div key={cat}>
            <div className="mb-2 flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: CATEGORY_META[cat].color }}
                />
                {CATEGORY_META[cat].label}
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={draft[cat]}
                  onChange={(e) => update(cat, Number(e.target.value))}
                  className="h-7 w-16 text-right text-sm"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <Slider
              value={[draft[cat]]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => update(cat, v[0])}
            />
          </div>
        ))}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Modelos rápidos
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setDraft(p.rule)}
              className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button onClick={apply} disabled={!valid} className="flex-1" size="sm">
          Aplicar regra
        </Button>
        <Button onClick={reset} variant="outline" size="sm">
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Padrão
        </Button>
      </div>
    </div>
  );
}
