/**
 * Click through page tabs by finding them in the DOM.
 * Power BI uses custom elements for tabs — try multiple selectors.
 */

import { chromium, type Response } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const PBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTQ1YTc3YjItMmZjZS00MGQ1LTk5MmQtY2FlZDkwYjUxNjNjIiwidCI6ImJiNDZiYjk2LWFkZmQtNDkzMy05YjYxLTRkYTM0ZGU5YTY1NSJ9";
const WABI = "wabi-brazil-south-b-primary-api.analysis.windows.net";
const OUTPUT = "/tmp/pbi_capture_tabs";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  mkdirSync(join(OUTPUT, "raw"), { recursive: true });

  const captured: Array<{ url: string; body: string; pageName: string }> = [];
  const seenHashes = new Set<string>();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
  const page = await ctx.newPage();

  page.on("response", async (response: Response) => {
    const url = response.url();
    if (!url.includes(WABI) || !url.includes("querydata")) return;
    try {
      const body = await response.text();
      const hash = body.substring(0, 300);
      if (seenHashes.has(hash)) return;
      seenHashes.add(hash);
      captured.push({ url, body, pageName: "unknown" });
    } catch {}
  });

  console.log("Loading report...");
  await page.goto(PBI_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(12000);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  // First, find all tab-like elements
  const tabInfo = await page.evaluate(() => {
    const results: Array<{ selector: string; text: string; count: number }> = [];

    // Try different selectors
    const selectors = [
      '[role="tab"]',
      '.tabItem',
      '.pageTab',
      '[class*="tab"]',
      '[class*="Tab"]',
      '[data-testid*="page"]',
      '[data-testid*="tab"]',
      'button[class*="page"]',
      '.navigationPane button',
      '[class*="navigation"] button',
      '[class*="Navigation"] button',
    ];

    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        const texts = [...els].map(e => e.textContent?.trim()).filter(Boolean);
        results.push({ selector: sel, text: texts.join(' | '), count: els.length });
      }
    }

    // Also find all iframes
    const iframes = document.querySelectorAll('iframe');
    results.push({ selector: 'iframe', text: `${iframes.length} iframes`, count: iframes.length });

    return results;
  });

  console.log("Tab elements found:");
  tabInfo.forEach(t => console.log(`  ${t.selector} (${t.count}): ${t.text}`));

  // The report might be inside an iframe
  const frames = page.frames();
  console.log(`\nFrames: ${frames.length}`);
  for (const frame of frames) {
    console.log(`  Frame: ${frame.url().substring(0, 100)}`);
  }

  // Try to find tabs inside the main frame or iframe
  for (const frame of frames) {
    const tabs = await frame.evaluate(() => {
      const tabElements = document.querySelectorAll('[role="tab"]');
      return [...tabElements].map(t => ({
        text: t.textContent?.trim(),
        ariaSelected: t.getAttribute('aria-selected'),
        tagName: t.tagName,
      }));
    }).catch(() => []);

    if (tabs.length > 0) {
      console.log(`\nFound ${tabs.length} tabs in frame ${frame.url().substring(0, 50)}:`);
      tabs.forEach(t => console.log(`  "${t.text}" selected=${t.ariaSelected} tag=${t.tagName}`));

      // Click each tab
      for (let i = 0; i < tabs.length; i++) {
        const tabName = tabs[i].text || `Tab ${i}`;
        const beforeCount = captured.length;

        await frame.evaluate((idx) => {
          const tabElements = document.querySelectorAll('[role="tab"]');
          if (tabElements[idx]) (tabElements[idx] as HTMLElement).click();
        }, i).catch(() => {});

        await sleep(4000);
        await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

        // Tag new captures
        for (let j = beforeCount; j < captured.length; j++) {
          captured[j].pageName = tabName;
        }

        const newCount = captured.length - beforeCount;
        console.log(`  Clicked "${tabName}": +${newCount} new captures (total: ${captured.length})`);

        // Screenshot
        const safeName = tabName.replace(/[^a-zA-Z0-9]/g, '_');
        await page.screenshot({ path: join(OUTPUT, `page_${String(i).padStart(2, "0")}_${safeName}.png`) });
      }
    }
  }

  // Save results
  console.log(`\nTotal unique captures: ${captured.length}`);
  const rawDir = join(OUTPUT, "raw");
  for (let i = 0; i < captured.length; i++) {
    writeFileSync(join(rawDir, `response_${String(i + 1).padStart(4, "0")}.txt`), captured[i].body);
  }

  // Check measures
  const measures = new Set<string>();
  for (const cap of captured) {
    try {
      const body = JSON.parse(cap.body);
      const desc = body.results?.[0]?.result?.data?.descriptor;
      if (desc?.Select) {
        for (const sel of desc.Select) {
          if (sel?.Kind === 2 && sel?.Name) measures.add(sel.Name);
        }
      }
    } catch {}
  }

  console.log(`\nUnique measures: ${measures.size}`);
  const TARGETS = ["_MedidasFernando.Ticket Médio Serviço Selecionado", "_MedidasGeral.Meta Leads Canal"];
  for (const t of TARGETS) {
    console.log(`  ${t}: ${measures.has(t) ? "✓" : "✗"}`);
  }

  await browser.close();
}

main().catch(console.error);
