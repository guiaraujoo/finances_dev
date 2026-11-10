# Finances Dev

Controle de gastos pessoais no navegador. Você registra o que entra e o que sai, e o app mostra quanto sobra no mês, para onde o dinheiro está indo e se você está dentro da regra que escolheu (por padrão, 50·30·20).

Os dados ficam só no seu navegador. Não há cadastro, servidor nem envio de informações para terceiros.

## O que dá para fazer

**Registrar**
- Receitas e despesas, com valor no formato brasileiro (`1.234,56`).
- **Categorização automática:** ao digitar "Uber", "iFood" ou "Netflix", a categoria é sugerida sozinha. Se você corrigir uma vez, o app passa a usar a sua escolha para aquela descrição.
- Remoção com **desfazer**.

**Acompanhar o mês**
- Quanto sobra no mês, quanto entrou, quanto saiu e quanto da renda já foi usado.
- Uma faixa mostra a renda sendo consumida por **Custos fixos**, **Custos variáveis** e **Investimentos**, com um marcador de "hoje" para comparar o ritmo de gasto com o calendário.
- Comparação com a regra de divisão da renda (50·30·20 ou personalizada, com modelos prontos).
- **Limites por categoria** (ex.: R$ 400 em Compras), com alertas ao chegar a 80% e ao ultrapassar.

**Analisar**
- **Relatórios** de 3, 6 ou 12 meses ou de todo o período:
  - entradas e saídas por mês;
  - para onde foi o dinheiro;
  - maiores despesas;
  - percentual da renda guardado ou investido.
- **Histórico** mês a mês, com variação em relação ao mês anterior.
- Exportação em CSV (separador `;` e vírgula decimal, abre direto no Excel).

**Planejar**
- **Metas de economia:** progresso e quanto guardar por mês para chegar no prazo. Inclui uma sugestão de reserva de emergência.
- **Simulador de investimentos:** juros compostos com aportes mensais e cenários prontos.

Tema claro e escuro, layout responsivo.

## Como rodar

Requer Node.js 18 ou superior.

```bash
npm install
npm run dev        # http://localhost:8080
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm test` | Roda os testes (Vitest) |
| `npm run lint` | ESLint |

## Tecnologias

React 18, TypeScript, Vite, Tailwind CSS, componentes shadcn/ui (Radix), Recharts para gráficos, Zod para validação e Vitest para testes. O deploy é na Vercel.

## Organização do código

```
src/
├── pages/Index.tsx            # Página principal e abas
├── hooks/useFinance.ts        # Estado da aplicação e persistência
├── lib/                       # Regras de negócio, sem React (testáveis isoladamente)
│   ├── finance.ts             # Tipos, categorias, formatação e validação
│   ├── categorize.ts          # Categorização automática
│   ├── budget.ts              # Limites e alertas
│   ├── reports.ts             # Agregações dos relatórios
│   ├── goals.ts               # Metas de economia
│   ├── history.ts             # Resumos mensais
│   ├── export.ts              # Geração de CSV
│   └── storage.ts             # Leitura/validação/gravação no navegador
├── components/finance/        # Componentes de tela
└── test/                      # Testes
```

As regras de cálculo ficam em `src/lib` e os componentes só exibem os resultados. Para mudar uma regra (por exemplo, o percentual que dispara o alerta, em `budget.ts`), não é preciso mexer na interface.

## Dados e privacidade

- Tudo fica no `localStorage` do navegador, na chave `finance-data-v1`. Limpar os dados do site apaga os lançamentos; use **Exportar** para guardar uma cópia.
- Ao carregar, os dados são validados: registros corrompidos são descartados um a um, sem perder o resto.
- Com o app aberto em duas abas, uma aba recarrega os dados quando a outra os altera, em vez de sobrescrevê-los.
- O CSV exportado neutraliza fórmulas (`=`, `+`, `-`, `@`) para evitar injeção ao abrir em planilhas.
- Em produção, a Vercel envia uma Content Security Policy que bloqueia scripts externos e o envio de dados para outros domínios (veja `vercel.json`).
- Os dados **não são criptografados**: qualquer pessoa com acesso ao seu navegador consegue lê-los.

## Próximos passos

- Editar um lançamento já registrado (hoje é preciso remover e registrar de novo)
- Lançamentos recorrentes (aluguel, assinaturas)
- Importar extrato bancário (OFX/CSV)
- Proteger os dados com senha
- Carregar as abas sob demanda para reduzir o tamanho do pacote inicial

## Licença

Projeto de uso pessoal.

## Autor

Desenvolvido por **Guilherme Araújo**.
