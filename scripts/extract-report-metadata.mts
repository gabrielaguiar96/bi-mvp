/**
 * Extract report metadata from Power BI layout JSON.
 *
 * Pulls: pages, visuals, slicers, visual types, query references,
 * and attempts to map visuals → queries.
 *
 * Usage: npx tsx scripts/extract-report-metadata.mts <layout.json> <outputDir>
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

interface VisualConfig {
  singleVisual?: {
    visualType?: string;
    projections?: Record<string, Array<{ queryRef?: string; dynamicReference?: unknown }>>;
    prototypeQuery?: unknown;
    objects?: unknown;
  };
}

interface VisualContainer {
  id?: string;
  config?: string;
  position?: { x?: number; y?: number; width?: number; height?: number; z?: number };
  filters?: string;
  data?: unknown;
}

interface Section {
  displayName?: string;
  name?: string;
  visualContainers?: VisualContainer[];
  config?: string;
  displayOption?: unknown;
}

interface ReportLayout {
  exploration?: {
    id?: string;
    reportId?: string;
    sections?: Section[];
    pods?: unknown;
    config?: string;
    resourcePackages?: unknown;
    report?: unknown;
  };
  models?: unknown;
  package?: {
    id?: string;
    name?: string;
    ObjectId?: string;
    lastRefreshTime?: string;
    permissions?: unknown;
    pbixResources?: unknown;
  };
  featureSwitches?: unknown;
  mobileState?: unknown;
}

interface ExtractedVisual {
  pageName: string;
  pageIndex: number;
  visualIndex: number;
  visualType: string;
  position?: { x?: number; y?: number; width?: number; height?: number };
  measures: string[];
  dimensions: string[];
  filters: unknown;
  queryRefs: string[];
}

interface ExtractedPage {
  name: string;
  index: number;
  visualCount: number;
  slicerCount: number;
  visuals: ExtractedVisual[];
  slicers: Array<{
    label: string;
    queryRef: string;
    visualIndex: number;
  }>;
}

interface ExtractedMetadata {
  reportId?: string;
  packageName?: string;
  lastRefresh?: string;
  pageCount: number;
  pages: ExtractedPage[];
  allMeasures: string[];
  allDimensions: string[];
  allSlicers: Array<{ page: string; queryRef: string; visualIndex: number }>;
  visualTypeCounts: Record<string, number>;
}

function parseConfig(configStr?: string): VisualConfig | null {
  if (!configStr) return null;
  try {
    return JSON.parse(configStr);
  } catch {
    return null;
  }
}

function extractVisual(v: VisualContainer, pageName: string, pageIndex: number, visualIndex: number): ExtractedVisual {
  const config = parseConfig(v.config);
  const sv = config?.singleVisual;
  const visualType = sv?.visualType || "unknown";

  const measures: string[] = [];
  const dimensions: string[] = [];
  const queryRefs: string[] = [];

  if (sv?.projections) {
    for (const [key, projArr] of Object.entries(sv.projections)) {
      if (!Array.isArray(projArr)) continue;
      for (const proj of projArr) {
        if (proj.queryRef) {
          queryRefs.push(proj.queryRef);
          // Slicers project dimensions, not measures
          if (visualType === "slicer") {
            dimensions.push(proj.queryRef);
          } else if (
            proj.queryRef.startsWith("Sum(") ||
            proj.queryRef.startsWith("Count(") ||
            proj.queryRef.startsWith("Avg(") ||
            proj.queryRef.startsWith("Min(") ||
            proj.queryRef.startsWith("Max(") ||
            proj.queryRef.startsWith("_Medidas") ||
            proj.queryRef.startsWith("Acrescentar1.") ||
            proj.queryRef.startsWith("Leads ") ||
            proj.queryRef.startsWith("Metas ") ||
            proj.queryRef.includes("% ")
          ) {
            measures.push(proj.queryRef);
          } else if (proj.queryRef.includes("(")) {
            measures.push(proj.queryRef);
          } else {
            // Default: if it has dots and looks like Entity.Property, could be either
            // But in visuals (non-slicer), queryRefs are usually measures
            measures.push(proj.queryRef);
          }
        }
      }
    }
  }

  return {
    pageName,
    pageIndex,
    visualIndex,
    visualType,
    position: v.position ? { x: v.position.x, y: v.position.y, width: v.position.width, height: v.position.height } : undefined,
    measures,
    dimensions,
    filters: v.filters ? JSON.parse(v.filters) : undefined,
    queryRefs,
  };
}

function main() {
  const args = process.argv.slice(2);
  const layoutPath = args[0] || "/tmp/pbi_capture/wabi_brazil_south_b_primary_api_analysis_windows_net_public_reports_145a77b2_2fc_2.json";
  const outputDir = args[1] || "/Users/gabriel/Documents/bi-mvp/extraction/decoded";

  mkdirSync(outputDir, { recursive: true });

  console.log(`Reading layout from: ${layoutPath}`);
  const layout: ReportLayout = JSON.parse(readFileSync(layoutPath, "utf-8"));

  const exploration = layout.exploration;
  if (!exploration?.sections) {
    console.error("No sections found in layout");
    process.exit(1);
  }

  const pages: ExtractedPage[] = [];
  const allMeasures = new Set<string>();
  const allDimensions = new Set<string>();
  const allSlicers: ExtractedMetadata["allSlicers"] = [];
  const visualTypeCounts: Record<string, number> = {};

  for (let pi = 0; pi < exploration.sections.length; pi++) {
    const section = exploration.sections[pi];
    const pageName = section.displayName || section.name || `Page ${pi}`;
    const visuals: ExtractedVisual[] = [];
    const slicers: ExtractedPage["slicers"] = [];

    for (let vi = 0; vi < (section.visualContainers || []).length; vi++) {
      const vc = section.visualContainers![vi];
      const extracted = extractVisual(vc, pageName, pi, vi);
      visuals.push(extracted);

      // Track visual types
      visualTypeCounts[extracted.visualType] = (visualTypeCounts[extracted.visualType] || 0) + 1;

      // Track measures and dimensions
      extracted.measures.forEach((m) => allMeasures.add(m));
      extracted.dimensions.forEach((d) => allDimensions.add(d));

      // Track slicers
      if (extracted.visualType === "slicer" && extracted.queryRefs.length > 0) {
        slicers.push({
          label: extracted.queryRefs[0],
          queryRef: extracted.queryRefs[0],
          visualIndex: vi,
        });
        allSlicers.push({
          page: pageName,
          queryRef: extracted.queryRefs[0],
          visualIndex: vi,
        });
      }
    }

    pages.push({
      name: pageName,
      index: pi,
      visualCount: visuals.length,
      slicerCount: slicers.length,
      visuals,
      slicers,
    });
  }

  const metadata: ExtractedMetadata = {
    reportId: exploration.reportId,
    packageName: layout.package?.name,
    lastRefresh: layout.package?.lastRefreshTime,
    pageCount: pages.length,
    pages,
    allMeasures: [...allMeasures].sort(),
    allDimensions: [...allDimensions].sort(),
    allSlicers,
    visualTypeCounts,
  };

  writeFileSync(join(outputDir, "_report_metadata.json"), JSON.stringify(metadata, null, 2));

  // Print summary
  console.log(`\n=== Report Metadata ===`);
  console.log(`Report ID: ${metadata.reportId}`);
  console.log(`Package: ${metadata.packageName}`);
  console.log(`Last refresh: ${metadata.lastRefresh}`);
  console.log(`Pages: ${metadata.pageCount}`);
  console.log(`\nVisual types:`);
  for (const [type, count] of Object.entries(visualTypeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log(`\nMeasures found in visuals: ${allMeasures.size}`);
  console.log(`Dimensions found in visuals: ${allDimensions.size}`);
  console.log(`Slicers: ${allSlicers.length}`);
  console.log(`\nPages:`);
  for (const p of pages) {
    console.log(`  ${p.index}: "${p.name}" — ${p.visualCount} visuals, ${p.slicerCount} slicers`);
    for (const s of p.slicers) {
      console.log(`    Slicer: ${s.queryRef}`);
    }
  }

  console.log(`\nOutput: ${join(outputDir, "_report_metadata.json")}`);
}

main();
