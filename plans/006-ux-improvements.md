# Plan 006: UX improvements — routing, filter notice, animation gap

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
- **Depends on**: 001 (filter correctness), 005 (router changes should land first to avoid conflicts)
- **Category**: ux
- **Planned at**: commit `907466d`, 2026-06-19

## Why this matters

The dashboard uses `useState` for section routing — users cannot bookmark a section, share a link, or use the browser back button. The `FilterNotice` component was built to show users when their active filters don't apply to the current section, but it was never wired in. The `AnimatePresence mode="wait"` creates a 200ms blank gap on every section switch. For a daily-use dashboard, these are meaningful UX friction points.

## Current state

- `src/app/page.tsx:10` — `const [active, setActive] = useState<SectionId>("visao-geral")`
- `src/components/sections/router.tsx:17` — `<AnimatePresence mode="wait">`
- `src/components/sections/filter-notice.tsx` — fully implemented, zero imports
- `src/components/sections/04-indicacao.tsx` — ignores canal/servico filters, no notice shown
- `src/components/sections/08-metas.tsx` — ignores canal/servico filters, no notice shown
- `src/components/sections/09-resumo-anual.tsx` — ignores all filters, no notice shown

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `src/app/page.tsx` — add URL-based routing via `useSearchParams`
- `src/components/layout/sidebar.tsx` — update `onNavigate` to set URL
- `src/components/layout/topbar.tsx` — update `onNavigate` to set URL
- `src/components/sections/router.tsx` — fix `mode="wait"` animation gap
- `src/components/sections/04-indicacao.tsx` — add `FilterNotice`
- `src/components/sections/08-metas.tsx` — add `FilterNotice`
- `src/components/sections/09-resumo-anual.tsx` — add `FilterNotice`

**Out of scope**:
- Changing the filter system itself
- Adding year/month filters (direction finding, not a fix)
- Modifying `FilterNotice` component logic (it works as-is)

## Git workflow

- Branch: `feat/006-ux-improvements`
- Commit message style: `feat: <description>`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add URL-based section routing

In `src/app/page.tsx`, replace the `useState` approach with URL hash routing:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SectionRouter } from "@/components/sections/router";
import type { SectionId } from "@/lib/nav";
import { NAV_ITEMS } from "@/lib/nav";

const VALID_IDS = new Set(NAV_ITEMS.map((n) => n.id));

function getInitialSection(): SectionId {
  if (typeof window === "undefined") return "visao-geral";
  const hash = window.location.hash.replace("#", "");
  return VALID_IDS.has(hash as SectionId) ? (hash as SectionId) : "visao-geral";
}

export default function Page() {
  const [active, setActive] = useState<SectionId>(getInitialSection);

  // Sync state → URL
  useEffect(() => {
    window.location.hash = active;
  }, [active]);

  // Listen for browser back/forward
  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace("#", "");
      if (VALID_IDS.has(hash as SectionId)) {
        setActive(hash as SectionId);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleNavigate = useCallback((id: SectionId) => {
    setActive(id);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar active={active} onNavigate={handleNavigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar active={active} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
            <SectionRouter active={active} />
          </div>
        </main>
      </div>
    </div>
  );
}
```

**Verify**: `npx tsc --noEmit` → exit 0. Run `npm run dev`, navigate to sections, confirm URL changes to `#geral`, `#metas`, etc. Refresh the page — should stay on the same section.

### Step 2: Fix AnimatePresence animation gap

In `src/components/sections/router.tsx`, change `mode="wait"` to `mode="popLayout"` to allow simultaneous enter/exit animations:

```tsx
<AnimatePresence mode="popLayout">
```

If `popLayout` causes layout issues (sections overlapping during transition), use `mode="sync"` instead. Test visually.

**Verify**: `npm run build` → exit 0. Run `npm run dev`, switch sections rapidly — no blank gap between transitions.

### Step 3: Wire FilterNotice into filter-insensitive sections

In `src/components/sections/04-indicacao.tsx`:
- Add import: `import { FilterNotice } from "./filter-notice";`
- Add `<FilterNotice ignore={["canal", "servico"]} />` after the `<SectionHeader>` in the JSX

In `src/components/sections/08-metas.tsx`:
- Add import: `import { FilterNotice } from "./filter-notice";`
- Add `<FilterNotice ignore={["canal", "servico"]} />` after the `<SectionHeader>`

In `src/components/sections/09-resumo-anual.tsx`:
- Add import: `import { FilterNotice } from "./filter-notice";`
- Add `<FilterNotice ignore={["canal", "servico"]} />` after the `<SectionHeader>`

**Verify**: `npx tsc --noEmit` → exit 0. Run `npm run dev`, set a filter (e.g., canal "Retenção"), navigate to Indicação — a notice should appear saying "Canal não se aplica a esta seção."

## Test plan

- No automated tests for this plan (UI behavior)
- Manual verification:
  1. Open dashboard, navigate to each section — URL should update with hash
  2. Copy a URL with hash (e.g., `/#metas`), paste in new tab — should open on Metas
  3. Use browser back button — should return to previous section
  4. Set filter, navigate to Indicação/Metas/Resumo Anual — FilterNotice should appear
  5. Click "Limpar filtros" in the notice — filter should reset
  6. Switch sections rapidly — no blank flash between transitions

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` exits 0
- [ ] URL hash updates when navigating sections (manual check)
- [ ] Browser back/forward navigates between sections (manual check)
- [ ] FilterNotice appears in sections 04, 08, 09 when filters are active (manual check)
- [ ] No blank gap between section transitions (manual check)
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- `useSearchParams` or hash routing breaks the `AnimatePresence` transitions (if so, use a simpler approach: just sync `useState` with `window.location.hash` without triggering re-renders on hash change).
- `FilterNotice` has a bug that causes it to throw (read the component code first — it looks correct but verify).
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The hash-based routing approach is intentionally simple — no Next.js routing changes, no new pages, just URL sync. If the app grows beyond a single page, migrate to proper Next.js App Router routes.
- `AnimatePresence mode="popLayout"` may cause subtle layout shifts if sections have different heights. If this is noticeable, fall back to `mode="sync"` or keep `mode="wait"` but reduce the transition duration.
- The `FilterNotice` component already handles the "Limpar filtros" action internally — no additional wiring needed.
