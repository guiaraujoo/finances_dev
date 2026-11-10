import type { Expense, Income } from "@/lib/finance";
import { CATEGORY_META, formatDate } from "@/lib/finance";

// Escapa aspas e protege contra injeção de fórmulas em planilhas (=, +, -, @).
// Números no formato "-5,50" são valores do app e não são tratados como fórmula.
const cell = (value: string | number): string => {
  let text = String(value);
  if (/^[=+\-@]/.test(text) && !/^-?\d+,\d{2}$/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

/**
 * Gera CSV (separador ";" e vírgula decimal, que o Excel pt-BR abre direto).
 */
export function buildCSV(expenses: Expense[], incomes: Income[]): string {
  const money = (n: number) => n.toFixed(2).replace(".", ",");
  const rows: (string | number)[][] = [["Data", "Tipo", "Descrição", "Categoria", "Valor (R$)"]];
  const entries = [
    ...incomes.map((i) => ({ at: i.createdAt, row: [formatDate(i.createdAt), "Receita", i.source, "", money(i.amount)] })),
    ...expenses.map((e) => ({
      at: e.createdAt,
      row: [formatDate(e.createdAt), "Despesa", e.description, CATEGORY_META[e.category].label, money(-e.amount)],
    })),
  ].sort((a, b) => a.at - b.at);
  for (const entry of entries) rows.push(entry.row);
  return rows
    .map((r) => r.map(cell).join(";"))
    .join("\r\n");
}

/** Baixa o CSV no navegador (BOM garante acentos corretos no Excel). */
export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
