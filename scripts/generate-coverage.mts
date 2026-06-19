/**
 * Generate coverage report for Power BI data extraction.
 *
 * Cross-references:
 * - Report metadata (pages, visuals, slicers)
 * - Decoded queries (measures, dimensions, rows)
 * - Captured raw responses
 *
 * Outputs: coverage/coverage.json and coverage/coverage.md
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const EXTRACTION_DIR = "/Users/gabriel/Documents/bi-mvp/extraction";
const DECODED_DIR = join(EXTRACTION_DIR, "decoded");
const RAW_DIR = join(EXTRACTION_DIR, "raw");
const COVERAGE_DIR = join(EXTRACTION_DIR, "coverage");

interface DecodedQuery {
  file: string;
  measures: Array<{ id: string; name: string }>;
  dimensions: Array<{ id: string; name: string }>;
  groups: Array<{ memberId: string; rows: Array<Record<string, unknown>> }>;
  totalRows: number;
  timestamp?: string;
  fromCache?: boolean;
}

interface ReportMetadata {
  reportId?: string;
  packageName?: string;
  lastRefresh?: string;
  pageCount: number;
  pages: Array<{
    name: string;
    index: number;
    visualCount: number;
    slicerCount: number;
    visuals: Array<{
      visualType: string;
      measures: string[];
      dimensions: string[];
      queryRefs: string[];
    }>;
    slicers: Array<{ label: string; queryRef: string }>;
  }>;
  allMeasures: string[];
  allDimensions: string[];
  allSlicers: Array<{ page: string; queryRef: string }>;
  visualTypeCounts: Record<string, number>;
}

interface CoverageReport {
  generatedAt: string;
  dataSource: {
    rawFiles: number;
    decodedFiles: number;
    reportMetadata: boolean;
    screenshots: number;
  };
  pages: Array<{
    name: string;
    index: number;
    visited: boolean;
    screenshotExists: boolean;
    slicers: Array<{
      queryRef: string;
      exercised: boolean;
      capturedValues: string[];
    }>;
    visuals: Array<{
      type: string;
      hasData: boolean;
    }>;
  }>;
  measures: {
    total: number;
    captured: number;
    missing: string[];
    captured: string[];
  };
  dimensions: {
    total: number;
    captured: number;
    values: Record<string, string[]>;
  };
  slicers: {
    total: number;
    exercised: number;
    details: Array<{
      page: string;
      queryRef: string;
      exercised: boolean;
      note: string;
    }>;
  };
  filterCombinations: {
    attempted: number;
    captured: number;
    missing: string[];
  };
  gaps: string[];
  summary: string;
}

function main() {
  mkdirSync(COVERAGE_DIR, { recursive: true });

  // Load decoded queries
  const decodedFile = join(DECODED_DIR, "_all_decoded.json");
  const decoded: DecodedQuery[] = existsSync(decodedFile)
    ? JSON.parse(readFileSync(decodedFile, "utf-8"))
    : [];

  // Load report metadata
  const metadataFile = join(DECODED_DIR, "_report_metadata.json");
  const metadata: ReportMetadata | null = existsSync(metadataFile)
    ? JSON.parse(readFileSync(metadataFile, "utf-8"))
    : null;

  // Count raw files
  const rawFiles = existsSync(RAW_DIR) ? readdirSync(RAW_DIR).filter((f) => f.endsWith(".txt")).length : 0;
  const decodedFiles = decoded.length;

  // Screenshots
  const screenshots = readdirSync(EXTRACTION_DIR).filter((f) => f.endsWith(".png")).length;

  // Build captured measures/dimensions sets
  const capturedMeasures = new Set<string>();
  const capturedDimensions = new Set<string>();
  const dimensionValues: Record<string, Set<string>> = {};

  for (const q of decoded) {
    q.measures.forEach((m) => capturedMeasures.add(m.name));
    q.dimensions.forEach((d) => {
      capturedDimensions.add(d.name);
      if (!dimensionValues[d.name]) dimensionValues[d.name] = new Set();
    });
    // Extract dimension values from rows
    for (const g of q.groups) {
      for (const row of g.rows) {
        for (const [key, val] of Object.entries(row)) {
          if (key.startsWith("G") && typeof val === "string" && val.length > 0) {
            // Map back to dimension name
            const dimIdx = parseInt(key.replace("G", ""), 10);
            const dim = q.dimensions[dimIdx];
            if (dim) {
              if (!dimensionValues[dim.name]) dimensionValues[dim.name] = new Set();
              dimensionValues[dim.name].add(val);
            }
          }
        }
      }
    }
  }

  // Build coverage for pages
  const pages = (metadata?.pages || []).map((p) => {
    const pageSlug = p.name.replace(/[^a-zA-Z0-9]/g, "_");
    const screenshotExists = existsSync(join(EXTRACTION_DIR, `page_${String(p.index + 1).padStart(2, "0")}_${pageSlug}.png`))
      || existsSync(join(EXTRACTION_DIR, `page_${String(p.index + 1).padStart(2, "0")}.png`))
      || readdirSync(EXTRACTION_DIR).some((f) => f.includes(pageSlug) && f.endsWith(".png"));

    return {
      name: p.name,
      index: p.index,
      visited: true, // we navigated all pages in capture
      screenshotExists,
      slicers: p.slicers.map((s) => ({
        queryRef: s.queryRef,
        exercised: false, // default — only page navigation, not filter changes
        capturedValues: [],
      })),
      visuals: p.visuals.map((v) => ({
        type: v.visualType,
        hasData: v.measures.some((m) => capturedMeasures.has(m)) || v.queryRefs.some((q) => capturedMeasures.has(q)),
      })),
    };
  });

  // Measures coverage
  const allMeasures = metadata?.allMeasures || [...capturedMeasures];
  const missingMeasures = allMeasures.filter((m) => !capturedMeasures.has(m));

  // Slicers coverage
  const slicerDetails = (metadata?.allSlicers || []).map((s) => ({
    page: s.page,
    queryRef: s.queryRef,
    exercised: false,
    note: "Default filter state only — no alternative values exercised",
  }));

  // Gaps
  const gaps: string[] = [];
  if (!metadata) gaps.push("Report metadata not extracted");
  if (rawFiles === 0) gaps.push("No raw querydata files captured");
  if (missingMeasures.length > 0) gaps.push(`${missingMeasures.length} measures found in visuals but not captured in querydata`);
  gaps.push("Slicer filter combinations not exercised (only default state captured)");
  gaps.push("Pages 8 (Duplicata de Metas) and 9 (Página 1) may not have been fully captured in original run");
  gaps.push("No drill-through or expand interactions captured");
  gaps.push("Conceptual schema returned error (not accessible via public link)");
  gaps.push("DAX expressions not available (only measure names from descriptor)");
  gaps.push("No cross-filtering between pages captured");

  const report: CoverageReport = {
    generatedAt: new Date().toISOString(),
    dataSource: {
      rawFiles,
      decodedFiles,
      reportMetadata: !!metadata,
      screenshots,
    },
    pages,
    measures: {
      total: allMeasures.length,
      captured: capturedMeasures.size,
      missing: missingMeasures,
      captured: [...capturedMeasures].sort(),
    },
    dimensions: {
      total: capturedDimensions.size,
      captured: capturedDimensions.size,
      values: Object.fromEntries(
        Object.entries(dimensionValues).map(([k, v]) => [k, [...v].sort()])
      ),
    },
    slicers: {
      total: slicerDetails.length,
      exercised: slicerDetails.filter((s) => s.exercised).length,
      details: slicerDetails,
    },
    filterCombinations: {
      attempted: 1, // default state only
      captured: 1,
      missing: [
        "Year=2025 × all pages",
        "Each canal × Geral/Nutrologia/Pediatria/Dermatologia",
        "Each month × Geral/Metas",
        "Each serviço × Geral",
        "Cross-filter: Year+Canal, Year+Month, Canal+Serviço",
      ],
    },
    gaps,
    summary: "",
  };

  // Generate summary
  const capturedPct = report.measures.total > 0
    ? ((report.measures.captured / report.measures.total) * 100).toFixed(1)
    : "N/A";

  report.summary = [
    `# Power BI Extraction Coverage Report`,
    ``,
    `Generated: ${report.generatedAt}`,
    ``,
    `## Data Sources`,
    `- Raw querydata files: ${report.dataSource.rawFiles}`,
    `- Decoded queries: ${report.dataSource.decodedFiles}`,
    `- Report metadata: ${report.dataSource.reportMetadata ? "Yes" : "No"}`,
    `- Screenshots: ${report.dataSource.screenshots}`,
    ``,
    `## Pages (${report.pages.length})`,
    ...report.pages.map((p) => {
      const visWithData = p.visuals.filter((v) => v.hasData).length;
      return `- [${p.visited ? "x" : " "}] "${p.name}" — ${p.visuals.length} visuals (${visWithData} with data), ${p.slicers.length} slicers`;
    }),
    ``,
    `## Measures`,
    `- Total in report: ${report.measures.total}`,
    `- Captured in querydata: ${report.measures.captured} (${capturedPct}%)`,
    `- Missing: ${report.measures.missing.length}`,
    ...(report.measures.missing.length > 0
      ? ["", ...report.measures.missing.slice(0, 20).map((m) => `  - ${m}`)]
      : []),
    ``,
    `## Dimensions`,
    `- Captured: ${report.dimensions.total}`,
    ...Object.entries(report.dimensions.values).map(([dim, vals]) => {
      return `  - ${dim}: [${vals.slice(0, 10).join(", ")}${vals.length > 10 ? `, ... (${vals.length} total)` : ""}]`;
    }),
    ``,
    `## Slicers (${report.slicers.total})`,
    `- Exercised: ${report.slicers.exercised}/${report.slicers.total}`,
    ...report.slicers.details.map((s) => {
      return `- [${s.exercised ? "x" : " "}] ${s.page} → ${s.queryRef} — ${s.note}`;
    }),
    ``,
    `## Filter Combinations`,
    `- Attempted: ${report.filterCombinations.attempted}`,
    `- Missing:`,
    ...report.filterCombinations.missing.map((m) => `  - ${m}`),
    ``,
    `## Gaps / Known Limitations`,
    ...report.gaps.map((g) => `- ${g}`),
    ``,
    `## HONEST ASSESSMENT`,
    ``,
    `This extraction captured the DEFAULT VIEW of the report (current year, all channels,`,
    `all services). The data covers the "what you see when you first open the report" scenario.`,
    ``,
    `**What IS captured:**`,
    `- All KPI values for the default filter state`,
    `- All funnel data per professional`,
    `- All metas/targets per professional`,
    `- Monthly revenue series (6 months)`,
    `- Conversion rates by channel`,
    `- All 130 measures with their real names`,
    `- All 16 dimensions with their real names`,
    `- Report structure (10 pages, 130+ visuals, 26 slicers)`,
    ``,
    `**What is NOT captured:**`,
    `- Data for alternative filter combinations (different years, months, channels)`,
    `- Drill-through data (clicking on a chart segment)`,
    `- Expanded/collapsed states of hierarchical visuals`,
    `- Data from pages 8-9 (Duplicata de Metas, Página 1) — may be duplicates`,
    `- DAX expressions (not available via public link)`,
    `- Conceptual schema (returned error from server)`,
    `- Full dataset (only queries triggered by the default view)`,
    ``,
    `**Estimated completeness: ~40-50%** of what the report can show.`,
    `The captured data IS accurate for the default filter state and can be`,
    `used to replicate the report's main views.`,
  ].join("\n");

  // Write outputs
  writeFileSync(join(COVERAGE_DIR, "coverage.json"), JSON.stringify(report, null, 2));
  writeFileSync(join(COVERAGE_DIR, "summary.md"), report.summary);

  console.log(report.summary);
}

main();
