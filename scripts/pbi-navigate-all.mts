/**
 * Navigate ALL pages using keyboard arrows and capture everything.
 * This is more reliable than clicking tabs.
 */

import { chromium, type Response } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const PBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTQ1YTc3YjItMmZjZS00MGQ1LTk5MmQtY2FlZDkwYjUxNjNjIiwidCI6ImJiNDZiYjk2LWFkZmQtNDkzMy05YjYxLTRkYTM0ZGU5YTY1NSJ9";
const WABI = "wabi-brazil-south-b-primary-api.analysis.windows.net";
const OUTPUT = "/tmp/pbi_capture_final";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  mkdirSync(join(OUTPUT, "raw"), { recursive: true });

  const captured: Array<{ url: string; body: string; page: number; trigger: string }> = [];
  const seenBodies = new Set<string>();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
  const page = await ctx.newPage();

  page.on("response", async (response: Response) => {
    const url = response.url();
    if (!url.includes(WABI) || !url.includes("querydata")) return;
    try {
      const body = await response.text();
      // Deduplicate by body hash
      const hash = body.substring(0, 200);
      if (seenBodies.has(hash)) return;
      seenBodies.add(hash);
      captured.push({ url, body, page: -1, trigger: "navigation" });
    } catch {}
  });

  console.log("Loading report...");
  await page.goto(PBI_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(12000);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  // Navigate through pages using ArrowRight key
  const pageNames = ["Geral", "Simulado", "Funil", "Funil Indicação", "Nutrologia", "Pediatria", "Dermatologia", "Metas", "Duplicata de Metas", "Página 1"];

  for (let i = 0; i < 12; i++) {
    const beforeCount = captured.length;

    // Get current page title from the page
    const pageTitle = await page.evaluate(() => {
      const el = document.querySelector('[aria-selected="true"], .active, [class*="active"]');
      return el?.textContent?.trim() || "unknown";
    });

    console.log(`\nPage ${i}: "${pageTitle}" (before: ${beforeCount} captures)`);

    // Wait for any pending requests
    await sleep(3000);
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

    // Tag captures with page number
    for (let j = beforeCount; j < captured.length; j++) {
      captured[j].page = i;
    }

    // Screenshot
    await page.screenshot({ path: join(OUTPUT, `page_${String(i).padStart(2, "0")}.png`) });

    // Extract text
    const text = await page.evaluate(() => {
      const main = document.querySelector('[role="main"], .reportContainer, #pvExplorationHost');
      return (main || document.body).innerText;
    });
    writeFileSync(join(OUTPUT, `page_${String(i).padStart(2, "0")}_text.txt`), text.substring(0, 10000));

    // Try to click expand/see more buttons
    const expandCount = await page.evaluate(() => {
      const btns = document.querySelectorAll(
        'button[aria-label*="expand"], button[aria-label*="Expand"], button[aria-label*="more"], button[aria-label*="See more"], [data-testid*="expand"]'
      );
      btns.forEach((b) => {
        try { (b as HTMLElement).click(); } catch {}
      });
      return btns.length;
    });
    if (expandCount > 0) {
      console.log(`  Clicked ${expandCount} expand buttons`);
      await sleep(2000);
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    }

    // Navigate to next page
    if (i < 11) {
      await page.keyboard.press("ArrowRight");
      await sleep(1500);
    }
  }

  // Now try clicking on slicer options on each page
  console.log("\n=== Trying slicer interactions ===");

  // Go back to first page
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("ArrowLeft");
    await sleep(500);
  }
  await sleep(2000);

  // Navigate to page 8 (Duplicata de Metas) — try 8 ArrowRight presses
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("ArrowRight");
    await sleep(800);
  }
  await sleep(3000);

  // Try to click on "Nutrologia" or "Dr Fernando" in any slicer
  const clickResult = await page.evaluate(() => {
    const results: string[] = [];
    // Find all text elements
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent?.trim();
      if (text === "Nutrologia" || text === "Dr Fernando" || text === "Fernando") {
        const parent = walker.currentNode.parentElement;
        if (parent) {
          parent.click();
          results.push("clicked: " + text);
          break;
        }
      }
    }
    // Also try clicking on "Pediatria", "Dermatologia"
    const allElements = document.querySelectorAll("span, div, p, label");
    for (const el of allElements) {
      const text = el.textContent?.trim();
      if (text === "Pediatria" || text === "Dermatologia") {
        (el as HTMLElement).click();
        results.push("clicked: " + text);
      }
    }
    return results;
  });
  console.log("Slicer interactions:", clickResult);

  await sleep(5000);
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

  // Save all unique captured responses
  console.log(`\nTotal unique captures: ${captured.length}`);

  const rawDir = join(OUTPUT, "raw");
  for (let i = 0; i < captured.length; i++) {
    writeFileSync(join(rawDir, `response_${String(i + 1).padStart(4, "0")}.txt`), captured[i].body);
  }

  // Decode and check for target measures
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

  console.log(`\nUnique measures captured: ${measures.size}`);
  const TARGETS = [
    "_MedidasFernando.Ticket Médio Serviço Selecionado",
    "_MedidasGeral.Meta Leads Canal",
  ];
  console.log("Target measures:");
  for (const t of TARGETS) {
    console.log(`  ${t}: ${measures.has(t) ? "✓ FOUND" : "✗ NOT FOUND"}`);
  }

  // List all captured measures
  console.log("\nAll measures:");
  [...measures].sort().forEach((m) => console.log(`  ${m}`));

  await browser.close();
}

main().catch(console.error);
