/**
 * Query actual meta values for 2025 months from Power BI.
 * Uses the same measure as faturamentoMensal (Sum(Append metas.TOTAL DO MÊS)).
 */

import { chromium, type Request } from "playwright";
import { writeFileSync } from "fs";

const PBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTQ1YTc3YjItMmZjZS00MGQ1LTk5MmQtY2FlZDkwYjUxNjNjIiwidCI6ImJiNDZiYjk2LWFkZmQtNDkzMy05YjYxLTRkYTM0ZGU5YTY1NSJ9";
const WABI = "wabi-brazil-south-b-primary-api.analysis.windows.net";

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  let capturedUrl = "";
  let capturedHeaders: Record<string, string> = {};
  let sampleBody: any = null;

  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "pt-BR" })).newPage();

  page.on("request", (request: Request) => {
    const url = request.url();
    if (url.includes(WABI) && url.includes("querydata") && !capturedUrl) {
      capturedUrl = url;
      capturedHeaders = request.headers();
      const pd = request.postData();
      if (pd) try { sampleBody = JSON.parse(pd); } catch {}
    }
  });

  console.log("Loading report...");
  await page.goto(PBI_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(15000);
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await browser.close();

  const modelId = sampleBody.modelId;
  const version = sampleBody.version;
  const appCtx = sampleBody.queries[0]?.ApplicationContext || {};

  const headers: Record<string, string> = {
    "accept": "application/json",
    "content-type": "application/json",
    "origin": "https://app.powerbi.com",
    "referer": "https://app.powerbi.com/",
    "user-agent": capturedHeaders["user-agent"],
  };
  if (capturedHeaders["x-powerbi-resourcekey"]) headers["x-powerbi-resourcekey"] = capturedHeaders["x-powerbi-resourcekey"];

  async function query(selects: any[], froms: any[], wheres: any[] = []) {
    const body = {
      version,
      queries: [{
        Query: { Commands: [{ SemanticQueryDataShapeCommand: { Query: { Version: 2, From: froms, Select: selects, Where: wheres } } }] },
        CacheKey: "", QueryId: Math.random().toString(36).substring(2), ApplicationContext: appCtx,
      }],
      cancelQueries: [], modelId,
    };
    const res = await fetch(capturedUrl, { method: "POST", headers, body: JSON.stringify(body) });
    return res.json();
  }

  function extractRows(r: any): any[] {
    try {
      const ds = r.results?.[0]?.result?.data?.dsr?.DS?.[0];
      if (!ds) return [];
      const rows: any[] = [];
      for (const ph of (ds.PH || [])) {
        for (const dmArr of Object.values(ph)) {
          if (Array.isArray(dmArr)) {
            for (const row of dmArr) {
              if (row.C) {
                rows.push(row.C);
              }
            }
          }
        }
      }
      return rows;
    } catch { return []; }
  }

  // Query the serie mensal with meta for 2025
  console.log("\n=== Querying faturamento mensal 2025 (with meta) ===");
  const r2025 = await query(
    [
      { Measure: { Expression: { SourceRef: { Source: "a" } }, Property: "TOTAL DO MÊS" }, Name: "Sum(Append metas.TOTAL DO MÊS)" },
      { Measure: { Expression: { SourceRef: { Source: "a" } }, Property: "META DO MÊS" }, Name: "Sum(Append metas.META DO MÊS)" },
    ],
    [{ Name: "a", Entity: "Append metas", Type: 0 }, { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 }],
    [
      { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: "2025L" } }]] } } },
    ]
  );

  const rows2025 = extractRows(r2025);
  console.log("2025 rows:", rows2025);

  // Query 2026 for comparison
  console.log("\n=== Querying faturamento mensal 2026 (with meta) ===");
  const r2026 = await query(
    [
      { Measure: { Expression: { SourceRef: { Source: "a" } }, Property: "TOTAL DO MÊS" }, Name: "Sum(Append metas.TOTAL DO MÊS)" },
      { Measure: { Expression: { SourceRef: { Source: "a" } }, Property: "META DO MÊS" }, Name: "Sum(Append metas.META DO MÊS)" },
    ],
    [{ Name: "a", Entity: "Append metas", Type: 0 }, { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 }],
    [
      { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: "2026L" } }]] } } },
    ]
  );

  const rows2026 = extractRows(r2026);
  console.log("2026 rows:", rows2026);

  // Also try querying with month dimension
  console.log("\n=== Querying with month dimension 2025 ===");
  const r2025m = await query(
    [
      { Measure: { Expression: { SourceRef: { Source: "a" } }, Property: "TOTAL DO MÊS" }, Name: "Sum(Append metas.TOTAL DO MÊS)" },
      { Measure: { Expression: { SourceRef: { Source: "a" } }, Property: "META DO MÊS" }, Name: "Sum(Append metas.META DO MÊS)" },
    ],
    [{ Name: "a", Entity: "Append metas", Type: 0 }, { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 }],
    [
      { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: "2025L" } }]] } } },
    ]
  );

  // Try to get rows with month labels
  const ds2025 = r2025m.results?.[0]?.result?.data?.dsr?.DS?.[0];
  if (ds2025) {
    console.log("DS keys:", Object.keys(ds2025));
    for (const ph of (ds2025.PH || [])) {
      for (const [key, dmArr] of Object.entries(ph)) {
        if (Array.isArray(dmArr)) {
          console.log(`  PH[${key}]: ${dmArr.length} rows`);
          for (const row of dmArr.slice(0, 3)) {
            console.log("    row:", JSON.stringify(row));
          }
        }
      }
    }
  }

  writeFileSync("/tmp/pbi_2025_monthly/meta_data.json", JSON.stringify({ rows2025, rows2026, raw2025: r2025m }, null, 2));
  console.log("\nSaved to /tmp/pbi_2025_monthly/meta_data.json");
}

main().catch(console.error);
