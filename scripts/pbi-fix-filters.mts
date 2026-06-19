/**
 * Fix filter syntax and query with correct date/année format.
 * Power BI requires "2026L" for years and "'maio'" for months.
 */

import { chromium, type Request } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const PBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTQ1YTc3YjItMmZjZS00MGQ1LTk5MmQtY2FlZDkwYjUxNjNjIiwidCI6ImJiNDZiYjk2LWFkZmQtNDkzMy05YjYxLTRkYTM0ZGU5YTY1NSJ9";
const WABI = "wabi-brazil-south-b-primary-api.analysis.windows.net";
const OUTPUT = "/tmp/pbi_fix_filters";

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

  const results: any[] = [];

  // Query with correct year format
  const yearMeasures = [
    { source: "_", entity: "_MedidasGeral", property: "Faturamento", name: "Faturamento" },
    { source: "_", entity: "_MedidasGeral", property: "Faturamento LM", name: "Faturamento LM" },
    { source: "_", entity: "_MedidasGeral", property: "% Meta Total", name: "% Meta Total" },
    { source: "_", entity: "_MedidasGeral", property: "Ocupação Agenda", name: "Ocupação Agenda" },
    { source: "_", entity: "_MedidasGeral", property: "Comparecidos_Consultas", name: "Comparecidos" },
    { source: "_", entity: "_MedidasGeral", property: "Leads_Selecionados", name: "Leads" },
  ];

  const MES_NAMES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  console.log("\n=== Querying by year (correct format) ===");
  for (const ano of ["2025", "2026"]) {
    for (const m of yearMeasures) {
      const r = await query(
        [{ Measure: { Expression: { SourceRef: { Source: m.source } }, Property: m.property }, Name: `${m.entity}.${m.property}` }],
        [{ Name: m.source, Entity: m.entity, Type: 0 }, { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 }],
        [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: `${ano}L` } }]] } } }]
      );
      const val = extractScalar(r);
      results.push({ filter: `ano=${ano}`, measure: m.name, value: val });
      console.log(`  ${m.name} (${ano}): ${val}`);
    }
  }

  console.log("\n=== Querying by month (correct format) ===");
  for (let mes = 0; mes < 6; mes++) {
    const mesName = MES_NAMES[mes];
    const r = await query(
      [{ Measure: { Expression: { SourceRef: { Source: "_" } }, Property: "Faturamento" }, Name: "_MedidasGeral.Faturamento" }],
      [{ Name: "_", Entity: "_MedidasGeral", Type: 0 }, { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 }],
      [
        { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: "2026L" } }]] } } },
        { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Mês" } }], Values: [[{ Literal: { Value: `'${mesName}'` } }]] } } }
      ]
    );
    const val = extractScalar(r);
    results.push({ filter: `mes=${mesName}`, measure: "Faturamento", value: val });
    console.log(`  Faturamento ${mesName}: ${val}`);
  }

  console.log("\n=== Querying by canal + year ===");
  const canais = ["Retenção", "Ativo", "Orgânico", "Indicação", "Crossell", "Pago"];
  for (const canal of canais) {
    const r = await query(
      [{ Measure: { Expression: { SourceRef: { Source: "_" } }, Property: "Faturamento canal" }, Name: "_MedidasGeral.Faturamento canal" }],
      [{ Name: "_", Entity: "_MedidasGeral", Type: 0 }, { Name: "t", Entity: "Tabela_Parametros", Type: 0 }, { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 }],
      [
        { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "t" } }, Property: "Canal Leads" } }], Values: [[{ Literal: { Value: `'${canal}'` } }]] } } },
        { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: "2026L" } }]] } } }
      ]
    );
    const val = extractScalar(r);
    results.push({ filter: `canal=${canal},ano=2026`, measure: "Faturamento", value: val });
    console.log(`  ${canal} 2026: R$ ${Number(val || 0).toLocaleString('pt-BR')}`);
  }

  writeFileSync(join(OUTPUT, "results.json"), JSON.stringify(results, null, 2));
  console.log(`\nSaved ${results.length} results`);
}

main().catch(console.error);
