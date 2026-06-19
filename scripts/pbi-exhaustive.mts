/**
 * Exhaustive Power BI data extraction via direct API replay.
 *
 * Queries ALL measures with ALL filter combinations:
 * - Years: 2025, 2026
 * - Months: Jan-Dec
 * - Channels: Ativo, Crossell, Google, Indicação, Meta, Orgânico, Pago, Retenção
 * - Services: Nutrologia, Pediatria, Dermatologia
 *
 * Uses the captured request format to construct custom queries.
 */

import { chromium, type Request } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const PBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTQ1YTc3YjItMmZjZS00MGQ1LTk5MmQtY2FlZDkwYjUxNjNjIiwidCI6ImJiNDZiYjk2LWFkZmQtNDkzMy05YjYxLTRkYTM0ZGU5YTY1NSJ9";
const WABI = "wabi-brazil-south-b-primary-api.analysis.windows.net";
const OUTPUT = "/tmp/pbi_exhaustive";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Key measures to query
const KEY_MEASURES = [
  { source: "_", entity: "_MedidasGeral", property: "Faturamento", name: "Faturamento" },
  { source: "_", entity: "_MedidasGeral", property: "Faturamento LM", name: "Faturamento LM" },
  { source: "_", entity: "_MedidasGeral", property: "% Meta Total", name: "% Meta Total" },
  { source: "_", entity: "_MedidasGeral", property: "Ocupação Agenda", name: "Ocupação Agenda" },
  { source: "_", entity: "_MedidasGeral", property: "Comparecidos_Consultas", name: "Comparecidos" },
  { source: "_", entity: "_MedidasGeral", property: "Qtd Upsell", name: "Qtd Upsell" },
  { source: "_", entity: "_MedidasGeral", property: "Ticket Medio Consultas", name: "Ticket Medio Consultas" },
  { source: "_", entity: "_MedidasGeral", property: "Leads_Selecionados", name: "Leads_Selecionados" },
  { source: "_", entity: "_MedidasGeral", property: "Marcados Selecionados", name: "Marcados" },
  { source: "_", entity: "_MedidasGeral", property: "Taxa de Conversão", name: "Taxa Conversão" },
  { source: "_", entity: "_MedidasGeral", property: "Faturamento canal", name: "Faturamento canal" },
  { source: "f", entity: "_MedidasFernando", property: "Ticket Médio Serviço Selecionado", name: "Ticket Medio Servico" },
  { source: "_", entity: "_MedidasGeral", property: "Meta Leads Canal", name: "Meta Leads Canal" },
  { source: "_", entity: "_MedidasGeral", property: "Conversão Upsell canal", name: "Conversão Upsell" },
  { source: "_", entity: "_MedidasGeral", property: "Pacientes ativos", name: "Pacientes ativos" },
  { source: "_", entity: "_MedidasGeral", property: "Pacientes aptos", name: "Pacientes aptos" },
  { source: "_", entity: "_MedidasGeral", property: "Pacientes que indicaram", name: "Pacientes indicaram" },
  { source: "_", entity: "_MedidasGeral", property: "Leads Indicação Nutrologia", name: "Leads Indicação" },
  { source: "_", entity: "_MedidasGeral", property: "Meta Pacientes Aptos", name: "Meta Pacientes Aptos" },
  { source: "_", entity: "_MedidasGeral", property: "Meta Leads Indicação", name: "Meta Leads Indicação" },
];

// Filter dimensions
const CANAIS = ["Ativo", "Crossell", "Google", "Indicação", "Meta", "Orgânico", "Pago", "Retenção"];
const SERVICOS = ["Nutrologia", "Pediatria", "Dermatologia"];
const ANOS = [2025, 2026];
const MESES = [1, 2, 3, 4, 5, 6];

interface ApiResult {
  filters: Record<string, string>;
  measure: string;
  value: unknown;
  raw?: unknown;
}

async function main() {
  mkdirSync(join(OUTPUT, "raw"), { recursive: true });

  let capturedUrl = "";
  let capturedHeaders: Record<string, string> = {};
  let sampleBody: any = null;

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
  const page = await ctx.newPage();

  page.on("request", (request: Request) => {
    const url = request.url();
    if (url.includes(WABI) && url.includes("querydata") && !capturedUrl) {
      capturedUrl = url;
      capturedHeaders = request.headers();
      const postData = request.postData();
      if (postData) try { sampleBody = JSON.parse(postData); } catch {}
    }
  });

  console.log("Loading report to capture API details...");
  await page.goto(PBI_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(15000);
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await browser.close();

  if (!capturedUrl || !sampleBody) {
    console.error("Failed to capture API details");
    return;
  }

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
  if (capturedHeaders["x-powerbi-resourcekey"]) {
    headers["x-powerbi-resourcekey"] = capturedHeaders["x-powerbi-resourcekey"];
  }

  // Build query function
  async function query(measures: typeof KEY_MEASURES, filters: Record<string, string[]> = {}) {
    const from: any[] = [];
    const select: any[] = [];
    const where: any[] = [];

    // Add measure sources
    const sources = new Set<string>();
    for (const m of measures) {
      if (!sources.has(m.source)) {
        from.push({ Name: m.source, Entity: m.entity, Type: 0 });
        sources.add(m.source);
      }
      select.push({
        Measure: {
          Expression: { SourceRef: { Source: m.source } },
          Property: m.property
        },
        Name: `${m.entity}.${m.property}`
      });
    }

    // Add filter dimensions
    if (filters.canal) {
      from.push({ Name: "t", Entity: "Tabela_Parametros", Type: 0 });
      where.push({
        Condition: {
          In: {
            Expressions: [{ Column: { Expression: { SourceRef: { Source: "t" } }, Property: "Canal Leads" } }],
            Values: filters.canal.map(c => [{ Literal: { Value: `'${c}'` } }])
          }
        }
      });
    }
    if (filters.servico) {
      from.push({ Name: "s", Entity: "dServiços", Type: 0 });
      where.push({
        Condition: {
          In: {
            Expressions: [{ Column: { Expression: { SourceRef: { Source: "s" } }, Property: "Serviço" } }],
            Values: filters.servico.map(s => [{ Literal: { Value: `'${s}'` } }])
          }
        }
      });
    }
    if (filters.ano) {
      from.push({ Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 });
      where.push({
        Condition: {
          In: {
            Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Ano" } }],
            Values: filters.ano.map(a => [{ Literal: { Value: `${a}` } }])
          }
        }
      });
    }
    if (filters.mes) {
      if (!from.some(f => f.Name === "l")) {
        from.push({ Name: "l", Entity: "LocalDateTable_44a31fe3-dfff-4cb2-8b37-9237320f84e9", Type: 0 });
      }
      where.push({
        Condition: {
          In: {
            Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: "Mês" } }],
            Values: filters.mes.map(m => [{ Literal: { Value: `${m}` } }])
          }
        }
      });
    }

    const body = {
      version,
      queries: [{
        Query: { Commands: [{ SemanticQueryDataShapeCommand: { Query: { Version: 2, From: from, Select: select, Where: where } } }] },
        CacheKey: "",
        QueryId: Math.random().toString(36).substring(2),
        ApplicationContext: appCtx,
      }],
      cancelQueries: [],
      modelId,
    };

    const response = await fetch(capturedUrl, { method: "POST", headers, body: JSON.stringify(body) });
    return response.json();
  }

  // Extract scalar value from DSR
  function extractScalar(r: any, measureIdx: number): unknown {
    try {
      const ds = r.results?.[0]?.result?.data?.dsr?.DS?.[0];
      if (!ds) return null;
      const key = `M${measureIdx}`;
      // Check PH
      for (const ph of (ds.PH || [])) {
        for (const dmArr of Object.values(ph)) {
          if (Array.isArray(dmArr)) {
            for (const row of dmArr) {
              if (row[key] !== undefined) return row[key];
              if (row.C && row.S) {
                const idx = row.S.findIndex((s: any) => s.N === key);
                if (idx >= 0 && row.C[idx] !== undefined) return row.C[idx];
              }
            }
          }
        }
      }
      return null;
    } catch { return null; }
  }

  // Extract rows from DSR
  function extractRows(r: any): any[] {
    try {
      const ds = r.results?.[0]?.result?.data?.dsr?.DS?.[0];
      if (!ds) return [];
      const rows: any[] = [];
      for (const ph of (ds.PH || [])) {
        for (const dmArr of Object.values(ph)) {
          if (Array.isArray(dmArr)) {
            let schema: any[] = [];
            for (const row of dmArr) {
              if (row.S) schema = row.S;
              if (row.C) {
                const obj: any = {};
                row.C.forEach((val: any, i: number) => {
                  if (schema[i]) obj[schema[i].N] = val;
                });
                rows.push(obj);
              }
            }
          }
        }
      }
      return rows;
    } catch { return []; }
  }

  const allResults: ApiResult[] = [];
  let totalQueries = 0;
  let successQueries = 0;

  // Phase 1: Default state (no filters)
  console.log("\n=== Phase 1: Default state (all measures) ===");
  for (const m of KEY_MEASURES) {
    totalQueries++;
    try {
      const r = await query([m]);
      const val = extractScalar(r, 0);
      allResults.push({ filters: {}, measure: m.name, value: val });
      successQueries++;
      if (totalQueries % 10 === 0) process.stdout.write(`  ${totalQueries} queries...\n`);
    } catch {}
  }
  console.log(`  Done: ${successQueries}/${totalQueries}`);

  // Phase 2: By canal
  console.log("\n=== Phase 2: Key measures by canal ===");
  const canalMeasures = KEY_MEASURES.filter(m =>
    ["Faturamento", "Faturamento canal", "Ticket Medio Consultas", "Leads_Selecionados", "Marcados", "Taxa Conversão", "Conversão Upsell", "Ticket Medio Servico", "Meta Leads Canal"].includes(m.name)
  );
  for (const canal of CANAIS) {
    for (const m of canalMeasures) {
      totalQueries++;
      try {
        const r = await query([m], { canal: [canal] });
        const val = extractScalar(r, 0);
        allResults.push({ filters: { canal }, measure: m.name, value: val });
        successQueries++;
      } catch {}
    }
    process.stdout.write(`  Canal "${canal}": done\n`);
  }

  // Phase 3: By service
  console.log("\n=== Phase 3: Key measures by service ===");
  const servicoMeasures = KEY_MEASURES.filter(m =>
    ["Faturamento", "Ticket Medio Consultas", "Leads_Selecionados", "Marcados", "Ticket Medio Servico"].includes(m.name)
  );
  for (const servico of SERVICOS) {
    for (const m of servicoMeasures) {
      totalQueries++;
      try {
        const r = await query([m], { servico: [servico] });
        const val = extractScalar(r, 0);
        allResults.push({ filters: { servico }, measure: m.name, value: val });
        successQueries++;
      } catch {}
    }
    process.stdout.write(`  Serviço "${servico}": done\n`);
  }

  // Phase 4: By year
  console.log("\n=== Phase 4: Key measures by year ===");
  const yearMeasures = KEY_MEASURES.filter(m =>
    ["Faturamento", "Faturamento LM", "% Meta Total", "Ocupação Agenda", "Comparecidos", "Leads_Selecionados"].includes(m.name)
  );
  for (const ano of ANOS) {
    for (const m of yearMeasures) {
      totalQueries++;
      try {
        const r = await query([m], { ano: [String(ano)] });
        const val = extractScalar(r, 0);
        allResults.push({ filters: { ano: String(ano) }, measure: m.name, value: val });
        successQueries++;
      } catch {}
    }
    process.stdout.write(`  Ano ${ano}: done\n`);
  }

  // Phase 5: Cross-filter: canal × year
  console.log("\n=== Phase 5: Faturamento by canal × year ===");
  for (const ano of ANOS) {
    for (const canal of CANAIS) {
      totalQueries++;
      try {
        const r = await query(
          [KEY_MEASURES.find(m => m.name === "Faturamento")!],
          { canal: [canal], ano: [String(ano)] }
        );
        const val = extractScalar(r, 0);
        allResults.push({ filters: { canal, ano: String(ano) }, measure: "Faturamento", value: val });
        successQueries++;
      } catch {}
    }
    process.stdout.write(`  Year ${ano}: done\n`);
  }

  // Save results
  writeFileSync(join(OUTPUT, "all_results.json"), JSON.stringify(allResults, null, 2));

  // Summary
  console.log(`\n=== Summary ===`);
  console.log(`Total queries: ${totalQueries}`);
  console.log(`Successful: ${successQueries}`);
  console.log(`Results: ${allResults.length}`);

  // Show new data
  const withValues = allResults.filter(r => r.value !== null && r.value !== undefined);
  console.log(`With values: ${withValues.length}`);

  // Show the 2 previously missing measures
  console.log("\nPreviously missing measures:");
  const ticketMedio = allResults.filter(r => r.measure === "Ticket Medio Servico");
  const metaLeads = allResults.filter(r => r.measure === "Meta Leads Canal");
  console.log(`  Ticket Médio Serviço: ${ticketMedio.map(r => `${JSON.stringify(r.filters)}=${r.value}`).join(', ')}`);
  console.log(`  Meta Leads Canal: ${metaLeads.map(r => `${JSON.stringify(r.filters)}=${r.value}`).join(', ')}`);
}

main().catch(console.error);
