# Plan 004: Improve DX — dependencies, tooling, and configuration

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 907466d..HEAD -- package.json next.config.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 002 (test infrastructure should exist before adding CI)
- **Category**: dx
- **Planned at**: commit `907466d`, 2026-06-19

## Why this matters

Production dependencies include `playwright`, `powerbi-client`, `powerbi-models`, and `shadcn` — none of which are imported by the app. These bloat install size, slow CI, and signal incorrect intent. There is no `typecheck` script, no CI pipeline, no `.editorconfig`, and no `.env.example`. The `next.config.ts` is empty with no security headers. Together, these gaps make the project harder to onboard into, slower to iterate on, and less secure.

## Current state

- `package.json` — `playwright`, `powerbi-client`, `powerbi-models`, `shadcn` in `dependencies` (not devDependencies)
- `package.json` — no `typecheck` script (added in Plan 002, but if running standalone, add it here)
- `next.config.ts:3-4` — empty config object `{}`
- No `.editorconfig`, no `.env.example`, no CI config
- `tsconfig.json` — `"exclude": ["node_modules", "scripts"]` confirms scripts/ is not part of the app

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `package.json` — move deps, add scripts if missing
- `next.config.ts` — add security headers
- `.editorconfig` (create)
- `.env.example` (create)
- `.github/workflows/ci.yml` (create)

**Out of scope**:
- Upgrading `next` to fix the PostCSS advisory (defer — monitor upstream)
- Adding Prettier or Husky (defer — separate effort)

## Git workflow

- Branch: `chore/004-dx-and-tooling`
- Commit message style: `chore: <description>`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Move extraction-only deps to devDependencies

In `package.json`, move these from `dependencies` to `devDependencies`:
- `playwright`
- `powerbi-client`
- `powerbi-models`
- `shadcn`

```bash
# Remove from dependencies
npm pkg delete dependencies.playwright
npm pkg delete dependencies.powerbi-client
npm pkg delete dependencies.powerbi-models
npm pkg delete dependencies.shadcn

# Add to devDependencies
npm pkg set devDependencies.playwright="^1.61.0"
npm pkg set devDependencies.powerbi-client="^2.23.10"
npm pkg set devDependencies.powerbi-models="^2.0.1"
npm pkg set devDependencies.shadcn="^4.11.0"
```

**Verify**: `node -e "const p = require('./package.json'); console.log(Object.keys(p.dependencies))"` → should NOT contain playwright, powerbi-client, powerbi-models, or shadcn.

### Step 2: Add missing scripts to package.json

If `typecheck` and `test` scripts don't exist yet (from Plan 002), add them:
```bash
npm pkg set scripts.typecheck="tsc --noEmit"
npm pkg set scripts.test="vitest run"
```

**Verify**: `node -e "const p = require('./package.json'); console.log(p.scripts.typecheck, p.scripts.test)"` → shows both commands.

### Step 3: Add security headers to next.config.ts

Replace the empty config in `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Verify**: `npm run build` → exit 0.

### Step 4: Create `.editorconfig`

Create `.editorconfig` at project root:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

**Verify**: `cat .editorconfig` → file exists with correct content.

### Step 5: Create `.env.example`

The app currently uses no environment variables (all data is hardcoded). Create `.env.example` as a placeholder documenting that fact:

```bash
# Evuli BI — Environment Variables
#
# This project currently requires no environment variables.
# All data is hardcoded in src/data/report.ts (extracted from Power BI).
#
# If you add API routes or external integrations, document their env vars here.
# Example:
# POWERBI_WORKSPACE_ID=
# POWERBI_REPORT_ID=
```

**Verify**: `cat .env.example` → file exists.

### Step 6: Create CI workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
      - run: npm test
```

**Verify**: `cat .github/workflows/ci.yml` → file exists with correct content.

## Test plan

- No new tests needed for this plan
- Verification: `npm run build` exits 0 after config changes
- CI workflow syntax can be validated with `actionlint` if available, or by pushing to a branch

## Done criteria

- [ ] `npm run build` exits 0
- [ ] `npx tsc --noEmit` exits 0
- [ ] `node -e "const p = require('./package.json'); console.log(Object.keys(p.dependencies))"` → no extraction deps
- [ ] `.editorconfig` exists
- [ ] `.env.example` exists
- [ ] `.github/workflows/ci.yml` exists
- [ ] `next.config.ts` has security headers
- [ ] No production source files (`src/`) are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- Moving deps to devDependencies breaks the build (shouldn't — no src/ file imports them).
- Security headers break existing functionality (test by running `npm run dev` and loading the page).
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The PostCSS XSS advisory (GHSA-qx2v-qp2m-jg93) is not resolved by this plan. Monitor Next.js releases for a version that bundles `postcss >= 8.5.10`.
- The CI workflow runs all checks (lint, typecheck, build, test). If tests are not yet set up (Plan 002 not executed), remove the `npm test` step temporarily.
- If the extraction pipeline is eventually packaged as a standalone tool, the playwright/powerbi deps can be removed from this repo entirely.
