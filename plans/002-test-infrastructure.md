# Plan 002: Establish test infrastructure and write high-value tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 907466d..HEAD -- src/ package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 001 (filter data must be correct before testing it)
- **Category**: tests
- **Planned at**: commit `907466d`, 2026-06-19

## Why this matters

The dashboard has zero automated tests. The `use-filtered-data` hook is the single data pipeline between raw data and every section — a bug there silently shows wrong KPIs to business users. The `format.ts` functions are the last line before numbers reach the user's eyes. Neither has any test coverage. Without a test runner, there is no way to verify that any change works or that refactors don't break existing behavior.

## Current state

- `package.json` — no `test` script, no `typecheck` script, no test runner in dependencies
- No test files exist anywhere in the repo
- `src/lib/use-filtered-data.ts` — the sole data transformation hook, 144 lines, zero tests
- `src/lib/format.ts` — 6 exported formatting functions, zero tests
- `src/lib/filters.tsx` — filter state context/provider, zero tests

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Test      | `npx vitest run`         | all pass            |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `package.json` (add devDependencies and scripts)
- `vitest.config.ts` (create)
- `src/test/setup.ts` (create)
- `src/lib/__tests__/use-filtered-data.test.ts` (create)
- `src/lib/__tests__/format.test.ts` (create)
- `src/lib/__tests__/filters.test.tsx` (create)

**Out of scope**:
- E2E tests (Playwright) — defer to a separate plan
- Component render tests for section components — defer
- Any change to production source code

## Git workflow

- Branch: `feat/002-test-infrastructure`
- Commit message style: `test: <description>` (conventional commits)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Install test dependencies

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

**Verify**: `cat package.json | grep vitest` → shows vitest in devDependencies.

### Step 2: Add scripts to package.json

Add these scripts to `package.json`:
```json
"typecheck": "tsc --noEmit",
"test": "vitest run",
"test:watch": "vitest"
```

**Verify**: `node -e "const p = require('./package.json'); console.log(p.scripts.typecheck, p.scripts.test)"` → shows `tsc --noEmit vitest run`.

### Step 3: Create vitest config

Create `vitest.config.ts` at the project root:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

**Verify**: `npx vitest run --reporter=verbose 2>&1 | head -5` → shows vitest starting (no tests yet is fine).

### Step 4: Create test setup file

Create `src/test/setup.ts`:
```ts
import "@testing-library/jest-dom";
```

**Verify**: file exists at `src/test/setup.ts`.

### Step 5: Write tests for `format.ts`

Create `src/lib/__tests__/format.test.ts`:

Test the following cases for each exported function:
- `formatBRL`: normal value → "R$ 1.392.069", zero → "R$ 0", NaN → "—", Infinity → "—", negative → "-R$ 500"
- `formatBRLPrecise`: normal value → "R$ 1.392.068,50"
- `formatBRLCompact`: 1233927 → "R$ 1,2 Mi", 213862 → "R$ 213,9 Mil", 500 → "R$ 500"
- `formatNumber`: 1392069 → "1.392.069", NaN → "—"
- `formatPct`: 0.9343 → "93,43%", 0 → "0,00%"
- `formatPctAuto`: 0.93 → "93%", 0.934 → "93,4%"
- `delta(100, 80)` → direction "up", value 0.25, formatted "+25,0%"
- `delta(80, 100)` → direction "down", value -0.2
- `delta(100, 100)` → direction "flat"
- `delta(100, 0)` → direction "flat", formatted "—" (previous is 0/falsy)

Import directly from `@/lib/format`.

**Verify**: `npx vitest run src/lib/__tests__/format.test.ts` → all pass.

### Step 6: Write tests for `use-filtered-data` hook

Create `src/lib/__tests__/use-filtered-data.test.ts`:

Use `renderHook` from `@testing-library/react` with a wrapper that provides `FilterProvider`.

Test cases:
1. **No filter** — returns full `conversaoPorCanal` (6 items), full `funis` (3 professionals), `kpisGeral` matches base data
2. **Canal filter "Retenção"** — `conversaoPorCanal` has 1 item (canal "Retenção"), `kpisGeral.faturamento.atual` is 557344, `kpisGeral.taxaConversaoTotal.atual` is ~0.9194
3. **Serviço filter "Nutrologia"** — `funis` has only "Dr Fernando", `profissionais` has only "Dr Fernando", `faturamentoPorServico` has 1 item
4. **Both filters active** — canal takes priority (verify `kpisGeral.faturamento.atual` matches canal data, not service data)
5. **Filter with no data** (after Plan 001 removes invalid options, this shouldn't happen, but test the `in` guard anyway) — setting canal to a non-existent key should not crash

The hook uses `useFilters()` internally, so the wrapper must be:
```tsx
function Wrapper({ children }: { children: React.ReactNode }) {
  return <FilterProvider>{children}</FilterProvider>;
}
```

Then call `renderHook(() => useFilteredData(), { wrapper: Wrapper })`.

To change filters, use `act(() => { result.current... })` — but since `useFilteredData` doesn't expose `setFilters`, you'll need to wrap both hooks in a single `renderHook` that returns both, or create a test helper component.

**Verify**: `npx vitest run src/lib/__tests__/use-filtered-data.test.ts` → all pass.

### Step 7: Write tests for `FilterProvider`

Create `src/lib/__tests__/filters.test.tsx`:

Test cases:
1. Initial state is `{ canal: "Todos", servico: "Todos" }`
2. `setFilters({ canal: "Retenção" })` merges correctly (servico stays "Todos")
3. `resetFilters()` restores defaults
4. `useFilters()` throws when used outside `<FilterProvider>`

**Verify**: `npx vitest run src/lib/__tests__/filters.test.tsx` → all pass.

## Test plan

- New tests to write: see Steps 5-7 (3 test files, ~20-25 test cases total)
- Model after: this is the initial test suite — no existing tests to model from
- Verification: `npx vitest run` → all pass

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx vitest run` exits 0; all tests pass
- [ ] `npm run build` exits 0
- [ ] `src/lib/__tests__/format.test.ts` exists with tests for all 7 exported functions
- [ ] `src/lib/__tests__/use-filtered-data.test.ts` exists with tests for all 4 filter combinations
- [ ] `src/lib/__tests__/filters.test.tsx` exists with tests for state management
- [ ] `package.json` has `test` and `typecheck` scripts
- [ ] No production source files are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- `npm install` fails due to dependency conflicts (report the error).
- `vitest` cannot resolve the `@/` path alias after configuring `resolve.alias`.
- `renderHook` cannot work with `FilterProvider` wrapper (if React 19 compatibility issue, report it).
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- These tests should be run before every commit and in CI (see Plan 004).
- When adding new filter dimensions (year, month), add corresponding test cases to `use-filtered-data.test.ts`.
- The `delta` function edge cases (zero previous, NaN inputs) are the most likely to regress after formatter changes.
