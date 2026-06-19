# Plan 007: Deduplicate professional sections and consolidate data module

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 907466d..HEAD -- src/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: 001 (correctness), 003 (dead code cleanup), 006 (FilterNotice wiring)
- **Category**: tech-debt
- **Planned at**: commit `907466d`, 2026-06-19

## Why this matters

The three professional section components (`05-nutrologia.tsx`, `06-pediatria.tsx`, `07-dermatologia.tsx`) follow the same template: define KEY/SERVICO constants, check filter exclusion, render EmptyState, render badges, render KPI grid, render FunnelChart, render MetaTable. Any layout or behavior change must be replicated across all three files. The `src/data/report.ts` file is 879 lines with overlapping datasets (`faturamentoPorCanal` vs `dadosPorCanal`, `faturamentoMensal` vs `faturamentoMensal2026`). Adding a new professional or updating data requires editing multiple places.

## Current state

- `src/components/sections/05-nutrologia.tsx` — 122 lines, KEY="Dr Fernando", SERVICO="Nutrologia"
- `src/components/sections/06-pediatria.tsx` — 148 lines, KEY="Dra Isa", SERVICO="Pediatria"
- `src/components/sections/07-dermatologia.tsx` — 131 lines, KEY="Dra Thaís", SERVICO="Dermatologia"
- `src/data/report.ts` — 879 lines, 15+ named exports, overlapping datasets
- All three sections share: filter-exclusion check, EmptyState pattern, Badge layout, 4-column KPI grid, FunnelChart, MetaTable

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Build     | `npm run build`          | exit 0              |
| Test      | `npx vitest run`         | all pass (if Plan 002 done) |

## Scope

**In scope**:
- `src/components/sections/professional-section.tsx` (create) — shared component
- `src/components/sections/05-nutrologia.tsx` — refactor to use shared component
- `src/components/sections/06-pediatria.tsx` — refactor to use shared component
- `src/components/sections/07-dermatologia.tsx` — refactor to use shared component
- `src/data/report.ts` — consolidate `faturamentoPorCanal` into `dadosPorCanal`, remove duplicate

**Out of scope**:
- Splitting `report.ts` into multiple files (too much churn for the benefit)
- Changing the data values or structure
- Modifying the filter system

## Git workflow

- Branch: `refactor/007-deduplicate-professional-sections`
- Commit message style: `refactor: <description>`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the shared `ProfessionalSection` component

Create `src/components/sections/professional-section.tsx`:

```tsx
"use client";

import { type LucideIcon } from "lucide-react";
import { SectionHeader } from "./section-header";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { KpiCard } from "@/components/charts/kpi-card";
import { Badge } from "@/components/ui/badge";
import { funis, profissionais, metasPorIndicador } from "@/data/report";
import { useFilteredData } from "@/lib/use-filtered-data";
import { useFilters } from "@/lib/filters";
import { EmptyState } from "./empty-state";
import { MetaTable } from "./meta-table";
import { formatBRL, formatNumber } from "@/lib/format";

type KpiConfig = {
  label: string;
  /** Key on the profissionais[KEY] object */
  valueKey: string;
  /** Key for the comparison value (LM = last month) */
  comparisonKey?: string;
  icon: LucideIcon;
  format?: (n: number) => string;
};

type ProfessionalSectionProps = {
  profKey: string;
  servico: string;
  title: string;
  description: string;
  kpis: KpiConfig[];
  /** Optional extra content rendered between KPIs and MetaTable */
  extra?: React.ReactNode;
};

export function ProfessionalSection({
  profKey,
  servico,
  title,
  description,
  kpis,
  extra,
}: ProfessionalSectionProps) {
  const { funis: funisFiltrados } = useFilteredData();
  const { filters, setFilters } = useFilters();

  const filterExclui = filters.servico !== "Todos" && !funisFiltrados[profKey];

  if (filterExclui) {
    return (
      <div className="space-y-6">
        <SectionHeader title={title} description={`${title} — serviço filtrado.`} />
        <EmptyState
          title="Sem dados para o serviço selecionado"
          description={`Os filtros ativos excluem ${servico}. Limpe o filtro de serviço para ver os dados de ${title}.`}
          actionLabel="Limpar filtro de serviço"
          onAction={() => setFilters({ servico: "Todos" })}
        />
      </div>
    );
  }

  const pro = profissionais[profKey as keyof typeof profissionais];
  const funil = funis[profKey as keyof typeof funis]?.etapas ?? [];
  const metas = metasPorIndicador.detalhePorProfissional[profKey as keyof typeof metasPorIndicador.detalhePorProfissional] ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader title={title} description={description} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
          {profKey}
        </Badge>
        <Badge variant="secondary">{servico}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const value = (pro as Record<string, unknown>)[kpi.valueKey] as number;
          const previous = kpi.comparisonKey
            ? ((pro as Record<string, unknown>)[kpi.comparisonKey] as number)
            : undefined;
          return (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={(kpi.format ?? formatBRL)(value)}
              current={value}
              previous={previous}
              comparisonLabel={previous !== undefined ? "vs mês anterior" : undefined}
              icon={kpi.icon}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelChart title={`Funil — ${profKey}`} steps={funil} format={formatNumber} />
        {extra}
      </div>

      <MetaTable title={`Metas por Indicador — ${profKey}`} rows={metas} valueIsCurrency />
    </div>
  );
}
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Refactor `05-nutrologia.tsx` to use `ProfessionalSection`

Replace the entire component with a thin config wrapper:

```tsx
"use client";

import { DollarSign, Ticket, Users } from "lucide-react";
import { ProfessionalSection } from "./professional-section";
import { BarChartCard } from "@/components/charts/bar-chart";
import { useFilteredData } from "@/lib/use-filtered-data";
import { formatBRL, formatNumber } from "@/lib/format";

export function NutrologiaSection() {
  const { faturamentoPorCanal } = useFilteredData();

  const barCanal = faturamentoPorCanal
    .filter((c) => c.faturamento > 0)
    .map((c) => ({ canal: c.canal, faturamento: Math.round(c.faturamento) }));

  return (
    <ProfessionalSection
      profKey="Dr Fernando"
      servico="Nutrologia"
      title="Nutrologia"
      description="Dr. Fernando — funil comercial, faturamento e indicadores do serviço."
      kpis={[
        { label: "Faturamento dia", valueKey: "faturamentoDia", comparisonKey: "faturamentoDiaLM", icon: DollarSign },
        { label: "Faturamento Protocolo", valueKey: "faturamentoProtocolo", icon: DollarSign },
        { label: "Ticket Médio Upsell", valueKey: "ticketMedioUpsell", comparisonKey: "ticketMedioUpsellLM", icon: Ticket },
        { label: "Total de Leads", valueKey: "totalLeads", comparisonKey: "totalLeadsLM", icon: Users },
      ]}
      extra={
        <BarChartCard
          title="Faturamento por Canal"
          data={barCanal}
          xKey="canal"
          layout="horizontal"
          series={[{ key: "faturamento", label: "Faturamento", format: formatBRL }]}
        />
      }
    />
  );
}
```

**Verify**: `npx tsc --noEmit` → exit 0. Run `npm run dev`, navigate to Nutrologia — should look identical.

### Step 3: Refactor `06-pediatria.tsx` to use `ProfessionalSection`

Similar thin wrapper. The Pediatria section has a custom "Marcações por canal" card as `extra`. Read the current file carefully and preserve that logic in the `extra` prop.

**Verify**: `npx tsc --noEmit` → exit 0. Run `npm run dev`, navigate to Pediatria — should look identical.

### Step 4: Refactor `07-dermatologia.tsx` to use `ProfessionalSection`

Similar thin wrapper. The Dermatologia section has a "Faturamento por Protocolo" bar chart as `extra`. Preserve that logic.

**Verify**: `npx tsc --noEmit` → exit 0. Run `npm run dev`, navigate to Dermatologia — should look identical.

### Step 5: Consolidate `faturamentoPorCanal` into `dadosPorCanal`

In `src/data/report.ts`, `faturamentoPorCanal` (lines 156-187) and `dadosPorCanal` (lines 772-837) contain the same per-channel revenue data in different shapes. Consolidate by adding `ticketMedio` to `dadosPorCanal` (it already has `faturamento`) and deriving `faturamentoPorCanal` from it.

Step 5a: Verify that `dadosPorCanal` already has all the data `faturamentoPorCanal` provides. Check that each channel's `faturamento` matches between the two objects.

Step 5b: Replace `faturamentoPorCanal` with a derived export:
```ts
export const faturamentoPorCanal = Object.entries(dadosPorCanal)
  .filter(([_, d]) => d.faturamento != null)
  .map(([canal, d]) => ({
    canal,
    faturamento: d.faturamento!,
    ticketMedio: d.ticketMedio!,
  }));
```

Step 5c: Update all imports of `faturamentoPorCanal` across the codebase to use the new derived version (the shape is the same, so consumers don't need changes).

**Verify**: `npx tsc --noEmit` → exit 0. `grep -rn "faturamentoPorCanal" src/` → still used in same locations, just derived differently.

### Step 6: Verify full build and visual parity

Run `npm run build` and `npm run dev`. Navigate to each professional section and confirm the UI is identical to before the refactor.

**Verify**: `npm run build` → exit 0. All three professional sections render correctly.

## Test plan

- If Plan 002 tests exist: `npx vitest run` → all pass
- Manual verification: compare each professional section before and after refactor
- `npx tsc --noEmit` → exit 0 (type safety of the generic `ProfessionalSection`)

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` exits 0
- [ ] `src/components/sections/professional-section.tsx` exists and is used by all 3 sections
- [ ] `05-nutrologia.tsx`, `06-pediatria.tsx`, `07-dermatologia.tsx` are each < 60 lines
- [ ] `faturamentoPorCanal` is derived from `dadosPorCanal` (single source of truth)
- [ ] All three professional sections render identically to before (manual check)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `ProfessionalSection` generic approach cannot accommodate the differences between the three sections (e.g., Pediatria's marcações card or Dermatologia's protocolo chart). If so, stop and report the specific incompatibility.
- The `faturamentoPorCanal` consolidation changes data values (the two sources may have subtle differences — verify before consolidating).
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- Adding a new professional is now a ~30-line config wrapper instead of a ~130-line copy-paste.
- The `KpiConfig` type uses string keys (`valueKey`, `comparisonKey`) to access the `profissionais` object. This is intentionally flexible — if the profissionais shape changes, the type system won't catch mismatches at the config level. Consider adding a generic type parameter if this becomes a maintenance issue.
- The `faturamentoPorCanal` consolidation removes one source of truth. If the two datasets had intentionally different values (e.g., different time windows), this consolidation would be wrong — verify the values match before proceeding.
