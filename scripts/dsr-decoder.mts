/**
 * DSR (Data Shape Result) Decoder for Power BI querydata responses.
 *
 * Handles:
 *  - DS with PH (provisioning header) by DM level (DM0=subtotals, DM1=detail)
 *  - Rows with S + C (schema + values array)
 *  - Rows with S + direct properties (M0, M1, G0, etc.)
 *  - Rows with R (repeat — inherit missing values from previous row)
 *  - Rows with A0/A1/etc. (aggregation/subtotal values)
 *  - Delta-encoded rows (schema inherited from first row in DM)
 *  - Direct DS-level properties (M0, M1, S, etc.)
 *  - Date timestamps (millis → ISO)
 *
 * Preserves real measure names from descriptor.Select[].Name
 * Preserves real dimension names from descriptor.Select[].GroupKeys[].Source
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { join, basename } from "path";

// --- Types ---

interface DsrSelect {
  Kind: number; // 1=group, 2=measure
  Value: string; // column id: G0, M0, A0, etc.
  Name?: string;
  Format?: string;
  Depth?: number;
  Subtotal?: string[];
  GroupKeys?: Array<{
    Source?: { Entity: string; Property: string };
    Calc?: string;
  }>;
}

interface DsrRow {
  S?: Array<{ N: string; T: number }>;
  C?: unknown[];
  R?: number;
  [key: string]: unknown; // M0, G0, A0, etc.
}

interface DsrDM {
  S?: Array<{ N: string; T: number }>;
  [key: string]: unknown; // rows are indexed by number, plus M0, G0, etc.
}

interface DsrPH {
  [key: string]: DsrDM[]; // DM0, DM1, etc.
}

interface DsrDS {
  N?: string;
  PH?: DsrPH[];
  S?: Array<{ N: string; T: number }>;
  IC?: boolean;
  HAD?: boolean;
  [key: string]: unknown;
}

interface DsrRoot {
  Version: number;
  MinorVersion?: number;
  DS: DsrDS[];
}

interface QueryResult {
  file: string;
  timestamp?: string;
  descriptor?: {
    Select: DsrSelect[];
    Version?: number;
    Expressions?: unknown;
  };
  dsr: DsrRoot;
  rowCount?: number;
  fromCache?: boolean;
}

export interface DecodedQuery {
  file: string;
  timestamp?: string;
  fromCache?: boolean;
  measures: Array<{ id: string; name: string; format?: string; subtotalIds?: string[] }>;
  dimensions: Array<{ id: string; name: string; entity?: string; property?: string; depth?: number }>;
  groups: Array<{
    memberId: string;
    subtotalOf?: string;
    rows: Array<Record<string, unknown>>;
  }>;
  directProperties: Record<string, unknown>;
  totalRows: number;
}

// --- Type mapping ---

const TYPE_MAP: Record<number, string> = {
  1: "string",
  2: "boolean",
  3: "number",
  4: "float",
  5: "double",
  6: "decimal",
  7: "datetime",
  8: "datetime",
};

// --- Decoder ---

function parseTimestamp(ts: unknown): string | unknown {
  if (typeof ts === "number" && ts > 1000000000000 && ts < 2000000000000) {
    return new Date(ts).toISOString().split("T")[0]; // YYYY-MM-DD
  }
  return ts;
}

function decodeRow(
  raw: DsrRow,
  schema: Array<{ N: string; T: number }>,
  prevRow?: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  // Schema from S or inherited
  const rowSchema = raw.S || schema;

  // R is a bitmask: bit N = 1 means column N repeats from previous row.
  // C values fill only the columns whose bit is 0 (new values).
  if (raw.R !== undefined && prevRow && rowSchema) {
    const rMask = raw.R;
    let cIdx = 0;
    for (let i = 0; i < rowSchema.length; i++) {
      const col = rowSchema[i];
      const bit = (rMask >> i) & 1;
      if (bit === 1) {
        // Repeat from previous row
        row[col.N] = prevRow[col.N];
      } else {
        // New value from C
        if (raw.C && cIdx < raw.C.length) {
          let val = raw.C[cIdx];
          if (col.T === 7 || col.T === 8) val = parseTimestamp(val);
          row[col.N] = val;
          cIdx++;
        }
      }
    }
  } else if (raw.C && rowSchema) {
    // No R — simple positional mapping
    for (let i = 0; i < raw.C.length; i++) {
      const col = rowSchema[i];
      if (col) {
        let val = raw.C[i];
        if (col.T === 7 || col.T === 8) val = parseTimestamp(val);
        row[col.N] = val;
      }
    }
  }

  // Direct properties (M0, G0, A0, etc.)
  for (const key of Object.keys(raw)) {
    if (key === "S" || key === "C" || key === "R") continue;
    if (/^[AGMA]\d+$/.test(key)) {
      row[key] = parseTimestamp(raw[key]);
    }
  }

  return row;
}

function decodeDM(
  dmArray: DsrDM[],
  levelName: string
): { schema: Array<{ N: string; T: number }>; rows: Array<Record<string, unknown>> } {
  const allRows: Array<Record<string, unknown>> = [];
  let currentSchema: Array<{ N: string; T: number }> = [];

  for (const dm of dmArray) {
    // Update schema if present
    if (dm.S) {
      currentSchema = dm.S;
    }

    // The DM itself might be a row (has C or direct props)
    const rowKeys = Object.keys(dm).filter(
      (k) => k !== "S" && (k === "C" || /^[AGMA]\d+$/.test(k))
    );

    if (dm.C !== undefined || rowKeys.length > 0) {
      const prevRow = allRows.length > 0 ? allRows[allRows.length - 1] : undefined;
      const row = decodeRow(dm as unknown as DsrRow, currentSchema, prevRow);
      allRows.push(row);
    }
  }

  return { schema: currentSchema, rows: allRows };
}

export function decodeDsr(body: QueryResult): DecodedQuery {
  const { descriptor, dsr, file, timestamp, fromCache } = body;

  // Build measure and dimension maps from descriptor
  const measures: DecodedQuery["measures"] = [];
  const dimensions: DecodedQuery["dimensions"] = [];

  if (descriptor?.Select) {
    for (const sel of descriptor.Select) {
      if (!sel) continue; // null entries in Select array
      if (sel.Kind === 2) {
        measures.push({
          id: sel.Value,
          name: sel.Name || sel.Value,
          format: sel.Format,
          subtotalIds: sel.Subtotal,
        });
      } else if (sel.Kind === 1) {
        const gk = sel.GroupKeys?.[0];
        dimensions.push({
          id: sel.Value,
          name: sel.Name || sel.Value,
          entity: gk?.Source?.Entity,
          property: gk?.Source?.Property,
          depth: sel.Depth,
        });
      }
    }
  }

  // Decode DSR
  const groups: DecodedQuery["groups"] = [];
  const directProperties: Record<string, unknown> = {};
  let totalRows = 0;

  const ds = dsr?.DS?.[0];
  if (!ds) {
    return { file, timestamp, fromCache, measures, dimensions, groups, directProperties, totalRows };
  }

  // DS-level direct properties (title, etc.)
  if (ds.S) {
    for (const col of ds.S) {
      const val = ds[col.N];
      if (val !== undefined) {
        directProperties[col.N] = parseTimestamp(val);
      }
    }
  }
  // Also grab any non-reserved DS-level keys
  for (const key of Object.keys(ds)) {
    if (["N", "PH", "S", "IC", "HAD"].includes(key)) continue;
    if (/^[AGMA]\d+$/.test(key) || typeof ds[key] === "string") {
      if (!(key in directProperties)) {
        directProperties[key] = parseTimestamp(ds[key]);
      }
    }
  }

  // Process PH (provisioning headers)
  if (ds.PH) {
    for (const ph of ds.PH) {
      for (const dmKey of Object.keys(ph)) {
        // dmKey = "DM0", "DM1", etc.
        const dmArray = ph[dmKey];
        if (!Array.isArray(dmArray)) continue;

        const levelNum = parseInt(dmKey.replace("DM", ""), 10);
        const isSubtotal = levelNum === 0;
        const parentDim = dimensions.find((d) => {
          // Match by expressions or by convention
          return d.depth === levelNum || (isSubtotal && d.depth === undefined);
        });

        const { rows } = decodeDM(dmArray, dmKey);
        totalRows += rows.length;

        groups.push({
          memberId: dmKey,
          subtotalOf: isSubtotal ? undefined : `DM${levelNum - 1}`,
          rows,
        });
      }
    }
  }

  return { file, timestamp, fromCache, measures, dimensions, groups, directProperties, totalRows };
}

// --- CLI ---

function main() {
  const args = process.argv.slice(2);
  const inputDir = args[0] || "/tmp/pbi_capture2";
  const outputDir = args[1] || "/Users/gabriel/Documents/bi-mvp/extraction/decoded";

  mkdirSync(outputDir, { recursive: true });

  const files = readdirSync(inputDir)
    .filter((f) => f.includes("querydata") && f.endsWith(".txt"))
    .sort();

  console.log(`Found ${files.length} querydata files in ${inputDir}`);

  const allDecoded: DecodedQuery[] = [];
  let errors = 0;

  for (const file of files) {
    try {
      const raw = readFileSync(join(inputDir, file), "utf-8");
      const body: QueryResult = JSON.parse(raw);

      // Extract the actual querydata response
      const result = body.results?.[0]?.result?.data;
      if (!result?.dsr) {
        console.warn(`  SKIP ${file}: no dsr found`);
        continue;
      }

      const queryResult: QueryResult = {
        file,
        timestamp: result.timestamp,
        descriptor: result.descriptor,
        dsr: result.dsr,
        fromCache: result.fromCache,
      };

      const decoded = decodeDsr(queryResult);
      allDecoded.push(decoded);

      // Write individual decoded file
      const outName = file.replace(".txt", ".json");
      writeFileSync(join(outputDir, outName), JSON.stringify(decoded, null, 2));

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR ${file}: ${message}`);
      errors++;
    }
  }

  // Write consolidated file
  writeFileSync(join(outputDir, "_all_decoded.json"), JSON.stringify(allDecoded, null, 2));

  // Summary
  const totalMeasures = new Set<string>();
  const totalDimensions = new Set<string>();
  let totalRows = 0;

  for (const q of allDecoded) {
    q.measures.forEach((m) => totalMeasures.add(m.name));
    q.dimensions.forEach((d) => totalDimensions.add(d.name));
    totalRows += q.totalRows;
  }

  console.log(`\n=== DSR Decode Summary ===`);
  console.log(`Files processed: ${allDecoded.length}`);
  console.log(`Errors: ${errors}`);
  console.log(`Unique measures: ${totalMeasures.size}`);
  console.log(`Unique dimensions: ${totalDimensions.size}`);
  console.log(`Total data rows: ${totalRows}`);
  console.log(`\nMeasures:`);
  [...totalMeasures].sort().forEach((m) => console.log(`  - ${m}`));
  console.log(`\nDimensions:`);
  [...totalDimensions].sort().forEach((d) => console.log(`  - ${d}`));
}

main();
