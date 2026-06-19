# Plan 003: Remove dead code and unused exports

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
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 001 (filter cleanup should land first to avoid merge conflicts in report.ts)
- **Category**: tech-debt
- **Planned at**: commit `907466d`, 2026-06-19

## Why this matters

Dead code increases cognitive load, inflates bundle size (even if marginal), and creates confusion about what is actually used. The `FilterNotice` component was built but never wired — a feature that would improve filter transparency is invisible. The `faturamentoMensal` dataset overlaps with `faturamentoMensal2026` and is imported but never consumed. Unused exports like `formatBRLPrecise`, `meta`, and `extractionMeta` clutter the API surface.

## Current state

- `src/components/sections/filter-notice.tsx` — 53-line component, zero imports anywhere
- `src/data/report.ts:206-237` — `faturamentoMensal` export, imported by `use-filtered-data.ts` but never destructured by any consumer
- `src/lib/use-filtered-data.ts:9` — imports `faturamentoMensal`, line 138 returns it
- `src/lib/format.ts:32` — `formatBRLPrecise` exported, never imported
- `src/lib/format.ts:70` — `formatPctAuto` exported, never imported
- `src/data/report.ts:14` — `KpiComparison` type exported, never imported
- `src/data/report.ts:20-29` — `meta` object exported, never imported
- `src/data/report.ts:860-878` — `extractionMeta` object exported, never imported
- `src/components/sections/05-nutrologia.tsx:3` — imports `CalendarCheck` but never uses it
- `src/components/sections/06-pediatria.tsx:4` — imports `CalendarCheck` but never uses it

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Build     | `npm run build`          | exit 0              |
| Lint      | `npm run lint`           | exit 0              |

## Scope

**In scope**:
- `src/data/report.ts` — remove `faturamentoMensal`, `KpiComparison`, `meta`, `extractionMeta`
- `src/lib/use-filtered-data.ts` — remove `faturamentoMensal` import and return entry
- `src/lib/format.ts` — remove `formatBRLPrecise` and `formatPctAuto`
- `src/components/sections/05-nutrologia.tsx` — remove unused `CalendarCheck` import
- `src/components/sections/06-pediatria.tsx` — remove unused `CalendarCheck` import

**Out of scope**:
- `src/components/sections/filter-notice.tsx` — DO NOT delete; it will be wired in Plan 006
- Any component that is actually used (even if it looks unused — verify with grep first)

## Git workflow

- Branch: `chore/003-dead-code-cleanup`
- Commit message style: `chore: <description>` (conventional commits)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Remove `faturamentoMensal` from `useFilteredData` hook

In `src/lib/use-filtered-data.ts`:
- Remove `faturamentoMensal` from the import statement at line 9
- Remove `faturamentoMensal,` from the return object at line 138

**Verify**: `grep "faturamentoMensal" src/lib/use-filtered-data.ts` → returns no matches.

### Step 2: Remove `faturamentoMensal` from `report.ts`

In `src/data/report.ts`, delete the entire `faturamentoMensal` array (lines 206-237) and its preceding comment (line 205).

**Verify**: `grep "faturamentoMensal" src/data/report.ts` → returns no matches (note: `faturamentoMensal2026` should still exist).

### Step 3: Remove unused type and objects from `report.ts`

In `src/data/report.ts`:
- Delete the `KpiComparison` type export (lines 14-18)
- Delete the `meta` object export (lines 20-29)
- Delete the `extractionMeta` object export (lines 860-878)

**Verify**: `grep -n "KpiComparison\|^export const meta\|extractionMeta" src/data/report.ts` → returns no matches.

### Step 4: Remove unused formatters from `format.ts`

In `src/lib/format.ts`:
- Delete `formatBRLPrecise` function (lines 32-35) and the `BRL_PRECISE` formatter it uses (lines 12-17)
- Delete `formatPctAuto` function (lines 70-77)

**Verify**: `grep -n "formatBRLPrecise\|formatPctAuto\|BRL_PRECISE" src/lib/format.ts` → returns no matches.

### Step 5: Remove unused imports from professional sections

In `src/components/sections/05-nutrologia.tsx:3`, remove `CalendarCheck` from the import:
```ts
// Before:
import { DollarSign, Ticket, Users, CalendarCheck } from "lucide-react";
// After:
import { DollarSign, Ticket, Users } from "lucide-react";
```

In `src/components/sections/06-pediatria.tsx:4`, remove `CalendarCheck` from the import:
```ts
// Before:
import { DollarSign, Syringe, Ticket, Users, CalendarCheck } from "lucide-react";
// After:
import { DollarSign, Syringe, Ticket, Users } from "lucide-react";
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 6: Verify full build

Run `npm run build` and confirm it succeeds with no errors.

**Verify**: `npm run build` → exit 0.

## Test plan

- No new tests needed (this plan only removes unused code)
- Verification: `npx tsc --noEmit` and `npm run build` both exit 0
- If Plan 002 tests exist: `npx vitest run` → all pass (removed code had no tests)

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` exits 0
- [ ] `npm run lint` exits 0
- [ ] `grep "faturamentoMensal[^2]" src/` returns no matches (the non-2026 variant)
- [ ] `grep "formatBRLPrecise\|formatPctAuto" src/` returns no matches
- [ ] `grep "KpiComparison\|extractionMeta" src/` returns no matches
- [ ] `grep "CalendarCheck" src/components/sections/05-nutrologia.tsx` returns no match
- [ ] `filter-notice.tsx` still exists (not deleted)
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The code at the locations in "Current state" doesn't match the excerpts.
- Removing an export breaks the build (grep for all import sites before deleting).
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The `meta` and `extractionMeta` objects contain useful extraction metadata (timestamps, query counts). If a data-freshness indicator is added to the UI later (see Plan 006 direction), these objects can be re-added — but they should live in a dedicated `src/lib/data-meta.ts` module, not in the 879-line data file.
- `formatBRLPrecise` and `formatPctAuto` are well-written utilities. If they're needed in the future, they can be restored from git history.
