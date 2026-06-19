/**
 * Extract missing data gaps from Power BI:
 * 1. All services (not just the 3 tracked)
 * 2. 2025 channel breakdown
 * 3. Verify faturamentoPorServico is YTD or monthly
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
              if (row.C) rows.push(row.C);
            }
          }
        }
      }
      return rows;
    } catch { return []; }
  }

  const results: Record<string, any> = {};

  // 1. Query ALL services faturamento (no service filter = all services)
  console.log("\n=== 1. All services faturamento (2026 YTD) ===");
  const rAllServ = await query(
    [{ Measure: { Expression: { SourceRef: { Source: "f" } }, Property: "Faturamento" }, Name: "_MedidasFernando.Faturamento" }],
    [{ Name: "f", Entity: "_MedidasFernando", Type: 0 }, { Name: "s", Entity: "dServiços", Type: 0 }],
    []
  );
  const allServRows = extractRows(rAllServ);
  console.log("All services rows:", allServRows);
  results.allServices2026 = allServRows;

  // 2. Query faturamento by service dimension (get all services with their values)
  console.log("\n=== 2. Faturamento by service (with dimension) ===");
  const rServDim = await query(
    [
      { Measure: { Expression: { SourceRef: { Source: "f" } }, Property: "Faturamento" }, Name: "_MedidasFernando.Faturamento" },
    ],
    [{ Name: "f", Entity: "_MedidasFernando", Type: 0 }, { Name: "s", Entity: "dServiços", Type: 0 }],
    []
  );
  // Try with service as dimension
  const rServDim2 = await query(
    [
      { Column: { Expression: { SourceRef: { Source: "s" } }, Property: "Serviço" }, Name: "dServiços.Serviço" },
      { Measure: { Expression: { SourceRef: { Source: "f" } }, Property: "Faturamento" }, Name: "_MedidasFernando.Faturamento" },
    ],
    [{ Name: "f", Entity: "_MedidasFernando", Type: 0 }, { Name: "s", Entity: "dServiços", Type: 0 }],
    []
  );
  const servDimRows = extractRows(rServDim2);
  console.log("Service dimension rows:", servDimRows);
  results.serviceDimension = servDimRows;

  // 3. Query 2025 channel breakdown
  console.log("\n=== 3. 2025 channel breakdown ===");
  const canais = ["Retenção", "Ativo", "Orgânico", "Indicação", "Crossell", "Pago"];
  results.canal2025 = {};
  for (const canal of canais) {
    const r = await query(
      [{ Measure: { Expression: { SourceRef: { Source: "_" } }, Property: "Faturamento canal" }, Name: "_MedidasGeral.Faturamento canal" }],
      [{ Name: "_", Entity: "_MedidasGeral", Type: 0 }, { Name: "t", Entity: "Tabela_Parametros", Type: 0 }, { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 }],
      [
        { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "t" } }, Property: "Canal Leads" } }], Values: [[{ Literal: { Value: `'${canal}'` } }]] } } },
        { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: "2025L" } }]] } } }
      ]
    );
    const rows = extractRows(r);
    const val = rows.length > 0 ? rows[0][0] : null;
    results.canal2025[canal] = val;
    console.log(`  ${canal} 2025: ${val}`);
  }

  // 4. Verify faturamentoPorServico scope: query with and without year filter
  console.log("\n=== 4. Verify service faturamento scope ===");
  for (const ano of ["2025", "2026"]) {
    const r = await query(
      [
        { Column: { Expression: { SourceRef: { Source: "s" } }, Property: "Serviço" }, Name: "dServiços.Serviço" },
        { Measure: { Expression: { SourceRef: { Source: "f" } }, Property: "Faturamento" }, Name: "_MedidasFernando.Faturamento" },
      ],
      [{ Name: "f", Entity: "_MedidasFernando", Type: 0 }, { Name: "s", Entity: "dServiços", Type: 0 }, { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 }],
      [
        { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: `${ano}L` } }]] } } }
      ]
    );
    const rows = extractRows(r);
    console.log(`  ${ano} by service:`, rows);
    results[`serviceByYear_${ano}`] = rows;
  }

  // 5. Query all channels (including Google, Meta)
  console.log("\n=== 5. All channels faturamento (2026) ===");
  const allCanais = ["Ativo", "Crossell", "Google", "Indicação", "Meta", "Orgânico", "Pago", "Retenção"];
  results.allCanais2026 = {};
  for (const canal of allCanais) {
    const r = await query(
      [{ Measure: { Expression: { SourceRef: { Source: "_" } }, Property: "Faturamento canal" }, Name: "_MedidasGeral.Faturamento canal" }],
      [{ Name: "_", Entity: "_MedidasGeral", Type: 0 }, { Name: "t", Entity: "Tabela_Parametros", Type: 0 }, { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 }],
      [
        { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "t" } }, Property: "Canal Leads" } }], Values: [[{ Literal: { Value: `'${canal}'` } }]] } } },
        { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: "2026L" } }]] } } }
      ]
    );
    const rows = extractRows(r);
    const val = rows.length > 0 ? rows[0][0] : null;
    results.allCanais2026[canal] = val;
    console.log(`  ${canal} 2026: ${val}`);
  }

  writeFileSync("/tmp/pbi_gaps.json", JSON.stringify(results, null, 2));
  console.log("\nSaved to /tmp/pbi_gaps.json");
}

main().catch(console.error);
