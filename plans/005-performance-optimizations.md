# Plan 005: Performance optimizations — code-splitting, memoization, animation

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

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 001 (correctness fixes should land first)
- **Category**: perf
- **Planned at**: commit `907466d`, 2026-06-19

## Why this matters

All 9 section components are eagerly imported in `SectionRouter`, pulling in the entire recharts library (~200KB) and framer-motion (~50KB) into the initial bundle even though only one section is visible at a time. The `AnimatePresence mode="wait"` creates a 200ms dead zone on every section switch. Derived arrays in section components are recomputed every render without memoization. Together, these slow down both initial load and section navigation.

## Current state

- `src/components/sections/router.tsx:5-13` — 9 static imports of section components
- `src/components/sections/router.tsx:17` — `<AnimatePresence mode="wait">`
- `src/components/sections/02-geral.tsx:25-32` — `donutCanal` and `barCanal` recomputed every render
- `src/components/sections/03-geral-funil.tsx:17-35` — multiple derived arrays without `useMemo`
- `src/components/sections/05-nutrologia.tsx:45-47` — `barCanal` recomputed every render
- `src/components/sections/07-dermatologia.tsx:46-51` — `fatPorProtocolo` recomputed every render
- `src/components/sections/09-resumo-anual.tsx:187` — `.reduce()` inside `.map()` callback

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `src/components/sections/router.tsx` — lazy-load sections
- `src/components/sections/02-geral.tsx` — memoize derived arrays
- `src/components/sections/03-geral-funil.tsx` — memoize derived arrays
- `src/components/sections/05-nutrologia.tsx` — memoize `barCanal`
- `src/components/sections/07-dermatologia.tsx` — memoize `fatPorProtocolo`
- `src/components/sections/09-resumo-anual.tsx` — hoist `.reduce()` out of `.map()`

**Out of scope**:
- Replacing framer-motion with CSS transitions (significant effort, defer to separate plan)
- Removing framer-motion dependency (requires rewriting AnimatePresence, router transitions, and all chart animations)

## Git workflow

- Branch: `perf/005-code-splitting-memoization`
- Commit message style: `perf: <description>`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Lazy-load section components in router

Replace the static imports in `src/components/sections/router.tsx` with `React.lazy`:

```tsx
"use client";

import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SectionId } from "@/lib/nav";

const VisaoGeralSection = lazy(() => import("./01-visao-geral").then(m => ({ default: m.VisaoGeralSection })));
const GeralSection = lazy(() => import("./02-geral").then(m => ({ default: m.GeralSection })));
const GeralFunilSection = lazy(() => import("./03-geral-funil").then(m => ({ default: m.GeralFunilSection })));
const IndicacaoSection = lazy(() => import("./04-indicacao").then(m => ({ default: m.IndicacaoSection })));
const NutrologiaSection = lazy(() => import("./05-nutrologia").then(m => ({ default: m.NutrologiaSection })));
const PediatriaSection = lazy(() => import("./06-pediatria").then(m => ({ default: m.PediatriaSection })));
const DermatologiaSection = lazy(() => import("./07-dermatologia").then(m => ({ default: m.DermatologiaSection })));
const MetasSection = lazy(() => import("./08-metas").then(m => ({ default: m.MetasSection })));
const ResumoAnualSection = lazy(() => import("./09-resumo-anual").then(m => ({ default: m.ResumoAnualSection })));
```

Add a loading fallback inside the `AnimatePresence`:

```tsx
export function SectionRouter({ active }: { active: SectionId }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Suspense fallback={<SectionSkeleton />}>
          {renderSection(active)}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-4 w-96 rounded bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
```

Keep the `renderSection` switch function unchanged.

**Verify**: `npm run build` → exit 0. Check that the build output shows separate chunks for each section.

### Step 2: Memoize derived arrays in `02-geral.tsx`

Wrap `donutCanal` and `barCanal` in `useMemo`:

```tsx
const donutCanal = useMemo(
  () => faturamentoPorCanal
    .filter((c) => c.faturamento > 0)
    .map((c) => ({ name: c.canal, value: c.faturamento })),
  [faturamentoPorCanal]
);

const barCanal = useMemo(
  () => faturamentoPorCanal.map((c) => ({
    canal: c.canal,
    ticket: Math.round(c.ticketMedio),
  })),
  [faturamentoPorCanal]
);
```

Add `useMemo` to the React import if not already present.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 3: Memoize derived arrays in `03-geral-funil.tsx`

Read the file first to identify all derived computations, then wrap each in `useMemo` with appropriate dependencies. The pattern is the same as Step 2.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 4: Memoize `barCanal` in `05-nutrologia.tsx`

```tsx
const barCanal = useMemo(
  () => faturamentoPorCanal
    .filter((c) => c.faturamento > 0)
    .map((c) => ({ canal: c.canal, faturamento: Math.round(c.faturamento) })),
  [faturamentoPorCanal]
);
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 5: Memoize `fatPorProtocolo` in `07-dermatologia.tsx`

```tsx
const fatPorProtocolo = useMemo(
  () => metasPorIndicador.detalhePorProfissional[KEY]
    .filter((ind) => ind.indicador.startsWith("Fat."))
    .map((ind) => ({
      protocolo: ind.indicador.replace("Fat. ", ""),
      valor: Math.round(ind.realizado),
    })),
  []
);
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 6: Hoist `.reduce()` in `09-resumo-anual.tsx`

In `src/components/sections/09-resumo-anual.tsx`, the `.reduce()` at line 187 runs inside the `.sort().map()` callback. Hoist it:

Before:
```tsx
{canalAno
  .sort((a, b) => b.faturamento - a.faturamento)
  .map((c) => {
    const total = canalAno.reduce((s, x) => s + x.faturamento, 0);
    ...
  })}
```

After:
```tsx
const totalCanalAno = canalAno.reduce((s, x) => s + x.faturamento, 0);
// ... in the JSX:
{canalAno
  .sort((a, b) => b.faturamento - a.faturamento)
  .map((c) => {
    const pct = totalCanalAno > 0 ? (c.faturamento / totalCanalAno) * 100 : 0;
    ...
  })}
```

Place `const totalCanalAno = ...` before the `return` statement, alongside `serieMensal` and `mediaMensal2026`.

**Verify**: `npx tsc --noEmit` → exit 0.

## Test plan

- No new tests needed (this plan optimizes existing behavior without changing it)
- Verification: `npm run build` exits 0, `npx tsc --noEmit` exits 0
- If Plan 002 tests exist: `npx vitest run` → all pass (no behavior changed)
- Manual: run `npm run dev`, switch between sections, confirm no visual regressions

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` exits 0
- [ ] `src/components/sections/router.tsx` uses `React.lazy` for all 9 sections
- [ ] `src/components/sections/router.tsx` has a `<Suspense>` boundary with fallback
- [ ] `02-geral.tsx`, `03-geral-funil.tsx`, `05-nutrologia.tsx`, `07-dermatologia.tsx` use `useMemo` for derived arrays
- [ ] `09-resumo-anual.tsx` has the `.reduce()` hoisted above the `.map()`
- [ ] No behavioral changes (same data, same layout, same interactions)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `React.lazy` breaks the `AnimatePresence` animation (if the component doesn't render in time for the exit animation, adjust the transition).
- `useMemo` causes a React exhaustive-deps warning that can't be resolved cleanly.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The lazy-loading pattern uses `.then(m => ({ default: m.XXXSection }))` because the sections are named exports, not default exports. If sections are refactored to use `export default`, simplify to `lazy(() => import("./01-visao-geral"))`.
- `framer-motion` is intentionally kept — replacing it with CSS transitions is a separate, larger effort that would also affect chart animations.
- The `useMemo` wrappers are defensive: with static data, they prevent unnecessary re-renders from parent state changes. If data becomes dynamic (API fetch), the dependencies will need updating.
