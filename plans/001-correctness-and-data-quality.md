# Plan 001: Fix correctness bugs and data quality issues

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

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `907466d`, 2026-06-19

## Why this matters

The dashboard's filter dropdowns show options (Google, Meta, 5 services) that have no backing data — selecting them produces a silent no-op or broken UI. The `as keyof typeof` casts and non-null assertions suppress TypeScript errors that would catch data/filter mismatches. The `pctMeta: 3349` values are corrupted data that only survive because of a fragile guard in the consumer. Together, these issues make the dashboard silently wrong when users interact with filters.

## Current state

- `src/data/report.ts:695-705` — `filtros` defines 8 canais and 8 servicos, but `dadosPorCanal` (line 772+) only has data for 6 canais (Google and Meta are all-null), and `dadosPorServico` (line 839+) only has data for 3 servicos.
- `src/lib/use-filtered-data.ts:81` — `canal as keyof typeof dadosPorCanal` cast bypasses type checking.
- `src/lib/use-filtered-data.ts:106` — `servico as keyof typeof dadosPorServico` cast bypasses type checking.
- `src/components/layout/topbar.tsx:34` — `NAV_ITEMS.find(...)!` non-null assertion.
- `src/data/report.ts:323-361` — Dra Isa indicators with `meta: 0` have `pctMeta: 3349` (meaningless).
- `src/components/sections/01-visao-geral.tsx:33` — `kpisGeral.faturamento.atual / kpisGeral.ocupacaoAgenda.atual` has no zero-guard.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Build     | `npm run build`          | exit 0              |
| Lint      | `npm run lint`           | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `src/data/report.ts`
- `src/lib/use-filtered-data.ts`
- `src/components/layout/topbar.tsx`
- `src/components/sections/01-visao-geral.tsx`

**Out of scope** (do NOT touch):
- Any chart component, section component other than 01-visao-geral, or UI component
- `src/lib/filters.tsx` — the filter state management is correct as-is

## Git workflow

- Branch: `fix/001-correctness-and-data-quality`
- Commit message style: `fix: <description>` (conventional commits)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Remove channels with no data from `filtros.canais`

In `src/data/report.ts`, the `filtros` object at line 695 defines `canais` with 8 entries. "Google" and "Meta" have all-null data in `dadosPorCanal` (lines 822-836). Remove them from the dropdown options so users cannot select channels that produce no data.

Change `filtros.canais` from:
```ts
canais: ["Ativo", "Crossell", "Google", "Indicação", "Meta", "Orgânico", "Pago", "Retenção"],
```
to:
```ts
canais: ["Ativo", "Crossell", "Indicação", "Orgânico", "Pago", "Retenção"],
```

**Verify**: `grep '"Google"' src/data/report.ts` → should only appear inside `dadosPorCanal` (the data object), not in `filtros.canais`.

### Step 2: Remove services with no data from `filtros.servicos`

Similarly, `filtros.servicos` at line 703 has 8 entries but only "Nutrologia", "Pediatria", and "Dermatologia" have data in `dadosPorServico` and `profissionais`. The entries "By Evuli", "Cirurgia Plástica", "Evuli Dietas", "Nutrologia 2", and "Suplementação" produce empty sections.

Change `filtros.servicos` from:
```ts
servicos: ["By Evuli", "Cirurgia Plástica", "Dermatologia", "Evuli Dietas", "Nutrologia", "Nutrologia 2", "Pediatria", "Suplementação"],
```
to:
```ts
servicos: ["Dermatologia", "Nutrologia", "Pediatria"],
```

**Verify**: `grep '"By Evuli"' src/data/report.ts` → should return no matches.

### Step 3: Type-safe filter lookups in `use-filtered-data.ts`

Replace the `as keyof typeof` casts with validated lookups. In `src/lib/use-filtered-data.ts`:

At line 81, replace:
```ts
const dc = dadosPorCanal[canal as keyof typeof dadosPorCanal];
```
with:
```ts
const dc = canal in dadosPorCanal ? dadosPorCanal[canal as keyof typeof dadosPorCanal] : undefined;
```

At line 106, replace:
```ts
const ds = dadosPorServico[servico as keyof typeof dadosPorServico];
```
with:
```ts
const ds = servico in dadosPorServico ? dadosPorServico[servico as keyof typeof dadosPorServico] : undefined;
```

The `in` check makes the cast safe — we know the key exists at that point.

**Verify**: `npx tsc --noEmit` → exit 0, no errors.

### Step 4: Remove non-null assertion in topbar.tsx

In `src/components/layout/topbar.tsx:34`, replace:
```ts
const current = NAV_ITEMS.find((n) => n.id === active)!;
```
with:
```ts
const current = NAV_ITEMS.find((n) => n.id === active);
if (!current) return null;
```

**Verify**: `npx tsc --noEmit` → exit 0, no errors.

### Step 5: Guard division by zero in simulator

In `src/components/sections/01-visao-geral.tsx:33`, replace:
```ts
const ticketMedio = kpisGeral.faturamento.atual / kpisGeral.ocupacaoAgenda.atual;
```
with:
```ts
const ticketMedio = kpisGeral.ocupacaoAgenda.atual > 0
  ? kpisGeral.faturamento.atual / kpisGeral.ocupacaoAgenda.atual
  : 0;
```

**Verify**: `npx tsc --noEmit` → exit 0, no errors.

### Step 6: Fix corrupted `pctMeta` values in data

In `src/data/report.ts`, lines 323-361, all Dra Isa indicators where `meta: 0` have `pctMeta: 3349`. This is meaningless (334,900% of zero). Change each `pctMeta: 3349` to `pctMeta: 0` for indicators where `meta === 0`.

These are the affected entries (all under `"Dra Isa"` in `metasPorIndicador.detalhePorProfissional`):
- "Ticket Médio Upsell" (line 323)
- "Qde de Upsell - Vacinas" (line 329)
- "Qde de Upsell - Plano de Acomp Geral" (line 335)
- "Qde de Upsell - Pago" (line 341)
- "Qde de Upsell - Orgânico" (line 347)
- "Qde de Upsell - Indicação" (line 353)
- "Qde de Upsell - Acompanhamento" (line 359)

Replace each `"pctMeta": 3349` with `"pctMeta": 0` for these 7 entries.

**Verify**: `grep -c '"pctMeta": 3349' src/data/report.ts` → should return `0`.

## Test plan

- Manual verification: run `npm run dev`, open the dashboard, and confirm:
  - The canal dropdown no longer shows "Google" or "Meta"
  - The service dropdown no longer shows "By Evuli", "Cirurgia Plástica", etc.
  - Selecting a valid canal/service still filters correctly
  - The simulator slider still works
- Automated: `npx tsc --noEmit` and `npm run build` both exit 0

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` exits 0
- [ ] `npm run lint` exits 0
- [ ] `grep '"Google"' src/data/report.ts` returns no match in `filtros.canais`
- [ ] `grep '"By Evuli"' src/data/report.ts` returns no match
- [ ] `grep '"pctMeta": 3349' src/data/report.ts` returns no match
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- You discover that "Google" or "Meta" channels DO have data that just wasn't captured (check `src/data/report.ts` carefully).

## Maintenance notes

- If new channels or services are added to the data in the future, they must also be added to `filtros.canais`/`filtros.servicos` — or better yet, derive the filter options from the data keys dynamically (see Plan 007).
- The `pctMeta: 3349` issue originates from the Power BI extraction pipeline (`scripts/build-report-ts.mts`). Fix the generator to normalize `pctMeta` to 0 when `meta === 0`.
