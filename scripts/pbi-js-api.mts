/**
 * Use the Power BI JavaScript API from within the embedded report
 * to enumerate ALL pages (including hidden) and export data from each visual.
 *
 * The report frame has `window.powerbi` available.
 */

import { chromium, type Response } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const PBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTQ1YTc3YjItMmZjZS00MGQ1LTk5MmQtY2FlZDkwYjUxNjNjIiwidCI6ImJiNDZiYjk2LWFkZmQtNDkzMy05YjYxLTRkYTM0ZGU5YTY1NSJ9";
const WABI = "wabi-brazil-south-b-primary-api.analysis.windows.net";
const OUTPUT = "/tmp/pbi_js_api";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  mkdirSync(join(OUTPUT, "raw"), { recursive: true });

  const captured: Array<{ url: string; body: string; pageName: string }> = [];
  const seenBodies = new Set<string>();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
  const page = await ctx.newPage();

  page.on("response", async (response: Response) => {
    const url = response.url();
    if (!url.includes(WABI) || !url.includes("querydata")) return;
    try {
      const body = await response.text();
      const hash = body.substring(0, 500);
      if (seenBodies.has(hash)) return;
      seenBodies.add(hash);
      captured.push({ url, body, pageName: "unknown" });
    } catch {}
  });

  console.log("Loading report...");
  await page.goto(PBI_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(15000);
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});

  // Access Power BI JS API from within the frame
  console.log("\n=== Accessing Power BI JS API ===");

  const result = await page.evaluate(async () => {
    const w = window as any;
    const powerbi = w.powerbi;
    if (!powerbi) return { error: "powerbi not found" };

    const results: any = { pages: [] };

    try {
      // Method 1: Try to find the report via powerbi.embeds
      let report = null;

      // Check if there's a report in the embeds
      if (powerbi.embeds) {
        for (const embed of powerbi.embeds) {
          if (embed && (embed.getPages || embed.pages)) {
            report = embed;
            break;
          }
        }
      }

      // Method 2: Try powerbi.get() with the container
      if (!report) {
        const containers = document.querySelectorAll('[powerbi-embed], [data-powerbi-embed], .powerbi-frame');
        for (const container of containers) {
          try {
            const r = powerbi.get(container);
            if (r) { report = r; break; }
          } catch {}
        }
      }

      // Method 3: Try to find the report in the active embed
      if (!report && powerbi.active) {
        report = powerbi.active;
      }

      if (!report) {
        // Try to embed fresh
        const embedUrl = `https://app.powerbi.com/reportEmbed`;
        const reportId = "145a77b2-2fce-40d5-992d-caed90b5163j";

        // Look for existing iframe
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
          const src = iframe.src || iframe.getAttribute('src');
          if (src && src.includes('powerbi')) {
            try {
              report = powerbi.get(iframe);
              if (report) break;
            } catch {}
          }
        }
      }

      if (!report) return { error: "Could not find report embed", embedsCount: powerbi.embeds?.length || 0 };

      // Get pages
      let pages;
      if (report.getPages) {
        pages = await report.getPages();
      } else if (report.pages) {
        pages = report.pages;
      }

      if (!pages) return { error: "Could not get pages" };

      results.pageCount = pages.length;

      for (const p of pages) {
        const pageInfo: any = {
          name: p.name || p.displayName,
          isActive: p.isActive,
          visuals: [],
        };

        // Get visuals
        let visuals;
        if (p.getVisuals) {
          visuals = await p.getVisuals();
        } else if (p.visuals) {
          visuals = p.visuals;
        }

        if (visuals) {
          for (const v of visuals) {
            const visualInfo: any = {
              name: v.name,
              type: v.type || v.visualType,
              title: v.title,
            };

            // Try to export data
            try {
              if (v.exportData) {
                const exportResult = await v.exportData(0, 30000); // Summarized, 30k rows
                if (exportResult && exportResult.data) {
                  visualInfo.csvData = exportResult.data;
                  visualInfo.csvRows = exportResult.data.split('\n').length;
                }
              }
            } catch (e: any) {
              visualInfo.exportError = e.message;
            }

            // Try to get slicer state
            try {
              if (v.getSlicerState) {
                const slicerState = await v.getSlicerState();
                if (slicerState) {
                  visualInfo.slicerState = slicerState;
                }
              }
            } catch {}

            pageInfo.visuals.push(visualInfo);
          }
        }

        results.pages.push(pageInfo);
      }
    } catch (e: any) {
      return { error: e.message, stack: e.stack };
    }

    return results;
  });

  console.log("\n=== Power BI JS API Results ===");
  console.log(JSON.stringify(result, null, 2).substring(0, 5000));

  // If the JS API worked, save the exported data
  if (result.pages) {
    let totalVisuals = 0;
    let totalCsvExports = 0;

    for (const p of result.pages) {
      console.log(`\nPage "${p.name}": ${p.visuals?.length || 0} visuals`);
      for (const v of (p.visuals || [])) {
        totalVisuals++;
        if (v.csvData) {
          totalCsvExports++;
          // Save CSV data
          const safeName = `${p.name}_${v.name}`.replace(/[^a-zA-Z0-9]/g, '_');
          writeFileSync(join(OUTPUT, `${safeName}.csv`), v.csvData);
          console.log(`  ✓ ${v.name} (${v.type}): ${v.csvRows} rows`);
        } else if (v.exportError) {
          console.log(`  ✗ ${v.name} (${v.type}): ${v.exportError}`);
        } else {
          console.log(`  - ${v.name} (${v.type}): no data`);
        }
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Pages: ${result.pages.length}`);
    console.log(`Total visuals: ${totalVisuals}`);
    console.log(`CSV exports: ${totalCsvExports}`);
  }

  // Also try the direct approach: use page.evaluate to call the DAX API
  console.log("\n=== Trying direct DAX query via API ===");

  const daxResult = await page.evaluate(async () => {
    const w = window as any;
    const powerbi = w.powerbi;
    if (!powerbi) return { error: "no powerbi" };

    // Find the report
    let report = null;
    if (powerbi.embeds) {
      for (const embed of powerbi.embeds) {
        if (embed && embed.getPages) { report = embed; break; }
      }
    }

    if (!report) return { error: "no report" };

    // Try to use the internal API to execute a query
    // The report has an internal service that can execute DAX
    try {
      // @ts-ignore
      const service = report.service || report._service;
      if (service && service.executeDaxQuery) {
        const result = await service.executeDaxQuery({
          query: "EVALUATE ROW(\"Value\", 1+1)"
        });
        return { daxResult: result };
      }
    } catch (e: any) {
      return { daxError: e.message };
    }

    return { error: "could not execute DAX" };
  });

  console.log("DAX query result:", JSON.stringify(daxResult).substring(0, 500));

  await browser.close();

  // Save all captured responses
  for (let i = 0; i < captured.length; i++) {
    writeFileSync(join(OUTPUT, "raw", `response_${String(i + 1).padStart(4, "0")}.txt`), captured[i].body);
  }

  console.log(`\nTotal querydata captures: ${captured.length}`);
}

main().catch(console.error);
