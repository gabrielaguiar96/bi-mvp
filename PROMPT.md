# Prompt para nova sessão — Evuli BI Frontend

Copie e cole o texto abaixo como primeira mensagem numa nova sessão do ZCode.

---

## CONTEXTO

Estou construindo um dashboard BI para a Evuli (clínica de saúde) que replica a lógica de um relatório do Power BI. Todo o dados já foram extraídos do relatório original. Agora preciso construir o frontend que consome esses dados.

## PROJETO

Diretório: `/Users/gabriel/Documents/bi-mvp`
Stack: Next.js + shadcn/ui + Tailwind CSS + TypeScript
Dados: `src/data/report.ts` (879 linhas, 19 exports, 448 valores numéricos)

## DADOS DISPONÍVEIS (src/data/report.ts)

O arquivo `report.ts` contém TODOS os dados extraídos do Power BI. Os exports são:

```
meta                  — metadados da empresa (Evuli, Comercial/Clínica de Saúde, BRL)
kpisGeral             — KPIs principais: faturamento, leads, ocupação, comparecidos, upsell, ticket médio, conversão
funis                 — funis por profissional (Dr Fernando, Dra Isa, Dra Thaís) com etapas
conversaoPorCanal     — conversão por canal de lead (6 canais: Retenção, Ativo, Orgânico, Indicação, Crossell, Pago)
faturamentoPorCanal   — faturamento + ticket médio por canal
faturamentoPorServico — faturamento por serviço (Nutrologia, Pediatria, Dermatologia)
faturamentoMensal     — série histórica Dez/2025–Mai/2026 com realizado vs meta
indicacaoPacientes    — pipeline de indicação (pacientes ativos, aptos, indicaram, leads, marcados + taxas e metas)
metasPorIndicador     — metas por indicador por profissional (Dr Fernando: 9 indicadores, Dra Isa: 28, Dra Thaís: 26)
profissionais         — detalhe por profissional (faturamento, ticket médio, leads, marcações — atual + mês anterior)
filtros               — filtros disponíveis (anos, meses, canais, serviços, períodos)
anual                 — dados anuais (2025: R$ 13.4mi, 2026: R$ 6.5mi acumulado)
faturamentoMensal2026 — faturamento mês a mês Jan-Jun 2026
faturamentoPorCanalAno — faturamento por canal em 2026
ticketMedioServico    — ticket médio por serviço (geral + por Nutrologia/Pediatria/Dermatologia)
metaLeadsCanal        — meta de leads por canal
dadosPorCanal         — dados consolidados por canal (faturamento, ticket, leads, marcados, conversão, upsell)
dadosPorServico       — dados consolidados por serviço (faturamento, ticket, leads)
extractionMeta        — metadados da extração (método, data, contagens)
```

## O QUE CONSTRUIR

Dashboard BI responsivo com as seguintes seções, **nesta ordem de prioridade**:

### 1. Header + KPIs (Página principal)
- Logo da Evuli (em `public/evuli-logo.png`)
- Cards de KPI: Faturamento, Total Leads, Ocupação Agenda, Comparecidos, Qtd Upsell, Ticket Médio, Taxa de Conversão
- Cada KPI com valor atual, variação vs mês anterior (seta ↑↓ e cor verde/vermelha)
- Barra de progresso da meta (faturamento vs meta)

### 2. Funis por profissional
- 3 funis lado a lado (Dr Fernando, Dra Isa, Dra Thaís)
- Cada funil com etapas: Horários → Ocupação → Comparecidos → Upsell
- Mostrar nome do serviço de cada profissional

### 3. Faturamento por canal + serviço
- Tabela/barras: faturamento por canal (Retenção, Orgânico, Ativo, Indicação, Crossell, Pago)
- Tabela/barras: faturamento por serviço (Nutrologia, Pediatria, Dermatologia)
- Ticket médio por canal e por serviço

### 4. Conversão por canal
- Tabela com: Canal, Leads, Marcados, Taxa de Conversão
- Ordenar por taxa de conversão decrescente

### 5. Série temporal de faturamento
- Gráfico de linhas/barras: realizado vs meta, mês a mês
- Mostrar Dez/2025 até Jun/2026

### 6. Pipeline de indicação
- Funil: Pacientes Ativos → Aptos → Indicaram → Leads Indicação → Marcados Indicação
- Taxas de conversão e metas

### 7. Metas por profissional
- Tabela por profissional com: Indicador, Meta, Realizado, % Meta
- Cores: verde (#B4F6BE) = bateu meta, vermelho (#F5B4BA) = não bateu
- Abas ou seções para Dr Fernando, Dra Isa, Dra Thaís

### 8. Dados anuais (2025 vs 2026)
- Comparativo: faturamento, leads, ocupação, comparecidos
- Faturamento mês a mês de 2026

## RESTRIÇÕES

- **Usar APENAS os dados de `src/data/report.ts`** — não inventar dados
- Se um valor for `null`, mostrar "—" ou "N/D" (não inventar número)
- Responsivo (mobile + desktop)
- Usar componentes shadcn/ui já instalados
- Cores do tema: usar as cores do shadcn (não inventar paleta)
- Formatação brasileira: R$ 1.392.068,50 | 93,43% | 1.254,16
- Não usar bibliotecas de gráfico externas (Chart.js, Recharts, etc.) — usar CSS/SVG puro ou componentes shadcn
- O site deve ser estático (SSG) — sem fetch, sem API calls, tudo do report.ts

## ARQUIVOS RELEVANTES

```
src/data/report.ts        — TODOS os dados (não editar, apenas importar)
src/app/page.tsx           — página principal (substituir)
src/app/layout.tsx         — layout (ajustar se necessário)
src/app/globals.css        — estilos globais
src/components/            — componentes shadcn já instalados
public/evuli-logo.png      — logo da Evuli
components.json            — config shadcn
```

## PRIMEIRO PASSO

1. Ler `src/data/report.ts` completo para entender TODOS os dados
2. Ler `src/app/page.tsx` atual para ver o estado do projeto
3. Ler `components.json` para ver quais componentes shadcn estão instalados
4. Propor um plano de implementação antes de escrever código
5. Construir seção por seção, testando cada uma

## REFERÊNCIA VISUAL

Os screenshots do relatório original estão em `extraction/page_*.png` — usar como referência de layout e organização, mas NÃO copiar pixel a pixel. O objetivo é um dashboard moderno com shadcn/ui.

## NOTA SOBRE OS DADOS

Os dados foram extraídos em 2026-06-19 via:
- 93 responses Playwright (navegação de páginas)
- 159 queries diretas à API (replay de endpoint querydata)
- Todos os 132 measures do relatório foram capturados
- 40+ combinações de filtros exercitadas
- O snapshot é do filtro padrão: Ano=2026, mês corrente=maio
