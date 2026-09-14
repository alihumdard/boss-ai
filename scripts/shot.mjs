// Captures the dashboard at the two review viewports.
// Usage: node scripts/shot.mjs <label>   -> shots/<label>-1366.png, -1920.png
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const label = process.argv[2] ?? "shot";
const url = process.env.SHOT_URL ?? "http://localhost:3001";
const sizes = [
  { w: 1366, h: 650 },
  { w: 1920, h: 960 },
];

mkdirSync("shots", { recursive: true });

const browser = await chromium.launch();
for (const { w, h } of sizes) {
  const page = await browser.newPage({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
  });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  // Let the R3F canvas render a few frames and CSS animations settle.
  await page.waitForTimeout(3500);

  // Page scroll is a explicit acceptance criterion, so report it.
  const scroll = await page.evaluate(() => ({
    scrollH: document.documentElement.scrollHeight,
    clientH: document.documentElement.clientHeight,
  }));
  console.log(
    `${w}x${h}  scrollHeight=${scroll.scrollH} clientHeight=${scroll.clientH}` +
      (scroll.scrollH > scroll.clientH + 1 ? "  *** PAGE SCROLLS ***" : "  ok"),
  );

  await page.screenshot({ path: `shots/${label}-${w}.png` });

  // The orb alone, at the larger viewport. A full-page capture composites the
  // WebGL canvas unreliably in headless Chromium, so the orb can look blank
  // there even when it renders correctly — this is the honest view of it.
  if (w === 1920) {
    const canvas = page.locator("canvas").first();
    if (await canvas.count()) {
      // The orb animates continuously, so Playwright's "element is stable"
      // wait never settles — skip the check and tolerate a timeout.
      await canvas
        .screenshot({ path: `shots/${label}-orb.png`, animations: "allow" })
        .catch((e) => console.log(`  (orb capture skipped: ${e.name})`));
    }
  }

  await page.close();
}
await browser.close();
