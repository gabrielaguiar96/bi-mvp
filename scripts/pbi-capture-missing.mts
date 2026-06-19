/**
 * Capture the 2 missing measures from page 8 (Duplicata de Metas).
 * These require interacting with the page to trigger the queries.
 */

import { chromium, type Page, type Response } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const PBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTQ1YTc3YjItMmZjZS00MGQ1LTk5MmQtY2FlZDkwYjUxNjNjIiwidCI6ImJiNDZiYjk2LWFkZmQtNDkzMy05YjYxLTRkYTM0ZGU5YTY1NSJ9";

const WABI = "wabi-brazil-south-b-primary-api.analysis.windows.net";
const OUTPUT = "/tmp/pbi_capture_missing";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  mkdirSync(OUTPUT, { recursive: true });

  const captured: Array<{ url: string; body: string; page: string; trigger: string }> = [];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "pt-BR" }).then((c) => c.newPage());

  // Intercept responses
  page.on("response", async (response: Response) => {
    const url = response.url();
    if (!url.includes(WABI) || !url.includes("querydata")) return;
    try {
      const body = await response.text();
      captured.push({ url, body, page: "unknown", trigger: "navigation" });
      console.log(`  Captured response #${captured.length}`);
    } catch {}
  });

  console.log("Loading report...");
  await page.goto(PBI_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(10000);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  console.log("Navigating to page 8 (Duplicata de Metas)...");

  // Try multiple selectors for page tabs
  const navigated = await page.evaluate(() => {
    // Method 1: role=tab
    const tabs = document.querySelectorAll('[role="tab"]');
    for (const tab of tabs) {
      if (tab.textContent?.includes("Duplicata") || tab.textContent?.includes("Metas")) {
        (tab as HTMLElement).click();
        return "tab: " + tab.textContent?.trim();
      }
    }
    // Method 2: any clickable element with page name
    const all = document.querySelectorAll("button, [role='button'], [tabindex]");
    for (const el of all) {
      if (el.textContent?.includes("Duplicata")) {
        (el as HTMLElement).click();
        return "button: " + el.textContent?.trim();
      }
    }
    // Method 3: keyboard navigation (right arrow)
    return "not found";
  });
  console.log("Navigation result:", navigated);

  await sleep(5000);
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

  // Take screenshot
  await page.screenshot({ path: join(OUTPUT, "page_08_duplicata.png") });

  // Try clicking on "Doutor(a)" slicer to select a professional
  console.log("Trying to interact with Doutor(a) slicer...");
  const slicerClicked = await page.evaluate(() => {
    const slicers = document.querySelectorAll('[data-testid*="slicer"], [class*="slicer"], [aria-label*="slicer"], [aria-label*="Doutor"]');
    for (const slicer of slicers) {
      const options = slicer.querySelectorAll('[role="option"], [role="checkbox"], span, div');
      for (const opt of options) {
        const text = opt.textContent?.trim();
        if (text && (text.includes("Fernando") || text.includes("Nutrologia"))) {
          (opt as HTMLElement).click();
          return "clicked: " + text;
        }
      }
    }
    // Try clicking anywhere that says "Fernando" or "Nutrologia"
    const allSpans = document.querySelectorAll("span, div, p");
    for (const el of allSpans) {
      const text = el.textContent?.trim();
      if (text === "Dr Fernando" || text === "Nutrologia" || text === "Fernando") {
        (el as HTMLElement).click();
        return "clicked span: " + text;
      }
    }
    return "not found";
  });
  console.log("Slicer result:", slicerClicked);

  await sleep(5000);
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

  // Try clicking on "Canal Leads" slicer
  console.log("Trying to interact with Canal Leads slicer...");
  const canalClicked = await page.evaluate(() => {
    const allSpans = document.querySelectorAll("span, div, p");
    for (const el of allSpans) {
      const text = el.textContent?.trim();
      if (text === "Retenção" || text === "Orgânico" || text === "Ativo") {
        (el as HTMLElement).click();
        return "clicked: " + text;
      }
    }
    return "not found";
  });
  console.log("Canal result:", canalClicked);

  await sleep(5000);
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

  // Navigate to page 9 (Página 1)
  console.log("\nNavigating to page 9 (Página 1)...");
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('[role="tab"]');
    for (const tab of tabs) {
      const text = tab.textContent?.trim();
      if (text === "Página 1" || text?.includes("Página")) {
        (tab as HTMLElement).click();
        return;
      }
    }
    // Try last tab
    const allTabs = [...tabs];
    if (allTabs.length > 0) (allTabs[allTabs.length - 1] as HTMLElement).click();
  });

  await sleep(5000);
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await page.screenshot({ path: join(OUTPUT, "page_09.png") });

  // Now navigate through ALL pages one more time to catch any missed queries
  console.log("\nSecond pass through all pages...");
  const pageNames = ["Geral", "Simulado", "Funil", "Funil Indicação", "Nutrologia", "Pediatria", "Dermatologia", "Metas", "Duplicata de Metas", "Página 1"];

  for (const pageName of pageNames) {
    const beforeCount = captured.length;

    await page.evaluate((name) => {
      const tabs = document.querySelectorAll('[role="tab"], button');
      for (const tab of tabs) {
        if (tab.textContent?.trim().includes(name) || tab.textContent?.trim() === name) {
          (tab as HTMLElement).click();
          return true;
        }
      }
      return false;
    }, pageName);

    await sleep(3000);
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

    // Click on any expand/see more buttons
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button[aria-label*="expand"], button[aria-label*="Expand"], button[aria-label*="more"], button[aria-label*="drill"], button[aria-label*="Show"]');
      btns.forEach((b) => {
        try { (b as HTMLElement).click(); } catch {}
      });
    });

    await sleep(2000);
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

    const newCount = captured.length - beforeCount;
    if (newCount > 0) {
      console.log(`  ${pageName}: +${newCount} new responses`);
    }
  }

  // Save all captured
  console.log(`\nTotal captured: ${captured.length}`);
  const rawDir = join(OUTPUT, "raw");
  mkdirSync(rawDir, { recursive: true });

  for (let i = 0; i < captured.length; i++) {
    writeFileSync(join(rawDir, `response_${String(i + 1).padStart(4, "0")}.txt`), captured[i].body);
  }

  // Check for new measures
  const newMeasures = new Set<string>();
  for (const cap of captured) {
    try {
      const body = JSON.parse(cap.body);
      const desc = body.results?.[0]?.result?.data?.descriptor;
      if (desc?.Select) {
        for (const sel of desc.Select) {
          if (sel?.Kind === 2 && sel?.Name) newMeasures.add(sel.Name);
        }
      }
    } catch {}
  }

  const TARGET = ["_MedidasFernando.Ticket Médio Serviço Selecionado", "_MedidasGeral.Meta Leads Canal"];
  console.log("\nTarget measures check:");
  for (const t of TARGET) {
    console.log(`  ${t}: ${newMeasures.has(t) ? "✓ FOUND" : "✗ NOT FOUND"}`);
  }

  await browser.close();
}

main().catch(console.error);
