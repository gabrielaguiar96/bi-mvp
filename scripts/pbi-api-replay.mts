/**
 * Capture full request details from Power BI, then replay them
 * to the querydata API to extract ALL data including hidden pages.
 *
 * Strategy:
 * 1. Open report in Playwright, intercept ALL request details (headers, body)
 * 2. Navigate to hidden page 8 (Duplicata de Metas) by injecting JS
 * 3. Capture the querydata POST requests with full headers
 * 4. Modify requests to query with different filter combinations
 * 5. Parse responses
 */

import { chromium, type Request, type Response } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const PBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTQ1YTc3YjItMmZjZS00MGQ1LTk5MmQtY2FlZDkwYjUxNjNjIiwidCI6ImJiNDZiYjk2LWFkZmQtNDkzMy05YjYxLTRkYTM0ZGU5YTY1NSJ9";
const WABI = "wabi-brazil-south-b-primary-api.analysis.windows.net";
const OUTPUT = "/tmp/pbi_api_replay";

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData: string | null;
  response: string;
  responseStatus: number;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  mkdirSync(join(OUTPUT, "raw"), { recursive: true });
  mkdirSync(join(OUTPUT, "replayed"), { recursive: true });

  const captured: CapturedRequest[] = [];
  const requestHeaders: Record<string, string> = {};

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
  const page = await ctx.newPage();

  // Capture full request details for querydata
  page.on("request", (request: Request) => {
    const url = request.url();
    if (url.includes(WABI) && url.includes("querydata")) {
      const headers = request.headers();
      // Store headers for replay
      Object.assign(requestHeaders, headers);
    }
  });

  page.on("response", async (response: Response) => {
    const url = response.url();
    if (!url.includes(WABI) || !url.includes("querydata")) return;
    try {
      const request = response.request();
      const body = await response.text();
      const postData = request.postData();

      captured.push({
        url,
        method: request.method(),
        headers: request.headers(),
        postData,
        response: body,
        responseStatus: response.status(),
      });

      console.log(`  Captured #${captured.length}: ${url.substring(0, 80)}`);
    } catch {}
  });

  console.log("Loading report...");
  await page.goto(PBI_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(12000);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  // Navigate through all visible pages
  console.log("\nNavigating visible pages...");
  for (let i = 0; i < 8; i++) {
    await page.evaluate((idx) => {
      const tabs = document.querySelectorAll('[role="tab"]');
      if (tabs[idx]) (tabs[idx] as HTMLElement).click();
    }, i);
    await sleep(3000);
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    console.log(`  Page ${i}: ${captured.length} total captures`);
  }

  // Now try to navigate to hidden page 8 via Power BI JavaScript API
  console.log("\nTrying to access hidden page 8 via Power BI JS API...");

  // The Power BI report is embedded — try to access it via the global powerbi object
  const hiddenPageResult = await page.evaluate(() => {
    // Try to find the Power BI embed instance
    const powerbi = (window as any).powerbi;
    if (!powerbi) return { error: "powerbi not found on window" };

    try {
      // Get all embeds
      const embeds = powerbi.embeds || [];
      if (embeds.length === 0) return { error: "no embeds found" };

      // Try to get the report
      const report = embeds[0];
      if (!report) return { error: "no report embed" };

      // Try to get pages
      return report.getPages?.() || { error: "getPages not available" };
    } catch (e: any) {
      return { error: e.message };
    }
  });
  console.log("Power BI JS API result:", JSON.stringify(hiddenPageResult).substring(0, 200));

  // Try alternative: find the report iframe and access its content
  console.log("\nTrying iframe approach...");
  const frames = page.frames();
  console.log(`Found ${frames.length} frames`);

  for (const frame of frames) {
    const frameUrl = frame.url();
    console.log(`  Frame: ${frameUrl.substring(0, 100)}`);

    // Try to access Power BI API from within the frame
    const frameResult = await frame.evaluate(() => {
      const w = window as any;
      if (w.powerbi) return "has powerbi";
      if (w.__powerbi) return "has __powerbi";
      if (w.report) return "has report";
      // Check for React internals
      const root = document.getElementById('pvExplorationHost') || document.getElementById('container');
      if (root) {
        const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
        if (fiberKey) return "has react fiber: " + fiberKey;
      }
      return "nothing found";
    }).catch(() => "frame error");
    console.log(`    Result: ${frameResult}`);
  }

  // Try to call the querydata API directly using captured headers
  console.log("\n=== Direct API Replay ===");
  console.log(`Captured ${captured.length} requests`);
  console.log(`Request headers captured: ${Object.keys(requestHeaders).length}`);

  // Save captured request details
  const captureDetails = captured.map((c, i) => ({
    index: i,
    url: c.url,
    method: c.method,
    postDataLength: c.postData?.length || 0,
    responseLength: c.response.length,
    status: c.responseStatus,
  }));
  writeFileSync(join(OUTPUT, "capture_details.json"), JSON.stringify(captureDetails, null, 2));

  // Save first request's headers for replay
  if (captured.length > 0) {
    writeFileSync(join(OUTPUT, "request_headers.json"), JSON.stringify(requestHeaders, null, 2));

    // Save first POST body for analysis
    const firstWithBody = captured.find(c => c.postData);
    if (firstWithBody) {
      writeFileSync(join(OUTPUT, "sample_post_body.json"), firstWithBody.postData!);
    }
  }

  // Try to replay a querydata request directly
  if (captured.length > 0 && captured[0].postData) {
    console.log("\nReplaying querydata request...");
    const sampleReq = captured[0];

    // Extract the key headers
    const replayHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    // Copy important headers
    for (const key of ["authorization", "x-powerbi-hosturl", "x-powerbi-embedurl",
      "x-powerbi-reportid", "x-powerbi-sessionid", "activityid", "requestid"]) {
      if (requestHeaders[key]) {
        replayHeaders[key] = requestHeaders[key];
      }
    }

    console.log("Replay headers:", Object.keys(replayHeaders).join(", "));

    // Make the request directly from Node
    try {
      const response = await fetch(sampleReq.url, {
        method: "POST",
        headers: replayHeaders,
        body: sampleReq.postData!,
      });

      const responseBody = await response.text();
      console.log(`Replay response: ${response.status}, ${responseBody.length} bytes`);

      writeFileSync(join(OUTPUT, "replayed_response.json"), responseBody);

      // Check if it worked
      try {
        const parsed = JSON.parse(responseBody);
        if (parsed.results) {
          console.log("✓ Replay successful! Got results.");
        } else if (parsed.error) {
          console.log("✗ Replay error:", parsed.error.message || parsed.error);
        }
      } catch {
        console.log("Response not JSON:", responseBody.substring(0, 200));
      }
    } catch (e: any) {
      console.log("Replay failed:", e.message);
    }
  }

  // Try modifying a request to target hidden page
  console.log("\n=== Trying to query hidden page data ===");

  // Look at the structure of captured request bodies to understand the query format
  for (const cap of captured.slice(0, 3)) {
    if (!cap.postData) continue;
    try {
      const body = JSON.parse(cap.postData);
      console.log("\nRequest body structure:");
      console.log("  Keys:", Object.keys(body));
      if (body.queries) {
        console.log("  Queries:", body.queries.length);
        if (body.queries[0]) {
          console.log("  Query[0] keys:", Object.keys(body.queries[0]));
          if (body.queries[0].Query) {
            console.log("  Query[0].Query:", JSON.stringify(body.queries[0].Query).substring(0, 200));
          }
        }
      }
      if (body.datasets) {
        console.log("  Datasets:", body.datasets.length);
      }
    } catch {}
  }

  await browser.close();

  // Save all captured responses
  for (let i = 0; i < captured.length; i++) {
    writeFileSync(join(OUTPUT, "raw", `response_${String(i + 1).padStart(4, "0")}.txt`), captured[i].response);
    if (captured[i].postData) {
      writeFileSync(join(OUTPUT, "raw", `request_${String(i + 1).padStart(4, "0")}.json`), captured[i].postData!);
    }
  }

  console.log("\n=== Done ===");
  console.log(`Total captured: ${captured.length}`);
  console.log(`Output: ${OUTPUT}`);
}

main().catch(console.error);
