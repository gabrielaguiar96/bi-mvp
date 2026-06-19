/**
 * Power BI Aggressive Data Extractor
 *
 * Opens a public Power BI report, navigates all pages,
 * exercises slicer combinations, captures all querydata responses.
 *
 * Usage: npx tsx scripts/pbi-extractor.mts [--output /tmp/pbi_capture3] [--max-combos 50]
 */

import { chromium, type Page, type Response } from "playwright";
import { mkdirSync, writeFileSync, readdirSync, copyFileSync } from "fs";
import { join } from "path";

const PBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTQ1YTc3YjItMmZjZS00MGQ1LTk5MmQtY2FlZDkwYjUxNjNjIiwidCI6ImJiNDZiYjk2LWFkZmQtNDkzMy05YjYxLTRkYTM0ZGU5YTY1NSJ9";

const WABI_PATTERN = "wabi-brazil-south-b-primary-api.analysis.windows.net";

interface CapturedResponse {
  id: number;
  url: string;
  method: string;
  status: number;
  body: string;
  timestamp: string;
  page: string;
  filterState: Record<string, string>;
  trigger: string; // "navigation" | "slicer" | "interaction"
}

interface SlicerInfo {
  label: string;
  queryRef: string;
  options: string[];
}

// --- Helpers ---

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForNetworkIdle(page: Page, timeout = 5000) {
  try {
    await page.waitForLoadState("networkidle", { timeout });
  } catch {
    // timeout is ok — we just want to wait for most requests
  }
}

async function getPageNames(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const tabs = document.querySelectorAll(
      '[role="tab"], .tabItem, .pageTab, button[data-testid*="page"]'
    );
    const names: string[] = [];
    tabs.forEach((t) => {
      const text = t.textContent?.trim();
      if (text && text.length > 0 && text.length < 50) names.push(text);
    });
    return [...new Set(names)];
  });
}

async function getCurrentPageName(page: Page): Promise<string> {
  return page.evaluate(() => {
    const active =
      document.querySelector('[role="tab"][aria-selected="true"]') ||
      document.querySelector(".tabItem.active") ||
      document.querySelector(".pageTab.active");
    return active?.textContent?.trim() || "unknown";
  });
}

async function getSlicerOptions(page: Page, slicerIndex: number): Promise<string[]> {
  return page.evaluate((idx) => {
    const slicers = document.querySelectorAll(
      '[data-testid*="slicer"], .slicerContainer, [aria-label*="slicer"], [aria-label*="Slicer"]'
    );
    const slicer = slicers[idx];
    if (!slicer) return [];
    const options: string[] = [];
    slicer.querySelectorAll('[role="option"], [role="checkbox"], .slicerItemContainer').forEach((el) => {
      const text = el.textContent?.trim();
      if (text) options.push(text);
    });
    return [...new Set(options)];
  }, slicerIndex);
}

async function clickSlicerOption(page: Page, optionText: string): Promise<boolean> {
  return page.evaluate((text) => {
    const elements = document.querySelectorAll(
      '[role="option"], [role="checkbox"], .slicerItemContainer, .slicerText'
    );
    for (const el of elements) {
      if (el.textContent?.trim().includes(text)) {
        (el as HTMLElement).click();
        return true;
      }
    }
    return false;
  }, optionText);
}

async function selectSlicerValue(page: Page, slicerLabel: string, value: string): Promise<boolean> {
  // Try clicking the slicer to open it, then select value
  const clicked = await page.evaluate(
    ({ label, val }) => {
      // Find slicer by aria-label or nearby text
      const slicers = document.querySelectorAll(
        '[data-testid*="slicer"], .slicerContainer, [class*="slicer"]'
      );
      for (const slicer of slicers) {
        const text = slicer.textContent || "";
        if (text.includes(label) || text.includes(val)) {
          // Try to find and click the specific value
          const options = slicer.querySelectorAll(
            '[role="option"], [role="checkbox"], .slicerItemContainer, .slicerCell, span'
          );
          for (const opt of options) {
            if (opt.textContent?.trim() === val) {
              (opt as HTMLElement).click();
              return true;
            }
          }
        }
      }
      return false;
    },
    { label: slicerLabel, val: value }
  );

  if (clicked) {
    await sleep(2000);
    await waitForNetworkIdle(page, 3000);
  }
  return clicked;
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const outputArg = args.indexOf("--output");
  const maxCombosArg = args.indexOf("--max-combos");
  const outputDir = outputArg >= 0 ? args[outputArg + 1] : "/tmp/pbi_capture3";
  const maxCombos = maxCombosArg >= 0 ? parseInt(args[maxCombosArg + 1], 10) : 30;

  mkdirSync(outputDir, { recursive: true });

  const captured: CapturedResponse[] = [];
  let captureId = 0;

  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: "pt-BR",
  });
  const page = await context.newPage();

  // Intercept all querydata and other relevant responses
  page.on("response", async (response: Response) => {
    const url = response.url();
    if (!url.includes(WABI_PATTERN)) return;

    const isQueryData = url.includes("querydata");
    const isConceptual = url.includes("conceptualschema");
    const isResource = url.includes("resourcePackage") || url.includes("resourcePack");
    const isRouting = url.includes("routing/cluster");

    if (!isQueryData && !isConceptual && !isResource && !isRouting) return;

    try {
      const body = await response.text();
      const currentPage = await getCurrentPageName(page).catch(() => "unknown");
      captureId++;

      captured.push({
        id: captureId,
        url,
        method: response.request().method(),
        status: response.status(),
        body,
        timestamp: new Date().toISOString(),
        page: currentPage,
        filterState: {},
        trigger: "navigation",
      });

      if (captureId % 10 === 0) {
        console.log(`  Captured ${captureId} responses...`);
      }
    } catch {
      // response may have been disposed
    }
  });

  console.log(`Opening report: ${PBI_URL}`);
  await page.goto(PBI_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(8000);
  await waitForNetworkIdle(page, 10000);

  // Take initial screenshot
  await page.screenshot({ path: join(outputDir, "page_00_initial.png"), fullPage: false });
  console.log("Report loaded. Starting page navigation...");

  // Get page tabs
  const pageNames = await getPageNames(page);
  console.log(`Found ${pageNames.length} page tabs:`, pageNames);

  // If no tabs found, try clicking through bottom page navigation
  const pagesToVisit = pageNames.length > 0 ? pageNames : ["Geral", "Simulado", "Funil", "Funil Indicação", "Nutrologia", "Pediatria", "Dermatologia", "Metas"];

  // Phase 1: Navigate all pages (default filters)
  console.log("\n=== Phase 1: Page Navigation ===");
  for (let i = 0; i < pagesToVisit.length; i++) {
    const pageName = pagesToVisit[i];
    console.log(`\nNavigating to page ${i + 1}/${pagesToVisit.length}: "${pageName}"`);

    const navigated = await page.evaluate((name) => {
      const tabs = document.querySelectorAll('[role="tab"], .tabItem, .pageTab, button');
      for (const tab of tabs) {
        if (tab.textContent?.trim() === name || tab.textContent?.trim().includes(name)) {
          (tab as HTMLElement).click();
          return true;
        }
      }
      // Try partial match
      for (const tab of tabs) {
        if (tab.textContent?.trim().includes(name.substring(0, 5))) {
          (tab as HTMLElement).click();
          return true;
        }
      }
      return false;
    }, pageName);

    if (!navigated) {
      console.log(`  Could not find tab "${pageName}", trying next/prev buttons...`);
      // Try arrow key navigation
      await page.keyboard.press("ArrowRight");
    }

    await sleep(3000);
    await waitForNetworkIdle(page, 5000);

    // Screenshot
    await page.screenshot({
      path: join(outputDir, `page_${String(i + 1).padStart(2, "0")}_${pageName.replace(/[^a-zA-Z0-9]/g, "_")}.png`),
      fullPage: false,
    });

    // Extract visible text
    const text = await page.evaluate(() => document.body.innerText);
    writeFileSync(
      join(outputDir, `page_${String(i + 1).padStart(2, "0")}_text.txt`),
      text.substring(0, 10000)
    );
  }

  // Phase 2: Exercise slicers on key pages
  console.log("\n=== Phase 2: Slicer Interaction ===");

  // Define slicer combinations to try
  // Key filters: Year, Month, Canal, Serviço
  const filterCombos: Array<{ page: string; filters: Record<string, string> }> = [];

  // Year filters (try on Geral page)
  for (const year of ["2025", "2026"]) {
    filterCombos.push({ page: "Geral", filters: { Ano: year } });
  }

  // Canal filters (try on Geral page)
  for (const canal of ["Retenção", "Ativo", "Orgânico", "Indicação", "Crossell", "Pago"]) {
    filterCombos.push({ page: "Geral", filters: { "Canal Leads": canal } });
  }

  // Serviço filters
  for (const servico of ["Nutrologia", "Pediatria", "Dermatologia"]) {
    filterCombos.push({ page: "Geral", filters: { Serviço: servico } });
  }

  // Per-professional pages with canal filters
  for (const prof of ["Nutrologia", "Pediatria", "Dermatologia"]) {
    for (const canal of ["Retenção", "Orgânico", "Ativo"]) {
      filterCombos.push({ page: prof, filters: { "Canal Leads": canal } });
    }
  }

  // Limit combos
  const limitedCombos = filterCombos.slice(0, maxCombos);
  console.log(`Will try ${limitedCombos.length} filter combinations`);

  for (let ci = 0; ci < limitedCombos.length; ci++) {
    const combo = limitedCombos[ci];
    console.log(`\nCombo ${ci + 1}/${limitedCombos.length}: ${combo.page} + ${JSON.stringify(combo.filters)}`);

    // Navigate to page
    await page.evaluate((name) => {
      const tabs = document.querySelectorAll('[role="tab"], .tabItem, .pageTab, button');
      for (const tab of tabs) {
        if (tab.textContent?.trim() === name || tab.textContent?.trim().includes(name)) {
          (tab as HTMLElement).click();
          return true;
        }
      }
      return false;
    }, combo.page);
    await sleep(2000);

    // Apply filters
    for (const [filterName, filterValue] of Object.entries(combo.filters)) {
      const applied = await selectSlicerValue(page, filterName, filterValue);
      if (!applied) {
        console.log(`  Could not apply filter: ${filterName}=${filterValue}`);
      }
    }

    await sleep(2000);
    await waitForNetworkIdle(page, 4000);

    // Tag captured responses with filter state
    const newCaptures = captured.filter((c) => c.trigger === "navigation" && !c.filterState.Ano);
    for (const c of newCaptures) {
      c.filterState = combo.filters;
      c.trigger = "slicer";
    }
  }

  // Phase 3: Try expanding/clicking visuals
  console.log("\n=== Phase 3: Visual Interaction ===");

  // Navigate back to key pages and try clicking on visuals
  for (const pageName of ["Geral", "Nutrologia", "Pediatria", "Dermatologia", "Metas"]) {
    await page.evaluate((name) => {
      const tabs = document.querySelectorAll('[role="tab"], .tabItem, .pageTab, button');
      for (const tab of tabs) {
        if (tab.textContent?.trim() === name || tab.textContent?.trim().includes(name)) {
          (tab as HTMLElement).click();
          return true;
        }
      }
      return false;
    }, pageName);
    await sleep(2000);

    // Try clicking on "expand" or "see more" buttons
    const expandButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll(
        'button[aria-label*="expand"], button[aria-label*="Expand"], button[aria-label*="more"], button[aria-label*="drill"], [data-testid*="expand"]'
      );
      return buttons.length;
    });

    if (expandButtons > 0) {
      console.log(`  Found ${expandButtons} expandable elements on "${pageName}"`);
      for (let bi = 0; bi < Math.min(expandButtons, 5); bi++) {
        await page.evaluate((idx) => {
          const buttons = document.querySelectorAll(
            'button[aria-label*="expand"], button[aria-label*="Expand"], button[aria-label*="more"], button[aria-label*="drill"]'
          );
          if (buttons[idx]) (buttons[idx] as HTMLElement).click();
        }, bi);
        await sleep(2000);
        await waitForNetworkIdle(page, 3000);
      }
    }
  }

  // Save all captured responses
  console.log(`\n=== Saving ${captured.length} captured responses ===`);

  // Save raw responses
  const rawDir = join(outputDir, "raw");
  mkdirSync(rawDir, { recursive: true });

  for (const cap of captured) {
    const filename = `response_${String(cap.id).padStart(4, "0")}_${cap.url.includes("querydata") ? "querydata" : "other"}.txt`;
    writeFileSync(join(rawDir, filename), cap.body);
  }

  // Save manifest
  const manifest = captured.map((c) => ({
    id: c.id,
    url: c.url,
    method: c.method,
    status: c.status,
    timestamp: c.timestamp,
    page: c.page,
    filterState: c.filterState,
    trigger: c.trigger,
    bodySize: c.body.length,
    bodyFile: `response_${String(c.id).padStart(4, "0")}_${c.url.includes("querydata") ? "querydata" : "other"}.txt`,
  }));
  writeFileSync(join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  // Count querydata vs other
  const queryDataCount = captured.filter((c) => c.url.includes("querydata")).length;
  const otherCount = captured.length - queryDataCount;

  console.log(`\n=== Extraction Complete ===`);
  console.log(`Total responses: ${captured.length}`);
  console.log(`QueryData: ${queryDataCount}`);
  console.log(`Other (schema, resources, etc.): ${otherCount}`);
  console.log(`Output: ${outputDir}`);

  await browser.close();
}

main().catch(console.error);
