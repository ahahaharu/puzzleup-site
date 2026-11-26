import { readFileSync } from 'node:fs';

import { withContentCollections } from '@content-collections/next';
import type { NextConfig } from 'next';

import { resolveAnalytics, type AnalyticsData } from './src/lib/analytics';
import { contentSecurityPolicy } from './src/lib/csp';

// Счётчики – из content/site.json: страницы статические, адреса в CSP известны при сборке
// (ADR-056). Файл проверяет `content:check` перед `next build`.
const site: { analytics?: AnalyticsData } = JSON.parse(readFileSync('content/site.json', 'utf8'));

const csp = contentSecurityPolicy({
  analytics: resolveAnalytics(site.analytics),
  dev: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  output: 'standalone',
  poweredByHeader: false,
  // Остальные заголовки безопасности (HSTS и другие) ставит Caddy (docs/architecture.md, раздел 9).
  headers: async () => [
    { source: '/:path*', headers: [{ key: 'Content-Security-Policy', value: csp }] },
  ],
};

// Content Collections собирает `content/` перед `next build`, `next dev` (с отслеживанием) и `next typegen`.
export default withContentCollections(nextConfig);
