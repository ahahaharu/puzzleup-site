// Скриншоты макета и реализации для design-reviewer.
// pnpm tsx scripts/design-shot.ts --mock D-5-tutors --url "/" --section tutors --width 1280
// Опции: --base http://localhost:3000 (или DESIGN_BASE_URL), --widths 360,768,1024,1440,
// --reduced-motion (эмуляция prefers-reduced-motion: reduce).
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { chromium, type Page } from '@playwright/test';

const { values } = parseArgs({
  options: {
    mock: { type: 'string' },
    url: { type: 'string' },
    section: { type: 'string' },
    width: { type: 'string', default: '1280' },
    widths: { type: 'string', default: '360,768,1024,1440' },
    base: { type: 'string', default: process.env.DESIGN_BASE_URL ?? 'http://localhost:3000' },
    'reduced-motion': { type: 'boolean', default: false },
  },
});

const root = process.cwd();
const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
const outDir = path.join(root, '.design-review', branch);
mkdirSync(outDir, { recursive: true });

const width = Number(values.width);
const extraWidths = values.widths
  .split(',')
  .map(Number)
  .filter((w) => w > 0 && w !== width);
const slug = (s: string) => s.replace(/[^a-z0-9-]+/gi, '_').replace(/^_|_$/g, '') || 'root';

const browser = await chromium.launch();

async function open(w: number) {
  const context = await browser.newContext({
    viewport: { width: w, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: values['reduced-motion'] ? 'reduce' : 'no-preference',
  });
  return context.newPage();
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.evaluate(() => document.fonts.ready);
}

if (values.mock) {
  const page = await open(width);
  const file = path.join(root, 'docs/design', `${values.mock}.html`);
  await page.goto(pathToFileURL(file).href);
  await settle(page);
  const out = path.join(outDir, `mock-${slug(values.mock)}-${width}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log(out);
  await page.context().close();
}

if (values.url) {
  for (const w of [width, ...extraWidths]) {
    const page = await open(w);
    const anchor = values.section ? `#${values.section}` : '';
    await page.goto(new URL(values.url + anchor, values.base).href);
    await settle(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    const name = `impl-${slug(values.url)}${values.section ? `-${values.section}` : ''}-${w}${values['reduced-motion'] ? '-rm' : ''}.png`;
    const out = path.join(outDir, name);
    if (values.section) {
      await page.locator(`section#${values.section}`).screenshot({ path: out });
    } else {
      await page.screenshot({ path: out, fullPage: true });
    }
    console.log(`${out}  horizontal overflow: ${overflow}px`);
    await page.context().close();
  }
}

await browser.close();
