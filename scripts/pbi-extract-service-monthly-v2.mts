/**
 * Extract faturamento por serviço por mês for 2026.
 * Uses _MedidasGeral.Faturamento with dServiços join.
 *
 * Usage: npx tsx scripts/pbi-extract-service-monthly-v2.mts
 */

import { chromium, type Request } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const PBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTQ1YTc3YjItMmZjZS00MGQ1LTk5MmQtY2FlZDkwYjUxNjNjIiwidCI6ImJiNDZiYjk2LWFkZmQtNDkzMy05YjYxLTRkYTM0ZGU5YTY1NSJ9";
const WABI = "wabi-brazil-south-b-primary-api.analysis.windows.net";
const OUTPUT = "/tmp/pbi_service_monthly_v2";

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  mkdirSync(OUTPUT, { recursive: true });

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

  function extractScalar(r: any): unknown {
    try {
      const ds = r.results?.[0]?.result?.data?.dsr?.DS?.[0];
      if (!ds) return null;
      for (const ph of (ds.PH || [])) {
        for (const dmArr of Object.values(ph)) {
          if (Array.isArray(dmArr)) {
            for (const row of dmArr) {
              if (row.M0 !== undefined) return row.M0;
              if (row.C?.[0] !== undefined) return row.C[0];
            }
          }
        }
      }
      return null;
    } catch { return null; }
  }

  const MES_NAMES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho"];
  const SERVICOS = ["Nutrologia", "Pediatria", "Dermatologia"];
  const results: Record<string, Record<string, number>> = {};

  console.log("\n=== Querying faturamento por serviço by month ===");
  for (let mes = 0; mes < 6; mes++) {
    const mesName = MES_NAMES[mes];
    results[mesName] = {};

    for (const servico of SERVICOS) {
      const r = await query(
        [{ Measure: { Expression: { SourceRef: { Source: "_" } }, Property: "Faturamento" }, Name: "_MedidasGeral.Faturamento" }],
        [
          { Name: "_", Entity: "_MedidasGeral", Type: 0 },
          { Name: "s", Entity: "dServiços", Type: 0 },
          { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 },
        ],
        [
          { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "s" } }, Property: "Serviço" } }], Values: [[{ Literal: { Value: `'${servico}'` } }]] } } },
          { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: "2026L" } }]] } } },
          { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Mês" } }], Values: [[{ Literal: { Value: `'${mesName}'` } }]] } } },
        ]
      );
      const val = extractScalar(r);
      results[mesName][servico] = val !== null ? Number(val) : 0;
      console.log(`  ${mesName} / ${servico}: ${val}`);
    }
  }

  writeFileSync(join(OUTPUT, "service_monthly.json"), JSON.stringify(results, null, 2));
  console.log(`\nSaved to ${join(OUTPUT, "service_monthly.json")}`);
}

main().catch(console.error);
