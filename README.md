# Evuli BI Dashboard

Dashboard BI para a Evuli (clinica de saude) que replica a logica de um relatorio do Power BI. Todos os dados sao estaticos, extraidos via Playwright + API replay.

## Stack

- **Next.js 16.2.9** (App Router, SSG)
- **React 19.2.4** + **TypeScript 5**
- **shadcn/ui** (Radix primitives) + **Tailwind CSS 4**
- **Recharts 3.8.0** (graficos)
- **Framer Motion 12.40.0** (animacoes)
- **vitest 4.1.9** (testes)

## Getting Started

```bash
npm install
npm run dev
```

Abra http://localhost:3000 no navegador.

## Secoes do Dashboard

| Secao | Descricao |
|-------|-----------|
| Visao Geral | KPIs principais + simulador de funil interativo |
| Geral | Indicadores consolidados com comparativos |
| Funil Comercial | Conversao por canal de aquisicao |
| Indicacao | Pipeline de indicacao de pacientes |
| Nutrologia | Dr. Fernando — funil, faturamento, metas |
| Pediatria | Dra. Isa — funil, vacinas, metas |
| Dermatologia | Dra. Thais — funil, protocolos, metas |
| Metas | Faturamento realizado vs meta, indicadores no alvo |
| Resumo Anual | Comparativo 2025 vs 2026 |

## Filtros Globais

4 filtros no topo da pagina (Canal, Servico, Ano, Mes) que afetam KPIs e graficos. Quando um filtro nao tem dados para um KPI especifico, o card mostra "N/D" com visual muted.

## Dados

Todos os dados estao em `src/data/report.ts`, gerado pelo pipeline de extracao em `scripts/`. Nao editar manualmente — usar os scripts para re-extrair.

## Comandos

```bash
npm run dev          # servidor de desenvolvimento
npm run build        # build de producao
npm run test         # testes (vitest)
npm run typecheck    # verificacao de tipos
npm run lint         # linting (eslint)
```

## Estrutura

```
src/
├── app/              # paginas Next.js
├── components/
│   ├── charts/       # KpiCard, FunnelChart, BarChart, LineChart, DonutChart
│   ├── layout/       # Sidebar, Topbar, FilterStatus
│   ├── sections/     # 9 secoes do dashboard
│   └── ui/           # componentes shadcn/ui
├── data/
│   └── report.ts     # todos os dados (gerado por extracao)
└── lib/
    ├── filters.tsx   # contexto de filtros
    ├── use-filtered-data.ts  # hook de dados filtrados
    ├── format.ts     # formatadores BRL/numero/percentual
    └── nav.ts        # configuracao de navegacao
```
