// Screenshot the /v2 homepage at three breakpoints into design/shots-v2/.
// Used by the design critique loop (see LOOP_LOG_V2.md).
//
//   node scripts/shots-v2.mjs            -> design/shots-v2/
//   ROUND=2 node scripts/shots-v2.mjs    -> design/shots-v2/round-2/
//   BASE=http://localhost:3000 ROUND=2 node scripts/shots-v2.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Use the browser already cached by Playwright (no download needed).
const CHROME = process.env.PW_CHROME ||
  join(process.env.HOME || '', '.cache/ms-playwright/chromium-1223/chrome-linux64/chrome');

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE || 'http://localhost:3000';
const ROUND = process.env.ROUND;
const OUT = join(__dirname, '..', 'design', 'shots-v2', ROUND ? `round-${ROUND}` : '');
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: '390', width: 390, height: 844, dsf: 2 },   // mobile
  { name: '768', width: 768, height: 1024, dsf: 2 },  // tablet
  { name: '1440', width: 1440, height: 900, dsf: 1 }, // desktop
];

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dsf,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/v2`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));

    // Scroll through the page so every IntersectionObserver reveal fires
    // (reveals are once-only, so they stay shown), then return to top.
    // Step-scroll down with a dwell at each stop so every scroll-reveal
    // IntersectionObserver fires and locks on (reveals are once-only), then a
    // pass of scrollIntoView as a belt-and-suspenders for any near-top element,
    // then back to the top.
    await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const vh = window.innerHeight;
      for (let y = 0; y <= document.body.scrollHeight; y += Math.round(vh * 0.5)) {
        window.scrollTo(0, y);
        await sleep(180);
      }
      for (const el of document.querySelectorAll('.v2-reveal')) {
        el.scrollIntoView({ block: 'center' });
        await sleep(160);
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(700); // settle + first cloud frame
    await page.screenshot({ path: join(OUT, `home-${vp.name}.png`), fullPage: true });

    // desktop: also capture the scrolled nav pill in its solid state
    if (vp.name === '1440') {
      await page.evaluate(() => window.scrollTo(0, 1100));
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(OUT, 'nav-scrolled-1440.png'), fullPage: false });
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    await ctx.close();
    console.log(`shot ${vp.name} done`);
  }
  console.log(`\nwrote screenshots to ${OUT}`);
} finally {
  await browser.close();
}
