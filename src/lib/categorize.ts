import { TAG_META, type Category, type Expense, type TagId } from "@/lib/finance";

/** Minúsculas, sem acentos e sem pontuação: "Açaí (iFood)!" → "acai ifood". */
export const normalizeText = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Palavras-chave comuns em gastos pessoais no Brasil. Casam pelo início da palavra
// ("farmacia" casa "farmácias"); termos de até 3 letras exigem palavra inteira ("bar" não casa "barbearia").
const KEYWORDS: Record<TagId, string[]> = {
  moradia: [
    "aluguel", "condominio", "iptu", "luz", "energia", "enel", "cemig", "copel", "agua", "sabesp",
    "gas", "internet", "wifi", "celular", "telefone", "vivo", "claro", "tim", "diarista", "faxina",
  ],
  mercado: ["mercado", "supermercado", "atacadao", "assai", "carrefour", "feira", "hortifruti", "acougue", "sacolao"],
  transporte: [
    "uber", "99", "taxi", "onibus", "metro", "trem", "bilhete unico", "combustivel", "gasolina", "etanol",
    "posto", "estacionamento", "pedagio", "ipva", "seguro auto", "oficina", "mecanico",
  ],
  saude: [
    "farmacia", "drogaria", "remedio", "plano de saude", "unimed", "consulta", "medico", "dentista",
    "exame", "psicologo", "terapia", "academia", "smartfit",
  ],
  educacao: ["curso", "faculdade", "escola", "mensalidade escolar", "livro", "udemy", "alura", "material escolar"],
  alimentacao: [
    "restaurante", "lanche", "lanchonete", "ifood", "rappi", "delivery", "bar", "cafe", "padaria",
    "pizza", "hamburguer", "burger", "sushi", "almoco", "jantar", "acai", "sorvete",
  ],
  lazer: [
    "cinema", "show", "teatro", "ingresso", "viagem", "passagem", "hotel", "airbnb", "passeio",
    "festa", "balada", "jogo", "steam", "playstation", "xbox",
  ],
  compras: [
    "roupa", "sapato", "tenis", "shopping", "amazon", "mercado livre", "shopee", "shein", "magalu",
    "presente", "eletronico", "loja",
  ],
  assinaturas: [
    "netflix", "spotify", "prime video", "disney", "hbo", "max", "globoplay", "youtube premium",
    "deezer", "icloud", "google one", "assinatura", "chatgpt",
  ],
  investimentos: [
    "investimento", "tesouro", "cdb", "lci", "lca", "acoes", "fii", "poupanca", "reserva", "aporte",
    "previdencia", "cripto", "bitcoin",
  ],
  outros: [],
};

// Compilado uma vez. Termos mais longos primeiro: "mercado livre" vence "mercado".
const RULES = (Object.entries(KEYWORDS) as [TagId, string[]][])
  .flatMap(([tag, words]) => words.map((w) => ({ kw: normalizeText(w), tag })))
  .sort((a, b) => b.kw.length - a.kw.length);

/** Categoria detalhada pela descrição, ou null se nenhuma palavra-chave casar. */
export function matchTag(description: string): TagId | null {
  const text = ` ${normalizeText(description)} `;
  for (const { kw, tag } of RULES) {
    if (kw.length <= 3 ? text.includes(` ${kw} `) : text.includes(` ${kw}`)) return tag;
  }
  return null;
}

/** Descrição normalizada → última classificação que o próprio usuário usou. */
export type CategoryMemory = Map<string, { tag: TagId; category: Category }>;

export function buildCategoryMemory(expenses: Expense[]): CategoryMemory {
  const memory: CategoryMemory = new Map();
  // Despesas ficam em ordem de registro: a mais recente sobrescreve.
  for (const e of expenses) {
    if (e.tag) memory.set(normalizeText(e.description), { tag: e.tag, category: e.category });
  }
  return memory;
}

export interface Suggestion {
  tag: TagId;
  category: Category;
  /** "history": repete o que o usuário escolheu antes; "rule": veio das palavras-chave. */
  source: "history" | "rule";
}

/** Sugere categoria. A escolha anterior do usuário tem prioridade sobre as regras. */
export function suggestCategory(description: string, memory: CategoryMemory): Suggestion | null {
  const key = normalizeText(description);
  if (key.length < 2) return null;
  const known = memory.get(key);
  if (known) return { ...known, source: "history" };
  const tag = matchTag(description);
  return tag ? { tag, category: TAG_META[tag].bucket, source: "rule" } : null;
}

// Lançamentos são imutáveis no estado, então o resultado pode ficar em cache por objeto.
const tagCache = new WeakMap<Expense, TagId>();

/** Categoria detalhada de qualquer despesa, inclusive das registradas antes desta versão. */
export function tagOf(e: Expense): TagId {
  if (e.tag) return e.tag;
  let tag = tagCache.get(e);
  if (!tag) {
    tag = matchTag(e.description) ?? (e.category === "investment" ? "investimentos" : "outros");
    tagCache.set(e, tag);
  }
  return tag;
}
