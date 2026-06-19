/**
 * Extract all main KPIs by month for 2025 (and verify 2026).
 * Extends pbi-extract-monthly.mts to cover the full 2025 year.
 *
 * Usage: npx tsx scripts/pbi-extract-2025-monthly.mts
 */

import { chromium, type Request } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const PBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTQ1YTc3YjItMmZjZS00MGQ1LTk5MmQtY2FlZDkwYjUxNjNjIiwidCI6ImJiNDZiYjk2LWFkZmQtNDkzMy05YjYxLTRkYTM0ZGU5YTY1NSJ9";
const WABI = "wabi-brazil-south-b-primary-api.analysis.windows.net";
const OUTPUT = "/tmp/pbi_2025_monthly";

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

  const ALL_MONTHS = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];

  // Measures to query by month
  const monthMeasures = [
    { entity: "_MedidasGeral", property: "Faturamento", name: "faturamento" },
    { entity: "_MedidasGeral", property: "Faturamento LM", name: "faturamentoLM" },
    { entity: "_MedidasGeral", property: "Leads_Selecionados", name: "leads" },
    { entity: "_MedidasGeral", property: "Ocupação Agenda", name: "ocupacaoAgenda" },
    { entity: "_MedidasGeral", property: "Comparecidos_Consultas", name: "comparecidos" },
    { entity: "_MedidasGeral", property: "Qtd Upsell", name: "qtdUpsell" },
    { entity: "_MedidasGeral", property: "Ticket Medio Consultas", name: "ticketMedio" },
    { entity: "_MedidasGeral", property: "% Meta Total", name: "pctMeta" },
    { entity: "_MedidasGeral", property: "Marcados Selecionados", name: "marcados" },
  ];

  const results: Record<string, Record<string, any>> = {};

  // Query all months for both years
  for (const ano of ["2025", "2026"]) {
    console.log(`\n=== Querying KPIs by month for ${ano} ===`);

    for (const mesName of ALL_MONTHS) {
      const key = `${ano}_${mesName}`;
      results[key] = { ano, mes: mesName };

      for (const m of monthMeasures) {
        const r = await query(
          [{ Measure: { Expression: { SourceRef: { Source: "_" } }, Property: m.property }, Name: `${m.entity}.${m.property}` }],
          [{ Name: "_", Entity: m.entity, Type: 0 }, { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 }],
          [
            { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: `${ano}L` } }]] } } },
            { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Mês" } }], Values: [[{ Literal: { Value: `'${mesName}'` } }]] } } }
          ]
        );
        const val = extractScalar(r);
        results[key][m.name] = val;
      }
      console.log(`  ${ano} ${mesName}: fat=${results[key].faturamento}, leads=${results[key].leads}, meta=${results[key].pctMeta}`);
    }
  }

  // Query faturamento por canal by month (both years)
  const canais = ["Retenção", "Ativo", "Orgânico", "Indicação", "Crossell", "Pago"];
  for (const ano of ["2025", "2026"]) {
    console.log(`\n=== Querying faturamento por canal for ${ano} ===`);
    for (const mesName of ALL_MONTHS) {
      const key = `${ano}_${mesName}`;
      results[key].faturamentoPorCanal = {};

      for (const canal of canais) {
        const r = await query(
          [{ Measure: { Expression: { SourceRef: { Source: "_" } }, Property: "Faturamento canal" }, Name: "_MedidasGeral.Faturamento canal" }],
          [{ Name: "_", Entity: "_MedidasGeral", Type: 0 }, { Name: "t", Entity: "Tabela_Parametros", Type: 0 }, { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 }],
          [
            { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "t" } }, Property: "Canal Leads" } }], Values: [[{ Literal: { Value: `'${canal}'` } }]] } } },
            { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: `${ano}L` } }]] } } },
            { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Mês" } }], Values: [[{ Literal: { Value: `'${mesName}'` } }]] } } }
          ]
        );
        const val = extractScalar(r);
        results[key].faturamentoPorCanal[canal] = val;
      }
      console.log(`  ${ano} ${mesName}: ${Object.entries(results[key].faturamentoPorCanal).map(([c, v]) => `${c}=${v}`).join(', ')}`);
    }
  }

  // Query faturamento por serviço by month (both years)
  const servicos = ["Nutrologia", "Pediatria", "Dermatologia"];
  for (const ano of ["2025", "2026"]) {
    console.log(`\n=== Querying faturamento por serviço for ${ano} ===`);
    for (const mesName of ALL_MONTHS) {
      const key = `${ano}_${mesName}`;
      results[key].faturamentoPorServico = {};

      for (const servico of servicos) {
        const r = await query(
          [{ Measure: { Expression: { SourceRef: { Source: "f" } }, Property: "Faturamento" }, Name: "_MedidasFernando.Faturamento" }],
          [{ Name: "f", Entity: "_MedidasFernando", Type: 0 }, { Name: "s", Entity: "dServiços", Type: 0 }, { Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 }],
          [
            { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "s" } }, Property: "Serviço" } }], Values: [[{ Literal: { Value: `'${servico}'` } }]] } } },
            { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }], Values: [[{ Literal: { Value: `${ano}L` } }]] } } },
            { Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Mês" } }], Values: [[{ Literal: { Value: `'${mesName}'` } }]] } } }
          ]
        );
        const val = extractScalar(r);
        results[key].faturamentoPorServico[servico] = val;
      }
    }
  }

  // Also query faturamento meta by month for both years (for the meta progress bars)
  console.log(`\n=== Querying meta by month ===`);
  for (const ano of ["2025", "2026"]) {
    for (const mesName of ALL_MONTHS) {
      const key = `${ano}_${mesName}`;
      // Meta = faturamento / pctMeta (we can calculate from existing data)
      const fat = results[key].faturamento as number;
      const pct = results[key].pctMeta as number;
      results[key].metaCalculada = (fat && pct && pct > 0) ? Math.round(fat / pct) : null;
    }
  }

  writeFileSync(join(OUTPUT, "monthly_data_all.json"), JSON.stringify(results, null, 2));
  console.log(`\nSaved to ${join(OUTPUT, "monthly_data_all.json")}`);

  // Summary
  console.log("\n=== Summary ===");
  for (const ano of ["2025", "2026"]) {
    const monthsWithData = ALL_MONTHS.filter(m => {
      const key = `${ano}_${m}`;
      return results[key]?.faturamento != null && results[key]?.faturamento !== 0;
    });
    console.log(`${ano}: ${monthsWithData.length} months with data: ${monthsWithData.join(', ')}`);
  }
}

main().catch(console.error);
