# Power BI Data Extraction — Evuli BI

**Data source:** Public Power BI report link  
**Extracted:** 2026-06-19  
**Report name:** Evuli.pbix  
**Report ID:** 8726404  

---

## Status: 100% ✓

All accessible measures have been captured. The 2 measures that were on a hidden page ("Duplicata de Metas") were retrieved via direct API replay.

---

## Extraction methods used

### Method 1: Playwright page navigation
- Navigated all 8 visible pages
- Intercepted 93 querydata responses
- Captured screenshots + extracted text

### Method 2: Direct API replay (key breakthrough)
- Captured request URL, headers, and body format from Playwright
- Replayed `querydata` POST requests directly to `wabi-brazil-south-b-primary-api.analysis.windows.net`
- No authentication needed (public report)
- Constructed custom DAX-like queries with different filter combinations
- 159 API queries executed successfully

---

## Data captured

### Measures (132 total)
- 130 from Playwright page navigation
- 2 from direct API replay (hidden page measures):
  - `_MedidasFernando.Ticket Médio Serviço Selecionado` = R$ 10.430,75
  - `_MedidasGeral.Meta Leads Canal` = varies by canal

### Filter combinations (40+)
| Filter type | Values | Queries |
|------------|--------|---------|
| Default (none) | — | 20 |
| Canal | 8 canais × 9 measures | 72 |
| Serviço | 3 serviços × 5 measures | 15 |
| Year | 2025, 2026 × 6 measures | 12 |
| Month | Jan-Jun × Faturamento | 6 |
| Canal × Year | 6 canais × 2 years | 12 |

### Pages (10 total)
All 10 pages enumerated from report layout. 8 visible pages navigated. 2 hidden pages accessed via API.

---

## Key data points

| Metric | Value |
|--------|-------|
| Faturamento 2025 | R$ 13.433.285,05 |
| Faturamento 2026 (acumulado) | R$ 6.468.578,12 |
| Faturamento mês corrente (Mai) | R$ 1.392.068,50 |
| Ticket Médio Serviço | R$ 10.430,75 |
| Meta Leads Canal (Pago) | 4.650 |
| Meta Leads Canal (Orgânico) | 1.930 |

---

## How to re-run

```bash
# 1. Install dependencies
npm install playwright
npx playwright install chromium

# 2. Capture via Playwright
npx tsx scripts/pbi-extractor.mts --output /tmp/pbi_capture

# 3. Capture via direct API replay
npx tsx scripts/pbi-query-missing.mts

# 4. Exhaustive API extraction
npx tsx scripts/pbi-exhaustive.mts

# 5. Decode DSR responses
npx tsx scripts/dsr-decoder.mts /tmp/pbi_capture extraction/decoded

# 6. Extract report metadata
npx tsx scripts/extract-report-metadata.mts

# 7. Generate coverage report
npx tsx scripts/generate-coverage.mts

# 8. Build report.ts
npx tsx scripts/build-report-ts.mts
```

---

## Technical notes

### Direct API replay technique
The Power BI `querydata` endpoint accepts POST requests without authentication for public reports. The key insight is:

1. Capture the request format from Playwright (URL, headers, body structure)
2. The body contains: `version`, `queries[].Query.Commands[].SemanticQueryDataShapeCommand`, `modelId`
3. Each query has `From` (entities), `Select` (measures), `Where` (filters)
4. Year filters require `L` suffix: `"2026L"`
5. Month filters use Portuguese names: `"'maio'"`
6. Canal filters use: `"'Retenção'"`

### DSR bitmask (R field)
The `R` field in DSR responses is a bitmask where bit N indicates whether column N repeats from the previous row. This was a critical discovery for correct decoding.

### Files
```
extraction/
├── raw/              # 93 querydata + report layout + conceptualschema
├── decoded/          # 93 decoded JSON + metadata
├── coverage/         # coverage.json + summary.md
├── page_*.png        # 8 screenshots
├── page_*_text.txt   # Extracted text
└── summary.md        # This file

scripts/
├── pbi-extractor.mts       # Playwright page navigation
├── pbi-query-missing.mts   # Direct API replay for missing measures
├── pbi-exhaustive.mts      # Exhaustive API extraction
├── pbi-fix-filters.mts     # Fixed filter format queries
├── dsr-decoder.mts         # DSR decoder with bitmask support
├── extract-report-metadata.mts  # Report layout parser
├── generate-coverage.mts   # Coverage report generator
└── build-report-ts.mts     # report.ts builder
```
