import { expect, test, type Page } from '@playwright/test';
import { z } from 'zod';

// SEO – ТЗ страницы репетитора, раздел 6, и ТЗ главной, блок 8: canonical, Open Graph, JSON-LD,
// sitemap, robots.txt и OG-картинки. Адреса в разметке – боевые (`site.url`, ADR-055).

const SITE = 'https://puzzle-up.by';

// Разметка и файлы не зависят от устройства и JavaScript – хватает одного проекта.
test.skip(() => test.info().project.name !== 'chromium', 'Markup is the same in every project');

const JsonLdSchema = z.looseObject({ '@type': z.string() });
const FaqSchema = z.looseObject({ mainEntity: z.array(z.looseObject({ name: z.string() })) });

async function jsonLd(page: Page) {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return scripts.map((text) => JsonLdSchema.parse(JSON.parse(text)));
}

/** `og:image` указывает на боевой сайт – запрашиваем тот же путь у собранного приложения. */
async function expectOgImage(page: Page) {
  const content = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(content).toMatch(new RegExp(`^${SITE}/`));
  const url = new URL(content ?? '');
  const response = await page.request.get(url.pathname + url.search);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe('image/png');
}

test('robots.txt allows the site and points to the sitemap', async ({ request }) => {
  const text = await (await request.get('/robots.txt')).text();
  expect(text).toContain('Allow: /');
  expect(text).toContain('Disallow: /api/');
  expect(text).toContain(`Sitemap: ${SITE}/sitemap.xml`);
});

test('sitemap lists the home page, tutors and policies', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const path of ['/', '/tutors/andrei', '/tutors/maxim', '/privacy', '/cookies']) {
    expect(xml).toContain(`<loc>${SITE}${path}</loc>`);
  }
});

test('the home page has canonical, Open Graph and FAQPage markup', async ({ page }) => {
  await page.goto('/');

  // Корень Next пишет без слэша – для поисковиков это тот же адрес.
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /^Общий сайт независимых репетиторов/,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    await page.title(),
  );
  await expectOgImage(page);

  const [faq, ...rest] = await jsonLd(page);
  expect(rest).toEqual([]);
  expect(faq?.['@type']).toBe('FAQPage');
  const questions = await page.locator('#faq summary').allTextContents();
  const names = FaqSchema.parse(faq).mainEntity.map((item) => item.name);
  expect(names).toEqual(questions.map((question) => question.trim()));
});

test('a tutor page has canonical, Person and BreadcrumbList markup', async ({ page }) => {
  await page.goto('/tutors/andrei');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${SITE}/tutors/andrei`,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `${SITE}/tutors/andrei`,
  );
  await expectOgImage(page);

  const data = await jsonLd(page);
  expect(data.map((item) => item['@type'])).toEqual(['Person', 'BreadcrumbList']);
  expect(data[0]).toMatchObject({
    givenName: 'Андрей',
    jobTitle: 'Репетитор по математике',
    url: `${SITE}/tutors/andrei`,
  });
  expect(JSON.stringify(data)).not.toMatch(/Organization|worksFor|Review|Rating/);
});
