/**
 * Extract missing data: all services + 2025 channels + Google/Meta channels
 */

import { chromium, type Request } from "playwright";

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

  // 1. Service faturamento per service per year
  console.log("\n=== Service faturamento per year ===");
  const servicos = ["Nutrologia", "Pediatria", "Dermatologia", "By Evuli", "Cirurgia Plástica", "Evuli Dietas", "Nutrologia 2", "Suplementação"];
  for (const ano of ["2025", "2026"]) {
    for (const servico of servicos) {
      const r = await query(
        [{ Measure: { Expression: { SourceRef: { Source: "f" } }, Property: "Faturamento" }, Name: "_MedidasFernando.Faturamento" }],
        [
          { Name: "f", Entity: "_MedidasFernando", Type: 0 },
          { Name: "s", Entity: "dServiços", Type: 0 },
          { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 },
        ],
        [
          { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "s" } }, Property: "Serviço" } }], Values: [[{ Literal: { Value: `'${servico}'` } }]] } } },
          { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: `${ano}L` } }]] } } }
        ]
      );
      const val = extractScalar(r);
      console.log(`  ${servico} ${ano}: ${val}`);
    }
  }

  // 2. Channel faturamento for all channels + years
  console.log("\n=== Channel faturamento (all channels) ===");
  const canais = ["Retenção", "Ativo", "Orgânico", "Indicação", "Crossell", "Pago", "Google", "Meta"];
  for (const ano of ["2025", "2026"]) {
    for (const canal of canais) {
      const r = await query(
        [{ Measure: { Expression: { SourceRef: { Source: "_" } }, Property: "Faturamento canal" }, Name: "_MedidasGeral.Faturamento canal" }],
        [
          { Name: "_", Entity: "_MedidasGeral", Type: 0 },
          { Name: "t", Entity: "Tabela_Parametros", Type: 0 },
          { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 },
        ],
        [
          { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "t" } }, Property: "Canal Leads" } }], Values: [[{ Literal: { Value: `'${canal}'` } }]] } } },
          { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: `${ano}L` } }]] } } }
        ]
      );
      const val = extractScalar(r);
      console.log(`  ${canal} ${ano}: ${val}`);
    }
  }

  // 3. Test: 2025 monthly canal (janeiro)
  console.log("\n=== 2025 monthly canal (janeiro) ===");
  const testCanais = ["Retenção", "Ativo", "Orgânico", "Indicação", "Crossell", "Pago"];
  for (const canal of testCanais) {
    const r = await query(
      [{ Measure: { Expression: { SourceRef: { Source: "_" } }, Property: "Faturamento canal" }, Name: "_MedidasGeral.Faturamento canal" }],
      [
        { Name: "_", Entity: "_MedidasGeral", Type: 0 },
        { Name: "t", Entity: "Tabela_Parametros", Type: 0 },
        { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 },
      ],
      [
        { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "t" } }, Property: "Canal Leads" } }], Values: [[{ Literal: { Value: `'${canal}'` } }]] } } },
        { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: "2025L" } }]] } } },
        { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Mês" } }], Values: [[{ Literal: { Value: "'janeiro'" } }]] } } }
      ]
    );
    const val = extractScalar(r);
    console.log(`  ${canal} jan/2025: ${val}`);
  }
}

main().catch(console.error);
