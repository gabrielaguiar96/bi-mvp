/**
 * Query the Power BI API directly for the 2 missing measures.
 * Uses captured request format to construct custom DAX-like queries.
 */

import { chromium, type Request, type Response } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const PBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTQ1YTc3YjItMmZjZS00MGQ1LTk5MmQtY2FlZDkwYjUxNjNjIiwidCI6ImJiNDZiYjk2LWFkZmQtNDkzMy05YjYxLTRkYTM0ZGU5YTY1NSJ9";
const WABI = "wabi-brazil-south-b-primary-api.analysis.windows.net";
const OUTPUT = "/tmp/pbi_query_missing";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  mkdirSync(OUTPUT, { recursive: true });

  let capturedHeaders: Record<string, string> = {};
  let capturedUrl = "";
  let modelId = "";
  let sampleBody: any = null;

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
  const page = await ctx.newPage();

  // Capture the first querydata request fully
  page.on("request", (request: Request) => {
    const url = request.url();
    if (url.includes(WABI) && url.includes("querydata") && !capturedUrl) {
      capturedUrl = url;
      capturedHeaders = request.headers();
      const postData = request.postData();
      if (postData) {
        try { sampleBody = JSON.parse(postData); } catch {}
      }
    }
  });

  console.log("Loading report...");
  await page.goto(PBI_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(15000);
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});

  if (!capturedUrl || !sampleBody) {
    console.error("Failed to capture request details");
    await browser.close();
    return;
  }

  modelId = sampleBody.modelId;
  console.log(`Captured URL: ${capturedUrl}`);
  console.log(`Model ID: ${modelId}`);
  console.log(`Headers: ${Object.keys(capturedHeaders).length}`);

  // Build replay headers (minimal set)
  const replayHeaders: Record<string, string> = {
    "accept": capturedHeaders.accept || "application/json",
    "content-type": "application/json",
    "origin": "https://app.powerbi.com",
    "referer": "https://app.powerbi.com/",
    "user-agent": capturedHeaders["user-agent"],
  };
  if (capturedHeaders["x-powerbi-resourcekey"]) {
    replayHeaders["x-powerbi-resourcekey"] = capturedHeaders["x-powerbi-resourcekey"];
  }

  // Helper to make a querydata request
  async function queryData(selectClauses: any[], fromClauses: any[], whereClauses: any[] = []) {
    const body = {
      version: sampleBody.version,
      queries: [{
        Query: {
          Commands: [{
            SemanticQueryDataShapeCommand: {
              Query: {
                Version: 2,
                From: fromClauses,
                Select: selectClauses,
                Where: whereClauses,
              }
            }
          }],
        },
        CacheKey: "",
        QueryId: Math.random().toString(36).substring(2),
        ApplicationContext: sampleBody.queries[0]?.ApplicationContext || {},
      }],
      cancelQueries: [],
      modelId: modelId,
    };

    const response = await fetch(capturedUrl, {
      method: "POST",
      headers: replayHeaders,
      body: JSON.stringify(body),
    });

    return response.json();
  }

  // Query 1: _MedidasFernando.Ticket Médio Serviço Selecionado
  console.log("\n=== Query 1: Ticket Médio Serviço Selecionado ===");
  try {
    const r1 = await queryData(
      [{
        Measure: {
          Expression: { SourceRef: { Source: "f" } },
          Property: "Ticket Médio Serviço Selecionado"
        },
        Name: "_MedidasFernando.Ticket Médio Serviço Selecionado"
      }],
      [{ Name: "f", Entity: "_MedidasFernando", Type: 0 }]
    );

    if (r1.results) {
      const dsr = r1.results[0]?.result?.data?.dsr;
      if (dsr) {
        console.log("✓ Got DSR response!");
        console.log(JSON.stringify(dsr, null, 2).substring(0, 1000));
        writeFileSync(join(OUTPUT, "query1_ticket_medio_servico.json"), JSON.stringify(r1, null, 2));
      }
    }
    if (r1.error) {
      console.log("✗ Error:", r1.error.message || JSON.stringify(r1.error));
    }
  } catch (e: any) {
    console.log("✗ Request failed:", e.message);
  }

  // Query 2: _MedidasGeral.Meta Leads Canal
  console.log("\n=== Query 2: Meta Leads Canal ===");
  try {
    const r2 = await queryData(
      [{
        Measure: {
          Expression: { SourceRef: { Source: "_" } },
          Property: "Meta Leads Canal"
        },
        Name: "_MedidasGeral.Meta Leads Canal"
      }],
      [{ Name: "_", Entity: "_MedidasGeral", Type: 0 }]
    );

    if (r2.results) {
      const dsr = r2.results[0]?.result?.data?.dsr;
      if (dsr) {
        console.log("✓ Got DSR response!");
        console.log(JSON.stringify(dsr, null, 2).substring(0, 1000));
        writeFileSync(join(OUTPUT, "query2_meta_leads_canal.json"), JSON.stringify(r2, null, 2));
      }
    }
    if (r2.error) {
      console.log("✗ Error:", r2.error.message || JSON.stringify(r2.error));
    }
  } catch (e: any) {
    console.log("✗ Request failed:", e.message);
  }

  // Query 3: Meta Leads Canal by Canal Leads
  console.log("\n=== Query 3: Meta Leads Canal by Canal ===");
  try {
    const r3 = await queryData(
      [{
        Measure: {
          Expression: { SourceRef: { Source: "_" } },
          Property: "Meta Leads Canal"
        },
        Name: "_MedidasGeral.Meta Leads Canal"
      }],
      [
        { Name: "_", Entity: "_MedidasGeral", Type: 0 },
        { Name: "t", Entity: "Tabela_Parametros", Type: 0 },
      ],
      [{
        Condition: {
          In: {
            Expressions: [{
              Column: {
                Expression: { SourceRef: { Source: "t" } },
                Property: "Canal Leads"
              }
            }],
            Values: [[{ Literal: { Value: "'Retenção'" } }]]
          }
        }
      }]
    );

    if (r3.results) {
      const dsr = r3.results[0]?.result?.data?.dsr;
      if (dsr) {
        console.log("✓ Got DSR response!");
        console.log(JSON.stringify(dsr, null, 2).substring(0, 1000));
        writeFileSync(join(OUTPUT, "query3_meta_leads_canal_by_canal.json"), JSON.stringify(r3, null, 2));
      }
    }
    if (r3.error) {
      console.log("✗ Error:", r3.error.message || JSON.stringify(r3.error));
    }
  } catch (e: any) {
    console.log("✗ Request failed:", e.message);
  }

  // Query 4: Ticket Médio Serviço with service dimension
  console.log("\n=== Query 4: Ticket Médio Serviço by Serviço ===");
  try {
    const r4 = await queryData(
      [{
        Measure: {
          Expression: { SourceRef: { Source: "f" } },
          Property: "Ticket Médio Serviço Selecionado"
        },
        Name: "_MedidasFernando.Ticket Médio Serviço Selecionado"
      }],
      [
        { Name: "f", Entity: "_MedidasFernando", Type: 0 },
        { Name: "s", Entity: "dServiços", Type: 0 },
      ]
    );

    if (r4.results) {
      const dsr = r4.results[0]?.result?.data?.dsr;
      if (dsr) {
        console.log("✓ Got DSR response!");
        console.log(JSON.stringify(dsr, null, 2).substring(0, 1000));
        writeFileSync(join(OUTPUT, "query4_ticket_medio_by_servico.json"), JSON.stringify(r4, null, 2));
      }
    }
    if (r4.error) {
      console.log("✗ Error:", r4.error.message || JSON.stringify(r4.error));
    }
  } catch (e: any) {
    console.log("✗ Request failed:", e.message);
  }

  // Query 5: ALL measures from _MedidasFernando table
  console.log("\n=== Query 5: All _MedidasFernando measures ===");
  try {
    const r5 = await queryData(
      [{
        Measure: {
          Expression: { SourceRef: { Source: "f" } },
          Property: "Ticket Médio Serviço Selecionado"
        },
        Name: "_MedidasFernando.Ticket Médio Serviço Selecionado"
      },
      {
        Measure: {
          Expression: { SourceRef: { Source: "f" } },
          Property: "Ticket Médio Canal"
        },
        Name: "_MedidasFernando.Ticket Médio Canal"
      },
      {
        Measure: {
          Expression: { SourceRef: { Source: "f" } },
          Property: "Ticket Médio Dr Fernando Selecionado"
        },
        Name: "_MedidasFernando.Ticket Médio Dr Fernando Selecionado"
      }],
      [
        { Name: "f", Entity: "_MedidasFernando", Type: 0 },
        { Name: "s", Entity: "dServiços", Type: 0 },
      ]
    );

    if (r5.results) {
      const dsr = r5.results[0]?.result?.data?.dsr;
      if (dsr) {
        console.log("✓ Got DSR response!");
        console.log(JSON.stringify(dsr, null, 2).substring(0, 2000));
        writeFileSync(join(OUTPUT, "query5_fernando_multi.json"), JSON.stringify(r5, null, 2));
      }
    }
    if (r5.error) {
      console.log("✗ Error:", r5.error.message || JSON.stringify(r5.error));
    }
  } catch (e: any) {
    console.log("✗ Request failed:", e.message);
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch(console.error);
